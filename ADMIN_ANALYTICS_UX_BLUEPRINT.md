# 📊 Admin Analytics Dashboard - Figma-Ready UX Blueprint

## 🎯 Overview

Complete professional analytics dashboard for butchery POS system with:
- **6 KPI Cards** showing key business metrics
- **3 Interactive Charts** (sales trend, top products, branch comparison)
- **Alerts Panel** for quick issue identification
- **Live Data Tables** for active shifts and low stock
- **Real-time Updates** via Supabase subscriptions
- **Professional Design** with color-coded metrics

---

## 📱 Dashboard Layout (Responsive)

### Desktop (1440px)
```
┌─────────────────────────────────────────────────────────────┐
│  HEADER: Dashboard Title + Date Picker + Refresh Button    │
└─────────────────────────────────────────────────────────────┘

┌─────────┬─────────┬─────────┬─────────┬─────────┬─────────┐
│   KPI   │   KPI   │   KPI   │   KPI   │   KPI   │   KPI   │
│ Sales   │ Profit  │ Active  │ Stock   │ Refunds │ Trans   │
│         │         │ Shifts  │ Value   │         │         │
└─────────┴─────────┴─────────┴─────────┴─────────┴─────────┘

┌──────────────────────────────┬──────────────────────────────┐
│   Sales Trend (Line Chart)   │  Top 5 Products (Bar Chart)  │
└──────────────────────────────┴──────────────────────────────┘

┌──────────────────────────────┬──────────────────────────────┐
│ Branch Comparison (Bar Chart)│     Alerts Panel             │
└──────────────────────────────┴──────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│           Active Shifts Table                               │
├─────────────────────────────────────────────────────────────┤
│ Cashier │ Branch │ Started │ Duration │ Status             │
│ ...     │ ...    │ ...     │ ...      │ ...                │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│           Low Stock Alert Table (if needed)                │
├─────────────────────────────────────────────────────────────┤
│ Product │ Category │ Current │ Threshold │ Action          │
│ ...     │ ...      │ ...     │ ...       │ ...             │
└─────────────────────────────────────────────────────────────┘
```

### Tablet (768px)
```
KPI Cards: 2 columns (stacked)
Charts: 1 column (full width, scrollable)
Tables: Simplified columns, horizontal scroll
```

### Mobile (375px)
```
KPI Cards: 1 column (vertical stack)
Charts: Full width, scrollable
Tables: Essential columns only
Alerts: Prominent at top
```

---

## 🎨 Color Palette & Design System

### Primary Colors (KPI Cards)

| Metric | Color | Hex | Usage |
|--------|-------|-----|-------|
| Sales | Blue | `#3b82f6` | Revenue/income |
| Profit | Green | `#10b981` | Positive metrics |
| Alerts/Refunds | Red | `#ef4444` | Problems/losses |
| Stock Value | Amber | `#f59e0b` | Warnings/attention |
| Active Shifts | Purple | `#8b5cf6` | Operations |
| Neutral | Slate | `#64748b` | Backgrounds |

### Gradient Backgrounds (Cards)
- **Blue**: `from-blue-50 to-blue-100`
- **Green**: `from-green-50 to-green-100`
- **Red**: `from-red-50 to-red-100`
- **Amber**: `from-amber-50 to-amber-100`
- **Purple**: `from-purple-50 to-purple-100`

### Borders
- **Primary Border**: `2px solid` (color-specific)
- **Subtle Border**: `1px solid #e2e8f0`
- **Heavy Border**: `2px solid #0f172a`

### Text Colors
- **Primary**: `#0f172a` (slate-900)
- **Secondary**: `#475569` (slate-700)
- **Tertiary**: `#64748b` (slate-600)
- **Muted**: `#94a3b8` (slate-400)

---

## 🖼️ Component Specifications

### 1. KPI Card Component
**Purpose**: Display single metric with context

**Layout**:
```
┌─────────────────────────────┐
│  Title            [Icon]    │
│  1,234,567                  │
│  +12.5% ↑                   │
│  Subtitle text              │
└─────────────────────────────┘
```

