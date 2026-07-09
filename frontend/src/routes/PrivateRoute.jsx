// ============================================================
// routes/PrivateRoute.jsx — Защищённый маршрут
//
// Оборачивает страницы которые требуют авторизации.
// Если пользователь не вошёл — перенаправляет на /login.
// Если вошёл — показывает дочерний компонент.
// ============================================================

import { Navigate, useLocation } from 'react-router-dom'
import useAuthStore from '../store/authStore'

const PrivateRoute = ({ children }) => {
  const { token } = useAuthStore()
  const location = useLocation()

  if (!token) {
    // Сохраняем URL куда хотел попасть пользователь
    // После логина перенаправим обратно
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}

export default PrivateRoute
