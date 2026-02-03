-- FAQ System Database Schema
-- Run this script to create the FAQ tables

-- FAQs table
CREATE TABLE IF NOT EXISTS faqs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category VARCHAR(100) NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    tags JSON,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- FAQ Votes table
CREATE TABLE IF NOT EXISTS faq_votes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    faq_id INT NOT NULL,
    is_helpful BOOLEAN NOT NULL,
    voted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_faq_vote (user_id, faq_id),
    FOREIGN KEY (faq_id) REFERENCES faqs(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Insert default FAQ data
INSERT INTO faqs (category, question, answer, tags, display_order) VALUES
('Account & Profile', 'How do I reset my password?', 'To reset your password, go to Settings > Account > Change Password. Enter your current password and then your new password. Make sure it''s at least 8 characters long with a mix of uppercase, lowercase, and numbers.', '["password", "account", "reset", "security"]', 1),
('Account & Profile', 'How do I update my profile information?', 'Navigate to your Profile page by tapping the profile icon. Click ''Edit Profile'' to update your name, email, phone number, and address. Don''t forget to save your changes!', '["profile", "account", "update", "personal"]', 2),
('Orders & Services', 'How can I track my dry cleaning order?', 'You can track your order by going to Orders > Select your order > View Status. You''ll receive real-time updates on your order progress including when it''s received, being processed, ready for pickup, or delivered.', '["tracking", "orders", "dry cleaning", "status"]', 3),
('Orders & Services', 'How do I schedule a tailoring appointment?', 'Go to the Appointment section from the home screen. Select your preferred service type, choose an available date and time slot, then confirm your booking. You''ll receive a confirmation notification.', '["appointment", "booking", "tailoring", "schedule"]', 4),
('Orders & Services', 'Can I modify or cancel my order?', 'You can modify or cancel your order within 2 hours of placing it. Go to Orders > Select your order > Cancel Order. For modifications, contact our support team directly.', '["cancel", "modify", "orders", "changes"]', 5),
('Rental Services', 'How does the rental service work?', 'Browse our rental collection, select your desired items, choose rental dates and add to cart. After checkout, we''ll prepare your items for pickup or delivery. Return items by the specified date to avoid late fees.', '["rental", "borrow", "clothes", "suits"]', 6),
('Rental Services', 'What is the rental deposit policy?', 'A refundable deposit is required for all rentals. The deposit amount varies based on the item value. Your deposit will be returned within 3-5 business days after returning the item in good condition.', '["deposit", "rental", "refund", "payment"]', 7),
('Payments', 'What payment methods are accepted?', 'We accept cash on pickup/delivery, credit/debit cards, GCash, PayMaya, and bank transfers. Choose your preferred method during checkout.', '["payment", "gcash", "card", "cash"]', 8),
('Payments', 'How do I get a refund?', 'Refunds are processed for cancelled orders within 24 hours of placement. Contact support for refund requests. Approved refunds are credited within 5-7 business days to your original payment method.', '["refund", "money back", "cancelled", "payment"]', 9),
('Technical', 'The app is not loading properly, what should I do?', 'Try these steps: 1) Close and reopen the app, 2) Check your internet connection, 3) Clear app cache in your phone settings, 4) Update the app to the latest version, 5) Restart your phone. If issues persist, contact support.', '["technical", "bug", "error", "loading"]', 10),
('Technical', 'How do I enable notifications?', 'Go to your phone Settings > Apps > Jackman Tailor > Notifications and enable all notifications. In-app, check Profile > Notification Settings to customize which alerts you receive.', '["notifications", "alerts", "settings", "technical"]', 11),
('Customization', 'How do I provide my measurements for custom tailoring?', 'During the customization process, you can either enter your measurements manually, upload a photo for AI measurement estimation, or schedule an in-store appointment for professional measuring.', '["measurements", "custom", "tailoring", "size"]', 12),
('Customization', 'Can I customize fabric and design for my order?', 'Yes! Our customization feature allows you to choose fabric type, color, pattern, and specific design elements. Use our 3D preview to visualize your creation before placing the order.', '["fabric", "design", "customize", "pattern"]', 13),
('Repair Services', 'What types of repairs do you offer?', 'We offer alterations, button replacement, zipper repair, hem adjustments, patch work, and general mending. Upload photos of the item and damage during order creation for accurate quotes.', '["repair", "alterations", "fix", "mending"]', 14),
('Delivery', 'What are the delivery options and fees?', 'We offer standard delivery (3-5 days), express delivery (1-2 days), and same-day delivery for select areas. Delivery fees vary by location and urgency. Free delivery for orders above ₱1,500.', '["delivery", "shipping", "fees", "pickup"]', 15);

-- Create index for better query performance
CREATE INDEX idx_faqs_category ON faqs(category);
CREATE INDEX idx_faqs_active ON faqs(is_active);
CREATE INDEX idx_faq_votes_faq ON faq_votes(faq_id);
CREATE INDEX idx_faq_votes_user ON faq_votes(user_id);
