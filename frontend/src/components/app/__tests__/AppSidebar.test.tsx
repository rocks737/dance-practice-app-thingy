import { screen } from '@testing-library/react'
import { render, mockUser } from '@/test/test-utils'
import { AppSidebar } from '@/components/app/AppSidebar'

// Mock the hooks
jest.mock('@/lib/hooks/useUserProfile', () => ({
  useUserProfile: jest.fn(() => ({
    profile: {
      id: '123',
      first_name: 'Test',
      last_name: 'User',
      display_name: 'TestUser',
      email: 'test@example.com',
    },
    loading: false,
    error: null,
  })),
}))

jest.mock('@/lib/hooks/useUserRoles', () => ({
  useUserRoles: jest.fn(() => ({
    isAdmin: false,
    isInstructor: false,
    isOrganizer: false,
    isDancer: true,
    roles: ['DANCER'],
    loading: false,
  })),
}))

describe('AppSidebar', () => {
  it('renders the app title', () => {
    render(<AppSidebar user={mockUser} />)
    
    expect(screen.getByText('Dance Practice')).toBeInTheDocument()
  })

  it('displays user email', () => {
    render(<AppSidebar user={mockUser} />)
    
    expect(screen.getByText('test@example.com')).toBeInTheDocument()
  })

  it('renders all navigation links', () => {
    render(<AppSidebar user={mockUser} />)
    
    expect(screen.getByText('Profile')).toBeInTheDocument()
    expect(screen.getByText('Schedule')).toBeInTheDocument()
    expect(screen.getByText('Matches')).toBeInTheDocument()
    expect(screen.getByText('Sessions')).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  it('does not show admin link for non-admin users', () => {
    render(<AppSidebar user={mockUser} />)
    
    expect(screen.queryByText('Admin')).not.toBeInTheDocument()
  })

  it('shows admin link for admin users', () => {
    const { useUserRoles } = require('@/lib/hooks/useUserRoles')
    useUserRoles.mockImplementation(() => ({
      isAdmin: true,
      isInstructor: false,
      isOrganizer: false,
      isDancer: true,
      roles: ['DANCER', 'ADMIN'],
      loading: false,
    }))

    render(<AppSidebar user={mockUser} />)
    
    expect(screen.getByText('Admin')).toBeInTheDocument()
  })

  it('renders settings link', () => {
    render(<AppSidebar user={mockUser} />)
    
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  it('renders sign out button', () => {
    render(<AppSidebar user={mockUser} />)
    
    expect(screen.getByText('Sign Out')).toBeInTheDocument()
  })

  it('displays user display name when available', () => {
    render(<AppSidebar user={mockUser} />)
    
    expect(screen.getByText('TestUser')).toBeInTheDocument()
  })
})

