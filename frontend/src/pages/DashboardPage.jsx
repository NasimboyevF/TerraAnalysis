// ============================================================
// pages/DashboardPage.jsx — Главная страница: статистика и обзор
// ============================================================

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { fetchSamples } from '../api'
import { fetchReports } from '../api'
import useAuthStore from '../store/authStore'
import { Card, Spinner, SeverityBadge, DegradationBar } from '../components/ui'
import { formatDate, getSeverityHex } from '../utils/helpers'
import Layout from '../components/layout/Layout'

const DashboardPage = () => {
  const { user } = useAuthStore()
  const [samples, setSamples] = useState([])
  const [reports, setReports] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        // Загружаем последние образцы и отчёты параллельно
        const [samplesData, reportsData] = await Promise.all([
          fetchSamples(1, 5),
          fetchReports(1, 5),
        ])
        setSamples(samplesData.samples)
        setReports(reportsData.reports)
      } catch (err) {
        setError('Ошибка загрузки данных')
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  // Данные для графика — распределение образцов по уровням деградации
  const severityStats = reports.reduce(
    (acc, report) => {
      const key = report.severity
      acc[key] = (acc[key] || 0) + 1
      return acc
    },
    {}
  )

  const chartData = [
    { name: 'Низкий', value: severityStats['низкий'] || 0, color: '#22c55e' },
    { name: 'Умеренный', value: severityStats['умеренный'] || 0, color: '#eab308' },
    { name: 'Высокий', value: severityStats['высокий'] || 0, color: '#f97316' },
    { name: 'Критич.', value: severityStats['критический'] || 0, color: '#ef4444' },
  ]

  // Средний балл деградации по всем отчётам
  const avgScore = reports.length
    ? Math.round(reports.reduce((sum, r) => sum + r.degradationScore, 0) / reports.length)
    : 0

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <Spinner size="lg" />
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Приветствие */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Добро пожаловать, {user?.name} 👋
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Обзор состояния ваших земельных участков
          </p>
        </div>

        {/* Карточки статистики */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">Образцов</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
              {samples.length}
            </p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">🧪 замеров</p>
          </Card>

          <Card className="p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">Отчётов</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
              {reports.length}
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">📊 анализов</p>
          </Card>

          <Card className="p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">Средний балл</p>
            <p
              className="text-2xl font-bold mt-1"
              style={{ color: getSeverityHex(avgScore) }}
            >
              {avgScore}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">из 100</p>
          </Card>

          <Card className="p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">Критических</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
              {severityStats['критический'] || 0}
            </p>
            <p className="text-xs text-red-500 mt-1">🚨 участков</p>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* График распределения деградации */}
          <Card className="p-5">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Распределение по уровням деградации
            </h2>
            {reports.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-gray-400 text-sm">
                Нет данных для отображения
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={chartData} barSize={32}>
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: 'currentColor' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis hide />
                  <Tooltip
                    formatter={(value) => [`${value} уч.`, 'Количество']}
                    contentStyle={{
                      background: 'var(--tw-color-background, #fff)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>

          {/* Последние отчёты */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Последние отчёты
              </h2>
              <Link
                to="/reports"
                className="text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
              >
                Все →
              </Link>
            </div>

            {reports.length === 0 ? (
              <div className="text-center py-6 text-gray-400 text-sm">
                Отчётов пока нет
                <br />
                <Link to="/samples" className="text-emerald-600 dark:text-emerald-400">
                  Добавьте образец
                </Link>
                {' '}и создайте первый отчёт
              </div>
            ) : (
              <div className="space-y-3">
                {reports.slice(0, 4).map((report) => (
                  <div
                    key={report._id}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {report.sampleId?.title || 'Участок'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(report.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                      <SeverityBadge severity={report.severity} />
                      <span
                        className="text-sm font-bold"
                        style={{ color: getSeverityHex(report.degradationScore) }}
                      >
                        {report.degradationScore}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Последние образцы */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Последние образцы
            </h2>
            <Link
              to="/samples"
              className="text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
            >
              Все →
            </Link>
          </div>

          {samples.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p className="text-sm">Образцов ещё нет</p>
              <Link
                to="/samples"
                className="text-sm text-emerald-600 dark:text-emerald-400 mt-2 inline-block"
              >
                + Добавить первый образец
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-gray-200 dark:border-gray-700">
                    <th className="pb-2 text-xs text-gray-500 dark:text-gray-400 font-medium">Участок</th>
                    <th className="pb-2 text-xs text-gray-500 dark:text-gray-400 font-medium">NDVI</th>
                    <th className="pb-2 text-xs text-gray-500 dark:text-gray-400 font-medium">Влажность</th>
                    <th className="pb-2 text-xs text-gray-500 dark:text-gray-400 font-medium">Дата замера</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {samples.map((sample) => (
                    <tr key={sample._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="py-2.5 pr-3 font-medium text-gray-900 dark:text-gray-100">
                        {sample.title}
                      </td>
                      <td className="py-2.5 pr-3">
                        <span
                          className="font-mono text-xs px-2 py-0.5 rounded"
                          style={{
                            background: sample.ndvi > 0.4 ? '#dcfce7' : sample.ndvi > 0.2 ? '#fef9c3' : '#fee2e2',
                            color: sample.ndvi > 0.4 ? '#166534' : sample.ndvi > 0.2 ? '#854d0e' : '#991b1b',
                          }}
                        >
                          {sample.ndvi.toFixed(2)}
                        </span>
                      </td>
                      <td className="py-2.5 pr-3 text-gray-600 dark:text-gray-400">
                        {sample.soilMoisture}%
                      </td>
                      <td className="py-2.5 text-gray-500 dark:text-gray-400 text-xs">
                        {formatDate(sample.sampledAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </Layout>
  )
}

export default DashboardPage
