// ============================================================
// components/ui/index.jsx — Переиспользуемые UI компоненты
//
// Кнопки, инпуты, карточки, бейджи — всё что используется
// на нескольких страницах вынесено сюда.
// Пишем один раз, используем везде.
// ============================================================

// ─────────────────────────────────────────
// КНОПКА
// ─────────────────────────────────────────
export const Button = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary',  // primary | secondary | danger | ghost
  size = 'md',          // sm | md | lg
  disabled = false,
  loading = false,
  className = '',
}) => {
  const base = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'

  const variants = {
    primary: 'bg-emerald-600 hover:bg-emerald-700 text-white focus:ring-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-600',
    secondary: 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 focus:ring-gray-400 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200 dark:border-gray-600',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
    ghost: 'hover:bg-gray-100 text-gray-600 dark:hover:bg-gray-800 dark:text-gray-300',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-5 py-2.5 text-base gap-2',
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  )
}

// ─────────────────────────────────────────
// ПОЛЕ ВВОДА
// ─────────────────────────────────────────
export const Input = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  required = false,
  min,
  max,
  step,
  className = '',
}) => {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label htmlFor={name} className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        min={min}
        max={max}
        step={step}
        className={`
          w-full px-3 py-2 rounded-lg border text-sm
          bg-white dark:bg-gray-800
          text-gray-900 dark:text-gray-100
          placeholder-gray-400 dark:placeholder-gray-500
          transition-colors duration-150
          focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent
          ${error
            ? 'border-red-400 dark:border-red-500'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          }
        `}
      />
      {error && (
        <p className="text-xs text-red-500 dark:text-red-400">{error}</p>
      )}
    </div>
  )
}

// ─────────────────────────────────────────
// КАРТОЧКА
// ─────────────────────────────────────────
export const Card = ({ children, className = '', onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`
        bg-white dark:bg-gray-900
        border border-gray-200 dark:border-gray-800
        rounded-xl shadow-sm
        ${onClick ? 'cursor-pointer hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700 transition-all duration-150' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  )
}

// ─────────────────────────────────────────
// БЕЙДЖ УРОВНЯ ДЕГРАДАЦИИ
// ─────────────────────────────────────────
export const SeverityBadge = ({ severity }) => {
  const styles = {
    'низкий': 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
    'умеренный': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
    'высокий': 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
    'критический': 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[severity] || styles['умеренный']}`}>
      {severity}
    </span>
  )
}

// ─────────────────────────────────────────
// СПИННЕР ЗАГРУЗКИ
// ─────────────────────────────────────────
export const Spinner = ({ size = 'md', className = '' }) => {
  const sizes = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' }
  return (
    <svg
      className={`animate-spin text-emerald-500 ${sizes[size]} ${className}`}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

// ─────────────────────────────────────────
// ЗАГЛУШКА ПРИ ПУСТОМ СПИСКЕ
// ─────────────────────────────────────────
export const EmptyState = ({ icon, title, description, action }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-xs">{description}</p>
      {action}
    </div>
  )
}

// ─────────────────────────────────────────
// АЛЕРТ (СООБЩЕНИЕ ОБ ОШИБКЕ / УСПЕХЕ)
// ─────────────────────────────────────────
export const Alert = ({ type = 'error', message, onClose }) => {
  if (!message) return null

  const styles = {
    error: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300',
    success: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300',
    info: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300',
  }

  return (
    <div className={`flex items-start gap-3 p-4 rounded-lg border text-sm ${styles[type]}`}>
      <span className="flex-1">{message}</span>
      {onClose && (
        <button onClick={onClose} className="opacity-60 hover:opacity-100 transition-opacity">✕</button>
      )}
    </div>
  )
}

// ─────────────────────────────────────────
// ПРОГРЕСС-БАР ДЕГРАДАЦИИ
// ─────────────────────────────────────────
export const DegradationBar = ({ score }) => {
  const getColor = (s) => {
    if (s <= 25) return 'bg-green-500'
    if (s <= 50) return 'bg-yellow-500'
    if (s <= 75) return 'bg-orange-500'
    return 'bg-red-500'
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${getColor(score)}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 min-w-[40px] text-right">
        {score}%
      </span>
    </div>
  )
}

// ─────────────────────────────────────────
// МОДАЛЬНОЕ ОКНО
// ─────────────────────────────────────────
export const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Затемнённый фон */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Содержимое модалки */}
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors text-xl"
          >
            ✕
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}
