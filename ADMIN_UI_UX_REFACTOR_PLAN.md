# Admin Dashboard UI/UX Refactor Plan

## Design Constraints (Maintained)
- **Color Palette**: Navy/Deep Blue Primary (#1B3A57), Cream Background (#F8F5F2), Gold Accents (#C5A059)
- **Typography**: Inter font, premium yet friendly aesthetic
- **Layout**: Left-sidebar navigation, desktop-first, PWA-ready

## Refactoring Priority

### 1. Dashboard (HIGH PRIORITY)
**Current Issues:**
- No time context (Today/7d/30d)
- No trend indicators (↑ ↓ %)
- Weak KPI presentation
- No empty state explanations

**Improvements:**
- Add time period selector (Today / 7d / 30d / All)
- Add micro-trends with percentage changes
- Improve KPI cards with trend indicators
- Better empty states with actionable guidance
- Add recent activity scannability

### 2. Properties Page (HIGH PRIORITY)
**Current Issues:**
- Over-reliance on kebab menus
- Weak data density
- No card/table view toggle
- Missing breadcrumbs
- Marketing-style descriptions instead of operational data

**Improvements:**
- Add breadcrumbs navigation
- Card ↔ Table view toggle
- Promote primary actions (Kelola, Lihat Kamar)
- Show operational metrics: Total rooms, Active bookings, Occupancy
- Reduce visual weight of cards
- Add bulk actions support

### 3. Rooms Page (MEDIUM PRIORITY)
**Current Issues:**
- System labels (e.g., "rooms.property")
- No bulk selection/actions
- All actions hidden in kebab menu
- No inline status toggles
- No column sorting
- No compact/dense mode

**Improvements:**
- Human-readable labels
- Bulk selection checkbox column
- Bulk actions toolbar
- Inline status toggles
- Column sorting
- Compact/dense table mode toggle
- Better pricing/availability scannability

### 4. Navigation (MEDIUM PRIORITY)
**Current Issues:**
- No breadcrumbs for deep navigation
- Weak hierarchy indication
- No contextual sub-navigation

**Improvements:**
- Add breadcrumb component
- Contextual sub-navigation in property views
- Better hierarchy visualization

### 5. PWA Features (LOW PRIORITY)
**Current Issues:**
- No online/offline status indicator
- No sync/autosave feedback
- No density mode options

**Improvements:**
- Subtle online/offline status
- Sync/autosave feedback
- Density mode toggle (Comfortable / Compact)
- Install prompt UX

## Implementation Order
1. Dashboard improvements
2. Properties page enhancements
3. Rooms page refactoring
4. Navigation enhancements
5. PWA features
