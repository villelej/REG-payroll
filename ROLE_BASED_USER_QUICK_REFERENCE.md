# Role-Based User Management: Quick Reference

**For Developers, Product Managers, and QA Teams**

---

## AT A GLANCE

### Super Admin (System Administrator)
```
▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
Purpose:     System-level administration
Lightweight: YES - No payroll fields
Branch:      NO branch assignment
Skills:      Manage users, system settings
Examples:    System Admin, IT Support
▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬

REQUIRED FIELDS (4):
✓ Full Name
✓ Email
- Password (auto-generated)
- Status (defaults: PENDING)

OPTIONAL FIELDS:
⊙ Phone Number
⊙ National ID
⊙ Username
⊙ Date of Birth

MUST NOT HAVE:
✗ Branch assignment
✗ Category/Job title
✗ Department
✗ Payment details
✗ Salary
✗ Contract dates
```

### HR / Admin (Branch HR Manager)
```
▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
Purpose:     HR operations, employee management
Branch:      REQUIRED - Single or multiple
Flexibility: Can be employee OR HR-only
Skills:      Manage employees in branches
Examples:    HR Manager, Operations Manager
▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬

REQUIRED FIELDS (3):
✓ Full Name
✓ Email
✓ Branch Assignment (1+ branches)
- Password (auto-generated)
- Status (defaults: PENDING)

OPTIONAL FIELDS:
⊙ Phone Number
⊙ National ID
⊙ Username
⊙ Date of Birth
⊙ Category (if also employee)
⊙ Department (if also employee)
⊙ Contract Type/Dates (if also employee)
⊙ Education Level
⊙ Payment Method/Number (if also employee)
⊙ Can View All Branches (permission)

BRANCH ASSIGNMENT OPTIONS:
→ Option 1: Select specific branches (1, 2, 3, etc.)
→ Option 2: Grant "View All Branches" permission
```

### Employee (Regular Payroll Employee)
```
▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
Purpose:     Payroll management
Branch:      REQUIRED - Single branch only
Payroll:     REQUIRED - Full payroll data
Skills:      Work in organization
Examples:    Engineer, Manager, Officer
▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬

REQUIRED FIELDS (9):
✓ Full Name
✓ Email
✓ Branch (single)
✓ Category/Job Title
✓ Department
✓ Position/Post
✓ Payment Method
✓ Payment Account/Phone
- Password (auto-generated)
- Status (defaults: PENDING)

OPTIONAL FIELDS:
⊙ Phone Number
⊙ National ID
⊙ Username
⊙ Date of Birth
⊙ Employment Type (Full-Time, Part-Time, etc.)
⊙ Contract Type
⊙ Contract Start/End Dates
⊙ Education Level
⊙ Salary Amount
```

---

## FIELD COMPARISON TABLE

| Field | Super Admin | HR/Admin | Employee |
|-------|:-----------:|:--------:|:--------:|
| **Full Name** | 🔴 REQ | 🔴 REQ | 🔴 REQ |
| **Email** | 🔴 REQ | 🔴 REQ | 🔴 REQ |
| **Phone** | ⚪ OPT | ⚪ OPT | ⚪ OPT |
| **National ID** | ⚪ OPT | ⚪ OPT | ⚪ OPT |
| **Username** | ⚪ OPT | ⚪ OPT | ⚪ OPT |
| **Date of Birth** | ⚪ OPT | ⚪ OPT | ⚪ OPT |
| **Branch** | ❌ NO | 🔴 REQ | 🔴 REQ |
| **Category** | ❌ NO | ⚪ OPT* | 🔴 REQ |
| **Department** | ❌ NO | ⚪ OPT* | 🔴 REQ |
| **Position** | ❌ NO | ⚪ OPT* | 🔴 REQ |
| **Employment Type** | ❌ NO | ⚪ OPT* | ⚪ OPT |
| **Contract Type** | ❌ NO | ⚪ OPT* | ⚪ OPT |
| **Contract Dates** | ❌ NO | ⚪ OPT* | ⚪ OPT |
| **Education Level** | ❌ NO | ⚪ OPT* | ⚪ OPT |
| **Payment Method** | ❌ NO | ⚪ OPT* | 🔴 REQ |
| **Payment Number** | ❌ NO | ⚪ OPT* | 🔴 REQ |
| **Salary** | ❌ NO | ⚪ OPT* | ⚪ OPT |
| **Password** | AUTO | AUTO | AUTO |
| **Status** | DEFAULT | DEFAULT | DEFAULT |

**Legend:**
- 🔴 REQ = Required
- ⚪ OPT = Optional
- ⚪ OPT* = Optional (only if HR is also employee)
- ❌ NO = Not applicable / Hidden
- AUTO = Auto-generated
- DEFAULT = Defaults to PENDING

---

## PASSWORD STRATEGY

### Generation
```
Algorithm:  Random strong password
Format:     8-10 characters
Includes:   Uppercase, Lowercase, Numbers, Special chars (@#$%&)
Example:    Hr@4821Xp

Strength:   ████████░ (9/10) - Enterprise grade
```

