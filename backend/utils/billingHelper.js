const db = require('../config/db');
const TransactionLog = require('../model/TransactionLogModel');

exports.updateBillingStatus = (itemId, serviceType, newStatus, previousStatus, callback) => {
  console.log(`[BILLING HELPER] Called with: itemId=${itemId}, serviceType=${serviceType}, newStatus=${newStatus}, previousStatus=${previousStatus}`);

  if (newStatus === previousStatus) {
    console.log(`[BILLING HELPER] Status unchanged, skipping update`);
    return callback(null, null);
  }

  let newPaymentStatus = null;
  let transactionType = 'payment';
  let amount = 0;

  const normalizedServiceType = (serviceType || '').toLowerCase().trim();

  if (normalizedServiceType === 'rental') {
    console.log(`[BILLING HELPER] Processing rental service`);
    if (newStatus === 'rented') {
      newPaymentStatus = 'down-payment';
      transactionType = 'down_payment';
      console.log(`[BILLING HELPER] Rental status 'rented' detected, setting payment_status to 'down-payment'`);
    } else if (newStatus === 'returned' || newStatus === 'completed') {
      newPaymentStatus = 'fully_paid';
      transactionType = 'final_payment';
      console.log(`[BILLING HELPER] Rental status '${newStatus}' detected, setting payment_status to 'fully_paid'`);
    }
  }
  
  else if (['dry_cleaning', 'dry-cleaning', 'drycleaning', 'repair', 'customization', 'customize'].includes(normalizedServiceType)) {
    console.log(`[BILLING HELPER] Processing ${normalizedServiceType} service`);
    if (newStatus === 'completed') {
      newPaymentStatus = 'paid';
      transactionType = 'payment';
      console.log(`[BILLING HELPER] Status 'completed' detected, setting payment_status to 'paid'`);
    }
  } else {
    console.log(`[BILLING HELPER] Unknown service type: ${normalizedServiceType}, skipping billing update`);
  }

  if (!newPaymentStatus) {
    console.log(`[BILLING HELPER] No payment status change needed for status: ${newStatus}`);
    return callback(null, null);
  }

  const getItemSql = `
    SELECT 
      oi.item_id,
      oi.final_price, 
      oi.payment_status, 
      oi.order_id,
      o.user_id
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.order_id
    WHERE oi.item_id = ?
  `;
  
  db.query(getItemSql, [itemId], (getErr, items) => {
    if (getErr || !items || items.length === 0) {
      console.error('[BILLING HELPER] Error fetching order item for billing update:', getErr);
      return callback(getErr || new Error('Order item not found'), null);
    }

    const item = items[0];
    const previousPaymentStatus = item.payment_status || 'unpaid';
    console.log(`[BILLING HELPER] Found order item: item_id=${item.item_id}, user_id=${item.user_id}, final_price=${item.final_price}, current_payment_status=${previousPaymentStatus}`);

    TransactionLog.getSummaryByOrderItemId(itemId, (summaryErr, summary) => {
      if (summaryErr) {
        console.error('[BILLING HELPER] Error fetching payment summary:', summaryErr);
        
      }
      
      const totalPaid = parseFloat(summary?.[0]?.total_amount || 0);
      const finalPrice = parseFloat(item.final_price || 0);
      console.log(`[BILLING HELPER] Total already paid from transaction logs: ${totalPaid}, Final price: ${finalPrice}`);

      const normalizedServiceTypeForAmount = (serviceType || '').toLowerCase().trim();
      if (normalizedServiceTypeForAmount === 'rental' && newStatus === 'rented') {
        
        const expectedDownpayment = parseFloat(item.final_price) * 0.5;
        
        if (totalPaid < expectedDownpayment) {
          amount = expectedDownpayment - totalPaid;
          console.log(`[BILLING HELPER] Calculated downpayment amount: ${amount} (to reach 50% of ${item.final_price}, already paid: ${totalPaid})`);
        } else {
          
          amount = 0;
          console.log(`[BILLING HELPER] User already paid downpayment (${totalPaid} >= ${expectedDownpayment}), skipping automatic charge`);
          
          if (totalPaid >= finalPrice) {
            newPaymentStatus = 'fully_paid';
          } else if (totalPaid >= expectedDownpayment) {
            newPaymentStatus = 'down-payment';
          } else {
            newPaymentStatus = 'partial_payment';
          }
        }
      } else if (normalizedServiceTypeForAmount === 'rental' && (newStatus === 'returned' || newStatus === 'completed')) {
        
        const remaining = finalPrice - totalPaid;
        if (remaining > 0) {
          amount = remaining;
          console.log(`[BILLING HELPER] Calculated final payment amount: ${amount} (remaining: ${finalPrice} - ${totalPaid})`);
        } else {
          
          amount = 0;
          console.log(`[BILLING HELPER] Item already fully paid (${totalPaid} >= ${finalPrice}), skipping automatic charge`);
          newPaymentStatus = 'fully_paid';
        }
      } else {
        
        const remaining = finalPrice - totalPaid;
        if (remaining > 0) {
          amount = remaining;
          console.log(`[BILLING HELPER] Calculated payment amount: ${amount} (remaining: ${finalPrice} - ${totalPaid})`);
        } else {
          amount = 0;
          console.log(`[BILLING HELPER] Item already fully paid, skipping automatic charge`);
          newPaymentStatus = 'paid';
        }
      }

      const updateSql = `UPDATE order_items SET payment_status = ? WHERE item_id = ?`;
      console.log(`[BILLING HELPER] Executing SQL: ${updateSql}`);
      console.log(`[BILLING HELPER] Parameters: payment_status="${newPaymentStatus}", item_id=${itemId}`);
      
      db.query(updateSql, [newPaymentStatus, itemId], (err, result) => {
        if (err) {
          console.error('[BILLING HELPER] ===== SQL ERROR =====');
          console.error('[BILLING HELPER] Error updating billing payment_status:', err);
          console.error('[BILLING HELPER] SQL:', updateSql);
          console.error('[BILLING HELPER] Parameters:', [newPaymentStatus, itemId]);
          return callback(err, null);
        }
        
        console.log(`[BILLING HELPER] ===== SQL UPDATE SUCCESS =====`);
        console.log(`[BILLING HELPER] Item ${itemId} payment_status updated: ${previousPaymentStatus} → ${newPaymentStatus}`);
        console.log(`[BILLING HELPER] Affected rows: ${result.affectedRows}`);
        console.log(`[BILLING HELPER] Service: ${serviceType}, Status: ${newStatus}`);

        db.query(`SELECT item_id, payment_status FROM order_items WHERE item_id = ?`, [itemId], (verifyErr, verifyResults) => {
          if (verifyErr) {
            console.error('[BILLING HELPER] Error verifying update:', verifyErr);
          } else if (verifyResults && verifyResults.length > 0) {
            console.log(`[BILLING HELPER] Verification: Current payment_status in DB = "${verifyResults[0].payment_status}"`);
            if (verifyResults[0].payment_status !== newPaymentStatus) {
              console.error(`[BILLING HELPER] WARNING: Payment status mismatch! Expected "${newPaymentStatus}" but got "${verifyResults[0].payment_status}"`);
            }
          }
        });

        console.log(`[BILLING HELPER] Payment status updated to '${newPaymentStatus}' - No automatic transaction log created`);
        console.log(`[BILLING HELPER] Transaction logs will only be created when admin records payment via payment modal`);
        
        callback(null, { 
          payment_status: newPaymentStatus, 
          affectedRows: result.affectedRows,
          amount: 0, 
          transaction_type: transactionType
        });
      });
    });
  });
};
