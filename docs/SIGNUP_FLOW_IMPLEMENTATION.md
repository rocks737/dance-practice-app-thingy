# Sign-Up Flow Implementation

## 📋 Overview

A complete multi-step sign-up flow has been implemented with email verification, user-friendly onboarding, and automatic profile completion tracking.

## ✨ Features Implemented

### 1. **Multi-Step Sign-Up Process**
- **Step 1**: Email & Password (with Supabase authentication)
- **Step 1.5**: Email Verification (automatic detection & resend option)
- **Step 2**: Personal Information (name, display name, birthdate)
- **Step 3**: Dance Profile (role, competitiveness, WSDC level, bio, goals)
- **Step 4**: Schedule Availability (at least one availability window required)

### 2. **Email Verification**
- Integrated with Supabase email verification
- Auto-detection of verification status (polls every 5 seconds)
- Manual check button ("I've Verified My Email")
- Resend verification email with 60-second cooldown
- User-friendly UI with clear instructions

### 3. **Onboarding Resume Logic**
- Users who drop off during signup are redirected back to complete onboarding
- Middleware checks if profile exists and is complete before allowing access to protected routes
- Automatically skips to Step 2 if user is already authenticated
- Preserves return URL throughout the flow

### 4. **User Experience Improvements**
- Progress indicator showing current step (1/2/3)
- Password visibility toggle
- Real-time password requirements display
- Character counters for text fields (bio: 1000 chars, goals: 500 chars)
- Visual role selection with card-style UI
- Slider for competitiveness level with descriptive labels
- Helpful descriptions for each field
- Back navigation between steps

## 📂 Files Created

### Frontend Components
```
/frontend/src/
├── app/signup/
│   ├── page.tsx                      # Main signup orchestrator
│   ├── auth-step.tsx                 # Step 1: Email/Password
│   ├── email-verification-step.tsx   # Step 1.5: Email verification
│   ├── personal-info-step.tsx        # Step 2: Personal info
│   ├── dance-profile-step.tsx        # Step 3: Dance profile
│   └── schedule-preference-step.tsx  # Step 4: Schedule availability
├── components/
│   ├── signup/
│   │   └── signup-progress.tsx       # Progress indicator component
│   └── ui/
│       └── radio-group.tsx           # New: Radio button UI component
└── lib/
    ├── profiles/
    │   ├── validation.ts             # Updated: Added signup schemas
    │   └── onboarding.ts             # New: Onboarding API functions
    └── supabase/
        └── middleware.ts             # Updated: Added profile completion check
```

### Updated Files
- `/frontend/src/app/login/page.tsx` - Sign Up button now links to `/signup`
- `/frontend/package.json` - Added `@radix-ui/react-radio-group` dependency

## 🔄 User Journey Flow

### New User Sign-Up
```
1. User clicks "Sign Up" on /login page
   ↓
2. /signup - Step 1: Enter email & password
   ↓
3. Supabase creates auth user
   ↓
4. Email verification screen (if enabled in Supabase)
   ↓
5. User verifies email
   ↓
6. Step 2: Enter personal information
   ↓
7. Step 3: Create dance profile
   ↓
8. Profile created in Supabase user_profiles table
   ↓
9. Step 4: Set availability (at least one time slot)
   ↓
10. Schedule preference created in Supabase
   ↓
11. Redirect to schedule/profile page
```

### Returning User (Incomplete Profile)
```
1. User logs in via /login
   ↓
2. Middleware detects incomplete profile
   ↓
3. Automatic redirect to /signup
   ↓
4. Skip Step 1 (already authenticated)
   ↓
5. Continue from Step 2
   ↓
6. Complete remaining steps
   ↓
7. Access granted to app
```

## 🔐 Validation Rules

### Email & Password
- **Email**: Valid email format required
- **Password**: 
  - Minimum 8 characters
  - At least 1 uppercase letter
  - At least 1 lowercase letter
  - At least 1 number

### Personal Information
- **First Name**: Required, max 120 characters
- **Last Name**: Required, max 120 characters
- **Display Name**: Optional, max 160 characters
- **Birth Date**: Optional

### Dance Profile
- **Primary Role**: Required (Leader/Follower)
- **Competitiveness Level**: Required (1-5, default 3)
- **WSDC Level**: Optional (Newcomer to Champion)
- **Bio**: Optional, max 1000 characters
- **Dance Goals**: Optional, max 500 characters

## 🛠️ Technical Details

### State Management
- React `useState` for form data and step tracking
- Form validation using `react-hook-form` + `zod`
- Supabase client for authentication

### API Integration
- **Auth**: Supabase `auth.signUp()` and `auth.getUser()`
- **Profile Creation**: Supabase `user_profiles` table direct insert
- **Email Verification**: Supabase `auth.resend()` for verification emails
- **Role Management**: Supabase `user_roles` table

### Middleware Protection
The middleware (`/frontend/src/lib/supabase/middleware.ts`) now:
1. Checks if user is authenticated
2. Verifies profile exists and is complete (has `first_name` and `last_name`)
3. Redirects to `/signup` if profile is incomplete
4. Allows access to protected routes only with complete profile

