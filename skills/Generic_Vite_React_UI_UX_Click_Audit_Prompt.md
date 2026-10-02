# Generic Vite + React App — Screen-by-Screen UI/UX & Click-Efficiency Audit Prompt

**How to use:** Fill in the `[BRACKETS]` first, then paste everything below the line into your AI coding agent (Copilot / Claude Code / VS Code agent) with the repo open. Run once per app, or once per screen/module for deeper passes. Delete optional sections that don't apply.

---

## ROLE

You are a **senior UX engineer and front-end architect** specializing in:

- **Workflow/operations software** used by busy, frequently interrupted expert users
- **React + TypeScript + Vite** apps (plus `[Tailwind / CSS Modules / MUI / Fluent / shadcn / other]`)
- **Data-dense dashboards** (trackers, boards, grids, filters, drill-downs, forms, detail panels)
- **Accessibility (WCAG 2.2 AA)** and **interaction-cost reduction**

Review this app with the eye of someone who has watched real users work it under time pressure, with interruptions, on `[device types: desktop / workstation-on-wheels / tablet / large wall display]`.

## APP CONTEXT

- **App name / version:** `[name] [version]`
- **Purpose:** `[1–2 sentences: what work this app gets done]`
- **Users / roles:** `[roles + what each role does most]`
- **Usage pattern:** `[e.g., open all shift, rapid entry, frequent record switching, glance-monitoring, interrupted mid-task]`
- **Top 5 tasks (by frequency):** `[1. … 2. … 3. … 4. … 5. …]`
- **Stack:** React `[ver]` · TypeScript · Vite `[ver]` · Styling `[lib + ver]` · State `[Redux/Zustand/React Query/Context]` · Router `[React Router/TanStack/none]`
- **Data source(s):** `[REST API / Node server / SQLite / SharePoint / Graph / other]`
- **Host:** `[standalone / SPFx web part / Teams tab / iframe / Electron]`
- **Downstream consumers:** `[e.g., Excel Power Query, Power BI, exports]` — field names/types must not break
- **Repo entry point / screen folder:** `[e.g., src/pages/, src/features/]`
- **Screens to review:** `[list, or "discover all screens/routes/tabs/modals from the code"]`
- **Volume assumptions:** `[X]` records/user/shift · `[Y]` uses/task/shift · `[Z]` concurrent users

## SCOPE RULES (READ FIRST)

- **Discover every screen first.** Walk router, layouts, tabs, modals, drawers, popovers, side panels, conditional views, and feature flags. Build a **Screen Inventory** before reviewing anything.
- **Review every screen.** No sampling. Include **modals, empty, error, loading, permission-denied, and offline** states.
- **Do NOT change** API contracts, DB/list schemas, field keys, or exported column names. Flag schema ideas separately.
- **Do NOT write code until the review is approved**, unless I say **"implement."**
- **Ground every finding** in `file path + component + line range`. No generic advice.
- **Unclear?** List it under **Questions / Assumptions** — never guess silently.

## PART 1 — SCREEN INVENTORY

| # | Screen / View | Component file | Route / Trigger | Primary user task | Frequency (est.) | Entry points | Role(s) |
|---|---|---|---|---|---|---|---|

Then provide:

- **Navigation map** (Mermaid flowchart) — all screens, modals, drawers, back paths, dead ends
- **Component tree summary** — layout shell → pages → major composite components
- **Dead/orphan screens** — reachable only by URL, unused, or duplicated

## PART 2 — PER-SCREEN REVIEW (repeat for EVERY screen)

### 2.1 Click & Interaction Audit

For each **primary task**:

