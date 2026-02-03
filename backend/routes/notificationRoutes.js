const express = require('express');
const router = express.Router();
const notificationController = require('../controller/NotificationController');
const { verifyToken } = require('../middleware/AuthToken');

router.use(verifyToken);

router.get('/', notificationController.getUserNotifications);

router.get('/unread-count', notificationController.getUnreadCount);

router.put('/:notificationId/read', notificationController.markAsRead);

router.put('/read-all', notificationController.markAllAsRead);

router.delete('/:notificationId', notificationController.deleteNotification);

router.delete('/', notificationController.deleteAllNotifications);

module.exports = router;
