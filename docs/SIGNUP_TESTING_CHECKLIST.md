# Sign-Up Flow Testing Checklist

## 🚀 Quick Start

```bash
# Terminal 1: Start backend (if needed)
cd backend
./gradlew bootRun

# Terminal 2: Start frontend
cd frontend
npm run dev
```

Navigate to: `http://localhost:3000/login`

---

## ✅ Test Scenarios

### Scenario 1: Complete New User Sign-Up
**Goal**: Verify the entire happy path from start to finish

- [ ] Click "Sign Up" button on login page
- [ ] Verify redirect to `/signup`
- [ ] Enter valid email (e.g., `test@example.com`)
- [ ] Enter valid password (8+ chars, uppercase, lowercase, number)
- [ ] Click "Create Account"
- [ ] Verify email verification screen appears
- [ ] Check email inbox for verification link
- [ ] Click verification link OR click "I've Verified My Email"
- [ ] Verify progression to Step 2 (Personal Info)
- [ ] Enter First Name (required)
- [ ] Enter Last Name (required)
- [ ] Optionally enter Display Name
- [ ] Optionally select Birth Date
- [ ] Click "Continue"
- [ ] Verify progression to Step 3 (Dance Profile)
- [ ] Select a role (Leader or Follower)
- [ ] Adjust competitiveness slider (1-5)
- [ ] Optionally select WSDC level
- [ ] Optionally enter bio (max 1000 chars)
- [ ] Optionally enter dance goals (max 500 chars)
- [ ] Click "Complete Setup"
- [ ] Verify redirect to `/schedule` or return URL
- [ ] Verify profile visible in backend/database

**Expected Result**: ✅ User successfully created with complete profile

---

### Scenario 2: Email Verification Features
**Goal**: Test email verification functionality

- [ ] Start sign-up process
- [ ] After creating account, observe email verification screen
- [ ] Verify "Resend in 60s" countdown works
- [ ] Wait 60 seconds
- [ ] Click "Resend Verification Email"
- [ ] Verify success toast message
- [ ] Verify countdown resets to 60s
- [ ] Click "I've Verified My Email" button
- [ ] If not verified, see error message
- [ ] Verify email in another tab
- [ ] Observe automatic progression after ~5 seconds

**Expected Result**: ✅ All email verification features work correctly

---

### Scenario 3: Onboarding Resume (Drop-off Recovery)
**Goal**: Verify users can resume incomplete onboarding

#### 3a: Drop-off at Email Verification
- [ ] Start sign-up, create account
- [ ] Close browser at email verification screen
- [ ] Return to `/login`
- [ ] Enter credentials and sign in
- [ ] Verify redirect to `/signup`
- [ ] Verify skip to Step 2 (not Step 1)
- [ ] Complete Steps 2 and 3
- [ ] Verify successful profile creation

#### 3b: Drop-off at Personal Info
- [ ] Start sign-up, complete Step 1 (verify email)
- [ ] Close browser at Step 2
- [ ] Return and login
- [ ] Verify redirect to `/signup`
- [ ] Verify resume at Step 2
- [ ] Complete remaining steps

#### 3c: Drop-off at Dance Profile
- [ ] Complete Steps 1 and 2
- [ ] Close browser at Step 3
- [ ] Return and login
- [ ] Verify redirect to `/signup`
- [ ] Verify resume at Step 2 (since profile not created)
- [ ] Complete Steps 2 and 3

**Expected Result**: ✅ Users can always resume and complete onboarding

---

### Scenario 4: Form Validation
**Goal**: Verify all validation rules work

#### Email & Password Validation
- [ ] Try invalid email format (e.g., `notanemail`)
- [ ] Verify error message appears
- [ ] Try password < 8 characters
- [ ] Verify error message
- [ ] Try password without uppercase letter
- [ ] Verify error message
- [ ] Try password without lowercase letter
- [ ] Verify error message
- [ ] Try password without number
- [ ] Verify error message

#### Personal Info Validation
- [ ] Leave First Name empty, click Continue
- [ ] Verify error message
- [ ] Leave Last Name empty, click Continue
- [ ] Verify error message
- [ ] Enter 121+ characters in First Name
- [ ] Verify error message
- [ ] Enter 161+ characters in Display Name
- [ ] Verify error message

#### Dance Profile Validation
- [ ] Try to submit without selecting a role
- [ ] Verify error message
- [ ] Enter 1001+ characters in bio
- [ ] Verify character count turns red
- [ ] Verify error on submit
- [ ] Enter 501+ characters in dance goals
- [ ] Verify character count turns red
- [ ] Verify error on submit

**Expected Result**: ✅ All validation rules enforced properly

---

### Scenario 5: Back Navigation
**Goal**: Verify data preservation when going back

