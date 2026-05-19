/*
  Warnings:

  - Added `created_by` column to `hr_users` table without a default value. This is optional.

*/
-- Add created_by field to track which SuperAdmin created each user
ALTER TABLE `hr_users` ADD COLUMN `created_by` INT;

-- Add foreign key constraint for self-referencing relationship
ALTER TABLE `hr_users` ADD CONSTRAINT `hr_users_created_by_fk` 
  FOREIGN KEY (`created_by`) REFERENCES `hr_users`(`user_id`) ON DELETE SET NULL;

-- Add index for better query performance when filtering by creator
CREATE INDEX `idx_hr_users_created_by` ON `hr_users`(`created_by`);
