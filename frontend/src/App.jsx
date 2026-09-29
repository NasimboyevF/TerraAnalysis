// ============================================================
// App.jsx — Корневой компонент приложения
//
// Определяет маршруты (роуты) приложения:
// - Публичные (login, register) — доступны всем
// - Защищённые (dashboard, samples, reports, map) —
//   только для авторизованных пользователей
//
// useEffect восстанавливает токен из localStorage при старте
// ============================================================

import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore from './store/authStore'
import PrivateRoute from './routes/PrivateRoute'

// Страницы
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import SamplesPage from './pages/SamplesPage'
import ReportsPage from './pages/ReportsPage'
import MapPage from './pages/MapPage'

const App = () => {
  const { initAuth } = useAuthStore()

  // При первом рендере восстанавливаем сессию из localStorage:
  // устанавливаем Authorization заголовок в axios и применяем тему
  useEffect(() => {
    initAuth()
  }, [initAuth])

  return (
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

      {/* Корень — редирект на дашборд */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Любой неизвестный путь — на дашборд */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default App
