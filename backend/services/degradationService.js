// ============================================================
// services/degradationService.js — Бизнес-логика вычисления деградации
//
// Сервис — это слой бизнес-логики, отдельный от HTTP-контроллеров.
// Принцип: контроллер обрабатывает HTTP (запрос/ответ),
// сервис делает вычисления и работает с данными.
//
// ФОРМУЛА ДЕГРАДАЦИИ:
// Итоговый балл = взвешенная сумма нормализованных показателей
// где каждый показатель нормализован в диапазон 0–1
// (0 = идеальное состояние, 1 = максимальная деградация)
//
// Веса показателей:
//   NDVI (индекс вегетации)     → 35%
//   Индекс качества почвы       → 30%
//   Влажность почвы             → 20%
//   Органическое вещество       → 15%
// ============================================================

/**
 * Нормализует NDVI в показатель деградации (0–1)
 *
 * NDVI диапазон: [-1, 1]
 * Логика: чем выше NDVI, тем лучше состояние, тем ниже деградация
 *   NDVI = 1.0  → деградация = 0.00 (идеально, густая растительность)
 *   NDVI = 0.5  → деградация = 0.25
 *   NDVI = 0.0  → деградация = 0.50 (голая почва)
 *   NDVI = -1.0 → деградация = 1.00 (вода или критическое состояние)
 *
 * @param {number} ndvi — значение от -1 до 1
 * @returns {number} нормализованный балл от 0 до 1
 */
const normalizeNDVI = (ndvi) => {
  // Формула: (1 - ndvi) / 2
  // При ndvi=1:  (1-1)/2 = 0    — нет деградации
  // При ndvi=-1: (1-(-1))/2 = 1 — максимальная деградация
  return (1 - ndvi) / 2;
};

/**
 * Нормализует индекс качества почвы в показатель деградации (0–1)
 *
 * SQI диапазон: [0, 100]
 * Логика: инвертируем — высокий SQI = низкая деградация
 *   SQI = 100 → деградация = 0.00
 *   SQI = 50  → деградация = 0.50
 *   SQI = 0   → деградация = 1.00
 *
 * @param {number} sqi — значение от 0 до 100
 * @returns {number} нормализованный балл от 0 до 1
 */
const normalizeSoilQuality = (sqi) => {
  return (100 - sqi) / 100;
};

/**
 * Нормализует влажность почвы в показатель деградации (0–1)
 *
 * Оптимальный диапазон влажности: 20–40%
 * Логика: отклонение от нормы в любую сторону = деградация
 *   Влажность 20–40% → деградация ≈ 0 (норма)
 *   Влажность 0%     → деградация = 1 (засуха)
 *   Влажность 100%   → деградация = 1 (заболачивание)
 *
 * @param {number} moisture — значение от 0 до 100 (%)
 * @returns {number} нормализованный балл от 0 до 1
 */
const normalizeMoisture = (moisture) => {
  const OPTIMAL_MIN = 20; // Нижняя граница нормы
  const OPTIMAL_MAX = 40; // Верхняя граница нормы

  if (moisture >= OPTIMAL_MIN && moisture <= OPTIMAL_MAX) {
    // В норме — деградация минимальна
    // Внутри оптимального диапазона считаем небольшое отклонение от центра
    const center = (OPTIMAL_MIN + OPTIMAL_MAX) / 2; // = 30
    return Math.abs(moisture - center) / (OPTIMAL_MAX - center); // 0 в центре, 1 на краю
  } else if (moisture < OPTIMAL_MIN) {
    // Засуха: чем суше, тем хуже
    return (OPTIMAL_MIN - moisture) / OPTIMAL_MIN;
  } else {
    // Заболачивание: чем влажнее сверх нормы, тем хуже
    return Math.min((moisture - OPTIMAL_MAX) / (100 - OPTIMAL_MAX), 1);
  }
};

/**
 * Нормализует содержание органики в показатель деградации (0–1)
 *
 * Норма: 3–5%
 * Логика: мало органики = деградированная почва
 *   > 5%   → деградация = 0.00 (отлично)
 *   3–5%   → деградация = 0.10–0.25 (норма)
 *   1–3%   → деградация = 0.25–0.75 (тревожно)
 *   < 1%   → деградация = 0.75–1.00 (критично)
 *
 * @param {number} om — значение от 0 до 20 (%)
 * @returns {number} нормализованный балл от 0 до 1
 */
const normalizeOrganicMatter = (om) => {
  if (om >= 5) return 0;         // Отличное содержание органики
  if (om >= 3) return (5 - om) / (5 - 3) * 0.25;  // Норма: 0–0.25
  if (om >= 1) return 0.25 + (3 - om) / (3 - 1) * 0.50; // Тревожно: 0.25–0.75
  return 0.75 + (1 - om) * 0.25; // Критично: 0.75–1.0
};

