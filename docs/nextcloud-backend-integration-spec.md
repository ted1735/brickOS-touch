# Nextcloud Backend Architecture & Client Integration Specification (brickOS)

## 1. Server Environment & In-Memory Performance Profile
The Nextcloud backend (Debian LXC Container 120 on Proxmox host `192.168.1.91`) has been optimized specifically for high-throughput, multi-track 24-bit/48kHz WAV streaming and stem synchronization:

- **Dedicated Memory:** Upgraded to **8 GB RAM / 4 GB Swap**.
- **OS Linux Page Cache (`buff/cache`):** ~7.2 GB of free RAM is dedicated exclusively to the kernel page cache. Repeatedly accessed audio stems, sound presets, and assets are served directly from RAM at bus speeds (zero NVMe disk thrashing).
- **MariaDB Database Caching:**
  - `innodb_buffer_pool_size = 1G` (1,073,741,824 bytes). The entire `oc_filecache` table, file IDs, etags, and metadata indexes reside permanently locked in high-speed RAM.
  - `innodb_io_capacity = 2000` / `innodb_io_capacity_max = 4000` tuned for WD Black NVMe storage.
  - `innodb_flush_log_at_trx_commit = 2` to minimize transactional disk waits.
- **PHP 8.2 Execution & OPcache:**
  - `opcache.memory_consumption = 512MB` with `opcache.max_accelerated_files = 30000` and `opcache.interned_strings_buffer = 64MB`. 100% of Nextcloud core and SabreDAV WebDAV classes are pre-compiled and locked in memory.
  - JIT compilation active (`opcache.jit = 1255`, `opcache.jit_buffer_size = 128M`) for ultra-fast XML parsing during PROPFIND requests.
- **Lock Arbitration:** Local Redis socket (`/var/run/redis/redis.sock`) handles distributed caching and file locking in sub-milliseconds without database contention.
- **Streaming Pipeline:** PHP `output_buffering = Off` ensures zero server-side memory bloat when streaming multi-megabyte audio tracks.

---

## 2. Connection Endpoints & Dual-Route Failover
Always implement dual-route resolution with automatic fallback in the client:

- **Primary Route (Direct Tailscale Mesh / Zero Limits):**
  - Base URL: `https://nextcloud.mermaid-symmetric.ts.net/remote.php/dav/files/{username}/`
  - Characteristics: 1 ms latency on local LAN, 1 Gbps+ wire speed, no Cloudflare 100MB body limit, no external proxy timeouts.
- **Secondary Route (Global Cloudflare Fallback):**
  - Base URL: `https://nextcloud.moyercloud.com/remote.php/dav/files/{username}/`
  - Characteristics: Public edge proxy for remote sessions when Tailscale is disconnected.

---

## 3. PROPFIND Request Rules & Deep Asset Discovery
Nextcloud's database buffer pool can return file metadata in sub-milliseconds, but improper client queries will waste bandwidth:

1. **Depth Strategy (RFC 4918 Standard):**
   - **Do not use non-standard depths like `Depth: 2`** (which can be rejected or mishandled by intermediate proxies).
   - Use **`Depth: 1` targeted lazy-loading**:
     - Query the top-level collection folder to populate EPs/albums.
     - When the user selects or opens a song, issue a targeted `Depth: 1` query directly to that track's stem directory:
       `PROPFIND .../files/{username}/Music/EP 1/TRK-01/Stems/`
   - Only use `Depth: infinity` during initial catalog indexing or offline synchronization routines.
2. **Lean XML Payloads (Never Use `<d:allprop />`):**
   - Explicitly request only the properties needed by the player/DAW:
     ```xml
     <?xml version="1.0" encoding="utf-8" ?>
     <d:propfind xmlns:d="DAV:" xmlns:oc="http://owncloud.org/ns">
       <d:prop>
         <d:getlastmodified />
         <d:getcontentlength />
         <d:getcontenttype />
         <d:getetag />
         <d:resourcetype />
         <oc:fileid />
         <oc:size />
       </d:prop>
     </d:propfind>
     ```
3. **ETag Conditional Checks:**
   - Store the `d:getetag` of queried folders in client state.
   - On repeat checks, supply `If-None-Match: "{cached_etag}"`. Nextcloud will answer in ~5 ms with an empty `HTTP 304 Not Modified` payload.

---

## 4. Multi-Track Audio Streaming & Byte-Range Scrubbing
- When requesting audio stems for playback, waveform generation, or DAW preview, always include:
  `Range: bytes={start}-{end}`
- Because the server has PHP output buffering disabled and the OS buffer cache tuned, the server serves the requested audio slice directly from Linux RAM without reading or downloading the entire 50MB–200MB WAV file into memory.

---

## 5. Large File & Stem Pack Uploads
- Nextcloud PHP upload limits (`upload_max_filesize` and `post_max_size`) are configured to **16 GB** with **3600s** (1 hour) execution timeouts.
- When uploading over Cloudflare (`nextcloud.moyercloud.com`), Nextcloud is configured with `'files.chunked_upload.max_size' => 99000000` (99 MB chunks) to stay safely beneath Cloudflare's 100 MB body size cap.
- When uploading over Tailscale (`nextcloud.mermaid-symmetric.ts.net`), chunking is not constrained by Cloudflare limits.

---

## 6. Real-Time Push Sync (`notify_push`)
- **Do not poll the server with periodic PROPFIND intervals.**
- Nextcloud is running the native Rust push daemon (`notify_push` v1.4.1) mapped to:
  `wss://nextcloud.mermaid-symmetric.ts.net/push/ws` (or `/push/ws` via Cloudflare)
- Connect a client WebSocket listener to receive instant push events when stems are uploaded, converted, or deleted.
