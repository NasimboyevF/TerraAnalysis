// ============================================================
// middleware/logger.js — Логирование HTTP запросов
//
// Middleware — это функция которая выполняется между получением
// запроса и отправкой ответа. Она имеет доступ к req, res и next.
//
// Этот логгер выводит в консоль информацию о каждом запросе:
// метод (GET/POST/etc), путь, статус ответа и время выполнения
// ============================================================

const logger = (req, res, next) => {
  // Запоминаем время начала обработки запроса
  const startTime = Date.now();

  // Перехватываем момент отправки ответа клиенту.
  // res.on('finish') срабатывает когда ответ полностью отправлен.
  res.on('finish', () => {
    // Считаем сколько миллисекунд ушло на обработку
    const duration = Date.now() - startTime;

    // Выбираем цвет в зависимости от HTTP статуса ответа
    // Это ANSI escape-коды для цветного вывода в терминале
    let statusColor;
    if (res.statusCode >= 500) {
      statusColor = '\x1b[31m'; // Красный — серверные ошибки
    } else if (res.statusCode >= 400) {
      statusColor = '\x1b[33m'; // Жёлтый — клиентские ошибки
    } else if (res.statusCode >= 300) {
      statusColor = '\x1b[36m'; // Голубой — редиректы
    } else {
      statusColor = '\x1b[32m'; // Зелёный — успешные запросы
    }

    const reset = '\x1b[0m'; // Сброс цвета
    const dim = '\x1b[2m';   // Приглушённый текст

    console.log(
      `${dim}[${new Date().toLocaleTimeString('ru-RU')}]${reset} ` +
      `\x1b[1m${req.method}\x1b[0m ${req.originalUrl} ` +
      `${statusColor}${res.statusCode}${reset} ` +
      `${dim}${duration}мс${reset}`
    );
  });

  // Передаём управление следующему middleware
  next();
};

module.exports = logger;
