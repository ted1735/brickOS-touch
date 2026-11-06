# brickOS Studio: Background Asset Relinker, Audio Diagnostics & GitHub Optimization Activation

Comprehensive architectural plan to eliminate the confusing synthetic sine wave audio fallback, implement real-time asset diagnostics with automatic Suno CloudFront preview streaming, explain and empower the "Refresh Folder" WebDAV operation, and wire the newly merged SQLite database and 372-revision catalog into the live server runtime.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following user preferences were confirmed during Phase 1 clarification:
> - **Audio Error Fallback**: When an asset is missing or 404s on Nextcloud WebDAV, brickOS Studio will immediately stream the authentic Suno CloudFront audio revision while displaying an actionable diagnostic toast. The synthetic sine wave generator (`generateMusicalWavBuffer`) will be completely decoupled from track playback.
> - **Asset Relinker Strategy**: Background fuzzy asset discovery across Nextcloud directories (`/remote.php/dav/files/ncted/Music-Production/...`) will scan and resolve renamed/relocated files automatically without blocking the user.
> - **GitHub Merges Activation**: The sovereign SQLite database bridge (`sqliteCatalogService.ts` and `brickDatabase.ts`) will be wired directly into Express server routes (`server.ts`) and catalog APIs, connecting the 372 Suno revisions to the studio interface.

---

## Comprehensive GitHub Code Merge Audit (Current vs. Merged State)

You asked for an itemized breakdown of what was merged from GitHub, what is currently running, and what is idle:

| Component / File | Discovered in Repository | Current Live Status | Action in This Plan |
| :--- | :--- | :--- | :--- |
| **`src/services/sqliteCatalogService.ts`** (518 lines, 16 KB) | High-performance Node 22 `node:sqlite` WAL-mode database layer. Seeds 41 canonical tracks, 372 Suno revisions, folder ETags, and waveform cache. | **INACTIVE / UNWIRED**<br>Neither `server.ts` nor frontend components import or query this service. Server uses in-memory `propfindCache`. | **ACTIVATE**<br>Mount SQLite service into `server.ts` API endpoints (`/api/catalog/songs`, `/api/catalog/revisions`, `/api/database/stats`). |
| **`src/server/brickDatabase.ts`** (238 lines, 8.1 KB) | Sovereign database bridge for external `brickos.db` on Windows workstation `D:\Users\tedmo\...` and Linux CT 120. Provides schema stats and version ledger. | **INACTIVE / UNWIRED**<br>No active API routes exposed in `server.ts`. | **INTEGRATE**<br>Add health/status endpoint `/api/brickos/status` and sync ledger hooks. |
| **`src/data/relationalSunoCatalog.ts`** (5,119 lines, 390 KB) | 372 Suno revisions grouped under 41 canonical song IDs with timestamps, style tags, clip IDs, and lyrics. | **PARTIALLY IDLE**<br>Only imported by `sqliteCatalogService.ts`; not surfaced to the Mini-DAW mixer or player. | **ACTIVATE**<br>Expose revisions to the track details panel and provide audio stream fallback for missing WebDAV files. |
| **`src/data/sunoMasterCatalog.ts`** (4,480 lines, 330 KB) | Master index of 372 tracks with direct CloudFront `.m4a` streams (`https://d2lwuy8qc234o3.cloudfront.net/1/clip/...`) and model tags (`chirp-hawk`). | **INACTIVE / STANDBY**<br>Zero active imports in codebase. | **ACTIVATE AS AUDIO FALLBACK**<br>Wire directly into streaming proxy failover when WebDAV audio is missing. |
| **Audio Fallback Generator** (`generateMusicalWavBuffer` in `server.ts`) | Generates a 6-second synthetic sine wave buffer when WebDAV returns 404 or fails. | **ACTIVE (CAUSING ISSUE)**<br>Triggers the "odd sine wave" confusion reported by user. | **DEPRECATE FOR PLAYBACK**<br>Replace with Suno CloudFront stream + Diagnostic error event to client. |
| **WebDAV Refresh Button** (`NextcloudWebDavFileExplorer.tsx`) | Sends `forceRefresh: true` to bypass RAM cache and run live PROPFIND. | **ACTIVE BUT OPAQUE**<br>Works under the hood, but lacks feedback, tooltip explanation, and cache latency metrics. | **ENHANCE UX**<br>Add tooltip, cache status indicator, and toast confirmation with item count and latency. |

