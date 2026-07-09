// ============================================================
// bot/notify.js — Уведомления из контроллеров через бота
//
// Контроллеры (authController, reportController) вызывают эти функции
// после успешных действий, чтобы отправить уведомление в Telegram.
// Модуль намеренно не падает если бот выключен (BOT_TOKEN не задан) —
// это позволяет разрабатывать backend без обязательного запуска бота.
// ============================================================

const User = require('../models/userModel');

let botInstance = null;

// Вызывается один раз из bot/index.js после создания бота
const attachBot = (bot) => {
  botInstance = bot;
};

const safeSend = async (telegramId, text, extra) => {
  if (!botInstance || !telegramId) return;
  try {
    await botInstance.telegram.sendMessage(telegramId, text, extra);
  } catch (err) {
    console.error(`⚠️ Не удалось отправить Telegram-уведомление (${telegramId}):`, err.message);
  }
};

// Уведомляет всех привязанных админов
const notifyAdmins = async (text) => {
  if (!botInstance) return;
  const admins = await User.find({ role: 'admin', telegramId: { $ne: null } }).select('telegramId');
  await Promise.all(admins.map((a) => safeSend(a.telegramId, text, { parse_mode: 'Markdown' })));
};

// Уведомляет конкретного пользователя, если у него привязан Telegram
const notifyUser = async (userId, text) => {
  if (!botInstance) return;
  const user = await User.findById(userId).select('telegramId');
  if (user?.telegramId) {
    await safeSend(user.telegramId, text, { parse_mode: 'Markdown' });
  }
};

module.exports = { attachBot, notifyAdmins, notifyUser };
