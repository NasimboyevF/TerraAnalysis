// ============================================================
// bot/commands/user.js — Команды для обычных пользователей
//
// /start   — приветствие
// /help    — список команд
// /link    — привязать Telegram к аккаунту сайта (email + пароль)
// /info    — профиль привязанного пользователя
// /items   — список образцов земли (аналог /products из ТЗ)
// ============================================================

const User = require('../../models/userModel');
const LandSample = require('../../models/landSampleModel');
const { mainReplyKeyboard, samplesPaginationKeyboard } = require('../keyboards');

const PAGE_SIZE = 5;

// Находит пользователя сайта, привязанного к этому Telegram-аккаунту
const findLinkedUser = async (telegramId) => {
  return User.findOne({ telegramId });
};

const registerUserCommands = (bot) => {
  // ─────────────────────────────────────────
  // /start
  // ─────────────────────────────────────────
  bot.start(async (ctx) => {
    const linked = await findLinkedUser(ctx.from.id);
    await ctx.reply(
      `👋 Привет, ${ctx.from.first_name}!\n\n` +
      `Это бот системы мониторинга деградации земли.\n\n` +
      (linked
        ? `Ты уже привязан как *${linked.name}* (${linked.email}).`
        : `Чтобы пользоваться ботом, сначала привяжи аккаунт сайта:\n` +
          `\`/link email пароль\``),
      { parse_mode: 'Markdown', ...mainReplyKeyboard(linked?.role === 'admin') }
    );
  });

  // ─────────────────────────────────────────
  // /help
  // ─────────────────────────────────────────
  const helpText =
    '*Доступные команды:*\n\n' +
    '/start — начать работу с ботом\n' +
    '/link email пароль — привязать аккаунт сайта\n' +
    '/info — мой профиль\n' +
    '/items — список моих образцов земли\n' +
    '/addsample — добавить образец пошагово (мастер)\n' +
    '/help — это сообщение\n\n' +
    '_Команды администратора смотри через /admin (доступно только админам)._';

  bot.help((ctx) => ctx.replyWithMarkdown(helpText));
  bot.hears('❓ Помощь', (ctx) => ctx.replyWithMarkdown(helpText));

  // ─────────────────────────────────────────
  // /link email пароль
  // Простая привязка Telegram-аккаунта к пользователю сайта.
  // Пользователь присылает свои учётные данные с сайта прямо в чат —
  // бот проверяет их так же, как обычный /api/auth/login.
  // ─────────────────────────────────────────
  bot.command('link', async (ctx) => {
    const parts = ctx.message.text.split(' ').filter(Boolean);
    const [, email, password] = parts;

    // Пытаемся удалить сообщение с паролем из чата ради безопасности
    ctx.deleteMessage(ctx.message.message_id).catch(() => {});

    if (!email || !password) {
      return ctx.reply('Использование: /link email пароль\nНапример: /link ivan@mail.com mypassword');
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return ctx.reply('❌ Пользователь с таким email не найден.');
    }

    const isCorrect = await user.comparePassword(password);
    if (!isCorrect) {
      return ctx.reply('❌ Неверный пароль.');
    }

    // Проверяем что этот Telegram-аккаунт ещё ни к кому не привязан
    const alreadyLinked = await User.findOne({ telegramId: ctx.from.id });
    if (alreadyLinked && String(alreadyLinked._id) !== String(user._id)) {
      return ctx.reply('❌ Этот Telegram-аккаунт уже привязан к другому пользователю.');
    }

    user.telegramId = ctx.from.id;
    user.telegramUsername = ctx.from.username || '';
    await user.save();

    await ctx.reply(
      `✅ Аккаунт успешно привязан!\nДобро пожаловать, ${user.name}.`,
      mainReplyKeyboard(user.role === 'admin')
    );
  });

  // ─────────────────────────────────────────
  // /info — профиль
  // ─────────────────────────────────────────
  const sendInfo = async (ctx) => {
    const user = await findLinkedUser(ctx.from.id);
    if (!user) {
      return ctx.reply('Сначала привяжи аккаунт: /link email пароль');
    }
    const samplesCount = await LandSample.countDocuments({ userId: user._id });
    await ctx.replyWithMarkdown(
      `*Профиль*\n\n` +
      `👤 Имя: ${user.name}\n` +
      `📧 Email: ${user.email}\n` +
      `🛡 Роль: ${user.role === 'admin' ? 'администратор' : 'пользователь'}\n` +
      `🌱 Образцов создано: ${samplesCount}\n` +
      `📅 Зарегистрирован: ${user.createdAt.toLocaleDateString('ru-RU')}`
    );
  };
  bot.command('info', sendInfo);
  bot.hears('ℹ️ Профиль', sendInfo);

  // ─────────────────────────────────────────
  // /items (он же /products из ТЗ) — список образцов с пагинацией
  // ─────────────────────────────────────────
  const sendItemsPage = async (ctx, page = 1) => {
    const user = await findLinkedUser(ctx.from.id);
    if (!user) {
      return ctx.reply('Сначала привяжи аккаунт: /link email пароль');
    }

    const total = await LandSample.countDocuments({ userId: user._id });
    const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1);
    const samples = await LandSample.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE);

    if (!samples.length) {
      return ctx.reply('У тебя пока нет образцов земли. Добавь через сайт или командой /addsample.');
    }

    const text =
      `*Мои образцы* (стр. ${page}/${totalPages})\n\n` +
      samples
        .map((s, i) => `${(page - 1) * PAGE_SIZE + i + 1}. *${s.title}* — NDVI ${s.ndvi}, качество почвы ${s.soilQualityIndex}`)
        .join('\n');

    const keyboard = samplesPaginationKeyboard(page, totalPages);
    if (ctx.updateType === 'callback_query') {
      await ctx.editMessageText(text, { parse_mode: 'Markdown', ...keyboard });
    } else {
      await ctx.replyWithMarkdown(text, keyboard);
    }
  };

  bot.command(['items', 'products'], (ctx) => sendItemsPage(ctx, 1));
  bot.hears('📋 Мои образцы', (ctx) => sendItemsPage(ctx, 1));

  // Обработка нажатий "Назад/Вперёд" на клавиатуре пагинации
  bot.action(/^samples:(\d+)$/, async (ctx) => {
    const page = parseInt(ctx.match[1], 10);
    await ctx.answerCbQuery();
    await sendItemsPage(ctx, page);
  });
};

module.exports = { registerUserCommands, findLinkedUser };