- **Map current path** step by step (click, type, tab, scroll, hover, wait, confirm)
- **Count:** clicks · keystrokes · scrolls · context switches · modal opens · load waits
- **Identify waste:**
  - Duplicate clicks (select → open → confirm same record)
  - Confirmations on non-destructive/reversible actions
  - Save → close → reopen loops
  - Re-entering data the system already knows (user, team/unit, date, IDs, location)
  - Dropdowns with 1–3 options (→ segmented control/toggle)
  - Dropdowns with 20+ options without type-ahead
  - Fields that could default (prior record, current user, current context, today)
  - Forced back-to-list before next record (→ next/prev, split view)
  - Separate Edit mode where inline edit works
  - Daily-use actions hidden in `…` menus or hover-only controls
  - Scrolling required to reach primary action (→ sticky action bar)
  - Collapsed tabs/accordions hiding status (→ status in header/badge)
  - Filters/sort/view not persisted between sessions
  - Hover-dependent UI (fails on touch)
  - Pagination where virtualized scroll or search is faster
  - Full-page reload/refetch after small edits
- **Optimized path + new counts**, e.g.:
  `Mark item complete: 6 clicks → 1 click (inline checkbox, autosave, optimistic update)`

### 2.2 Data Entry Efficiency

- Smart defaults, auto-fill, carry-forward from prior record
- **Debounced autosave + visible "Saved ✓"** where safe; draft state where not
- Keyboard flow: tab order, Enter submit, Esc close, shortcuts for top 3 actions
- Bulk actions (multi-select update, bulk status change)
- Right input type: date picker vs. typed, toggle vs. checkbox vs. Yes/No/NA segmented
- Validation inline, on blur, plain language — never submit-only

### 2.3 Dashboard-Specific Review

- **Glanceability:** can the top 3 questions be answered in **< 5 seconds** without clicking?
- **KPI/tiles:** clickable → filtered drill-down? Definitions/tooltips available?
- **Filters:** visible active-filter chips, one-click clear, saved views, URL-synced state
- **Tables/grids:** sticky headers, column resize/hide, density toggle, sort indicators, inline status, row actions visible
- **Charts:** necessary vs. decorative; labeled axes; not color-only; data table alternative
- **Real-time:** refresh cadence, "last updated" timestamp, change highlighting without layout jump
- **Exceptions-first:** overdue/at-risk/blocked items surfaced to top automatically

### 2.4 Visual Design & Professionalism (score 1–5, justify)

- **Visual hierarchy** — most important info dominant
- **Information density** — fits expert users; no wasted whitespace or clutter
- **Typography** — consistent scale, ≤ 2 weights/region, `tabular-nums` for numbers/times
- **Color** — semantic system (status/risk/overdue/complete), not color-only, contrast ≥ 4.5:1
- **Spacing & alignment** — consistent scale, grid alignment
- **Component consistency** — buttons, badges, inputs, tables, cards identical across screens
- **Iconography** — single set, consistent size/stroke, labels on critical actions
- **States** — skeletons (not spinners), helpful empty states, actionable errors, success feedback
- **Host fit** — looks native in host (SharePoint/Teams/etc.), respects theme, no style bleed

### 2.5 Safety & Cognitive Load

- **Record identity pinned** while editing (wrong-record risk)
- Destructive actions guarded; reversible actions use **undo toast** not confirm dialogs
- Status at a glance: completion %, overdue, flags, blockers
- **Interruption recovery:** state preserved on navigate-away/refresh? Draft indicator?
- Consistent terminology and abbreviations across screens
- No internal/dev labels, raw IDs, or enum values exposed to users
- Concurrency: two users editing same record — conflict detection/messaging?

### 2.6 Accessibility (WCAG 2.2 AA)

- Keyboard-only operable, visible focus, logical order, modal focus trap + return
- ARIA roles/labels on custom controls, grids, badges, charts
- Target size ≥ 24×24 px (≥ 44×44 for primary actions)
- `aria-live` for autosave, status changes, toasts
- Respects `prefers-reduced-motion`; zoom to 200% without loss

### 2.7 Per-Screen Output Format

```
### Screen: [Name] — File: [path]
**Purpose:** ...
**Scores:** Click efficiency _/5 · Visual _/5 · Consistency _/5 · Safety _/5 · A11y _/5
**Click waste found:**
| Task | Current path (count) | Optimized path (count) | Savings | Effort (S/M/L) |
**Visual/UI issues:**
| Issue | Location (file:line) | Severity (H/M/L) | Fix | Code change |
**Safety flags:** ...
**Top 3 fixes (impact ÷ effort):** ...
```

