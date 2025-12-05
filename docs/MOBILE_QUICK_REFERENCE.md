# Mobile Quick Reference Guide

## 🚀 Quick Start

### View on Mobile
1. Start dev server: `cd frontend && yarn dev`
2. Open on mobile device: `http://your-ip:3000`
3. Or use browser dev tools (F12) → Toggle device toolbar

### Test Responsive Design
```bash
# Chrome DevTools shortcuts
Ctrl/Cmd + Shift + M  - Toggle device toolbar
Ctrl/Cmd + Shift + I  - Open DevTools
```

**Test Dimensions:**
- **iPhone SE:** 375 × 667 (minimum supported)
- **iPhone 12/13:** 390 × 844
- **iPhone 14 Pro Max:** 430 × 932
- **iPad:** 768 × 1024

---

## 📱 Key Mobile Features

### Navigation

#### Desktop (≥1024px)
```
┌─────────┬──────────────────┐
│ Sidebar │   Content        │
│         │                  │
│ Logo    │  Page Content    │
│ Nav     │                  │
│ User    │                  │
│         │                  │
└─────────┴──────────────────┘
```

#### Mobile (<1024px)
```
┌──────────────────────────┐
│ Logo           ☰  🌓     │ ← Fixed Header
├──────────────────────────┤
│                          │
│   Page Content           │
│                          │
│                          │
│                          │
└──────────────────────────┘
       ↓ Tap ☰
┌──────────────────────────┐
│ [Drawer Slides In]       │
│ ┌──────────────┐         │
│ │ Logo         │         │
│ │ User Info    │         │
│ │ Navigation   │         │
│ │ Settings     │         │
│ └──────────────┘         │
└──────────────────────────┘
```

### Responsive Breakpoints

| Screen Size | Prefix | Width | Use Case |
|------------|--------|-------|----------|
| Mobile | (default) | < 640px | Phones portrait |
| Small | `sm:` | ≥ 640px | Phones landscape, small tablets |
| Medium | `md:` | ≥ 768px | Tablets |
| Large | `lg:` | ≥ 1024px | Laptops, desktops |
| Extra Large | `xl:` | ≥ 1280px | Large desktops |

---

## 🎨 Mobile Design Patterns

### Typography Scale

```css
/* Headings */
Page Title:     text-2xl sm:text-3xl        (24px → 30px)
Section Title:  text-xl sm:text-2xl         (20px → 24px)
Card Title:     text-lg sm:text-xl          (18px → 20px)

/* Body Text */
Body:           text-sm sm:text-base        (14px → 16px)
Small:          text-xs sm:text-sm          (12px → 14px)
Caption:        text-xs                     (12px)
```

### Spacing Scale

```css
/* Padding */
Card:           p-3 sm:p-5 lg:p-8
Page:           p-4 sm:p-6 lg:p-8
Section:        space-y-4 sm:space-y-6

/* Gaps */
Small:          gap-1 sm:gap-2
Medium:         gap-2 sm:gap-4
Large:          gap-3 sm:gap-6
```

### Icon Sizes

```css
Small:          w-4 h-4 sm:w-5 sm:h-5
Medium:         w-5 h-5 sm:w-6 sm:w-6
Large:          w-6 h-6 sm:w-8 sm:h-8
```

---

## 📋 Component Examples

### Responsive Header

```tsx
<div className="flex items-center gap-2 sm:gap-3">
  <div className="rounded-full bg-primary/10 p-2 sm:p-3 text-primary">
    <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
  </div>
  <div>
    <h1 className="text-2xl sm:text-3xl font-bold">Title</h1>
    <p className="text-xs sm:text-sm text-muted-foreground">Description</p>
  </div>
</div>
```

### Responsive Grid

```tsx
{/* Single column on mobile, 2 on tablet, 4 on desktop */}
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  <Card />
  <Card />
  <Card />
  <Card />
</div>
```

### Responsive Buttons

```tsx
{/* Hide text on mobile, show on desktop */}
<Button>
  <Plus className="mr-2 h-4 w-4" />
  <span className="hidden sm:inline">Create New</span>
  <span className="sm:hidden">+</span>
</Button>
```

### Responsive Form

```tsx
<form className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
  <Input placeholder="Search..." className="sm:col-span-2" />
  <Select>...</Select>
  <Button type="submit">Apply</Button>
</form>
```

---

## ✅ Mobile Checklist

### For Every New Page/Component

- [ ] Test on mobile viewport (375px minimum)
- [ ] Use responsive utility classes
- [ ] Ensure touch targets ≥ 44px height
- [ ] Check text is readable (min 12px)
- [ ] Verify spacing works on small screens
- [ ] Test navigation from the page
- [ ] Check dark mode
- [ ] Verify forms are usable
- [ ] Test dialogs/modals fit screen
- [ ] Check scrolling behavior

### Common Patterns