---

## 1. Overview & Core Concept

1. **Transparent "Refresh Folder"**: Users will clearly understand what Refresh does: it purges the local server RAM cache for that specific Nextcloud directory, issues a fresh HTTP `PROPFIND` against the WebDAV cluster, recalculates ETags, and measures live round-trip latency. A rich status pill and toast will provide instant feedback on items scanned and milliseconds elapsed.
2. **Audio Diagnostic Toast System**: When a track file cannot be streamed from WebDAV (due to a missing file, wrong extension, or altered folder structure), the player will never play an ambiguous synthetic sine wave. Instead, it will:
   - Immediately switch playback to the high-fidelity Suno CloudFront master revision (`.m4a`).
   - Display a sleek diagnostic toast explaining the exact problem (e.g., `WebDAV Asset Missing: TRK-16 file 'Meet-Me-Here-CHH-v2.0bZ-Remastered.wav' not found at remote path`).
   - Offer one-click actions: **"Auto-Relink Asset"** or **"Locate in WebDAV"**.
3. **Automated Background Asset Relinker**: A server-side discovery agent will automatically scan the Nextcloud `Music-Production` tree in the background, matching canonical tracks with audio files using fuzzy filename matching (handling suffixes like `-v2.0bZ`, `-Master`, `-Final`). When a match is found, the link is updated non-destructively in SQLite and in-memory indexes.
4. **SQLite & Suno Revision Activation**: Mount the newly merged SQLite catalog and relational Suno data into the live server, allowing users to view and audition any of the 372 Suno revisions directly from the Mini-DAW mixer.

---

## 2. User Experience & Visual Design

- **Aesthetic Direction**: Professional audio production suite (Dark slate `#0A0D14`, titanium hairline borders `#1E293B`, electric cyan accents `#06B6D4`, amber warning highlights `#F59E0B`, emerald sync status `#10B981`). Strict zero-pill discipline for static metadata; functional segmented buttons for interactive controls.
- **Refresh Folder Feedback**:
  - The "Refresh" button gains an interactive tooltip: *"Bypasses RAM cache and fetches live WebDAV directory via PROPFIND"*.
  - When pressed, the button displays a subtle pulse/spin and triggers a floating status badge: `"Live PROPFIND Complete: 14 items synced in 48ms (ETag: 672bf...)"`.
- **Diagnostic Toast Banner**:
  - Positioned at the top-right or docked above the Mini-Player.
  - Distinctive visual states:
    - **Amber Warning**: *"Audio stream redirected to Suno CloudFront preview. Searching Nextcloud for original lossless master..."*
    - **Emerald Success**: *"Asset successfully relinked to /Music-Production/TRK-01/... in 120ms."*
    - **Rose Error**: *"Asset unavailable on WebDAV and CloudFront. Open File Explorer to upload or assign."*
  - Includes a live progress indicator during background scans.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Stream CloudFront Revision instead of Synthesizing Sine Waves**
  - *Chosen Approach*: When WebDAV returns 404 for a track audio request, `server.ts` checks `sunoMasterCatalog` and proxies or redirects to the authentic Suno CloudFront stream, sending custom headers `X-brickOS-Fallback: suno-cloudfront`.
  - *Why*: The user immediately hears the real music/vocals instead of an unpleasant test tone, while the UI alerts them that the lossless WebDAV file is being relocated.
- **Decision 2: Asynchronous Background Relinker**
  - *Chosen Approach*: Background scanning runs asynchronously without freezing the player or UI. Matches are cached in SQLite `nextcloud_assets` and `CANONICAL_TRACK_REAL_AUDIO`.
  - *Why*: Deep PROPFIND scans of large directory trees can take 500ms–2s; running in the background ensures zero audio dropout.
- **Decision 3: SQLite Service Integration in Node 22**
  - *Chosen Approach*: Import `getStudioDb()` in `server.ts`, seed the 41 songs and 372 revisions on startup, and expose `/api/catalog/revisions/:songId` and `/api/database/stats`.
  - *Why*: Unifies the newly merged GitHub files into active application memory, paving the way for multi-take revision switching in the mixer.

