# Multi-Branch Implementation Checklist

## Pre-Implementation Verification

- [ ] Backup current database
- [ ] Backup current codebase in git
- [ ] Review architecture document: `ARCHITECTURE_REDESIGN.md`
- [ ] Verify JWT secret is secure in `.env`
- [ ] Test existing system thoroughly before changes

---

## PHASE 1: Database Migration

### Database Changes
- [ ] Create migration file at `/prisma/migrations/add_multi_branch_support/migration.sql`
- [ ] Create junction table `hr_user_branches`
- [ ] Add `canViewAllBranches` boolean to `hr_users`
- [ ] Create indexes on junction table
- [ ] Create unique constraint on `(user_id, branch_id)`
- [ ] Add foreign key constraints with CASCADE delete

**Verification:**
```bash
# Test migration in development
npx prisma migrate dev --name add_multi_branch_support

# Verify schema updated
npx prisma studio  # Check hr_users and hr_user_branches
```

### Data Migration
- [ ] Create migration script: `backend/scripts/migrate-multi-branch.ts`
- [ ] Test script in dev database
- [ ] Review migration results
- [ ] Verify junction table populated correctly
- [ ] Check no data loss occurred

**Run migration:**
```bash
npx ts-node backend/scripts/migrate-multi-branch.ts
```

**Verify:**
```bash
# Check migration results
SELECT COUNT(*) FROM hr_user_branches;
SELECT user_id, GROUP_CONCAT(branch_id) FROM hr_user_branches GROUP BY user_id;
```

---

## PHASE 2: Backend Implementation

### Core Services
- [ ] Update `AuthorizationService`: `/backend/src/common/services/authorization.service.ts`
  - [ ] `getAccessibleBranches()`
  - [ ] `canAccessBranch()`
  - [ ] `buildBranchFilter()`
  - [ ] `buildAccessFilter()`
  - [ ] Add unit tests

- [ ] Update JWT Strategy: `/backend/src/auth/jwt.strategy.ts`
  - [ ] Load assigned branches from junction table
  - [ ] Resolve `canViewAllBranches` to full branch list
  - [ ] Include both `branchId` (legacy) and `branches` (new) in payload

- [ ] Update Request Interface: `/backend/src/common/interfaces/request.interface.ts`
  - [ ] Add `branches: number[]`
  - [ ] Add `canViewAllBranches: boolean`
  - [ ] Keep `branchId` for backward compatibility

### Module Registration
- [ ] Export `AuthorizationService` in `CommonModule`
- [ ] Inject into all controllers/services that need it
- [ ] Update dependency injection in:
  - [ ] `employees.service.ts`
  - [ ] `users.service.ts`
  - [ ] `payroll.service.ts`
  - [ ] `attendance.service.ts`
  - [ ] `reports.service.ts`
  - [ ] `leaves.service.ts`

**Update Pattern:**
```typescript
constructor(
  private prisma: PrismaService,
  private authService: AuthorizationService, // ADD THIS
) {}
```

### Service Layer Updates
For each service, update `findAll()` and authorization checks:

**employees.service.ts:**
- [ ] Update `findAll()` to use `authService.buildAccessFilter()`
- [ ] Add authorization check in `findOne()`
- [ ] Add authorization check in `create()`
- [ ] Add authorization check in `update()`
- [ ] Test filtering with different user roles

**users.service.ts:**
- [ ] Update `findAll()` to use branch filtering
- [ ] Ensure SuperAdmin sees all users
- [ ] Ensure BranchHR sees only assigned branches
- [ ] Ensure Employee sees only themselves

**payroll.service.ts:**
- [ ] Filter payroll batches by user's accessible branches
- [ ] Prevent creating payroll in unauthorized branches

**reports.service.ts:**
- [ ] Filter report data by user's accessible branches
- [ ] Ensure no cross-branch data leakage

**attendance.service.ts:**
- [ ] Filter attendance by employee's branch
- [ ] Respect user's branch access

**leaves.service.ts:**
- [ ] Filter leave requests by accessible branches

### Controller Updates
- [ ] Ensure all controllers pass `req.user` to services
- [ ] No manual branch filtering in controllers (use service layer)
- [ ] Test with JWT containing new payload

---

## PHASE 3: Testing & Validation

### Unit Tests
- [ ] `AuthorizationService` tests
  - [ ] `getAccessibleBranches()` - SuperAdmin case
  - [ ] `getAccessibleBranches()` - BranchHR with multiple branches
  - [ ] `getAccessibleBranches()` - canViewAllBranches = true
  - [ ] `canAccessBranch()` - positive and negative cases
  - [ ] `buildBranchFilter()` - various user configurations

### Integration Tests
- [ ] JWT generation with multiple branches
- [ ] Employee filtering by branch
- [ ] User list filtering by branch
- [ ] Cross-branch authorization denial
- [ ] "View All Branches" works correctly

### E2E Tests
- [ ] SuperAdmin creates HR with multiple branches
- [ ] HR can only see assigned branch employees
- [ ] HR cannot access other branch data
- [ ] HR can access all branches if permission granted
- [ ] Employee can only see themselves

