

const db = require('../config/db');
const emailService = require('./emailService');
const Notification = require('../model/NotificationModel');

const PENALTY_RATE = parseInt(process.env.PENALTY_RATE_PER_DAY) || 100;

async function checkUpcomingRentalEnds() {
  console.log('[RENTAL MONITOR] Checking for upcoming rental end dates...');
  
  const sql = `
    SELECT 
      oi.item_id,
      oi.order_id,
      oi.rental_end_date,
      oi.approval_status,
      o.user_id,
      u.email,
      u.first_name,
      u.last_name,
      DATEDIFF(oi.rental_end_date, CURDATE()) as days_remaining,
      JSON_UNQUOTE(JSON_EXTRACT(oi.specific_data, '$.item_name')) as item_name
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.order_id
    JOIN user u ON o.user_id = u.user_id
    WHERE oi.service_type = 'rental'
      AND oi.approval_status IN ('rented', 'picked_up')
      AND oi.rental_end_date IS NOT NULL
      AND DATEDIFF(oi.rental_end_date, CURDATE()) BETWEEN 0 AND 3
  `;

  return new Promise((resolve, reject) => {
    db.query(sql, async (err, results) => {
      if (err) {
        console.error('[RENTAL MONITOR] Error fetching upcoming rentals:', err);
        reject(err);
        return;
      }

      if (results.length === 0) {
        console.log('[RENTAL MONITOR] No rentals ending soon');
        resolve({ remindersCount: 0 });
        return;
      }

      console.log(`[RENTAL MONITOR] Found ${results.length} rentals ending soon`);
      let remindersSent = 0;

      for (const rental of results) {
        try {
          
          const alreadySent = await hasReminderBeenSent(rental.item_id, 'reminder', rental.days_remaining);
          
          if (!alreadySent) {
            const userName = `${rental.first_name} ${rental.last_name}`;

            const emailSent = await emailService.sendRentalEndReminderEmail({
              userEmail: rental.email,
              userName: userName,
              itemName: rental.item_name || 'Rental Item',
              rentalEndDate: rental.rental_end_date,
              daysRemaining: rental.days_remaining,
              itemId: rental.item_id
            });

            if (emailSent) {
              
              await logEmailSent(rental.item_id, rental.user_id, 'reminder', rental.email, 
                `Rental ending in ${rental.days_remaining} day(s)`);

              await markReminderSent(rental.item_id, rental.user_id, 
                rental.days_remaining === 0 ? 'same_day' : `${rental.days_remaining}_day`);

              const title = rental.days_remaining === 0 
                ? '⏰ Your rental ends today!' 
                : `⏰ Rental ending in ${rental.days_remaining} day${rental.days_remaining > 1 ? 's' : ''}`;
              const message = `Your rental of "${rental.item_name || 'Rental Item'}" is ending soon. Please return the item by the due date to avoid late penalties (₱${PENALTY_RATE}/day).`;
              
              Notification.create(rental.user_id, rental.item_id, 'rental_reminder', title, message, (notifErr) => {
                if (notifErr) {
                  console.error('[RENTAL MONITOR] Failed to create notification:', notifErr);
                }
              });

              remindersSent++;
              console.log(`[RENTAL MONITOR] Reminder sent for item ${rental.item_id} to ${rental.email}`);
            }
          } else {
            console.log(`[RENTAL MONITOR] Reminder already sent for item ${rental.item_id} (${rental.days_remaining} days remaining)`);
          }
        } catch (error) {
          console.error(`[RENTAL MONITOR] Error processing rental ${rental.item_id}:`, error);
        }
      }

      console.log(`[RENTAL MONITOR] Sent ${remindersSent} rental end reminders`);
      resolve({ remindersCount: remindersSent });
    });
  });
}

