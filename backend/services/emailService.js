

const sgMail = require('@sendgrid/mail');

const initializeSendGrid = () => {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    console.warn('[EMAIL SERVICE] SendGrid API key not configured. Email notifications will be disabled.');
    return false;
  }
  sgMail.setApiKey(apiKey);
  console.log('[EMAIL SERVICE] SendGrid initialized successfully');
  return true;
};

const isEmailServiceConfigured = () => {
  return !!process.env.SENDGRID_API_KEY;
};

const getSenderInfo = () => ({
  email: process.env.FROM_EMAIL || 'noreply@djackmantailor.com',
  name: process.env.FROM_NAME || "D'jackman Tailor Deluxe"
});

const sendEmail = async ({ to, subject, text, html }) => {
  if (!isEmailServiceConfigured()) {
    console.warn('[EMAIL SERVICE] Email service not configured. Skipping email to:', to);
    return false;
  }

  const sender = getSenderInfo();
  
  const msg = {
    to,
    from: {
      email: sender.email,
      name: sender.name
    },
    subject,
    text,
    html
  };

  try {
    await sgMail.send(msg);
    console.log(`[EMAIL SERVICE] Email sent successfully to ${to}: ${subject}`);
    return true;
  } catch (error) {
    console.error('[EMAIL SERVICE] Failed to send email:', error.message);
    if (error.response) {
      console.error('[EMAIL SERVICE] SendGrid Response:', error.response.body);
    }
    return false;
  }
};

