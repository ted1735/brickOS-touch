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
- The application version in the header will be incremented to **`v4.1`** (`src/utils/versioning.ts` and `package.json`).

---

## 2. User Review Required & Design Decisions
> [!IMPORTANT]
> **Engine:** Server-side UVR5 BS-Roformer separation pipeline (`server.ts`).
> **Routing:** Automatic population of Mini-DAW mixer channels (Vocals, Drums, Bass, Melodic) upon completion with zero extra manual steps.
> **Persistence:** Automatic WebDAV backup to Nextcloud and metadata sync in Firestore.
> **UI Aesthetic:** Anti-slop, zero-pill hardware console design following the SaaS & Dashboard guidelines (`3_saas_dashboard.md`).

---

## 3. Proposed Changes & Technical Specifications

### Phase 1: Server-Side UVR5 Stem Separation Engine (`server.ts`)
1. **Endpoint `POST /api/audio/separate-stems`:**
   - Accepts either:
     - Direct file upload (audio file payload up to 60MB).
     - Nextcloud path to an existing track master (e.g. `/remote.php/dav/files/ncted/Music-Production/Manic_In_The_Mundane/...`).
     - Track ID (`TRK-01` through `TRK-29`).
2. **Stem Generation & Audio Processing:**
   - Extracts/synthesizes uncompressed 24-bit/48kHz PCM WAV audio streams for:
     - `Vocals` (Clean Lead Vocal, de-reverbed format)
     - `Drums` (Punchy transients, kick, snare, cymbals)
     - `Bass` (Sub & bassline frequency foundation)
     - `Melodic` (Acoustics, guitars, pianos, synth bed)
3. **Nextcloud WebDAV & Firestore Automatic Persistence:**
   - Saves each stem via WebDAV PUT to `/remote.php/dav/files/ncted/Music-Production/{folderName}/stems/{trackId}_{StemName}.wav`.
   - Writes the new stem registry directly into Firestore collection `tracks/{trackId}`, including `status: 'UVR5 Stem Prep'`.
   - Returns stream URLs: `/api/nextcloud/stream?path=...`.

### Phase 2: Mini-DAW Mixer Integration (`src/components/MiniDawMixerTab.tsx`)
1. **Stem Separator Control Interface:**
   - Add a hardware-styled "AI Stem Separator (UVR5 BS-Roformer)" launcher button in the Mini-DAW mixer toolbar.
   - Modal drawer with:
     - Source selection: "Current Track Master" or "Upload New Audio File (.wav, .mp3, .flac)".
     - Model selection indicator: `BS-Roformer-Viperx-1297` & `MelBand-Roformer-Kim-Inst-V2`.
     - Real-time separation stage stepper (Ingestion $\rightarrow$ Vocal Extraction $\rightarrow$ Rhythm De-coupling $\rightarrow$ WebDAV Upload $\rightarrow$ Mixer Auto-Route).
2. **Automatic Mixer Channel Auto-Population:**
   - On completion, dispatches the 4 isolated tracks into `activeStems` in `MiniDawMixerTab.tsx`.
   - Reconfigures the Web Audio graph via `audioMiniDaw.loadTrackStems(...)` so pressing Play immediately auditions the isolated stems.
   - Assigns mixer groups: Vocals to `Group A (Vocals)`, Drums & Bass to `Group B (Rhythm)`, Melodic to `Group C (Leads/Bed)`.

### Phase 3: Studio Header Version Increment
1. Update `CURRENT_STUDIO_VERSION` to **`v4.1`** in `src/utils/versioning.ts`.
2. Update `"version": "4.1.0"` in `package.json`.

---

## 4. Verification & Testing Plan
1. **API Execution Test:**
   - Send test POST request to `/api/audio/separate-stems` with `trackId: "TRK-29"` to verify stem generation, WebDAV writing, and Firestore status update.
2. **Mixer Channel Playback Test:**
   - Verify that the 4 generated stems load into the Mini-DAW mixer channels and play in sync.
   - Verify individual solo, mute, fader volume, and panning.
3. **Firestore Verification:**
   - Confirm `TRK-29` has updated `stems` and `status: 'UVR5 Stem Prep'` in Firestore.
4. **Build & Lint Verification:**
   - Run `compile_applet` and `lint_applet` to ensure zero compilation or type errors.
