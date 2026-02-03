-- Insert sample dry cleaning services
INSERT INTO dry_cleaning_services (service_name, description, base_price, price_per_item, min_items, max_items, estimated_time, requires_image) VALUES
('Basic Dry Cleaning', 'Standard dry cleaning for everyday garments', '200', '150', 1, 50, '2-3 days', 0),
('Premium Dry Cleaning', 'High-quality dry cleaning for delicate fabrics', '350', '250', 1, 30, '3-4 days', 1),
('Delicate Items', 'Specialized care for silk, wool, and other delicate fabrics', '450', '350', 1, 20, '4-5 days', 1),
('Express Service', 'Same-day or next-day dry cleaning service', '500', '400', 1, 10, '1-2 days', 0),
('Wedding Dress Cleaning', 'Professional cleaning and preservation for wedding dresses', '800', '600', 1, 5, '1-2 weeks', 1),
('Suit Cleaning', 'Complete suit cleaning and pressing', '300', '200', 1, 20, '2-3 days', 0),
('Winter Coat Cleaning', 'Heavy coat and jacket cleaning service', '400', '300', 1, 15, '3-4 days', 0),
('Curtain Cleaning', 'Professional curtain and drapery cleaning', '250', '180', 1, 25, '3-5 days', 0);
