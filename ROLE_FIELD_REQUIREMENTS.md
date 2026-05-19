# User Creation Field Requirements by Role

## Role Analysis

### 🔴 SUPER ADMIN (SuperAdmin)
**Purpose:** System administrator, manages the entire application

**Required Fields:**
- Full Name ✓
- Email ✓
- Phone Number ✓
- National ID ✓
- Password (default: Reg@12345) ✓
- Status (ACTIVE/BLOCKED/LOCKED) ✓

**Optional Fields:**
- Username (auto-generated from email if not provided)
- Date of Birth (optional, for record keeping)

**DO NOT NEED:**
- ❌ Branch Assignment (Super Admin is not branch-specific)
- ❌ Category (not an employee)
- ❌ Payment Method/Number (not in payroll)
- ❌ Contract Type (not an employee)
- ❌ Education Level (optional for system admin)
- ❌ Contract Start/End Dates (not an employee)

**Reasoning:** Super Admin is a system user, not an employee. They don't need payroll-related fields.

---

### 🟠 BRANCH HR / COMPANY ADMIN (BranchHR / CompanyAdmin)
**Purpose:** Manages employees and HR functions in assigned branches

**Required Fields:**
- Full Name ✓
- Email ✓
- Phone Number ✓
- National ID ✓
- Password (default: Reg@12345) ✓
- Status (ACTIVE/BLOCKED/LOCKED) ✓
- **Branch Assignment** ✓ (Single or Multiple)

**Optional Fields:**
- Username (auto-generated from email)
- Date of Birth
- Category (if HR person is also an employee)
- Education Level (if also an employee)
- Contract Type (if also an employee)
- Contract Start/End Dates (if also an employee)
- Payment Method/Number (only if also an employee in payroll)

**DO NOT NEED:**
- ❌ Category as mandatory (they're HR staff, not regular employees)
- ❌ Payment Method/Number as mandatory (unless they receive payroll)
- ❌ Contract dates as mandatory (unless they're dual-role)

**Reasoning:** HR staff manage employees but may or may not be employees themselves. Make these fields optional so they can be added only if the HR person also receives a salary.

---

### 🟢 EMPLOYEE
**Purpose:** Regular employee in payroll system

**Required Fields:**
- Full Name ✓
- Email ✓
- Phone Number ✓
- National ID ✓
- Password (default: Reg@12345) ✓
- Status (ACTIVE/BLOCKED/LOCKED) ✓
- Branch ✓ (single branch)
- Category ✓ (job category/designation)

**Recommended Optional Fields:**
- Username (auto-generated)
- Date of Birth (useful for compliance)
- Education Level (optional)
- Contract Type (optional but recommended)
- Contract Start/End Dates (recommended)
- Payment Method/Number (optional - can be added later)

**Reasoning:** Employees are in the payroll system, so they need category at minimum. Other fields help with complete employee record.

---

## Field Definitions

### Category
- **What:** Job category/designation (e.g., "Manager", "Technician", "Officer")
- **Who Needs:** Employees primarily
- **HR:** Optional (only if HR person is also paid as employee)
- **Super Admin:** NO

### Payment Type & Number
- **What:** How they're paid (Bank/MoMo) and their account/phone
- **Who Needs:** Employees on payroll
- **HR:** Optional (only if they're also on payroll)
- **Super Admin:** NO

### Education Level
- **What:** Highest qualification (Primary, Secondary, Diploma, Bachelor, Master, PhD)
- **Who Needs:** Can be useful for all employees
- **HR:** Optional
- **Super Admin:** NO

### Contract Dates (Start/End)
- **What:** Employment contract period
- **Who Needs:** Employees
- **HR:** Optional (only if they're also employees)
- **Super Admin:** NO

---

## Recommended Form Implementation

### Create Super Admin Form
```
Role: Super Admin (LOCKED - cannot change)
├─ Full Name *
├─ National ID *
├─ Email *
├─ Phone Number *
├─ Status (ACTIVE/BLOCKED/LOCKED)
├─ Password (optional, default: Reg@12345)
└─ Date of Birth (optional)
```

### Create HR User Form
```
Role: Branch HR / Company Admin (REQUIRED)
├─ Full Name *
├─ National ID *
├─ Email *
├─ Phone Number *
├─ Status (ACTIVE/BLOCKED/LOCKED)
├─ Password (optional, default: Reg@12345)
├─ Branch Assignment * (Single or Multiple)
├─ ─────────────────────────────────────
├─ Additional Employee Info (if dual-role)
│  ├─ Category (optional)
│  ├─ Education Level (optional)
│  ├─ Contract Type (optional)
│  ├─ Contract Start Date (optional)
│  ├─ Contract End Date (optional)
│  ├─ Payment Method (optional)
│  └─ Payment Number (optional)
└─ Date of Birth (optional)
```

### Create Employee Form
```
Role: Employee (REQUIRED)
├─ Full Name *
├─ National ID *
├─ Email *
├─ Phone Number *
├─ Status (ACTIVE/BLOCKED/LOCKED)
├─ Password (optional, default: Reg@12345)
├─ Branch * (single branch)
├─ Category *
├─ Education Level (optional)
├─ Contract Type (optional)
├─ Contract Start Date (optional)
├─ Contract End Date (optional)
├─ Payment Method (optional)
├─ Payment Number (optional)
└─ Date of Birth (optional)
```

---

## Summary Table

| Field | Super Admin | Branch HR | Employee |
|-------|-----------|-----------|----------|
| Full Name | ✓ Req | ✓ Req | ✓ Req |
| National ID | ✓ Req | ✓ Req | ✓ Req |
| Email | ✓ Req | ✓ Req | ✓ Req |
| Phone | ✓ Req | ✓ Req | ✓ Req |
| Password | Optional | Optional | Optional |
| Status | ✓ Req | ✓ Req | ✓ Req |
| Branch | ❌ NO | ✓ Req | ✓ Req |
| Category | ❌ NO | Opt | ✓ Req |
| Payment Type | ❌ NO | Opt | Opt |
| Payment Number | ❌ NO | Opt | Opt |
| Education Level | ❌ NO | Opt | Opt |
| Contract Type | ❌ NO | Opt | Opt |
| Contract Start | ❌ NO | Opt | Opt |
| Contract End | ❌ NO | Opt | Opt |
| Date of Birth | Opt | Opt | Opt |
| Username | Opt | Opt | Opt |

---

## Default Password Strategy

- **Current:** Reg@12345
- **Recommendation:** When user first logs in, force them to change password
- **For all roles:** Should be the same default (Reg@12345)
- **Backend already has:** `must_change_password` flag in hr_users table

---

## Implementation Notes

1. **Show/Hide Logic:** Dynamically show/hide fields based on selected role
2. **Validation:** Only validate fields that are shown
3. **Database:** All fields are already optional in schema, so no migrations needed
4. **API:** DTO already has all fields as optional (except role, email, name, etc.)
5. **HR Dual-Role:** Allow HR staff to optionally be in payroll system (they can have salary)
