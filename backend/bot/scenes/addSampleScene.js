// ============================================================
// bot/scenes/addSampleScene.js — Мастер добавления образца (бонус ТЗ п.9)
//
// WizardScene — Telegraf проводит пользователя по шагам,
// на каждом шаге сохраняет ответ в ctx.wizard.state и идёт дальше.
// Отменить в любой момент: /cancel
// ============================================================

const { Scenes, Markup } = require('telegraf');
const LandSample = require('../../models/landSampleModel');
const { findLinkedUser } = require('../commands/user');

const ask = (ctx, text) => ctx.reply(text, Markup.removeKeyboard());

const isCancel = (ctx) => ctx.message?.text === '/cancel';

const addSampleScene = new Scenes.WizardScene(
  'addSample',

  // Шаг 0 — старт, проверяем привязку аккаунта, спрашиваем название
  async (ctx) => {
    const user = await findLinkedUser(ctx.from.id);
    if (!user) {
      await ctx.reply('Сначала привяжи аккаунт: /link email пароль');
      return ctx.scene.leave();
    }
    ctx.wizard.state.userId = user._id;
    await ask(ctx, '🌱 Добавляем новый образец земли.\nШаг 1/6 — название участка:\n\n(/cancel — отменить в любой момент)');
    return ctx.wizard.next();
  },

  // Шаг 1 — название → координата lat
  async (ctx) => {
    if (isCancel(ctx)) { await ctx.reply('Отменено.'); return ctx.scene.leave(); }
    ctx.wizard.state.title = ctx.message.text;
    await ask(ctx, 'Шаг 2/6 — широта (lat), число от -90 до 90:');
    return ctx.wizard.next();
  },

  // Шаг 2 — lat → lng
  async (ctx) => {
    if (isCancel(ctx)) { await ctx.reply('Отменено.'); return ctx.scene.leave(); }
    const lat = parseFloat(ctx.message.text);
    if (isNaN(lat) || lat < -90 || lat > 90) {
      await ctx.reply('Некорректное значение. Введи число от -90 до 90:');
      return;
    }
    ctx.wizard.state.lat = lat;
    await ask(ctx, 'Шаг 3/6 — долгота (lng), число от -180 до 180:');
    return ctx.wizard.next();
  },

  // Шаг 3 — lng → NDVI
  async (ctx) => {
    if (isCancel(ctx)) { await ctx.reply('Отменено.'); return ctx.scene.leave(); }
    const lng = parseFloat(ctx.message.text);
    if (isNaN(lng) || lng < -180 || lng > 180) {
      await ctx.reply('Некорректное значение. Введи число от -180 до 180:');
      return;
    }
    ctx.wizard.state.lng = lng;
    await ask(ctx, 'Шаг 4/6 — индекс NDVI, число от -1 до 1:');
    return ctx.wizard.next();
  },

  // Шаг 4 — NDVI → влажность
  async (ctx) => {
    if (isCancel(ctx)) { await ctx.reply('Отменено.'); return ctx.scene.leave(); }
    const ndvi = parseFloat(ctx.message.text);
    if (isNaN(ndvi) || ndvi < -1 || ndvi > 1) {
      await ctx.reply('Некорректное значение. Введи число от -1 до 1:');
      return;
    }
    ctx.wizard.state.ndvi = ndvi;
    await ask(ctx, 'Шаг 5/6 — влажность почвы, % (0–100):');
    return ctx.wizard.next();
  },

  // Шаг 5 — влажность → индекс качества почвы
  async (ctx) => {
    if (isCancel(ctx)) { await ctx.reply('Отменено.'); return ctx.scene.leave(); }
    const moisture = parseFloat(ctx.message.text);
    if (isNaN(moisture) || moisture < 0 || moisture > 100) {
      await ctx.reply('Некорректное значение. Введи число от 0 до 100:');
      return;
    }
    ctx.wizard.state.soilMoisture = moisture;
    await ask(ctx, 'Шаг 6/6 — содержание органического вещества, % (0–20):');
    return ctx.wizard.next();
  },

  // Шаг 6 — органика → сохраняем образец
  async (ctx) => {
    if (isCancel(ctx)) { await ctx.reply('Отменено.'); return ctx.scene.leave(); }
    const organicMatter = parseFloat(ctx.message.text);
    if (isNaN(organicMatter) || organicMatter < 0 || organicMatter > 20) {
      await ctx.reply('Некорректное значение. Введи число от 0 до 20:');
      return;
    }

    const state = ctx.wizard.state;
    try {
      const sample = await LandSample.create({
        userId: state.userId,
        title: state.title,
        coordinates: { lat: state.lat, lng: state.lng },
        ndvi: state.ndvi,
        soilMoisture: state.soilMoisture,
        // Индекс качества почвы отдельно не спрашивали в мастере —
        // берём как производную от NDVI и влажности, пользователь может
        // уточнить точное значение на сайте позже.
        soilQualityIndex: Math.round(((state.ndvi + 1) / 2) * 100),
        organicMatter,
        sampledAt: Date.now(),
      });
      await ctx.reply(`✅ Образец "${sample.title}" сохранён! Посмотреть: /items`);
    } catch (err) {
      await ctx.reply('❌ Не удалось сохранить образец: ' + err.message);
    }

    return ctx.scene.leave();
  }
);

module.exports = addSampleScene;
