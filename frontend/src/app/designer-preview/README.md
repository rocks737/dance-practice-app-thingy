# Designer Preview Page

## 🎨 Purpose

This page is specifically designed for designers to preview and customize the entire component library without needing authentication. It provides a comprehensive view of all UI components with real-time theme editing capabilities.

## 🚀 Quick Start

### Access the Page

Visit: `http://localhost:3000/designer-preview` (no login required!)

### Features

- **Live Theme Editor**: Modify colors in real-time and see changes instantly
- **Preset Themes**: Quick-switch between curated color palettes (Default, Ocean, Sunset, Forest, Royal)
- **Dark/Light Mode Toggle**: Test components in both themes
- **Export Options**: 
  - Copy CSS to clipboard
  - Download theme as CSS file
- **Complete Component Library**: All UI components displayed in one place

## 🎨 Theme Customization

### Color Format

Colors use HSL format: `"hue saturation% lightness%"`

Example: `"199 89% 48%"` = `hsl(199, 89%, 48%)`

### Color Variables

The theme system uses these semantic color variables:

#### Base Colors
- **Background**: Main page background
- **Foreground**: Main text color

#### Component Colors
- **Primary**: Main brand color (buttons, links, etc.)
- **Secondary**: Alternative actions
- **Muted**: Subtle backgrounds and text
- **Accent**: Highlighted elements
- **Destructive**: Error states and delete actions

#### Functional Colors
- **Card**: Card backgrounds
- **Popover**: Dropdown/popup backgrounds
- **Border**: Element borders
- **Input**: Form input borders
- **Ring**: Focus ring color

Each color has a corresponding `*Foreground` variant for text/icons on that background.

### Quick Preset Themes

#### Default
Classic neutral theme with dark blue primary

#### Ocean
Cyan/blue theme with bright accents
- Primary: `hsl(199, 89%, 48%)`

#### Sunset
Warm orange theme
- Primary: `hsl(25, 95%, 53%)`

#### Forest
Green nature theme
- Primary: `hsl(142, 71%, 45%)`

#### Royal
Purple/violet theme
- Primary: `hsl(271, 81%, 56%)`

## 📋 Components Showcased

### Form Components
- ✅ Buttons (all variants & sizes)
- ✅ Text Inputs
- ✅ Textarea
- ✅ Select Dropdown
- ✅ Checkboxes
- ✅ Radio Buttons
- ✅ Switches
- ✅ Sliders

### Display Components
- ✅ Cards
- ✅ Badges
- ✅ Alerts
- ✅ Tables
- ✅ Tabs
- ✅ Separators

### Overlay Components
- ✅ Dialogs
- ✅ Sheets (Side Panels)
- ✅ Popovers
- ✅ Dropdown Menus
- ✅ Context Menus

### Special Components
- ✅ Command Palette
- ✅ Theme Toggle

## 🔧 Technical Details

### Architecture

The theme system is built on:
- **shadcn/ui**: Component library
- **Tailwind CSS**: Utility-first CSS framework
- **CSS Variables**: Dynamic theming via HSL color variables
- **next-themes**: Dark/light mode management

### File Structure

```
frontend/src/
├── lib/design/
│   └── theme-config.ts          # Centralized theme configuration
├── app/designer-preview/
│   ├── page.tsx                 # Main preview page
│   └── README.md                # This file
└── app/globals.css              # CSS variable definitions
```

### How It Works

1. **theme-config.ts** defines all color palettes and provides utilities
2. **page.tsx** renders all components and provides live editing UI
3. CSS variables are updated in real-time via `applyTheme()`
4. All components automatically reflect changes via Tailwind's `hsl(var(--color))` syntax

## 💾 Exporting Themes

### Copy to Clipboard

1. Customize colors in the theme editor
2. Click "Copy CSS"
3. Paste into `frontend/src/app/globals.css`

### Download as File

1. Customize colors
2. Click "Download"
3. Replace color variables in `globals.css`

## 🎯 Workflow for Designers

### Initial Exploration

1. Visit `/designer-preview`
2. Toggle between light/dark modes
3. Try preset themes to see different styles
4. Take note of components you want to customize

### Customization

1. Choose a preset theme as starting point (or use default)
2. Modify individual color values in HSL format
3. See changes reflected immediately
4. Test in both light and dark modes

### Iteration

1. Adjust primary colors first (these affect most UI elements)
2. Fine-tune accent and secondary colors
3. Adjust muted colors for subtlety
4. Test all component states (hover, active, disabled)

### Export

1. Once satisfied, click "Copy CSS" or "Download"
2. Share with developers
3. Developers paste into `globals.css`

## 📝 Tips for Designers

### Color Harmony

- **Primary** should be your brand color
- **Primary Foreground** should have good contrast with Primary
- **Secondary** should complement Primary
- **Muted** should be subtle (low saturation)
- **Destructive** should clearly indicate danger (typically red)

### Accessibility

- Maintain **4.5:1 contrast ratio** for normal text
- Maintain **3:1 contrast ratio** for large text
- Test with dark mode enabled
- Check focus rings are visible

### HSL Benefits

HSL format makes it easy to:
- **Adjust lightness** without changing hue
- **Create variations** of same color
- **Maintain consistency** across light/dark themes

Example: Converting from dark to light mode often just means:
- Increase lightness for backgrounds
- Decrease lightness for text

### Preset Customization

Start with a preset and tweak:
```
Ocean preset: hsl(199, 89%, 48%)
Lighter:      hsl(199, 89%, 58%)  ← increase last number
Darker:       hsl(199, 89%, 38%)  ← decrease last number
Less vibrant: hsl(199, 70%, 48%)  ← decrease saturation
```

## 🐛 Troubleshooting

### Colors not updating?

- Refresh the page
- Check HSL format is correct: `"H S% L%"`
- Make sure you're editing the active theme (light/dark)

### Components look broken?

- Click "Reset" to restore defaults
- Check browser console for errors
- Ensure you're using a modern browser

### Can't find a component?

- Scroll through the page - all components are there
- Use Ctrl+F to search for component name

## 🔐 Security Note

This page has **no authentication** by design. It's meant for:
- ✅ Local development
- ✅ Staging environments
- ✅ Designer collaboration

**Do not deploy to production** or protect it with basic auth if needed.

## 📚 Additional Resources

- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Tailwind CSS Colors](https://tailwindcss.com/docs/customizing-colors)
- [HSL Color Picker](https://hslpicker.com/)
- [Contrast Checker](https://webaim.org/resources/contrastchecker/)

## 🤝 Collaboration

### Designer → Developer Handoff

1. Designer customizes theme on `/designer-preview`
2. Designer exports CSS using "Download" button
3. Designer shares file or screenshots with developer
4. Developer updates `globals.css` with new values
5. Changes propagate to entire app automatically

### Feedback Loop

1. Developer implements theme
2. Designer reviews on actual app pages
3. Designer refines on `/designer-preview`
4. Repeat until perfect

## ✨ Future Enhancements

Potential additions:
- [ ] Custom preset saving to browser localStorage
- [ ] Import theme from CSS file
- [ ] Color harmony suggestions
- [ ] Accessibility contrast checker
- [ ] Component state toggles (hover, active, disabled)
- [ ] Export to Figma color palette
- [ ] Animation/transition previews

---

**Happy designing!** 🎨

