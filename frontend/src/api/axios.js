// ============================================================
// api/axios.js — Настроенный экземпляр axios
//
// Создаём axios instance с базовым URL и настройками.
// Все запросы в приложении используют этот instance —
// не импортируют axios напрямую.
//
// Интерсепторы (interceptors) — это middleware для HTTP запросов:
// - request interceptor: срабатывает ПЕРЕД отправкой запроса
// - response interceptor: срабатывает ПОСЛЕ получения ответа
// ============================================================

import axios from "axios";

// Создаём instance с базовым URL
// В режиме разработки Vite проксирует /api на localhost:5000 (см. vite.config.js)
const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
  // Таймаут 10 секунд — если сервер не отвечает, не ждём вечно
  timeout: 10000,
});

// ─────────────────────────────────────────
// RESPONSE INTERCEPTOR
// Обрабатывает ошибки авторизации глобально
// ─────────────────────────────────────────
api.interceptors.response.use(
  // Успешный ответ — просто возвращаем без изменений
  (response) => response,

  // Ошибка — проверяем код
  (error) => {
    if (error.response?.status === 401) {
      // Токен истёк или недействителен — разлогиниваем пользователя
      // Импортируем store здесь чтобы избежать циклического импорта
      import("../store/authStore").then(({ default: useAuthStore }) => {
        const logout = useAuthStore.getState().logout;
        logout();
        // Перенаправляем на страницу входа
        window.location.href = "/login";
      });
    }
    return Promise.reject(error);
  },
);

export default api;
