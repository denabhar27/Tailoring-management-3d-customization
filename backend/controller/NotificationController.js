const Notification = require('../model/NotificationModel');

exports.getUserNotifications = (req, res) => {
  const userId = req.user.id;

  Notification.getByUserId(userId, (err, results) => {
    if (err) {
      console.error('Get notifications error:', err);
      return res.status(500).json({
        success: false,
        message: 'Error fetching notifications',
        error: err
      });
    }

    res.json({
      success: true,
      message: 'Notifications retrieved successfully',
      data: results
    });
  });
};

exports.getUnreadCount = (req, res) => {
  const userId = req.user.id;

  Notification.getUnreadCount(userId, (err, results) => {
    if (err) {
      console.error('Get unread count error:', err);
      return res.status(500).json({
        success: false,
        message: 'Error fetching unread count',
        error: err
      });
    }

    res.json({
      success: true,
      message: 'Unread count retrieved successfully',
      count: results[0]?.unread_count || 0
    });
  });
};

exports.markAsRead = (req, res) => {
  const userId = req.user.id;
  const { notificationId } = req.params;

  Notification.markAsRead(notificationId, userId, (err, result) => {
    if (err) {
      console.error('Mark as read error:', err);
      return res.status(500).json({
        success: false,
        message: 'Error marking notification as read',
        error: err
      });
    }

    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  });
};

exports.markAllAsRead = (req, res) => {
  const userId = req.user.id;

  Notification.markAllAsRead(userId, (err, result) => {
    if (err) {
      console.error('Mark all as read error:', err);
      return res.status(500).json({
        success: false,
        message: 'Error marking all notifications as read',
        error: err
      });
    }

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  });
};

exports.deleteNotification = (req, res) => {
  const userId = req.user.id;
  const { notificationId } = req.params;

  Notification.delete(notificationId, userId, (err, result) => {
    if (err) {
      console.error('Delete notification error:', err);
      return res.status(500).json({
        success: false,
        message: 'Error deleting notification',
        error: err
      });
    }

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  });
};

exports.deleteAllNotifications = (req, res) => {
  const userId = req.user.id;

  Notification.deleteAll(userId, (err, result) => {
    if (err) {
      console.error('Delete all notifications error:', err);
      return res.status(500).json({
        success: false,
        message: 'Error deleting all notifications',
        error: err
      });
    }

    res.json({
      success: true,
      message: 'All notifications deleted successfully'
    });
  });
};

module.exports = exports;