### User Experience
```
1. User is created with auto-generated password
2. System sends temporary password (via email - future)
3. User receives password: Hr@4821Xp
4. User logs in with temporary password
5. System forces password change on first login
6. User creates their own secure password
7. mustChangePassword flag = true until changed
```

### Security
- ✅ Never use weak defaults (123456, password, etc.)
- ✅ Generated randomly, not predictable
- ✅ Force change on first login
- ✅ Hashed with bcrypt (10 rounds)
- ✅ Never logged in plaintext

---

## FORM BEHAVIOR

### Super Admin Form
```
┌─────────────────────────────┐
│  USER ROLE SELECTOR         │
│  ☑ SUPER_ADMIN  ○ HR  ○ ADMIN  ○ EMPLOYEE │
└─────────────────────────────┘

Full Name *        [________________]
Email *            [________________]
Phone              [________________]  (optional)
National ID        [________________]  (optional)
Username           [________________]  (optional)
Date of Birth      [________________]  (optional)

✓ Password will be auto-generated
✓ User must change on first login

[Cancel] [Create User]
```

### HR/Admin Form
```
┌─────────────────────────────┐
│  USER ROLE SELECTOR         │
│  ○ SUPER_ADMIN  ☑ HR  ○ ADMIN  ○ EMPLOYEE │
└─────────────────────────────┘

Full Name *        [________________]
Email *            [________________]
Phone              [________________]
National ID        [________________]
Username           [________________]
Date of Birth      [________________]

═══════════════════════════════════════
BRANCH ASSIGNMENT *

☐ View All Branches?
  (Grant access to all branches without selecting each)

✓ Specific Branches
  ☐ Kigali Branch      ☐ Muhanga Branch
  ☐ Huye Branch        ☐ Ruhengeri Branch
  
  ✓ 2 branches selected
═══════════════════════════════════════

OPTIONAL EMPLOYEE INFORMATION

Category           [________________]
Department         [Select: ▼]
Contract Type      [________________]
Contract Start     [________________]
Contract End       [________________]
Education          [Select: ▼]
Payment Method     [Select: ▼]
Payment Account    [________________]

✓ Password will be auto-generated
✓ User must change on first login

[Cancel] [Create User]
```

### Employee Form
```
┌─────────────────────────────┐
│  USER ROLE SELECTOR         │
│  ○ SUPER_ADMIN  ○ HR  ○ ADMIN  ☑ EMPLOYEE │
└─────────────────────────────┘

Full Name *        [________________]
Email *            [________________]
Phone              [________________]
National ID        [________________]
Username           [________________]
Date of Birth      [________________]

═══════════════════════════════════════
EMPLOYMENT INFORMATION

Branch *           [Select: Kigali ▼]
Category *         [________________]
Department *       [Select: IT ▼]
Position *         [Select: Manager ▼]

Employment Type    [Select: Full-Time ▼]
Contract Type      [________________]
Contract Start     [________________]
Contract End       [________________]
Education          [Select: Bachelor ▼]

Payment Method *   [Select: BANK ▼]
Payment Account *  [________________]
Salary             [________________]

✓ Password will be auto-generated
✓ User must change on first login

[Cancel] [Create User]
```

---

## API PAYLOAD EXAMPLES

### Create Super Admin
```json
{
  "role": "SUPER_ADMIN",
  "full_name": "System Administrator",
  "email": "admin@system.com",
  "phone_number": "+250788123456",
  "national_id": "1234567890123456"
}
```

### Create HR User with Multiple Branches
```json
{
  "role": "HR",
  "full_name": "Jean Paul Habimana",
  "email": "jean.paul@company.com",
  "phone_number": "+250788123456",
  "branch_ids": [1, 2, 3],
  "can_view_all_branches": false
}
```

### Create HR User with View All Permission
```json
{
  "role": "HR",
  "full_name": "Marie Uwase",
  "email": "marie@company.com",
  "phone_number": "+250788123456",
  "branch_ids": [],
  "can_view_all_branches": true
}
```

### Create Employee
```json
{
  "role": "EMPLOYEE",
  "full_name": "John Mweya Kinyua",
  "email": "john.mweya@company.com",
  "phone_number": "+250788654321",
  "branch_id": 1,
  "category": "Software Engineer",
  "department_id": 2,
  "post_id": 5,
  "employment_type": "Full-Time",
  "payment_method": "BANK",
  "payment_number": "1234567890",
  "contract_type": "Permanent",
  "contract_start": "2024-01-15",
  "education_level": "Bachelor"
}
```

---

## VALIDATION RULES

### All Roles
```
full_name:
  - Required
  - Min: 2 chars
  - Max: 200 chars
  
email:
  - Required
  - Valid email format
  - Must be unique (no duplicates)
  
phone_number:
  - Optional
  - Valid Rwanda format (+250, 250, 0)
  - Pattern: +250[1-9][0-9]{8}
  
national_id:
  - Optional
  - Rwanda ID: 16 digits
  - Must be unique
```