- [ ] Complete Step 1 (email verification)
- [ ] Complete Step 2 with test data
- [ ] On Step 3, click "Back" button
- [ ] Verify return to Step 2
- [ ] Verify all data from Step 2 is preserved
- [ ] Modify some data
- [ ] Click "Continue" to Step 3
- [ ] Verify can proceed forward again

**Expected Result**: ✅ Data preserved when navigating back

---

### Scenario 6: UI/UX Features
**Goal**: Verify user-friendly features work

#### Progress Indicator
- [ ] At Step 2, verify progress shows "2 of 3"
- [ ] Verify Step 1 has checkmark
- [ ] Verify Step 2 is highlighted
- [ ] At Step 3, verify progress shows "3 of 3"
- [ ] Verify Steps 1 and 2 have checkmarks

#### Password Visibility Toggle
- [ ] On Step 1, click eye icon
- [ ] Verify password becomes visible
- [ ] Click eye icon again
- [ ] Verify password is hidden

#### Character Counters
- [ ] In bio field, start typing
- [ ] Verify character count updates in real-time
- [ ] Type over 1000 characters
- [ ] Verify counter turns red
- [ ] Same for dance goals (500 char limit)

#### Competitiveness Slider
- [ ] Drag slider to different positions
- [ ] Verify number updates (1-5)
- [ ] Verify labels are visible ("Social", "Balanced", "Competitive")

#### Role Selection
- [ ] Hover over Leader card
- [ ] Verify hover effect
- [ ] Click Leader
- [ ] Verify card is highlighted/selected
- [ ] Click Follower
- [ ] Verify selection changes

**Expected Result**: ✅ All UI features provide good user experience

---

### Scenario 7: Protected Routes (Middleware)
**Goal**: Verify middleware redirects incomplete profiles

- [ ] Create new account (Step 1 only)
- [ ] Verify email but don't complete Step 2
- [ ] Manually navigate to `/schedule`
- [ ] Verify redirect to `/signup`
- [ ] Try navigating to `/profile`
- [ ] Verify redirect to `/signup`
- [ ] Try navigating to `/sessions`
- [ ] Verify redirect to `/signup`
- [ ] Complete profile
- [ ] Try accessing `/schedule` again
- [ ] Verify access granted

**Expected Result**: ✅ Incomplete profiles cannot access protected routes

---

### Scenario 8: Dark Mode
**Goal**: Verify sign-up flow works in dark mode

- [ ] Enable dark mode in browser/system
- [ ] Go through entire sign-up flow
- [ ] Verify all screens readable in dark mode
- [ ] Verify no contrast issues
- [ ] Verify buttons and inputs visible

**Expected Result**: ✅ Dark mode support throughout

---

### Scenario 9: Mobile Responsiveness
**Goal**: Verify mobile-friendly design

- [ ] Open in mobile viewport (375px width)
- [ ] Go through sign-up flow
- [ ] Verify progress indicator fits
- [ ] Verify forms are readable
- [ ] Verify buttons are touch-friendly
- [ ] Verify no horizontal scrolling
- [ ] Test on actual mobile device if possible

**Expected Result**: ✅ Mobile-friendly on all screens

---

### Scenario 10: Error Handling
**Goal**: Verify graceful error handling

#### Network Errors
- [ ] Disconnect network
- [ ] Try to submit Step 3
- [ ] Verify error message appears
- [ ] Reconnect network
- [ ] Retry submission
- [ ] Verify success

#### Backend Errors
- [ ] Stop backend server
- [ ] Try to submit Step 3
- [ ] Verify user-friendly error message
- [ ] Start backend server
- [ ] Retry submission

#### Duplicate Email
- [ ] Try signing up with existing email
- [ ] Verify appropriate error message
- [ ] Verify user can retry with different email

**Expected Result**: ✅ Graceful error handling with helpful messages

---

## 🐛 Bug Report Template

If you find any issues, use this template:

```
**Issue**: [Brief description]

**Steps to Reproduce**:
1. 
2. 
3. 

**Expected Behavior**: 

**Actual Behavior**: 

**Screenshot**: [If applicable]

**Browser/Device**: 

**Console Errors**: [If any]
```

---

## ✨ Test Results Summary

After completing all scenarios, fill out:

- **Date Tested**: 
- **Tested By**: 
- **Environment**: Local / Staging / Production
- **Pass Rate**: ___ / 10 scenarios passed

### Issues Found:
1. 
2. 
3. 

### Notes:
- 
- 

---

## 🎯 Acceptance Criteria

Sign-up flow is ready for production when:
- ✅ All 10 scenarios pass
- ✅ No critical bugs
- ✅ Mobile responsive
- ✅ Dark mode support
- ✅ Email verification works
- ✅ Onboarding resume works
- ✅ All validations enforced
- ✅ Graceful error handling
- ✅ Backend integration works
- ✅ Middleware protection works

