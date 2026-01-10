# Property Card Redesign - Design Documentation

## Overview
Redesigned property management dashboard listing page with improved visual hierarchy, reduced information overload, and enhanced usability while maintaining brand consistency.

## Design Principles Applied

### 1. Visual Hierarchy
- **Primary Information (Always Visible)**
  - Property image (16:10 aspect ratio, hover zoom effect)
  - Property name (larger, semibold)
  - Location (with icon, muted color)
  - Rating & review count (compact, prominent)
  - Status badge (top-left, color-coded)

- **Secondary Information (Collapsible)**
  - Room availability summary (always visible, compact)
  - Check-in/out times (expandable)
  - Amenities list (expandable, with tooltip for overflow)
  - Owner information (expandable)
  - Dynamic pricing badge (expandable)

### 2. Information Architecture

#### Before (Old Design)
- All information displayed at once
- Dense text blocks
- Multiple action buttons competing for attention
- Owner info always visible
- Facilities always shown (cluttered)

#### After (New Design)
- **Essential info** → Always visible
- **Detailed info** → Expandable section
- **Actions** → Clear primary/secondary hierarchy
- **Owner info** → Hidden in expandable section
- **Facilities** → Top 4 visible, rest in tooltip

### 3. Action Hierarchy

#### Primary Action
- **"Lihat Kamar"** button (full width, prominent)
- Primary CTA for property management workflow

#### Secondary Actions
- **Edit** button (outline variant, flex-1)
- **Chat** icon button (only if owner exists, with tooltip)
- **More menu** (three-dot, top-right on image)

### 4. Spacing & Typography

#### Improvements
- Increased card padding (consistent 3-unit spacing)
- Better line-height for readability
- Font size scale: 18px (title) → 14px (body) → 12px (metadata)
- Reduced visual noise with subtle borders and backgrounds

#### Typography Scale
```
Title:      text-lg font-semibold (18px)
Body:       text-sm (14px)
Metadata:   text-xs (12px)
Badges:     text-xs (12px)
```

### 5. Color & Visual Elements

#### Maintained Brand Colors
- Status badges use existing variants (default, secondary, outline, destructive)
- No color theme changes
- Subtle elevation with hover effects (shadow-md)

#### Visual Enhancements
- Image hover zoom (scale-105)
- Smooth transitions (200ms)
- Backdrop blur on overlay buttons
- Subtle background tints (bg-muted/30, bg-muted/20)

### 6. Responsive Design

#### Breakpoints
- **Mobile**: Single column, full-width buttons
- **Tablet (md)**: 2 columns grid
- **Desktop (lg)**: 3 columns grid

#### Mobile Optimizations
- Touch-friendly button sizes (min 44px)
- Stacked action buttons
- Expandable sections for space efficiency

## Component Structure

```
PropertyCardRedesigned
├── Image Section (16:10)
│   ├── Status Badge (top-left)
│   ├── Type Badge (top-right)
│   └── More Menu (bottom-right)
├── Header
│   ├── Title & Location
│   └── Rating & Reviews
├── Content (Collapsible)
│   ├── Availability Summary (always visible)
│   └── Expandable Details
│       ├── Check-in/out Times
│       ├── Amenities (with tooltip)
│       ├── Owner Info
│       └── Dynamic Pricing Badge
└── Footer
    ├── Primary Action (Lihat Kamar)
    └── Secondary Actions (Edit, Chat)
```

## Key Features

### 1. Expandable Details Section
- Reduces initial information overload
- Users can expand when needed
- Smooth animation (slide-in-from-top)
- Clear expand/collapse button

### 2. Smart Amenities Display
- Shows top 4 amenities
- "+X more" badge with tooltip for overflow
- Prevents card from becoming too tall

### 3. Availability Summary
- Always visible (important metric)
- Compact design with icon
- Clear ratio display (active/total)

### 4. Contextual Actions
- Chat button only shows if owner exists
- Tooltip explains secondary actions
- More menu for advanced actions

## Language Consistency
All text in Bahasa Indonesia:
- "Lihat Kamar" (primary action)
- "Edit" (secondary action)
- "Tampilkan Detail" / "Sembunyikan Detail"
- "Ketersediaan Kamar"
- "Fasilitas"
- "Pemilik"
- Status labels: "Aktif", "Nonaktif", etc.

## Accessibility
- Semantic HTML structure
- ARIA labels on icon buttons
- Keyboard navigation support
- Focus states on interactive elements
- Tooltip for additional context

## Performance Considerations
- Lazy image loading (can be added)
- Optimized re-renders with React hooks
- Minimal DOM manipulation
- CSS transitions (GPU-accelerated)

## Future Enhancements
1. Image gallery (swipe on mobile)
2. Quick edit inline (name, status)
3. Bulk actions (select multiple)
4. Advanced filters (price range, amenities)
5. Sort options (newest, rating, name)

## Migration Notes
- Old `PropertyCard` component kept for backward compatibility
- New component: `PropertyCardRedesigned`
- Easy to switch between old/new design
- No breaking changes to API or data structure