```tsx
// ✅ Good - Responsive
<div className="p-4 sm:p-6 lg:p-8">
  <h1 className="text-2xl sm:text-3xl">Title</h1>
</div>

// ❌ Bad - Fixed desktop size
<div className="p-8">
  <h1 className="text-3xl">Title</h1>
</div>
```

---

## 🔧 Troubleshooting

### Content Overflows on Mobile
```tsx
// Add responsive padding/margin
className="px-4 sm:px-6 lg:px-8"

// Make containers fluid
className="w-full max-w-4xl"

// Enable text wrapping
className="break-words"
```

### Touch Targets Too Small
```tsx
// Ensure minimum touch size
className="min-h-[44px] min-w-[44px]"

// Add padding to increase hit area
className="p-3"
```

### Text Unreadable on Mobile
```tsx
// Use responsive text sizes
className="text-xs sm:text-sm"

// Ensure proper contrast
className="text-gray-900 dark:text-gray-100"
```

### Layout Breaks on Mobile
```tsx
// Use flex-col on mobile, flex-row on desktop
className="flex flex-col sm:flex-row"

// Stack grid items on mobile
className="grid grid-cols-1 sm:grid-cols-2"
```

---

## 🎯 Testing Workflow

### 1. Desktop First (Development)
```bash
yarn dev
# Open http://localhost:3000
# Develop feature
```

### 2. Mobile Testing (Before Commit)
```bash
# In browser DevTools
1. Toggle device toolbar (Ctrl/Cmd + Shift + M)
2. Select "iPhone SE" (375px)
3. Test all interactions
4. Check portrait orientation
5. Verify scrolling
6. Test forms and buttons
```

### 3. Real Device Testing
```bash
# Find your local IP
# Mac/Linux: ifconfig | grep inet
# Windows: ipconfig

# Access from mobile device
http://192.168.x.x:3000
```

---

## 📱 Mobile App Wrapping

### Option 1: Capacitor (Recommended)

```bash
# Install Capacitor
cd frontend
npm install @capacitor/core @capacitor/cli
npm install @capacitor/ios @capacitor/android

# Initialize
npx cap init

# Build and sync
npm run build
npx cap add ios
npx cap add android
npx cap sync

# Open in Xcode/Android Studio
npx cap open ios
npx cap open android
```

### Option 2: React Native WebView

```tsx
import { WebView } from 'react-native-webview';

<WebView
  source={{ uri: 'https://partnerly.dance' }}
  style={{ flex: 1 }}
/>
```

### Option 3: PWA

```bash
# Add to frontend/public/manifest.json
{
  "name": "Partnerly Dance",
  "short_name": "Partnerly",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#000000",
  "background_color": "#ffffff"
}

# Add to frontend/src/app/layout.tsx
<link rel="manifest" href="/manifest.json" />
```

---

## 🎨 Dark Mode on Mobile

All mobile optimizations maintain dark mode support:

```tsx
// Text colors
className="text-gray-900 dark:text-gray-100"

// Background colors
className="bg-white dark:bg-gray-800"

// Borders
className="border-gray-200 dark:border-gray-700"

// Theme toggle available in mobile header
```

---

## 📊 Performance Tips

### Mobile-Specific Optimizations

```tsx
// Lazy load images
import Image from 'next/image'

<Image
  src="/image.jpg"
  width={300}
  height={200}
  loading="lazy"
/>

// Code split heavy components
const HeavyComponent = dynamic(() => import('./Heavy'), {
  loading: () => <Spinner />
})

// Debounce search inputs
import { useDebouncedValue } from '@/lib/hooks'
const debouncedSearch = useDebouncedValue(search, 300)
```

---

## 🔗 Useful Links

- [Tailwind Responsive Design](https://tailwindcss.com/docs/responsive-design)
- [Chrome DevTools Device Mode](https://developer.chrome.com/docs/devtools/device-mode/)
- [iOS Safe Areas](https://webkit.org/blog/7929/designing-websites-for-iphone-x/)
- [Touch Target Sizes](https://www.w3.org/WAI/WCAG21/Understanding/target-size.html)

---

## ✨ Pro Tips

### 1. Use DevTools Device Toolbar
- Test multiple screen sizes quickly
- Simulate network throttling
- Test touch interactions with mouse

### 2. Test in Real Browsers
- Safari on iOS (WebKit)
- Chrome on Android
- Different from desktop Chrome!

### 3. Consider Thumb Zones
- Place important actions within easy reach
- Bottom of screen is easier on phones
- Consider one-handed use

### 4. Progressive Enhancement
- Start with mobile (smallest screen)
- Enhance for larger screens
- Mobile-first CSS approach

### 5. Touch vs Mouse
- Touch has no hover state
- Touch targets need more space
- Use active states for feedback

---

**Quick Commands:**

```bash
# Dev with mobile
yarn dev

# Lint
yarn lint

# Build
yarn build

# Check mobile viewport
# Browser: Ctrl/Cmd + Shift + M
```

**Status:** ✅ All pages mobile-optimized and ready for production

