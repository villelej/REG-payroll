# Multi-Branch Assignment Architecture Redesign
## Enterprise HR & Payroll System — Phase-Based Migration

**Date:** May 18, 2026  
**Status:** Design Phase  
**Risk Level:** Medium (requires careful phased migration)

---

## EXECUTIVE SUMMARY

This document outlines a safe, phased migration from single-branch to multi-branch HR/Admin assignment while maintaining 100% backward compatibility with the existing system.

### Current State
- `hr_users.branch_id` - Single branch reference
- `accessible_branches` - Unused JSON string field
- No explicit permission for viewing all branches

### Target State
- Junction table `hr_user_branches` - Many-to-many relationship
- `canViewAllBranches` - Boolean permission flag
- Backward compatible with existing `branchId` JWT payload

---

## PHASE 1: DATABASE MIGRATION

### 1.1 Updated Prisma Schema

#### New Model: hr_user_branches
```prisma
model hr_user_branches {
  id        Int   @id @default(autoincrement())
  user_id   Int
  branch_id Int
  createdAt DateTime @default(now())

  // Relations
  hr_users hr_users @relation(fields: [user_id], references: [user_id], onDelete: Cascade)
  branches branches @relation(fields: [branch_id], references: [branch_id], onDelete: Cascade)

  // Unique constraint: One HR user can only have one assignment per branch
  @@unique([user_id, branch_id])
  @@index([user_id])
  @@index([branch_id])
}
```

#### Updated: hr_users Model
```prisma
model hr_users {
  user_id               Int                   @id @default(autoincrement())
  company_id            Int?
  employee_id           Int?
  username              String                @db.VarChar(50)
  email                 String                @unique @db.VarChar(100)
  refresh_token_hash    String?
  activation_token      String?
  activation_expires_at DateTime?
  password_hash         String
  full_name             String                @db.VarChar(200)
  role                  hr_users_role
  access_scope          hr_users_access_scope @default(BranchOnly)
  
  // NEW: Permission to view all branches
  canViewAllBranches    Boolean               @default(false)
  
  // KEPT FOR BACKWARD COMPATIBILITY: Primary/default branch
  branch_id             Int?
  
  // DEPRECATED (marked for removal in Phase 3)
  accessible_branches   String?               @db.LongText
  accessible_regions    String?               @db.LongText
  permissions           String?               @db.LongText
  
  last_login            DateTime?
  login_attempts        Int                   @default(0)
  is_locked             Boolean               @default(false)
  is_active             Boolean               @default(true)
  created_at            DateTime              @default(now())
  updated_at            DateTime              @updatedAt
  must_change_password  Boolean               @default(false)
  national_id           String?               @db.VarChar(30)
  phone_number          String?               @db.VarChar(30)
  date_of_birth         DateTime?             @db.Date
  payment_method        String?               @db.VarChar(50)
  payment_number        String?               @db.VarChar(100)
  category              String?               @db.VarChar(120)
  contract_type         String?               @db.VarChar(80)
  education_level       String?               @db.VarChar(80)
  contract_start        DateTime?             @db.Date
  contract_end          DateTime?             @db.Date
  account_status        user_account_status   @default(ACTIVE)

  // Relations
  companies           companies?              @relation(fields: [company_id], references: [company_id])
  employees           employees?              @relation(fields: [employee_id], references: [employee_id])
  branches            branches?               @relation(fields: [branch_id], references: [branch_id])
  
  // NEW: Many-to-many relationship with branches
  assignedBranches    hr_user_branches[]
}
```

#### Updated: branches Model
```prisma
model branches {
  // ... existing fields ...
  
  // NEW: Relation back to HR users (many-to-many)
  assignedHRUsers     hr_user_branches[]
  hr_users            hr_users[]            // Backward compat for branch_id FK
}
```

### 1.2 Create Prisma Migration

**Command:**
```bash
npx prisma migrate dev --name add_multi_branch_support
```

