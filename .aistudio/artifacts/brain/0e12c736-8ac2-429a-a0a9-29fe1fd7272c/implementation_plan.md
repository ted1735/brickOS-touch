# Nextcloud-Primary Storage with Write Confirmation & Quota-Guarded Finalized Sync

Establish Nextcloud Server (via redundant Tailscale Direct & WebDAV bridge) as the primary write destination for all DAW state, track metadata, and project archives with automated **Read-After-Write Confirmation Verification**, while positioning Google Cloud Firestore strictly as a secondary destination for finalized project milestones.

### User Review & Critical Decisions

> [!IMPORTANT]
> **Key Architecture Directives (Confirmed & Enhanced)**:
> - **Primary Write Source**: **Nextcloud Server (WebDAV / Tailscale Bridge)** + Local Cache.
> - **Automated Write Confirmation Mechanism**: Every Nextcloud write (manifest, track state, session, stems) executes an immediate post-write verification cycle:
>   1. Evaluates HTTP response code (`201 Created` / `204 No Content` / `200 OK`).
>   2. Executes a **Read-After-Write Verification Check** (via `PROPFIND` Depth 0 or `HEAD`) against the Nextcloud server to verify the file exists, validate that `getcontentlength` matches the uploaded payload byte length, and record the server's returned `ETag` and timestamp.
>   3. Returns verified telemetry (`{ verified: true, serverBytes, etag, latencyMs }`) to the client, illuminating a verified hardware LED indicator.
> - **Secondary Finalized Destination**: **Firestore**. Firestore writes are strictly reserved for finalized tracks, milestone releases, or explicit catalog publication actions. Continuous live edits no longer write to Firestore.
> - **Quota & Circuit Breaker Protection**: When finalized tracks are published to Firestore, schema versioning (`_schemaVersion = 2`) and throttled batches (400 docs max, 300ms pause) ensure writes remain far below the 20,000 free-tier daily cap. If Firestore quota is reached, the circuit breaker safely bypasses Firestore without affecting Nextcloud operations.

---

### 1. Overview & Core Concept

- **What It Does**: Shifts brickOS Studio's primary persistence engine to the user's self-hosted Nextcloud server via the existing high-speed Tailscale / WebDAV proxy bridge (`/api/nextcloud/*`). Every track edit, session state change, and project archive is stored directly on Nextcloud in standard JSON manifests and audio directories (`Music-Production/<TrackFolder>/`).
- **Write Confirmation Guarantee**: Confirms that data actually arrived and was written to physical storage on Nextcloud before marking sync complete.
- **Target Audience / Persona**: Music producers and audio engineers who want full ownership, high verification standards, and unlimited storage capacity on their Nextcloud NAS, with zero dependency on restrictive third-party cloud database write quotas.
- **Key Value**: 100% elimination of daily Firestore quota exhaustion during day-to-day composition and mixing, guaranteed storage verification on the Nextcloud NAS, and seamless milestone publication to Firestore.

---

### 2. User Experience & Visual Design

- **Key User Flows**:
  1. *Live Working Session (Nextcloud Primary)*: As the user edits tracks, moves mixer faders, splits stems, or logs session notes, changes write immediately to browser storage and stream asynchronously to the Nextcloud project folder (`/remote.php/dav/files/ncted/Music-Production/.../project_manifest.json`).
  2. *Write Confirmation Feedback*: Once the Nextcloud server confirms the write and the Read-After-Write validation succeeds, the top toolbar updates:
     - `NEXTCLOUD: SYNCED · WRITE CONFIRMED (ETag: "9b3c...", 18.4 KB VERIFIED)` (Emerald LED).
     - If network packet loss occurs, the indicator shows `NEXTCLOUD: VERIFYING RETRY...` and falls back to local queue until confirmed.
  3. *Finalize & Publish to Cloud*: A dedicated hardware console switch / button—**"Finalize Release"** or **"Commit Cloud Milestone"**—allows the producer to push finalized metadata to Firestore with version tagging (`_schemaVersion: 2`).
  4. *Sync Status Indicator*: The top rack toolbar displays dual hardware status LEDs:
     - **Nextcloud Storage**: `NEXTCLOUD: CONNECTED (10.0.0.x / 14ms) · PRIMARY WRITE ACTIVE · VERIFIED` (Emerald)
     - **Firestore Catalog**: `FIRESTORE: STANDBY (SECONDARY / MILESTONE ONLY)` or `LOCAL SAFE MODE` (if quota reached).

