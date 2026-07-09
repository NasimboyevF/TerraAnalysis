// ============================================================
// models/userModel.js — Схема пользователя в MongoDB
//
// Mongoose Schema описывает структуру документа в коллекции.
// MongoDB хранит документы в коллекции "users" (автоматически
// создаётся при первой записи).
//
// Данные физически сохраняются в файлах на диске компьютера —
// MongoDB сама управляет файлами, вам ничего делать не нужно.
// ============================================================

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    // Имя пользователя — обязательное поле
    name: {
      type: String,
      required: [true, 'Укажите имя'],
      trim: true, // Убирает пробелы в начале и конце строки
      maxlength: [50, 'Имя не может быть длиннее 50 символов'],
    },

    // Email — уникальный идентификатор пользователя
    email: {
      type: String,
      required: [true, 'Укажите email'],
      unique: true, // MongoDB создаст уникальный индекс — два одинаковых email невозможны
      trim: true,
      lowercase: true, // Всегда сохраняем в нижнем регистре
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Введите корректный email адрес',
      ],
    },

    // Пароль — хранится только в виде bcrypt хэша, никогда в открытом виде
    password: {
      type: String,
      required: [true, 'Укажите пароль'],
      minlength: [6, 'Пароль должен быть минимум 6 символов'],
      // select: false означает что это поле НЕ возвращается при обычных запросах
      // Нужно явно писать .select('+password') чтобы его получить
      select: false,
    },

    // Роль пользователя — обычный пользователь или админ
    // Админы получают доступ к /admin в Telegram-боте и к admin dashboard на фронте
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },

    // ─────────────────────────────────────────
    // ПРИВЯЗКА К TELEGRAM
    // Заполняется когда пользователь связывает аккаунт через бота (/link)
    // ─────────────────────────────────────────
    telegramId: {
      type: Number,
      unique: true,
      sparse: true, // sparse — позволяет иметь много документов с telegramId = null
    },
    telegramUsername: {
      type: String,
      trim: true,
    },
  },
  {
    // timestamps: true автоматически добавляет поля createdAt и updatedAt
    // MongoDB сама обновляет updatedAt при каждом изменении документа
    timestamps: true,
  }
);

// ─────────────────────────────────────────
// ХУКИ (middleware Mongoose)
// ─────────────────────────────────────────

// pre('save') — срабатывает ПЕРЕД сохранением документа в БД
// Хэшируем пароль автоматически при каждом сохранении
userSchema.pre('save', async function (next) {
  // Если пароль не изменился — пропускаем хэширование
  // (например при обновлении только имени)
  if (!this.isModified('password')) {
    return next();
  }

  // bcrypt.genSalt(12) — генерируем "соль" (случайную строку)
  // Число 12 — это "cost factor": чем больше, тем надёжнее, но медленнее
  // 12 — хороший баланс безопасности и скорости
  const salt = await bcrypt.genSalt(12);

  // Хэшируем пароль с солью. Результат выглядит примерно так:
  // $2a$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ─────────────────────────────────────────
// МЕТОДЫ СХЕМЫ
// ─────────────────────────────────────────

// Метод для сравнения введённого пароля с хэшем в БД
// Используется при логине: user.comparePassword(введённыйПароль)
userSchema.methods.comparePassword = async function (enteredPassword) {
  // bcrypt.compare сам знает как сравнить открытый пароль с хэшем
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