async function checkOverdueRentals() {
  console.log('[RENTAL MONITOR] Checking for overdue rentals...');
  
  const sql = `
    SELECT 
      oi.item_id,
      oi.order_id,
      oi.rental_end_date,
      oi.final_price,
      oi.pricing_factors,
      oi.approval_status,
      o.user_id,
      u.email,
      u.first_name,
      u.last_name,
      DATEDIFF(CURDATE(), oi.rental_end_date) as days_overdue,
      JSON_UNQUOTE(JSON_EXTRACT(oi.specific_data, '$.item_name')) as item_name
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.order_id
    JOIN user u ON o.user_id = u.user_id
    WHERE oi.service_type = 'rental'
      AND oi.approval_status IN ('rented', 'picked_up')
      AND oi.rental_end_date IS NOT NULL
      AND CURDATE() > oi.rental_end_date
  `;

  return new Promise((resolve, reject) => {
    db.query(sql, async (err, results) => {
      if (err) {
        console.error('[RENTAL MONITOR] Error fetching overdue rentals:', err);
        reject(err);
        return;
      }

      if (results.length === 0) {
        console.log('[RENTAL MONITOR] No overdue rentals found');
        resolve({ overdueCount: 0, notificationsSent: 0 });
        return;
      }

      console.log(`[RENTAL MONITOR] Found ${results.length} overdue rentals`);
      let notificationsSent = 0;

      for (const rental of results) {
        try {
          const currentPenalty = rental.days_overdue * PENALTY_RATE;
          const userName = `${rental.first_name} ${rental.last_name}`;

          let reminderType = 'daily_overdue';
          if (rental.days_overdue === 1) reminderType = 'overdue_1';
          else if (rental.days_overdue === 3) reminderType = 'overdue_3';
          else if (rental.days_overdue === 7) reminderType = 'overdue_7';

          const alreadySent = await hasReminderBeenSent(rental.item_id, reminderType, 0);

          const shouldSendEmail = !alreadySent && (
            rental.days_overdue === 1 || 
            rental.days_overdue === 3 || 
            rental.days_overdue === 7 ||
            rental.days_overdue % 3 === 0 
          );

          if (shouldSendEmail) {
            
            const emailSent = await emailService.sendOverdueNotificationEmail({
              userEmail: rental.email,
              userName: userName,
              itemName: rental.item_name || 'Rental Item',
              rentalEndDate: rental.rental_end_date,
              daysOverdue: rental.days_overdue,
              currentPenalty: currentPenalty,
              itemId: rental.item_id
            });

            if (emailSent) {
              
              await logEmailSent(rental.item_id, rental.user_id, 'overdue', rental.email,
                `Overdue: ${rental.days_overdue} days, Penalty: ₱${currentPenalty}`);

              await markReminderSent(rental.item_id, rental.user_id, reminderType);
              
              notificationsSent++;
              console.log(`[RENTAL MONITOR] Overdue notification sent for item ${rental.item_id} (${rental.days_overdue} days overdue)`);
            }
          }

          const title = `🚨 Rental ${rental.days_overdue} Day${rental.days_overdue > 1 ? 's' : ''} Overdue!`;
          const message = `Your rental of "${rental.item_name || 'Rental Item'}" is ${rental.days_overdue} day(s) overdue. Current penalty: ₱${currentPenalty}. Please return immediately to avoid additional charges.`;
          
          Notification.create(rental.user_id, rental.item_id, 'overdue_warning', title, message, (notifErr) => {
            if (notifErr) {
              console.error('[RENTAL MONITOR] Failed to create overdue notification:', notifErr);
            }
          });

          await trackPenalty(rental.item_id, rental.user_id, rental.rental_end_date, rental.days_overdue, currentPenalty);

        } catch (error) {
          console.error(`[RENTAL MONITOR] Error processing overdue rental ${rental.item_id}:`, error);
        }
      }

      console.log(`[RENTAL MONITOR] Sent ${notificationsSent} overdue notifications`);
      resolve({ overdueCount: results.length, notificationsSent });
    });
  });
}

function getActiveRentalsWithPenalty(callback) {
  const sql = `
    SELECT 
      oi.item_id,
      oi.order_id,
      oi.rental_start_date,
      oi.rental_end_date,
      oi.final_price,
      oi.pricing_factors,
      oi.approval_status,
      oi.payment_status,
      o.user_id,
      u.email,
      u.first_name,
      u.last_name,
      CONCAT(u.first_name, ' ', u.last_name) as full_name,
      CASE 
        WHEN oi.rental_end_date IS NULL THEN 0
        WHEN CURDATE() > oi.rental_end_date THEN DATEDIFF(CURDATE(), oi.rental_end_date)
        ELSE 0
      END as days_overdue,
      CASE 
        WHEN oi.rental_end_date IS NULL THEN 0
        WHEN CURDATE() > oi.rental_end_date THEN DATEDIFF(CURDATE(), oi.rental_end_date) * ${PENALTY_RATE}
        ELSE 0
      END as calculated_penalty,
      CASE 
        WHEN oi.rental_end_date IS NULL THEN 'no_end_date'
        WHEN CURDATE() > oi.rental_end_date THEN 'overdue'
        WHEN CURDATE() = oi.rental_end_date THEN 'due_today'
        WHEN DATEDIFF(oi.rental_end_date, CURDATE()) <= 3 THEN 'due_soon'
        ELSE 'active'
      END as rental_status,
      JSON_UNQUOTE(JSON_EXTRACT(oi.specific_data, '$.item_name')) as item_name
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.order_id
    JOIN user u ON o.user_id = u.user_id
    WHERE oi.service_type = 'rental'
      AND oi.approval_status IN ('rented', 'picked_up', 'accepted', 'ready_to_pickup')
    ORDER BY 
      CASE 
        WHEN CURDATE() > oi.rental_end_date THEN 0
        WHEN CURDATE() = oi.rental_end_date THEN 1
        ELSE 2
      END,
      oi.rental_end_date ASC
  `;

  db.query(sql, callback);
}

