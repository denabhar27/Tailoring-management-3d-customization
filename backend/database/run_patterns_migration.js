

const db = require('../config/db');

console.log('🔄 Starting patterns table migration...');

const createTableSQL = `
CREATE TABLE IF NOT EXISTS patterns (
  pattern_id INT AUTO_INCREMENT PRIMARY KEY,
  pattern_code VARCHAR(100) NOT NULL UNIQUE COMMENT 'Unique code identifier (e.g., minimal-stripe, custom-floral)',
  pattern_name VARCHAR(255) NOT NULL COMMENT 'Display name for dropdown (e.g., Minimal Stripe, Custom Floral)',
  pattern_type ENUM('procedural', 'image') DEFAULT 'procedural' COMMENT 'Type of pattern - procedural (canvas-generated) or image (uploaded texture)',
  
  procedural_type VARCHAR(50) COMMENT 'Type for makePattern function (minimal-stripe, minimal-check, embroidery-1, embroidery-2, etc.)',
  
  image_path VARCHAR(500) COMMENT 'Path to uploaded pattern image in uploads directory',
  image_url VARCHAR(500) COMMENT 'URL to access the pattern image',
  
  repeat_x DECIMAL(5,2) DEFAULT 2.00 COMMENT 'Texture repeat on X axis',
  repeat_y DECIMAL(5,2) DEFAULT 2.00 COMMENT 'Texture repeat on Y axis',
  is_seamless TINYINT(1) DEFAULT 1 COMMENT 'Whether pattern is seamless/tileable',
  
  description TEXT COMMENT 'Optional description of the pattern',
  preview_url VARCHAR(500) COMMENT 'URL for pattern preview thumbnail',
  sort_order INT DEFAULT 0 COMMENT 'Display order in dropdown',
  is_active TINYINT(1) DEFAULT 1 COMMENT 'Whether pattern is available for use',
  
  created_by INT COMMENT 'Admin user_id who created the pattern',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_pattern_code (pattern_code),
  INDEX idx_pattern_type (pattern_type),
  INDEX idx_is_active (is_active),
  INDEX idx_sort_order (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`;

const insertDefaultsSQL = `
INSERT INTO patterns (pattern_code, pattern_name, pattern_type, procedural_type, sort_order, description) VALUES
('none', 'None (Solid)', 'procedural', 'none', 1, 'Solid color without pattern'),
('minimal-stripe', 'Minimal Stripe', 'procedural', 'minimal-stripe', 2, 'Thin vertical stripes'),
('minimal-check', 'Minimal Check', 'procedural', 'minimal-check', 3, 'Fine grid pattern'),
('embroidery-1', 'Embroidery Style 1', 'procedural', 'embroidery-1', 4, 'Circular embroidery pattern'),
('embroidery-2', 'Embroidery Style 2', 'procedural', 'embroidery-2', 5, 'Triangular embroidery pattern')
ON DUPLICATE KEY UPDATE pattern_name = VALUES(pattern_name)
`;

db.query(createTableSQL, (err, result) => {
  if (err) {
    console.error('❌ Error creating patterns table:', err.message);
    process.exit(1);
  }
  console.log('✅ Patterns table created successfully');

  db.query(insertDefaultsSQL, (err2, result2) => {
    if (err2) {
      console.error('❌ Error inserting default patterns:', err2.message);
      process.exit(1);
    }
    console.log('✅ Default patterns inserted successfully');
    console.log('🎉 Migration completed!');
    process.exit(0);
  });
});
