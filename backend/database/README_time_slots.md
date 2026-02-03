# Time Slots Database Setup

## Overview
This system allows multiple appointments per time slot based on capacity. All services (dry cleaning, repair, customization) share the same time slots.

## Database Tables

### 1. `time_slots` Table
Defines available time slots with their capacity.

**Columns:**
- `slot_id`: Primary key
- `time_slot`: Time in HH:MM:SS format (e.g., 10:30:00)
- `capacity`: Maximum number of appointments allowed at this time (default: 5)
- `is_active`: Whether this time slot is active (default: 1)
- `created_at`, `updated_at`: Timestamps

### 2. `appointment_slots` Table (Updated)
Tracks individual appointments. The unique constraint has been removed to allow multiple bookings per time slot.

**Columns:**
- `slot_id`: Primary key
- `service_type`: ENUM('dry_cleaning', 'repair', 'customization')
- `appointment_date`: Date of appointment
- `appointment_time`: Time of appointment
- `user_id`: User who booked the slot
- `order_item_id`: Reference to order item (when order is created)
- `cart_item_id`: Reference to cart item (if still in cart)
- `status`: ENUM('booked', 'completed', 'cancelled')

## Setup Instructions

### Option 1: Run SQL Script Directly
1. Open your MySQL client (phpMyAdmin, MySQL Workbench, or command line)
2. Select your database
3. Run the SQL from `time_slots.sql`:

```sql
-- Copy and paste the contents of time_slots.sql
```

### Option 2: Use Node.js Script
Run from the backend directory:

```bash
cd backend
node database/create_time_slots_table.js
```

### Option 3: Command Line MySQL
```bash
mysql -u your_username -p your_database_name < backend/database/time_slots.sql
```

## How It Works

1. **Time Slots**: Defined in `time_slots` table with capacity (e.g., 10:30 can accommodate 5 appointments)
2. **Availability Check**: When a user selects a time slot, the system:
   - Checks the capacity for that time slot
   - Counts current bookings for that date and time (across all services)
   - If booked count < capacity, slot is available
3. **Shared Slots**: All three services (dry cleaning, repair, customization) share the same time slots
4. **Booking**: Multiple users can book the same time slot until capacity is reached

## Default Time Slots
The system comes with default time slots from 8:00 AM to 5:00 PM in 30-minute intervals, each with a capacity of 5 appointments.

## Admin Management
Admins can manage time slot capacities through the admin panel (to be implemented).

