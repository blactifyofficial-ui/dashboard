# Blactify Dashboard — Design System Specification

A comprehensive design system guide for the **Shopify / Blactify Real-Time Management Dashboard**. Built with a dark, refined, intentional, and human-designed aesthetic optimized for operational clarity, high-density data visualization, desktop command centers, and iOS/Android PWA touch targets.

---

## 1. Design Philosophy & Aesthetic

* **Pure Black OLED Aesthetic**: Pure `#000000` root background paired with elevated matte dark surfaces (`bg-card` / `#0c0d10`, `bg-sidebar` / `#050505`, `bg-popover` / `#111215`). Delivers high contrast, deep focus, and eliminates visual clutter.
* **Modern Electric Indigo Accent**: Primary interactive elements powered by vibrant electric indigo (`#6366f1`) and crisp contrast for active states, focus rings, and metrics.
* **Controlled Geometry & Restraint**: Standardized purposeful radii — `rounded-xl` for cards, modals, and tables; `rounded-lg` for interactive controls (buttons, inputs, dropdowns); `rounded-md` for status badges.
* **Intentional Hierarchy & Typography**: Clean, high-legibility sans-serif (`Inter`) paired with tabular figures and monospace numbers for prices, metrics, and identifiers.
* **Subtle Hairline Borders**: Delicate hairline dividers and borders (`rgba(255, 255, 255, 0.08)`) that create structured layer elevation against the pitch black canvas.
* **Functional Enterprise Iconography**: Clean, meaningful `lucide-react` icons sized purposefully (14px–18px) to aid scanning speed without decorative noise.

---

## 2. Color Palette & Token System

### 2.1 Backgrounds & Surfaces

| Token / Class | Hex / RGBA Value | Usage Context |
| :--- | :--- | :--- |
| `bg-background` | `#000000` | Root document background, viewport shell |
| `bg-sidebar` | `#050505` | Persistent desktop & mobile navigation sidebar |
| `bg-card` | `#0c0d10` | Primary container surface for cards, dashboard panels, tables |
| `bg-popover` | `#111215` | Modal dialogue container, dropdown menus, elevated flyouts |
| `bg-secondary` | `#16181f` | Secondary button background, filter chip bases |
| `bg-muted` | `#121418` | Recessed headers, table headings, tab bar track |
| `bg-accent` | `#181b22` | Hover surface for interactive list items |

### 2.2 Borders & Focus

| Token / Class | RGBA / Hex Value | Usage Context |
| :--- | :--- | :--- |
| `border-border` | `rgba(255, 255, 255, 0.08)` | Standard structural borders, card outlines, table row dividers |
| `border-sidebar-border` | `rgba(255, 255, 255, 0.08)` | Sidebar dividing line |
| `border-input` | `rgba(255, 255, 255, 0.10)` | Form input borders |
| `ring-ring` | `rgba(99, 102, 241, 0.45)` | Focused controls, focus-visible outlines |

### 2.3 Typography & Foreground Colors

| Token / Class | Color Code | Usage Context |
| :--- | :--- | :--- |
| `text-foreground` | `#f8fafc` | Primary headings, prominent values, active navigation items |
| `text-card-foreground` | `#f8fafc` | Card titles and metrics |
| `text-muted-foreground` | `#94a3b8` | Subtitles, helper text, timestamps, table column headers |
| `text-primary` | `#6366f1` | Brand accents, active links, primary indicators |

### 2.4 Semantic & Status Accents

| Status / Domain | Background Badge | Text Token | Border Token | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Normal / Success / Paid** | `bg-emerald-500/15` | `text-emerald-300` | `border-emerald-500/30` | Prepaid orders, positive cash balances, fulfilled items |
| **Warning / Pending / COD** | `bg-amber-500/15` | `text-amber-300` | `border-amber-500/30` | Cash on delivery orders, pending payments, partial COD |
| **Destructive / Error / High Priority** | `bg-rose-500/15` | `text-rose-300` | `border-rose-500/30` | Order issues, cancellations, refunds, deletions |
| **Info / System** | `bg-sky-500/15` | `text-sky-300` | `border-sky-500/30` | System notices, active filters, informational badges |
| **Neutral / General Info** | `bg-muted` | `text-foreground` | `border-border` | System defaults, tags, category labels |

---

## 3. Typography Hierarchy

The interface utilizes **Poppins** (`var(--font-poppins)`), loaded via Next.js Google Fonts optimization.

```
Font Family: Poppins, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif
```

### Scale & Hierarchy

| Level | Tailwind Classes | Size / Line-Height | Weight | Example Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Page Title** | `text-xl sm:text-2xl` | 20px → 24px | `font-bold tracking-tight text-white` | "Dashboard", "Monthly Expenses", "Team & Roles" |
| **Section Header** | `text-base sm:text-lg` | 16px → 18px | `font-semibold tracking-tight text-white` | "Recent Orders", "Cap Table & Equity" |
| **Card / Panel Title** | `text-xs sm:text-sm` | 12px → 14px | `font-semibold text-neutral-300` | "Total Revenue", "Meta Ads Spend" |
| **Metric Value** | `text-xl sm:text-2xl md:text-3xl` | 20px → 30px | `font-bold font-mono text-white` | `₹1,45,280.00`, `94.2%` |
| **Body Primary** | `text-xs sm:text-sm` | 12px → 14px | `font-normal text-neutral-200` | Descriptions, order notes |
| **Metadata / Secondary** | `text-xs` or `text-[11px]` | 11px → 12px | `text-neutral-400` | Timestamps, order customer emails |
| **Status Badge** | `text-[10px]` or `text-[11px]` | 10px → 11px | `font-medium uppercase tracking-wider` | Pill counters, status tags |

