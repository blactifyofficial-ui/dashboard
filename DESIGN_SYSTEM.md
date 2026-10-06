# Blactify Dashboard — Design System Specification

A comprehensive design system guide for the **Shopify / Blactify Real-Time Management Dashboard**. Built with a dark-first, glassmorphic aesthetic optimized for high-density data visualization, desktop command centers, and iOS/Android PWA touch targets.

---

## 1. Design Philosophy & Aesthetic

* **Dark-First Ultra Minimalist (OLED Black)**: Pure `#000000` / `#0a0a0a` background reduces eye strain during prolonged monitoring sessions and enhances contrast for data-heavy views.
* **Layered Translucency & Glassmorphism**: Cards and surfaces use layered white opacities (`rgba(255, 255, 255, 0.02)` to `0.10`) with thin semi-transparent borders (`border-white/5` to `border-white/15`) and backdrop blur.
* **Data-First Typography**: Clean, high-legibility sans-serif (`Inter`) paired with tabular figures and monospace numbers for prices, metrics, and order identifiers.
* **Mobile-First Touch Ergonomics**: Minimum **44px** hit targets (`min-h-[44px] min-w-[44px]`) on all interactive buttons, inputs, and tab toggles with native `safe-area-inset` support for PWA standalone execution.
* **Subtle Dynamic Polish**: Ambient gradient glows, live pulsing indicators for Shopify webhook streaming, and smooth micro-transitions (`duration-200` to `duration-500`).

---

## 2. Color Palette & Token System

### 2.1 Backgrounds & Surfaces

| Token / Class | Hex / RGBA Value | Usage Context |
| :--- | :--- | :--- |
| `bg-black` | `#000000` | Root background, mobile app shell, modals overlay backdrop |
| `bg-neutral-950` | `#0a0a0a` | Desktop sidebar container background |
| `bg-neutral-900` | `#171717` | Mobile header bar, secondary container fill |
| `bg-[#1e1e1e]` | `#1e1e1e` | High-contrast modal dialog surface |
| `bg-white/[0.02]` | `rgba(255, 255, 255, 0.02)` | Primary chart containers, table containers |
| `bg-white/[0.03]` | `rgba(255, 255, 255, 0.03)` | KPI & Metric cards base |
| `bg-white/5` | `rgba(255, 255, 255, 0.05)` | Secondary card containers, input fields, filter pills |
| `bg-white/10` | `rgba(255, 255, 255, 0.10)` | Active navigation links, badge backgrounds |
| `bg-white/15` | `rgba(255, 255, 255, 0.15)` | Selected tab pill active background |

### 2.2 Borders & Dividers

| Token / Class | RGBA Value | Usage Context |
| :--- | :--- | :--- |
| `border-white/5` | `rgba(255, 255, 255, 0.05)` | Card borders, table header separators, inner dividers |
| `border-white/10` | `rgba(255, 255, 255, 0.10)` | Interactive inputs, card outlines, sidebar border |
| `border-white/15` | `rgba(255, 255, 255, 0.15)` | Active badges, hovered card highlights |
| `border-white/20` | `rgba(255, 255, 255, 0.20)` | Focused inputs, hovered card borders |

### 2.3 Typography & Foreground Colors

| Token / Class | Color Code | Usage Context |
| :--- | :--- | :--- |
| `text-white` | `#ffffff` | Primary headings, prominent numbers, active nav items |
| `text-neutral-100` | `#ededed` | Primary body text |
| `text-white/80` / `text-neutral-300` | `rgba(255, 255, 255, 0.80)` | Secondary labels, table cell content |
| `text-white/60` / `text-neutral-400` | `rgba(255, 255, 255, 0.60)` | Card titles, subtitle metadata, inactive nav icons |
| `text-neutral-500` / `text-white/40` | `rgba(255, 255, 255, 0.40)` | Placeholder text, timestamps, secondary icons |

### 2.4 Semantic & Status Accents

| Status / Domain | Background Pill | Text Token | Border Token | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Normal / Prepaid / Success** | `bg-emerald-500/15` | `text-emerald-300` | `border-emerald-500/25` | Prepaid orders, fulfilled items, positive balances |
| **COD / Warning / Pending** | `bg-amber-500/15` | `text-amber-300` | `border-amber-500/25` | Cash on delivery orders, pending payments, partial COD |
| **Destructive / Error / Danger** | `bg-red-500` | `text-white` | `border-transparent` | Delete actions, PIN authentication errors, logout |
| **Info / Interaction** | `hover:text-blue-400` | `text-blue-400` | `border-blue-500/25` | Order links, external navigation glyphs |

---

## 3. Typography Hierarchy

The interface utilizes **Inter** (`var(--font-inter)`), loaded via Next.js Google Fonts optimization.

```
Font Family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif
```

