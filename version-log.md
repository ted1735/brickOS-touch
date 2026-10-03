# brickOS Sovereign Studio — Version Log

All major milestones, song creations, and revision checkpoints in the studio increment by **+0.1** per revision.

---

## [v1.0] — Initial Studio Baseline & Canonical Tracks
- **Date**: 2026-09-01
- **Author**: Ted Moyer / BRICK Records
- **Milestone**:
  - Initial baseline release of brickOS Sovereign Music Production Workspace.
  - Setup 26 canonical tracks spanning 4 EPs:
    - *EP 1: The Restoration Project*
    - *EP 2: The Conflict Suite*
    - *EP 3: War Room Anthems*
    - *EP 4: The Surrender Sessions*
  - Mini-DAW multi-track mixer with Web Audio API synthesis.
  - Suno v5.5 4-Block compilation engine.

---

## [v1.1] — Firestore Real-Time Persistence & Nextcloud WebDAV
- **Date**: 2026-09-15
- **Milestone**:
  - Cloud Firestore real-time database synchronization for tracks and composition sessions.
  - Nextcloud WebDAV Bento folder 207332 stem matcher for lossless linear PCM 24-bit / 48kHz audio assets.
  - UVR5 stem separation workflows (BS-Roformer, Kim-Inst-v2).

---

## [v1.2] — Nashville SOP Audit Rules & Cliché Filter
- **Date**: 2026-09-20
- **Milestone**:
  - Embedded SOP Rule Engine to audit lyrics against tired Christian clichés.
  - Enforced 3:1 Sonic Scar baseline and the mandatory Throne Room Pivot by the bridge.
  - Multi-pane comparative lyric workbench (2-Pane and 3-Pane comparative views).

---

## [v1.3] — 2026 YouTube SEO SOP Standard & "The Work Ain't Done"
- **Date**: 2026-09-24
- **Milestone**:
  - Added new frontline healthcare ministry anthem: **"The Work Ain't Done" (TRK-27)** with 8 production revisions.
  - Upgraded YouTube SEO Lens to comply with 2026 SOP:
    - Front-loaded primary keywords in title (< 60 chars, primary keyword in first 40).
    - 300-500 word comprehensive description with chapter markers starting at 0:00.
    - 10-15 high-intent tags.

---

## [v1.4] — Tri-Modal Prompt Engineering Library & Storyboard Pipeline
- **Date**: 2026-09-25
- **Milestone**:
  - Built dedicated `PromptEngineeringLibraryTab.tsx` managing Image, Video (Veo 3 / Grok), and Audio (Suno v5.5) prompts.
  - Added the complete 30-shot visual and 12-short video storyboard for *Meet Me Here* (MMH).
  - Generalized the 4-Phase Storyboard Pipeline across all catalog songs.

---

## [v1.5] — Shared Standardized Song Creation Schema & Incremental (+0.1) Engine
- **Date**: 2026-09-25
- **Milestone**:
  - Created `/src/schema/songProductionSchema.ts` establishing a shared, standardized JSON schema for song metadata, theological treatment, audio production parameters, and visual storyboards.
  - Enforced strict **+0.1** version incrementation across:
    - AI audit revisions (Pre-AI snapshot and Post-AI commit).
    - Manual checkpoints saved in the Lyric Engine.
    - Track updates committed from studio panels.
  - Upgraded `CreateProjectModal.tsx` to automatically populate:
    - Complete 4-phase storyboard prompts (Image and Video) generated from the track's theological thesis.
    - Suno v5.5 4-Block audio parameters and negative prompts.
    - Initial v1.0 standard revision baseline.
  - Established `future-dev.md` to track planned architecture improvements and future revisions.

---

## [v1.6] — VideoExpress.ai Talking Avatar Agent & Architectural Database Evaluation
- **Date**: 2026-09-25
- **Milestone**:
  - Integrated full skills and functions from `strontiumplatform/VideoExpress.ai-Full-Length-Consistent-Character-Realistic-Talking-Avatar-Video-Workflow`.
  - Built dedicated `VideoExpressAgentTab.tsx` module:
    - **Consistent Character Mode**: Reference image locking with immutable seeds, character archetypes (The Nashville Engineer, The Sovereign Preacher, The Frontline Healer, The Cedar Craftsman), and negative prompt guards.
    - **Strict <100 Chars per Line Gate**: Deterministic sentence splitter ensuring voiceover lines never drift or cause lip-sync warping.
    - **CloneVoice.ai Integration**: Voice clone assignment matching studio vocalists with configurable dead-air head/tail trimming (0.1s - 0.5s) for viral vertical retention.
    - **Deterministic Evidence Table**: Full gate verification grid validating clip durations, character limits, locked reference status, and audio sync before render.
    - **Self-Contained `SYSTEM_PROMPT.md`**: Live markdown generator to paste directly into AI browser agents (Claude Code, ChatGPT, Codex) to drive VideoExpress.ai without extra tools.
  - Added fast-access shortcut in `SideNavigationPanel.tsx` and Tier 2 navigation header.
  - Evaluated architectural trade-offs: File-based Nextcloud WebDAV + Firestore versus Relational SQL in Nextcloud.

---

