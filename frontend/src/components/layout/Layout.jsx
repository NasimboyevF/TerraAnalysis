// ============================================================
// components/layout/Layout.jsx — Основная раскладка страниц
//
// Содержит шапку с навигацией, боковую панель (на десктопе)
// и область контента. Используется на всех защищённых страницах.
// ============================================================

import { NavLink, Link, useNavigate } from 'react-router-dom'
import useAuthStore from '../../store/authStore'

const Layout = ({ children }) => {
  const { user, logout, darkMode, toggleDarkMode } = useAuthStore()
  const navigate = useNavigate()
  const isAdmin = user?.role === 'admin'

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Элементы навигации
  const navItems = [
    { to: '/dashboard', label: 'Обзор', icon: '🌍' },
    { to: '/samples', label: 'Образцы', icon: '🧪' },
    { to: '/reports', label: 'Отчёты', icon: '📊' },
    { to: '/map', label: 'Карта', icon: '🗺️' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      {/* ─── ШАПКА ─── */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Логотип */}
          <div className="flex items-center gap-2">
            <span className="text-xl">🌱</span>
            <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
              Мониторинг земли
            </span>
          </div>

          {/* Навигация (десктоп) */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors duration-150 ` +
                  (isActive
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 font-medium'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800')
                }
              >
                <span>{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Правая часть шапки */}
          <div className="flex items-center gap-2">
            {/* Ссылка на админ-панель — только для админов */}
            {isAdmin && (
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `p-2 rounded-lg transition-colors ` +
                  (isActive
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800')
                }
                title="Админ-панель"
              >
                🛠️
              </NavLink>
            )}

            {/* Переключатель темы */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title={darkMode ? 'Светлая тема' : 'Тёмная тема'}
            >
              {darkMode ? '☀️' : '🌙'}
            </button>

            {/* Имя пользователя — ведёт в профиль */}
            <Link
              to="/profile"
              className="flex items-center gap-2 px-1.5 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Профиль"
            >
              <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <span className="hidden sm:block text-sm text-gray-700 dark:text-gray-300">
                {user?.name}
              </span>
            </Link>

            {/* Выход */}
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors"
              title="Выйти"
            >
              🚪
            </button>
          </div>
        </div>
      </header>

      {/* ─── МОБИЛЬНАЯ НАВИГАЦИЯ (снизу) ─── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-40">
        <div className="flex">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center py-2 gap-0.5 text-xs transition-colors ` +
                (isActive
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-gray-500 dark:text-gray-500')
              }
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* ─── ОСНОВНОЙ КОНТЕНТ ─── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 pb-20 md:pb-6">
        {children}
      </main>
    </div>
  )
}

export default Layout
