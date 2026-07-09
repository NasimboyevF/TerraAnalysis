// ============================================================
// pages/LoginPage.jsx — Страница входа в систему
// ============================================================

import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import { Button, Input, Alert } from '../components/ui'

const LoginPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, isLoading } = useAuthStore()

  // Куда перенаправить после логина (если пришли с защищённой страницы)
  const redirectTo = location.state?.from?.pathname || '/dashboard'

  // Состояние формы
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')

  // Обновляем поле формы при вводе
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Убираем ошибку поля при изменении
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
  }

  // Валидация перед отправкой
  const validate = () => {
    const newErrors = {}
    if (!formData.email) newErrors.email = 'Введите email'
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Некорректный email'
    if (!formData.password) newErrors.password = 'Введите пароль'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitError('')

    if (!validate()) return

    const result = await login(formData.email, formData.password)

    if (result.success) {
      navigate(redirectTo, { replace: true })
    } else {
      setSubmitError(result.message)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Логотип */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🌱</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Мониторинг земли
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Система вычисления деградации
          </p>
        </div>

        {/* Карточка формы */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-5">
            Войти в систему
          </h2>

          {/* Ошибка с сервера */}
          <Alert
            type="error"
            message={submitError}
            onClose={() => setSubmitError('')}
          />

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4">
            <Input
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="example@mail.ru"
              error={errors.email}
              required
            />

            <Input
              label="Пароль"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Минимум 6 символов"
              error={errors.password}
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={isLoading}
              className="w-full mt-2"
            >
              {isLoading ? 'Вход...' : 'Войти'}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-5">
            Нет аккаунта?{' '}
            <Link
              to="/register"
              className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 font-medium"
            >
              Зарегистрироваться
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
