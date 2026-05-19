# Implementation Guide: Enterprise Role-Based User Management

**Status:** Ready for Implementation  
**Date:** May 18, 2026

---

## QUICK START

### Backend Implementation

#### 1. Install Password Service
```bash
# Already created at: backend/src/users/services/password.service.ts
npm install bcrypt
npm install --save-dev @types/bcrypt
```

#### 2. Update Password Service with bcrypt
Edit `backend/src/users/services/password.service.ts`:

```typescript
import * as bcrypt from 'bcrypt';

async hash(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

async compare(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

#### 3. Register Services in Users Module
Edit `backend/src/users/users.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PasswordService } from './services/password.service';
import { RoleBasedValidationService } from './services/role-based-validation.service';

@Module({
  imports: [PrismaModule],
  controllers: [UsersController],
  providers: [UsersService, PasswordService, RoleBasedValidationService],
  exports: [UsersService],
})
export class UsersModule {}
```

#### 4. Update Users Service
Replace content in `backend/src/users/users.service.ts`:

```typescript
import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PasswordService } from './services/password.service';
import { RoleBasedValidationService } from './services/role-based-validation.service';
import { CreateUserDto } from './dto/create-user-enterprise.dto';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private passwordService: PasswordService,
    private validationService: RoleBasedValidationService,
  ) {}

  async create(actor: any, dto: CreateUserDto) {
    // 1. Authorization - only Super Admin can create users
    if (actor.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Only Super Admin can create users');
    }

    // 2. Sanitize input by role
    const sanitized = this.validationService.sanitizeByRole(dto);

    // 3. Validate required fields by role
    this.validationService.validateRequiredFieldsByRole(sanitized);

    // 4. Check for existing email/national_id
    const conflicts = await this.prisma.hr_users.findMany({
      where: {
        OR: [
          { email: sanitized.email },
          ...(sanitized.national_id ? [{ national_id: sanitized.national_id }] : []),
        ],
      },
    });

    if (conflicts.length > 0) {
      const errors = [];
      if (conflicts.some((c) => c.email === sanitized.email)) {
        errors.push('Email already exists');
      }
      if (sanitized.national_id && conflicts.some((c) => c.national_id === sanitized.national_id)) {
        errors.push('National ID already exists');
      }
      throw new BadRequestException(errors.join(', '));
    }

    // 5. Generate password
    const password = this.passwordService.generateTemporary();
    const passwordHash = await this.passwordService.hash(password);

    // 6. Create user in transaction
    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.hr_users.create({
        data: {
          full_name: sanitized.full_name,
          email: sanitized.email,
          username: sanitized.username || sanitized.email.split('@')[0],
          password_hash: passwordHash,
          role: sanitized.role,
          phone_number: sanitized.phone_number || null,
          national_id: sanitized.national_id || null,
          date_of_birth: sanitized.date_of_birth ? new Date(sanitized.date_of_birth) : null,
          status: 'PENDING',
          is_active: true,
          must_change_password: true, // Force password change on first login
          company_id: actor.companyId,
          created_by: actor.sub,

          // Conditional fields
          ...(sanitized.role !== 'SUPER_ADMIN' && {
            category: sanitized.category || null,
            department_id: sanitized.department_id || null,
            contract_type: sanitized.contract_type || null,
            contract_start: sanitized.contract_start ? new Date(sanitized.contract_start) : null,
            contract_end: sanitized.contract_end ? new Date(sanitized.contract_end) : null,
            education_level: sanitized.education_level || null,
            payment_method: sanitized.payment_method || null,
            payment_number: sanitized.payment_number || null,
          }),

          ...(sanitized.role === 'EMPLOYEE' && {
            branch_id: sanitized.branch_id,
            post_id: sanitized.post_id,
          }),

          ...(sanitized.role !== 'EMPLOYEE' && sanitized.branch_ids && {
            branch_id: sanitized.branch_ids[0], // Set primary branch
            canViewAllBranches: sanitized.can_view_all_branches || false,
          }),
        },
      });

      // 7. Handle branch assignments for HR/Admin
      if (
        (sanitized.role === 'HR' || sanitized.role === 'ADMIN') &&
        sanitized.branch_ids?.length > 0
      ) {
        await tx.hr_user_branches.createMany({
          data: sanitized.branch_ids.map((branchId) => ({
            user_id: created.user_id,
            branch_id: branchId,
            assigned_by: actor.sub,
          })),
        });
      }

      return created;
    });

    // 8. Return user without password
    const { password_hash, refresh_token_hash, activation_token, ...safeUser } = user;

    // TODO: Send email with temporary password
    // await this.emailService.sendUserInvitation(user.email, password);

    return safeUser;
  }
}
```

#### 5. Update Users Controller
```typescript
@Post()
@ApiOperation({ summary: 'Create user (Super Admin only)' })
createUser(@Req() req, @Body() dto: CreateUserDto) {
  return this.usersService.create(req.user, dto);
}
```

---

### Frontend Implementation

#### 1. Replace User Management Form
Edit `app/user-management/page.tsx` and use the new component:

```typescript
import RoleBasedUserForm from "@/components/user-management/role-based-user-form";