## [v1.7] — Workflow Factory Meta-Styles, Browser Automation Playbook, UI Version Dynamic Display
- **Date**: 2026-09-25
- **Milestone**:
  - Fully mapped and integrated `factory/WORKFLOW_FACTORY.md` into `VideoExpressAgentTab.tsx`:
    - 6 Core Meta-Workflow Styles: *Talking Avatar (Photorealistic)*, *3D Cinematic Animated (Pixar/Unreal)*, *UGC Frontline / Devotional (Raw Mobile)*, *Vox-Style Motion Documentary*, *Stickman / Whiteboard Explainer*, and *Paper Cutout & Stop-Motion*.
    - Integrated the 2-Question AI Agent interview process (Character identity & Topic/Aesthetic direction) with one-click song thesis auto-fillers.
    - Added adaptive prompt transformer tailoring camera moves, negative prompts, aesthetic tokens, and duration pacing per style.
  - Fully mapped and integrated `references/browser-automation.md`:
    - Verified DOM Selectors & UI Action matrix covering authentication, project setup, consistent character toggles, seed locking, script chunking, lip-sync triggers, timeline placement, and dead-air trimming.
    - Built-in Playwright / Puppeteer automation script generator for programmatic headless execution.
    - Implemented automated error recovery protocols (generation timeout recovery, viseme drift prevention, dead-air trimming rules).
  - Purged all SQL/PostgreSQL items from `future-dev.md` per explicit user directive.
  - Updated studio header version display:
    - Removed the static "v5.5 SOVEREIGN" badge.
    - Bound both `NavigationHeader.tsx` and `brickos_music_studio_ai_production_workspace.tsx` to dynamic `CURRENT_STUDIO_VERSION` (`v1.7`).

---

## [v1.8] — Complete Operational Guide, foundations.md Axioms & Interactive In-App Video Engine
- **Date**: 2026-09-25
- **Milestone**:
  - Incremented studio version to **`v1.8`**.
  - Built interactive **"How To Create"** operational guide in `VideoExpressAgentTab.tsx`:
    - Documented both **Method A (Direct In-App Studio Workflow)** and **Method B (Autonomous AI Agent Browser Execution)**.
    - Added interactive 1-click **"Run In-App Production"** simulation engine tracking live progress across all 6 phases: reference seed lock -> script chunking -> viseme synthesis -> dead-air trimming -> Evidence Table validation -> 1080x1920 MP4 packaging.
    - Added one-click **"Sync to Nextcloud WebDAV"** linking rendered video reels to folder 207332 (`/Music-Production/VideoExpress-Avatars/`).
  - Integrated all 5 core mathematical principles from `factory/FOUNDATIONS.md`:
    - Axiom 1: Single-Prompt Invariant (Zero human micro-management).
    - Axiom 2: 60-Second Vertical Retention Formula (Hook, Tension, Stillness Pivot, Sovereign Breakthrough, Anchor).
    - Axiom 3: The <100 Character Lip-Sync Invariant (Viseme drift physical limit).
    - Axiom 4: Reference Face & Geometric Invariants (Seed pinning, negative shielding, 50mm portrait lens).
    - Axiom 5: Deterministic Evidence Table Gate (Auditable verification before completion).

---

## [v1.9] — BlockSuite Infinite Whiteboard, Firestore Sync & Nextcloud WebDAV Backups
- **Date**: 2026-09-27
- **Author**: Ted Moyer / BRICK Records
- **Milestone**:
  - Incremented studio version to **`v1.9`**.
  - **BlockSuite Isomorphic Dual-Mode Editor Flow**:
    - **Edgeless Mode (Infinite Whiteboard Canvas)**:
      - 2D Infinite Canvas with smooth panning, continuous zoom (25% - 200%), zoom fit-to-screen, and multiple grid themes (AFFiNE dots, blueprint, graph grid, blank).
      - Visual block palette: Song Sections ([Verse], [Chorus], [Bridge], [Pre-Chorus], [Outro]), Sticky Notes, Chord Charts, Theological SOP Audits, and Suno AI Prompt blocks.
      - Dynamic visual SVG Bezier connectors with direction arrowheads linking song sections.
      - Free card drag & drop repositioning, resizing, color coding, inline editing, and deletion.
      - Real-time Canvas Radar / Minimap.
    - **Page Mode (Structured Linear Document)**:
      - Clean, linear, distraction-free document editor rendering the exact same underlying block tree with zero data loss.
  - **Firebase Firestore Persistent Cloud Database**:
    - Real-time bidirectional synchronization with collection `whiteboard_canvases`.
    - Auto-save debounce with live Firestore connection status badge.
    - Updated `firestore.rules` and deployed to user project.
  - **Nextcloud WebDAV Export & Backup Engine**:
    - One-click **"Backup to Nextcloud"** sending formatted Markdown and BlockSuite JSON to Nextcloud WebDAV (`/Music-Production/brainstorming/`).
    - Standard browser download export options for `.md` and `.json`.
  - **Deep Lyric Suite & Studio Integration**:
    - One-click **"Compile to Lyrics"** compiling whiteboard blocks into active song lyrics.
    - Added **"Open in Whiteboard"** quick launcher to the Lyric Suite header action bar.

---

