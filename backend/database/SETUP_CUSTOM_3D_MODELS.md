# Setup Custom 3D Models Table

## Quick Setup

The 500 error you're seeing is likely because the `custom_3d_models` table doesn't exist in your database yet.

### Option 1: Run SQL Script Directly

1. Open your MySQL client (phpMyAdmin, MySQL Workbench, or command line)
2. Select your database
3. Run the SQL from `custom_3d_models.sql`:

```sql
CREATE TABLE IF NOT EXISTS custom_3d_models (
  model_id INT AUTO_INCREMENT PRIMARY KEY,
  model_name VARCHAR(255) NOT NULL,
  model_type ENUM('garment', 'button', 'accessory') DEFAULT 'garment',
  file_path VARCHAR(500) NOT NULL COMMENT 'Path to GLB file in uploads directory',
  file_url VARCHAR(500) NOT NULL COMMENT 'URL to access the GLB file',
  garment_category VARCHAR(100) COMMENT 'Category like coat-men, barong, suit, pants, etc.',
  description TEXT,
  is_active TINYINT(1) DEFAULT 1,
  created_by INT COMMENT 'Admin user_id who uploaded the model',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_model_type (model_type),
  INDEX idx_garment_category (garment_category),
  INDEX idx_is_active (is_active),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Option 2: Use Node.js Script

Run from the backend directory:

```bash
cd backend
node database/create_custom_3d_models_table.js
```

### Option 3: Command Line MySQL

```bash
mysql -u your_username -p your_database_name < backend/database/custom_3d_models.sql
```

## Verify Table Exists

After creating the table, verify it exists:

```sql
SHOW TABLES LIKE 'custom_3d_models';
DESCRIBE custom_3d_models;
```

## Troubleshooting

If you still get errors after creating the table:

1. Check backend console logs for detailed error messages
2. Verify database connection in `backend/config/db.js`
3. Make sure the `uploads/custom-3d-models/` directory exists (it will be created automatically)
4. Check file permissions for the uploads directory

