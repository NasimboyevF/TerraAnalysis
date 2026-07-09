// ============================================================
// controllers/adminController.js — Данные для Admin Dashboard
//
// Те же цифры что показывает боту команда /stats и /users,
// только в виде JSON для фронтенда.
// Все роуты защищены protect + adminOnly (см. routes/adminRoutes.js)
// ============================================================

const User = require('../models/userModel');
const LandSample = require('../models/landSampleModel');
const Report = require('../models/reportModel');

/**
 * GET /api/admin/stats — Общая статистика системы
 */
const getStats = async (req, res) => {
  try {
    const [usersCount, adminsCount, samplesCount, reportsCount, telegramLinkedCount] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'admin' }),
      LandSample.countDocuments(),
      Report.countDocuments(),
      User.countDocuments({ telegramId: { $ne: null } }),
    ]);

    const bySeverity = await Report.aggregate([
      { $group: { _id: '$severity', count: { $sum: 1 } } },
    ]);

    // Приводим агрегацию к удобному объекту { низкий: 3, умеренный: 5, ... }
    const severityBreakdown = bySeverity.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    res.json({
      usersCount,
      adminsCount,
      samplesCount,
      reportsCount,
      telegramLinkedCount,
      severityBreakdown,
    });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при получении статистики: ' + error.message });
  }
};

/**
 * GET /api/admin/users?page=1&limit=10 — Список пользователей с пагинацией
 */
const getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;

    const total = await User.countDocuments();
    const users = await User.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      users: users.map((u) => ({
        id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        telegramUsername: u.telegramUsername || null,
        createdAt: u.createdAt,
      })),
      total,
      page,
      totalPages: Math.max(Math.ceil(total / limit), 1),
    });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при получении пользователей: ' + error.message });
  }
};

/**
 * PUT /api/admin/users/:id/role — Назначить/снять роль администратора
 * Тело запроса: { role: 'admin' | 'user' }
 */
const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Роль должна быть "user" или "admin"' });
    }

    // Защита от случайного самопонижения последнего админа
    if (String(req.params.id) === String(req.user._id) && role === 'user') {
      return res.status(400).json({ message: 'Нельзя снять роль администратора с самого себя' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    user.role = role;
    await user.save();

    res.json({
      message: `Роль обновлена: ${user.name} теперь ${role === 'admin' ? 'администратор' : 'пользователь'}`,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при обновлении роли: ' + error.message });
  }
};

module.exports = { getStats, getUsers, updateUserRole };
