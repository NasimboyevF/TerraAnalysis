// ============================================================
// config/db.js — Подключение к MongoDB
//
// MongoDB — документоориентированная база данных.
// Данные хранятся локально на вашем компьютере в виде файлов:
//   Linux/Mac: /var/lib/mongodb/ или ~/.local/share/mongodb/
//   Windows:   C:\data\db\
//
// При первом запуске MongoDB автоматически создаёт все нужные файлы.
// Ничего настраивать вручную не нужно — просто убедитесь что
// служба MongoDB запущена на компьютере.
// ============================================================

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Подключаемся к MongoDB по адресу из .env файла
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // useNewUrlParser и useUnifiedTopology убирают предупреждения в консоли
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ MongoDB подключена: ${conn.connection.host}`);
    console.log(`📂 База данных: ${conn.connection.name}`);
    console.log(`💾 Данные хранятся локально на вашем компьютере\n`);
  } catch (error) {
    console.error('❌ Ошибка подключения к MongoDB:', error.message);
    console.error('💡 Убедитесь что MongoDB запущена:');
    console.error('   Linux/Mac: sudo systemctl start mongod');
    console.error('   Windows:   запустите MongoDB Compass или службу mongod');
    // Завершаем процесс с кодом ошибки — нет смысла запускать сервер без БД
    process.exit(1);
  }
};

module.exports = connectDB;
