/** @type {import('tailwindcss').Config} */
export default {
  // darkMode: 'class' означает что тёмная тема включается добавлением класса 'dark' на <html>
  // Zustand store будет управлять этим классом
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Основные цвета системы
        earth: {
          50: '#fdf8f0',
          100: '#f9edd6',
          500: '#c4712a',
          600: '#a85d1f',
          700: '#8c4a16',
        },
        degradation: {
          low: '#22c55e',       // Зелёный — низкий уровень деградации
          moderate: '#eab308',  // Жёлтый — умеренный
          high: '#f97316',      // Оранжевый — высокий
          critical: '#ef4444',  // Красный — критический
        },
      },
    },
  },
  plugins: [],
}
