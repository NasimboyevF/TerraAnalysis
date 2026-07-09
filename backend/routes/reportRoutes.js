// ============================================================
// routes/reportRoutes.js — Маршруты для отчётов о деградации
// ============================================================

const express = require('express');
const router = express.Router();
const {
  getReports,
  getReportById,
  createReport,
  deleteReport,
} = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getReports);          // GET /api/reports
router.get('/:id', getReportById);    // GET /api/reports/:id
router.post('/', createReport);       // POST /api/reports  { sampleId }
router.delete('/:id', deleteReport);  // DELETE /api/reports/:id

module.exports = router;
