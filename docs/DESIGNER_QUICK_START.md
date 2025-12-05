# Designer Quick Start Guide

---

## 📋 Design Brief: Partnerly.dance

### Project Overview

**Partnerly.dance** is a dance practice partner matching platform that connects dancers to find compatible practice partners based on skill level, availability, location, and dance preferences.

**Domain:** `partnerly.dance`

### Mission Statement

To make finding the perfect dance practice partner effortless by matching dancers based on compatibility, availability, and shared goals—helping dancers improve faster and enjoy practice more.

### Target Audience

- **Primary:** Social dancers (West Coast Swing, Salsa, Ballroom, etc.)
- **Demographics:** Ages 25-55, active in the dance community
- **Skill Levels:** All levels from beginner to professional
- **User Personas:**
  - Competitive dancers seeking high-level practice partners
  - Social dancers wanting to improve specific skills
  - Instructors looking for demo partners
  - Newcomers finding their first practice buddy

### Brand Personality

- **Friendly & Approachable** - Welcoming to all skill levels
- **Professional** - Trusted for serious practice matching
- **Energetic** - Reflects the passion of dance
- **Connected** - Emphasis on community and partnership
- **Trustworthy** - Safe space for finding partners

### Key Values

1. **Compatibility** - Smart matching based on goals and availability
2. **Community** - Building connections in the dance world
3. **Growth** - Supporting dancers in their improvement journey
4. **Flexibility** - Accommodating various schedules and preferences
5. **Respect** - Safe, professional practice environment

### Design Goals

- Create a welcoming, professional platform
- Balance playfulness with functionality
- Ensure accessibility and ease of use
- Reflect the energy and movement of dance
- Build trust through clear, clean design

---

## 🎨 Design Proposal Template

Use this template to pitch your design vision for Partnerly.dance.

### Design Proposal for Partnerly.dance

**Designer Name:** [Your Name]  
**Date:** [Date]  
**Proposal Version:** [v1.0]

---

### 1. Brand Vision

**Overall Design Direction:**
[Describe your vision for the brand in 2-3 paragraphs. What feeling should users get when they use the platform? How does your design reflect the mission?]

**Key Design Principles:**
- [Principle 1]
- [Principle 2]
- [Principle 3]

