// ============================================================
// pages/AdminPage.jsx — Admin Dashboard
//
// Доступна только пользователям с role === 'admin' (см. routes/AdminRoute.jsx).
// Показывает общую статистику системы и таблицу пользователей
// с возможностью назначить/снять роль администратора.
// ============================================================

import { useState, useEffect, useCallback } from 'react'
import useAuthStore from '../store/authStore'
import { fetchAdminStats, fetchAdminUsers, updateUserRole } from '../api'
import { Card, Button, Spinner, Alert, SeverityBadge } from '../components/ui'
import { formatDate } from '../utils/helpers'
import Layout from '../components/layout/Layout'

const AdminPage = () => {
  const { user: currentUser } = useAuthStore()

  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [pendingUserId, setPendingUserId] = useState(null)

  const loadData = useCallback(async (targetPage = 1) => {
    try {
      setIsLoading(true)
      setError('')
      const [statsData, usersData] = await Promise.all([
        fetchAdminStats(),
        fetchAdminUsers(targetPage, 8),
      ])
      setStats(statsData)
      setUsers(usersData.users)
      setTotalPages(usersData.totalPages)
      setPage(usersData.page)
    } catch (err) {
      setError(err.response?.data?.message || 'Не удалось загрузить данные админ-панели')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData(1)
  }, [loadData])

  const handleToggleRole = async (targetUser) => {
    const nextRole = targetUser.role === 'admin' ? 'user' : 'admin'
    setActionError('')
    setPendingUserId(targetUser.id)
    try {
      await updateUserRole(targetUser.id, nextRole)
      setUsers((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, role: nextRole } : u))
      )
      // Обновляем счётчик админов в статистике без перезапроса всего
      setStats((prev) =>
        prev
          ? { ...prev, adminsCount: prev.adminsCount + (nextRole === 'admin' ? 1 : -1) }
          : prev
      )
    } catch (err) {
      setActionError(err.response?.data?.message || 'Не удалось изменить роль')
    } finally {
      setPendingUserId(null)
    }
  }

  if (isLoading && !stats) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <Spinner size="lg" />
        </div>
      </Layout>
    )
  }

  const severityLabels = {
    'низкий': 'Низкий',
    'умеренный': 'Умеренный',
    'высокий': 'Высокий',
    'критический': 'Критический',
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Админ-панель 🛠️
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Статистика системы и управление пользователями
          </p>
        </div>

        {error && <Alert type="error" message={error} onClose={() => setError('')} />}

        {/* ─── Карточки статистики ─── */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400">Пользователей</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{stats.usersCount}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400">Админов</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{stats.adminsCount}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400">Образцов</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{stats.samplesCount}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400">Отчётов</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{stats.reportsCount}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400">🔗 Telegram</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{stats.telegramLinkedCount}</p>
            </Card>
          </div>
        )}

        {/* ─── Разбивка отчётов по уровню деградации ─── */}
        {stats && Object.keys(stats.severityBreakdown || {}).length > 0 && (
          <Card className="p-5">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Отчёты по уровню деградации
            </h2>
            <div className="flex flex-wrap gap-3">
              {Object.entries(stats.severityBreakdown).map(([severity, count]) => (
                <div key={severity} className="flex items-center gap-2">
                  <SeverityBadge severity={severity} />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {severityLabels[severity] || severity}: <b>{count}</b>
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* ─── Таблица пользователей ─── */}
        <Card className="overflow-hidden">
          <div className="p-5 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Пользователи</h2>
            <span className="text-xs text-gray-400">стр. {page}/{totalPages}</span>
          </div>

          {actionError && (
            <div className="p-4">
              <Alert type="error" message={actionError} onClose={() => setActionError('')} />
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
                  <th className="px-5 py-3 font-medium">Имя</th>
                  <th className="px-5 py-3 font-medium">Email</th>
                  <th className="px-5 py-3 font-medium">Роль</th>
                  <th className="px-5 py-3 font-medium">Telegram</th>
                  <th className="px-5 py-3 font-medium">Регистрация</th>
                  <th className="px-5 py-3 font-medium text-right">Действие</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {users.map((u) => (
                  <tr key={u.id} className="text-gray-700 dark:text-gray-300">
                    <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100">{u.name}</td>
                    <td className="px-5 py-3">{u.email}</td>
                    <td className="px-5 py-3">
                      {u.role === 'admin' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                          🛡️ admin
                        </span>
                      ) : (
                        <span className="text-xs text-gray-500 dark:text-gray-400">user</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {u.telegramUsername ? `@${u.telegramUsername}` : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-400">{formatDate(u.createdAt)}</td>
                    <td className="px-5 py-3 text-right">
                      <Button
                        variant={u.role === 'admin' ? 'secondary' : 'primary'}
                        size="sm"
                        loading={pendingUserId === u.id}
                        disabled={u.id === currentUser?.id && u.role === 'admin'}
                        onClick={() => handleToggleRole(u)}
                      >
                        {u.role === 'admin' ? 'Снять админа' : 'Сделать админом'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ─── Пагинация ─── */}
          {totalPages > 1 && (
            <div className="p-4 flex justify-center gap-2 border-t border-gray-200 dark:border-gray-800">
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => loadData(page - 1)}
              >
                ⬅️ Назад
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => loadData(page + 1)}
              >
                Вперёд ➡️
              </Button>
            </div>
          )}
        </Card>
      </div>
    </Layout>
  )
}

export default AdminPage
