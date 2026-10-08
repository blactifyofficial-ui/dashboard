# Blactify Dashboard — Design System Specification

A comprehensive design system guide for the **Shopify / Blactify Real-Time Management Dashboard**. Built with a dark, refined, intentional, and human-designed aesthetic optimized for operational clarity, high-density data visualization, desktop command centers, and iOS/Android PWA touch targets.

---

## 1. Design Philosophy & Aesthetic

* **Confident Dark Minimalist**: Pure `#000000` / `#0a0a0a` root background with solid, calm dark surfaces (`bg-neutral-900/60` and `bg-neutral-950`). Free of decorative glow blobs, floating radial gradients, and AI-generated SaaS noise.
* **Controlled Geometry & Restraint**: Standardized purposeful radii — `rounded-xl` for cards, modals, and tables; `rounded-lg` for interactive controls (buttons, inputs, dropdowns); `rounded-md` for status badges.
* **Intentional Hierarchy & Typography**: Clean, high-legibility sans-serif (`Inter`) paired with tabular figures and monospace numbers for prices, metrics, and identifiers. Controlled weights (medium/semibold) rather than heavy bold/black everywhere.
* **Subtle Interaction Feedback**: Micro-hover states communicate interactivity via subtle border/surface shifts (`hover:border-neutral-700`, `hover:bg-neutral-800`) without dramatic `scale()` or `translate-y` transforms.
* **Functional Enterprise Iconography**: Clean, meaningful `lucide-react` icons sized purposefully (14px–18px) to aid scanning speed without decorative noise.

---

## 2. Color Palette & Token System

### 2.1 Backgrounds & Surfaces

| Token / Class | Hex / RGBA Value | Usage Context |
| :--- | :--- | :--- |
| `bg-black` | `#000000` | Root document background, backdrop overlay |
| `bg-neutral-950` | `#0a0a0a` | Deep surface, desktop sidebar, nested subcards, form inputs |
| `bg-neutral-900/60` | `rgba(23, 23, 23, 0.60)` | Primary container surface for cards, dashboard panels, tables |
| `bg-neutral-900` | `#171717` | Modal dialogue container, elevated action bars |
| `bg-neutral-800` | `#262626` | Secondary button background, active tab pill, icon badge bases |
| `bg-neutral-800/50` | `rgba(38, 38, 38, 0.50)` | Hover state for interactive items |

### 2.2 Borders & Dividers

| Token / Class | RGBA / Hex Value | Usage Context |
| :--- | :--- | :--- |
| `border-neutral-800` | `#262626` | Standard structural borders, card outlines, table row dividers |
| `border-neutral-700` | `#404040` | Secondary buttons, hovered container borders, focused controls |
| `border-neutral-600` | `#525252` | Selected list items, active filter chips |
| `border-neutral-500` | `#737373` | Focused inputs, primary focus outlines |

### 2.3 Typography & Foreground Colors

| Token / Class | Color Code | Usage Context |
| :--- | :--- | :--- |
| `text-white` | `#ffffff` | Primary headings, prominent values, active navigation items |
| `text-neutral-200` | `#e5e5e5` | Primary body text, table cell content |
| `text-neutral-300` | `#d4d4d4` | Form labels, secondary card content |
| `text-neutral-400` | `#a3a3a3` | Card headers, subtitles, metadata, timestamps |
| `text-neutral-500` | `#737373` | Placeholder text, secondary iconography |

### 2.4 Semantic & Status Accents

| Status / Domain | Background Badge | Text Token | Border Token | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Normal / Success / Paid** | `bg-emerald-500/15` | `text-emerald-300` | `border-emerald-500/30` | Prepaid orders, positive cash balances, fulfilled items |
| **Warning / Pending / COD** | `bg-amber-500/15` | `text-amber-300` | `border-amber-500/30` | Cash on delivery orders, pending payments, partial COD |
| **Destructive / Error / High Priority** | `bg-rose-500/15` | `text-rose-300` | `border-rose-500/30` | Order issues, cancellations, refunds, deletions |
| **Neutral / General Info** | `bg-neutral-800` | `text-neutral-300` | `border-neutral-700` | System defaults, tags, category labels |

---

## 3. Typography Hierarchy

The interface utilizes **Inter** (`var(--font-inter)`), loaded via Next.js Google Fonts optimization.

```
Font Family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif
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

* **Container**: `bg-neutral-900/60 border border-neutral-800 rounded-xl shadow-sm overflow-hidden flex flex-col`
* **Header**: `bg-neutral-950/80 border-b border-neutral-800 text-[11px] font-semibold uppercase tracking-wider text-neutral-400 px-4 py-3`
* **Rows**: `hover:bg-neutral-900/50 transition-colors divide-y divide-neutral-800 px-4 py-3 text-xs sm:text-sm text-neutral-200`
* **Numbers**: `font-mono font-medium text-white`

---

## 6. Charting & Visualization Theme

For `recharts`:

* **Grid Lines**: `stroke="#262626"` (neutral-800) with `strokeDasharray="3 3"`
* **Axis Labels / Ticks**: `#737373` (neutral-500), font-size: `11px`, font-family: monospace
* **Bars / Lines**: Solid clean tones (`#ffffff`, `#10b981`, `#f59e0b`)
* **Tooltip Container**:
  * Background: `#171717` (neutral-900)
  * Border: `1px solid #262626` (neutral-800)
  * Shadow: `0 10px 15px -3px rgba(0, 0, 0, 0.5)`
  * Border Radius: `8px`
  * Text: `#ffffff`

---

## 7. Icons & Imagery

* **Icon Library**: `lucide-react`
* **Default Icon Size**: `16px`–`18px` (Navigation and section headers), `13px`–`15px` (Badges, buttons, table actions)
* **Stroke Width**: Default `2`
* **Brand Logo**: `/blactify_logo_font.svg` vector rendered via `next/image`.
* **Decorative Icons Prohibition**: No sparkle/glimmer icons (`Sparkles`, decorative blobs) or non-functional decorative assets. Keep iconography strictly informative.et`, `Layers`, `SlidersHorizontal`).
