import { renderHook, waitFor } from '@testing-library/react'
import { useUserProfile } from '@/lib/hooks/useUserProfile'

// Mock the Supabase responses for this test
const mockFrom = jest.fn()
const mockSelect = jest.fn()
const mockEq = jest.fn()
const mockSingle = jest.fn()

// Mock createClient before importing
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    from: mockFrom,
  })),
}))

const mockProfileData = {
  id: 'profile-123',
  auth_user_id: 'user-123',
  first_name: 'John',
  last_name: 'Doe',
  display_name: 'JohnD',
  email: 'john@example.com',
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

describe('useUserProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Setup default mock chain
    mockSingle.mockReturnValue({
      data: mockProfileData,
      error: null,
    })
    mockEq.mockReturnValue({
      single: mockSingle,
    })
    mockSelect.mockReturnValue({
      eq: mockEq,
    })
    mockFrom.mockReturnValue({
      select: mockSelect,
    })
  })

  it('returns initial state when no authUserId provided', () => {
    const { result } = renderHook(() => useUserProfile())
    
    expect(result.current.profile).toBeNull()
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('fetches and sets user profile', async () => {
    const { result } = renderHook(() => useUserProfile('user-123'))
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    
    expect(result.current.profile).toEqual(mockProfileData)
    expect(result.current.error).toBeNull()
    expect(mockFrom).toHaveBeenCalledWith('user_profiles')
  })

  it('handles errors gracefully', async () => {
    const error = new Error('Database error')
    mockSingle.mockReturnValue({
      data: null,
      error,
    })
    
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
    
    const { result } = renderHook(() => useUserProfile('user-123'))
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    
    expect(result.current.profile).toBeNull()
    expect(result.current.error).toEqual(error)
    expect(consoleSpy).toHaveBeenCalled()
    
    consoleSpy.mockRestore()
  })

  it('calls supabase with correct parameters', async () => {
    renderHook(() => useUserProfile('user-123'))
    
    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith('user_profiles')
    })
  })
})