## [v2.0] — Mastering Rack Signal Chain Flow Indicator & Whiteboard Storyboard Thumbnail Linking
- **Date**: 2026-09-27
- **Author**: Ted Moyer / BRICK Records
- **Milestone**:
  - Incremented studio version to **`v2.0`**.
  - **Mastering Rack Visual Signal Chain Flow Indicator**:
    - Built interactive signal chain flow indicator bar: `Input ➔ [Stage 1] ➔ [Stage 2] ➔ [Stage 3] ➔ Master Out`.
    - Implemented full HTML5 drag-and-drop reordering with drag handle indicators and active stage drop zones.
    - Added single-click directional stage swap buttons (`◀` / `▶`) for precision module nudging.
    - Dynamic CSS grid reordering applied to EQ, Compressor, and Limiter rack cards in real-time.
    - Added one-click **"Reset Order"** button returning the signal path to default `EQ ➔ Compressor ➔ Limiter`.
    - Signal chain routing order persists across reloads via `localStorage` (`brickos_mastering_module_order`).
  - **BlockSuite Whiteboard Storyboard Thumbnail Images & Connector Linking**:
    - Maintained exact whiteboard layout, coordinates, connectors, and themes per user instruction.
    - Added **"+ Thumbnail Image"** insertion button with icon to toolbar palette.
    - Built **Storyboard Thumbnail Image Modal** allowing image URL input, sample presets (Nashville Woodshop, Candlelit Piano, Analog Console, Cathedral), title, shot number badge (`Scene 1 / Shot A`), and notes.
    - Created `thumbnail_asset` card rendering in **Edgeless Mode** with 16:9 aspect preview, shot badge, scene notes, color selector, and card removal.
    - Enabled full SVG connector linking (`LinkIcon`) allowing storyboard thumbnails to link to lyrics, chord cards, or other scenes with free dragging across the 2D infinite canvas.
    - Rendered linear storyboard cards with image previews in **Page Mode**.

---

## [v2.1] — Studio Phase Workflow Lenses, Command Palette, Interactive Waveforms & Master Package Exporter
- **Date**: 2026-09-28
- **Author**: Ted Moyer / BRICK Records
- **Milestone**:
  - Incremented studio version to **`v2.1`**.
  - **De-Chaotifying Studio Phase Workflow Switcher (Stage Lenses)**:
    - Integrated Phase Switcher in top navigation with 4 dedicated stage lenses:
      - **1. Composition**: Brainstorming Whiteboard, Lyric Suite & Suno Engine, Song Version Matrix, Prompt Library.
      - **2. Sound & Mix**: Mini-DAW Mixer, Senior Mastering & LUFS, Nextcloud 207332 Sync, Relational Matrix.
      - **3. Visuals & Avatar**: VideoExpress.ai Talking Avatar, Visual & Veo 3 Studio, NightCafe Runner.
      - **4. Release & Outreach**: Master Pipeline Dashboard, YouTube SEO 2026, OmniPost Outreach, Ministry Charts.
      - **All Views**: Unfiltered full 18-tab grid.
    - Smooth animated tab transitions and contextual tab counts per stage lens.
  - **Spotlight Studio Command Palette (`Ctrl+K` / `Cmd+K`)**:
    - Quick-switcher modal inspired by Raycast / macOS Spotlight.
    - Fuzzy search across all 26 canonical tracks, 18 studio tabs, and SOP quick actions.
    - Full keyboard navigation with `↑`, `↓`, and `Enter`.
  - **Focus / Zen Mode (`Z`)**:
    - One-key toggle hiding sidebars and chrome to eliminate visual clutter and maximize creative flow.
  - **Nashville SOP Track Lifecycle Stepper**:
    - Interactive 7-node visual pipeline bar (`Idea ➔ Lyrics ➔ Stems ➔ Mastered ➔ Visuals ➔ Selah Gate ➔ Distributed`).
    - One-click navigation to each lifecycle stage workbench.
  - **Slide-Over Studio Copilot Drawer (`Ctrl+J` / `Cmd+J`)**:
    - Persistent right slide-over panel housing Gemini Theological Co-Producer, Live Google Search Grounding, and Telemetry Daemon stats.
  - **brickOS-Automations Feature Ingestion**:
    - **Interactive Web Audio Waveform Visualizer**: Scrubbable playhead, transient peaks, and -1.0 dBTP ceiling indicator embedded in the Senior Mastering Suite.
    - **One-Click Master Deliverables ZIP/JSON Package Exporter**: Generates complete distribution package with 24/48 WAV master, 4-track stems, lyrics `.md`, YouTube SEO metadata, and Nextcloud rclone sync commands.
    - **24-Hour Selah Prayer Gatekeeper (`SelahPrayerGateModal`)**: Mandatory 24-hour prayer reflection clock and scripture anchor guarding master release.
    - **Suno & NightCafe 1-Click Automation Userscript HUDs**: One-click userscript code installer and copy HUD directly accessible in Lyric Suite and NightCafe runner.
    - **Whiteboard ➔ VideoExpress Bridge**: Direct "To VideoExpress" button on storyboard thumbnail cards bridging scene prompts into the avatar director.
  - **Architectural Cleanup**:
    - Extracted monolithic inline tabs into clean, maintainable modular components (`VeoVisualsTab`, `NightCafeTab`, `TelemetryTab`, `StudioCopilotTab`, `SearchGroundingTab`).

---

