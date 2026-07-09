// ============================================================
// routes/sampleRoutes.js — Маршруты для образцов земли
// Все маршруты защищены — требуют авторизации
// ============================================================

const express = require('express');
const router = express.Router();
const {
  getSamples,
  getSampleById,
  createSample,
  updateSample,
  deleteSample,
} = require('../controllers/sampleController');
const { protect } = require('../middleware/authMiddleware');

// Применяем protect ко ВСЕМ маршрутам этого роутера одной строкой
router.use(protect);

router.get('/', getSamples);           // GET /api/samples?page=1&limit=10
router.get('/:id', getSampleById);     // GET /api/samples/:id
router.post('/', createSample);        // POST /api/samples
router.put('/:id', updateSample);      // PUT /api/samples/:id
router.delete('/:id', deleteSample);   // DELETE /api/samples/:id

module.exports = router;
