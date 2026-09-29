// ============================================================
// pages/SamplesPage.jsx — Страница образцов земли (CRUD)
// ============================================================

import { useState, useEffect, useCallback } from 'react'
import { fetchSamples, createSample, updateSample, deleteSample } from '../api'
import {
  Card, Button, Input, Modal, Spinner, EmptyState, Alert
} from '../components/ui'
import { formatDate, getNDVILabel } from '../utils/helpers'
import Layout from '../components/layout/Layout'

// ─────────────────────────────────────────
// ФОРМА ДОБАВЛЕНИЯ/РЕДАКТИРОВАНИЯ ОБРАЗЦА
// ─────────────────────────────────────────
const SampleForm = ({ sample, onSubmit, onClose, isLoading }) => {
  const [formData, setFormData] = useState({
    title: sample?.title || '',
    description: sample?.description || '',
    lat: sample?.coordinates?.lat || '',
    lng: sample?.coordinates?.lng || '',
    ndvi: sample?.ndvi ?? '',
    soilMoisture: sample?.soilMoisture ?? '',
    soilQualityIndex: sample?.soilQualityIndex ?? '',
    organicMatter: sample?.organicMatter ?? '',
    sampledAt: sample?.sampledAt
      ? new Date(sample.sampledAt).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
  })
  const [errors, setErrors] = useState({})

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
  }

  const validate = () => {
    const e = {}
    if (!formData.title.trim()) e.title = 'Укажите название'
    if (formData.lat === '' || isNaN(formData.lat)) e.lat = 'Укажите широту (-90 до 90)'
    if (formData.lng === '' || isNaN(formData.lng)) e.lng = 'Укажите долготу (-180 до 180)'
    if (formData.ndvi === '' || isNaN(formData.ndvi)) e.ndvi = 'Укажите NDVI (-1 до 1)'
    if (formData.soilMoisture === '') e.soilMoisture = 'Укажите влажность (0–100%)'
    if (formData.soilQualityIndex === '') e.soilQualityIndex = 'Укажите индекс качества (0–100)'
    if (formData.organicMatter === '') e.organicMatter = 'Укажите содержание органики (0–20%)'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return

    onSubmit({
      title: formData.title,
      description: formData.description,
      coordinates: { lat: Number(formData.lat), lng: Number(formData.lng) },
      ndvi: Number(formData.ndvi),
      soilMoisture: Number(formData.soilMoisture),
      soilQualityIndex: Number(formData.soilQualityIndex),
      organicMatter: Number(formData.organicMatter),
      sampledAt: formData.sampledAt,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Название участка" name="title" value={formData.title} onChange={handleChange} error={errors.title} required />
      <Input label="Описание (необязательно)" name="description" value={formData.description} onChange={handleChange} />

      <div className="grid grid-cols-2 gap-3">
        <Input label="Широта" name="lat" type="number" step="any" value={formData.lat} onChange={handleChange} error={errors.lat} placeholder="41.2995" required />
        <Input label="Долгота" name="lng" type="number" step="any" value={formData.lng} onChange={handleChange} error={errors.lng} placeholder="69.2401" required />
      </div>

      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-3">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          Показатели состояния земли
        </p>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="NDVI (индекс вегетации)"
            name="ndvi"
            type="number"
            step="0.01"
            min="-1"
            max="1"
            value={formData.ndvi}
            onChange={handleChange}
            error={errors.ndvi}
            placeholder="-1 до 1"
            required
          />
          <Input
            label="Влажность почвы (%)"
            name="soilMoisture"
            type="number"
            step="0.1"
            min="0"
            max="100"
            value={formData.soilMoisture}
            onChange={handleChange}
            error={errors.soilMoisture}
            placeholder="0–100"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Индекс качества почвы"
            name="soilQualityIndex"
            type="number"
            step="1"
            min="0"
            max="100"
            value={formData.soilQualityIndex}
            onChange={handleChange}
            error={errors.soilQualityIndex}
            placeholder="0–100"
            required
          />
          <Input
            label="Органическое вещество (%)"
            name="organicMatter"
            type="number"
            step="0.1"
            min="0"
            max="20"
            value={formData.organicMatter}
            onChange={handleChange}
            error={errors.organicMatter}
            placeholder="0–20"
            required
          />
        </div>
      </div>

      <Input label="Дата замера" name="sampledAt" type="date" value={formData.sampledAt} onChange={handleChange} required />

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
          Отмена
        </Button>
        <Button type="submit" variant="primary" loading={isLoading} className="flex-1">
          {sample ? 'Сохранить' : 'Добавить образец'}
        </Button>
      </div>
    </form>
  )
}

// ─────────────────────────────────────────
// ОСНОВНАЯ СТРАНИЦА
// ─────────────────────────────────────────
const SamplesPage = () => {
  const [samples, setSamples] = useState([])
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 })
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Управление модалками
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingSample, setEditingSample] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const loadSamples = useCallback(async (page = 1) => {
    try {
      setIsLoading(true)
      const data = await fetchSamples(page)
      setSamples(data.samples)
      setPagination(data.pagination)
    } catch {
      setError('Не удалось загрузить образцы')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { loadSamples() }, [loadSamples])

  const handleCreate = async (sampleData) => {
    setIsSubmitting(true)
    try {
      await createSample(sampleData)
      setSuccess('Образец успешно добавлен')
      setShowAddModal(false)
      loadSamples()
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка при добавлении')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdate = async (sampleData) => {
    setIsSubmitting(true)
    try {
      await updateSample(editingSample._id, sampleData)
      setSuccess('Образец обновлён')
      setEditingSample(null)
      loadSamples()
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка при обновлении')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить этот образец?')) return
    setDeletingId(id)
    try {
      await deleteSample(id)
      setSuccess('Образец удалён')
      loadSamples()
    } catch {
      setError('Ошибка при удалении')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <Layout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Образцы земли</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {pagination.totalItems || 0} замеров
            </p>
          </div>
          <Button variant="primary" onClick={() => setShowAddModal(true)}>
            + Добавить образец
          </Button>
        </div>

        {error && <Alert type="error" message={error} onClose={() => setError('')} />}
        {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

        {isLoading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : samples.length === 0 ? (
          <EmptyState
            icon="🧪"
            title="Образцов пока нет"
            description="Добавьте первый образец с данными замера земельного участка"
            action={
              <Button variant="primary" onClick={() => setShowAddModal(true)}>
                Добавить первый образец
              </Button>
            }
          />
        ) : (
          <>
            <div className="grid gap-4">
              {samples.map((sample) => (
                <Card key={sample._id} className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                        {sample.title}
                      </h3>
                      {sample.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                          {sample.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-3 flex-wrap">
                        {/* Показатели */}
                        {[
                          { label: 'NDVI', value: sample.ndvi.toFixed(2), hint: getNDVILabel(sample.ndvi) },
                          { label: 'Влажность', value: `${sample.soilMoisture}%` },
                          { label: 'Индекс почвы', value: sample.soilQualityIndex },
                          { label: 'Органика', value: `${sample.organicMatter}%` },
                        ].map((item) => (
                          <div key={item.label} className="text-center">
                            <p className="text-xs text-gray-400 dark:text-gray-500">{item.label}</p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                              {item.value}
                            </p>
                            {item.hint && (
                              <p className="text-xs text-gray-400">{item.hint}</p>
                            )}
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
                        📍 {sample.coordinates.lat.toFixed(4)}, {sample.coordinates.lng.toFixed(4)}
                        {' · '}
                        Замер: {formatDate(sample.sampledAt)}
                      </p>
                    </div>

                    {/* Кнопки действий */}
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setEditingSample(sample)}
                      >
                        ✏️ Изменить
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        loading={deletingId === sample._id}
                        onClick={() => handleDelete(sample._id)}
                      >
                        🗑️ Удалить
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Пагинация */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center gap-2">
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => loadSamples(page)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                      page === pagination.currentPage
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Модалка добавления */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Новый образец земли">
        <SampleForm onSubmit={handleCreate} onClose={() => setShowAddModal(false)} isLoading={isSubmitting} />
      </Modal>

      {/* Модалка редактирования */}
      <Modal isOpen={!!editingSample} onClose={() => setEditingSample(null)} title="Редактировать образец">
        <SampleForm
          sample={editingSample}
          onSubmit={handleUpdate}
          onClose={() => setEditingSample(null)}
          isLoading={isSubmitting}
        />
      </Modal>
    </Layout>
  )
}

export default SamplesPage