**Properties**:
- **Title**: Bold, 12px, secondary color
- **Value**: Bold, 32px (large), primary color
- **Icon**: 32px, color-matched
- **Trend**: Optional, +/- with arrow
- **Background**: Gradient + 2px border
- **Padding**: 24px (6 * 4px)
- **Border-radius**: 12px

**Hover State**:
- Lift effect (shadow increase)
- Slight scale (1.02x)
- Smooth transition (150ms)

**States**:
- **Normal**: Full opacity
- **Loading**: Skeleton (animated gradient)
- **Error**: Red background, error icon

### 2. Chart Components

#### Line Chart (Sales Trend)
**Purpose**: Show sales over time (7 or 30 days)

**Specifications**:
- **Chart Type**: Line with area fill
- **Line Color**: `#3b82f6`
- **Line Width**: 3px
- **Fill Color**: `#3b82f6` with 10% opacity
- **Dots**: 5px radius, clickable
- **Grid**: Dashed, `#e2e8f0`
- **Axes**: Labels, `#64748b`
- **Tooltip**: Blue border, white background
- **Height**: 300px
- **Aspect Ratio**: Responsive

#### Bar Chart (Top Products)
**Purpose**: Show best-selling products

**Specifications**:
- **Orientation**: Horizontal (easier to read names)
- **Bar Height**: 40px
- **Bar Colors**: Color palette cycle (5 colors)
- **Border-radius**: `[0, 8px, 8px, 0]`
- **Labels**: Product names on left (right-aligned)
- **Values**: Quantity (kg) on hover
- **Grid**: Vertical, subtle
- **Height**: 300px

#### Bar Chart (Branch Comparison)
**Purpose**: Compare sales across branches

**Specifications**:
- **Bars**: Grouped (Cash vs M-Pesa)
- **Colors**: Cash = `#10b981`, M-Pesa = `#3b82f6`
- **Border-radius**: `[8px, 8px, 0, 0]`
- **Legend**: Below chart
- **Height**: 300px
- **Responsive**: Scrollable on mobile

### 3. Alerts Panel

**States**:
- **Critical** (red): Urgent issues
- **Warning** (amber): Attention needed
- **Info** (blue): FYI messages
- **All Clear** (green): No issues

**Layout**:
```
┌─────────────────────────────┐
│ ⚠️ Alerts (3)               │
├─────────────────────────────┤
│ 🔴 CRITICAL TITLE           │
│ Description text...         │
├─────────────────────────────┤
│ 🟡 WARNING TITLE            │
│ Description text...         │
└─────────────────────────────┘
```

**Scrollable**: Max height 256px, scroll-y auto

### 4. Active Shifts Table

**Columns**:
| Desktop | Tablet | Mobile |
|---------|--------|--------|
| Cashier | Cashier | Cashier |
| Branch | Duration | Duration |
| Started | | |
| Duration | | |
| Status | | |

**Features**:
- **Row Hover**: Highlight background
- **Animated Rows**: Staggered entry animation
- **Sortable**: Click headers to sort
- **Responsive**: Horizontal scroll on mobile
- **Row Height**: 56px

### 5. Low Stock Alert Table

**Color**: Red-themed (danger)
- **Header**: `#dc2626` background, white text
- **Rows**: Hover = `#fee2e2` background
- **Critical Items**: Red text

**Columns**:
- Product name
- Category
- Current stock
- Threshold
- Action button (optional)

---

## ⚡ KPI Card Specifications (Detailed)

### KPI #1: Total Sales
- **Icon**: DollarSign
- **Color**: Blue
- **Format**: `KES 1,234,567`
- **Subtitle**: "Today"
- **Trend**: Optional (week-over-week)

### KPI #2: Profit
- **Icon**: TrendingUp
- **Color**: Green
- **Format**: `KES 456,789`
- **Subtitle**: "Estimated"
- **Note**: 35% margin calculation

### KPI #3: Active Shifts
- **Icon**: Clock
- **Color**: Purple
- **Format**: `5` (number)
- **Subtitle**: "Ongoing"
- **Action**: Clickable → Shifts table

### KPI #4: Stock Value
- **Icon**: Package
- **Color**: Amber
- **Format**: `KES 2,345,678`
- **Subtitle**: "Current inventory"
- **Calculation**: Sum(qty × unit_price)

