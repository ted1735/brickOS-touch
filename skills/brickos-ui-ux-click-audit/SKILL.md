---
name: brickos-ui-ux-click-audit
description: >-
  Specialized UI/UX, Click-Efficiency, and Audio/Visual Asset Integrity Audit skill for brickOS Studio Web Dashboard.
  Enforces single-click icon auditioning/previewing, keyboard lightbox navigation, direct Nextcloud WebDAV
  asset routing, DAW 4-track real stem streaming, and transparent logo branding across the platform.
---

# brickOS Dashboard Specialized UI/UX & Click-Efficiency Audit Skill

This workspace-specific skill encodes the architectural, interaction-efficiency, branding, and asset-streaming standards for **brickOS Studio** (`brickOS-webdashboard`).

---

## 1. brickOS Studio Context & Stack

- **Stack:** React 19 · TypeScript · Vite · TailwindCSS v4 · Lucide Icons
- **Domain:** Master Music Production Workspace & Autonomous Label OS
- **Core Workflows:**
  1. **Mini-DAW 4-Track Mixer (`MiniDawMixerTab.tsx`)**: Real Web Audio API multi-channel mixing, stem isolation, dynamic EQ/limiter, and synchronized 4-track WebDAV playback.
  2. **Nextcloud WebDAV Asset Hub (`NextcloudWebDavFileExplorer.tsx` / `NextcloudBentoSyncTab.tsx`)**: High-speed browsing, direct icon auditioning/previewing, batch matching, and metadata injection for `/Music-Production/`.
  3. **VideoExpress / Veo Storyboard Studio (`VeoTab.tsx` / `AIGenerationModal.tsx`)**: 4K visual generation, multi-aspect ratio prompt builders, character consistency locks.
  4. **Catalog & SOP Command (`TrackDetailModal.tsx` / `CatalogTab.tsx`)**: 27-track Nashville SOP standards, OBI funnel analytics, lyrics & theological guardrail verification.
  5. **Global Audio Dock & Mini-Player (`SideNavigationPanel.tsx`)**: Sticky real-time audio playback bar, waveform visualizer, volume/mute/seek controls.

---

## 2. Mandatory Interaction & UX Rules

### 2.1 Single-Click Direct Icon Actions (Zero Redundant Buttons)
- **Audio Files (`.wav`, `.flac`, `.mp3`, `.m4a`):**
  - Clicking the audio file card icon **immediately auditions/toggles playback** of the real audio stream.
  - No separate "View" or "Details" buttons should clutter the card.
- **Image & Video Assets (`.png`, `.jpg`, `.webp`, `.mp4`):**
  - Clicking the image thumbnail or video icon **immediately opens the fullscreen preview lightbox**.
- **Folders:**
  - Clicking the folder icon navigates directly into the directory.

### 2.2 Lightbox Keyboard Navigation & Rapid Preview
- Whenever an image/asset popup preview is open:
  - `ArrowLeft` (`←`) navigates to the previous previewable item in the current directory or catalog.
  - `ArrowRight` (`→`) navigates to the next previewable item.
  - `Escape` closes the preview modal immediately.
  - On-screen hover arrows (`<` and `>`) are rendered for intuitive touch and mouse navigation.

### 2.3 Audio Integrity (No Dummy Sine Wave Synth Fallbacks When Real Streams Exist)
- All playback engines (`audioEngine.ts`, `MiniDawMixerTab.tsx`, `SideNavigationPanel.tsx`, `NextcloudBentoSyncTab.tsx`) must resolve real audio streams via `/api/nextcloud/stream?path=...`.
- Catalog tracks must map to the verified Nextcloud folder names in `/Music-Production/` (e.g., `Brick-by-Brick`, `The-Masters-Hand`, `Every-Candles-Victory`, `Nothing-But-the-Blood`, `Meet_Me_Here`, `Glitter`, `Calvary-Grit`, `The-Blueprint-and-The-Blood`, `Unity-In-The-Friction`, `The-Anchor`, `The-Final-Say`, `In-Our-Veins`, `We-Bow-We-Shout`, `Through-the-Valley-Or-the-Flame`, `Ghost-In-The-Machine`, `Milestone`, `Breath-and-Bone`, `Blindfold-Blessing`, `Trading-In-The-Mask`, `Neverending-Whats-Next`, `00-Active_Projects`).
- The DAW "Play 4-Track" button must stream real audio stems and apply modern styling.

### 2.4 Unified Site Logo & Branding
- Use the transparent brand asset `/brick-logo.webp` (`brick-logo-transparent1000_1.webp`) across:
  - Browser tab favicon (`<link rel="icon" href="/brick-logo.webp" />`).
  - Side navigation header logo badge.
  - Splash banners, export headers, and video watermarks.
