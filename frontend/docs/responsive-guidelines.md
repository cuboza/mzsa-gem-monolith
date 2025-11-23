# Responsive Guidelines

## Breakpoint Map
| Key | px | Typical Usage |
| --- | --- | --- |
| `sm` | 640 | phones in landscape, small tablets |
| `md` | 768 | tablets |
| `lg` | 1024 | small laptops |
| `xl` | 1280 | desktops |
| `2xl` | 1536 | wide desktops |

`hooks/useBreakpoint.ts`
- `active`: current key.
- `isAtLeast('md')` / `isBelow('lg')` helpers drive conditional JSX.

## Shared Components
- `components/layout/ResponsiveSticky`
  - Props: `stickyAt`, `maxHeight`, `mobileScroll`, `offsetClass`.
  - Removes sticky + max-height when viewport < `stickyAt`.
  - Use for cards/sidebars/modals that should pin only on desktop.
- `components/layout/Stepper`
  - Horizontal scrollable multi-step indicator.
- `components/layout/Timeline`
  - Vertical status list with consistent spacing.

## Pages Updated
- Header: flex-wrap on small screens.
- Catalog: filters/search in `ResponsiveSticky`, `CatalogFilters` uses `useBreakpoint`.
- Trailer modal: left column wrapped in `ResponsiveSticky` to avoid double scroll.
- Configurator: progress replaces bespoke grid with shared `Stepper`.
- TrackOrder/Profile: timeline + sticky settings use shared components.

## Smoke-Test Checklist
| Viewport | Pages | Notes |
| --- | --- | --- |
| 320px | Home, Catalog, Trailer modal | ensure no horizontal scroll; sticky blocks disabled |
| 360px | Configurator steps | Stepper should scroll horizontally |
| 768px | Catalog filters | Sticky re-enables, modals keep single scroll |
| 1024px | Profile sidebar | ResponsiveSticky should activate |
| 1440px | Track timeline | Layout remains centered, timeline aligned |

Test steps:
1. `npm run dev` and open app.
2. Use browser DevTools device toolbar to set widths above.
3. Verify header wrapping, filters visibility, modal scroll, Configurator stepper, TrackOrder timeline, Profile sticky sidebar.
4. Note regressions and update doc.
