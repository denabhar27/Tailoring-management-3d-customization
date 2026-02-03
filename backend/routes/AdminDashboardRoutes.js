const express = require('express');
const router = express.Router();
const { verifyToken, requireAdmin } = require('../middleware/AuthToken');
const AdminDashboardController = require('../controller/AdminDashboardController');

router.use(verifyToken);

router.get('/dashboard', requireAdmin, AdminDashboardController.getDashboardOverview);

module.exports = router;
