# Implementation Plan: Automated Metadata Mapper & Multi-Version Audition Engine

## 1. Problem Statement & Architecture Context
When new audio masters, stem separations, and visual renders are synchronized from Nextcloud (`https://nextcloud.mermaid-symmetric.ts.net`), tracks in the Firestore database (`ai-studio-brickosstudio-0e12c736-8ac2-429a-a0a9-29fe1fd7272c`) require automatic technical classification and status progression. Without an automated mapper, tracks remain in placeholder states, and newly uploaded Suno v5.1/v5.5 masters, vocal performance takes, and stem snips are not tagged with their forensic LUFS, LRA, True Peak, BPM, Key, or timestamped lyric boundaries.

Furthermore, brickOS Studio provides side-by-side comparative auditioning (comparing 3–4 songs or alternate versions verse-to-verse and chorus-to-chorus). The audio playback routing must leverage our high-speed HTTP 206 byte-range proxy (`/api/nextcloud/stream?path=...`) with seamless fallback to direct Suno master URLs, allowing instant on-demand section playback without downloading full multi-megabyte audio files.

---

## 2. User Review Required & Design Constraints
> [!IMPORTANT]
> **Trigger Mode:** Automatic execution during Nextcloud folder sync (`/api/nextcloud/sync-folder`), batch catalog indexing (`/api/nextcloud/index-track` / `/api/nextcloud/index-all-catalog`), or when file events are received from the Rust `notify_push` daemon. A manual "Auto-Map Metadata" button will also be accessible in the UI.
> **Firestore Target:** Database `ai-studio-brickosstudio-0e12c736-8ac2-429a-a0a9-29fe1fd7272c`, updating the `tracks` collection idempotently without overwriting user-edited lyrics or historical revisions.
> **Studio Header Version:** Per standing rule, the version will be bumped to **`v4.0`** (`src/utils/versioning.ts` and `package.json`).

---

## 3. Proposed Changes & Technical Specifications

### Phase 1: Automated Audio Metadata Extraction & Pattern Sniffer (`server.ts` & `src/services/metadataMapperService.ts`)
1. **Lightweight Header & Filename Heuristics Engine:**
   - Parse audio file naming conventions (e.g. `7.5sbRManicInTheMundane_Brandon_v5.1_BMV1 (Remastered).wav`, `Meet-Me-Here-CHH-v2.0bZ-Remastered.mp3`, `bridge_full_205_260.wav`).
   - Extract version codes (`v1.0`, `v2.0b`, `v5.1`), Suno generation tags (`BMV1`, `Remastered`, `Raw`), vocal casts (`Brandon`, `The Architect`, `PATD`, `Kane`), and timing boundaries from snippet filenames (`snip_15_26.wav` -> `startSec: 15, endSec: 26`).
2. **Audio RIFF/WAVE & Technical Spec Extractor:**
   - For uncompressed WAV and FLAC files, sniff the first 4KB via byte-range requests to extract sample rate (e.g. 48,000 Hz), bit depth (24-bit), channels (Stereo), and duration.
   - Map benchmark mastering measurements (LUFS integrated, LRA, True Peak) from catalog audit data (`SUNO_REMASTER_BENCHMARKS.md`, `suno_remaster_analysis.md`) into the track doc.
3. **Automated Production Status Lifecyle Transition:**
   - If raw stems exist (`*_Drums_Bass.wav`, `*_Lead_Vocal_*.wav`) but no master: auto-tag status to `'UVR5 Stem Prep'`.
   - If remastered or raw master exists (`*Master*.wav`, `*Remastered*.mp3`, `7.5sbR*.wav`): auto-promote status to `'Audio Master'`.
   - If distribution packaging exists (YouTube SEO report, cover art, video masters): advance to `'Sent for Distribution'`.

### Phase 2: Firestore Persistence & Synchronization (`src/lib/firebase.ts` & server sync bridge)
1. **Automated Batch Upsert:**
   - Update Firestore `tracks/{trackId}` with enriched `sunoAssets`:
     - `takes`: Array of identified master & performance takes with stream URLs, formats, sample rates, and mastering metrics.
     - `snippets`: Array of section snippets mapped to lyric sections with start/end timestamps.
     - `videoMasters`: 9:16 portrait and 16:9 landscape video assets.
     - `bpm`, `key`, `camelotKey`, `vocal`, `vocalCast`, `status`.
   - Preserve existing lyric revisions and historical audit logs.
2. **Hook Into Nextcloud Sync Endpoints:**
   - Modify `/api/nextcloud/sync-folder` and `/api/nextcloud/index-track` to invoke the metadata mapper automatically upon successful WebDAV scan, persisting findings directly into Firestore and returning summary telemetry.

### Phase 3: Multi-Track Side-by-Side Streaming & Section Audition Enhancements (`src/utils/sectionAudioHelper.ts` & `src/components/BlockSuiteThreeSongComparatorModal.tsx`)
1. **Prioritized Audio Source Fallback Chain:**
   - Primary: High-speed Nextcloud WebDAV proxy stream (`/api/nextcloud/stream?path=...`) with HTTP 206 byte-range streaming.
   - Secondary: Direct Suno CDN audio URL if Nextcloud WebDAV is temporarily offline.
   - Tertiary: Section snippet cut (`snip_*.wav` or `bridge_*.wav`).
2. **Section Comparator Enhancements:**
   - Ensure `BlockSuiteThreeSongComparatorModal` and `SectionCriticalComparator` support 3–4 tracks side by side.
   - When clicking on any section card (Verse 1, Chorus, Bridge, Drop), immediately calculate the bar-accurate time window or load the dedicated snippet, keeping simultaneous/solo playback in sync.

### Phase 4: Studio Header Version Increment & UI Telemetry
1. Bump `CURRENT_STUDIO_VERSION` to **`v4.0`** in `src/utils/versioning.ts`.
2. Update `"version": "4.0.0"` in `package.json`.
3. Add a dedicated "Auto-Mapped" indicator and "Trigger Metadata Scan" button in the Nextcloud Explorer and Database Matrix tabs.

---

## 4. Verification & Testing Plan
1. **Automated Ingestion Test:**
   - Run a test script against `TRK-29` ("Manic in the Mundane") and `TRK-16` ("Meet Me Here") to verify that `takes`, `snippets`, `bpm`, `key`, and `status` are correctly extracted and stored in Firestore.
2. **Streaming & Byte-Range Verification:**
   - Execute HTTP `GET /api/nextcloud/stream` with `Range: bytes=0-1024` for both WAV and MP3 files to verify 206 Partial Content responses and low-latency chunk delivery.
3. **Multi-Track Comparator Verification:**
   - Open the 3-Song Comparator modal, toggle sections, and verify that playback streams seamlessly with accurate time boundaries.
4. **Applet Compilation & Linting:**
   - Run `compile_applet` and `lint_applet` to ensure zero build errors or TypeScript regressions.
