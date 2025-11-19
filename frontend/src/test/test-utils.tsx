import { render as rtlRender, RenderOptions } from '@testing-library/react'
import { ReactElement } from 'react'

// For most tests, we don't need a provider wrapper
// The global mocks in jest.setup.ts handle next-themes
const customRender = (
  ui: ReactElement,
  options?: RenderOptions,
) => rtlRender(ui, options)

export * from '@testing-library/react'
export { customRender as render }

// Mock user for testing
export const mockUser = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  email: 'test@example.com',
  aud: 'authenticated',
  role: 'authenticated',
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
  app_metadata: {},
  user_metadata: {},
}

// Mock user profile
export const mockUserProfile = {
  id: '123e4567-e89b-12d3-a456-426614174001',
  auth_user_id: mockUser.id,
  first_name: 'Test',
  last_name: 'User',
  display_name: 'TestUser',
  email: 'test@example.com',
  bio: 'Test bio',
  dance_goals: 'Improve technique',
  birth_date: '1990-01-01',
  profile_visible: true,
  primary_role: 'LEADER',
  wsdc_level: 'INTERMEDIATE',
  competitiveness_level: 3,
  account_status: 'ACTIVE',
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
}

// Mock roles
export const mockAdminRole = {
  user_id: mockUserProfile.id,
  role: 'ADMIN',
}

