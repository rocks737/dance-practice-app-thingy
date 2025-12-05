# Designer Quick Start Guide

---

## 📋 Design Brief: Partnerly.dance (5-min read)

### What It Is
**partnerly.dance** - A platform that matches dancers with compatible practice partners based on skill, availability, and goals.

### Mission
Make finding dance practice partners effortless → help dancers improve faster and enjoy practice more.

### Who Uses It
- Social dancers (West Coast Swing, Salsa, Ballroom, etc.)
- Ages 25-55, all skill levels (beginner to professional)
- Competitive dancers, instructors, and newcomers

### Brand Personality (in 5 words)
**Friendly • Professional • Energetic • Connected • Trustworthy**

### Design Direction
- ✅ Welcoming yet professional
- ✅ Balance energy with clarity
- ✅ Accessible and easy to use
- ✅ Reflect movement and partnership
- ✅ Build trust through clean design

### Core Values to Reflect
1. **Compatibility** - Smart matching
2. **Community** - Connection-focused
3. **Growth** - Support improvement
4. **Flexibility** - Accommodate schedules
5. **Respect** - Safe environment

**That's it! Now jump to the designer preview and start creating.** 👇

---

## 🎨 Design Proposal Template

**Copy this template to pitch your design for partnerly.dance**

---

### Design Proposal

**Designer:** [Your Name] | **Date:** [Date] | **Contact:** [Email]

---

### 1. Design Vision (2-3 sentences)
[What feeling should users get? How does your design reflect partnerly.dance's mission?]

**Key Principles:**
- [Principle 1]
- [Principle 2]
- [Principle 3]

**Mood:** [e.g., "Modern and energetic with a focus on connection"]

---

### 2. Logo

**Concept:** [Brief explanation of your logo thinking]

**Deliverables:**
- [ ] Primary logo (light backgrounds)
- [ ] Inverted logo (dark backgrounds)
- [ ] Icon/symbol only
- [ ] Wordmark

**Font:** [Logo font name and why]

**Link/Attachment:** [Figma/image link]

---

### 3. Typography

**Primary Font:** [Name] - For headers, buttons, navigation  
**Secondary Font:** [Name] - For body text

**Why these fonts?** [Brief reasoning]

---

### 4. Color Palette

**🎨 Test live on:** `http://localhost:3000/designer-preview`

**Theme Name:** [Your theme name, e.g., "Ocean Breeze"]

**Primary Color:** `[HSL value]` - Main buttons, links  
**Secondary Color:** `[HSL value]` - Alternative actions  
**Accent Color:** `[HSL value]` - Highlights

**Why these colors?** [1-2 sentences on color choices]

**Export from designer-preview:**
```css
/* Paste your exported CSS here or attach as file */
```

**Accessibility:** ✅ WCAG AA compliant | Tested light/dark modes

---

### 5. Visual Style

**Design Style:** [Minimalist / Modern / Playful / Professional / etc.]

**Key Elements:**
- Shapes: [Rounded / Sharp / Organic]
- Motion: [How animations should feel]
- Imagery: [Photo style / Illustrations / Icons]

---

### 6. Mockups

**Attached/Linked:**
- [ ] Landing page
- [ ] Main dashboard
- [ ] Mobile views
- [ ] Key user flows

**Figma/XD Link:** [Link here]

---

### 7. Why This Works

[2-3 sentences: Why your design supports the brand mission and appeals to dancers]

**Stands out because:** [How it's different from competitors]

---

### 8. Deliverables & Timeline

**Phase 1 - Foundation** (Week 1-2)
- [ ] Logo files (SVG, PNG)
- [ ] Color palette export
- [ ] Typography guide

**Phase 2 - System** (Week 3-4)
- [ ] Component library
- [ ] Design system doc
- [ ] Page mockups

**Questions?** [Any clarifications needed]

---

### Submission Checklist
- [ ] Logo files attached
- [ ] Theme CSS exported from designer-preview
- [ ] Mockup links included
- [ ] Contact info provided

---

**Ready to submit! 🎨**

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