### Scale & Hierarchy

| Level | Tailwind Classes | Size / Line-Height | Tracking & Weight | Example Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Display Metric** | `text-3xl sm:text-4xl md:text-5xl` | 30px → 36px → 48px | `font-bold tracking-tight` | Revenue totals, all-time sales |
| **Page Title** | `text-2xl sm:text-3xl md:text-4xl` | 24px → 30px → 36px | `font-bold tracking-tight` | "Sales Overview", "Settings" |
| **Section Header** | `text-lg sm:text-xl md:text-2xl` | 18px → 20px → 24px | `font-semibold tracking-tight` | Table headers, modal titles |
| **Card Title** | `text-xs sm:text-sm` | 12px → 14px | `font-medium text-neutral-400` | "Total Orders", "System Status" |
| **Body Primary** | `text-sm sm:text-base` | 14px → 16px | `font-normal text-neutral-100` | Paragraphs, descriptions |
| **Body Secondary** | `text-xs sm:text-sm` | 12px → 14px | `text-neutral-400` | Table secondary lines, subtext |
| **Monospace / Code** | `font-mono text-xs sm:text-sm` | 12px → 14px | `font-mono font-bold` | `#ORDER-1002`, `₹1,240.00`, `25.0%` |
| **Micro Badge** | `text-[10px] sm:text-[11px]` | 10px → 11px | `font-semibold uppercase tracking-wider` | Pill counters, status tags |

---

## 4. Spacing, Elevation & Layout Grid

### 4.1 Layout Shell

* **Screen Boundary**: Fixed `h-[100dvh]` with `overflow-hidden` preventing body bouncing.
* **Sidebar**: Fixed/sticky `w-64` (`bg-neutral-950` desktop, `bg-neutral-900` mobile).
* **Main Viewport**: Scrollable `flex-1 overflow-y-auto` with `max-w-7xl mx-auto`.
* **Safe-Area Insets**:
  * Top: `pt-[max(0.75rem,env(safe-area-inset-top))]`
  * Bottom: `pb-[max(1rem,env(safe-area-inset-bottom))]`

### 4.2 Border Radius System

| Token | Radius Value | Component Usage |
| :--- | :--- | :--- |
| `rounded-lg` | `8px` | Icon buttons, minor status tags |
| `rounded-xl` | `12px` | Search inputs, navigation links, standard action buttons |
| `rounded-2xl` | `16px` | Filter bar containers, modal dialogs |
| `rounded-3xl` | `24px` | KPI cards, data table wrappers, chart panels |
| `rounded-full` | `9999px` | User avatars, pulse indicators, pill tags |

### 4.3 Shadows & Ambient Glows

```css
/* Card Ambient Glow */
.ambient-glow {
  position: absolute;
  top: 0;
  right: 0;
  margin-top: -1rem;
  margin-right: -1rem;
  width: 6rem;
  height: 6rem;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.05);
  filter: blur(24px);
  pointer-events: none;
  transition: all 500ms;
}

/* Card Glow on Hover */
.group:hover .ambient-glow {
  background: rgba(255, 255, 255, 0.10);
}
```

---

## 5. UI Component Specifications

### 5.1 Metric / KPI Card
Used for headline stats (e.g. Total Revenue, Total Orders).

```tsx
<div className="group bg-white/[0.03] border border-white/5 rounded-3xl p-5 sm:p-6 md:p-8 hover:bg-white/[0.06] transition-all duration-500 relative shadow-2xl flex flex-col justify-between">
  {/* Ambient background glow */}
  <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-all duration-500 pointer-events-none" />

  <div className="flex items-center justify-between relative z-10 mb-2 md:mb-3">
    <h2 className="text-sm font-medium text-neutral-400">Total Revenue (All Time)</h2>
    <button className="text-neutral-400 hover:text-white min-h-[44px] min-w-[44px] flex items-center justify-center -mr-2 rounded-lg hover:bg-white/5 transition-colors">
      <Eye size={19} />
    </button>
  </div>

  <p className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight relative z-10 truncate mt-auto">
    ₹1,45,280.00
  </p>
</div>
```

---

### 5.2 Live Status Badge (Webhook / Sync Indicator)

```tsx
<div className="flex items-center gap-2">
  <span className="relative flex h-2 w-2 shrink-0">
    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white/50 opacity-75" />
    <span className="relative inline-flex rounded-full h-2 w-2 bg-white/80" />
  </span>
  <span className="text-xs sm:text-sm text-neutral-400">Real-time sync with Shopify via Webhooks</span>
</div>
```

---

### 5.3 Buttons & Interactive Controls

All buttons adhere strictly to touch-friendly heights:

#### Primary / Destructive Button
```tsx
<button className="min-h-[44px] px-5 flex items-center justify-center rounded-xl text-sm font-medium bg-red-500 hover:bg-red-600 active:bg-red-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md">
  Confirm Action
</button>
```

