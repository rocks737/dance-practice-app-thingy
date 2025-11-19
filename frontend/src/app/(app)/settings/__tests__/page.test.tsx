import { screen } from '@testing-library/react'
import { render } from '@/test/test-utils'
import SettingsPage from '@/app/(app)/settings/page'

describe('SettingsPage', () => {
  it('renders the settings page heading', () => {
    render(<SettingsPage />)
    
    expect(screen.getByRole('heading', { name: /^settings$/i, level: 1 })).toBeInTheDocument()
  })

  it('renders the appearance section', () => {
    render(<SettingsPage />)
    
    expect(screen.getByRole('heading', { name: /appearance/i, level: 2 })).toBeInTheDocument()
  })

  it('renders theme options', () => {
    render(<SettingsPage />)
    
    expect(screen.getByText('Light')).toBeInTheDocument()
    expect(screen.getByText('Dark')).toBeInTheDocument()
    expect(screen.getByText('System')).toBeInTheDocument()
  })

  it('renders account settings section', () => {
    render(<SettingsPage />)
    
    expect(screen.getByRole('heading', { name: /account settings/i, level: 2 })).toBeInTheDocument()
  })

  it('displays construction message for additional settings', () => {
    render(<SettingsPage />)
    
    expect(screen.getByText(/additional settings options coming soon/i)).toBeInTheDocument()
  })
})