- **Visual Identity & Theme**:
  - *Console Aesthetics*: Industrial audio console aesthetic with tactile rack indicators, dark charcoal brushed-aluminum panels (`#0a0a0c`), zero-pill metadata typography, and color-coded status channels.
  - *Zero-Pill Compliance*: All indicators utilize unboxed monospace telemetry with `·` dividers rather than capsule badges.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Nextcloud WebDAV Read-After-Write Verification**
  - *Chosen Approach*: On every project archive or track write, the server issues a `PROPFIND Depth 0` query to inspect the uploaded document's `d:getcontentlength` and `d:getetag`. Only when the reported length matches the buffer length is the write flagged as `verified: true`.
  - *Why*: Eliminates silent WebDAV drops, proxy caching illusions, or partial file truncation issues, giving the user absolute confidence that their music project is securely saved on disk.
  - *Trade-Off*: Adds a small verification roundtrip (~15-30ms over Tailscale); easily offset by keep-alive HTTP dispatchers.

- **Decision 2: Nextcloud WebDAV as Primary Write Target**
  - *Chosen Approach*: Nextcloud is the single source of truth for audio stems, multitrack sessions, lyrics, and JSON project manifests.
  - *Why*: Eliminates arbitrary write quotas, preserves high-fidelity WAV/MP3 files directly in the user's private cloud, and provides true data sovereignty.

- **Decision 3: Firestore as Secondary Milestone Destination**
  - *Chosen Approach*: Firestore is only written to during deliberate milestone actions (e.g. marking track status as "Final Master", clicking "Sync Cloud Catalog", or batch migrating).
  - *Why*: Cuts Firestore writes by ~99%, reducing daily writes from thousands down to <50, ensuring the project never exceeds free tier limits.

- **Decision 4: Quota Circuit Breaker & Safe Stream Isolation**
  - *Chosen Approach*: If Firestore throws `RESOURCE_EXHAUSTED` (code 8), the circuit breaker silences all Firestore gRPC write stream connection attempts for 4 hours while leaving Nextcloud and local storage completely unaffected.
  - *Why*: Prevents the Firestore SDK's internal connection loop from generating endless console error logs.

---

### 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        brickOS Music Studio DAW                        │
│            (Mixer, Track Arranger, Stem Separator, Lyrics)             │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                               User Edit
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        Local Storage Cache                             │
│                  (Instant <5ms UI Response)                            │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                       PRIMARY WRITE (Every Change)
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                  Nextcloud WebDAV & Project Archive                    │
│               - /api/project/archive                                   │
│               - PUT project_manifest.json + audio stems                │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                       READ-AFTER-WRITE VERIFICATION
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     Nextcloud Verification Cycle                       │
│    - PROPFIND Depth 0 (checks status 200/207)                          │
│    - Byte length match (expected vs actual getcontentlength)           │
│    - Capture ETag & timestamp -> Returns verified: true                │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                      SECONDARY WRITE (Only on Finalize)
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│          Firestore Secondary Milestone Destination                     │
│          - Triggered ONLY on "Finalize" / "Publish Milestone"          │
│          - Validated against _schemaVersion = 2                        │
│          - Batched (<= 400 docs, 300ms pause)                          │
│          - Quota Circuit Breaker shielded (Code 8 / RESOURCE_EXHAUSTED) │
└────────────────────────────────────────────────────────────────────────┘
```

#### Key Implementation Steps:
1. **Nextcloud Write & Verification Service (`server.ts` & `src/services/projectArchiveService.ts`)**:
   - Enhance `POST /api/project/archive` to perform a Read-After-Write verification check using `smartFetch` with `PROPFIND` Depth 0 on the written `project_manifest.json`.
   - Verify `getcontentlength` against buffer length, extract `getetag`, and return `{ success: true, verified: true, serverBytes, etag, latencyMs }`.
   - Add a direct verification endpoint `POST /api/nextcloud/verify-file` to check any arbitrary WebDAV path on demand.
2. **Primary Persistence Engine (`src/lib/firebase.ts`)**:
   - Route default track, session, and preset updates to update local cache and trigger the Nextcloud project archive / manifest write with verification.
   - Prevent background Firestore writes during normal live DAW operations.
   - Add `finalizeTrackToFirestore(track: Track)` for explicit milestone publishing with schema versioning (`_schemaVersion: 2`).
3. **Batch Throttler & Circuit Breaker Guard**:
   - Incorporate the batch-migration pattern with 400-doc limits, 300ms pauses, and circuit breaker trip detection into `src/lib/firebase.ts`.
4. **SOP Rules Store Hardening (`src/lib/sopRulesStore.ts`)**:
   - Cache rules in local storage and Nextcloud first; only push to Firestore if explicitly updated and circuit breaker is green.
5. **Console Status Banner (`src/brickos_music_studio_ai_production_workspace.tsx`)**:
   - Provide an unboxed hardware rack readout showing `Primary: Nextcloud (Connected) · Write Verified (ETag Confirmed) · Secondary: Firestore (Milestone Only)`.