## [v2.2] — Industry-Standard Section-by-Section A/B/X Critical Listening Engine & Universal Nextcloud Indexing Standard
- **Date**: 2026-09-28
- **Author**: Ted Moyer / BRICK Records
- **Milestone**:
  - Incremented studio version to **`v2.2`**.
  - **Universal Nextcloud Linking & Indexing Standard**:
    - Universalized ECV standard across all 27 canonical tracks in the master catalog (`/Music-Production/{PROJECT}/`).
    - Standardized 24-bit/48kHz WAV master prints, isolated 4-stems (BS-Roformer lead, choir/harmonies, instrumental bed, rhythm), 4K visual art, 9:16 vertical reels, and SOP documents.
    - Established `/skills/nextcloud-music-production-indexing/SKILL.md` enforcing the default behavior.
    - Added `/api/nextcloud/index-all-catalog` and `NextcloudBentoSyncTab` "Index All Projects" one-click action.
  - **Industry-Standard Section-by-Section A/B/X Critical Listening Engine (`SectionCriticalComparator.tsx`)**:
    - **Section-Locked Synchronized Auditioning**: Seamlessly loop and evaluate specific song sections (`[Chorus]`, `[Verse 1]`, `[Bridge]`, `[Outro]`) across 3 versions simultaneously.
    - **Zero-Latency Instant Hotkey Switching (`1`, `2`, `3` or `A`, `B`, `C`)**: Eliminates auditory memory decay (under 2-3 seconds) allowing critical, objective comparison of vocal presence, hook lift, and transients without playhead pause or glitch.
    - **LUFS Loudness Normalization Matching (-14.0 LUFS)**: Combats the Fletcher-Munson psychoacoustic illusion ("louder sounds better") with real-time automatic gain trim so decisions are based on arrangement, mix depth, and performance.
    - **Double-Blind ABX Audition Mode ("Blind Taste Test")**: Scrambles and masks version labels as Alpha, Beta, Gamma with reveal lock to eliminate confirmation bias.
    - **Multi-Factor Critical Listening Rubric**: 5-point evaluation across Vocal Presence (1-10), Dynamic Hook Punch (1-10), Lyrical Cadence & Rhyme (1-10), Mix Space & Low-End (1-10), and SOP Theological Conviction (1-10).
    - **Composite Master Arrangement Assembler**: Select winning takes per section across the entire song and assemble a cohesive "Frankenstein Master Cut" with 1-click export to the Lyric Suite.
    - **Authentic Catalog Alignment**: Corrected default version loading to bind directly to the imported master Google doc catalog (`TRK-01` to `TRK-27`).

---

## [v2.3] — A/B/C Audio Sync Playback Toggle, Pros & Cons Notes, and Transport Performance Optimization
- **Date**: 2026-09-29
- **Author**: Ted Moyer / BRICK Records
- **Milestone**:
  - Incremented studio version to **`v2.3`**.
  - **A/B/C Synchronized Playback Toggle (`syncPlayback`)**:
    - Added high-visibility **"Sync Playback: SIMULTANEOUS / INDEPENDENT"** toggle switch in the master comparison toolbar and hotkey (`P`).
    - When enabled, triggering Play/Pause on any individual channel starts or pauses all 3 tracks in frame-accurate lockstep.
    - Added contextual `SYNC` badges to each channel transport strip to indicate active parallel playback.
    - Preserves independent channel start/stop when toggled to `INDEPENDENT`.
  - **Dedicated Pros & Cons Evaluation Notes Engine**:
    - Embedded dedicated **Pros (Mix Strengths)** with emerald visual markers and 1-click praise tags (`+ Vocal Clarity`, `+ Punchy 808`, `+ Wide Stereo`, `+ Warm Tone`, `+ Dynamic Lift`).
    - Embedded dedicated **Cons (Drawbacks & Fixes)** with rose visual markers and 1-click critical flags (`- Harsh Treble`, `- Boxy Mids`, `- Muddy Bass`, `- Vocal Sibilance`, `- Ear Fatigue`).
    - Embedded general engineering verdict and recommendation notes.
    - Automatically includes itemized Pros & Cons in the markdown Evaluation Report export.
  - **Transport Loop & CPU Performance Optimization**:
    - Refactored `requestAnimationFrame` playhead animation loop to sleep completely when all channels are paused, eliminating continuous 60fps state updates and dropping idle CPU load to 0%.
    - Verified TypeScript strict type safety (`tsc --noEmit` passing with 0 errors).

---

