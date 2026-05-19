# Quick Reference: Multi-Branch Implementation Guide

## At a Glance

**What's Changing:**
- HR users can now manage multiple branches
- SuperAdmin can grant "view all branches" permission
- Database gets junction table for flexible assignments

**Files to Know:**
1. `ARCHITECTURE_REDESIGN.md` — Full technical details
2. `IMPLEMENTATION_CHECKLIST.md` — Step-by-step tasks
3. `COMPLETE_IMPLEMENTATION_SUMMARY.md` — Overview

---

## Key Database Changes

### New Table: hr_user_branches
```sql
CREATE TABLE hr_user_branches (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  branch_id INT NOT NULL,
  UNIQUE(user_id, branch_id),
  FOREIGN KEY (user_id) REFERENCES hr_users(user_id),
  FOREIGN KEY (branch_id) REFERENCES branches(branch_id)
);
```

### New Column: hr_users
```sql
ALTER TABLE hr_users ADD COLUMN canViewAllBranches BOOLEAN DEFAULT FALSE;
```

### Data Migration
```bash
npx ts-node backend/scripts/migrate-multi-branch.ts
```

---

## Core Service Changes

### Authorization Service (NEW)
```typescript
// Get all accessible branches for a user
const branches = authService.getAccessibleBranches(user);
// Returns: [] for unrestricted, or [1,2,3] for restricted

// Check single branch access
const allowed = authService.canAccessBranch(user, 5);
// Returns: true or false

// Build Prisma filter
const filter = authService.buildAccessFilter(user);
// Returns: {} or { branch_id: { in: [1,2,3] } }
```

### Service Pattern (Updated)
```typescript
// OLD
const employees = await this.prisma.employees.findMany({
  where: { company_id: user.companyId }
});

// NEW
const where = this.authService.buildAccessFilter(user);
const employees = await this.prisma.employees.findMany({
  where
});
```

---

## JWT Changes

### Old Payload
```json
{
  "sub": 1,
  "email": "hr@company.com",
  "role": "BranchHR",
  "companyId": 1,
  "branchId": 3
}
```

### New Payload
```json
{
  "sub": 1,
  "email": "hr@company.com",
  "role": "BranchHR",
  "companyId": 1,
  "branchId": 3,              // Legacy, kept for backward compat
  "branches": [3, 4, 5],      // NEW: Array of branch IDs
  "canViewAllBranches": false  // NEW: Permission flag
}
```

---

## Frontend Changes

### Branch Assignment Component
```tsx
<BranchAssignmentSection
  role={userForm.role}
  branches={allBranches}
  selectedBranches={[3, 4, 5]}
  canViewAll={false}
  onBranchToggle={(id) => setSelectedBranches(...)}
  onViewAllToggle={(checked) => setCanViewAllBranches(checked)}
/>
```

### Role-Based Visibility
```tsx
// Only show branch assignment for HR/Admin
const showBranches = ['BranchHR', 'CompanyAdmin'].includes(role);

{showBranches && <BranchAssignmentSection />}
```

---

## Service Update Checklist

Update these services with authorization service injection:

- [ ] `employees.service.ts`
- [ ] `users.service.ts`
- [ ] `payroll.service.ts`
- [ ] `attendance.service.ts`
- [ ] `reports.service.ts`
- [ ] `leaves.service.ts`
- [ ] Any other service with branch-specific data

**Template for each service:**
```typescript
constructor(
  private prisma: PrismaService,
  private authService: AuthorizationService  // ADD THIS
) {}

async findAll(user: any) {
  const where = this.authService.buildAccessFilter(user);
  return this.prisma.tableName.findMany({ where });
}
```

---

## Testing Quick Checklist

### For Each Service Update
- [ ] Unit test authorization logic
- [ ] Test SuperAdmin sees all data
- [ ] Test BranchHR sees only assigned branches
- [ ] Test Employee can't see other employees
- [ ] Test "view all" permission works
- [ ] Test authorization error on denied access

### Example Test
```typescript
it('BranchHR should only see assigned employees', async () => {
  const user = {
    role: 'BranchHR',
    branches: [1, 2],
    canViewAllBranches: false
  };
  
  const filter = authService.buildAccessFilter(user);
  expect(filter).toEqual({ branch_id: { in: [1, 2] } });
});
```

---

## Deployment Checklist

