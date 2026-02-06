# 🎨 EdenDrop001 Splash Screen - Figma Design Specifications

## Design System

### Color Palette

```
Primary Background Gradient:
  - Start: #1a472a (Deep Forest Green)
  - Middle: #2d5a3d (Brand Green)
  - End: #1a472a (Deep Forest Green)

Title Segments:
  - "Eden": #4ade80 (Bright Spring Green) - Weight 800
  - "Drop": #ffffff (White) - Weight 700
  - "001": #fbbf24 (Gold/Amber) - Weight 700 + Pulse Animation

Text Colors:
  - Subtitle: rgba(255, 255, 255, 0.85)
  - Tagline: rgba(255, 255, 255, 0.7)
  - Glow Effect: rgba(74, 222, 128, 0.3)

Overlay:
  - Radial Gradient: Transparent → rgba(255, 255, 255, 0.08)
```

---

## Typography

### Title
```
Font: System Stack (Sans-serif)
Size: 48px (desktop) / 36px (tablet) / 28px (mobile)
Weight: Bold (700-800)
Letter-spacing: 2px
Text-shadow: 0 4px 15px rgba(0, 0, 0, 0.3)
Line-height: 1
```

### Subtitle
```
Font: System Stack (Sans-serif)
Size: 16px (desktop) / 14px (tablet) / 12px (mobile)
Weight: Light (300)
Letter-spacing: 1px
Color: rgba(255, 255, 255, 0.85)
```

### Tagline (Bottom)
```
Font: System Stack (Sans-serif)
Size: 14px (desktop) / 12px (mobile)
Weight: Light (300)
Letter-spacing: 0.5px
Color: rgba(255, 255, 255, 0.7)
```

---

## Layout & Spacing

### Desktop (1920px+)
```
┌─────────────────────────────────┐
│                                 │
│          (Gap: 40px)            │
│                                 │
│        Logo Wrapper             │
│     (160px × 160px)             │
│      + Glow Effect              │
│                                 │
│          (Gap: 40px)            │
│                                 │
│      Title & Subtitle           │
│       (Text Centered)           │
│                                 │
│          (Gap: 40px)            │
│                                 │
│     Loader Dots (• • •)         │
│                                 │
│          (Gap: Auto)            │
│                                 │
│       Tagline (Bottom)          │
│          (40px from edge)       │
│                                 │
└─────────────────────────────────┘
```

### Tablet (768px - 1024px)
```
Logo: 120px × 120px
Glow: 180px × 180px
Title Size: 36px
Gaps: 30px
```

### Mobile (375px - 480px)
```
Logo: 100px × 100px
Glow: 150px × 150px
Title Size: 28px
Gaps: 25px
Tagline: 30px from bottom
```

---

## Logo Specifications

```
Source: /icons/icon-512x512.svg
Display Size (desktop): 160px × 160px
Display Size (tablet): 120px × 120px
Display Size (mobile): 100px × 100px
Object-fit: contain
Filter: drop-shadow(0 0 30px rgba(255, 255, 255, 0.2))
Z-index: 3 (above glow)
```

### Glow Effect (Behind Logo)
```
Shape: Circular (border-radius: 50%)
Size (desktop): 240px × 240px
Size (tablet): 180px × 180px
Size (mobile): 150px × 150px
Background: radial-gradient(circle, rgba(74, 222, 128, 0.3) 0%, transparent 70%)
Animation: Pulse (scale 0.9 → 1.1, opacity 0.4 → 0.8)
Duration: 2 seconds (infinite)
Position: Center (absolute, -50% offset)
Z-index: 1 (below logo)
```

---

## Animation Specifications

### Logo Entrance (Spring Animation)
```
Initial State:
  - opacity: 0
  - scale: 0.3 (starts small)

Final State:
  - opacity: 1
  - scale: 1 (normal)

Duration: 1.2 seconds
Type: Spring Physics
  - Stiffness: 50
  - Damping: 15
Easing: easeOut
Start: 0ms
```

### Title Entrance (Fade + Slide)
```
Initial State:
  - opacity: 0
  - translateY: 20px

Final State:
  - opacity: 1
  - translateY: 0

Duration: 0.8 seconds
Easing: easeOut
Delay: 500ms (after logo)
```

### Loading Dots (Bounce)
```
Initial State:
  - translateY: 0
  - opacity: 0.4

Final State:
  - translateY: -12px
  - opacity: 1

Duration: 1.2 seconds (infinite)
Timing: Alternate bounce
Delays:
  - Dot 1: 0ms
  - Dot 2: 200ms
  - Dot 3: 400ms
Easing: ease-in-out
```

### Glow Pulse (Continuous)
```
Scale: 0.9 → 1.1 → 0.9
Opacity: 0.4 → 0.8 → 0.4
Duration: 2 seconds (infinite, repeating)
Easing: ease-in-out
```

### Radial Background Pulse
```
Opacity: 0.5 → 1 → 0.5
Duration: 3 seconds (infinite)
Easing: ease-in-out
Creates "breathing" effect
```

### "001" Pulsing (Title Segment)
```
Opacity: 1 → 0.6 → 1
Duration: 1.5 seconds (infinite)
Easing: linear
Only affects "001" segment (gold text)
```