## [v2.4] — Global Master Volume Bus Fader, Universal 3-Theme Engine (Sun • Moon • Stars), and Studio Workflow Guide
- **Date**: 2026-09-29
- **Author**: Ted Moyer / BRICK Records
- **Milestone**:
  - Incremented studio version to **`v2.4`**.
  - **Mini-DAW Global Master Output Bus Channel Strip**:
    - Added dedicated **Master Output Bus Strip** in the stem mixer console controlling combined gain across all tracks.
    - Large tactile master fader with precision dB scaling (-∞ dB to +3.0 dB, 85% unity gain = 0.0 dB).
    - Dual stereo Master VU peak level meters (Left & Right) with reactive LED segments and clip warning indicator.
    - Master Mute toggle (`MUTE BUS`), Master Dim toggle (`-20 dB` monitor pad for ear fatigue protection), and Mono Sum compatibility check.
    - 1-click **"0 dB Unity"** gain reset.
  - **Universal 3-Theme Engine (Sun • Moon • Stars) with Tailwind**:
    - **Sun (Daylight Nashville)**: High-clarity light theme with crisp white cards, clean borders, and high legibility.
    - **Moon (Dark Studio)**: High-contrast OLED Obsidian dark theme tailored for pro-DAW production.
    - **Stars (Muted Starlight)**: Soft-contrast, low-fatigue midnight twilight theme (`#0c101c` base, `#131929` muted cards, gentle `#cbd5e1` silver text, and soft ambient pastel highlights) engineered for late-night critical listening and reduced ocular strain.
    - Immediate 1-click 3-way toggle button group (`Sun ☀️ • Moon 🌙 • Stars ✨`) in the main header, persistent across sessions via `localStorage`.
    - Universal CSS overrides in `index.css` letting Tailwind classes automatically morph across all screens, modals, and modules.
  - **Studio Workflow Guide & Stage Navigator (`StudioWorkflowGuide.tsx`)**:
    - Addressed visual overwhelm with an intuitive 5-step production roadmap:
      `1. Vision & Structure` ➔ `2. Lyrics & Suno v5.5` ➔ `3. A/B/C Audio Comparison` ➔ `4. Mini-DAW 4-Track Mix` ➔ `5. Master & Deliverables`.
    - Live "Where You Are" badge with one-click navigation between key phases.
    - Contextual "Next Recommended Action" prompt.
    - Integrated **Zen Focus Mode** toggle (`Focus: ON`) to hide extraneous sidebars and distractions.

---

## [v2.5] — Gemini 3.8 Flash Upgrade, Multi-Model Cascade Fallback, & Copilot Chat Fix
- **Date**: 2026-09-29
- **Author**: Ted Moyer / BRICK Records
- **Milestone**:
  - Incremented studio version to **`v2.5`**.
  - **Upgraded from Deprecated `gemini-3.5-flash` to `gemini-3.8-flash`**:
    - Standardized all basic text, chat, research, and co-producer tasks to **`gemini-3.8-flash`** as officially designated in `@google/genai` SDK guidelines.
    - Updated Co-Producer chat dropdown to feature `gemini-3.8-flash` (Fast & Cost-Effective), `gemini-3.1-pro-preview` (Deep Reasoning), and `gemini-3.1-flash-lite` (Ultra Low Latency).
    - Upgraded Google Search Grounding engine, Lyric Audit Engine, Automated Rewrite Engine, and 3-Way Comparative Audits to `gemini-3.8-flash`.
  - **Intelligent Multi-Model Cascade Fallback (`generateContentWithFallback`)**:
    - Resolved the issue where chat or co-producer would stall or fail on 503 high-demand spikes:
      `Preferred Model` ➔ `gemini-3.8-flash` ➔ `gemini-3.1-flash-lite` ➔ `gemini-2.5-flash`.
    - Guarantees instant, zero-hang responses even during upstream server demand surges.
  - **Fixed Silent Failure in Chat Interface**:
    - Fixed response status handling in `handleSendMessage`: non-OK HTTP responses now throw and render informative assistant notices rather than silently swallowing errors and leaving the user in an infinite thinking state.

---

## [v2.6] — Universal 3-Theme Architecture Enhancements, Direct Workbench Controls, & Theme Showcase
- **Date**: 2026-09-29
- **Author**: Ted Moyer / BRICK Records
- **Milestone**:
  - Incremented studio version to **`v2.6`**.
  - **Direct In-Workbench Theme Controls**:
    - Embedded `StudioThemeSelector` directly inside the **Studio Co-Producer AI workbench** header (`StudioCopilotTab.tsx`) with an inline active mode indicator and 1-click theme switcher.
    - Embedded `StudioThemeSelector` directly inside the **Lyrics Master Vault top toolbar** (`LyricsAndSunoTab.tsx`), so users never have to hunt for theme options while editing or auditing lyrics.
    - Embedded `StudioThemeSelector` in the slide-over **Studio Copilot Drawer** (`StudioCopilotDrawer.tsx`).
  - **Dedicated Studio Theme Showcase & Customizer Modal (`StudioThemeModal.tsx`)**:
    - Built interactive modal displaying live swatch comparisons, contrast metrics, and intended creative use cases for all 3 themes:
      - **☀️ Sun (Daylight Nashville)**: High-clarity light theme with crisp white cards, clean borders, deep slate typography, and warm amber accents.
      - **🌙 Moon (Pro-DAW Obsidian Dark)**: Control-room pitch-black OLED obsidian theme with glowing neon meters and high contrast.
      - **✨ Stars (Low-Fatigue Twilight Studio)**: Midnight celestial indigo (`#0a0e1a`) base, twilight slate surfaces (`#141a2e`), soft starlight lavender accents (`#c084fc`), and zero eye strain.
    - Quick trigger button with Palette icon (`🎨`) integrated across top header, workbench bars, and drawer.
  - **Universal CSS & Contrast Refinements in `index.css`**:
    - Fixed CSS cascade bug where solid primary buttons (`bg-indigo-600`, `bg-emerald-600`, `bg-purple-600`, `bg-amber-600`, `bg-gradient-to-r`) had their text turned dark in Sun mode. Solid action buttons now preserve crisp white text across all modes.
    - Differentiated Stars (Twilight) theme from Moon with distinct midnight indigo-violet hues (`#0a0e1a`, `#141a2e`, `#252d47`) and lavender badge tones.
  - **Global Theme Cycle Hotkey (`Shift+T` / `Alt+T` / `Alt+D`)**:
    - Instantly cycles between Sun ➔ Moon ➔ Stars anywhere in the studio with live toast notification confirmation (`☀️ Switched to Sun`, `🌙 Switched to Moon`, `✨ Switched to Stars`).
    - Documented shortcut in the interactive `KeyboardShortcutsOverlay.tsx` cheat sheet.

