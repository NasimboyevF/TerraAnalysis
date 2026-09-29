// ============================================================
// api/samples.js — Функции для работы с образцами земли
// api/reports.js — Функции для работы с отчётами
//
// Выносим все API вызовы в отдельные функции.
// Компоненты не знают о URL и структуре запросов —
// просто вызывают функцию и получают данные.
// ============================================================

import api from './axios'

// ─────────────────────────────────────────
// ОБРАЗЦЫ ЗЕМЛИ
// ─────────────────────────────────────────

/**
 * Получить все образцы текущего пользователя с пагинацией
 * @param {number} page — номер страницы
 * @param {number} limit — образцов на странице
 */
export const fetchSamples = async (page = 1, limit = 10) => {
  const response = await api.get(`/samples?page=${page}&limit=${limit}`)
  return response.data
}

/**
 * Получить один образец по ID
 * @param {string} id — MongoDB ObjectId
 */
export const fetchSampleById = async (id) => {
  const response = await api.get(`/samples/${id}`)
  return response.data.sample
}

/**
 * Создать новый образец земли
 * @param {object} sampleData — данные образца
 */
export const createSample = async (sampleData) => {
  const response = await api.post('/samples', sampleData)
  return response.data.sample
}

/**
 * Обновить существующий образец
 * @param {string} id — ID образца
 * @param {object} updateData — поля для обновления
 */
export const updateSample = async (id, updateData) => {
  const response = await api.put(`/samples/${id}`, updateData)
  return response.data.sample
}

/**
 * Удалить образец
 * @param {string} id — ID образца
 */
export const deleteSample = async (id) => {
  const response = await api.delete(`/samples/${id}`)
  return response.data
}

// ─────────────────────────────────────────
// ОТЧЁТЫ О ДЕГРАДАЦИИ
// ─────────────────────────────────────────

/**
 * Получить все отчёты с пагинацией
 */
export const fetchReports = async (page = 1, limit = 10) => {
  const response = await api.get(`/reports?page=${page}&limit=${limit}`)
  return response.data
}

/**
 * Получить один отчёт по ID
 */
export const fetchReportById = async (id) => {
  const response = await api.get(`/reports/${id}`)
  return response.data.report
}

/**
 * Создать отчёт по образцу (запускает вычисление деградации на сервере)
 * @param {string} sampleId — ID образца земли
 */
export const createReport = async (sampleId) => {
  const response = await api.post('/reports', { sampleId })
  return response.data.report
}

/**
 * Удалить отчёт
 */
export const deleteReport = async (id) => {
  const response = await api.delete(`/reports/${id}`)
  return response.data
}
