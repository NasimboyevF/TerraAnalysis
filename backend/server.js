// ============================================================
// server.js — Точка входа в приложение
// Здесь настраивается Express, подключаются все middleware,
// регистрируются роуты и запускается сервер
// ============================================================

// Загружаем переменные окружения из файла .env
// Это должно быть первой строкой, до всех остальных импортов
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/db');
const logger = require('./middleware/logger');
const { launchBot, getBot } = require('./bot');

// Импортируем все роуты
const authRoutes = require('./routes/authRoutes');
const sampleRoutes = require('./routes/sampleRoutes');
const reportRoutes = require('./routes/reportRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Создаём экземпляр Express-приложения
const app = express();

// ─────────────────────────────────────────
// ПОДКЛЮЧЕНИЕ К БАЗЕ ДАННЫХ
// MongoDB хранит данные локально на диске компьютера.
// По умолчанию: ~/.local/share/mongodb (Linux) или C:\data\db (Windows)
// ─────────────────────────────────────────
connectDB();

// ─────────────────────────────────────────
// MIDDLEWARE БЕЗОПАСНОСТИ
// ─────────────────────────────────────────

// helmet добавляет защитные HTTP-заголовки:
// X-Frame-Options, X-XSS-Protection, Content-Security-Policy и др.
app.use(helmet());

// cors разрешает запросы с фронтенда (localhost:5173 — порт Vite по умолчанию)
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

// Ограничитель запросов: не более 100 запросов с одного IP за 15 минут
// Защищает от брутфорс-атак и перегрузки сервера
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут в миллисекундах
  max: 100,
  message: { message: 'Слишком много запросов, попробуйте позже' },
});
app.use(limiter);

// ─────────────────────────────────────────
// СТАНДАРТНЫЕ MIDDLEWARE
// ─────────────────────────────────────────

// Позволяет читать тело запроса в формате JSON (req.body)
app.use(express.json());

// Позволяет читать данные из HTML-форм (application/x-www-form-urlencoded)
app.use(express.urlencoded({ extended: true }));

// Наш кастомный логгер — выводит в консоль метод и путь каждого запроса
app.use(logger);

// ─────────────────────────────────────────
// РОУТЫ (маршруты)
// Каждый префикс соответствует своей группе эндпоинтов
// ─────────────────────────────────────────
app.use('/api/auth', authRoutes);       // /api/auth/register, /api/auth/login
app.use('/api/samples', sampleRoutes);  // CRUD для образцов земли
app.use('/api/reports', reportRoutes);  // CRUD для отчётов о деградации
app.use('/api/admin', adminRoutes);     // Статистика и управление пользователями (только admin)

// Telegram-бот: в режиме webhook Telegram стучится сюда с обновлениями.
// В режиме polling (по умолчанию, локальная разработка) этот путь не используется.
if (process.env.BOT_WEBHOOK_URL) {
  app.use('/bot-webhook', (req, res, next) => {
    const bot = getBot();
    if (!bot) return res.sendStatus(503);
    return bot.webhookCallback('/bot-webhook')(req, res, next);
  });
}

// Корневой маршрут — просто проверка что сервер живой
app.get('/', (req, res) => {
  res.json({
    message: 'API системы вычисления деградации земли работает',
    версия: '1.0.0',
    эндпоинты: ['/api/auth', '/api/samples', '/api/reports'],
  });
});

// ─────────────────────────────────────────
// ОБРАБОТКА ОШИБОК
// Этот middleware ловит все ошибки которые прилетают через next(err)
// ─────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Ошибка сервера:', err.stack);

  // Если статус уже установлен — используем его, иначе 500
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;

  res.status(statusCode).json({
    message: err.message || 'Внутренняя ошибка сервера',
    // В режиме разработки показываем стек ошибки для отладки
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

// ─────────────────────────────────────────
// ЗАПУСК СЕРВЕРА
// ─────────────────────────────────────────
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`\n✅ Сервер запущен на порту ${PORT}`);
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`🌱 Режим: ${process.env.NODE_ENV || 'development'}\n`);
});

// Бот запускается отдельно от app.listen — если BOT_TOKEN не задан,
// launchBot() просто выводит предупреждение и ничего не ломает.
launchBot();
