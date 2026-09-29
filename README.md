# 🌱 Система мониторинга деградации земли

Клиент-серверное приложение для сбора, хранения и анализа данных о состоянии земельных участков.

## Стек
- **Frontend:** React (Vite) + Tailwind CSS + Zustand + Recharts + Leaflet
- **Backend:** Node.js + Express.js + MongoDB + Mongoose + JWT

---

## 🚀 Запуск проекта

### 1. Убедитесь что MongoDB запущена

```bash
# Linux / Mac
sudo systemctl start mongod

# Windows — откройте MongoDB Compass или запустите службу mongod
```

MongoDB автоматически создаст базу данных при первом запуске.
Данные хранятся локально на вашем компьютере (обычно в /var/lib/mongodb).

### 2. Настройте Backend

```bash
cd backend
cp .env.example .env
# Откройте .env и при необходимости поменяйте JWT_SECRET
npm install
npm run dev
```

Сервер запустится на http://localhost:5000

### 3. Настройте Frontend

```bash
cd frontend
npm install
npm run dev
```

Приложение откроется на http://localhost:5173

---

## 📁 Структура проекта

```
project/
├── backend/
│   ├── config/db.js              # Подключение к MongoDB
│   ├── controllers/              # Бизнес-логика эндпоинтов
│   ├── middleware/
│   │   ├── authMiddleware.js     # Проверка JWT токена
│   │   └── logger.js             # Логирование запросов
│   ├── models/                   # Mongoose схемы
│   ├── routes/                   # Маршруты API
│   ├── services/
│   │   └── degradationService.js # Формула вычисления деградации
│   └── server.js                 # Точка входа
│
└── frontend/
    └── src/
        ├── api/                  # axios instance и функции запросов
        ├── components/           # Переиспользуемые UI компоненты
        ├── pages/                # Страницы приложения
        ├── routes/               # PrivateRoute
        ├── store/authStore.js    # Zustand хранилище
        └── utils/helpers.js      # Вспомогательные функции
```

---

## 🔌 API Эндпоинты

| Метод | Путь | Описание | Auth |
|---|---|---|---|
| POST | /api/auth/register | Регистрация | — |
| POST | /api/auth/login | Вход (JWT) | — |
| GET | /api/auth/me | Текущий пользователь | ✓ |
| GET | /api/samples | Все образцы (пагинация) | ✓ |
| POST | /api/samples | Создать образец | ✓ |
| PUT | /api/samples/:id | Обновить образец | ✓ |
| DELETE | /api/samples/:id | Удалить образец | ✓ |
| GET | /api/reports | Все отчёты | ✓ |
| POST | /api/reports | Создать отчёт по образцу | ✓ |
| DELETE | /api/reports/:id | Удалить отчёт | ✓ |

---

## 🧮 Формула деградации

```
degradationScore = NDVI(35%) + SQI(30%) + moisture(20%) + organicMatter(15%)
```

- **0–25** → низкий уровень (🟢)
- **26–50** → умеренный (🟡)
- **51–75** → высокий (🟠)
- **76–100** → критический (🔴)
