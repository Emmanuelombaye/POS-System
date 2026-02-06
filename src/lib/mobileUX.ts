/**
 * Mobile-First UX Utilities
 * 
 * Ensures all UI elements follow mobile-first design principles:
 * - Big buttons (44x44px minimum touch target)
 * - One-hand navigation
 * - Minimal typing
 * - Fast performance on phones
 * - Accessible spacing
 */

export const MOBILE_UX_CONSTANTS = {
  // Touch target size (iOS: 44x44, Android: 48x48)
  MIN_TOUCH_TARGET: 44, // pixels
  RECOMMENDED_TOUCH_TARGET: 48,

  // Spacing (in pixels)
  SPACING_XS: 4,
  SPACING_SM: 8,
  SPACING_MD: 12,
  SPACING_LG: 16,
  SPACING_XL: 24,
  SPACING_2XL: 32,

  // Font sizes
  FONT_XS: 12,
  FONT_SM: 14,
  FONT_MD: 16,
  FONT_LG: 18,
  FONT_XL: 20,
  FONT_2XL: 24,

  // Button sizes
  BUTTON_SM: 36,
  BUTTON_MD: 44,
  BUTTON_LG: 52,
  BUTTON_XL: 60,

  // Safe area (notch, home indicator)
  SAFE_AREA_TOP: 'max(0px, env(safe-area-inset-top))',
  SAFE_AREA_BOTTOM: 'max(0px, env(safe-area-inset-bottom))',
  SAFE_AREA_LEFT: 'max(0px, env(safe-area-inset-left))',
  SAFE_AREA_RIGHT: 'max(0px, env(safe-area-inset-right))',

  // Breakpoints
  MOBILE: 320,
  TABLET_SM: 480,
  TABLET_MD: 768,
  DESKTOP: 1024,
};

export const MOBILE_UX_STYLES = `
/* ============================================
   Mobile-First Base Styles
   ============================================ */

* {
  /* Prevent zoom on input focus (iOS) */
  font-size: 16px !important;
}

html {
  /* Safe area support */
  viewport-fit: cover;
}

body {
  /* Prevent bounce scroll on iOS */
  overscroll-behavior: none;
  
  /* Optimal tap highlight */
  -webkit-tap-highlight-color: transparent;
  -webkit-touch-callout: none;
  
  /* Safe area padding */
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
}

/* ============================================
   Button Mobile Optimization
   ============================================ */

button, [role="button"], input[type="button"], input[type="submit"] {
  /* Minimum 44x44 touch target */
  min-height: 44px;
  min-width: 44px;
  padding: 12px 16px;
  
  /* Tap optimization */
  -webkit-user-select: none;
  user-select: none;
  
  /* Better mobile feel */
  transition: all 0.2s ease;
  
  /* Font size prevents iOS zoom */
  font-size: 16px;
  
  /* Active state for mobile */
  active: {
    transform: scale(0.98);
  }
}

/* ============================================
   Input Mobile Optimization
   ============================================ */

input, textarea, select {
  /* Font size 16px prevents iOS auto-zoom on focus */
  font-size: 16px;
  
  /* Better mobile keyboard */
  padding: 12px;
  min-height: 44px;
  
  /* Remove default iOS styling */
  -webkit-appearance: none;
  appearance: none;
  
  border-radius: 8px;
  border: 1px solid #ddd;
}

textarea {
  resize: vertical;
  min-height: 88px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

/* ============================================
   Typography Mobile Optimization
   ============================================ */

body {
  font-size: 16px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Prevent font scaling */
html {
  -webkit-text-size-adjust: 100%;
  -moz-text-size-adjust: 100%;
  text-size-adjust: 100%;
}

/* ============================================
   Scroll & Overflow Optimization
   ============================================ */

/* Smooth scrolling */
html {
  scroll-behavior: smooth;
}

/* Better momentum scrolling on iOS */
.scrollable {
  -webkit-overflow-scrolling: touch;
  overflow-y: auto;
}

/* ============================================
   Responsive Grid Mobile
   ============================================ */

/* Mobile: 1 column */
@media (max-width: 480px) {
  .grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .container {
    padding: 16px;
  }
}

/* Tablet: 2 columns */
@media (min-width: 481px) and (max-width: 768px) {
  .grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }
  
  .container {
    padding: 24px;
  }
}

/* Desktop: 3+ columns */
@media (min-width: 769px) {
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 24px;
  }
  
  .container {
    padding: 32px;
  }
}

/* ============================================
   One-Hand Navigation
   ============================================ */

/* Navigation controls at bottom (easier thumb reach) */
nav, footer, .controls {
  position: sticky;
  bottom: 0;
  background: white;
  box-shadow: 0 -2px 8px rgba(0,0,0,0.1);
  padding-bottom: env(safe-area-inset-bottom);
  z-index: 100;
}

/* ============================================
   Minimal Typing Design
   ============================================ */

/* Clear input indication */
input::placeholder {
  color: #999;
  font-size: 14px;
}

/* Quick action buttons */
.quick-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin: 12px 0;
}

.quick-action-btn {
  flex: 1;
  min-width: 100px;
  padding: 12px;
  font-size: 13px;
  border-radius: 6px;
}

/* ============================================
   Performance: Reduce Repaints
   ============================================ */

/* GPU acceleration */
.will-change-transform {
  will-change: transform;
  transform: translateZ(0);
}

/* Contain layout */
.cashier-item, .product-card {
  contain: layout style paint;
}

/* ============================================
   Accessibility & Spacing
   ============================================ */

/* Adequate spacing for fingers */
button + button {
  margin-left: 8px;
}

/* Clickable area clearly defined */
a {
  padding: 4px 8px;
  border-radius: 4px;
}

/* ============================================
   Mobile Keyboard Optimization
   ============================================ */

/* Number input on mobile */
input[type="number"],
input[type="tel"] {
  /* Show numeric keyboard */
  -webkit-appearance: textfield;
}

input[type="number"]::-webkit-outer-spin-button,
input[type="number"]::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

/* ============================================
   Landscape Mode Optimization
   ============================================ */

@media (orientation: landscape) and (max-height: 500px) {
  body {
    font-size: 14px;
  }
  
  button {
    padding: 8px 12px;
    min-height: 40px;
  }
  
  nav, .controls {
    position: fixed;
    bottom: 0;
    width: 100%;
  }
}
`;