---

## [v2.7] — Interactive Nextcloud WebDAV File Explorer & Asset Management Engine
- **Date**: 2026-10-02
- **Author**: Ted Moyer / BRICK Records
- **Milestone**:
  - Incremented studio version to **`v2.7`**.
  - **Full-Featured Nextcloud WebDAV File Explorer (`NextcloudWebDavFileExplorer.tsx`)**:
    - Complete hierarchical directory navigation through remote Nextcloud WebDAV storage with breadcrumb navigation and up-one-level controls.
    - Quick-jump Song Project bookmarks sidebar automatically indexing canonical studio tracks (`Meet_Me_Here`, `Brick-by-Brick`, `Calvary-Grit`, `Every-Candles-Victory`, `00-Active_Projects`, etc.).
    - Dual display modes: **Grid View** with visual cards and media badges, and **List View** with sortable columns (Name, Size, Type, Date Modified).
    - Media-specific recognition: 24-bit PCM Master WAVs, Stems, MP3 references, Visual Artwork (with live image previews), Videos (MP4), and Lyric Sheets (Markdown).
    - Built-in sticky **Audio Audition Player** with playback scrubber, elapsed/total time, volume slider, mute, and loop toggles.
  - **WebDAV Remote File Operations**:
    - **`POST /api/nextcloud/browse`**: Remote directory introspection using WebDAV `PROPFIND` (Depth 1) with automatic categorization, breadcrumbs, and track association.
    - **`POST /api/nextcloud/create-folder`**: Native directory creation using WebDAV `MKCOL`.
    - **`POST /api/nextcloud/delete-item`**: Safe deletion of remote files or directories using WebDAV `DELETE` with safety guards against root deletion.
    - **`POST /api/nextcloud/move-item`**: Renaming and file relocation using WebDAV `MOVE`.
    - **`POST /api/nextcloud/upload-file`**: Direct file upload supporting base64 data encoding for audio stems, artwork, and documentation.
  - **Seamless Studio Integration**:
    - Integrated directly into `NextcloudBentoSyncTab.tsx` with a 1-click view switcher between the Live WebDAV File Explorer and Bento Catalog Matcher.
    - Added quick-access shortcut inside `SideNavigationPanel.tsx` under the Assets tab.
    - Added command shortcut in `StudioCommandPalette.tsx` for instant navigation.

---

## [v2.8] — Sovereign Nextcloud Fiber Backend, In-Memory Audio Cache, & Tailscale Funnel Integration
- **Date**: 2026-10-02
- **Author**: Ted Moyer / BRICK Records
- **Milestone**:
  - Incremented studio version to **`v2.8`**.
  - **LXC Container Resource Doubling & Linux OS Page Cache**:
    - Upgraded Nextcloud Debian LXC Container 120 on Proxmox hypervisor (`192.168.1.91`) from 4GB/2GB to **8GB RAM / 4GB Swap** live (`pct set 120 -memory 8192 -swap 4096`).
    - Dedicated ~7.2 GB free RAM to Linux kernel page cache (`buff/cache`), enabling repeated 24-bit/48kHz linear PCM WAV stems and sample packs to serve directly from memory at bus speeds with zero NVMe disk thrashing.
  - **MariaDB 1GB InnoDB Buffer Pool & NVMe Tuning**:
    - Created dedicated `/etc/mysql/mariadb.conf.d/99-nextcloud-tuning.cnf` allocating **1 GB InnoDB Buffer Pool** (`innodb_buffer_pool_size = 1G`) and setting `innodb_io_capacity = 2000` / `innodb_io_capacity_max = 4000` for WD Black NVMe storage.
    - Set `innodb_flush_log_at_trx_commit = 2` to eliminate transactional disk stalls.
    - Locked the entire `oc_filecache` table, file IDs, etags, and metadata indexes permanently in RAM for sub-millisecond WebDAV queries.
  - **PHP 8.2 Execution & 512MB OPcache + JIT Engine**:
    - Configured `/etc/php/8.2/mods-available/opcache.ini` with **512 MB memory consumption**, `max_accelerated_files = 30000`, and `interned_strings_buffer = 64MB`.
    - Enabled PHP 8.2 JIT compiler (`opcache.jit = 1255`, `opcache.jit_buffer_size = 128M`) to dramatically accelerate SabreDAV XML serialization during PROPFIND requests.
    - Enabled APCu local opcode/memory cache (`memcache.local` + `apc.enable_cli=1`).
    - Routed distributed caching and file locking through low-latency Redis Unix socket (`/var/run/redis/redis.sock`).
  - **High-Throughput Large-File & Audio Streaming Pipeline**:
    - Raised PHP `upload_max_filesize` and `post_max_size` from 8M/16M to **16 GB**.
    - Raised PHP `max_execution_time` and `max_input_time` to **3600s** (1 hour) and Apache `Timeout` to **3600s** to support multi-gigabyte stem archives.
    - Disabled PHP output buffering (`output_buffering = Off`) for zero-memory direct streaming of audio and video byte-ranges.
    - Capped Nextcloud chunked uploads at **99 MB** (`'files.chunked_upload.max_size' => 99000000`) in `config.php` to prevent HTTP 413 "Request Entity Too Large" errors on Cloudflare's 100MB proxy boundary.
  - **Rust High-Performance Push Daemon (`notify_push`)**:
    - Installed native `notify_push` v1.4.1 binary running as a dedicated systemd service (`127.0.0.1:7867`).
    - Configured Apache reverse proxy modules (`proxy`, `proxy_http`, `proxy_wstunnel`) routing `/push/` and `/push/ws`.
    - Passed all 6 verification checks in `occ notify_push:setup`. Replaces HTTP polling with instant real-time WebSocket push notifications for file and stem events.
  - **High-Frequency System Cron**:
    - Switched from slow Webcron to reliable system cron in `/etc/cron.d/nextcloud` executing every 5 minutes (`*/5 * * * * www-data /usr/bin/php -f /var/www/nextcloud/cron.php`).
  - **Tailscale Mesh & Public Funnel Integration**:
    - Configured Proxmox host `/etc/pve/lxc/120.conf` with `/dev/net/tun` bind mount and `cgroup2` device passthrough.
    - Connected Container 120 directly to the user's Tailscale tailnet as `nextcloud.mermaid-symmetric.ts.net` (`100.95.185.100`).
    - Published public endpoint via **Tailscale Funnel**: **`https://nextcloud.mermaid-symmetric.ts.net/`** with auto-provisioned Let's Encrypt TLS.
    - Created an unthrottled, zero-Cloudflare-limit 1 Gbps LAN pathway for uncompressed multi-track stem downloads and uploads.
  - **WebDAV Architectural Specification & Documentation**:
    - Created `docs/nextcloud-backend-integration-spec.md` detailing dual-route failover, on-demand/lazy-loading `Depth: 1` discovery, lean XML `<d:prop>` payloads (70% bandwidth reduction), ETag caching (`If-None-Match`), and byte-range audio scrubbing.

