// ============================================================
// middleware/authMiddleware.js — Проверка JWT токена
//
// Защищает приватные роуты: если токен отсутствует или
// недействителен — запрос не пройдёт дальше.
//
// Как работает JWT:
// 1. При логине сервер создаёт токен и отдаёт его клиенту
// 2. Клиент сохраняет токен в localStorage
// 3. При каждом запросе клиент отправляет токен в заголовке:
//    Authorization: Bearer <токен>
// 4. Этот middleware проверяет токен и добавляет данные
//    пользователя в req.user для использования в контроллере
// ============================================================

const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const protect = async (req, res, next) => {
  let token;

  // Проверяем наличие заголовка Authorization с Bearer токеном
  // Формат: "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI..."
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Извлекаем сам токен (без слова "Bearer ")
      token = req.headers.authorization.split(' ')[1];

      // Верифицируем токен — проверяем подпись и срок действия
      // jwt.verify вернёт объект с данными которые мы записали при создании токена
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Находим пользователя в БД по id из токена
      // .select('-password') — исключаем поле пароля из результата
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ message: 'Пользователь не найден' });
      }

      // Всё в порядке — передаём управление дальше
      next();
    } catch (error) {
      console.error('Ошибка верификации токена:', error.message);
      return res.status(401).json({ message: 'Токен недействителен или истёк' });
    }
  }

  // Токен отсутствует в заголовке
  if (!token) {
    return res.status(401).json({ message: 'Нет доступа: токен не предоставлен' });
  }
};

// ============================================================
// adminOnly — используется ПОСЛЕ protect
// Пропускает дальше только если req.user.role === 'admin'
// Пример: router.get('/stats', protect, adminOnly, getStats)
// ============================================================
const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Доступ только для администраторов' });
  }
  next();
};

module.exports = { protect, adminOnly };
