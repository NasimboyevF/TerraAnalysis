// ============================================================
// bot/commands/admin.js — Команды администратора
//
// /admin      — открыть админ-панель (inline меню)
// /stats      — общая статистика по системе
// /broadcast  — разослать сообщение всем привязанным пользователям
// /users      — список пользователей с ролями
// /promote    — (бонус) назначить другого пользователя админом
//
// Все команды защищены проверкой role === 'admin' у Telegram-аккаунта,
// который должен быть предварительно привязан через /link.
// ============================================================

const User = require('../../models/userModel');
const LandSample = require('../../models/landSampleModel');
const Report = require('../../models/reportModel');
const { findLinkedUser } = require('./user');
const { adminMenuKeyboard, usersPaginationKeyboard } = require('../keyboards');

const USERS_PAGE_SIZE = 8;

// Middleware-подобная проверка: пропускает только привязанных админов
const requireAdmin = async (ctx) => {
  const user = await findLinkedUser(ctx.from.id);
  if (!user) {
    await ctx.reply('Сначала привяжи аккаунт: /link email пароль');
    return null;
  }
  if (user.role !== 'admin') {
    await ctx.reply('⛔ Доступно только администраторам.');
    return null;
  }
  return user;
};

const buildStatsText = async () => {
  const [usersCount, adminsCount, samplesCount, reportsCount, linkedCount] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'admin' }),
    LandSample.countDocuments(),
    Report.countDocuments(),
    User.countDocuments({ telegramId: { $ne: null } }),
  ]);

  const bySeverity = await Report.aggregate([
    { $group: { _id: '$severity', count: { $sum: 1 } } },
  ]);
  const severityLines = bySeverity
    .map((s) => `   • ${s._id}: ${s.count}`)
    .join('\n') || '   нет данных';

  return (
    `*📊 Статистика системы*\n\n` +
    `👥 Пользователей всего: ${usersCount}\n` +
    `🛡 Из них админов: ${adminsCount}\n` +
    `🔗 Привязали Telegram: ${linkedCount}\n` +
    `🌱 Образцов земли: ${samplesCount}\n` +
    `📄 Отчётов создано: ${reportsCount}\n\n` +
    `*Отчёты по уровню деградации:*\n${severityLines}`
  );
};

const registerAdminCommands = (bot) => {
  // ─────────────────────────────────────────
  // /admin — открыть меню
  // ─────────────────────────────────────────
  const openAdminMenu = async (ctx) => {
    const admin = await requireAdmin(ctx);
    if (!admin) return;
    await ctx.replyWithMarkdown(`🛠 *Админ-панель*\nВыбери раздел:`, adminMenuKeyboard());
  };
  bot.command('admin', openAdminMenu);
  bot.hears('🛠 Админ-панель', openAdminMenu);

  bot.action('admin:stats', async (ctx) => {
    const admin = await requireAdmin(ctx);
    if (!admin) return ctx.answerCbQuery();
    await ctx.answerCbQuery();
    await ctx.replyWithMarkdown(await buildStatsText());
  });

  // ─────────────────────────────────────────
  // /stats — та же статистика напрямую командой
  // ─────────────────────────────────────────
  bot.command('stats', async (ctx) => {
    const admin = await requireAdmin(ctx);
    if (!admin) return;
    await ctx.replyWithMarkdown(await buildStatsText());
  });

  // ─────────────────────────────────────────
  // /users и меню "Пользователи" — список с пагинацией
  // ─────────────────────────────────────────
  const sendUsersPage = async (ctx, page = 1) => {
    const total = await User.countDocuments();
    const totalPages = Math.max(Math.ceil(total / USERS_PAGE_SIZE), 1);
    const users = await User.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * USERS_PAGE_SIZE)
      .limit(USERS_PAGE_SIZE);

    const text =
      `*👥 Пользователи* (стр. ${page}/${totalPages})\n\n` +
      users
        .map((u, i) => {
          const roleTag = u.role === 'admin' ? '🛡 admin' : 'user';
          const linkedTag = u.telegramId ? '🔗' : '';
          return `${(page - 1) * USERS_PAGE_SIZE + i + 1}. ${u.name} — ${u.email} [${roleTag}] ${linkedTag}`;
        })
        .join('\n');

    const keyboard = usersPaginationKeyboard(page, totalPages);
    if (ctx.updateType === 'callback_query') {
      await ctx.editMessageText(text, { parse_mode: 'Markdown', ...keyboard });
    } else {
      await ctx.replyWithMarkdown(text, keyboard);
    }
  };

  bot.command('users', async (ctx) => {
    const admin = await requireAdmin(ctx);
    if (!admin) return;
    await sendUsersPage(ctx, 1);
  });

  bot.action(/^admin:users:(\d+)$/, async (ctx) => {
    const admin = await requireAdmin(ctx);
    if (!admin) return ctx.answerCbQuery();
    await ctx.answerCbQuery();
    await sendUsersPage(ctx, parseInt(ctx.match[1], 10));
  });

  // ─────────────────────────────────────────
  // /broadcast текст — разослать всем привязанным пользователям
  // ─────────────────────────────────────────
  bot.command('broadcast', async (ctx) => {
    const admin = await requireAdmin(ctx);
    if (!admin) return;

    const text = ctx.message.text.replace(/^\/broadcast\s*/, '').trim();
    if (!text) {
      return ctx.reply('Использование: /broadcast текст сообщения');
    }

    const recipients = await User.find({ telegramId: { $ne: null } }).select('telegramId');
    let sent = 0;
    for (const r of recipients) {
      try {
        await ctx.telegram.sendMessage(r.telegramId, `📢 ${text}`);
        sent += 1;
      } catch (err) {
        // Пользователь мог заблокировать бота — пропускаем и продолжаем рассылку
        console.error(`Не удалось отправить broadcast пользователю ${r.telegramId}:`, err.message);
      }
    }
    await ctx.reply(`✅ Рассылка отправлена: ${sent}/${recipients.length}`);
  });

  bot.action('admin:broadcast', async (ctx) => {
    const admin = await requireAdmin(ctx);
    if (!admin) return ctx.answerCbQuery();
    await ctx.answerCbQuery();
    await ctx.reply('Отправь команду в формате:\n/broadcast текст сообщения');
  });

  // ─────────────────────────────────────────
  // /promote email — бонус: назначить нового админа (может делать только админ)
  // ─────────────────────────────────────────
  bot.command('promote', async (ctx) => {
    const admin = await requireAdmin(ctx);
    if (!admin) return;

    const email = ctx.message.text.split(' ')[1];
    if (!email) {
      return ctx.reply('Использование: /promote email');
    }

    const target = await User.findOne({ email: email.toLowerCase() });
    if (!target) {
      return ctx.reply('❌ Пользователь с таким email не найден.');
    }

    target.role = 'admin';
    await target.save();
    await ctx.reply(`✅ ${target.name} (${target.email}) теперь администратор.`);
  });
};

module.exports = { registerAdminCommands, requireAdmin };