---

## [v2.9] — Client & Bridge Optimizations for Nextcloud Ultra-High-Speed & Redundant Mesh
- **Date**: 2026-10-02
- **Author**: Ted Moyer / BRICK Records
- **Milestone**:
  - Incremented studio version to **`v2.9`**.
  - **Dual-Route Active Mesh & Automatic Failover**:
    - **Primary Direct Mesh (`https://nextcloud.mermaid-symmetric.ts.net`)**: Configured as default primary connection across browser and bridge operations (~14 ms direct wire latency). Bypasses Cloudflare body and timeout limits, enabling direct multi-gigabyte stem package transfers and unconstrained audio downloads.
    - **Secondary Edge Proxy (`https://nextcloud.moyercloud.com`)**: Automatically switches transparently if two consecutive connection attempts on the primary route fail. Automatically fails back to the primary Tailscale route as soon as a healthy probe returns.
  - **High-Throughput Connection Pooling (Undici)**:
    - **Direct Keep-Alive Agent (`primaryUndiciAgent`)**: Dedicated pool maintaining up to 64 concurrent persistent HTTP/2 & HTTP/1.1 connections to eliminate TCP and TLS renegotiation delays when fetching parallel stem packs.
    - Idle keep-alive timeout extended to 600 seconds (10 minutes) with request timeouts configured for 3,600 seconds (1 hour) matching server PHP limits.
    - **Linux Buffer Cache Audio Streaming (`Range: bytes=...`)**: The `/api/nextcloud/stream` proxy passes through client byte-range headers directly to Nextcloud, serving HTTP 206 Partial Content slices directly from Linux RAM page cache without reading full WAV files into memory.
  - **RFC 4918 Depth: 1 Lazy-Loading & Lean XML Payloads**:
    - **Targeted Lazy Queries**: PROPFIND calls strictly request `Depth: 1`, preventing deep recursive tree traversals. The targeted `/api/nextcloud/track-assets` endpoint queries a specific track's `/stems` folder directly without catalog-wide scans.
    - **Lean XML Properties**: Suppressed `<d:allprop />` in favor of requesting only player-relevant properties (`d:getlastmodified`, `d:getcontentlength`, `d:getcontenttype`, `d:getetag`, `d:resourcetype`, `oc:fileid`, `oc:size`), minimizing MariaDB InnoDB buffer pool churn.
  - **Zero-Latency In-Memory PROPFIND Cache + ETag Validation**:
    - **RAM Cache**: Repeated folder queries within 60 seconds return instantly (0 ms latency) directly from server memory.
    - **Conditional ETag Checking**: Downstream requests send `If-None-Match: "{folderEtag}"`. Nextcloud evaluates this against MariaDB's locked `oc_filecache` table in sub-milliseconds, answering with an empty `HTTP 304 Not Modified` payload when no changes exist.
  - **Instant Real-Time Push Sync via Rust `notify_push`**:
    - **Native WebSocket Daemon**: Connected directly to `wss://nextcloud.mermaid-symmetric.ts.net/push/ws` with automatic keep-alive pings and automatic reconnect logic.
    - **Event-Driven Cache Invalidation**: Zero periodic PROPFIND polling. When files or stems are added, renamed, or modified on the server, `notify_push` pushes an instant event to the client bridge, which invalidates the in-memory cache and broadcasts an event to the UI via Server-Sent Events (SSE).
  - **Dynamic Upload Pipeline (16GB Direct / 99MB Cloudflare Chunks)**:
    - Over Primary Tailscale Route: Large stem archives or video files (up to 16 GB) stream in a single high-speed direct PUT with a 1-hour timeout.
    - Over Cloudflare Fallback: Client automatically slices uploads into 90 MB chunks using Nextcloud WebDAV chunking protocol (`/remote.php/dav/uploads/{user}/{uploadId}/`), keeping every request beneath Cloudflare's 100 MB body size limit.
  - **Proxmox Backup Server (PBS) Automated Disaster Recovery**:
    - Configured automated nightly backup job in Proxmox VE 8 (`/etc/pve/jobs.cfg`, Job `d42b7fbe-eab6-4048-af99-682a99fe0104`) targeting `pbs-moyercloud` (`backup-7tb` on `192.168.1.74`).
    - Scheduled at **02:00 AM daily** in live `snapshot` mode (zero Nextcloud downtime) with automated retention pruning (`keep-daily=7, keep-weekly=4, keep-monthly=2`).