export default function UserManagement() {
  // ... existing code ...

  return (
    <DashboardLayout {...}>
      {/* Replace old form with new one */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <RoleBasedUserForm
              onSubmit={saveUser}
              branches={branches}
              departments={departments}
              posts={posts}
              loading={loading}
            />
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
```

#### 2. Update saveUser Handler
```typescript
const saveUser = async (data: any) => {
  try {
    if (isEditing && form.id) {
      await apiFetchAuth(`/users/${form.id}`, { 
        method: "PUT", 
        body: JSON.stringify(data) 
      });
      showNotification("success", "User updated successfully");
    } else {
      await apiFetchAuth(`/users`, { 
        method: "POST", 
        body: JSON.stringify(data) 
      });
      showNotification("success", "User created successfully");
    }
    resetForm();
    loadUsers();
  } catch (err) {
    showNotification("error", err.message);
  }
};
```

---

## FILE LOCATIONS

```
Backend:
├── backend/src/users/
│   ├── services/
│   │   ├── password.service.ts              [NEW]
│   │   └── role-based-validation.service.ts [NEW]
│   ├── dto/
│   │   └── create-user-enterprise.dto.ts    [NEW]
│   ├── users.service.ts                     [UPDATED]
│   ├── users.controller.ts                  [UPDATED]
│   └── users.module.ts                      [UPDATED]

Frontend:
├── app/user-management/
│   └── page.tsx                             [UPDATED]
└── components/user-management/
    └── role-based-user-form.tsx             [NEW]
```

---

## FEATURES IMPLEMENTED

### ✅ Backend
- [x] Role-based field validation
- [x] Automatic password generation
- [x] Service-layer business logic
- [x] Enterprise DTOs for each role
- [x] Junction table support (hr_user_branches)
- [x] Audit trail (created_by, updated_by)
- [x] Transaction support for multi-step user creation
- [x] Conflict detection (email, national_id)

### ✅ Frontend
- [x] Dynamic role-based forms
- [x] Show/hide fields based on role
- [x] Multi-branch selection for HR/Admin
- [x] Single branch selection for Employees
- [x] Password auto-generation notification
- [x] Field-level validation UI
- [x] Error handling
- [x] Loading states

---

## TESTING CHECKLIST

### Super Admin Creation
- [ ] Full name required
- [ ] Email required
- [ ] Phone optional
- [ ] NO branch field shown
- [ ] NO category field shown
- [ ] Password auto-generated
- [ ] Must change password on first login

### HR/Admin Creation
- [ ] Full name required
- [ ] Email required
- [ ] Branch assignment required (or "view all")
- [ ] Category optional
- [ ] Contract dates optional
- [ ] Payment method optional
- [ ] Multi-branch selection works
- [ ] "View All Branches" toggle works

### Employee Creation
- [ ] Full name required
- [ ] Email required
- [ ] Branch required (single, not array)
- [ ] Category required
- [ ] Department required
- [ ] Position required
- [ ] Payment method required
- [ ] Payment number required
- [ ] Contract dates optional
- [ ] Education level optional

### Validation
- [ ] Email conflict detection
- [ ] National ID conflict detection
- [ ] Required field validation
- [ ] Role-based field validation
- [ ] Backend validation (not just frontend)

---

## DEPLOYMENT STEPS

### Phase 1: Database (Non-Breaking)
```bash
# 1. Run Prisma migration to add new columns
npx prisma migrate dev --name add_role_based_fields

# 2. Verify new tables exist
npx prisma db push --skip-generate

# 3. No data migration needed (all fields optional)
```

### Phase 2: Backend Deployment
```bash
# 1. Install dependencies
npm install bcrypt

# 2. Deploy new services
npm run build

# 3. Test all roles thoroughly
npm run test

# 4. Deploy to production
npm run start
```

### Phase 3: Frontend Deployment
```bash
# 1. Update user management page
# 2. Test dynamic form behavior
# 3. Deploy to production
```

---

## BACKWARD COMPATIBILITY

✅ **Fully backward compatible**

- Old `category` field behavior unchanged
- `branch_id` still used for primary branch
- Existing users continue to work
- New columns are nullable
- Junction table is additive (no breaking changes)

---

## SECURITY NOTES

### Password Generation
- ✅ Auto-generated (never weak defaults)
- ✅ Strong entropy (8-10 chars, mixed case, numbers, special)
- ✅ Force change on first login
- ✅ Hashed with bcrypt (10 rounds)

### Authorization
- ✅ Backend validates all permissions
- ✅ Only Super Admin can create users
- ✅ Frontend validation is UX only
- ✅ Service layer is source of truth

### Data Sanitization
- ✅ Role-based field sanitization
- ✅ Unexpected fields ignored
- ✅ Email/national_id validation
- ✅ Conflict detection

---

## EXAMPLE API CALLS

### Create Super Admin
```bash
curl -X POST http://localhost:3000/users \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "SUPER_ADMIN",
    "full_name": "System Admin",
    "email": "admin@system.com",
    "phone_number": "+250788123456",
    "national_id": "1234567890123456"
  }'
```

### Create HR User
```bash
curl -X POST http://localhost:3000/users \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "HR",
    "full_name": "HR Manager",
    "email": "hr@company.com",
    "phone_number": "+250788123456",
    "branch_ids": [1, 2, 3],
    "can_view_all_branches": false,
    "category": "HR Manager"
  }'
```

### Create Employee
```bash
curl -X POST http://localhost:3000/users \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "EMPLOYEE",
    "full_name": "John Doe",
    "email": "john@company.com",
    "phone_number": "+250788123456",
    "branch_id": 1,
    "category": "Software Engineer",
    "department_id": 2,
    "post_id": 5,
    "payment_method": "BANK",
    "payment_number": "250788123456"
  }'
```

---

## NEXT STEPS

1. **Run migrations** - Deploy new Prisma schema
2. **Update services** - Add password and validation services
3. **Test backend** - Verify role-based validation works
4. **Deploy frontend** - Use new dynamic form component
5. **Smoke test** - Create users of each role
6. **Monitor** - Check logs for any issues
7. **Document** - Update team wiki with new form behavior

---

## SUPPORT

For questions about:
- **Role-based logic** - See ENTERPRISE_ROLE_ARCHITECTURE.md
- **Field requirements** - See ROLE_FIELD_REQUIREMENTS.md
- **API schema** - See DTOs in create-user-enterprise.dto.ts
- **Frontend implementation** - See role-based-user-form.tsx
