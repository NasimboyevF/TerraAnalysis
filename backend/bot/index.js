// ============================================================
// bot/index.js — Точка входа Telegram-бота
//
// Бот работает в ТОМ ЖЕ процессе, что и Express-сервер (см. server.js),
// используя то же mongoose-соединение. Это самый простой вариант
// для уровня этого ТЗ; при желании бот можно вынести в отдельный
// процесс/сервис — тогда просто запускать этот файл отдельным `node`.
//
// Режимы запуска:
// - development (по умолчанию) → long polling, ничего дополнительно настраивать не нужно
// - production, если задан BOT_WEBHOOK_URL → webhook (бот сам регистрирует URL в Telegram)
// ============================================================

const { Telegraf, Scenes, session } = require('telegraf');

const { registerUserCommands } = require('./commands/user');
const { registerAdminCommands } = require('./commands/admin');
const addSampleScene = require('./scenes/addSampleScene');
const { attachBot } = require('./notify');

let bot = null;

const createBot = () => {
  if (!process.env.BOT_TOKEN) {
    console.warn('⚠️  BOT_TOKEN не задан в .env — Telegram-бот не будет запущен.');
    return null;
  }

  bot = new Telegraf(process.env.BOT_TOKEN);

  // Сцены (wizard) требуют session middleware — хранит текущий шаг диалога
  const stage = new Scenes.Stage([addSampleScene]);
  bot.use(session());
  bot.use(stage.middleware());

  bot.command('addsample', (ctx) => ctx.scene.enter('addSample'));
  bot.command('cancel', (ctx) => {
    if (ctx.scene?.current) {
      ctx.scene.leave();
      return ctx.reply('Отменено.');
    }
  });

  registerUserCommands(bot);
  registerAdminCommands(bot);

  // Ловим ошибки в хендлерах, чтобы одно упавшее сообщение не роняло бота целиком
  bot.catch((err, ctx) => {
    console.error(`❌ Ошибка бота при обработке ${ctx.updateType}:`, err);
    ctx.reply('Произошла ошибка, попробуй ещё раз.').catch(() => {});
  });

  attachBot(bot);
  return bot;
};

const launchBot = async () => {
  const instance = createBot();
  if (!instance) return null;

  const webhookUrl = process.env.BOT_WEBHOOK_URL; // например https://your-backend.onrender.com/bot-webhook

  if (webhookUrl) {
    // ─────────────────────────────────────────
    // PRODUCTION: webhook
    // Telegram сам будет стучаться на этот URL при новых сообщениях.
    // Путь /bot-webhook нужно навесить в server.js через:
    //   app.use(bot.webhookCallback('/bot-webhook'))
    // ─────────────────────────────────────────
    await instance.telegram.setWebhook(webhookUrl);
    console.log(`🤖 Telegram-бот запущен в режиме webhook: ${webhookUrl}`);
  } else {
    // ─────────────────────────────────────────
    // DEVELOPMENT: long polling
    // ─────────────────────────────────────────
    await instance.launch();
    console.log('🤖 Telegram-бот запущен в режиме polling');

    // Аккуратное завершение при остановке процесса
    process.once('SIGINT', () => instance.stop('SIGINT'));
    process.once('SIGTERM', () => instance.stop('SIGTERM'));
  }

  return instance;
};

module.exports = { launchBot, getBot: () => bot };
