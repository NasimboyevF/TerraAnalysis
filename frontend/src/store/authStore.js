// ============================================================
// store/authStore.js — Zustand хранилище для авторизации
//
// Zustand — лёгкая библиотека управления состоянием.
// В отличие от React Context не требует Provider обёртки.
// Любой компонент может импортировать useAuthStore и получить данные.
//
// Данные auth хранятся в localStorage чтобы переживать перезагрузку страницы.
// ============================================================

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../api/axios'

const useAuthStore = create(
  // persist — middleware Zustand который автоматически сохраняет состояние
  // в localStorage и восстанавливает при следующем открытии страницы
  persist(
    (set, get) => ({
      // ─────────────────────────────────────────
      // СОСТОЯНИЕ (state)
      // ─────────────────────────────────────────

      user: null,        // Объект пользователя { id, name, email }
      token: null,       // JWT токен
      isLoading: false,  // Индикатор загрузки для UI
      error: null,       // Текст ошибки если что-то пошло не так
      darkMode: false,   // Тёмная/светлая тема

      // ─────────────────────────────────────────
      // ДЕЙСТВИЯ (actions)
      // ─────────────────────────────────────────

      // Регистрация нового пользователя
      register: async (name, email, password) => {
        set({ isLoading: true, error: null })
        try {
          const response = await api.post('/auth/register', { name, email, password })
          const { token, user } = response.data

          // Сохраняем токен в axios — теперь он будет добавляться к каждому запросу
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`

          set({ user, token, isLoading: false })
          return { success: true }
        } catch (error) {
          const message = error.response?.data?.message || 'Ошибка регистрации'
          set({ error: message, isLoading: false })
          return { success: false, message }
        }
      },

      // Вход в систему
      login: async (email, password) => {
        set({ isLoading: true, error: null })
        try {
          const response = await api.post('/auth/login', { email, password })
          const { token, user } = response.data

          api.defaults.headers.common['Authorization'] = `Bearer ${token}`

          set({ user, token, isLoading: false })
          return { success: true }
        } catch (error) {
          const message = error.response?.data?.message || 'Ошибка входа'
          set({ error: message, isLoading: false })
          return { success: false, message }
        }
      },

      // Выход из системы — очищаем всё
      logout: () => {
        // Убираем токен из заголовков axios
        delete api.defaults.headers.common['Authorization']
        set({ user: null, token: null, error: null })
      },

      // Обновляет объект user в сторе (после /auth/me или редактирования профиля)
      // Мёржит новые поля поверх текущих, а не затирает целиком
      updateUser: (patch) => {
        set({ user: { ...get().user, ...patch } })
      },

      // Переключение тёмной/светлой темы
      toggleDarkMode: () => {
        const newMode = !get().darkMode
        // Добавляем/убираем класс 'dark' на <html> элементе
        // Tailwind darkMode: 'class' смотрит именно на этот класс
        document.documentElement.classList.toggle('dark', newMode)
        set({ darkMode: newMode })
      },

      // Инициализация при старте приложения — восстанавливаем токен в axios
      initAuth: () => {
        const { token, darkMode } = get()
        if (token) {
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`
        }
        // Восстанавливаем тему
        document.documentElement.classList.toggle('dark', darkMode)
      },

      // Сброс ошибки (для форм)
      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage', // Ключ в localStorage
      // Сохраняем только user и token, не isLoading и error
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        darkMode: state.darkMode,
      }),
    }
  )
)

export default useAuthStore
