# Frontend Tests

This directory contains tests for the Dance Practice App frontend.

## Test Setup

We use:
- **Jest** - Test runner
- **React Testing Library** - Component testing
- **@testing-library/user-event** - User interaction simulation

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Test Structure

```
src/
├── __tests__/                    # Integration tests
│   └── navigation.integration.test.tsx
├── app/(app)/
│   ├── profile/__tests__/        # Profile page tests
│   ├── sessions/__tests__/       # Sessions page tests
│   └── settings/__tests__/       # Settings page tests
├── components/
│   ├── __tests__/                # Component tests
│   │   ├── theme-toggle.test.tsx
│   │   └── theme-settings.test.tsx
│   └── app/__tests__/            # App component tests
│       └── AppSidebar.test.tsx
├── lib/hooks/__tests__/          # Hook tests
│   ├── useUserProfile.test.ts
│   └── useUserRoles.test.ts
└── test/
    └── test-utils.tsx            # Test utilities and mocks
```

## Test Coverage

Current test coverage includes:

### Components
- ✅ AppSidebar - Navigation, user display, admin visibility
- ✅ ThemeToggle - Theme switching functionality
- ✅ ThemeSettings - Theme preference UI

### Hooks
- ✅ useUserProfile - User profile data fetching
- ✅ useUserRoles - User role and permissions

### Pages
- ✅ Profile - Page rendering
- ✅ Sessions - Page rendering and create button
- ✅ Settings - Theme settings and page structure

### Integration
- ✅ Navigation - Complete sidebar navigation flow

## Writing New Tests

### Component Test Example

```typescript
import { screen } from '@testing-library/react'
import { render } from '@/test/test-utils'
import MyComponent from './MyComponent'

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })
})
```

### Hook Test Example

```typescript
import { renderHook, waitFor } from '@testing-library/react'
import { useMyHook } from './useMyHook'

describe('useMyHook', () => {
  it('returns expected data', async () => {
    const { result } = renderHook(() => useMyHook())
    
    await waitFor(() => {
      expect(result.current.data).toBeDefined()
    })
  })
})
```

## Test Utilities

### Mock Data
Use the mock data from `test-utils.tsx`:
- `mockUser` - Mock authenticated user
- `mockUserProfile` - Mock user profile data
- `mockAdminRole` - Mock admin role

### Custom Render
The custom `render` function includes theme provider:
```typescript
import { render } from '@/test/test-utils'

render(<MyComponent />)
```

## Mocked Dependencies

The following are mocked globally in `jest.setup.ts`:
- Next.js navigation (`useRouter`, `usePathname`, `redirect`)
- Supabase client
- next-themes

## CI/CD Integration

Tests run automatically on:
- Pull requests
- Push to main branch
- Manual workflow dispatch

See `.github/workflows/frontend-tests.yml` for CI configuration.

