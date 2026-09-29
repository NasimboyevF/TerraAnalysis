// ============================================================
// models/reportModel.js — Схема отчёта о деградации
//
// Отчёт создаётся на основе образца земли (LandSample).
// Содержит итоговый индекс деградации, уровень серьёзности
// и детальную разбивку по каждому показателю.
// ============================================================

const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    // Ссылка на пользователя — владельца отчёта
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Не указан владелец отчёта'],
    },

    // Ссылка на образец земли по которому построен отчёт
    sampleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LandSample',
      required: [true, 'Не указан образец земли'],
    },

    // Итоговый индекс деградации (0–100)
    // 0   = земля в отличном состоянии
    // 100 = максимальная деградация
    degradationScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },

    // Уровень серьёзности деградации — текстовое описание для UI
    // Определяется автоматически по degradationScore в сервисе
    severity: {
      type: String,
      enum: ['низкий', 'умеренный', 'высокий', 'критический'],
      required: true,
    },

    // Детализация вклада каждого показателя в итоговый балл
    // Позволяет понять какой именно фактор больше всего влияет на деградацию
    breakdown: {
      // Вклад NDVI (35% веса)
      ndviScore: {
        type: Number,
        required: true,
        comment: 'Нормализованный вклад NDVI в итоговый балл (0–35)',
      },
      // Вклад влажности почвы (20% веса)
      moistureScore: {
        type: Number,
        required: true,
        comment: 'Нормализованный вклад влажности (0–20)',
      },
      // Вклад индекса качества почвы (30% веса)
      soilQualityScore: {
        type: Number,
        required: true,
        comment: 'Нормализованный вклад качества почвы (0–30)',
      },
      // Вклад органического вещества (15% веса)
      organicMatterScore: {
        type: Number,
        required: true,
        comment: 'Нормализованный вклад органики (0–15)',
      },
    },

    // Текстовый вывод с рекомендациями (генерируется в сервисе)
    recommendation: {
      type: String,
      maxlength: [1000, 'Рекомендация слишком длинная'],
    },
  },
  {
    timestamps: true,
  }
);

// Индекс для быстрого поиска отчётов пользователя
reportSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Report', reportSchema);