const sendRentalEndReminderEmail = async ({ 
  userEmail, 
  userName, 
  itemName, 
  rentalEndDate, 
  daysRemaining,
  itemId 
}) => {
  const formattedDate = new Date(rentalEndDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const subject = `⏰ Rental Reminder: Your rental ends ${daysRemaining === 0 ? 'today' : `in ${daysRemaining} day${daysRemaining > 1 ? 's' : ''}`}!`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 28px;">D'jackman Tailor Deluxe</h1>
                  <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">Rental Service Notification</p>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  <h2 style="color: #333; margin: 0 0 20px 0; font-size: 24px;">
                    ⏰ Rental Ending ${daysRemaining === 0 ? 'Today' : 'Soon'}!
                  </h2>
                  
                  <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                    Hello <strong>${userName}</strong>,
                  </p>
                  
                  <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                    This is a friendly reminder that your rental period for the following item is ending soon:
                  </p>
                  
                  <!-- Rental Details Box -->
                  <div style="background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                    <p style="margin: 0 0 10px 0; color: #333;">
                      <strong>📦 Item:</strong> ${itemName}
                    </p>
                    <p style="margin: 0 0 10px 0; color: #333;">
                      <strong>📅 Rental End Date:</strong> ${formattedDate}
                    </p>
                    <p style="margin: 0; color: #333;">
                      <strong>⏱️ Time Remaining:</strong> 
                      <span style="color: ${daysRemaining === 0 ? '#dc3545' : '#ffc107'}; font-weight: bold;">
                        ${daysRemaining === 0 ? 'Today!' : `${daysRemaining} day${daysRemaining > 1 ? 's' : ''}`}
                      </span>
                    </p>
                  </div>
                  
                  <!-- Warning Box -->
                  <div style="background-color: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 0; color: #856404; font-size: 14px;">
                      ⚠️ <strong>Important:</strong> Late returns will incur a penalty of <strong>₱100 per day</strong>. 
                      Please ensure you return the item on time to avoid additional charges.
                    </p>
                  </div>
                  
                  <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 20px 0;">
                    Please visit our store to return the rental item before the end date.
                  </p>
                  
                  <!-- CTA Button -->
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="#" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 25px; font-weight: bold; font-size: 16px;">
                      View Rental Details
                    </a>
                  </div>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f8f9fa; padding: 25px; border-radius: 0 0 10px 10px; text-align: center;">
                  <p style="color: #888; font-size: 14px; margin: 0 0 10px 0;">
                    D'jackman Tailor Deluxe
                  </p>
                  <p style="color: #aaa; font-size: 12px; margin: 0;">
                    This is an automated notification. Please do not reply to this email.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const text = `
Rental Reminder - D'jackman Tailor Deluxe

Hello ${userName},

This is a friendly reminder that your rental period for "${itemName}" is ending ${daysRemaining === 0 ? 'today' : `in ${daysRemaining} day(s)`}.

Rental End Date: ${formattedDate}

IMPORTANT: Late returns will incur a penalty of ₱100 per day. Please ensure you return the item on time to avoid additional charges.

Please visit our store to return the rental item before the end date.

Thank you for choosing D'jackman Tailor Deluxe!
  `;

  return sendEmail({ to: userEmail, subject, text, html });
};

const sendOverdueNotificationEmail = async ({ 
  userEmail, 
  userName, 
  itemName, 
  rentalEndDate, 
  daysOverdue,
  currentPenalty,
  itemId 
}) => {
  const formattedDate = new Date(rentalEndDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const subject = `🚨 OVERDUE: Your rental is ${daysOverdue} day${daysOverdue > 1 ? 's' : ''} overdue - Penalty: ₱${currentPenalty}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 28px;">D'jackman Tailor Deluxe</h1>
                  <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">⚠️ OVERDUE RENTAL NOTICE</p>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  <h2 style="color: #dc3545; margin: 0 0 20px 0; font-size: 24px;">
                    🚨 Your Rental Is Overdue!
                  </h2>
                  
                  <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                    Hello <strong>${userName}</strong>,
                  </p>
                  
                  <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                    Your rental period has <strong style="color: #dc3545;">exceeded the due date</strong>. Please return the item immediately to minimize additional penalty charges.
                  </p>
                  
                  <!-- Rental Details Box -->
                  <div style="background-color: #f8d7da; border-left: 4px solid #dc3545; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                    <p style="margin: 0 0 10px 0; color: #721c24;">
                      <strong>📦 Item:</strong> ${itemName}
                    </p>
                    <p style="margin: 0 0 10px 0; color: #721c24;">
                      <strong>📅 Due Date:</strong> ${formattedDate}
                    </p>
                    <p style="margin: 0 0 10px 0; color: #721c24;">
                      <strong>⏱️ Days Overdue:</strong> 
                      <span style="font-weight: bold; font-size: 18px;">${daysOverdue} day${daysOverdue > 1 ? 's' : ''}</span>
                    </p>
                    <p style="margin: 0; color: #721c24;">
                      <strong>💰 Current Penalty:</strong> 
                      <span style="font-weight: bold; font-size: 20px; color: #dc3545;">₱${currentPenalty}</span>
                    </p>
                  </div>
                  
                  <!-- Penalty Info Box -->
                  <div style="background-color: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 0 0 10px 0; color: #856404; font-size: 14px;">
                      <strong>⚠️ Penalty Rate:</strong> ₱100 per day
                    </p>
                    <p style="margin: 0; color: #856404; font-size: 14px;">
                      The penalty will continue to increase daily until the item is returned. Please return the item as soon as possible.
                    </p>
                  </div>
                  
                  <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 20px 0;">
                    Please visit our store <strong>immediately</strong> to return the rental item and settle the outstanding penalty.
                  </p>
                  
                  <!-- CTA Button -->
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="#" style="display: inline-block; background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 25px; font-weight: bold; font-size: 16px;">
                      Return Item Now
                    </a>
                  </div>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f8f9fa; padding: 25px; border-radius: 0 0 10px 10px; text-align: center;">
                  <p style="color: #888; font-size: 14px; margin: 0 0 10px 0;">
                    D'jackman Tailor Deluxe
                  </p>
                  <p style="color: #aaa; font-size: 12px; margin: 0;">
                    This is an automated notification. Please do not reply to this email.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const text = `
OVERDUE RENTAL NOTICE - D'jackman Tailor Deluxe

Hello ${userName},

⚠️ YOUR RENTAL IS OVERDUE!

Your rental period has exceeded the due date. Please return the item immediately to minimize additional penalty charges.

Item: ${itemName}
Due Date: ${formattedDate}
Days Overdue: ${daysOverdue} day(s)
Current Penalty: ₱${currentPenalty}

Penalty Rate: ₱100 per day
The penalty will continue to increase daily until the item is returned.

Please visit our store IMMEDIATELY to return the rental item and settle the outstanding penalty.

Thank you,
D'jackman Tailor Deluxe
  `;

  return sendEmail({ to: userEmail, subject, text, html });
};

const sendPenaltyChargeEmail = async ({ 
  userEmail, 
  userName, 
  itemName, 
  rentalEndDate, 
  returnDate,
  daysOverdue,
  penaltyAmount,
  originalPrice,
  totalAmount,
  itemId 
}) => {
  const formattedEndDate = new Date(rentalEndDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const formattedReturnDate = new Date(returnDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const subject = `💰 Penalty Applied: ₱${penaltyAmount} charged for late rental return`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #fd7e14 0%, #dc3545 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 28px;">D'jackman Tailor Deluxe</h1>
                  <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">Late Return Penalty Notice</p>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  <h2 style="color: #fd7e14; margin: 0 0 20px 0; font-size: 24px;">
                    💰 Late Return Penalty Applied
                  </h2>
                  
                  <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                    Hello <strong>${userName}</strong>,
                  </p>
                  
                  <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                    Your rental item has been marked as returned. However, since it was returned after the due date, a late return penalty has been applied to your account.
                  </p>
                  
                  <!-- Rental Details Box -->
                  <div style="background-color: #f8f9fa; border-left: 4px solid #fd7e14; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                    <p style="margin: 0 0 10px 0; color: #333;">
                      <strong>📦 Item:</strong> ${itemName}
                    </p>
                    <p style="margin: 0 0 10px 0; color: #333;">
                      <strong>📅 Due Date:</strong> ${formattedEndDate}
                    </p>
                    <p style="margin: 0 0 10px 0; color: #333;">
                      <strong>📆 Return Date:</strong> ${formattedReturnDate}
                    </p>
                    <p style="margin: 0; color: #333;">
                      <strong>⏱️ Days Late:</strong> 
                      <span style="color: #dc3545; font-weight: bold;">${daysOverdue} day${daysOverdue > 1 ? 's' : ''}</span>
                    </p>
                  </div>
                  
                  <!-- Price Breakdown Box -->
                  <div style="background-color: #e9ecef; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin: 0 0 15px 0; color: #333; font-size: 18px;">💳 Payment Summary</h3>
                    <table width="100%" style="border-collapse: collapse;">
                      <tr>
                        <td style="padding: 8px 0; color: #555; border-bottom: 1px solid #dee2e6;">Original Rental Price</td>
                        <td style="padding: 8px 0; color: #555; text-align: right; border-bottom: 1px solid #dee2e6;">₱${originalPrice.toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #dc3545; border-bottom: 1px solid #dee2e6;">
                          Late Return Penalty (${daysOverdue} × ₱100)
                        </td>
                        <td style="padding: 8px 0; color: #dc3545; text-align: right; font-weight: bold; border-bottom: 1px solid #dee2e6;">
                          +₱${penaltyAmount.toLocaleString()}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; color: #333; font-weight: bold; font-size: 18px;">Total Amount Due</td>
                        <td style="padding: 12px 0; color: #333; text-align: right; font-weight: bold; font-size: 20px;">
                          ₱${totalAmount.toLocaleString()}
                        </td>
                      </tr>
                    </table>
                  </div>
                  
                  <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 20px 0;">
                    Please visit our store to complete the payment if not yet settled.
                  </p>
                  
                  <!-- CTA Button -->
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="#" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 25px; font-weight: bold; font-size: 16px;">
                      View Order Details
                    </a>
                  </div>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f8f9fa; padding: 25px; border-radius: 0 0 10px 10px; text-align: center;">
                  <p style="color: #888; font-size: 14px; margin: 0 0 10px 0;">
                    D'jackman Tailor Deluxe
                  </p>
                  <p style="color: #aaa; font-size: 12px; margin: 0;">
                    This is an automated notification. Please do not reply to this email.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const text = `
LATE RETURN PENALTY NOTICE - D'jackman Tailor Deluxe

Hello ${userName},

Your rental item has been marked as returned. However, since it was returned after the due date, a late return penalty has been applied to your account.

Item: ${itemName}
Due Date: ${formattedEndDate}
Return Date: ${formattedReturnDate}
Days Late: ${daysOverdue} day(s)

PAYMENT SUMMARY:
- Original Rental Price: ₱${originalPrice.toLocaleString()}
- Late Return Penalty (${daysOverdue} × ₱100): +₱${penaltyAmount.toLocaleString()}
- Total Amount Due: ₱${totalAmount.toLocaleString()}

Please visit our store to complete the payment if not yet settled.

Thank you,
D'jackman Tailor Deluxe
  `;

  return sendEmail({ to: userEmail, subject, text, html });
};

const sendRentalStatusEmail = async ({ 
  userEmail, 
  userName, 
  itemName, 
  status,
  message,
  itemId 
}) => {
  const statusLabels = {
    'pending': '⏳ Pending Review',
    'accepted': '✅ Accepted',
    'ready_to_pickup': '🎉 Ready for Pickup',
    'rented': '📦 Rented',
    'returned': '🔙 Returned',
    'completed': '✅ Completed',
    'cancelled': '❌ Cancelled'
  };

  const statusColors = {
    'pending': '#ffc107',
    'accepted': '#28a745',
    'ready_to_pickup': '#17a2b8',
    'rented': '#6f42c1',
    'returned': '#20c997',
    'completed': '#28a745',
    'cancelled': '#dc3545'
  };

  const statusLabel = statusLabels[status] || status;
  const statusColor = statusColors[status] || '#667eea';

  const subject = `${statusLabel} - Your rental order update`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 28px;">D'jackman Tailor Deluxe</h1>
                  <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">Rental Status Update</p>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                    Hello <strong>${userName}</strong>,
                  </p>
                  
                  <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                    Your rental order status has been updated.
                  </p>
                  
                  <!-- Status Box -->
                  <div style="background-color: #f8f9fa; border-left: 4px solid ${statusColor}; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                    <p style="margin: 0 0 10px 0; color: #333;">
                      <strong>📦 Item:</strong> ${itemName}
                    </p>
                    <p style="margin: 0; color: #333;">
                      <strong>📋 Status:</strong> 
                      <span style="color: ${statusColor}; font-weight: bold;">${statusLabel}</span>
                    </p>
                  </div>
                  
                  ${message ? `
                  <div style="background-color: #e7f3ff; border: 1px solid #b3d7ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 0; color: #004085; font-size: 14px;">
                      📝 <strong>Note:</strong> ${message}
                    </p>
                  </div>
                  ` : ''}
                  
                  <!-- CTA Button -->
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="#" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 25px; font-weight: bold; font-size: 16px;">
                      View Order Details
                    </a>
                  </div>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f8f9fa; padding: 25px; border-radius: 0 0 10px 10px; text-align: center;">
                  <p style="color: #888; font-size: 14px; margin: 0 0 10px 0;">
                    D'jackman Tailor Deluxe
                  </p>
                  <p style="color: #aaa; font-size: 12px; margin: 0;">
                    This is an automated notification. Please do not reply to this email.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const text = `
RENTAL STATUS UPDATE - D'jackman Tailor Deluxe

Hello ${userName},

Your rental order status has been updated.

Item: ${itemName}
Status: ${statusLabel}
${message ? `\nNote: ${message}` : ''}

Thank you for choosing D'jackman Tailor Deluxe!
  `;

  return sendEmail({ to: userEmail, subject, text, html });
};

initializeSendGrid();

const sendServiceStatusEmail = async ({ 
  userEmail, 
  userName, 
  serviceName,
  serviceType,
  status,
  orderId,
  message,
  appointmentDate
}) => {
  const serviceTypeLabels = {
    'repair': 'Repair Service',
    'dry_cleaning': 'Dry Cleaning Service',
    'drycleaning': 'Dry Cleaning Service',
    'rental': 'Rental Service',
    'customize': 'Customization Service',
    'customization': 'Customization Service'
  };

  const statusLabels = {
    'pending': '⏳ Pending Review',
    'pending_review': '⏳ Pending Review',
    'accepted': '✅ Accepted',
    'price_confirmation': '💰 Price Confirmation Required',
    'confirmed': '✅ Confirmed',
    'in_progress': '🔧 In Progress',
    'ready_to_pickup': '🎉 Ready for Pickup',
    'ready_for_pickup': '🎉 Ready for Pickup',
    'picked_up': '📦 Picked Up',
    'rented': '📦 Rented',
    'returned': '🔙 Returned',
    'completed': '✅ Completed',
    'cancelled': '❌ Cancelled'
  };

  const statusColors = {
    'pending': '#ffc107',
    'pending_review': '#ffc107',
    'accepted': '#28a745',
    'price_confirmation': '#17a2b8',
    'confirmed': '#28a745',
    'in_progress': '#6f42c1',
    'ready_to_pickup': '#17a2b8',
    'ready_for_pickup': '#17a2b8',
    'picked_up': '#20c997',
    'rented': '#6f42c1',
    'returned': '#20c997',
    'completed': '#28a745',
    'cancelled': '#dc3545'
  };

  const serviceLabel = serviceTypeLabels[serviceType] || 'Service';
  const statusLabel = statusLabels[status] || status;
  const statusColor = statusColors[status] || '#667eea';

  let statusMessage = message || '';
  if (!statusMessage) {
    switch (status) {
      case 'accepted':
        if (serviceType === 'rental') {
          statusMessage = 'Your rental request has been accepted! Please visit our store to pick up your rental item.';
        } else if (serviceType === 'dry_cleaning' || serviceType === 'drycleaning') {
          statusMessage = 'Your dry cleaning request has been accepted! Please drop off your items at our store so we can begin processing.';
        } else if (serviceType === 'repair') {
          statusMessage = 'Your repair request has been accepted! Please drop off your item at our store so we can assess and fix it.';
        } else if (serviceType === 'customize' || serviceType === 'customization') {
          statusMessage = 'Your customization request has been accepted! Please visit our store for measurements and consultation.';
        } else {
          statusMessage = 'Your service request has been accepted! Please visit our store for next steps.';
        }
        break;
      case 'in_progress':
      case 'confirmed':
        statusMessage = `Your ${serviceLabel.toLowerCase()} is now being processed. We will notify you once it's ready!`;
        break;
      case 'ready_to_pickup':
      case 'ready_for_pickup':
        statusMessage = `Great news! Your ${serviceLabel.toLowerCase()} is complete and ready for pickup. Please visit our store to collect your item.`;
        break;
      case 'picked_up':
        statusMessage = `Your ${serviceLabel.toLowerCase()} has been picked up successfully. Thank you for choosing D'jackman Tailor Deluxe!`;
        break;
      case 'completed':
        statusMessage = `Your ${serviceLabel.toLowerCase()} has been completed successfully. Thank you for choosing D'jackman Tailor Deluxe!`;
        break;
      case 'cancelled':
        statusMessage = `Your ${serviceLabel.toLowerCase()} order has been cancelled. If you have any questions, please contact us.`;
        break;
      case 'price_confirmation':
        statusMessage = 'The final price for your service has been updated. Please review and confirm to proceed.';
        break;
      default:
        statusMessage = `Your order status has been updated to: ${statusLabel}`;
    }
  }

  const subject = `${statusLabel} - Your ${serviceLabel} Order Update (ORD-${orderId})`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 28px;">D'jackman Tailor Deluxe</h1>
                  <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">${serviceLabel} Update</p>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                    Hello <strong>${userName}</strong>,
                  </p>
                  
                  <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                    Your service order has been updated.
                  </p>
                  
                  <!-- Status Box -->
                  <div style="background-color: #f8f9fa; border-left: 4px solid ${statusColor}; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                    <p style="margin: 0 0 10px 0; color: #333;">
                      <strong>📋 Order ID:</strong> ORD-${orderId}
                    </p>
                    <p style="margin: 0 0 10px 0; color: #333;">
                      <strong>🏷️ Service:</strong> ${serviceLabel}
                    </p>
                    ${serviceName ? `<p style="margin: 0 0 10px 0; color: #333;"><strong>📦 Item:</strong> ${serviceName}</p>` : ''}
                    ${appointmentDate ? `<p style="margin: 0 0 10px 0; color: #333;"><strong>📅 Appointment:</strong> ${new Date(appointmentDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>` : ''}
                    <p style="margin: 0; color: #333;">
                      <strong>📋 Status:</strong> 
                      <span style="color: ${statusColor}; font-weight: bold; font-size: 18px;">${statusLabel}</span>
                    </p>
                  </div>
                  
                  <!-- Message Box -->
                  <div style="background-color: #e7f3ff; border: 1px solid #b3d7ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 0; color: #004085; font-size: 14px;">
                      📝 ${statusMessage}
                    </p>
                  </div>
                  
                  ${status === 'accepted' || status === 'ready_to_pickup' || status === 'ready_for_pickup' ? `
                  <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 20px 0;">
                    Please visit our store at your earliest convenience.
                  </p>
                  ` : ''}
                  
                  ${status === 'price_confirmation' ? `
                  <div style="background-color: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 0; color: #856404; font-size: 14px;">
                      ⚠️ <strong>Action Required:</strong> Please log in to your account to review and confirm the updated price.
                    </p>
                  </div>
                  ` : ''}
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f8f9fa; padding: 25px; border-radius: 0 0 10px 10px; text-align: center;">
                  <p style="color: #888; font-size: 14px; margin: 0 0 10px 0;">
                    D'jackman Tailor Deluxe
                  </p>
                  <p style="color: #aaa; font-size: 12px; margin: 0;">
                    This is an automated notification. Please do not reply to this email.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const text = `
SERVICE STATUS UPDATE - D'jackman Tailor Deluxe

Hello ${userName},

Your service order has been updated.

Order ID: ORD-${orderId}
Service: ${serviceLabel}
${serviceName ? `Item: ${serviceName}` : ''}
${appointmentDate ? `Appointment: ${new Date(appointmentDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}` : ''}
Status: ${statusLabel}

${statusMessage}

Thank you for choosing D'jackman Tailor Deluxe!
  `;

  return sendEmail({ to: userEmail, subject, text, html });
};

module.exports = {
  initializeSendGrid,
  isEmailServiceConfigured,
  sendEmail,
  sendRentalEndReminderEmail,
  sendOverdueNotificationEmail,
  sendPenaltyChargeEmail,
  sendRentalStatusEmail,
  sendServiceStatusEmail
};
