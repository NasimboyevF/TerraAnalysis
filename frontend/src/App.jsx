// ============================================================
// App.jsx — Корневой компонент приложения
//
// Определяет маршруты (роуты) приложения:
// - Публичные (login, register) — доступны всем
// - Защищённые (dashboard, samples, reports, map, profile) —
//   только для авторизованных пользователей
// - Admin-only (admin) — только для user.role === 'admin'
//
// Страницы подключены через React.lazy — код каждой страницы
// попадает в отдельный chunk и грузится только когда пользователь
// на неё переходит, а не весь сразу при первой загрузке.
//
// useEffect восстанавливает токен из localStorage при старте
// и подтягивает свежие данные пользователя (роль могла измениться,
// например если админ назначил роль через Telegram-бота)
// ============================================================

import { useEffect, Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore from './store/authStore'
import PrivateRoute from './routes/PrivateRoute'
import AdminRoute from './routes/AdminRoute'
import { fetchMe } from './api'
import { Spinner } from './components/ui'

// Страницы — лениво загружаемые чанки
const LoginPage = lazy(() => import('./pages/LoginPage'))
const RegisterPage = lazy(() => import('./pages/RegisterPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const SamplesPage = lazy(() => import('./pages/SamplesPage'))
const ReportsPage = lazy(() => import('./pages/ReportsPage'))
const MapPage = lazy(() => import('./pages/MapPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const AdminPage = lazy(() => import('./pages/AdminPage'))

// Полноэкранный спиннер — показывается пока грузится чанк страницы
const PageFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
    <Spinner size="lg" />
  </div>
)

const App = () => {
  const { token, initAuth, updateUser } = useAuthStore()

  // При первом рендере восстанавливаем сессию из localStorage:
  // устанавливаем Authorization заголовок в axios и применяем тему
  useEffect(() => {
    initAuth()
  }, [initAuth])

  // Подтягиваем актуальные данные пользователя (роль, telegram-привязка)
  // с сервера — они могли поменяться с прошлого визита (например,
  // роль admin выдана через /promote в боте)
  useEffect(() => {
    if (!token) return
    fetchMe()
      .then((freshUser) => updateUser(freshUser))
      .catch(() => {
        // Токен мог протухнуть — интерцептор axios сам разлогинит при 401,
        // здесь достаточно просто не падать
      })
  }, [token, updateUser])

  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        {/* Публичные маршруты */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Защищённые маршруты — PrivateRoute проверяет наличие токена */}
        <Route path="/dashboard" element={
          <PrivateRoute><DashboardPage /></PrivateRoute>
        } />
        <Route path="/samples" element={
          <PrivateRoute><SamplesPage /></PrivateRoute>
        } />
        <Route path="/reports" element={
          <PrivateRoute><ReportsPage /></PrivateRoute>
        } />
        <Route path="/map" element={
          <PrivateRoute><MapPage /></PrivateRoute>
        } />
        <Route path="/profile" element={
          <PrivateRoute><ProfilePage /></PrivateRoute>
        } />

        {/* Admin-only маршрут — AdminRoute дополнительно проверяет role */}
        <Route path="/admin" element={
          <AdminRoute><AdminPage /></AdminRoute>
        } />

        {/* Корень — редирект на дашборд */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Любой неизвестный путь — на дашборд */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  )
}

export default App
