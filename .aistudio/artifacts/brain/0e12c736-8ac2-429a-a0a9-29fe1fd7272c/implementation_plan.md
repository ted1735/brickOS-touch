# Implementation Plan: Mini-DAW Automation Lanes & Collapsed Sidebar Balance

## Overview
This plan implements two requested features:
1. **Interactive Automation Lanes in Mini-DAW**: Add expandable lanes for Volume (dB / gain) and Panning (L100 to R100) on each mixer track with draggable breakpoint envelope nodes, shape presets (Fades, Swell, Ducking, AutoPan), and dynamic playback engine integration.
2. **Balanced Collapsed Sidebar**: Re-architect the collapsed sidebar into a single clean vertical column with uniform icon dimensions, a single concise word beneath each icon, and an aligned floating card on hover containing a short description.

---

## 1. Mini-DAW Mixer Expandable Automation Lanes

### Data & Architecture
- **Automation Model (`src/types/index.ts` / `MiniDawMixerTab.tsx`)**:
  - `AutomationNode`: `{ id: string; timePercent: number; value: number }` (timePercent 0–100%, value 0–100 or -100 to +100 for pan).
  - `TrackAutomationState`:
    - `isExpanded: boolean`
    - `activeParameter: 'volume' | 'pan'`
    - `volumeNodes: AutomationNode[]` (default flat 80% line)
    - `panNodes: AutomationNode[]` (default center 0 line)
    - `isBypassed: boolean`
- **Interactive Breakpoint Canvas Component**:
  - SVG/Canvas timeline lane underneath the waveform/fader controls.
  - Interactive click-to-add node, drag-to-move node with smooth linear/bezier connection curves.
  - Visual grid lines (0%, 25%, 50%, 75%, 100% time markers).
  - Real-time playhead scrubber line tracking playback progress.
- **Envelope Presets**:
  - Volume: *Linear Fade In*, *Fast Fade Out*, *Center Swell*, *Sidechain Ducking (4-beat dip)*, *Flat Reset*.
  - Pan: *Left-to-Right Sweep*, *Ping-Pong Sine*, *Wide Stereo Swell*, *Hard Center Reset*.
- **Audio Engine Integration (`audioEngine.ts`)**:
  - Connect dynamic interpolation to Web Audio `GainNode` and `StereoPannerNode` during playback loop so the automation dynamically modulates audio playback in real-time.

---

## 2. Collapsed Sidebar Redesign

### Current Deficiencies in Collapsed View
- Currently splits into an unbalanced 2-column grid (`T1` and `T2`) with uneven icon sizes (28px to 32px), inconsistent padding, and no visible text labels.
- Catalog items (Projects, Sessions, Assets) sit in a separate unaligned group with dot badges that clip.

### Balanced Design Specification
- **Single Vertical Column**:
  - Fixed, balanced width (68px) with centered layout.
  - Uniform button containers (42px × 42px) with 18px icons, rounded corners, and consistent subtle borders.
  - Single small word (8px-9px uppercase/font-mono or clean sans) displayed right under each icon (e.g. `EXPAND`, `PROJECTS`, `SESSIONS`, `HOME`, `WRITE`, `MIXER`, `MASTER`, `STEMS`, `PROMPTS`).
- **Rich Hover Card (`onMouseEnter`)**:
  - Floating card pinned to the right of the hovered icon.
  - Displays:
    - Uniform icon badge + Single-word title
    - Short description of the workspace / tool
    - Keyboard shortcut tag (if available)
    - Active status badge when the tab is currently open
- **Unified Visual Hierarchy**:
  - Top: Collapse/Expand toggle
  - Divider
  - Primary Catalog toggles (`Projects`, `Sessions`, `Assets`)
  - Divider
  - Studio Workspaces (`Home`, `Lyrics`, `Mini-DAW`, `Master`, `Stems`, `Prompts`, `Matrix`)
  - All icons strictly 18px with matching stroke-width and padding.

---

## 3. Verification & Testing
1. **Compilation**: Run `compile_applet` and `lint_applet` to ensure zero TypeScript or syntax regressions.
2. **DAW Automation Testing**:
   - Verify expanding/collapsing lanes on Channel 1 (Vocals), Channel 2 (Drums), Channel 3 (Bass), Channel 4 (Instruments).
   - Test adding, dragging, and deleting breakpoint nodes.
   - Apply preset envelopes (Fade Out, Ducking, AutoPan) and verify audio engine gain/pan modulation during playback.
3. **Sidebar Testing**:
   - Collapse the sidebar and inspect vertical alignment, spacing, icon sizing, and single-word labels.
   - Hover across every icon in light and dark mode to confirm balanced tooltips without clipping.