**Mood/Inspiration:**
[Describe the mood you're creating - e.g., "Modern and energetic with a focus on connection"]

---

### 2. Logo Concept

**Logo Design Philosophy:**
[Explain the thinking behind your logo design]

**Logo Variations:**
- Primary logo (for light backgrounds)
- Inverted logo (for dark backgrounds)
- Icon/Symbol only (for small spaces)
- Wordmark (text-only version)

**Mockups/Sketches:**
[Include images, links to Figma, or descriptions of your logo concepts]

**Typography:**
- Logo Font: [Font name and reason for choice]
- Fallback: [Alternative font if primary unavailable]

**Symbol/Icon Meaning:**
[If applicable, explain any symbolism in the logo]

---

### 3. Visual Identity

**Design Style:**
[Choose and describe: Minimalist / Modern / Playful / Professional / etc.]

**Visual Elements:**
- **Shapes:** [Rounded corners, sharp edges, organic shapes, etc.]
- **Imagery Style:** [Photography style, illustrations, icons]
- **Patterns:** [Any recurring patterns or textures]
- **Motion:** [How movement/animation should feel]

**Typography System:**

Primary Font:
- **Font Family:** [e.g., Inter, Roboto, etc.]
- **Usage:** Headers, buttons, navigation
- **Reasoning:** [Why this font fits the brand]

Secondary Font:
- **Font Family:** [e.g., Merriweather, Georgia, etc.]
- **Usage:** Body text, descriptions
- **Reasoning:** [Why this font complements]

**Font Hierarchy:**
- H1: [Size, weight, usage]
- H2: [Size, weight, usage]
- H3: [Size, weight, usage]
- Body: [Size, weight, line height]
- Small: [Size, weight, usage]

**Spacing & Layout:**
- Grid system: [e.g., 8px base unit]
- Container width: [e.g., 1400px max]
- Padding/margins: [Spacing system]

---

### 4. Color Palette

**Primary Colors:**

Test your colors live on: `http://localhost:3000/designer-preview`

**Light Mode:**
```
Primary: [HSL value]
  Usage: Main buttons, links, key actions
  
Primary Foreground: [HSL value]
  Usage: Text on primary color
  
Secondary: [HSL value]
  Usage: Alternative actions, less prominent buttons
  
Secondary Foreground: [HSL value]
  Usage: Text on secondary color
```

**Dark Mode:**
```
Primary: [HSL value]
  Usage: [Same as light mode]
  
Primary Foreground: [HSL value]
  Usage: [Same as light mode]
  
Secondary: [HSL value]
  Usage: [Same as light mode]
  
Secondary Foreground: [HSL value]
  Usage: [Same as light mode]
```

**Supporting Colors:**

**Light Mode:**
```
Background: [HSL value] - Main page background
Foreground: [HSL value] - Primary text color

Card: [HSL value] - Card backgrounds
Card Foreground: [HSL value] - Text on cards

Muted: [HSL value] - Subtle backgrounds
Muted Foreground: [HSL value] - Secondary text

Accent: [HSL value] - Highlights, hover states
Accent Foreground: [HSL value] - Text on accent

Border: [HSL value] - Dividers, outlines
Input: [HSL value] - Form field borders
Ring: [HSL value] - Focus indicator
```

**Dark Mode:**
```
[Same structure as light mode with dark-optimized values]
```

**Functional Colors:**
```
Destructive: [HSL value] - Errors, delete actions
Destructive Foreground: [HSL value] - Text on destructive

Success: [Optional, if needed]
Warning: [Optional, if needed]
Info: [Optional, if needed]
```

**Color Reasoning:**
[Explain why you chose these colors. How do they reflect the brand? What emotions do they evoke?]

**Accessibility Notes:**
- All color combinations meet WCAG AA standards (4.5:1 contrast ratio)
- Tested in both light and dark modes
- Color is not the only indicator of state/meaning

---

### 5. Component Style Guidance

**Buttons:**
- Shape: [Rounded corners, pill-shaped, etc.]
- Size variants: [How sizes should feel]
- States: [Hover, active, disabled styling philosophy]

**Form Inputs:**
- Style: [Outlined, filled, underlined]
- States: [Focus, error, disabled]
- Labels: [Floating, above, inline]

**Cards:**
- Elevation: [Flat, subtle shadow, prominent shadow]
- Spacing: [Internal padding]
- Borders: [Yes/no, subtle/prominent]

**Navigation:**
- Style: [Top bar, side bar, bottom bar]
- Active states: [How to indicate current page]

**Other Components:**
[Any specific guidance for tables, modals, alerts, etc.]

---

### 6. Preset Theme (for Designer Preview)

Export your theme from `http://localhost:3000/designer-preview`:

**Theme Name:** [Your custom theme name]

**Preset Details:**
```css
/* Copy your exported CSS here */
:root {
  --background: [value];
  --foreground: [value];
  /* ... all color variables */
}

.dark {
  --background: [value];
  --foreground: [value];
  /* ... all color variables */
}
```

**Theme Mood:**
[Describe the feeling: Energetic, Calm, Professional, Playful, etc.]

---

### 7. Mockups/Examples

**Include:**
- Landing page concept
- Dashboard/main app interface
- Mobile responsive views
- Key user flows (signup, finding a partner, etc.)

**Tools:**
- Figma links
- Adobe XD links
- Sketch files
- Screenshots from designer preview page

---

### 8. Implementation Notes

**For Developers:**
[Any specific technical requirements or considerations]

**Responsive Behavior:**
[How design should adapt to mobile, tablet, desktop]

**Animation/Transitions:**
[Any motion design guidance]
- Button hover: [timing, effect]
- Page transitions: [style]
- Loading states: [approach]

---

### 9. Rationale

**Why This Design Works for Partnerly.dance:**

[Explain in detail why your design choices support the brand mission and will appeal to the target audience. Connect your visual decisions to user needs and brand values.]

**Competitive Differentiation:**
[How does this design stand out from other matching/social platforms?]

**User Benefits:**
[How does this design make the user experience better?]

---

### 10. Next Steps

**Phase 1 - Foundation:**
- [ ] Finalize color palette
- [ ] Create logo files (SVG, PNG)
- [ ] Export theme CSS
- [ ] Document typography

**Phase 2 - Components:**
- [ ] Design system documentation
- [ ] Component library in Figma
- [ ] Icon set
- [ ] Illustration style guide

**Phase 3 - Application:**
- [ ] Key page mockups
- [ ] User flow diagrams
- [ ] Interaction prototypes
- [ ] Developer handoff

**Timeline:**
[Estimated timeline for deliverables]

**Questions/Clarifications Needed:**
[Any questions for stakeholders before proceeding]

---

### Submission

**Attachments:**
- [ ] Logo files (multiple formats)
- [ ] Color palette (from designer-preview export)
- [ ] Mockup images/links
- [ ] Typography specimens
- [ ] Design system document (Figma/XD link)

**Contact:**
- Email: [your@email.com]
- Portfolio: [portfolio link]

---

**Thank you for your design proposal! 🎨**

---

## 🎨 Accessing the Designer Preview

**URL:** `http://localhost:3000/designer-preview`

**No login required!** Just open the link and start customizing.

---

## ⚡ Quick Start (5 minutes)

### 1. Open the Page
```
http://localhost:3000/designer-preview
```

### 2. Try a Preset Theme
Click any preset button at the top:
- **Ocean** - Blue/cyan theme
- **Sunset** - Warm orange theme
- **Forest** - Natural green theme
- **Royal** - Purple/violet theme

### 3. Toggle Dark Mode
Click the sun/moon icon in the top right

### 4. Customize Colors
- See the color palette grid
- Each color shows a preview swatch
- Edit the HSL values directly
- Changes apply instantly!

### 5. Export Your Theme
- **Copy CSS** - Copies to clipboard
- **Download** - Saves as CSS file
- Share with developers!

---

## 🎯 What You'll See

### Theme Editor (Top of Page)
- Quick preset buttons
- Full color palette grid with live editing
- Export buttons (Copy/Download)
- Reset button

### Component Showcase (Scrollable)
1. **Buttons** - All variants and sizes
2. **Form Inputs** - Text fields, selects, textareas
3. **Selection Controls** - Checkboxes, switches, radios, sliders
4. **Alerts & Badges** - Status indicators
5. **Cards** - Content containers
6. **Tabs** - Tabbed navigation
7. **Tables** - Data tables
8. **Dialogs & Sheets** - Modal overlays
9. **Menus** - Dropdowns and context menus
10. **Command Palette** - Search interface

---

## 🎨 Color Format Guide

### HSL Format
Colors use: `"hue saturation% lightness%"`

**Examples:**
```
"199 89% 48%"  → Bright blue
"25 95% 53%"   → Orange
"142 71% 45%"  → Green
"271 81% 56%"  → Purple
```

### Quick Adjustments

**Make Lighter:**
```
"199 89% 48%"  → "199 89% 68%"  (increase last number)
```

**Make Darker:**
```
"199 89% 48%"  → "199 89% 28%"  (decrease last number)
```

**Make Less Vibrant:**
```
"199 89% 48%"  → "199 60% 48%"  (decrease middle number)
```

---

## 🎨 Key Color Variables

### Must-Customize Colors

**Primary** - Your brand color
- Used for main buttons, links, highlights
- Most visible color in the UI

**Primary Foreground** - Text on primary color
- Must have good contrast with primary

**Secondary** - Alternative actions
- Used for less important buttons

**Accent** - Highlights and emphasis
- Used for hover states, selected items

### Supporting Colors

**Background** - Page background
**Foreground** - Main text color
**Muted** - Subtle backgrounds and secondary text
**Border** - Element borders

### Status Colors

**Destructive** - Errors, delete actions (usually red)

---

## ✅ Best Practices

### Contrast
- Primary/Primary Foreground must be readable
- Test in both light and dark modes
- Check all text is legible

### Consistency
- Keep hue similar across related colors
- Vary lightness for hierarchy
- Use saturation to control intensity

### Testing
1. Start with a preset
2. Customize primary colors first
3. Test all components
4. Toggle dark mode
5. Check hover/active states
6. Export and share

---

## 🔄 Workflow

### For New Designs

1. Visit `/designer-preview`
2. Start with closest preset theme
3. Customize primary brand color
4. Adjust secondary and accent
5. Fine-tune other colors
6. Test in dark mode
7. Export CSS
8. Share with dev team

### For Refinements

1. Visit `/designer-preview`
2. Copy current theme values from developers
3. Make adjustments
4. Test changes
5. Export and share updates

---

## 💡 Pro Tips

### Use Presets as Starting Points
Don't start from scratch - pick the closest preset and modify

### Focus on Primary First
Primary color affects the most UI elements

### Test Dark Mode Early
Don't wait until the end - toggle frequently

### Export Often
Save versions as you iterate

### Check Accessibility
- Light text needs dark background (and vice versa)
- Focus rings should be visible
- Destructive actions should stand out

---

## 📋 Checklist

Before finalizing a theme:

- [ ] Primary color matches brand
- [ ] Text is readable on all backgrounds
- [ ] Tested in light mode
- [ ] Tested in dark mode
- [ ] Buttons are clearly clickable
- [ ] Forms look professional
- [ ] Errors are clearly visible
- [ ] Disabled states are obvious
- [ ] Exported and saved

---

## 🤝 Designer-Developer Handoff

### What Designers Provide
1. Exported CSS file or values
2. Screenshots of key components
3. Notes on any special considerations

### What Developers Need
- The exported CSS (from Copy or Download button)
- Confirmation that both light/dark modes work
- Any specific accessibility requirements

### Simple Process
1. **Designer**: Customize on `/designer-preview`
2. **Designer**: Click "Download" button
3. **Designer**: Share file with developer
4. **Developer**: Paste into `globals.css`
5. **Everyone**: Review on actual pages
6. **Repeat**: as needed

---

## 🆘 Need Help?

### Colors Not Updating?
- Click "Reset" and try again
- Refresh the browser
- Check HSL format: `"H S% L%"`

### Want to Undo?
- Click "Reset" to restore defaults
- Reload page to discard all changes

### Component Looks Weird?
- Check the specific color variable affecting it
- Test in opposite mode (light/dark)
- Try a preset to see if issue persists

---

## 📚 Resources

**Color Pickers:**
- [HSL Picker](https://hslpicker.com/)
- [Coolors](https://coolors.co/)

**Accessibility:**
- [Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Who Can Use](https://www.whocanuse.com/)

**Inspiration:**
- [Dribbble](https://dribbble.com/)
- [Behance](https://www.behance.net/)

---

**Questions?** Ask your development team!

**Happy designing!** 🎨✨