- [ ] Backup production database
- [ ] Deploy code to staging
- [ ] Run Prisma migration: `npx prisma migrate deploy`
- [ ] Run data migration: `npx ts-node backend/scripts/migrate-multi-branch.ts`
- [ ] Verify migration results
- [ ] Run full test suite
- [ ] Deploy to production
- [ ] Monitor logs for errors
- [ ] Verify branch filtering works

---

## Rollback Steps

If anything goes wrong:

1. **Stop** accepting new requests
2. **Revert** code to previous version
3. **Keep** junction table data (don't delete)
4. **Restart** application
5. System will fall back to using `branch_id` field

---

## Common Issues & Solutions

### Issue: JWT doesn't include branches array
**Solution:** Make sure JwtStrategy is updated and calls `findUnique` with `include: { assignedBranches }`

### Issue: Employees showing from all branches
**Solution:** Verify `buildAccessFilter()` is being used in `findAll()` method

### Issue: "View All Branches" not working
**Solution:** Check `canViewAllBranches` value in database; verify all company branches are fetched

### Issue: Migration failed
**Solution:** 
1. Check database backup is good
2. Run migration script with `--rollback` flag
3. Review error logs
4. Fix and retry

---

## Performance Tips

1. **Use junction table indexes** - Already in migration
2. **Lazy load branches** - Only fetch in JWT strategy when needed
3. **Cache branch lists** - For "view all" users in high-traffic scenarios
4. **Monitor query performance** - Check database query times after deployment

---

## Security Reminders

1. **Always check authorization** - Never skip branch filter
2. **Never trust client** - Validate all permissions server-side
3. **Log authorization failures** - Help detect suspicious activity
4. **Test edge cases** - Test with many branches, null values, etc.
5. **Review SQL carefully** - Ensure no SQL injection vectors

---

## File Locations

### Backend Files
- `backend/src/auth/jwt.strategy.ts` - JWT generation
- `backend/src/common/services/authorization.service.ts` - Authorization logic
- `backend/src/common/interfaces/request.interface.ts` - Request type
- `backend/src/*/services/*.ts` - Update all services
- `backend/scripts/migrate-multi-branch.ts` - Data migration
- `backend/prisma/migrations/*/migration.sql` - Database schema

### Frontend Files
- `payroll-ui-refactor/components/user-management/branch-assignment.tsx` - Component
- `payroll-ui-refactor/app/user-management/page.tsx` - Integration
- `payroll-ui-refactor/app/employee-management/page.tsx` - Verify filtering

### Documentation Files
- `ARCHITECTURE_REDESIGN.md` - Full technical details
- `IMPLEMENTATION_CHECKLIST.md` - Task list
- `COMPLETE_IMPLEMENTATION_SUMMARY.md` - Overview
- `QUICK_REFERENCE.md` - This file

---

## Timeline

| Phase | Days | Start | Status |
|-------|------|-------|--------|
| 1: Database | 1 | [ ] | Not started |
| 2: Backend | 3 | [ ] | Not started |
| 3: Testing | 2 | [ ] | Not started |
| 4: Frontend | 2 | [ ] | Not started |
| 5: Deploy | 1 | [ ] | Not started |
| **Total** | **~9** | | |

---

## Key Concepts to Remember

1. **Junction Table** = Flexible multi-branch assignment
2. **canViewAllBranches** = Simple permission flag
3. **AuthorizationService** = Centralized access control
4. **buildAccessFilter()** = Used everywhere for filtering
5. **Backward Compat** = Old `branchId` field still works

---

## Quick Command Reference

```bash
# Test migration in dev
npx prisma migrate dev --name add_multi_branch_support

# Run data migration
npx ts-node backend/scripts/migrate-multi-branch.ts

# Rollback migration
npx ts-node backend/scripts/migrate-multi-branch.ts --rollback

# Deploy migration to prod
npx prisma migrate deploy

# Check migration status
npx prisma migrate status

# Verify data in database
mysql -u user -p payroll -e "SELECT * FROM hr_user_branches LIMIT 10;"
```

---

## Need More Info?

- **Technical Details** → Read `ARCHITECTURE_REDESIGN.md`
- **Step-by-Step Tasks** → Follow `IMPLEMENTATION_CHECKLIST.md`
- **Code Examples** → Check `/backend/src/employees/employees.service.example.ts`
- **Frontend Example** → Check `/payroll-ui-refactor/components/user-management/branch-assignment.tsx`

---

**Last Updated:** May 18, 2026  
**Version:** 1.0  
**Status:** Ready for Implementation
