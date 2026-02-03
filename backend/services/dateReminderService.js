

const db = require('../config/db');
const Notification = require('../model/NotificationModel');

function checkDateReminders() {
  console.log('[DATE REMINDER] Checking for approaching dates...');
  
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const todayStr = today.toISOString().split('T')[0];
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const sql = `
    SELECT 
      oi.item_id as order_item_id,
      oi.appointment_date,
      oi.service_type,
      oi.approval_status,
      o.user_id,
      DATE_FORMAT(oi.appointment_date, '%Y-%m-%d') as formatted_date
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.order_id
    WHERE oi.appointment_date IS NOT NULL
      AND DATE(oi.appointment_date) IN (?, ?)
      AND oi.approval_status NOT IN ('cancelled', 'completed', 'price_declined')
  `;
  
  db.query(sql, [todayStr, tomorrowStr], (err, results) => {
    if (err) {
      console.error('[DATE REMINDER] Error fetching dates:', err);
      return;
    }
    
    if (results.length === 0) {
      console.log('[DATE REMINDER] No approaching dates found');
      return;
    }
    
    console.log(`[DATE REMINDER] Found ${results.length} items with approaching dates`);
    
    results.forEach(item => {
      const appointmentDate = new Date(item.appointment_date);
      const isToday = appointmentDate.toISOString().split('T')[0] === todayStr;
      const isTomorrow = appointmentDate.toISOString().split('T')[0] === tomorrowStr;

      let dateType = 'pickup'; 
      if (item.approval_status === 'pending' || item.approval_status === 'accepted') {
        dateType = 'drop_off';
      } else if (item.approval_status === 'in_progress' || item.approval_status === 'ready_to_pickup') {
        dateType = 'pickup';
      } else if (item.service_type === 'customize' && item.approval_status === 'pending') {
        dateType = 'sizing';
      }

      const checkSql = `
        SELECT * FROM notifications
        WHERE order_item_id = ? AND type = 'date_reminder'
          AND DATE(created_at) = CURDATE()
      `;
      
      db.query(checkSql, [item.order_item_id], (checkErr, existingNotif) => {
        if (checkErr) {
          console.error('[DATE REMINDER] Error checking existing notification:', checkErr);
          return;
        }

        if (!existingNotif || existingNotif.length === 0) {
          const serviceType = (item.service_type || 'customize').toLowerCase().trim();
          const timeText = isToday ? 'today' : 'tomorrow';
          
          Notification.createPreferredDateReminderNotification(
            item.user_id,
            item.order_item_id,
            item.appointment_date,
            dateType,
            serviceType,
            (notifErr) => {
              if (notifErr) {
                console.error('[DATE REMINDER] Failed to create reminder:', notifErr);
              } else {
                console.log(`[DATE REMINDER] Created ${dateType} reminder for order item ${item.order_item_id} (${timeText})`);
              }
            }
          );
        } else {
          console.log(`[DATE REMINDER] Reminder already exists for order item ${item.order_item_id}`);
        }
      });
    });
  });
}

module.exports = {
  checkDateReminders
};

if (require.main === module) {
  checkDateReminders();
  setTimeout(() => {
    process.exit(0);
  }, 5000);
}

