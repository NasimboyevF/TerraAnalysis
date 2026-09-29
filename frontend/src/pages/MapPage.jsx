// ============================================================
// pages/MapPage.jsx — Страница с картой земельных участков
//
// Использует Leaflet через react-leaflet для отображения
// всех образцов на интерактивной карте.
// Маркеры окрашены в зависимости от уровня деградации.
// ============================================================

import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { fetchSamples } from '../api'
import { fetchReports } from '../api'
import { Spinner, Alert, SeverityBadge, DegradationBar } from '../components/ui'
import { formatDate, getSeverityHex } from '../utils/helpers'
import Layout from '../components/layout/Layout'

const MapPage = () => {
  const [samples, setSamples] = useState([])
  const [reports, setReports] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadData = async () => {
      try {
        // Загружаем первые 100 образцов для карты
        const [samplesData, reportsData] = await Promise.all([
          fetchSamples(1, 100),
          fetchReports(1, 100),
        ])
        setSamples(samplesData.samples)
        setReports(reportsData.reports)
      } catch {
        setError('Не удалось загрузить данные для карты')
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  // Создаём словарь: sampleId → report (для быстрого поиска)
  const reportBySample = reports.reduce((acc, report) => {
    if (report.sampleId?._id) {
      acc[report.sampleId._id] = report
    }
    return acc
  }, {})

  // Центр карты — если есть образцы, центрируемся по первому
  // иначе показываем центр Узбекистана по умолчанию
  const defaultCenter = samples.length > 0
    ? [samples[0].coordinates.lat, samples[0].coordinates.lng]
    : [41.2995, 69.2401]

  // Цвет маркера: если есть отчёт — по уровню деградации, иначе серый
  const getMarkerColor = (sampleId) => {
    const report = reportBySample[sampleId]
    if (!report) return '#94a3b8' // серый — нет отчёта
    return getSeverityHex(report.degradationScore)
  }

  return (
    <Layout>
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Карта участков</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {samples.length} участков на карте · Нажмите на маркер для деталей
          </p>
        </div>

        {error && <Alert type="error" message={error} />}

        {/* Легенда */}
        <div className="flex flex-wrap items-center gap-4 p-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 text-xs">
          <span className="text-gray-500 dark:text-gray-400 font-medium">Уровень деградации:</span>
          {[
            { label: 'Низкий (0–25)', color: '#22c55e' },
            { label: 'Умеренный (26–50)', color: '#eab308' },
            { label: 'Высокий (51–75)', color: '#f97316' },
            { label: 'Критический (76–100)', color: '#ef4444' },
            { label: 'Нет отчёта', color: '#94a3b8' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1.5">
              <div
                className="w-3 h-3 rounded-full"
                style={{ background: item.color }}
              />
              <span className="text-gray-600 dark:text-gray-400">{item.label}</span>
            </div>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : (
          <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800" style={{ height: '560px' }}>
            <MapContainer
              center={defaultCenter}
              zoom={samples.length > 0 ? 10 : 5}
              style={{ height: '100%', width: '100%' }}
            >
              {/* Слой тайлов OpenStreetMap (бесплатный, не требует ключа) */}
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />

              {/* Маркер для каждого образца */}
              {samples.map((sample) => {
                const report = reportBySample[sample._id]
                const color = getMarkerColor(sample._id)

                return (
                  <CircleMarker
                    key={sample._id}
                    center={[sample.coordinates.lat, sample.coordinates.lng]}
                    radius={report ? 10 : 7}
                    pathOptions={{
                      fillColor: color,
                      fillOpacity: 0.85,
                      color: '#fff',
                      weight: 2,
                    }}
                  >
                    {/* Всплывающее окно при клике на маркер */}
                    <Popup>
                      <div className="min-w-48 text-sm">
                        <p className="font-semibold text-gray-900 mb-1">{sample.title}</p>

                        {/* Показатели образца */}
                        <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs text-gray-600 mb-2">
                          <span>NDVI: <b>{sample.ndvi}</b></span>
                          <span>Влажность: <b>{sample.soilMoisture}%</b></span>
                          <span>Качество: <b>{sample.soilQualityIndex}</b></span>
                          <span>Органика: <b>{sample.organicMatter}%</b></span>
                        </div>

                        {report ? (
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs text-gray-500">Деградация:</span>
                              <b style={{ color: getSeverityHex(report.degradationScore) }}>
                                {report.degradationScore}/100
                              </b>
                            </div>
                            <span
                              className="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
                              style={{
                                background: color + '30',
                                color: color,
                              }}
                            >
                              {report.severity}
                            </span>
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400 mt-2 pt-2 border-t border-gray-200">
                            Отчёт не создан
                          </p>
                        )}

                        <p className="text-xs text-gray-400 mt-1">
                          {formatDate(sample.sampledAt)}
                        </p>
                      </div>
                    </Popup>
                  </CircleMarker>
                )
              })}
            </MapContainer>
          </div>
        )}

        {samples.length === 0 && !isLoading && (
          <div className="text-center py-8 text-gray-400 text-sm">
            Добавьте образцы с координатами — они появятся на карте
          </div>
        )}
      </div>
    </Layout>
  )
}

export default MapPage
