# Profile Page Implementation Plan

## 📋 Overview

Implement a reactive profile page that allows users to:
- View their profile information
- Edit personal details
- Update dance preferences
- Change password
- Update notification settings

Following patterns from SessionsExplorer component and API structure.

---

## 🏗️ Architecture

### Pattern Observed from Sessions:
1. **API Layer** (`lib/profiles/api.ts`) - Supabase queries using typed Database
2. **Types Layer** (`lib/profiles/types.ts`) - Business types and mappings
3. **Component Layer** - Reactive UI with forms and validation
4. **Hooks** - Already have `useUserProfile` and `useUserRoles`

---

## 📁 File Structure

```
frontend/src/
├── lib/
│   └── profiles/
│       ├── api.ts          # Profile CRUD operations
│       ├── types.ts        # Profile-specific types and enums
│       └── validation.ts   # Form validation schemas
├── components/
│   └── profile/
│       ├── ProfileHeader.tsx        # Avatar + name display
│       ├── PersonalInfoForm.tsx     # First/Last name, email, birth date
│       ├── DancePreferencesForm.tsx # Role, skill level, competitiveness
│       ├── BiographyForm.tsx        # Bio and dance goals
│       ├── PasswordChangeForm.tsx   # Password update
│       └── ProfileSettings.tsx      # Visibility, notifications
└── app/(app)/profile/
    └── page.tsx            # Main profile page (already exists as placeholder)
```

---

## 🎨 Component Design

### 1. Main Profile Page (`page.tsx`)
```typescript
// Server component that gets user
export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) redirect('/login');
  
  return <ProfileEditor authUserId={user.id} />;
}
```

### 2. Profile Editor (Client Component)
```typescript
"use client";

export function ProfileEditor({ authUserId }: { authUserId: string }) {
  const { profile, loading, error } = useUserProfile(authUserId);
  const { roles } = useUserRoles(profile?.id);
  
  // Tabs: Personal Info | Dance Preferences | Biography | Settings | Security
  return (
    <Tabs>
      <TabsList />
      <TabsContent value="personal">
        <PersonalInfoForm profile={profile} onSave={handleSave} />
      </TabsContent>
      ...
    </Tabs>
  );
}
```

---

## 🔧 API Functions

### `lib/profiles/api.ts`

```typescript
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";

type UserProfileUpdate = Database["public"]["Tables"]["user_profiles"]["Update"];

/**
 * Update user profile
 */
export async function updateProfile(
  profileId: string,
  updates: Partial<UserProfileUpdate>
): Promise<void> {
  const supabase = createClient();
  
  const { error } = await supabase
    .from("user_profiles")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", profileId);
    
  if (error) throw new Error(error.message);
}

/**
 * Update user password
 */
export async function updatePassword(
  newPassword: string
): Promise<void> {
  const supabase = createClient();
  
  const { error } = await supabase.auth.updateUser({
    password: newPassword
  });
  
  if (error) throw new Error(error.message);
}

/**
 * Upload profile photo
 */
export async function uploadProfilePhoto(
  userId: string,
  file: File
): Promise<string> {
  const supabase = createClient();
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}-${Date.now()}.${fileExt}`;
  
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(fileName, file);
    
  if (uploadError) throw new Error(uploadError.message);
  
  const { data } = supabase.storage
    .from('avatars')
    .getPublicUrl(fileName);
    
  return data.publicUrl;
}
```

---

## 📊 Types

### `lib/profiles/types.ts`

```typescript
export enum PrimaryRole {
  LEADER = 0,
  FOLLOWER = 1,
}

export enum WsdcSkillLevel {
  NOVICE = 0,
  INTERMEDIATE = 1,
  ADVANCED = 2,
  ALLSTAR = 3,
  CHAMPION = 4,
}

export enum AccountStatus {
  ACTIVE = 0,
  SUSPENDED = 1,
  DELETED = 2,
}

export const PRIMARY_ROLE_LABELS = {
  [PrimaryRole.LEADER]: "Leader",
  [PrimaryRole.FOLLOWER]: "Follower",
} as const;

export const WSDC_SKILL_LEVEL_LABELS = {
  [WsdcSkillLevel.NOVICE]: "Novice",
  [WsdcSkillLevel.INTERMEDIATE]: "Intermediate",
  [WsdcSkillLevel.ADVANCED]: "Advanced",
  [WsdcSkillLevel.ALLSTAR]: "All-Star",
  [WsdcSkillLevel.CHAMPION]: "Champion",
} as const;

export interface ProfileFormData {
  first_name: string;
  last_name: string;
  display_name: string | null;
  email: string;
  birth_date: string | null;
  bio: string | null;
  dance_goals: string | null;
  primary_role: PrimaryRole;
  wsdc_level: WsdcSkillLevel | null;
  competitiveness_level: number;
  profile_visible: boolean;
}

export interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}
```

---

## 🎯 Form Components

### 1. Personal Info Form

**Fields:**
- First Name (required)
- Last Name (required)
- Display Name (optional)
- Email (read-only, shown for reference)
- Birth Date (optional)

**Features:**
- Inline validation
- Save/Cancel buttons
- Loading state
- Success/error messages

### 2. Dance Preferences Form

**Fields:**
- Primary Role (Leader/Follower)
- WSDC Skill Level (dropdown)
- Competitiveness Level (1-5 slider)

**Features:**
- Visual indicators (icons, colors)
- Tooltips explaining each level
- Immediate save on change (with debounce)

### 3. Biography Form

**Fields:**
- Bio (text area, 1000 char limit)
- Dance Goals (text area, 500 char limit)

**Features:**
- Character counter
- Auto-save (debounced)
- Rich text preview

### 4. Password Change Form

**Fields:**
- Current Password
- New Password (with strength indicator)
- Confirm New Password

**Features:**
- Password strength meter
- Show/hide password toggle
- Validation (min 8 chars, etc.)
- Success feedback

### 5. Profile Settings

**Fields:**
- Profile Visibility (public/private toggle)
- Notification Preferences (checkboxes)
- Home Location (select from locations)

---

## 🔐 Validation

### `lib/profiles/validation.ts`

```typescript
import { z } from "zod";

export const personalInfoSchema = z.object({
  first_name: z.string().min(1, "First name is required").max(120),
  last_name: z.string().min(1, "Last name is required").max(120),
  display_name: z.string().max(160).nullable(),
  birth_date: z.string().nullable(),
});

export const dancePreferencesSchema = z.object({
  primary_role: z.number().int().min(0).max(1),
  wsdc_level: z.number().int().min(0).max(4).nullable(),
  competitiveness_level: z.number().int().min(1).max(5),
});

export const biographySchema = z.object({
  bio: z.string().max(1000).nullable(),
  dance_goals: z.string().max(500).nullable(),
});

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, "Current password required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});
```

---

## 🎨 UI/UX Features

### Visual Design:
- ✨ Clean, card-based layout
- 📱 Fully responsive (mobile-first)
- 🎨 Consistent with existing app theme
- ♿ Accessible (ARIA labels, keyboard navigation)

### User Experience:
- ⚡ Optimistic updates
- 💾 Auto-save with visual feedback
- 🔄 Loading skeletons
- ✅ Success toasts
- ❌ Inline error messages
- 🎯 Focus management

### Performance:
- 🚀 Debounced auto-save (500ms)
- 📦 Form state management (React Hook Form)
- 🎭 Optimistic UI updates
- 🔄 SWR for data fetching

---

## 🧪 Testing Strategy

### Unit Tests:
- Validation schemas
- API functions (mocked Supabase)
- Form submission logic

### Component Tests:
- Form rendering
- Validation feedback
- Save/cancel behavior
- Password strength indicator

### Integration Tests:
- Full profile update flow
- Password change flow
- Error handling

---

## 📦 Dependencies Needed

```json
{
  "dependencies": {
    "react-hook-form": "^7.48.0",
    "@hookform/resolvers": "^3.3.2",
    "zod": "^3.22.4",
    "sonner": "^1.2.0"  // For toast notifications
  }
}
```

---

## 🚀 Implementation Phases

### Phase 1: Foundation (Day 1)
1. ✅ API layer (`api.ts`)
2. ✅ Type definitions (`types.ts`)
3. ✅ Validation schemas (`validation.ts`)
4. ✅ Basic ProfileEditor shell

### Phase 2: Core Forms (Day 2)
1. ✅ PersonalInfoForm
2. ✅ DancePreferencesForm  
3. ✅ Integration with main page
4. ✅ Save functionality

### Phase 3: Additional Features (Day 3)
1. ✅ BiographyForm
2. ✅ PasswordChangeForm
3. ✅ ProfileSettings
4. ✅ Profile photo upload

### Phase 4: Polish (Day 4)
1. ✅ Loading states
2. ✅ Error handling
3. ✅ Success feedback
4. ✅ Responsive design
5. ✅ Accessibility

### Phase 5: Testing (Day 5)
1. ✅ Unit tests
2. ✅ Component tests
3. ✅ Integration tests
4. ✅ E2E testing

---

## 🎯 Success Criteria

- [ ] Users can view their profile
- [ ] Users can edit all personal information
- [ ] Changes save successfully to Supabase
- [ ] Password updates work correctly
- [ ] Form validation provides clear feedback
- [ ] Mobile responsive
- [ ] Accessible (WCAG 2.1 AA)
- [ ] Loading and error states handled
- [ ] 90%+ test coverage

---

## 💡 Future Enhancements

1. **Profile Photo**
   - Upload/crop avatar
   - Use Supabase Storage

2. **Social Links**
   - Instagram, Facebook links
   - Competition results

3. **Privacy Controls**
   - Granular visibility settings
   - Block/report users

4. **Verification**
   - Email verification badge
   - ID verification for instructors

5. **Activity Feed**
   - Recent sessions
   - Practice stats

---

## 🔗 Related Files

- `frontend/src/lib/hooks/useUserProfile.ts` (already exists)
- `frontend/src/lib/hooks/useUserRoles.ts` (already exists)
- `frontend/src/lib/supabase/types.ts` (generated types)
- `frontend/src/components/sessions/SessionsExplorer.tsx` (reference pattern)

---

## 📝 Notes

- Follow existing patterns from SessionsExplorer
- Use shadcn/ui components (already in project)
- Leverage generated Supabase types
- Keep forms reactive and responsive
- Auto-save where appropriate
- Manual save for critical changes (password)