### Database Tests
```sql
-- Verify migration
SELECT * FROM hr_user_branches LIMIT 10;

-- Check data integrity
SELECT hu.user_id, hu.username, COUNT(hub.branch_id) as branch_count
FROM hr_users hu
LEFT JOIN hr_user_branches hub ON hu.user_id = hub.user_id
GROUP BY hu.user_id;

-- Find users with view all permission
SELECT user_id, username, canViewAllBranches 
FROM hr_users 
WHERE canViewAllBranches = true;
```

---

## PHASE 4: Frontend Implementation

### Components
- [ ] Create `BranchAssignmentSection` component
- [ ] Add to user management form
- [ ] Hide branch field for Employee role
- [ ] Show multi-select for HR/Admin roles
- [ ] Add "View All Branches" toggle

### User Management Page
- [ ] Update creation form to include branch assignment
- [ ] Update edit form to modify branch assignments
- [ ] Add UI to display assigned branches
- [ ] Add confirmation when changing branches

**File:** `app/user-management/page.tsx`
- [ ] Import BranchAssignmentSection
- [ ] Add branch selection state
- [ ] Add conditional rendering
- [ ] Update API payload

### Employee Management Page
- [ ] Verify branch filter works
- [ ] Test BranchHR sees only assigned branches
- [ ] Verify branch selector disabled for BranchHR

### Dashboard
- [ ] Show assigned branches info to HR users
- [ ] Display "All Branches" badge if applicable

---

## PHASE 5: Deployment & Monitoring

### Pre-Deployment
- [ ] Run full test suite
- [ ] Security review of authorization logic
- [ ] Load test with large branch assignments
- [ ] Backup production database
- [ ] Create rollback plan

### Staging Deployment
- [ ] Deploy to staging environment
- [ ] Run complete testing cycle
- [ ] Monitor logs for errors
- [ ] Test with production-like data volume
- [ ] Verify performance acceptable

### Production Deployment
- [ ] Schedule deployment during low traffic
- [ ] Deploy code first (with backward compat)
- [ ] Run Prisma migration
- [ ] Run data migration script
- [ ] Monitor application logs closely
- [ ] Check for authorization errors
- [ ] Verify employee filtering works

### Post-Deployment
- [ ] Monitor application metrics
- [ ] Check authorization logs
- [ ] Verify no data leakage
- [ ] Performance monitoring
- [ ] Gather user feedback

---

## Rollback Procedures

### If Issues Found
1. **Immediate:** Stop accepting new requests
2. **Code Rollback:** Revert to previous code version
3. **Database:** Do NOT delete junction table data
4. **Migration Script:** Can re-run safely (idempotent)
5. **Restart:** Restart application services

### Data Preservation
- Never delete from `hr_user_branches` during rollback
- `branch_id` still functional on `hr_users` table
- Authorization service can work with legacy data

---

## Files Created/Modified

### New Files
- [ ] `/backend/prisma/migrations/add_multi_branch_support/migration.sql`
- [ ] `/backend/scripts/migrate-multi-branch.ts`
- [ ] `/backend/src/common/services/authorization.service.ts`
- [ ] `/backend/prisma/SCHEMA_UPDATES.prisma` (reference)
- [ ] `/payroll-ui-refactor/components/user-management/branch-assignment.tsx`
- [ ] `/ARCHITECTURE_REDESIGN.md` (documentation)

### Modified Files
- [ ] `/backend/src/auth/jwt.strategy.ts`
- [ ] `/backend/src/common/interfaces/request.interface.ts`
- [ ] `/backend/src/employees/employees.service.ts`
- [ ] `/backend/src/users/users.service.ts`
- [ ] `/backend/src/payroll/payroll.service.ts` (if exists)
- [ ] `/backend/src/attendance/attendance.service.ts` (if exists)
- [ ] `/backend/src/reports/reports.service.ts` (if exists)
- [ ] `/backend/src/leaves/leaves.service.ts` (if exists)
- [ ] `/backend/src/common/common.module.ts`
- [ ] `/app/user-management/page.tsx`
- [ ] `/app/employee-management/page.tsx`

---

## Documentation Updates

- [ ] Update API documentation
- [ ] Update user role documentation
- [ ] Create admin guide for branch assignment
- [ ] Document authorization logic
- [ ] Create troubleshooting guide

---

## Sign-Off

- [ ] Architecture review approved by: ________________
- [ ] Database migration tested: ________________
- [ ] All tests passing: ________________
- [ ] Security review approved: ________________
- [ ] Performance verified: ________________
- [ ] Staging deployment approved: ________________
- [ ] Production deployment approved: ________________
- [ ] Post-deployment verification: ________________

---

## Timeline Estimate

| Phase | Duration | Start Date | End Date |
|-------|----------|-----------|----------|
| 1 - Database | 1 day | | |
| 2 - Backend | 3 days | | |
| 3 - Testing | 2 days | | |
| 4 - Frontend | 2 days | | |
| 5 - Deploy | 1 day | | |
| **Total** | **~2 weeks** | | |

---

## Contact & Support

**Architecture Owner:** [Name]  
**Implementation Lead:** [Name]  
**Database Admin:** [Name]  
**DevOps Lead:** [Name]  

For questions, refer to `ARCHITECTURE_REDESIGN.md` or contact the team.