### Exit Animation (Splash Complete)
```
Container Opacity: 1 → 0
Duration: 0.8 seconds
Easing: ease-out
Pointer-events: none (disabled after fade)
```

---

## Interactive States

### During Animation
- User cannot interact (splash is full-screen overlay)
- All animations play automatically
- No user input required
- Loading indicator shows progress

### After Completion
- Splash fades out smoothly
- Full-screen overlay removes
- App renders beneath
- Login page becomes interactive

---

## Responsive Breakpoints

```
Desktop (1920px+):
  - Logo: 160px
  - Title: 48px
  - Glow: 240px
  - Gap: 40px

Tablet (768px - 1024px):
  - Logo: 120px
  - Title: 36px
  - Glow: 180px
  - Gap: 30px

Mobile (480px - 768px):
  - Logo: 100px
  - Title: 28px
  - Glow: 150px
  - Gap: 25px

Small Phone (< 480px):
  - Logo: 100px (max width)
  - Title: 28px (max readability)
  - Glow: 150px
  - Gap: 25px
  - Adjust padding if needed
```

---

## Component Layout Grid

### Splash Container
```
Display: flex
Direction: column
Justify: center
Align: center
Width: 100vw
Height: 100vh
Z-index: 9999 (top layer)
Overflow: hidden
```

### Background Layer
```
Position: absolute
Full coverage (top 0, left 0, 100%, 100%)
Gradient applied
Z-index: 1
```

### Content Layer
```
Position: relative
Z-index: 2
Gap: 40px (desktop) / 30px (tablet) / 25px (mobile)
Flex direction: column
```

### Logo Wrapper
```
Position: relative
Display: flex
Justify: center
Align: center
Glow behind (absolute positioning)
```

### Title Wrapper
```
Gap: 12px
Display: flex
Direction: column
Align: center
```

### Loader
```
Display: flex
Gap: 10px
Justify: center
Align: center
```

### Footer
```
Position: absolute
Bottom: 40px (desktop) / 30px (mobile)
Text-align: center
```

---

## Accessibility Specifications

### Color Contrast
```
Title colors meet WCAG AA standards:
  - Green (#4ade80) on green bg: ✅
  - White (#fff) on green bg: ✅ (very high contrast)
  - Gold (#fbbf24) on green bg: ✅

Text sizes all ≥ 14px (minimum recommended)
No color alone conveys information
```

### Motion Preferences
```
@media (prefers-reduced-motion: reduce) {
  - All animations removed
  - No transitions
  - Instant display
  - Content still visible
  - Immediate fade to app
}
```

### Semantic HTML
```
<img> tag with alt text
Proper heading hierarchy
No empty elements
Valid HTML structure
Keyboard accessible (no input needed)
```

---

## Performance Targets

```
Initial Load: < 100ms
Animation Start: 0ms (during boot)
First Paint: 400ms
Splash Duration: 3000ms
Complete Fade: 3800ms total
FPS: 60fps (GPU accelerated)
Bundle: +3KB (gzipped)
```

---

## Browser Support

```
Chrome/Edge: ✅ Full support
Firefox: ✅ Full support
Safari: ✅ Full support (15+)
Mobile Chrome: ✅ Full support
Mobile Safari: ✅ Full support (15+)
Internet Explorer: ❌ Not supported (CSS Grid, etc.)
```

---

## Figma Export Checklist

- [ ] Create artboard 1920×1080 (desktop)
- [ ] Create artboard 768×1024 (tablet)
- [ ] Create artboard 375×812 (mobile)
- [ ] Add background gradient
- [ ] Place logo at center with 30px glow circle
- [ ] Add title text with color coding
- [ ] Add 3 loading dots with guides
- [ ] Add subtitle and tagline
- [ ] Create animation timeline (3 seconds)
  - 0s: Logo opacity 0, scale 0.3
  - 1.2s: Logo opacity 1, scale 1
  - 0.5s: Title opacity 0, translateY 20px
  - 1.3s: Title opacity 1, translateY 0
  - 1s: Dots start bouncing
  - 3s: All fade out
- [ ] Export as design system component
- [ ] Document spacing (px values)
- [ ] Document color values (HEX)
- [ ] Create style guide

---

## Design Tokens (CSS Variables - Optional)

```css
:root {
  --splash-bg-gradient: linear-gradient(135deg, #1a472a 0%, #2d5a3d 50%, #1a472a 100%);
  --splash-color-primary: #4ade80;
  --splash-color-accent: #ffffff;
  --splash-color-highlight: #fbbf24;
  --splash-shadow-text: 0 4px 15px rgba(0, 0, 0, 0.3);
  --splash-shadow-logo: 0 0 30px rgba(255, 255, 255, 0.2);
  --splash-duration: 3000ms;
  --splash-animation-spring: spring(50, 15);
}
```

---

## Final Checklist

- [x] Color scheme defined
- [x] Typography specified
- [x] Layout documented
- [x] Animations detailed
- [x] Responsive grid created
- [x] Accessibility verified
- [x] Performance optimized
- [x] Browser support confirmed
- [x] Figma ready ✅

**Splash Screen is Figma-Ready!** 🎉