---

## [v3.0] — System-Wide Click-Efficiency Audit, Direct Icon Actions, Keyboard Lightbox & Audio Remap
- **Date**: 2026-10-02
- **Author**: Ted Moyer / BRICK Records
- **Milestone**:
  - Incremented studio version to **`v3.0`**.
  - **Single-Click Direct Icon Actions (Zero Redundant Buttons)**:
    - In `NextcloudWebDavFileExplorer.tsx`, clicking audio icons (`.wav`, `.mp3`, `.flac`) directly plays/auditions the stream with interactive hover and play/pause states.
    - Clicking image, video, or document icons directly triggers the fullscreen lightbox preview.
    - Removed redundant separate "View" buttons across file cards and list rows.
  - **Lightbox Keyboard Navigation (`ArrowLeft` / `ArrowRight`) & Rapid Preview**:
    - Embedded `ArrowLeft` (`←`) and `ArrowRight` (`→`) keyboard shortcuts for cycling through images and assets in the preview popup.
    - Added on-screen Previous (`<`) and Next (`>`) navigation buttons, item index counter (`Item X of Y`), and video player preview.
  - **Catalog & Nextcloud Audio Stream Linking**:
    - Remapped all 27 tracks in `CATALOG_TRACK_DEFINITIONS` (`src/data/nextcloudAssetIndex.ts`) to exact Nextcloud `/Music-Production/` directory names.
    - Resolved real audio streaming through `/api/nextcloud/stream?path=...` across the Mini-DAW mixer and side navigation player.
  - **Mini-DAW "Play 4-Track" Button Styling**:
    - Upgraded the 4-track play button with a rich gradient (`from-indigo-600 via-purple-600 to-indigo-600`), amber icon accents, glowing ring, and active pulsing feedback.
  - **Site Logo & Transparent Branding**:
    - Integrated transparent brand asset `brick-logo-transparent1000_1.webp` (`/brick-logo.webp`) across browser favicon, header branding button, and sidebar panel badge.
  - **System-Wide & Workspace Skills**:
    - Created `vite-react-click-audit` system-wide skill and custom `brickos-ui-ux-click-audit` workspace skill.

---

## [v3.1] — Real Nextcloud Audio Stems, Low-Pass Filter Treble Restoration, Solo Bus Routing & Audio Integrity
- **Date**: 2026-10-02
- **Author**: Ted Moyer / BRICK Records
- **Milestone**:
  - Incremented studio version to **`v3.1`**.
  - **Full High-Frequency Treble Restoration (Removal of 350 Hz Low-Pass Filter)**:
    - Fixed critical Web Audio bug in `audioEngine.ts` where default `BiquadFilterNode` instances defaulted to 350 Hz low-pass, causing audio to sound muffled and flat with no treble.
    - Routed `mediaSource` directly into stereo panners and master gain stages, restoring full 20 Hz to 20,000+ Hz high-fidelity studio air, crisp transients, and crystal-clear vocal presence.
    - Re-calibrated default master DSP chain (Parametric EQ, Tape Drive, VCA Compressor) to transparent flat initial states.
  - **Complete Elimination of Synthetic Beep Oscillators**:
    - Removed synthetic oscillator fallback blocks from `audioEngine.ts` and `SectionCriticalComparator.tsx`.
    - Wired all 26+ catalog tracks directly to scanned FLAC/MP3/WAV assets from Nextcloud WebDAV (`/Music-Production/`).
  - **Accurate Solo Stem Bus Routing & Live UI Indicators**:
    - Overhauled `updateBusRouting` in `audioEngine.ts` to dynamically isolate stems by semantic type (`master`, `vocal`, `instrumental`, `suno`, `ref`) and explicitly mute deselected audio elements.
    - Added live `SOLO ROUTED: [Filename]` status badge in `MasteringLufsSuite.tsx` displaying the exact 24-bit/48kHz WebDAV stream file being auditioned.
    - Updated Mini-DAW 4-track mixer to preserve multi-track 4-channel sum mixing (`daw` / `all` mode).
  - **Fast Refresh & Build Compliance**:
    - Cleaned up React Fast Refresh module exports in `MiniDawMixerTab.tsx`.
    - Verified production bundle passing with `npm run build` (0 errors).