### Protected Routes
- `/profile`
- `/schedule`
- `/matches`
- `/sessions`
- `/admin`
- `/settings`

## 🧪 Testing Guide

### Manual Testing Steps

#### 1. New User Sign-Up (Complete Flow)
```bash
# Start the frontend
cd frontend
npm run dev
```

1. Navigate to `http://localhost:3000/login`
2. Click "Sign Up" button
3. Enter email and password (meeting requirements)
4. Check email for verification link
5. Click verification link or use "I've Verified My Email" button
6. Fill in personal information (First name, Last name)
7. Fill in dance profile:
   - Select role (Leader or Follower)
   - Adjust competitiveness slider
   - Optionally select WSDC level
   - Optionally add bio and dance goals
8. Click "Complete Setup"
9. Verify redirect to schedule page
10. Verify profile exists in backend

#### 2. Test Email Verification
1. Sign up with a new email
2. Observe email verification screen
3. Test "Resend Verification Email" (wait 60s after first send)
4. Test manual check button
5. Verify auto-detection after email verification

#### 3. Test Onboarding Resume
1. Start signup flow
2. Complete Step 1 (email verification)
3. **Close browser/tab** during Step 2 or 3
4. Return and login at `/login`
5. Verify redirect to `/signup`
6. Verify skip to Step 2 (personal info)
7. Complete remaining steps

#### 4. Test Back Navigation
1. Start signup flow
2. Complete Step 2
3. Click "Back" button on Step 3
4. Verify return to Step 2 with data preserved
5. Click "Continue" to return to Step 3

#### 5. Test Validation
- **Email**: Try invalid email formats
- **Password**: Try passwords missing requirements
- **Names**: Try empty, very long names
- **Text areas**: Try exceeding character limits

### Supabase Database Testing

You can test profile creation directly in the Supabase dashboard:

1. Go to your Supabase project
2. Navigate to Table Editor → `user_profiles`
3. Check that new profiles are created with all the correct fields
4. Verify `user_roles` table also gets a "DANCER" role entry

Or use the Supabase JavaScript client in browser console:
```javascript
// After completing signup, check the profile
const { data } = await supabase
  .from('user_profiles')
  .select('*')
  .eq('email', 'test@example.com')
  .single();
console.log(data);
```

### Automated Testing (Future)

Create integration tests for:
- Complete sign-up flow
- Email verification flow
- Onboarding resume logic
- Form validation
- API integration

## 🐛 Known Issues & Considerations

### Supabase Email Verification
- **Development**: Email verification may be disabled in Supabase for local testing
- **Production**: Enable email verification in Supabase dashboard
- **Email Templates**: Customize verification email template in Supabase

### Environment Variables
Ensure these are set in `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Supabase Database Considerations
- **Primary Role**: Stored as integers (0 = Leader, 1 = Follower)
- **WSDC Levels**: Stored as integers (0-5: Newcomer through Champion)
- **Account Status**: Stored as integers (0 = Active, 1 = Suspended, 2 = Deleted)
- **Competitiveness Level**: Integer 1-5
- **Profile Visible**: Boolean (defaults to `true`)
- Row Level Security (RLS) policies should be enabled on `user_profiles` table

## 📝 Future Enhancements

### Short-term
1. Add profile picture upload
2. Add social media links
3. Add home location selection during onboarding
4. Add welcome tour after signup
5. Add analytics tracking for drop-off points

### Long-term
1. OAuth providers (Google, Facebook, Apple)
2. SMS verification option
3. Progressive onboarding (allow skipping, complete later)
4. Onboarding A/B testing
5. Personalized recommendations based on profile

## 🎨 UI/UX Highlights

### Visual Design
- **Progress Indicator**: Shows current step with checkmarks for completed steps
- **Role Selection**: Card-based selection with hover effects
- **Slider**: Visual competitiveness slider with descriptive labels
- **Character Counters**: Real-time feedback on text length
- **Password Toggle**: Eye icon to show/hide password
- **Loading States**: Spinners and disabled states during async operations

### Accessibility
- Proper label associations
- ARIA attributes where needed
- Keyboard navigation support
- Clear error messages
- Focus management

### Responsive Design
- Mobile-friendly layouts
- Touch-friendly button sizes
- Proper spacing and padding
- Dark mode support

## 📞 Support

If you encounter issues:
1. Check browser console for errors
2. Verify Supabase configuration
3. Check backend API is running
4. Verify environment variables are set
5. Check network tab for failed API calls

## 🎉 Summary

The sign-up flow is now complete with:
- ✅ 3-step onboarding process
- ✅ Email verification with Supabase
- ✅ Automatic profile completion tracking
- ✅ User-friendly UI with helpful descriptions
- ✅ Validation at every step
- ✅ Onboarding resume logic for dropoffs
- ✅ Integration with existing profile system

Ready to test! 🚀

