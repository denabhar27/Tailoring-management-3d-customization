# Custom 3D Models Database Setup

## Database Table Creation

Run the SQL script to create the `custom_3d_models` table:

```bash
mysql -u your_username -p your_database < backend/database/custom_3d_models.sql
```

Or manually execute the SQL in `backend/database/custom_3d_models.sql` in your MySQL client.

## Directory Setup

Make sure the uploads directory exists:

```bash
mkdir -p uploads/custom-3d-models
```

The backend will automatically create this directory if it doesn't exist when uploading files.

## Usage

1. Admin can upload GLB files through the "Add 3D Model" button in the Customization Management page
2. The uploaded GLB files will be stored in `uploads/custom-3d-models/`
3. Custom models will automatically appear in the 3D customizer when the garment category matches
4. Set the garment category to match the garment type (e.g., "coat-men", "barong", "suit-1", "pants")

## API Endpoints

- `POST /api/customization/upload-glb` - Upload a GLB file (admin only)
- `GET /api/customization/custom-models` - Get all custom 3D models
- `GET /api/customization/custom-models/type/:type` - Get models by type (garment, button, accessory)
- `DELETE /api/customization/custom-models/:modelId` - Delete a custom model (admin only)