### KPI #5: Refunds/Voids
- **Icon**: AlertTriangle
- **Color**: Red if > 5% of sales, else Amber
- **Format**: `KES 12,345`
- **Subtitle**: "Today's adjustments"
- **Alert**: High refund rate triggers warning

### KPI #6: Transactions
- **Icon**: ShoppingCart
- **Color**: Blue
- **Format**: `23` (count)
- **Subtitle**: "Active cashiers"

---

## 🔄 Real-Time Update Flow

### Update Triggers
1. **Shifts Table**: Every 10s (Supabase realtime)
2. **KPI Cards**: Every 10s when transactions/shifts change
3. **Charts**: Every 10s when sales data changes
4. **Alerts**: Real-time when thresholds crossed
5. **Low Stock**: Every 5s for critical items

### Data Sources
```
┌─────────────────────┐
│   Supabase Tables   │
├─────────────────────┤
│ shifts              │
│ transactions        │
│ shift_stock_entries │
│ products            │
│ sales               │
└─────────────────────┘
        ↓
┌──────────────────────────┐
│ Analytics API Endpoints  │
├──────────────────────────┤
│ /api/admin/analytics/*   │
│ - kpis                   │
│ - sales-trend            │
│ - top-products           │
│ - branch-comparison      │
│ - low-stock              │
│ - active-shifts          │
│ - waste-summary          │
└──────────────────────────┘
        ↓
┌──────────────────────────┐
│ Frontend useAnalytics    │
│ Hook (subscriptions)     │
├──────────────────────────┤
│ Realtime listeners       │
│ 10s polling fallback     │
│ Auto-refetch on change   │
└──────────────────────────┘
        ↓
┌──────────────────────────┐
│ React Component State    │
│ AnimatePresence updates  │
└──────────────────────────┘
```

---

## 📲 Responsive Breakpoints

### Desktop (1440px+)
- **Grid**: 6 columns for KPIs (1 row)
- **Charts**: 2 columns (3 rows)
- **Navigation**: Horizontal menu
- **Padding**: 40px

### Tablet (768px - 1023px)
- **Grid**: 2 columns for KPIs (3 rows)
- **Charts**: 1 column (full width)
- **Navigation**: Hamburger menu
- **Padding**: 24px

### Mobile (< 768px)
- **Grid**: 1 column (vertical stack)
- **Charts**: Full width, scrollable
- **Tables**: Essential columns, horizontal scroll
- **Navigation**: Hamburger menu
- **Padding**: 16px

---

## 🎯 Interaction Patterns

### 1. Date Picker
- **Default**: Today
- **Input**: Date field
- **Range**: Last 12 months
- **Trigger**: Refetch all data

### 2. Refresh Button
- **Icon**: RefreshCw
- **Disabled State**: During loading
- **Spinner**: Animated rotate
- **Tooltip**: "Refresh data"

### 3. Chart Tooltips
- **Trigger**: Hover
- **Position**: Above/below cursor
- **Content**: Value + label
- **Style**: Border + shadow
- **Delay**: 200ms

### 4. Table Sorting
- **Click**: Column header
- **Arrow**: ↑ ascending, ↓ descending
- **Default**: Date descending
- **Animate**: Rows reorder

### 5. Alert Severity
- **Critical** 🔴: Red, urgent
- **Warning** 🟡: Amber, attention
- **Info** 🔵: Blue, informational
- **Success** 🟢: Green, resolved

---

## 🚀 Animation Specifications

### Entry Animations
- **KPI Cards**: Fade + slide up, 300ms, staggered (100ms between)
- **Charts**: Fade + slide up, 300ms, 200ms delay
- **Tables**: Fade in + slide left (rows), 200ms each

### Hover Effects
- **Cards**: Scale 1.02x + shadow increase, 150ms
- **Buttons**: Opacity 0.8, 150ms
- **Chart bars**: Fill color brighten, 200ms

### Loading State
- **Skeletons**: Animated gradient pulse, 1.5s loop
- **Spinner**: Continuous rotate, 1s cycle

### Success/Error
- **Success**: Green flash (200ms)
- **Error**: Red background, toast notification

---

## 📐 Spacing & Typography

### Spacing Scale
```
4px   = base unit
8px   = 2x
12px  = 3x
16px  = 4x
24px  = 6x
32px  = 8x
40px  = 10x
```

