// ============================================================
// routes/AdminRoute.jsx — Маршрут только для администраторов
//
// Сначала проверяет то же что и PrivateRoute (авторизация),
// затем дополнительно проверяет user.role === 'admin'.
// Не-админа отправляет на /dashboard, а не на /login —
// у него уже есть доступ в приложение, просто не в этот раздел.
// ============================================================

import { Navigate, useLocation } from 'react-router-dom'
import useAuthStore from '../store/authStore'

const AdminRoute = ({ children }) => {
  const { token, user } = useAuthStore()
  const location = useLocation()

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

export default AdminRoute
