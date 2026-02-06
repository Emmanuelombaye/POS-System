# 🔐 Cashier-Branch Exclusive Mapping System

## Overview
Each cashier is now **exclusively linked** to a single branch. Only the correct cashier can log into their assigned branch with the corresponding password.

---

## 📋 Cashier-Branch Assignments

| Cashier Name | Assigned Branch | Password | Branch ID |
|--------------|-----------------|----------|-----------|
| **Alice** | Edendrop001 Tamasha | `@Kenya90!` | `branch1` |
| **Bob** | Edendrop001 Reem | `@Kenya80!` | `branch2` |
| **Carol** | Edendrop001 LungaLunga | `@Kenya70!` | `branch3` |

---

## 🔒 Authentication Flow

### Login Process:
1. **Select Branch** → Pick one of the three Edendrop001 branches
2. **Select Role** → Choose "Cashier"
3. **Select Assigned Cashier** → Only shows cashiers assigned to that branch
4. **Enter Password** → Must match the branch password
5. **Login** → Access granted only if everything matches

### Integrity Checks:
- ✅ Cashier must belong to selected branch (Bob can't login to Alice's Tamasha branch)
- ✅ Password must match the branch password
- ✅ If mismatch detected, login is rejected with clear error message
- ✅ Unassigned cashier to branch combo shows: "This cashier is not assigned to this branch. Integrity check failed."

---

## 🛠️ Technical Implementation

### File: `src/pages/auth/LoginPage.tsx`

#### 1. **Branch-Cashier Mapping Object**
```typescript
const CASHIER_BRANCH_MAPPING = {
  "Alice": "branch1",      // Edendrop001 Tamasha
  "Bob": "branch2",        // Edendrop001 Reem
  "Carol": "branch3",      // Edendrop001 LungaLunga
} as const;
```

#### 2. **Password by Branch**
```typescript
const CASHIER_PASSWORDS_BY_BRANCH = {
  branch1: "@Kenya90!",  // Tamasha
  branch2: "@Kenya80!",  // Reem
  branch3: "@Kenya70!",  // LungaLunga
} as const;
```

#### 3. **Filtered Cashiers List**
```typescript
const filteredCashiers = selectedRole === "cashier" && selectedBranch
  ? roleUsers.filter(user => {
      const assignedBranch = CASHIER_BRANCH_MAPPING[user.name];
      return assignedBranch === selectedBranch;
    })
  : roleUsers;
```

#### 4. **Integrity Validation in handleLogin()**
```typescript
if (selectedRole === "cashier") {
  const selectedUser = users.find(u => u.id === selectedUserId);
  const assignedBranch = CASHIER_BRANCH_MAPPING[selectedUser?.name];
  
  if (assignedBranch !== selectedBranch) {
    setError(`❌ This cashier is not assigned to ${selectedBranch}. Integrity check failed.`);
    return;
  }
}
```

---

## 🚀 Login Scenarios

### ✅ Correct Login: Alice → Tamasha
1. Select: **Edendrop001 Tamasha**
2. Select: **Cashier**
3. Available: **Alice** (shown because she's assigned to Tamasha)
4. Select: **Alice**
5. Enter: **@Kenya90!**
6. Result: ✅ **Login Success**

### ✅ Correct Login: Bob → Reem
1. Select: **Edendrop001 Reem**
2. Select: **Cashier**
3. Available: **Bob** (shown because he's assigned to Reem)
4. Select: **Bob**
5. Enter: **@Kenya80!**
6. Result: ✅ **Login Success**

### ✅ Correct Login: Carol → LungaLunga
1. Select: **Edendrop001 LungaLunga**
2. Select: **Cashier**
3. Available: **Carol** (shown because she's assigned to LungaLunga)
4. Select: **Carol**
5. Enter: **@Kenya70!**
6. Result: ✅ **Login Success**

---

## ❌ Invalid Scenarios (Blocked)

### Scenario 1: Wrong Password
- Select: **Edendrop001 Tamasha**
- Select: **Alice**
- Enter: **@Kenya80!** (wrong password)
- Result: ❌ **Invalid password. Password is: @Kenya90!**

### Scenario 2: Wrong Cashier for Branch
*(This doesn't happen in normal flow because list is filtered)*
- If someone tries to manually login Bob to Tamasha:
- Result: ❌ **This cashier is not assigned to this branch. Integrity check failed.**

### Scenario 3: No Cashiers for Selected Branch
*(If somehow cashier list is empty for branch)*
- Message: ⚠️ **"No cashiers assigned to this branch. Please select a different branch."**

---

## 📊 UI/UX Changes

### When Cashier Role Selected:
1. **Branch list appears** - Cashier must select their branch first
2. **User list filters** - Only shows cashiers assigned to selected branch
3. **Empty state** - If no cashiers assigned, shows warning message
4. **Password hint** - Error message shows which password is required

### Label Changes:
- Admin/Manager: "Select Staff Member"
- Cashier: "Select Assigned Cashier"

---

## 🔄 Adding New Cashiers

To add a new cashier (e.g., "David" to Reem):

### Step 1: Add to mapping in `LoginPage.tsx`
```typescript
const CASHIER_BRANCH_MAPPING = {
  "Alice": "branch1",
  "Bob": "branch2",
  "Carol": "branch3",
  "David": "branch2",  // ← New cashier for Reem
} as const;
```

### Step 2: Create user in database
- Name: `David`
- Role: `cashier`
- Branch ID: `branch2`
- Password: `@Kenya80!` (same as branch)

### Step 3: Login test
- Select: Edendrop001 Reem
- Select: Cashier
- David should appear in the filtered list

---

## 🔐 Password Management

### Why Different Passwords per Branch?
- **Security**: Each branch has independent password
- **Auditability**: Can track which cashier accessed which branch
- **Flexibility**: Can rotate branch passwords without affecting other branches
- **Access Control**: Easy to lock down a branch if needed

### Changing a Branch Password:
1. Update `CASHIER_PASSWORDS_BY_BRANCH` in LoginPage
2. Update password hash in database for that branch's cashiers
3. Inform cashiers of new password
4. Test login flow

---

## ✅ Verification Checklist

- [ ] Alice can login with @Kenya90! to Tamasha only
- [ ] Bob can login with @Kenya80! to Reem only
- [ ] Carol can login with @Kenya70! to LungaLunga only
- [ ] Alice doesn't appear in Bob's branch (Reem)
- [ ] Wrong passwords are rejected
- [ ] Wrong cashier to branch combos are rejected
- [ ] Error messages are clear and helpful
- [ ] Login flow maintains data integrity

---

## 📞 Support

### If login fails:
1. Check that the **correct branch** is selected
2. Verify the **correct cashier** appears in the list
3. Confirm the **correct password** for that branch is entered
4. Look for specific error message on screen

### If wrong cashier appears:
- Check the `CASHIER_BRANCH_MAPPING` in LoginPage
- Verify user's name matches exactly in the database
- Check branch_id is set correctly for the user

---

**Last Updated:** February 6, 2026  
**Status:** ✅ Exclusive Branch-Cashier Mapping Complete