**Migration SQL:**
```sql
-- Create junction table
CREATE TABLE hr_user_branches (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  branch_id INT NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE KEY unique_user_branch (user_id, branch_id),
  FOREIGN KEY (user_id) REFERENCES hr_users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (branch_id) REFERENCES branches(branch_id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_branch_id (branch_id)
);

-- Add new column to hr_users
ALTER TABLE hr_users ADD COLUMN canViewAllBranches BOOLEAN DEFAULT FALSE;

-- Migrate existing data: Copy single branch_id assignments to junction table
INSERT INTO hr_user_branches (user_id, branch_id)
SELECT user_id, branch_id FROM hr_users 
WHERE branch_id IS NOT NULL 
  AND role IN ('BranchHR', 'CompanyAdmin')
ON DUPLICATE KEY UPDATE id = id;  -- Ignore duplicates safely
```

### 1.3 Data Migration Script

**File:** `backend/prisma/migrate-multi-branch.ts`

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateExistingBranches() {
  try {
    // Get all HR users with single branch assignment
    const hrUsersWithBranch = await prisma.hr_users.findMany({
      where: {
        branch_id: { not: null },
        role: { in: ['BranchHR', 'CompanyAdmin'] }
      }
    });

    console.log(`Found ${hrUsersWithBranch.length} HR users with branch assignments`);

    // Create junction table entries
    for (const user of hrUsersWithBranch) {
      const existingAssignment = await prisma.hr_user_branches.findUnique({
        where: {
          user_id_branch_id: {
            user_id: user.user_id,
            branch_id: user.branch_id!
          }
        }
      });

      if (!existingAssignment) {
        await prisma.hr_user_branches.create({
          data: {
            user_id: user.user_id,
            branch_id: user.branch_id!
          }
        });
        console.log(`✓ Migrated: User ${user.user_id} -> Branch ${user.branch_id}`);
      }
    }

    console.log('✓ Migration completed successfully');
  } catch (error) {
    console.error('✗ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
migrateExistingBranches();
```

**Run migration:**
```bash
npx ts-node prisma/migrate-multi-branch.ts
```

---

## PHASE 2: BACKEND REFACTOR

### 2.1 Updated JWT Strategy

**File:** `backend/src/auth/jwt.strategy.ts`

```typescript
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'your-super-secret-key',
    });
  }

  async validate(payload: any) {
    // Get user to load assigned branches
    const user = await this.prisma.hr_users.findUnique({
      where: { user_id: payload.sub },
      include: {
        assignedBranches: {
          select: { branch_id: true }
        }
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Determine accessible branches
    let branches: number[] = [];
    
    if (user.canViewAllBranches) {
      // Get all branches for company
      const allBranches = await this.prisma.branches.findMany({
        where: { company_id: user.company_id || undefined },
        select: { branch_id: true }
      });
      branches = allBranches.map(b => b.branch_id);
    } else {
      // Get assigned branches from junction table
      branches = user.assignedBranches.map(ab => ab.branch_id);
    }

    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
      companyId: payload.companyId,
      employeeId: payload.employeeId,
      
      // PHASE 1 BACKWARD COMPAT: Keep primary branchId
      branchId: user.branch_id,
      
      // NEW: Multiple branches
      branches: branches,
      canViewAllBranches: user.canViewAllBranches,
    };
  }
}
```

### 2.2 Authorization Helper Service

**File:** `backend/src/common/services/authorization.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { RequestWithUser } from '../interfaces/request.interface';

@Injectable()
export class AuthorizationService {
  /**
   * Get all accessible branch IDs for a user
   * Respects canViewAllBranches permission
   */
  getAccessibleBranches(user: any): number[] {
    if (user.role === 'SuperAdmin') {
      return []; // SuperAdmin has no restrictions
    }
    
    if (user.canViewAllBranches) {
      return []; // Empty array signals "all branches"
    }
    
    return user.branches || [user.branchId].filter(Boolean);
  }

  /**
   * Check if user can access specific branch
   */
  canAccessBranch(user: any, branchId: number): boolean {
    if (user.role === 'SuperAdmin') {
      return true;
    }
    
    if (user.canViewAllBranches) {
      return true;
    }
    
    const branches = user.branches || [user.branchId];
    return branches.includes(branchId);
  }

  /**
   * Build WHERE clause for Prisma queries
   * Returns filter to get only accessible records
   */
  buildBranchFilter(user: any): any {
    const branches = this.getAccessibleBranches(user);
    
    if (user.role === 'SuperAdmin' || branches.length === 0) {
      return {}; // No filter needed
    }
    
    if (branches.length === 1) {
      return { branch_id: branches[0] };
    }
    
    return { branch_id: { in: branches } };
  }
}
```

### 2.3 Updated Request Interface

**File:** `backend/src/common/interfaces/request.interface.ts`

```typescript
import { Request } from 'express';
import { hr_users_role } from '@prisma/client';

export interface RequestWithUser extends Request {
  user: {
    userId: number;
    email: string;
    role: hr_users_role;
    companyId: number;
    employeeId?: number;
    
    // PHASE 1 BACKWARD COMPAT
    branchId?: number;
    
    // NEW: Multiple branches support
    branches: number[];
    canViewAllBranches: boolean;
  };
}
```

### 2.4 Employees Service - Updated Filtering

**File:** `backend/src/employees/employees.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { AuthorizationService } from '../common/services/authorization.service';

@Injectable()
export class EmployeesService {
  constructor(
    private prisma: PrismaService,
    private authService: AuthorizationService
  ) {}

  async findAll(user: any, branchIdParam?: number) {
    const where: any = { company_id: user.companyId };

    // Apply branch filtering based on user role
    if (user.role === 'BranchHR' || user.role === 'CompanyAdmin') {
      const branchFilter = this.authService.buildBranchFilter(user);
      
      if (Object.keys(branchFilter).length > 0) {
        where.branch_id = branchFilter.branch_id;
      }
    } else if (user.role !== 'SuperAdmin') {
      where.user_id = user.userId;
    }

    return this.prisma.employees.findMany({ where });
  }

  async findOne(id: number, user: any) {
    const employee = await this.prisma.employees.findUnique({
      where: { employee_id: id }
    });

    if (!employee) {
      throw new Error('Employee not found');
    }

    // Authorization check
    if (user.role !== 'SuperAdmin') {
      if (!this.authService.canAccessBranch(user, employee.branch_id)) {
        throw new Error('Access denied to this employee');
      }
    }

    return employee;
  }
}
```

### 2.5 Users Service - Updated Filtering

**File:** `backend/src/users/users.service.ts`

```typescript
async findAll(actor: any, query: Record<string, string>) {
  const where: any = {};
  const authService = this.authService; // Assume injected
  
  // Role-based visibility
  if (actor.role === 'BranchHR' || actor.role === 'CompanyAdmin') {
    where.role = 'Employee';
    if (actor.companyId) {
      where.company_id = actor.companyId;
    }
    
    // NEW: Use authorization service for branch filtering
    const branchFilter = authService.buildBranchFilter(actor);
    if (Object.keys(branchFilter).length > 0) {
      where.branch_id = branchFilter.branch_id;
    }
  } else if (actor.role === 'SuperAdmin') {
    // No filters
  } else {
    where.user_id = actor.userId;
  }

  // Apply search
  const search = (query.q || '').trim();
  if (search) {
    where.AND = [
      ...(where.AND || []),
      {
        OR: [
          { full_name: { contains: search } },
          { email: { contains: search } },
          { username: { contains: search } },
        ]
      }
    ];
  }

  if (query.role) {
    let r = query.role;
    if (r === 'User' || r === 'user' || r === 'users') r = 'Employee';
    if (r === 'Admin' || r === 'admin') r = 'CompanyAdmin';
    where.role = r as hr_users_role;
  }

  return this.prisma.hr_users.findMany({
    where,
    include: {
      assignedBranches: { select: { branch_id: true } } // Include for reference
    }
  });
}
```

### 2.6 Module Injection Pattern

**File:** `backend/src/common/common.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { AuthorizationService } from './services/authorization.service';
import { PrismaService } from '../prisma.service';

@Module({
  providers: [AuthorizationService, PrismaService],
  exports: [AuthorizationService],
})
export class CommonModule {}
```

### 2.7 Controllers - Update Signature

**File:** `backend/src/employees/employees.controller.ts`

```typescript
@Roles(hr_users_role.BranchHR, hr_users_role.SuperAdmin, hr_users_role.CompanyAdmin)
@Get()
@ApiOperation({ summary: 'Get all employees' })
findAll(@Req() req: RequestWithUser) {
  // Authorization already applied in JwtStrategy
  return this.employeesService.findAll(req.user);
}
```

---

## PHASE 2.5: SERVICE REFACTORING CHECKLIST

Update these services with authorization filtering:

- [ ] `employees.service.ts` - Employee filtering by branches
- [ ] `users.service.ts` - User list filtering by branches
- [ ] `payroll.service.ts` - Payroll batch filtering
- [ ] `attendance.service.ts` - Attendance record filtering
- [ ] `reports.service.ts` - Report data filtering
- [ ] `leaves.service.ts` - Leave request filtering
- [ ] `salary-components.service.ts` - Component assignment filtering
- [ ] `salary-settings.service.ts` - Setting filtering

**Pattern:** Every `findAll()` or `find()` method should:
1. Check user's accessible branches
2. Apply `WHERE branch_id IN (...)` filter
3. Throw authorization error if accessing restricted branch

---

## PHASE 3: JWT STRUCTURE MIGRATION

### 3.1 Timeline for JWT Changes

**Current (Phase 1-2):** Keep `branchId` in payload for backward compatibility
```json
{
  "sub": 1,
  "email": "hr@company.com",
  "role": "BranchHR",
  "companyId": 1,
  "branchId": 3,
  "branches": [3, 4, 5],
  "canViewAllBranches": false
}
```

**Future (Phase 3, after 3-6 months):** Deprecate `branchId`
```json
{
  "sub": 1,
  "email": "hr@company.com",
  "role": "BranchHR",
  "companyId": 1,
  "branches": [3, 4, 5],
  "canViewAllBranches": false
}
```

---

## PHASE 4: FRONTEND IMPLEMENTATION

### 4.1 SuperAdmin User Management - Branch Assignment

**Component:** `app/user-management/page.tsx`

**Changes:**
```typescript
// 1. Add branch assignment state
const [selectedBranches, setSelectedBranches] = useState<number[]>([]);
const [canViewAllBranches, setCanViewAllBranches] = useState(false);

// 2. Conditional rendering
const showBranchSelector = ['CompanyAdmin', 'BranchHR'].includes(selectedRole);

// 3. Handle "View All" toggle
const handleViewAllChange = (checked: boolean) => {
  setCanViewAllBranches(checked);
  if (checked) {
    setSelectedBranches([]); // Clear specific selections
  }
};

// 4. Multi-select dropdown
<div className={showBranchSelector ? "block" : "hidden"}>
  <Label>Assign Branches</Label>
  
  {canViewAllBranches ? (
    <div className="p-3 bg-green-50 border border-green-200 rounded">
      <p className="text-sm text-green-800 font-medium">
        ✓ Can view ALL branches in company
      </p>
    </div>
  ) : (
    <MultiSelect
      options={branches}
      selected={selectedBranches}
      onChange={setSelectedBranches}
      placeholder="Select branches..."
      required
    />
  )}
  
  <div className="flex items-center gap-2 mt-2">
    <input
      type="checkbox"
      id="viewAllBranches"
      checked={canViewAllBranches}
      onChange={(e) => handleViewAllChange(e.target.checked)}
    />
    <Label htmlFor="viewAllBranches">View all branches</Label>
  </div>
</div>

// 5. Save logic
const payload = {
  ...userForm,
  selectedBranches: canViewAllBranches ? [] : selectedBranches,
  canViewAllBranches
};
```

### 4.2 Hide Branch Field for Employees

```typescript
// In employee creation form
const showBranchField = ['CompanyAdmin', 'BranchHR'].includes(selectedRole);

{showBranchField && (
  <div>
    <Label>Branch</Label>
    {/* branch selector */}
  </div>
)}
```

### 4.3 Update Admin Dashboard

**Show assigned branches to HR:**
```typescript
const user = getLoggedUser();

if (user.role === 'branchhr') {
  const assignedBranches = await fetch('/api/users/my-branches');
  displayBranchesInfo(assignedBranches);
}
```

---

## SAFE MIGRATION ROADMAP

### Week 1-2: Setup & Deployment
- [ ] Deploy Prisma migration
- [ ] Run data migration script
- [ ] Deploy Phase 2 backend changes with backward compat
- [ ] Test JWT generation with new payload
- [ ] Verify all existing functionality works

### Week 3-4: UI Rollout
- [ ] Deploy frontend branch assignment UI
- [ ] Verify SuperAdmin can assign multiple branches
- [ ] Test BranchHR sees correct employees
- [ ] Test "View All Branches" toggle

### Week 5-6: Validation & Monitoring
- [ ] Monitor logs for authorization errors
- [ ] Verify no data leakage across branches
- [ ] Performance testing with large branch sets
- [ ] Load testing JWT generation

### Week 7-8: Cleanup (Phase 3)
- [ ] Remove `branchId` from JWT (deprecate)
- [ ] Remove backward compat code
- [ ] Remove unused database fields
- [ ] Clean up Prisma schema

---

## ROLLBACK STRATEGY

If issues occur:

1. **Keep junction table data** - Don't delete
2. **Revert code** - All changes are additive, safe to revert
3. **Keep `branch_id` column** - Never remove during Phase 1-2
4. **Monitor carefully** - Watch authorization logs

---

## TESTING CHECKLIST

### Unit Tests
- [ ] AuthorizationService.buildBranchFilter()
- [ ] AuthorizationService.canAccessBranch()
- [ ] JWT validation with multiple branches
- [ ] Data migration script

### Integration Tests
- [ ] BranchHR can only see assigned employees
- [ ] SuperAdmin sees all employees
- [ ] "View All Branches" works for all roles
- [ ] Authorization error on unauthorized branch

### E2E Tests
- [ ] SuperAdmin assigns branches to HR
- [ ] HR sees employees from assigned branches
- [ ] HR cannot access other branches
- [ ] Reports filtered by branch access

---

## ESTIMATED EFFORT

| Phase | Component | Effort |
|-------|-----------|--------|
| 1 | Database Migration | 4h |
| 2 | Backend Refactor | 16h |
| 2.5 | Service Updates | 20h |
| 3 | JWT Migration | 8h |
| 4 | Frontend Implementation | 12h |
| Testing | QA & Validation | 16h |
| **Total** | | **76h** |

---

## RISKS & MITIGATION

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Authorization bypass | CRITICAL | Use service layer filtering, add unit tests |
| JWT payload bloat | MEDIUM | Lazy load branches in strategy |
| Performance (large branch sets) | MEDIUM | Add indexes, use IN clause efficiently |
| Data migration loss | HIGH | Backup database before migration |
| Backward compat break | HIGH | Keep `branchId` until Phase 3 |

---

## SUCCESS CRITERIA

✓ All existing functionality works  
✓ No unauthorized data leakage  
✓ BranchHR can be assigned 1+ branches  
✓ "View All Branches" permission works  
✓ Employee/payroll filtering respects branches  
✓ Zero production incidents during rollout  
✓ JWT generates with new payload  
✓ Frontend branch assignment UI functional  

---

## NEXT STEPS

1. **Review this design** with team
2. **Approve database schema changes**
3. **Create feature branch** for development
4. **Begin Phase 1** database migration
5. **Run data migration** in dev/staging
6. **Deploy Phase 2** with monitoring

