import { screen, fireEvent } from '@testing-library/react'
import { render } from '@/test/test-utils'
import { ThemeSettings } from '@/components/theme-settings'
import { useTheme } from 'next-themes'

jest.unmock('next-themes')

jest.mock('next-themes', () => ({
  useTheme: jest.fn(() => ({
    theme: 'light',
    setTheme: jest.fn(),
  })),
}))

describe('ThemeSettings', () => {
  it('renders the appearance heading', () => {
    render(<ThemeSettings />)
    
    expect(screen.getByText('Appearance')).toBeInTheDocument()
  })

  it('renders all three theme options', () => {
    render(<ThemeSettings />)
    
    expect(screen.getByText('Light')).toBeInTheDocument()
    expect(screen.getByText('Dark')).toBeInTheDocument()
    expect(screen.getByText('System')).toBeInTheDocument()
  })

  it('shows light theme as selected', () => {
    ;(useTheme as jest.Mock).mockReturnValue({
      theme: 'light',
      setTheme: jest.fn(),
    })

    render(<ThemeSettings />)
    
    const radios = screen.getAllByRole('radio')
    const lightRadio = radios.find(radio => (radio as HTMLInputElement).value === 'light')
    expect(lightRadio).toBeChecked()
  })

  it('shows dark theme as selected', () => {
    ;(useTheme as jest.Mock).mockReturnValue({
      theme: 'dark',
      setTheme: jest.fn(),
    })

    render(<ThemeSettings />)
    
    const radios = screen.getAllByRole('radio')
    const darkRadio = radios.find(radio => (radio as HTMLInputElement).value === 'dark')
    expect(darkRadio).toBeChecked()
  })

  it('shows system theme as selected', () => {
    ;(useTheme as jest.Mock).mockReturnValue({
      theme: 'system',
      setTheme: jest.fn(),
    })

    render(<ThemeSettings />)
    
    const radios = screen.getAllByRole('radio')
    const systemRadio = radios.find(radio => (radio as HTMLInputElement).value === 'system')
    expect(systemRadio).toBeChecked()
  })

  it('calls setTheme when selecting dark theme', () => {
    const setTheme = jest.fn()
    ;(useTheme as jest.Mock).mockReturnValue({
      theme: 'light',
      setTheme,
    })

    render(<ThemeSettings />)
    
    const darkRadio = screen.getByRole('radio', { name: /dark/i })
    fireEvent.click(darkRadio)
    
    expect(setTheme).toHaveBeenCalledWith('dark')
  })

  it('displays theme descriptions', () => {
    render(<ThemeSettings />)
    
    expect(screen.getByText('Clean and bright interface')).toBeInTheDocument()
    expect(screen.getByText('Easy on the eyes in low light')).toBeInTheDocument()
    expect(screen.getByText('Matches your device theme')).toBeInTheDocument()
  })
})