#### Ghost / Secondary Button
```tsx
<button className="min-h-[44px] px-4 flex items-center justify-center rounded-xl text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 active:bg-white/10 transition-colors">
  Cancel
</button>
```

#### Navigation Link
```tsx
<Link
  href="/dashboard"
  className="flex items-center gap-3 px-3.5 py-2.5 min-h-[44px] text-sm font-medium rounded-xl transition-all duration-200 bg-white/10 text-white"
>
  <LayoutDashboard size={19} className="shrink-0 text-white" />
  <span>Overview</span>
</Link>
```

---

### 5.4 Search & Input Fields

```tsx
<div className="relative w-full md:w-64">
  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
  <input 
    type="text" 
    placeholder="Search orders..." 
    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 min-h-[44px] text-base md:text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-white/20 focus:ring-2 focus:ring-white/10 transition-all"
  />
</div>
```

---

### 5.5 Status Badges & Chips

#### Prepaid Badge
```tsx
<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
  <CreditCard size={13} className="text-emerald-400 shrink-0" />
  <span>Normal (Prepaid)</span>
</span>
```

#### Cash on Delivery (COD) Badge
```tsx
<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/25">
  <Banknote size={13} className="text-amber-400 shrink-0" />
  <span>COD</span>
</span>
```

#### Equity / Percentage Chip
```tsx
<div className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-right shrink-0">
  <div className="font-mono text-sm font-bold text-white">25.0%</div>
</div>
```

---

### 5.6 Data Tables

* **Container**: `bg-white/[0.02] border border-white/5 rounded-3xl shadow-2xl relative overflow-hidden flex flex-col`
* **Header**: `bg-white/[0.02] border-b border-white/5 text-xs font-semibold uppercase tracking-wider text-neutral-400`
* **Rows**: `hover:bg-white/[0.03] transition-colors duration-150 divide-y divide-white/5`
* **Numbers**: `font-mono text-sm font-semibold text-white`

---

### 5.7 Modal Dialogs

```tsx
<div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
  <div className="bg-[#1e1e1e] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden max-h-[90dvh] flex flex-col">
    {/* Body */}
    <div className="p-5 sm:p-6 overflow-y-auto flex-1">
      <h2 className="text-xl font-semibold text-white mb-2">Dialog Title</h2>
      <p className="text-gray-400 text-sm leading-relaxed">Description message goes here.</p>
    </div>
    {/* Footer */}
    <div className="bg-black/20 p-4 border-t border-white/5 flex items-center justify-end gap-3 shrink-0">
      <button className="min-h-[44px] px-4 flex items-center justify-center rounded-xl text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-colors">
        Cancel
      </button>
      <button className="min-h-[44px] px-5 flex items-center justify-center rounded-xl text-sm font-medium bg-red-500 hover:bg-red-600 text-white transition-colors">
        Confirm
      </button>
    </div>
  </div>
</div>
```

---

## 6. Charting & Visualization Theme

For `recharts` and `chart.js`:

* **Grid Lines**: `rgba(255, 255, 255, 0.05)`
* **Axis Labels / Ticks**: `#737373` (neutral-500), font-size: 11px
* **Bar / Line Fill**: `#ffffff` with gradient to `rgba(255, 255, 255, 0.2)`
* **Tooltip Container**:
  * Background: `#171717` (neutral-900)
  * Border: `1px solid rgba(255, 255, 255, 0.15)`
  * Shadow: `0 20px 25px -5px rgba(0, 0, 0, 0.5)`
  * Border Radius: `12px`
  * Text: `#ffffff`

---

## 7. Responsive Breakpoints

| Breakpoint | Width | Behavior & Layout Rules |
| :--- | :--- | :--- |
| **Mobile (`<640px`)** | 0px – 639px | Single column cards, full-width search, sticky top header bar with menu drawer, horizontal swipe tables |
| **Tablet (`sm: 640px`)** | 640px – 767px | 2-column KPI grid, filter pill clusters |
| **Small Desktop (`md: 768px`)** | 768px – 1023px | Persistent left sidebar, 2-column KPI layout |
| **Desktop (`lg: 1024px+`)** | 1024px+ | 3-column KPI row, expanded table columns, side-by-side filter & search bar |
| **Max Content Container** | `max-w-7xl` (1280px) | Main content container centered with auto margins |

---

## 8. Icons & Imagery

* **Icon Library**: `lucide-react`
* **Default Icon Size**: `19px` (Navigation and card headers), `14px`–`16px` (Badges, search, inline actions)
* **Stroke Width**: Default `2` (crisp lines on high-DPI displays)
* **Brand Logo**: `/blactify_logo_font.svg` vector rendered via `next/image` with high priority.
