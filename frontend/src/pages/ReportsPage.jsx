// ============================================================
// pages/ReportsPage.jsx — Страница отчётов о деградации
// ============================================================

import { useState, useEffect, useCallback } from 'react'
import { fetchReports, createReport, deleteReport, fetchSamples } from '../api'
import {
  Card, Button, Spinner, EmptyState, Alert, SeverityBadge, DegradationBar, Modal
} from '../components/ui'
import { formatDate } from '../utils/helpers'
import Layout from '../components/layout/Layout'

// ─────────────────────────────────────────
// ДЕТАЛЬНЫЙ ВИД ОТЧЁТА
// ─────────────────────────────────────────
const ReportDetail = ({ report }) => {
  const { breakdown } = report

  // Детализация по показателям — структура для отображения
  const breakdownItems = [
    { label: 'NDVI (вегетация)', score: breakdown.ndviScore, maxScore: 35, weight: '35%' },
    { label: 'Качество почвы', score: breakdown.soilQualityScore, maxScore: 30, weight: '30%' },
    { label: 'Влажность почвы', score: breakdown.moistureScore, maxScore: 20, weight: '20%' },
    { label: 'Органическое вещество', score: breakdown.organicMatterScore, maxScore: 15, weight: '15%' },
  ]

  return (
    <div className="space-y-5">
      {/* Итоговый балл */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-center">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Итоговый индекс деградации</p>
        <p className="text-4xl font-bold text-gray-900 dark:text-gray-100">
          {report.degradationScore}
          <span className="text-lg text-gray-400">/100</span>
        </p>
        <div className="mt-2">
          <SeverityBadge severity={report.severity} />
        </div>
      </div>

      {/* Прогресс-бар общий */}
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Общий уровень деградации</p>
        <DegradationBar score={report.degradationScore} />
      </div>

      {/* Детализация по показателям */}
      <div>
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
          Вклад каждого показателя
        </p>
        <div className="space-y-3">
          {breakdownItems.map((item) => (
            <div key={item.label}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-600 dark:text-gray-400">{item.label}</span>
                <span className="text-gray-500 dark:text-gray-500">
                  {item.score}/{item.maxScore} (вес {item.weight})
                </span>
              </div>
              <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                <div
                  className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${(item.score / item.maxScore) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Рекомендации */}
      {report.recommendation && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
          <p className="text-xs font-semibold text-blue-800 dark:text-blue-300 mb-2">
            💡 Рекомендации агронома
          </p>
          <p className="text-sm text-blue-700 dark:text-blue-400 leading-relaxed">
            {report.recommendation}
          </p>
        </div>
      )}

      {/* Данные образца */}
      {report.sampleId && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Образец: <span className="font-medium text-gray-900 dark:text-gray-100">
              {report.sampleId.title}
            </span>
            {' · '}
            Дата замера: {formatDate(report.sampleId.sampledAt)}
          </p>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────
// ФОРМА СОЗДАНИЯ ОТЧЁТА
// ─────────────────────────────────────────
const CreateReportForm = ({ onSubmit, onClose, isLoading }) => {
  const [samples, setSamples] = useState([])
  const [selectedSampleId, setSelectedSampleId] = useState('')
  const [loadingSamples, setLoadingSamples] = useState(true)

  useEffect(() => {
    fetchSamples(1, 100).then(data => {
      setSamples(data.samples)
      setLoadingSamples(false)
    })
  }, [])

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Выберите образец земли для анализа. Система автоматически вычислит
        индекс деградации по всем показателям.
      </p>

      {loadingSamples ? (
        <div className="flex justify-center py-4"><Spinner /></div>
      ) : samples.length === 0 ? (
        <Alert type="info" message="Сначала добавьте образцы земли на странице 'Образцы'" />
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {samples.map((sample) => (
            <label
              key={sample._id}
              className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                selectedSampleId === sample._id
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <input
                type="radio"
                name="sampleId"
                value={sample._id}
                checked={selectedSampleId === sample._id}
                onChange={(e) => setSelectedSampleId(e.target.value)}
                className="mt-0.5 accent-emerald-600"
              />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {sample.title}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  NDVI: {sample.ndvi} · Влажность: {sample.soilMoisture}% · {formatDate(sample.sampledAt)}
                </p>
              </div>
            </label>
          ))}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
          Отмена
        </Button>
        <Button
          variant="primary"
          loading={isLoading}
          disabled={!selectedSampleId}
          onClick={() => onSubmit(selectedSampleId)}
          className="flex-1"
        >
          Создать отчёт
        </Button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────
// ОСНОВНАЯ СТРАНИЦА
// ─────────────────────────────────────────
const ReportsPage = () => {
  const [reports, setReports] = useState([])
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 })
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedReport, setSelectedReport] = useState(null)

  const loadReports = useCallback(async (page = 1) => {
    try {
      setIsLoading(true)
      const data = await fetchReports(page)
      setReports(data.reports)
      setPagination(data.pagination)
    } catch {
      setError('Не удалось загрузить отчёты')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { loadReports() }, [loadReports])

  const handleCreate = async (sampleId) => {
    setIsSubmitting(true)
    try {
      const newReport = await createReport(sampleId)
      setSuccess(`Отчёт создан. Балл деградации: ${newReport.degradationScore}`)
      setShowCreateModal(false)
      loadReports()
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка создания отчёта')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить отчёт?')) return
    try {
      await deleteReport(id)
      setSuccess('Отчёт удалён')
      loadReports()
    } catch {
      setError('Ошибка удаления')
    }
  }

  return (
    <Layout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Отчёты о деградации</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{pagination.totalItems || 0} анализов</p>
          </div>
          <Button variant="primary" onClick={() => setShowCreateModal(true)}>
            + Новый анализ
          </Button>
        </div>

        {error && <Alert type="error" message={error} onClose={() => setError('')} />}
        {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

        {isLoading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : reports.length === 0 ? (
          <EmptyState
            icon="📊"
            title="Отчётов пока нет"
            description="Создайте отчёт по образцу земли — система автоматически вычислит индекс деградации"
            action={<Button variant="primary" onClick={() => setShowCreateModal(true)}>Создать первый отчёт</Button>}
          />
        ) : (
          <div className="grid gap-4">
            {reports.map((report) => (
              <Card key={report._id} className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                        {report.sampleId?.title || 'Участок'}
                      </h3>
                      <SeverityBadge severity={report.severity} />
                    </div>

                    <div className="mt-3">
                      <DegradationBar score={report.degradationScore} />
                    </div>

                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                      📅 Анализ от {formatDate(report.createdAt)}
                      {report.sampleId && ` · Замер: ${formatDate(report.sampleId.sampledAt)}`}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <Button variant="secondary" size="sm" onClick={() => setSelectedReport(report)}>
                      🔍 Подробнее
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(report._id)}>
                      🗑️ Удалить
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Модалка создания */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Создать отчёт о деградации">
        <CreateReportForm onSubmit={handleCreate} onClose={() => setShowCreateModal(false)} isLoading={isSubmitting} />
      </Modal>

      {/* Детальный просмотр */}
      <Modal isOpen={!!selectedReport} onClose={() => setSelectedReport(null)} title="Детали отчёта">
        {selectedReport && <ReportDetail report={selectedReport} />}
      </Modal>
    </Layout>
  )
}

export default ReportsPage
