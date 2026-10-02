# brickOS Sovereign Studio — Future Development Queue (`future-dev.md`)

This file tracks all planned features, upcoming revisions, architectural expansions, and ideas designated with **"save this for the future"**.

---

## 🚀 Active Future Roadmap

### 1. Song Creation & Standardized Production
- [ ] **Automated Storyboard Shot-List Importer**: Allow one-click generation of 8 to 12 image shots per song directly from lyrical timestamps.
- [ ] **Batch Schema Migration Tool**: Provide a one-click button in the Database & Matrix tab to convert legacy JSON tracks into the strict `SongPackageSchema` standard.
- [ ] **Audio Waveform Preview for Sessions**: Render an interactive Web Audio waveform inside the session snapshot card.

### 2. Prompt Engineering Library & Video Workflows
- [ ] **VideoExpress Headless Browser Runner**: Direct WebSocket connection to automate VideoExpress.ai in headless Chrome without manual prompt copy/paste.
- [ ] **CloneVoice.ai Direct REST Hook**: API-based voice synthesis dispatch that automatically pulls stem references from Nextcloud.
- [ ] **Google Veo 3 Real-Time Preview Player**: Native in-app video playback scrubber for generated 9:16 Shorts with audio stem synchronization.
- [ ] **Grok / Runway Gen-3 Prompt Adapter**: Automatic translation of camera motion tokens between different AI video engines.
- [ ] **Storyboarding Animatic Generator**: Stitch generated images together into a timed animatic with backing track audio.

### 3. Audio & Vocal Engineering
- [ ] **Vocal Formant Transposition Calculator**: Real-time semitone shifter guide for matching specific vocal archetypes (The Architect -14 semi, Silas Thorne -8 semi, Ms. T +6 semi).
- [ ] **Suno v6 / Next-Gen Model Support**: Dynamic slider calibration when Suno releases updated model architectures.
- [ ] **UVR5 Stem Auto-Sync**: Direct WebDAV background task that triggers stem separation on new master uploads.

### 4. Ministry & Distribution Channels
- [ ] **ProPresenter Lyrical Sync Export**: One-click `.pro` or `.txt` export with chord cues for church worship team presentation.
- [ ] **SongSelect / CCLI Auto-Filing**: Automated packaging of song metadata, writers, and copyright tags for church publishing.
- [ ] **Automated DistroKid / TuneCore Package Zip**: Zip archive containing master 24/48 WAV, cover art 3000x3000px, lyric sheet, and metadata XML.

### 5. Nextcloud Fiber Backend & Infrastructure Automation
- [x] **Dual-Route Auto-Failover WebDAV Client**: Enhanced client bridge with automatic failover between primary Tailscale direct mesh (`https://nextcloud.mermaid-symmetric.ts.net/`, ~14ms latency, zero proxy limits) and secondary Cloudflare edge (`https://nextcloud.moyercloud.com/`).
- [x] **Targeted `Depth: 1` Lazy File-Tree Loader**: Replaced full-directory scans with lazy-loaded folder expansion, targeted `/api/nextcloud/track-assets` querying specific `/stems` folders directly, and lean XML properties (`d:getlastmodified`, `d:getcontentlength`, `d:getcontenttype`, `d:getetag`, `d:resourcetype`, `oc:fileid`, `oc:size`).
- [x] **Real-Time Push Sync WebSocket Listener (`notify_push`)**: Connected directly to `wss://nextcloud.mermaid-symmetric.ts.net/push/ws` with automatic keep-alive pings and reconnect logic; event-driven cache invalidation via Server-Sent Events (SSE) with zero polling.
- [x] **ETag-Based Cache Manager**: In-memory 60s RAM cache + conditional `If-None-Match: "{folderEtag}"` checking against MariaDB locked `oc_filecache` table returning instant `304 Not Modified`.
- [x] **High-Throughput Connection Pooling (Undici) & Dynamic Uploads**: 64 persistent HTTP/2 & HTTP/1.1 connections via Undici agent with 10-minute keep-alive and 1-hour timeouts; dynamic 16GB direct PUTs on Tailscale vs 90MB sliced chunking on Cloudflare.
- [ ] **Cloudflare WebSockets & Media Edge Cache Rules**:
  - Verify/toggle WebSockets ON in Cloudflare dashboard for `moyercloud.com` so `/push/ws` connects through Cloudflare.
  - Configure Cloudflare Cache Rules for `/remote.php/dav/files/*` with media extensions (`.wav`, `.flac`, `.mp4`, `.png`) to enable byte-range edge caching.
- [x] **Proxmox Container 120 Snapshot & Backup Schedule**: Configured automated nightly snapshots at 02:00 AM to `pbs-moyercloud` on Proxmox host (`192.168.1.91`) with retention policy (7 daily, 4 weekly, 2 monthly).


---

## 📌 Items Saved by User ("Save this for the future")

*Any request containing "save this for the future" will be appended below under this section with date and task specifics.*