export const MOBILE_UX_TAILWIND = `
/* Mobile-First Tailwind Utilities */

@layer components {
  /* Touch target button */
  .btn-touch {
    @apply min-h-[44px] min-w-[44px] px-4 py-3 rounded-lg transition-all active:scale-95;
  }

  .btn-touch-sm {
    @apply min-h-[40px] min-w-[40px] px-3 py-2;
  }

  .btn-touch-lg {
    @apply min-h-[52px] min-w-[52px] px-6 py-4;
  }

  /* Safe area support */
  .safe-area-inset {
    padding-left: env(safe-area-inset-left);
    padding-right: env(safe-area-inset-right);
    padding-top: env(safe-area-inset-top);
    padding-bottom: env(safe-area-inset-bottom);
  }

  /* Mobile input */
  .input-mobile {
    @apply text-base px-3 py-3 rounded-lg border border-gray-300 w-full;
    font-size: 16px; /* Prevent iOS zoom */
  }

  /* One-hand navigation */
  .nav-bottom {
    @apply sticky bottom-0 bg-white shadow-lg;
    padding-bottom: env(safe-area-inset-bottom);
  }

  /* Quick actions */
  .quick-actions {
    @apply flex gap-2 flex-wrap;
  }

  .quick-action {
    @apply flex-1 min-w-[100px] px-3 py-2 rounded-lg text-sm font-medium;
  }

  /* Mobile container */
  .container-mobile {
    @apply px-4 py-3;
  }

  @screen sm {
    .container-mobile {
      @apply px-6 py-4;
    }
  }

  /* Scroll optimization */
  .scroll-smooth-mobile {
    -webkit-overflow-scrolling: touch;
    scroll-behavior: smooth;
  }
}
`;

/**
 * Mobile-First Responsive Component Hook
 */
export function useMobileOptimization() {
  return {
    constants: MOBILE_UX_CONSTANTS,
    isTablet: () => typeof window !== "undefined" && window.innerWidth >= 768,
    isMobile: () => typeof window !== "undefined" && window.innerWidth < 768,
    isLandscape: () =>
      typeof window !== "undefined" && window.innerHeight < window.innerWidth,
    buttonSize: () => {
      if (typeof window === "undefined") return MOBILE_UX_CONSTANTS.BUTTON_MD;
      return window.innerWidth < 480
        ? MOBILE_UX_CONSTANTS.BUTTON_MD
        : MOBILE_UX_CONSTANTS.BUTTON_LG;
    },
  };
}