---

## 4. Technical Architecture & Data Strategy

### System Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                          brickOS Studio UI                             │
│  ┌───────────────────────┐  ┌─────────────────┐  ┌──────────────────┐  │
│  │ WebDAV File Explorer  │  │ Mini-DAW Mixer  │  │ Production Bento │  │
│  │ (Refresh + Cache UI)  │  │ (Multi-Revisions│  │ (Audio Player)   │  │
│  └───────────┬───────────┘  └────────┬────────┘  └────────┬─────────┘  │
│              │                       │                    │            │
│              ▼                       ▼                    ▼            │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │          Audio Diagnostics & Relink State Manager                │  │
│  │  - Intercepts 404 / Fallback streams                             │  │
│  │  - Renders Diagnostic Toast & Relink Progress                    │  │
│  └───────────────────────────────────┬──────────────────────────────┘  │
└──────────────────────────────────────┼─────────────────────────────────┘
                                       │ HTTP / WebDAV API
                                       ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        Express Backend (server.ts)                     │
│  ┌─────────────────────┐  ┌──────────────────────┐  ┌────────────────┐ │
│  │  /api/nextcloud/    │  │  /api/stream-media   │  │ /api/relink    │ │
│  │  browse (PROPFIND)  │  │  (Smart Audio Proxy) │  │ (Auto-Scan)    │ │
│  └──────────┬──────────┘  └──────────┬───────────┘  └───────┬────────┘ │
│             │                        │                      │          │
│             ▼                        ▼                      │          │
│  ┌───────────────────────────────────────────────────────┐  │          │
│  │        SQLite Catalog Service (sqliteCatalogService)   │  │          │
│  │  - canonical_songs (41)   - suno_revisions (372)       │◄─┘          │
│  │  - nextcloud_assets       - waveform_peaks             │            │
│  └───────────────────────────┬───────────────────────────┘             │
└──────────────────────────────┼─────────────────────────────────────────┘
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
┌───────────────────────┐             ┌────────────────────────┐
│   Nextcloud WebDAV    │             │   Suno CloudFront CDN  │
│  (Lossless Audio/FLAC)│             │ (High-Quality M4A Take)│
└───────────────────────┘             └────────────────────────┘
```

### Planned Implementation Steps

1. **Server Audio Proxy Upgrade (`server.ts`)**:
   - In `/api/stream-media`, replace the synthetic sine wave generator (`generateMusicalWavBuffer`) fallback with an automatic lookup in `SUNO_MASTER_TRACKS` / `RELATIONAL_SUNO_CATALOG`.
   - When WebDAV returns 404, stream the matching CloudFront `.m4a` file with headers:
     - `X-brickOS-Source: suno-cloudfront`
     - `X-brickOS-Original-Status: 404`
     - `X-brickOS-Track-Id: <id>`
   - Implement `/api/nextcloud/auto-relink` endpoint that recursively probes WebDAV for matching audio filenames.
2. **SQLite Catalog Activation**:
   - Import `getStudioDb`, `resolveSqliteDbPath`, and `getCatalogEtag` into `server.ts`.
   - Mount REST routes:
     - `GET /api/catalog/songs`: Returns 41 canonical songs with revision counts from SQLite.
     - `GET /api/catalog/revisions/:songId`: Returns Suno revisions with CloudFront stream URLs.
     - `GET /api/database/stats`: Returns live row counts and WAL status.
3. **Frontend Audio Diagnostics & Toast System**:
   - Create `src/components/AudioDiagnosticToast.tsx` with clean, accessible notification cards.
   - Update `MiniDawMixerTab.tsx`, `NextcloudWebDavFileExplorer.tsx`, and `audioEngine.ts` to detect fallback audio streams and display actionable diagnostics with a "Relink Now" trigger.
4. **Enhanced "Refresh Folder" UX**:
   - In `NextcloudWebDavFileExplorer.tsx`, update the Refresh button with an informative tooltip, a clear confirmation toast displaying latency in milliseconds, items refreshed, and cache status.
5. **Verification**:
   - Run `compile_applet` and `lint_applet` to ensure pristine TypeScript compilation and zero regressions.
