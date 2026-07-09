// ============================================================
// routes/authRoutes.js — Маршруты аутентификации
// ============================================================

const express = require('express');
const router = express.Router();
const { register, login, getMe, updateMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// POST /api/auth/register — Регистрация (публичный маршрут)
router.post('/register', register);

// POST /api/auth/login — Вход (публичный маршрут)
router.post('/login', login);

// GET /api/auth/me — Данные текущего пользователя (только для авторизованных)
// protect — это наш middleware из authMiddleware.js, проверяет JWT токен
router.get('/me', protect, getMe);

// PUT /api/auth/me — Редактирование профиля (имя, email)
router.put('/me', protect, updateMe);

module.exports = router;