---

## 4. Spacing, Elevation & Layout Grid

### 4.1 Layout Shell

* **Screen Boundary**: Fixed `h-[100dvh]` with `overflow-hidden` preventing scroll leakage.
* **Sidebar**: Fixed/sticky `w-64` (`bg-neutral-950` desktop, `bg-neutral-900` mobile).
* **Main Viewport**: Scrollable `flex-1 overflow-y-auto` with `max-w-7xl mx-auto`.
* **Safe-Area Insets**:
  * Top: `pt-[max(0.75rem,env(safe-area-inset-top))]`
  * Bottom: `pb-[max(1rem,env(safe-area-inset-bottom))]`

### 4.2 Border Radius System

| Token | Radius Value | Component Usage |
| :--- | :--- | :--- |
| `rounded-md` | `6px` | Status badges, category tags, small indicators |
| `rounded-lg` | `8px` | Buttons, form inputs, select dropdowns, search boxes, tab buttons |
| `rounded-xl` | `12px` | Primary cards, chart containers, data tables, modal dialogs |
| `rounded-full` | `9999px` | Avatars, live pulse dots |

---

## 5. UI Component Specifications

### 5.1 Metric / KPI Card

```tsx
<div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-4 sm:p-5 flex flex-col justify-between shadow-sm">
  <div className="flex items-center justify-between gap-2 mb-2">
    <span className="text-xs font-medium text-neutral-400">Total Revenue (All Time)</span>
    <div className="p-1.5 rounded-lg bg-neutral-800 text-neutral-300 border border-neutral-700">
      <IndianRupee size={14} />
    </div>
  </div>
  <div className="text-xl sm:text-2xl md:text-3xl font-bold font-mono text-white tracking-tight">
    ₹1,45,280.00
  </div>
</div>
```

---

### 5.2 Buttons & Interactive Controls

#### Primary Action Button
```tsx
<button className="h-9 px-4 bg-white hover:bg-neutral-200 text-black text-xs sm:text-sm font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50">
  <Plus size={15} />
  <span>Add Entry</span>
</button>
```

#### Secondary Action Button
```tsx
<button className="h-9 px-3.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition-colors">
  Cancel
</button>
```

#### Destructive Action Button
```tsx
<button className="h-9 px-4 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50">
  Delete Record
</button>
```

---

### 5.3 Form Inputs & Selects

```tsx
<input 
  type="text" 
  placeholder="Enter title..." 
  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-neutral-500 transition-colors"
/>
```

```tsx
<select 
  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-neutral-500 transition-colors"
>
  <option value="" className="bg-neutral-900 text-white">Select an option</option>
</select>
```

---

### 5.4 Data Tables

* **Container**: `bg-card border border-border rounded-xl shadow-xs overflow-hidden flex flex-col`
* **Header**: `bg-muted/70 border-b border-border text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-4 py-3`
* **Rows**: `hover:bg-muted/40 transition-colors divide-y divide-border px-4 py-3 text-xs sm:text-sm text-foreground`
* **Numbers**: `font-mono font-medium text-foreground`

---

## 6. Charting & Visualization Theme

For `recharts`:

* **Grid Lines**: `stroke="rgba(255, 255, 255, 0.06)"` with `strokeDasharray="3 3"` (subtle, non-distracting)
* **Axis Labels / Ticks**: `#94a3b8` (muted-foreground), font-size: `11px`, font-family: monospace
* **Revenue Stroke & Glow**: `#10b981` (Emerald), translucent vertical gradient fill (`0.32` opacity to `0`)
* **Orders Stroke & Bars**: `#818cf8` / `#6366f1` (Electric Indigo), vertical gradient fill (`0.35` opacity to `0`)
* **Tooltip Container**:
  * Background: `bg-card/95 backdrop-blur-md`
  * Border: `1px solid var(--border)`
  * Shadow: `shadow-xl`
  * Border Radius: `rounded-xl`
  * Text: `text-foreground`

---

## 7. Icons & Imagery

* **Icon Library**: `lucide-react`
* **Default Icon Size**: `16px`–`18px` (Navigation and section headers), `13px`–`15px` (Badges, buttons, table actions)
* **Stroke Width**: Default `2`
* **Brand Logo**: `/blactify_logo_font.svg` vector rendered via `next/image`.
* **Decorative Icons Prohibition**: No sparkle/glimmer icons (`Sparkles`, decorative blobs) or non-functional decorative assets. Keep iconography strictly informative.et`, `Layers`, `SlidersHorizontal`).