## PART 3 — CROSS-SCREEN / SYSTEM REVIEW

### 3.1 Design System Consistency

- Inventory every **button, badge, input, select, card, table, modal, toast** variant → flag duplicates/near-duplicates
- Check theme/config tokens (color, spacing, radius, shadow, type). Flag hard-coded hex and arbitrary values
- Recommend **minimal token set + shared `/components/ui/` library:** Button, StatusBadge, Field, Select/Combobox, SegmentedControl, Card, DataTable, Modal/Drawer, Toast, EmptyState, Skeleton, FilterBar, KpiTile
- Recommend variant tooling if missing (e.g., `class-variance-authority` + `tailwind-merge` + `clsx`)

### 3.2 Navigation & Information Architecture

- Shortest path for list → detail → action?
- Recommend where fitting: **persistent record context**, **split view (list + detail)**, **command palette (Ctrl+K)**, **next/prev record**, deep links
- Are top actions reachable directly from list rows/cards?
- Nav depth: anything > 2 levels for daily tasks → flag

### 3.3 History / Longitudinal Data (if applicable)

- History scannable (timeline vs. table)?
- Prior records/events within **1 click** of current record?
- Trends/repeat patterns surfaced automatically?

### 3.4 Technical Hygiene (Vite + React)

- **Rendering:** unnecessary re-renders, missing `memo`/`useMemo`/`useCallback` on heavy lists, virtualization for 100+ rows, context causing app-wide re-renders
- **Data:** duplicate fetches, missing caching (React Query/SWR), no optimistic updates, waterfall requests, over-fetching
- **Bundle:** heavy deps, missing route-level code-splitting (`React.lazy`), unpurged CSS, large icon imports
- **Build:** Vite config, env vars, prod vs. dev-only behavior, source maps, host-embed compatibility
- **Styling:** CSS reset/preflight conflicts with host, scoping/prefixing, theme/dark-mode support
- **Responsive:** narrow columns, tablet, large wall display, Teams tab (if used)
- **Errors:** error boundaries, 401/403/429/500, network loss, retry/backoff messaging
- **State:** URL-synced filters, persisted preferences, stale-data handling

### 3.5 Automation Opportunities

Where UI work can be **removed entirely**:

- Auto-populate from existing systems/exports instead of manual entry
- Triggers/alerts (Power Automate, server jobs) on status/time rules
- Auto-calculated fields (durations, days-since, windows, completion %)
- Rules auto-setting N/A or defaults by record type/status
- Copilot/AI assist: summaries, suggested next action, anomaly flags

## PART 4 — DELIVERABLES

- **Screen Inventory** + Mermaid navigation map
- **Per-screen reviews** (2.7 format) — every screen
- **Click Savings Summary** — all tasks, before/after, **total clicks + est. minutes saved per user per shift** (use volume assumptions)
- **Design System Recommendations** — tokens + component list + before/after for 2 components
- **Prioritized Backlog** — single ranked table:

| Rank | Item | Screen(s) | Type (Click/Visual/Safety/A11y/Perf/Tech) | Impact (H/M/L) | Effort (S/M/L) | Data/Downstream risk (Y/N) |
|---|---|---|---|---|---|---|

- **Quick Wins** — each < 1 hour
- **Bold ideas** — 3–5 unconventional redesigns (zero-click status from data, single-screen board, keyboard-first mode, exceptions-only view, auto-advance workflow)
- **Questions / Assumptions** — anything not determinable from code

## QUALITY BAR

- **Specific > generic** — every finding has file, component, line, concrete fix
- **Measure clicks** — numbers, not adjectives
- **Frontline lens** — if it doesn't save time, reduce errors, or reduce mental load, rank lower
- **Professional ≠ decorative** — clean, calm, high-contrast, consistent; no gimmicks or slow animation
- **Verify completeness** — every inventoried screen reviewed; every Part 4 deliverable present
