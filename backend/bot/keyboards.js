// ============================================================
// bot/keyboards.js — Клавиатуры Telegram-бота
//
// Telegraf поддерживает два типа клавиатур:
// - Markup.keyboard()      → reply keyboard (кнопки вместо клавиатуры устройства)
// - Markup.inlineKeyboard() → inline keyboard (кнопки прямо под сообщением)
// ============================================================

const { Markup } = require('telegraf');

// Reply-клавиатура для обычного пользователя (показывается после /start)
const mainReplyKeyboard = (isAdmin = false) => {
  const rows = [
    ['📋 Мои образцы', 'ℹ️ Профиль'],
    ['❓ Помощь'],
  ];
  if (isAdmin) {
    rows.push(['🛠 Админ-панель']);
  }
  return Markup.keyboard(rows).resize();
};

// Inline-клавиатура для пагинации списка образцов
// action-кодировка: samples:<page>
const samplesPaginationKeyboard = (page, totalPages) => {
  const buttons = [];
  if (page > 1) buttons.push(Markup.button.callback('⬅️ Назад', `samples:${page - 1}`));
  if (page < totalPages) buttons.push(Markup.button.callback('Вперёд ➡️', `samples:${page + 1}`));
  return Markup.inlineKeyboard(buttons.length ? [buttons] : []);
};

// Inline-меню админ-панели
const adminMenuKeyboard = () => Markup.inlineKeyboard([
  [Markup.button.callback('📊 Статистика', 'admin:stats')],
  [Markup.button.callback('👥 Пользователи', 'admin:users:1')],
  [Markup.button.callback('📢 Рассылка', 'admin:broadcast')],
]);

// Inline-клавиатура для пагинации списка пользователей (админка)
const usersPaginationKeyboard = (page, totalPages) => {
  const buttons = [];
  if (page > 1) buttons.push(Markup.button.callback('⬅️', `admin:users:${page - 1}`));
  if (page < totalPages) buttons.push(Markup.button.callback('➡️', `admin:users:${page + 1}`));
  return Markup.inlineKeyboard(buttons.length ? [buttons] : []);
};

module.exports = {
  mainReplyKeyboard,
  samplesPaginationKeyboard,
  adminMenuKeyboard,
  usersPaginationKeyboard,
};
