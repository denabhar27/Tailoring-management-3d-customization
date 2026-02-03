# Dynamic Pattern System

This document describes the dynamic pattern system implementation for the 3D garment customizer.

## Overview

The pattern system has been converted from a hard-coded array to a database-driven system. This allows administrators to:
- Add new patterns dynamically without code changes
- Upload custom pattern images that apply to all garment types
- Manage pattern visibility and ordering
- Support both procedural (canvas-generated) and image-based patterns

## Database Table

The `patterns` table stores pattern configurations:

```sql
CREATE TABLE patterns (
  pattern_id INT AUTO_INCREMENT PRIMARY KEY,
  pattern_code VARCHAR(100) NOT NULL UNIQUE,       -- Unique identifier (e.g., 'minimal-stripe')
  pattern_name VARCHAR(255) NOT NULL,              -- Display name (e.g., 'Minimal Stripe')
  pattern_type ENUM('procedural', 'image'),        -- Type of pattern
  procedural_type VARCHAR(50),                     -- For procedural patterns
  image_path VARCHAR(500),                         -- Path to uploaded image
  image_url VARCHAR(500),                          -- URL to access the image
  repeat_x DECIMAL(5,2) DEFAULT 2.00,             -- Texture repeat on X axis
  repeat_y DECIMAL(5,2) DEFAULT 2.00,             -- Texture repeat on Y axis
  is_seamless TINYINT(1) DEFAULT 1,               -- Whether pattern is seamless
  description TEXT,                                -- Optional description
  preview_url VARCHAR(500),                        -- Preview thumbnail URL
  sort_order INT DEFAULT 0,                        -- Display order
  is_active TINYINT(1) DEFAULT 1,                 -- Visibility flag
  created_by INT,                                  -- Admin who created it
  created_at DATETIME,
  updated_at DATETIME
);
```

## API Endpoints

### Public Endpoints (No Auth Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/patterns` | Get all active patterns |
| GET | `/api/patterns/type/:type` | Get patterns by type (procedural/image) |
| GET | `/api/patterns/code/:code` | Get pattern by code |
| GET | `/api/patterns/:patternId` | Get pattern by ID |

### Admin Endpoints (Auth Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/patterns` | Create new procedural pattern |
| POST | `/api/patterns/upload` | Upload pattern image and create pattern |
| PUT | `/api/patterns/:patternId` | Update pattern (with optional image) |
| DELETE | `/api/patterns/:patternId` | Soft delete pattern |
| POST | `/api/patterns/:patternId/restore` | Restore deleted pattern |

## Frontend API (PatternApi.js)

```javascript
import { getAllPatterns, uploadPatternImage, deletePattern } from '../api/PatternApi';

// Get all patterns
const result = await getAllPatterns();
if (result.success) {
  console.log(result.patterns);
}

// Upload a new pattern image
const patternData = {
  pattern_code: 'custom-floral',
  pattern_name: 'Custom Floral Pattern',
  repeat_x: 3.0,
  repeat_y: 3.0,
  description: 'Beautiful floral pattern'
};
const file = document.getElementById('patternFile').files[0];
const result = await uploadPatternImage(file, patternData);

// Delete a pattern
const result = await deletePattern(patternId);
```

## Pattern Types

### Procedural Patterns
Generated dynamically using canvas. Built-in types:
- `none` - Solid color (no pattern)
- `minimal-stripe` - Thin vertical stripes
- `minimal-check` - Fine grid pattern  
- `embroidery-1` - Circular embroidery
- `embroidery-2` - Triangular embroidery

### Image-Based Patterns
Uploaded texture images that are applied to 3D models:
- Supports JPEG, PNG, GIF, WebP, SVG formats
- Max file size: 10MB
- Stored in `/uploads/patterns/`
- Configurable repeat settings

## Migration

To set up the patterns table:

```bash
cd backend
node database/run_patterns_migration.js
```

This creates the table and inserts the default procedural patterns.

## How It Works

1. **Frontend loads patterns**: On page load, `Customizer3DPage.jsx` fetches patterns from the API
2. **Patterns displayed in dropdown**: `CustomizationPanel.jsx` renders patterns with proper names
3. **Pattern applied to 3D model**: `GarmentModel.jsx` handles both procedural and image patterns:
   - Procedural: Generated via `makeProceduralPattern()` using canvas
   - Image: Loaded via THREE.TextureLoader with configurable repeat settings

## Adding New Patterns (Admin)

### Via API (Procedural)
```javascript
POST /api/patterns
{
  "pattern_code": "herringbone",
  "pattern_name": "Herringbone Weave",
  "pattern_type": "procedural",
  "procedural_type": "herringbone",
  "sort_order": 6
}
```

Note: For custom procedural types, you'll need to add the rendering logic to `makeProceduralPattern()` in GarmentModel.jsx.

### Via API (Image Upload)
```javascript
POST /api/patterns/upload (multipart/form-data)
- patternImage: File
- pattern_code: "custom-plaid"
- pattern_name: "Custom Plaid"
- repeat_x: 4.0
- repeat_y: 4.0
```

## Files Modified/Created

### Backend
- `backend/model/PatternModel.js` - Pattern database model
- `backend/controller/PatternController.js` - CRUD operations
- `backend/routes/PatternRoutes.js` - API routes
- `backend/database/patterns.sql` - Database schema
- `backend/database/run_patterns_migration.js` - Migration script
- `backend/server.js` - Added pattern routes

### Frontend
- `src/api/PatternApi.js` - API client functions
- `src/pages/Customizer3DPage.jsx` - Loads patterns from API
- `src/components/3d-customizer/CustomizationPanel.jsx` - Pattern dropdown
- `src/components/3d-customizer/GarmentModel.jsx` - Pattern rendering
- `src/components/3d-customizer/Viewer3D.jsx` - Passes patterns to GarmentModel

## Backward Compatibility

The default patterns match the original hard-coded values:
- `none`, `minimal-stripe`, `minimal-check`, `embroidery-1`, `embroidery-2`

Existing designs using these patterns will continue to work without any changes.
