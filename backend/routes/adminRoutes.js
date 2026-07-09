// ============================================================
// routes/adminRoutes.js — Маршруты Admin Dashboard
// Все защищены: protect (валидный JWT) + adminOnly (role === 'admin')
// ============================================================

const express = require('express');
const router = express.Router();
const { getStats, getUsers, updateUserRole } = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.use(protect, adminOnly);

router.get('/stats', getStats);
router.get('/users', getUsers);
router.put('/users/:id/role', updateUserRole);

module.exports = router;
