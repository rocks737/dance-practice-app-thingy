import { screen } from '@testing-library/react'
import { render } from '@/test/test-utils'
import ProfilePage from '@/app/(app)/profile/page'

describe('ProfilePage', () => {
  it('renders the profile page heading', () => {
    render(<ProfilePage />)
    
    expect(screen.getByRole('heading', { name: /profile/i })).toBeInTheDocument()
  })

  it('displays construction message', () => {
    render(<ProfilePage />)
    
    expect(screen.getByText(/this page is under construction/i)).toBeInTheDocument()
  })

  it('displays description text', () => {
    render(<ProfilePage />)
    
    expect(screen.getByText(/your profile page will display/i)).toBeInTheDocument()
  })
})

