-- CreateTable
CREATE TABLE `hr_user_branches` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `branch_id` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `hr_user_branches_user_id_branch_id_key`(`user_id`, `branch_id`),
    INDEX `hr_user_branches_user_id_idx`(`user_id`),
    INDEX `hr_user_branches_branch_id_idx`(`branch_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `hr_user_branches` ADD CONSTRAINT `hr_user_branches_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `hr_users`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `hr_user_branches` ADD CONSTRAINT `hr_user_branches_branch_id_fkey` FOREIGN KEY (`branch_id`) REFERENCES `branches`(`branch_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddColumn: canViewAllBranches
ALTER TABLE `hr_users` ADD COLUMN `canViewAllBranches` BOOLEAN NOT NULL DEFAULT false;