### Typography
```
H1: 48px, font-black, tracking-wide
H2: 32px, font-black, tracking-normal
H3: 24px, font-bold, tracking-tight
Body: 16px, font-normal
Small: 14px, font-normal
Tiny: 12px, font-bold
```

### Shadows
```
sm: 0 1px 2px rgba(0,0,0,0.05)
md: 0 4px 6px rgba(0,0,0,0.1)
lg: 0 10px 15px rgba(0,0,0,0.1)
xl: 0 20px 25px rgba(0,0,0,0.1)
```

---

## 📊 Data Formats

### Currency
- **Format**: `KES 1,234,567`
- **Decimals**: 0 (integers)
- **Negative**: `KES -123,456`

### Numbers
- **Thousands**: Comma-separated
- **Decimals**: 1 place for weights (kg)
- **Percentages**: 1 decimal place

### Dates
- **Input**: `YYYY-MM-DD`
- **Display**: `MMM DD, YYYY` or time-based
- **Duration**: `23m`, `5h`, `2d`

### Weight
- **Unit**: kg (kilograms)
- **Format**: `23.5kg`
- **Display**: 1 decimal place

---

## 🔐 Access Control

- **Route**: `/admin/analytics`
- **Role Required**: `admin` only
- **Authentication**: JWT token
- **Fallback**: Redirect to login

---

## 🧪 Test Scenarios

### Functionality
- [ ] KPIs update every 10 seconds
- [ ] Charts refresh with new data
- [ ] Date picker changes all metrics
- [ ] Refresh button works
- [ ] Real-time subscriptions active
- [ ] Alerts appear/disappear correctly
- [ ] Tables sort correctly
- [ ] Mobile responsiveness works

### Edge Cases
- [ ] No data (empty state)
- [ ] Loading state (skeleton)
- [ ] Network error (retry)
- [ ] High latency (delayed updates)
- [ ] Empty alerts (green success)
- [ ] Many rows (pagination/scroll)

### Performance
- [ ] Initial load < 2s
- [ ] Refresh < 1s
- [ ] 60fps animations
- [ ] Smooth scrolling
- [ ] No memory leaks

---

## 🎨 Figma Design File Structure

```
Admin Analytics Dashboard
├── Frames
│   ├── Desktop (1440px)
│   │   ├── KPI Cards (grid)
│   │   ├── Sales Trend Chart
│   │   ├── Top Products Chart
│   │   ├── Branch Comparison
│   │   ├── Alerts Panel
│   │   ├── Active Shifts Table
│   │   └── Low Stock Table
│   ├── Tablet (768px)
│   │   └── [Responsive variants]
│   └── Mobile (375px)
│       └── [Mobile variants]
│
├── Components
│   ├── KPICard
│   │   ├── Default
│   │   ├── Loading
│   │   └── Error
│   ├── Chart
│   │   ├── LineChart
│   │   ├── BarChart (vertical)
│   │   ├── BarChart (horizontal)
│   │   └── Tooltip
│   ├── AlertBadge
│   │   ├── Critical
│   │   ├── Warning
│   │   ├── Info
│   │   └── Success
│   ├── TableRow
│   │   ├── Default
│   │   ├── Hover
│   │   └── Loading
│   └── Button
│       ├── Primary
│       ├── Secondary
│       └── Loading
│
├── Color Styles
│   ├── Brand Colors
│   ├── Status Colors
│   └── Neutral Palette
│
├── Text Styles
│   ├── Heading 1-3
│   ├── Body
│   ├── Small
│   └── Tiny
│
└── Documentation
    └── [This design spec]
```

---

## 🚢 Deployment Checklist

- [ ] Backend API endpoints tested
- [ ] Real-time subscriptions working
- [ ] Date picker functional
- [ ] Charts rendering correctly
- [ ] Tables sorted/searchable
- [ ] Mobile responsive
- [ ] Animations smooth (60fps)
- [ ] No console errors
- [ ] Accessibility (keyboard nav)
- [ ] Performance metrics met
- [ ] Error handling tested

---

**Version**: 1.0  
**Last Updated**: February 5, 2026  
**Status**: ✅ Production Ready

