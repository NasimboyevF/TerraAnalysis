// ============================================================
// controllers/sampleController.js — CRUD для образцов земли
//
// Все маршруты защищены через authMiddleware (require login).
// Пользователь видит только СВОИ образцы — фильтр по userId.
// ============================================================

const LandSample = require('../models/landSampleModel');

/**
 * GET /api/samples — Получить все образцы текущего пользователя
 * Поддерживает пагинацию: ?page=1&limit=10
 */
const getSamples = async (req, res) => {
  try {
    // Читаем параметры пагинации из строки запроса (?page=1&limit=10)
    // parseInt с резервным значением если параметр не передан
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    // skip — сколько документов пропустить (для второй страницы пропускаем первые 10)
    const skip = (page - 1) * limit;

    // Считаем общее количество образцов этого пользователя (для UI пагинации)
    const total = await LandSample.countDocuments({ userId: req.user._id });

    // Получаем образцы с пагинацией, сортируем по дате создания (новые первые)
    const samples = await LandSample.find({ userId: req.user._id })
      .sort({ createdAt: -1 }) // -1 = убывающий порядок (новые сначала)
      .skip(skip)
      .limit(limit);

    res.json({
      samples,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка получения образцов: ' + error.message });
  }
};

/**
 * GET /api/samples/:id — Получить один образец по ID
 */
const getSampleById = async (req, res) => {
  try {
    const sample = await LandSample.findOne({
      _id: req.params.id,
      userId: req.user._id, // Обязательно фильтруем по userId — нельзя смотреть чужие
    });

    if (!sample) {
      return res.status(404).json({ message: 'Образец не найден' });
    }

    res.json({ sample });
  } catch (error) {
    // Если передан невалидный MongoDB ObjectId — ловим специфичную ошибку
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Неверный формат ID' });
    }
    res.status(500).json({ message: 'Ошибка получения образца: ' + error.message });
  }
};

/**
 * POST /api/samples — Создать новый образец
 * Тело: { title, description, coordinates, ndvi, soilMoisture, soilQualityIndex, organicMatter, sampledAt }
 */
const createSample = async (req, res) => {
  try {
    const {
      title,
      description,
      coordinates,
      ndvi,
      soilMoisture,
      soilQualityIndex,
      organicMatter,
      sampledAt,
    } = req.body;

    // Создаём образец — userId берём из токена (req.user._id)
    // Это безопасно: клиент не может подделать чужой userId
    const sample = await LandSample.create({
      userId: req.user._id,
      title,
      description,
      coordinates,
      ndvi,
      soilMoisture,
      soilQualityIndex,
      organicMatter,
      sampledAt: sampledAt || Date.now(),
    });

    console.log(`✅ Создан новый образец: "${title}" (пользователь: ${req.user.email})`);

    res.status(201).json({
      message: 'Образец успешно добавлен',
      sample,
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ message: messages.join('. ') });
    }
    res.status(500).json({ message: 'Ошибка создания образца: ' + error.message });
  }
};

/**
 * PUT /api/samples/:id — Обновить образец
 * Можно обновлять частично — только те поля которые переданы
 */
const updateSample = async (req, res) => {
  try {
    // findOneAndUpdate:
    // - первый аргумент: фильтр (id + userId для безопасности)
    // - второй аргумент: данные для обновления
    // - { new: true } — вернуть обновлённый документ, а не старый
    // - { runValidators: true } — применить валидацию схемы к новым данным
    const sample = await LandSample.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { $set: req.body }, // $set обновляет только переданные поля, не трогая остальные
      { new: true, runValidators: true }
    );

    if (!sample) {
      return res.status(404).json({ message: 'Образец не найден или нет прав на редактирование' });
    }

    res.json({
      message: 'Образец успешно обновлён',
      sample,
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ message: messages.join('. ') });
    }
    res.status(500).json({ message: 'Ошибка обновления образца: ' + error.message });
  }
};

/**
 * DELETE /api/samples/:id — Удалить образец
 */
const deleteSample = async (req, res) => {
  try {
    const sample = await LandSample.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!sample) {
      return res.status(404).json({ message: 'Образец не найден или нет прав на удаление' });
    }

    console.log(`🗑️ Удалён образец: "${sample.title}"`);

    res.json({ message: 'Образец успешно удалён' });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка удаления образца: ' + error.message });
  }
};

module.exports = { getSamples, getSampleById, createSample, updateSample, deleteSample };