/**
 * Определяет уровень серьёзности деградации по итоговому баллу
 *
 * @param {number} score — итоговый балл деградации (0–100)
 * @returns {string} уровень серьёзности
 */
const getSeverity = (score) => {
  if (score <= 25) return 'низкий';
  if (score <= 50) return 'умеренный';
  if (score <= 75) return 'высокий';
  return 'критический';
};

/**
 * Генерирует текстовую рекомендацию на основе показателей
 *
 * @param {object} sample — данные образца земли
 * @param {number} score — итоговый балл деградации
 * @returns {string} рекомендация агронома
 */
const generateRecommendation = (sample, score) => {
  const problems = [];

  // Анализируем каждый показатель и формируем список проблем
  if (sample.ndvi < 0.2) {
    problems.push('критически низкая растительность (NDVI < 0.2)');
  } else if (sample.ndvi < 0.4) {
    problems.push('недостаточная растительность (NDVI < 0.4)');
  }

  if (sample.soilMoisture < 10) {
    problems.push('сильная засуха (влажность < 10%)');
  } else if (sample.soilMoisture < 20) {
    problems.push('недостаточная влажность почвы');
  } else if (sample.soilMoisture > 70) {
    problems.push('переувлажнение почвы (риск заболачивания)');
  }

  if (sample.soilQualityIndex < 30) {
    problems.push('критически низкое качество почвы');
  } else if (sample.soilQualityIndex < 50) {
    problems.push('пониженное качество почвы');
  }

  if (sample.organicMatter < 1) {
    problems.push('критически низкое содержание органики');
  } else if (sample.organicMatter < 2) {
    problems.push('недостаточное содержание органического вещества');
  }

  // Формируем итоговую рекомендацию
  if (score <= 25) {
    return 'Состояние участка удовлетворительное. Рекомендуется продолжать мониторинг раз в квартал.';
  }

  if (problems.length === 0) {
    return 'Обнаружена деградация. Рекомендуется детальное обследование участка.';
  }

  const problemText = problems.join(', ');

  if (score <= 50) {
    return `Умеренная деградация. Выявлены проблемы: ${problemText}. Рекомендуется агротехнические мероприятия и повторный замер через 3 месяца.`;
  }

  if (score <= 75) {
    return `Высокая деградация. Выявлены проблемы: ${problemText}. Требуется срочное проведение восстановительных работ: внесение органики, мелиорация, посев покровных культур.`;
  }

  return `КРИТИЧЕСКАЯ деградация. Выявлены проблемы: ${problemText}. Участок требует немедленного вмешательства: рекультивация, консультация агронома, возможно временный вывод из оборота.`;
};

/**
 * Главная функция — вычисляет полный отчёт о деградации
 *
 * @param {object} sample — документ LandSample из MongoDB
 * @returns {object} объект с degradationScore, severity, breakdown, recommendation
 */
const calculateDegradation = (sample) => {
  // Шаг 1: Нормализуем каждый показатель в диапазон [0, 1]
  const ndviNorm = normalizeNDVI(sample.ndvi);
  const moistureNorm = normalizeMoisture(sample.soilMoisture);
  const soilQualityNorm = normalizeSoilQuality(sample.soilQualityIndex);
  const organicNorm = normalizeOrganicMatter(sample.organicMatter);

  // Шаг 2: Вычисляем взвешенную сумму с учётом весов каждого показателя
  const WEIGHTS = {
    ndvi: 0.35,         // 35% — основной индикатор состояния земли
    soilQuality: 0.30,  // 30% — качество самой почвы
    moisture: 0.20,     // 20% — водный баланс
    organicMatter: 0.15 // 15% — плодородие
  };

  const weightedScore =
    ndviNorm * WEIGHTS.ndvi +
    soilQualityNorm * WEIGHTS.soilQuality +
    moistureNorm * WEIGHTS.moisture +
    organicNorm * WEIGHTS.organicMatter;

  // Шаг 3: Переводим в диапазон 0–100 и округляем до 1 знака
  const degradationScore = Math.round(weightedScore * 100 * 10) / 10;

  // Шаг 4: Определяем уровень серьёзности
  const severity = getSeverity(degradationScore);

  // Шаг 5: Формируем детализацию (вклад каждого показателя в баллах)
  const breakdown = {
    ndviScore: Math.round(ndviNorm * WEIGHTS.ndvi * 100 * 10) / 10,
    moistureScore: Math.round(moistureNorm * WEIGHTS.moisture * 100 * 10) / 10,
    soilQualityScore: Math.round(soilQualityNorm * WEIGHTS.soilQuality * 100 * 10) / 10,
    organicMatterScore: Math.round(organicNorm * WEIGHTS.organicMatter * 100 * 10) / 10,
  };

  // Шаг 6: Генерируем рекомендацию
  const recommendation = generateRecommendation(sample, degradationScore);

  return {
    degradationScore,
    severity,
    breakdown,
    recommendation,
  };
};

module.exports = { calculateDegradation };
