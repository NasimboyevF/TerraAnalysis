// ============================================================
// pages/ProfilePage.jsx — Профиль пользователя
//
// Показывает роль, статус привязки Telegram-бота и дату регистрации.
// Позволяет отредактировать имя и email.
// ============================================================

import { useState } from 'react'
import useAuthStore from '../store/authStore'
import { updateProfile } from '../api'
import { Card, Button, Input, Alert } from '../components/ui'
import { formatDate } from '../utils/helpers'
import Layout from '../components/layout/Layout'

const ProfilePage = () => {
  const { user, updateUser } = useAuthStore()

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  })
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
    setSuccessMessage('')
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.name.trim()) newErrors.name = 'Введите имя'
    if (!formData.email) {
      newErrors.email = 'Введите email'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Некорректный email'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitError('')
    setSuccessMessage('')
    if (!validate()) return

    setIsSaving(true)
    try {
      const updated = await updateProfile({
        name: formData.name.trim(),
        email: formData.email.trim(),
      })
      // Обновляем имя/email в сторе, не трогая остальные поля (роль, telegram)
      updateUser({ name: updated.name, email: updated.email })
      setSuccessMessage('Профиль обновлён')
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Не удалось сохранить изменения')
    } finally {
      setIsSaving(false)
    }
  }

  const isAdmin = user?.role === 'admin'
  const isTelegramLinked = Boolean(user?.telegramUsername)

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Профиль</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Личные данные и статус аккаунта
          </p>
        </div>

        {/* ─── Статусные карточки ─── */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">Роль</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-1 flex items-center gap-1.5">
              {isAdmin ? '🛡️ Администратор' : '👤 Пользователь'}
            </p>
          </Card>

          <Card className="p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">Telegram-бот</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-1">
              {isTelegramLinked ? (
                <span className="text-emerald-600 dark:text-emerald-400">🔗 @{user.telegramUsername}</span>
              ) : (
                <span className="text-gray-400 dark:text-gray-500 text-sm">не привязан</span>
              )}
            </p>
          </Card>
        </div>

        {!isTelegramLinked && (
          <Alert
            type="info"
            message={
              <>
                Привяжи аккаунт к нашему Telegram-боту, чтобы получать уведомления о новых
                отчётах и управлять образцами прямо из чата: найди бота и отправь команду
                {' '}<code className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40">/link {user?.email} твой_пароль</code>.
              </>
            }
          />
        )}

        {/* ─── Форма редактирования ─── */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-5">
            Личные данные
          </h2>

          {submitError && (
            <div className="mb-4">
              <Alert type="error" message={submitError} onClose={() => setSubmitError('')} />
            </div>
          )}
          {successMessage && (
            <div className="mb-4">
              <Alert type="success" message={successMessage} onClose={() => setSuccessMessage('')} />
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Имя"
              name="name"
              value={formData.name}
              onChange={handleChange}
              error={errors.name}
              required
            />
            <Input
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              required
            />

            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Дата регистрации: {user?.createdAt ? formatDate(user.createdAt) : '—'}
              </p>
              <Button type="submit" variant="primary" loading={isSaving}>
                Сохранить изменения
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </Layout>
  )
}

export default ProfilePage
