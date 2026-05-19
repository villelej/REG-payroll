import { Request } from 'express';
import { hr_users_role } from '@prisma/client';

export interface RequestWithUser extends Request {
  user: {
    userId: number;
    email: string;
    role: hr_users_role;
    companyId: number;
    employeeId?: number;
    
    // PHASE 1 BACKWARD COMPATIBILITY: Primary branch reference
    branchId?: number;
    
    // NEW: Multiple branch support
    branches: number[];
    canViewAllBranches: boolean;
  };
}
