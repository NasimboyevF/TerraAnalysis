// ============================================================
// utils/helpers.js — Вспомогательные функции
// ============================================================

/**
 * Возвращает цвет (Tailwind класс) по уровню деградации
 * Используется для бейджей и индикаторов
 */
export const getSeverityColor = (severity) => {
  const colors = {
    'низкий': {
      bg: 'bg-green-100 dark:bg-green-900/30',
      text: 'text-green-800 dark:text-green-300',
      border: 'border-green-200 dark:border-green-700',
      dot: 'bg-green-500',
    },
    'умеренный': {
      bg: 'bg-yellow-100 dark:bg-yellow-900/30',
      text: 'text-yellow-800 dark:text-yellow-300',
      border: 'border-yellow-200 dark:border-yellow-700',
      dot: 'bg-yellow-500',
    },
    'высокий': {
      bg: 'bg-orange-100 dark:bg-orange-900/30',
      text: 'text-orange-800 dark:text-orange-300',
      border: 'border-orange-200 dark:border-orange-700',
      dot: 'bg-orange-500',
    },
    'критический': {
      bg: 'bg-red-100 dark:bg-red-900/30',
      text: 'text-red-800 dark:text-red-300',
      border: 'border-red-200 dark:border-red-700',
      dot: 'bg-red-500',
    },
  }
  return colors[severity] || colors['умеренный']
}

/**
 * Цвет для прогресс-бара деградации (hex для Recharts)
 */
export const getSeverityHex = (score) => {
  if (score <= 25) return '#22c55e'   // зелёный
  if (score <= 50) return '#eab308'   // жёлтый
  if (score <= 75) return '#f97316'   // оранжевый
  return '#ef4444'                    // красный
}

/**
 * Форматирует дату в читаемый вид на русском
 */
export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/**
 * Форматирует дату и время
 */
export const formatDateTime = (dateString) => {
  return new Date(dateString).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Возвращает подпись для NDVI значения
 */
export const getNDVILabel = (ndvi) => {
  if (ndvi < 0) return 'Вода / снег'
  if (ndvi < 0.2) return 'Голая почва'
  if (ndvi < 0.4) return 'Разреженная растительность'
  if (ndvi < 0.6) return 'Умеренная растительность'
  return 'Густая растительность'
}

/**
 * Сокращает длинный текст с многоточием
 */
export const truncate = (text, maxLength = 80) => {
  if (!text || text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}
