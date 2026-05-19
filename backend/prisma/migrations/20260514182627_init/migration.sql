-- CreateTable
CREATE TABLE `attendance` (
    `attendance_id` INTEGER NOT NULL AUTO_INCREMENT,
    `employee_id` INTEGER NOT NULL,
    `company_id` INTEGER NOT NULL,
    `attendance_date` DATE NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'Present',
    `check_in_time` TIME(0) NULL,
    `check_out_time` TIME(0) NULL,
    `working_hours` DECIMAL(5, 2) NULL,
    `overtime_hours` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    `leave_type_id` INTEGER NULL,
    `remarks` VARCHAR(500) NULL,
    `is_approved` BOOLEAN NOT NULL DEFAULT true,
    `approved_by` INTEGER NULL,
    `approved_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`attendance_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_log` (
    `log_id` BIGINT NOT NULL AUTO_INCREMENT,
    `company_id` INTEGER NOT NULL,
    `branch_id` INTEGER NULL,
    `user_id` INTEGER NULL,
    `user_type` VARCHAR(20) NOT NULL,
    `action` VARCHAR(100) NOT NULL,
    `entity_type` VARCHAR(50) NOT NULL,
    `entity_id` INTEGER NULL,
    `old_values` LONGTEXT NULL,
    `new_values` LONGTEXT NULL,
    `ip_address` VARCHAR(45) NULL,
    `user_agent` TEXT NULL,
    `remarks` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`log_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `branches` (
    `branch_id` INTEGER NOT NULL AUTO_INCREMENT,
    `company_id` INTEGER NOT NULL,
    `region_id` INTEGER NULL,
    `zone_id` INTEGER NULL,
    `branch_code` VARCHAR(30) NOT NULL,
    `branch_name` VARCHAR(200) NOT NULL,
    `branch_type` ENUM('HeadOffice', 'RegionalOffice', 'BranchOffice', 'Franchise', 'Warehouse', 'Store') NOT NULL DEFAULT 'BranchOffice',
    `address_line1` VARCHAR(255) NOT NULL,
    `address_line2` VARCHAR(255) NULL,
    `city` VARCHAR(100) NOT NULL,
    `state` VARCHAR(100) NULL,
    `pincode` VARCHAR(10) NULL,
    `country` VARCHAR(100) NOT NULL DEFAULT 'Rwanda',
    `branch_email` VARCHAR(100) NULL,
    `branch_phone` VARCHAR(20) NULL,
    `branch_manager_id` INTEGER NULL,
    `bank_name` VARCHAR(100) NULL,
    `bank_account_number` VARCHAR(50) NULL,
    `bank_ifsc_code` VARCHAR(20) NULL,
    `bank_account_holder` VARCHAR(200) NULL,
    `state_code` VARCHAR(10) NULL,
    `professional_tax_applicable` BOOLEAN NOT NULL DEFAULT true,
    `pt_slab_type` ENUM('Karnataka', 'Maharashtra', 'Delhi', 'TamilNadu', 'WestBengal', 'Other') NOT NULL DEFAULT 'Karnataka',
    `minimum_wage_applicable` BOOLEAN NOT NULL DEFAULT false,
    `shop_establishment_number` VARCHAR(50) NULL,
    `payroll_cycle` ENUM('Monthly', 'BiWeekly', 'Weekly') NOT NULL DEFAULT 'Monthly',
    `pay_day_of_month` INTEGER NOT NULL DEFAULT 1,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `cell` VARCHAR(100) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `district` VARCHAR(100) NULL,
    `province` VARCHAR(100) NULL,
    `sector` VARCHAR(100) NULL,
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `village` VARCHAR(100) NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'Approved',

    UNIQUE INDEX `branches_branch_code_key`(`branch_code`),
    PRIMARY KEY (`branch_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `companies` (
    `company_id` INTEGER NOT NULL AUTO_INCREMENT,
    `company_name` VARCHAR(200) NOT NULL,
    `legal_name` VARCHAR(200) NULL,
    `company_code` VARCHAR(50) NOT NULL,
    `incorporation_date` DATETIME(3) NULL,
    `address_line1` VARCHAR(255) NOT NULL,
    `address_line2` VARCHAR(255) NULL,
    `city` VARCHAR(100) NOT NULL,
    `state` VARCHAR(100) NULL,
    `pincode` VARCHAR(10) NULL,
    `country` VARCHAR(100) NOT NULL DEFAULT 'Rwanda',
    `company_email` VARCHAR(100) NOT NULL,
    `company_phone` VARCHAR(20) NOT NULL,
    `website` VARCHAR(200) NULL,
    `logo_url` VARCHAR(500) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `cell` VARCHAR(100) NULL,
    `district` VARCHAR(100) NULL,
    `paye_enabled` BOOLEAN NOT NULL DEFAULT true,
    `province` VARCHAR(100) NULL,
    `registration_number` VARCHAR(50) NULL,
    `rssb_enabled` BOOLEAN NOT NULL DEFAULT true,
    `sector` VARCHAR(100) NULL,
    `tin_number` VARCHAR(20) NULL,
    `vat_number` VARCHAR(20) NULL,
    `village` VARCHAR(100) NULL,
    `bank_account_holder` VARCHAR(200) NULL,
    `bank_account_number` VARCHAR(50) NULL,
    `bank_name` VARCHAR(100) NULL,
    `bank_swift_code` VARCHAR(20) NULL,

    PRIMARY KEY (`company_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `departments` (
    `department_id` INTEGER NOT NULL AUTO_INCREMENT,
    `company_id` INTEGER NOT NULL,
    `branch_id` INTEGER NULL,
    `department_code` VARCHAR(20) NOT NULL,
    `department_name` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `head_employee_id` INTEGER NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `status` VARCHAR(20) NOT NULL DEFAULT 'Approved',

    PRIMARY KEY (`department_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `documents` (
    `document_id` INTEGER NOT NULL AUTO_INCREMENT,
    `company_id` INTEGER NOT NULL,
    `employee_id` INTEGER NULL,
    `document_type` VARCHAR(50) NOT NULL,
    `document_name` VARCHAR(200) NOT NULL,
    `document_url` VARCHAR(500) NOT NULL,
    `file_size` INTEGER NULL,
    `mime_type` VARCHAR(50) NULL,
    `uploaded_by` INTEGER NOT NULL,
    `uploaded_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expiry_date` DATE NULL,
    `is_verified` BOOLEAN NOT NULL DEFAULT false,
    `verified_by` INTEGER NULL,
    `verified_at` DATETIME(3) NULL,

    PRIMARY KEY (`document_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `employee_change_requests` (
    `request_id` INTEGER NOT NULL AUTO_INCREMENT,
    `employee_id` INTEGER NOT NULL,
    `company_id` INTEGER NOT NULL,
    `request_type` ENUM('PhoneUpdate', 'EmailUpdate', 'AddressUpdate', 'BankAccountUpdate', 'NameCorrection', 'DocumentUpdate') NOT NULL,
    `old_value` TEXT NULL,
    `new_value` TEXT NOT NULL,
    `reason` TEXT NULL,
    `attachment_url` VARCHAR(500) NULL,
    `status` ENUM('Pending', 'Approved', 'Rejected', 'Cancelled') NOT NULL DEFAULT 'Pending',
    `submitted_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `reviewed_by` INTEGER NULL,
    `reviewed_at` DATETIME(3) NULL,
    `review_remarks` TEXT NULL,

    PRIMARY KEY (`request_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `employee_leaves` (
    `leave_id` INTEGER NOT NULL AUTO_INCREMENT,
    `employee_id` INTEGER NOT NULL,
    `leave_type_id` INTEGER NOT NULL,
    `company_id` INTEGER NOT NULL,
    `start_date` DATE NOT NULL,
    `end_date` DATE NOT NULL,
    `total_days` DECIMAL(5, 2) NOT NULL,
    `reason` TEXT NULL,
    `status` ENUM('Pending', 'Approved', 'Rejected', 'Cancelled') NOT NULL DEFAULT 'Pending',
    `approved_by` INTEGER NULL,
    `approved_at` DATETIME(3) NULL,
    `rejection_reason` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`leave_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `employee_salary_components` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `employee_id` INTEGER NOT NULL,
    `component_id` INTEGER NOT NULL,
    `custom_value` DECIMAL(12, 2) NULL,
    `is_applicable` BOOLEAN NOT NULL DEFAULT true,
    `effective_from` DATE NOT NULL,
    `effective_to` DATE NULL,
    `remarks` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `company_id` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `employee_transfers` (
    `transfer_id` INTEGER NOT NULL AUTO_INCREMENT,
    `employee_id` INTEGER NOT NULL,
    `company_id` INTEGER NOT NULL,
    `from_branch_id` INTEGER NOT NULL,
    `to_branch_id` INTEGER NOT NULL,
    `from_department_id` INTEGER NULL,
    `to_department_id` INTEGER NULL,
    `from_post_id` INTEGER NULL,
    `to_post_id` INTEGER NULL,
    `from_base_salary` DECIMAL(12, 2) NULL,
    `to_base_salary` DECIMAL(12, 2) NULL,
    `transfer_date` DATE NOT NULL,
    `effective_from` DATE NOT NULL,
    `transfer_type` ENUM('Permanent', 'Temporary', 'Deputation') NOT NULL DEFAULT 'Permanent',
    `transfer_reason` TEXT NULL,
    `status` ENUM('Initiated', 'Approved', 'Rejected', 'Completed') NOT NULL DEFAULT 'Initiated',
    `initiated_by` INTEGER NOT NULL,
    `approved_by` INTEGER NULL,
    `approved_at` DATETIME(3) NULL,
    `remarks` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`transfer_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `employees` (
    `employee_id` INTEGER NOT NULL AUTO_INCREMENT,
    `company_id` INTEGER NOT NULL,
    `branch_id` INTEGER NOT NULL,
    `employee_code` VARCHAR(50) NOT NULL,
    `first_name` VARCHAR(100) NOT NULL,
    `middle_name` VARCHAR(100) NULL,
    `last_name` VARCHAR(100) NOT NULL,
    `date_of_birth` DATE NOT NULL,
    `gender` ENUM('Male', 'Female', 'Other') NOT NULL,
    `blood_group` VARCHAR(5) NULL,
    `marital_status` ENUM('Single', 'Married', 'Divorced', 'Widowed') NULL,
    `personal_email` VARCHAR(100) NOT NULL,
    `work_email` VARCHAR(100) NULL,
    `phone_number` VARCHAR(15) NOT NULL,
    `alternate_phone` VARCHAR(15) NULL,
    `emergency_contact_name` VARCHAR(200) NULL,
    `emergency_contact_phone` VARCHAR(15) NULL,
    `current_address` TEXT NULL,
    `permanent_address` TEXT NULL,
    `city` VARCHAR(100) NULL,
    `state` VARCHAR(100) NULL,
    `pincode` VARCHAR(10) NULL,
    `department_id` INTEGER NOT NULL,
    `post_id` INTEGER NOT NULL,
    `grade_id` INTEGER NULL,
    `category_id` INTEGER NULL,
    `education_level` VARCHAR(80) NULL,
    `experience_level` VARCHAR(50) NULL,
    `skill_level` VARCHAR(100) NULL,
    `date_of_joining` DATE NOT NULL,
    `date_of_confirmation` DATE NULL,
    `employment_type` ENUM('FullTime', 'PartTime', 'Contract', 'Intern') NOT NULL DEFAULT 'FullTime',
    `probation_months` INTEGER NOT NULL DEFAULT 6,
    `reporting_manager_id` INTEGER NULL,
    `work_location` ENUM('Office', 'Remote', 'Hybrid', 'Field') NOT NULL DEFAULT 'Office',
    `current_base_salary` DECIMAL(12, 2) NOT NULL,
    `current_hra_percentage` DECIMAL(5, 2) NOT NULL DEFAULT 40.00,
    `current_special_allowance` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `bank_account_holder` VARCHAR(200) NOT NULL,
    `bank_name` VARCHAR(100) NOT NULL,
    `bank_account_number` VARCHAR(50) NOT NULL,
    `bank_ifsc_code` VARCHAR(20) NOT NULL,
    `bank_branch` VARCHAR(200) NULL,
    `password_hash` VARCHAR(191) NULL,
    `profile_photo_url` VARCHAR(500) NULL,
    `employment_status` ENUM('Active', 'Inactive', 'Resigned', 'Terminated', 'OnNotice', 'Transferred', 'Pending', 'Rejected') NOT NULL DEFAULT 'Active',
    `resignation_date` DATE NULL,
    `last_working_date` DATE NULL,
    `exit_reason` TEXT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_by` INTEGER NULL,
    `full_name` VARCHAR(191) NULL,
    `must_change_password` BOOLEAN NOT NULL DEFAULT false,
    `national_id` VARCHAR(20) NULL,
    `rssb_number` VARCHAR(20) NULL,
    `tin_number` VARCHAR(20) NULL,

    PRIMARY KEY (`employee_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `holidays` (
    `holiday_id` INTEGER NOT NULL AUTO_INCREMENT,
    `company_id` INTEGER NOT NULL,
    `holiday_name` VARCHAR(200) NOT NULL,
    `holiday_date` DATE NOT NULL,
    `holiday_type` VARCHAR(20) NOT NULL DEFAULT 'National',
    `description` TEXT NULL,
    `is_recurring_yearly` BOOLEAN NOT NULL DEFAULT true,
    `applicable_for` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`holiday_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `hr_users` (
    `user_id` INTEGER NOT NULL AUTO_INCREMENT,
    `company_id` INTEGER NULL,
    `employee_id` INTEGER NULL,
    `username` VARCHAR(50) NOT NULL,
    `email` VARCHAR(100) NOT NULL,
    `refresh_token_hash` VARCHAR(191) NULL,
    `activation_token` VARCHAR(191) NULL,
    `activation_expires_at` DATETIME(3) NULL,
    `password_hash` VARCHAR(191) NOT NULL,
    `full_name` VARCHAR(200) NOT NULL,
    `role` ENUM('PlatformAdmin', 'SuperAdmin', 'Admin', 'BranchHR', 'User') NOT NULL,
    `access_scope` ENUM('AllBranches', 'RegionOnly', 'BranchOnly', 'Self') NOT NULL DEFAULT 'BranchOnly',
    `accessible_branches` LONGTEXT NULL,
    `accessible_regions` LONGTEXT NULL,
    `permissions` LONGTEXT NULL,
    `last_login` DATETIME(3) NULL,
    `login_attempts` INTEGER NOT NULL DEFAULT 0,
    `is_locked` BOOLEAN NOT NULL DEFAULT false,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `branch_id` INTEGER NULL,
    `must_change_password` BOOLEAN NOT NULL DEFAULT false,
    `national_id` VARCHAR(30) NULL,
    `phone_number` VARCHAR(30) NULL,
    `date_of_birth` DATE NULL,
    `payment_method` VARCHAR(50) NULL,
    `payment_number` VARCHAR(100) NULL,
    `category` VARCHAR(120) NULL,
    `contract_type` VARCHAR(80) NULL,
    `education_level` VARCHAR(80) NULL,
    `contract_start` DATE NULL,
    `contract_end` DATE NULL,
    `account_status` ENUM('ACTIVE', 'BLOCKED', 'LOCKED', 'PENDING') NOT NULL DEFAULT 'ACTIVE',

    UNIQUE INDEX `hr_users_email_key`(`email`),
    PRIMARY KEY (`user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `leave_balances` (
    `balance_id` INTEGER NOT NULL AUTO_INCREMENT,
    `employee_id` INTEGER NOT NULL,
    `leave_type_id` INTEGER NOT NULL,
    `company_id` INTEGER NOT NULL,
    `financial_year` VARCHAR(9) NOT NULL,
    `opening_balance` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    `accrued_days` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    `used_days` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    `closing_balance` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`balance_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `leave_types` (
    `leave_type_id` INTEGER NOT NULL AUTO_INCREMENT,
    `company_id` INTEGER NOT NULL,
    `leave_code` VARCHAR(20) NOT NULL,
    `leave_name` VARCHAR(100) NOT NULL,
    `default_days_per_year` INTEGER NOT NULL DEFAULT 0,
    `max_days_per_year` INTEGER NULL,
    `carry_forward_limit` INTEGER NOT NULL DEFAULT 0,
    `is_paid` BOOLEAN NOT NULL DEFAULT true,
    `requires_approval` BOOLEAN NOT NULL DEFAULT true,
    `is_active` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`leave_type_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `notification_id` INTEGER NOT NULL AUTO_INCREMENT,
    `company_id` INTEGER NOT NULL,
    `branch_id` INTEGER NULL,
    `recipient_type` VARCHAR(20) NOT NULL,
    `recipient_id` INTEGER NOT NULL,
    `notification_type` ENUM('SalaryCredited', 'PayslipReady', 'LeaveApproved', 'LeaveRejected', 'ProfileUpdated', 'ChangeRequestApproved', 'ChangeRequestRejected', 'BirthdayReminder', 'DocumentExpiry', 'GeneralAnnouncement', 'TransferInitiated', 'TransferApproved', 'TransferCompleted') NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `message` TEXT NOT NULL,
    `short_message` VARCHAR(160) NULL,
    `delivery_methods` VARCHAR(191) NOT NULL DEFAULT 'IN_APP',
    `email_sent` BOOLEAN NOT NULL DEFAULT false,
    `email_sent_at` DATETIME(3) NULL,
    `sms_sent` BOOLEAN NOT NULL DEFAULT false,
    `sms_sent_at` DATETIME(3) NULL,
    `is_read` BOOLEAN NOT NULL DEFAULT false,
    `read_at` DATETIME(3) NULL,
    `is_archived` BOOLEAN NOT NULL DEFAULT false,
    `action_url` VARCHAR(500) NULL,
    `related_entity_type` VARCHAR(50) NULL,
    `related_entity_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`notification_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payroll_batches` (
    `batch_id` INTEGER NOT NULL AUTO_INCREMENT,
    `company_id` INTEGER NOT NULL,
    `branch_id` INTEGER NOT NULL,
    `batch_code` VARCHAR(50) NOT NULL,
    `pay_period_start` DATE NOT NULL,
    `pay_period_end` DATE NOT NULL,
    `pay_date` DATE NOT NULL,
    `total_employees` INTEGER NOT NULL DEFAULT 0,
    `total_gross` DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    `total_deductions` DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    `total_net_payable` DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    `total_bonus` DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    `status` ENUM('Draft', 'Calculated', 'Approved', 'PaymentInitiated', 'Paid', 'Cancelled') NOT NULL DEFAULT 'Draft',
    `calculated_at` DATETIME(3) NULL,
    `calculated_by` INTEGER NULL,
    `approved_at` DATETIME(3) NULL,
    `approved_by` INTEGER NULL,
    `paid_at` DATETIME(3) NULL,
    `paid_by` INTEGER NULL,
    `remarks` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`batch_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payslips` (
    `payslip_id` INTEGER NOT NULL AUTO_INCREMENT,
    `batch_id` INTEGER NOT NULL,
    `employee_id` INTEGER NOT NULL,
    `company_id` INTEGER NOT NULL,
    `payslip_number` VARCHAR(50) NOT NULL,
    `days_present` INTEGER NOT NULL DEFAULT 30,
    `days_absent` INTEGER NOT NULL DEFAULT 0,
    `paid_leaves` INTEGER NOT NULL DEFAULT 0,
    `unpaid_leaves` INTEGER NOT NULL DEFAULT 0,
    `basic_salary` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `hra` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `conveyance` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `medical_allowance` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `special_allowance` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `bonus` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `other_earnings` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `total_earnings` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `pf_employee` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `pf_employer` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `esi_employee` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `esi_employer` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `professional_tax` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `tds` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `advance_recovery` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `other_deductions` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `total_deductions` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `net_payable` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `net_pay_words` VARCHAR(500) NULL,
    `payment_status` ENUM('Pending', 'Processed', 'Paid', 'Failed') NOT NULL DEFAULT 'Pending',
    `payment_date` DATE NULL,
    `payment_mode` ENUM('BankTransfer', 'Cash', 'Cheque') NOT NULL DEFAULT 'BankTransfer',
    `transaction_reference` VARCHAR(100) NULL,
    `calculation_data` LONGTEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`payslip_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `posts` (
    `post_id` INTEGER NOT NULL AUTO_INCREMENT,
    `company_id` INTEGER NOT NULL,
    `branch_id` INTEGER NULL,
    `department_id` INTEGER NOT NULL,
    `grade_id` INTEGER NULL,
    `post_code` VARCHAR(20) NOT NULL,
    `post_title` VARCHAR(100) NOT NULL,
    `post_description` TEXT NULL,
    `base_salary` DECIMAL(12, 2) NOT NULL,
    `hra_percentage` DECIMAL(5, 2) NOT NULL DEFAULT 40.00,
    `da_percentage` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    `conveyance_allowance` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `medical_allowance` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `special_allowance` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `pf_applicable` BOOLEAN NOT NULL DEFAULT true,
    `pf_percentage` DECIMAL(5, 2) NOT NULL DEFAULT 12.00,
    `esi_applicable` BOOLEAN NOT NULL DEFAULT false,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`post_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `regions` (
    `region_id` INTEGER NOT NULL AUTO_INCREMENT,
    `company_id` INTEGER NOT NULL,
    `region_code` VARCHAR(20) NOT NULL,
    `region_name` VARCHAR(100) NOT NULL,
    `regional_head_id` INTEGER NULL,
    `description` TEXT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`region_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `salary_components` (
    `component_id` INTEGER NOT NULL AUTO_INCREMENT,
    `company_id` INTEGER NOT NULL,
    `component_code` VARCHAR(20) NOT NULL,
    `component_name` VARCHAR(100) NOT NULL,
    `component_type` ENUM('Earning', 'Deduction') NOT NULL,
    `calculation_type` ENUM('Fixed', 'Percentage', 'Formula') NOT NULL,
    `default_value` DECIMAL(12, 2) NULL,
    `percentage_of` VARCHAR(20) NULL,
    `formula` TEXT NULL,
    `is_taxable` BOOLEAN NOT NULL DEFAULT true,
    `is_mandatory` BOOLEAN NOT NULL DEFAULT false,
    `display_order` INTEGER NOT NULL DEFAULT 0,
    `is_active` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`component_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `salary_grades` (
    `grade_id` INTEGER NOT NULL AUTO_INCREMENT,
    `company_id` INTEGER NOT NULL,
    `branch_id` INTEGER NULL,
    `grade_code` VARCHAR(10) NOT NULL,
    `grade_name` VARCHAR(50) NOT NULL,
    `min_salary` DECIMAL(12, 2) NULL,
    `max_salary` DECIMAL(12, 2) NULL,
    `description` TEXT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`grade_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tax_deductions` (
    `tax_id` INTEGER NOT NULL AUTO_INCREMENT,
    `employee_id` INTEGER NOT NULL,
    `company_id` INTEGER NOT NULL,
    `financial_year` VARCHAR(9) NOT NULL,
    `estimated_annual_income` DECIMAL(14, 2) NULL,
    `total_exemptions` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `total_deductions_80c` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `total_deductions_80d` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `other_deductions` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `taxable_income` DECIMAL(14, 2) NULL,
    `tax_liability` DECIMAL(12, 2) NULL,
    `tds_deducted_so_far` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `tds_per_month` DECIMAL(10, 2) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`tax_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `zones` (
    `zone_id` INTEGER NOT NULL AUTO_INCREMENT,
    `company_id` INTEGER NOT NULL,
    `region_id` INTEGER NULL,
    `zone_code` VARCHAR(20) NOT NULL,
    `zone_name` VARCHAR(100) NOT NULL,
    `zone_head_id` INTEGER NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`zone_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `system_categories` (
    `category_id` INTEGER NOT NULL AUTO_INCREMENT,
    `category_name` VARCHAR(100) NOT NULL,
    `category_code` VARCHAR(50) NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `system_categories_category_code_key`(`category_code`),
    PRIMARY KEY (`category_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `system_roles` (
    `role_id` INTEGER NOT NULL AUTO_INCREMENT,
    `role_name` VARCHAR(100) NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `system_roles_role_name_key`(`role_name`),
    PRIMARY KEY (`role_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `salary_configurations` (
    `config_id` INTEGER NOT NULL AUTO_INCREMENT,
    `company_id` INTEGER NOT NULL,
    `category_id` INTEGER NOT NULL,
    `basic_salary` DECIMAL(12, 2) NOT NULL,
    `transport_allowance` DECIMAL(12, 2) NULL DEFAULT 0.00,
    `housing_allowance` DECIMAL(12, 2) NULL DEFAULT 0.00,
    `meal_allowance` DECIMAL(12, 2) NULL DEFAULT 0.00,
    `performance_bonus` DECIMAL(12, 2) NULL DEFAULT 0.00,
    `project_bonus` DECIMAL(12, 2) NULL DEFAULT 0.00,
    `gross_salary` DECIMAL(12, 2) NULL DEFAULT 0.00,
    `net_salary` DECIMAL(12, 2) NULL DEFAULT 0.00,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `salary_configurations_category_id_key`(`category_id`),
    PRIMARY KEY (`config_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `category_deductions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `category_id` INTEGER NOT NULL,
    `deduction_name` VARCHAR(100) NOT NULL,
    `percentage` DECIMAL(5, 2) NOT NULL,
    `is_enabled` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `category_deductions_category_id_deduction_name_key`(`category_id`, `deduction_name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `employee_payment_profiles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `employee_id` INTEGER NOT NULL,
    `payment_method` VARCHAR(50) NOT NULL,
    `account_number` VARCHAR(50) NULL,
    `phone_number` VARCHAR(20) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `employee_payment_profiles_employee_id_key`(`employee_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payroll_records` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `employee_id` INTEGER NOT NULL,
    `category_id` INTEGER NOT NULL,
    `gross_salary` DECIMAL(12, 2) NOT NULL,
    `total_deductions` DECIMAL(12, 2) NOT NULL,
    `net_salary` DECIMAL(12, 2) NOT NULL,
    `payment_status` VARCHAR(20) NOT NULL DEFAULT 'Pending',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `payroll_records_employee_id_key`(`employee_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `deduction_settings` (
    `deduction_id` INTEGER NOT NULL AUTO_INCREMENT,
    `company_id` INTEGER NOT NULL,
    `tax_percentage` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    `insurance_percentage` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    `social_security_percentage` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    `other_deductions` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `deduction_settings_company_id_key`(`company_id`),
    PRIMARY KEY (`deduction_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `attendance` ADD CONSTRAINT `attendance_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`employee_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `branches` ADD CONSTRAINT `branches_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`company_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `departments` ADD CONSTRAINT `departments_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`company_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `departments` ADD CONSTRAINT `departments_branch_id_fkey` FOREIGN KEY (`branch_id`) REFERENCES `branches`(`branch_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `documents` ADD CONSTRAINT `documents_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`employee_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `employee_change_requests` ADD CONSTRAINT `employee_change_requests_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`employee_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `employee_leaves` ADD CONSTRAINT `employee_leaves_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`employee_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `employee_leaves` ADD CONSTRAINT `employee_leaves_leave_type_id_fkey` FOREIGN KEY (`leave_type_id`) REFERENCES `leave_types`(`leave_type_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `employee_salary_components` ADD CONSTRAINT `employee_salary_components_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`employee_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `employee_salary_components` ADD CONSTRAINT `employee_salary_components_component_id_fkey` FOREIGN KEY (`component_id`) REFERENCES `salary_components`(`component_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `employee_transfers` ADD CONSTRAINT `employee_transfers_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`employee_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `employees` ADD CONSTRAINT `employees_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`company_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `employees` ADD CONSTRAINT `employees_branch_id_fkey` FOREIGN KEY (`branch_id`) REFERENCES `branches`(`branch_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `employees` ADD CONSTRAINT `employees_department_id_fkey` FOREIGN KEY (`department_id`) REFERENCES `departments`(`department_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `employees` ADD CONSTRAINT `employees_post_id_fkey` FOREIGN KEY (`post_id`) REFERENCES `posts`(`post_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `employees` ADD CONSTRAINT `employees_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `system_categories`(`category_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `hr_users` ADD CONSTRAINT `hr_users_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`company_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `hr_users` ADD CONSTRAINT `hr_users_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`employee_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `hr_users` ADD CONSTRAINT `hr_users_branch_id_fkey` FOREIGN KEY (`branch_id`) REFERENCES `branches`(`branch_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leave_balances` ADD CONSTRAINT `leave_balances_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`employee_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leave_balances` ADD CONSTRAINT `leave_balances_leave_type_id_fkey` FOREIGN KEY (`leave_type_id`) REFERENCES `leave_types`(`leave_type_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payroll_batches` ADD CONSTRAINT `payroll_batches_branch_id_fkey` FOREIGN KEY (`branch_id`) REFERENCES `branches`(`branch_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payslips` ADD CONSTRAINT `payslips_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`employee_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payslips` ADD CONSTRAINT `payslips_batch_id_fkey` FOREIGN KEY (`batch_id`) REFERENCES `payroll_batches`(`batch_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `posts` ADD CONSTRAINT `posts_department_id_fkey` FOREIGN KEY (`department_id`) REFERENCES `departments`(`department_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `salary_grades` ADD CONSTRAINT `salary_grades_branch_id_fkey` FOREIGN KEY (`branch_id`) REFERENCES `branches`(`branch_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tax_deductions` ADD CONSTRAINT `tax_deductions_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`employee_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `zones` ADD CONSTRAINT `zones_region_id_fkey` FOREIGN KEY (`region_id`) REFERENCES `regions`(`region_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `employee_payment_profiles` ADD CONSTRAINT `employee_payment_profiles_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`employee_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payroll_records` ADD CONSTRAINT `payroll_records_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`employee_id`) ON DELETE RESTRICT ON UPDATE CASCADE;
