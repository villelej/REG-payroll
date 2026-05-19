/*
  Warnings:

  - A unique constraint covering the columns `[company_id,entity_type]` on the table `code_sequences` will be added. If there are existing rows, you will be unable to create this constraint.

*/
-- CreateTable
CREATE TABLE `code_sequences` (
    `sequence_id` INT NOT NULL AUTO_INCREMENT,
    `company_id` INT NOT NULL,
    `entity_type` VARCHAR(50) NOT NULL,
    `next_sequence` INT NOT NULL DEFAULT 1,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `code_sequences_company_id_entity_type_key`(`company_id`, `entity_type`),
    INDEX `code_sequences_company_id_idx`(`company_id`),
    PRIMARY KEY (`sequence_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
