-- Add created_by field to hr_users table to track which SuperAdmin created each user
ALTER TABLE hr_users ADD COLUMN created_by INT NULL;

-- Add foreign key constraint
ALTER TABLE hr_users ADD CONSTRAINT hr_users_created_by_fk 
  FOREIGN KEY (created_by) REFERENCES hr_users(user_id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX idx_hr_users_created_by ON hr_users(created_by);
