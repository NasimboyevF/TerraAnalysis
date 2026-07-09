// ============================================================
// controllers/reportController.js — CRUD для отчётов о деградации
//
// При создании отчёта автоматически вызывается degradationService
// для вычисления итогового балла деградации.
// ============================================================

const Report = require('../models/reportModel');
const LandSample = require('../models/landSampleModel');
const { calculateDegradation } = require('../services/degradationService');
const { notifyUser, notifyAdmins } = require('../bot/notify');

/**
 * GET /api/reports — Получить все отчёты текущего пользователя
 * Поддерживает пагинацию: ?page=1&limit=10
 * Опционально: ?sampleId=... для фильтра по образцу
 */
const getReports = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Фильтр: всегда только отчёты этого пользователя
    const filter = { userId: req.user._id };

    // Дополнительный фильтр по образцу если передан в query
    if (req.query.sampleId) {
      filter.sampleId = req.query.sampleId;
    }

    const total = await Report.countDocuments(filter);

    // populate('sampleId') — подтягивает данные связанного образца
    // вместо просто ObjectId мы получим полный объект LandSample
    const reports = await Report.find(filter)
      .populate('sampleId', 'title coordinates sampledAt') // только нужные поля
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      reports,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка получения отчётов: ' + error.message });
  }
};

/**
 * GET /api/reports/:id — Получить один отчёт по ID
 */
const getReportById = async (req, res) => {
  try {
    const report = await Report.findOne({
      _id: req.params.id,
      userId: req.user._id,
    }).populate('sampleId'); // Подтягиваем все данные образца

    if (!report) {
      return res.status(404).json({ message: 'Отчёт не найден' });
    }

    res.json({ report });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка получения отчёта: ' + error.message });
  }
};

/**
 * POST /api/reports — Создать отчёт по образцу
 * Тело запроса: { sampleId }
 *
 * Процесс:
 * 1. Находим образец по sampleId
 * 2. Передаём данные образца в degradationService
 * 3. Сохраняем результат вычисления как новый Report
 */
const createReport = async (req, res) => {
  try {
    const { sampleId } = req.body;

    if (!sampleId) {
      return res.status(400).json({ message: 'Укажите ID образца (sampleId)' });
    }

    // Находим образец и проверяем что он принадлежит этому пользователю
    const sample = await LandSample.findOne({
      _id: sampleId,
      userId: req.user._id,
    });

    if (!sample) {
      return res.status(404).json({ message: 'Образец не найден' });
    }

    // Запускаем вычисление деградации через сервис
    const degradationResult = calculateDegradation(sample);

    console.log(
      `🔬 Вычислена деградация для "${sample.title}": ` +
      `балл ${degradationResult.degradationScore}, ` +
      `уровень: ${degradationResult.severity}`
    );

    // Сохраняем отчёт в MongoDB
    const report = await Report.create({
      userId: req.user._id,
      sampleId: sample._id,
      ...degradationResult, // degradationScore, severity, breakdown, recommendation
    });

    // Возвращаем отчёт с подтянутыми данными образца
    await report.populate('sampleId', 'title coordinates sampledAt');

    // Уведомляем владельца в Telegram (если привязан аккаунт)
    notifyUser(
      req.user._id,
      `📄 Новый отчёт по "${sample.title}"\nБалл деградации: *${degradationResult.degradationScore}* (${degradationResult.severity})`
    );

    // Критическая деградация — дополнительно уведомляем всех админов
    if (degradationResult.severity === 'критический') {
      notifyAdmins(
        `🔴 *Критическая деградация!*\nУчасток: ${sample.title}\nПользователь: ${req.user.email}\nБалл: ${degradationResult.degradationScore}`
      );
    }

    res.status(201).json({
      message: 'Отчёт успешно создан',
      report,
    });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка создания отчёта: ' + error.message });
  }
};

/**
 * DELETE /api/reports/:id — Удалить отчёт
 */
const deleteReport = async (req, res) => {
  try {
    const report = await Report.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!report) {
      return res.status(404).json({ message: 'Отчёт не найден' });
    }

    res.json({ message: 'Отчёт успешно удалён' });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка удаления отчёта: ' + error.message });
  }
};

module.exports = { getReports, getReportById, createReport, deleteReport };