function calculatePenalty(itemId, callback) {
  const sql = `
    SELECT 
      oi.item_id,
      oi.rental_end_date,
      oi.final_price,
      oi.approval_status,
      CASE 
        WHEN oi.rental_end_date IS NULL THEN 0
        WHEN CURDATE() > oi.rental_end_date THEN DATEDIFF(CURDATE(), oi.rental_end_date)
        ELSE 0
      END as days_overdue,
      CASE 
        WHEN oi.rental_end_date IS NULL THEN 0
        WHEN CURDATE() > oi.rental_end_date THEN DATEDIFF(CURDATE(), oi.rental_end_date) * ${PENALTY_RATE}
        ELSE 0
      END as penalty_amount
    FROM order_items oi
    WHERE oi.item_id = ? AND oi.service_type = 'rental'
  `;

  db.query(sql, [itemId], (err, results) => {
    if (err) {
      callback(err, null);
      return;
    }

    if (results.length === 0) {
      callback(null, { daysOverdue: 0, penaltyAmount: 0 });
      return;
    }

    callback(null, {
      daysOverdue: results[0].days_overdue,
      penaltyAmount: results[0].penalty_amount,
      rentalEndDate: results[0].rental_end_date,
      finalPrice: results[0].final_price
    });
  });
}

function hasReminderBeenSent(itemId, type, daysRemaining) {
  return new Promise((resolve) => {
    const reminderType = type === 'reminder' 
      ? (daysRemaining === 0 ? 'same_day' : `${daysRemaining}_day`)
      : type;
    
    const sql = `
      SELECT * FROM rental_reminders_sent 
      WHERE order_item_id = ? AND reminder_type = ? AND reminder_date = CURDATE()
    `;
    
    db.query(sql, [itemId, reminderType], (err, results) => {
      if (err) {
        console.error('[RENTAL MONITOR] Error checking reminder status:', err);
        resolve(false); 
        return;
      }
      resolve(results.length > 0);
    });
  });
}

function markReminderSent(itemId, userId, reminderType) {
  return new Promise((resolve) => {
    const sql = `
      INSERT IGNORE INTO rental_reminders_sent (order_item_id, user_id, reminder_type, reminder_date)
      VALUES (?, ?, ?, CURDATE())
    `;
    
    db.query(sql, [itemId, userId, reminderType], (err) => {
      if (err) {
        console.error('[RENTAL MONITOR] Error marking reminder as sent:', err);
      }
      resolve();
    });
  });
}

function logEmailSent(itemId, userId, emailType, recipientEmail, subject) {
  return new Promise((resolve) => {
    const sql = `
      INSERT INTO rental_email_logs (order_item_id, user_id, email_type, email_status, recipient_email, subject, sent_at)
      VALUES (?, ?, ?, 'sent', ?, ?, NOW())
    `;
    
    db.query(sql, [itemId, userId, emailType, recipientEmail, subject], (err) => {
      if (err) {
        console.error('[RENTAL MONITOR] Error logging email:', err);
      }
      resolve();
    });
  });
}

function trackPenalty(itemId, userId, rentalEndDate, daysOverdue, penaltyAmount) {
  return new Promise((resolve) => {
    const sql = `
      INSERT INTO rental_penalty_tracking 
        (order_item_id, user_id, rental_end_date, check_date, days_overdue, penalty_amount, penalty_rate)
      VALUES (?, ?, ?, CURDATE(), ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        days_overdue = VALUES(days_overdue),
        penalty_amount = VALUES(penalty_amount)
    `;
    
    db.query(sql, [itemId, userId, rentalEndDate, daysOverdue, penaltyAmount, PENALTY_RATE], (err) => {
      if (err) {
        console.error('[RENTAL MONITOR] Error tracking penalty:', err);
      }
      resolve();
    });
  });
}

async function runAllChecks() {
  console.log('[RENTAL MONITOR] ========== Starting rental monitoring checks ==========');
  const startTime = Date.now();

  try {
    const reminderResults = await checkUpcomingRentalEnds();
    const overdueResults = await checkOverdueRentals();

    const duration = Date.now() - startTime;
    console.log(`[RENTAL MONITOR] ========== Completed in ${duration}ms ==========`);
    console.log(`[RENTAL MONITOR] Summary: ${reminderResults.remindersCount} reminders, ${overdueResults.notificationsSent} overdue notifications`);

    return {
      success: true,
      remindersSent: reminderResults.remindersCount,
      overdueNotifications: overdueResults.notificationsSent,
      overdueCount: overdueResults.overdueCount,
      duration
    };
  } catch (error) {
    console.error('[RENTAL MONITOR] Error during checks:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  checkUpcomingRentalEnds,
  checkOverdueRentals,
  getActiveRentalsWithPenalty,
  calculatePenalty,
  runAllChecks,
  PENALTY_RATE
};