### HR/Admin Only
```
branch_ids:
  - Required if can_view_all_branches = false
  - At least 1 branch needed
  - OR enable can_view_all_branches = true
```

### Employee Only
```
category:
  - Required
  
department_id:
  - Required
  
post_id:
  - Required
  - Must exist for selected department
  
payment_method:
  - Required
  - Enum: BANK, MOMO, CASH
  
payment_number:
  - Required
  - Min: 1 char
```

---

## BACKEND VALIDATION FLOW

```
INPUT (DTO)
    ↓
1. SANITIZE by role
   - Remove unexpected fields
   - Lowercase email
   - Trim whitespace
    ↓
2. VALIDATE required fields
   - Check based on role
   - Reject if missing
    ↓
3. CHECK CONFLICTS
   - Email must be unique
   - National ID must be unique
    ↓
4. GENERATE PASSWORD
   - Create strong temp password
   - Hash with bcrypt
    ↓
5. CREATE USER (TRANSACTION)
   - Insert hr_users row
   - Create branch assignments
   - Set must_change_password=true
    ↓
6. AUDIT LOG
   - Record: who created, when, what
    ↓
OUTPUT (Safe User Object - no password)
```

---

## COMMON MISTAKES & FIXES

### ❌ Mistake: Sending branch field for Super Admin
```json
// WRONG
{
  "role": "SUPER_ADMIN",
  "full_name": "Admin",
  "email": "admin@system.com",
  "branch_id": 1  // ← Backend will IGNORE this
}

// CORRECT
{
  "role": "SUPER_ADMIN",
  "full_name": "Admin",
  "email": "admin@system.com"
  // No branch_id
}
```

### ❌ Mistake: Not sending branch_ids for HR
```json
// WRONG
{
  "role": "HR",
  "full_name": "Manager",
  "email": "manager@company.com"
  // Missing branch_ids ← Will be REJECTED
}

// CORRECT - Option 1: Specific branches
{
  "role": "HR",
  "full_name": "Manager",
  "email": "manager@company.com",
  "branch_ids": [1, 2]
}

// CORRECT - Option 2: View all
{
  "role": "HR",
  "full_name": "Manager",
  "email": "manager@company.com",
  "branch_ids": [],
  "can_view_all_branches": true
}
```

### ❌ Mistake: Missing required Employee fields
```json
// WRONG
{
  "role": "EMPLOYEE",
  "full_name": "John",
  "email": "john@company.com",
  "branch_id": 1
  // Missing: category, department, post, payment_method, payment_number
}

// CORRECT
{
  "role": "EMPLOYEE",
  "full_name": "John",
  "email": "john@company.com",
  "branch_id": 1,
  "category": "Engineer",
  "department_id": 2,
  "post_id": 5,
  "payment_method": "BANK",
  "payment_number": "1234567890"
}
```

---

## QA TEST CASES

### Super Admin Creation
```gherkin
Scenario: Create Super Admin with minimal fields
  Given I am Super Admin
  When I create a user with role SUPER_ADMIN
  And I provide full_name and email
  Then user should be created
  And password should be auto-generated
  And branch field should not be shown
  And category field should not be shown

Scenario: Super Admin with branch field (should ignore)
  Given I provide branch_id in payload
  When user is created
  Then branch_id should be ignored/null
  And user should be created successfully
```

### HR/Admin Creation
```gherkin
Scenario: Create HR with specific branches
  Given I select role HR
  When I select branches 1, 2, 3
  Then all three branches should be assigned
  And user should be able to manage all three

Scenario: Create HR with view all
  Given I select role HR
  When I check "Can View All Branches"
  Then can_view_all_branches should be true
  And specific branch checkboxes should be disabled

Scenario: HR without branches (should fail)
  Given role is HR
  When branch_ids is empty AND can_view_all_branches is false
  Then creation should fail
  And error: "At least one branch required"
```

### Employee Creation
```gherkin
Scenario: Create complete employee
  Given all required employee fields filled
  When I submit
  Then employee should be created
  And assigned to single branch
  And ready for payroll

Scenario: Employee missing category (should fail)
  Given category field is empty
  When I submit
  Then creation should fail
  And error: "Category is required"
```

---

## MIGRATION FROM OLD SYSTEM

### Backward Compatibility
✅ All existing users continue to work  
✅ Old `category` field behavior unchanged  
✅ `branch_id` still used for primary branch  
✅ New fields are nullable (no schema breaking changes)

### Data Migration (if needed later)
```bash
# Script will:
# 1. Read all existing hr_users
# 2. Create entries in hr_user_branches junction table
# 3. Preserve branch_id as primary branch
# 4. Not modify any existing data

npx ts-node scripts/migrate-legacy-users.ts
```

---

## SUPPORT & DOCUMENTATION

📄 **Full Architecture** → ENTERPRISE_ROLE_ARCHITECTURE.md  
📋 **Field Requirements** → ROLE_FIELD_REQUIREMENTS.md  
🚀 **Implementation** → IMPLEMENTATION_GUIDE.md  
📝 **This Reference** → ROLE_BASED_USER_QUICK_REFERENCE.md (this file)
