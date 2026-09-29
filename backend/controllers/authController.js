// ============================================================
// controllers/authController.js — Регистрация и авторизация
//
// Контроллер обрабатывает HTTP запросы:
// - принимает данные из req.body
// - вызывает модели/сервисы
// - отправляет ответ через res.json()
// ============================================================

const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

/**
 * Создаёт JWT токен для пользователя
 * Токен содержит id пользователя и живёт JWT_EXPIRES_IN (7 дней по умолчанию)
 */
const createToken = (userId) => {
  return jwt.sign(
    { id: userId },           // Payload — данные внутри токена
    process.env.JWT_SECRET,   // Секретный ключ для подписи
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

/**
 * POST /api/auth/register — Регистрация нового пользователя
 *
 * Тело запроса: { name, email, password }
 * Ответ: { token, user: { id, name, email } }
 */
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Проверяем что все поля заполнены
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Заполните все поля: имя, email, пароль' });
    }

    // Проверяем что пользователь с таким email ещё не существует
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Пользователь с таким email уже существует' });
    }

    // Создаём нового пользователя
    // Пароль будет автоматически захэширован через хук pre('save') в модели
    const user = await User.create({ name, email, password });

    // Создаём JWT токен
    const token = createToken(user._id);

    console.log(`✅ Новый пользователь зарегистрирован: ${email}`);

    res.status(201).json({
      message: 'Регистрация прошла успешно',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    // Mongoose ValidationError — ошибки валидации схемы
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ message: messages.join('. ') });
    }
    res.status(500).json({ message: 'Ошибка при регистрации: ' + error.message });
  }
};

/**
 * POST /api/auth/login — Вход в систему
 *
 * Тело запроса: { email, password }
 * Ответ: { token, user: { id, name, email } }
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Введите email и пароль' });
    }

    // Ищем пользователя и явно запрашиваем пароль (он hidden по умолчанию)
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      // Не уточняем что именно неверно — это защита от перебора
      return res.status(401).json({ message: 'Неверный email или пароль' });
    }

    // Сравниваем введённый пароль с хэшем в БД
    const isPasswordCorrect = await user.comparePassword(password);

    if (!isPasswordCorrect) {
      return res.status(401).json({ message: 'Неверный email или пароль' });
    }

    const token = createToken(user._id);

    console.log(`✅ Пользователь вошёл в систему: ${email}`);

    res.json({
      message: 'Вход выполнен успешно',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при входе: ' + error.message });
  }
};

/**
 * GET /api/auth/me — Получить данные текущего пользователя
 * Требует авторизации (middleware protect)
 */
const getMe = async (req, res) => {
  // req.user уже заполнен в authMiddleware
  res.json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      createdAt: req.user.createdAt,
    },
  });
};

module.exports = { register, login, getMe };
