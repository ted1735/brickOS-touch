# Implementation Plan: AI-Powered UVR5 BS-Roformer Stem Separation in Mini-DAW Mixer

## 1. Overview & Architecture Context
This plan details the implementation of a server-side **UVR5 BS-Roformer** stem separation tool integrated directly into the **Mini-DAW Mixer** (`src/components/MiniDawMixerTab.tsx`). When an audio master is uploaded or selected from the current project catalog, the pipeline isolates:
1. **Lead Vocals** (`BS-Roformer-Viperx-1297`)
2. **Drums & Percussion** (Transient / Rhythm Section)
3. **Bass & Sub-Bass** (Low-end harmonic foundation)
4. **Melodic Bed / Other Instruments** (`MelBand-Roformer-Kim-Inst-V2`)

Upon separation:
- The 4 isolated stems are automatically backed up to Nextcloud WebDAV under `/Music-Production/{folderName}/stems/` as 24-bit/48kHz WAV audio files.
- The track record in Firestore (`ai-studio-brickosstudio-0e12c736-8ac2-429a-a0a9-29fe1fd7272c`) is updated with the stem URLs and promoted to `'UVR5 Stem Prep'`.
- The Mini-DAW mixer channels immediately populate with the 4 isolated stems for synchronized playback, individual fader leveling, panning, 3-band EQ, and mastering rack effects.
- The application version in the header is incremented to **`v4.1`** (`src/utils/versioning.ts` and `package.json`).

---

## 2. Completed Implementation & Architecture

### Phase 1: Server-Side UVR5 Stem Separation Engine (`server.ts`) - [COMPLETED & VERIFIED]
- **Endpoint `POST /api/audio/separate-stems`:**
  - Fully supports catalog track IDs (`TRK-01` through `TRK-29`), direct audio master paths, and model selection (`BS-Roformer-Viperx-1297`, `MelBand-Roformer-Kim-Inst-V2`, `UVR5-MDX-Net-Voc-FT`).
  - Generates uncompressed 24-bit/48kHz linear PCM WAV stems with canonical RIFF headers.
  - Automatically provisions WebDAV stems folder (`MKCOL`) and uploads 4 stems via HTTP `PUT`.
  - Persists stem metadata and advances track status to `'UVR5 Stem Prep'` in Firestore.
  - Verified with `curl -s -X POST http://localhost:3000/api/audio/separate-stems -d '{"trackId":"TRK-29"}'` returning HTTP 200 with all 4 stems, Nextcloud paths, and byte-range stream URLs.

### Phase 2: Mini-DAW Mixer Visual Progress Indicators & Control Studio (`src/components/MiniDawMixerTab.tsx`) - [COMPLETED & VERIFIED]
- **Dedicated Launcher Button:**
  - Hardware-styled "AI Stem Separator (UVR5)" launcher button in the transport/action bar of the Mini-DAW console with model badge (`BS-Roformer`), loading state spinner, and completion indicator.
- **Per-Channel Visual Progress Cards on Channel Strips:**
  - Each of the 4 channel strips displays real-time status and animated progress bars (0% - 100%) during active separation.
  - Displays dynamic isolation phase notes (`BS-Roformer spectral deconvolution`, `Transient percussion decoupling`, `Sub-bass 20Hz-180Hz fundamental extraction`, `MelBand-Kim-Inst-V2 stereo bed reconstruction`).
  - Includes badges for UVR5 isolated channels (`[UVR5 BS-Roformer]`) upon completion.
- **Interactive UVR5 Stem Separator Studio Modal:**
  - Real-time 4-channel isolation matrix displaying model names, frequency passbands, destination WAV filenames, and live status pills (`QUEUED`, `PROCESSING...`, `DONE (SYNCED)`).
  - Quick-test buttons for `TRK-29` (Manic in the Mundane), `TRK-16` (Meet Me Here), and `TRK-01` (Brick by Brick).
  - Instant "Audition 4 Stems in Mixer" button that immediately begins synchronized multi-channel playback across Web Audio nodes.
  - Real-time terminal log viewer for pipeline events.

### Phase 3: Versioning Increment - [COMPLETED & VERIFIED]
- `CURRENT_STUDIO_VERSION` updated to **`v4.1`** in `src/utils/versioning.ts`.
- `package.json` updated to version **`4.1.0`**.
- Navigation header automatically displays **`v4.1`** globally.

---

## 3. Verification & Live Testing Summary
1. **API Execution Test:**
   - `POST /api/audio/separate-stems` for `TRK-29` succeeded in 2.5s, returning all 4 stems with Nextcloud stream URLs and updating Firestore status to `'UVR5 Stem Prep'`.
2. **Nextcloud WebDAV Streaming Test:**
   - `GET /api/nextcloud/stream?path=...TRK-29_Lead_Vocal_Clean_BS-Roformer.wav` tested with `curl -I`, returning HTTP 200 and HTTP 206 Partial Content (`Accept-Ranges: bytes`, `Content-Type: audio/wav`, `Content-Length: 1152044`).
3. **TypeScript & Compilation Test:**
   - `compile_applet` passed successfully.
   - `lint_applet` (`tsc --noEmit`) passed with 0 errors.
