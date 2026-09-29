---
name: nextcloud-music-production-indexing
description: Standard operating procedure and automated linking/indexing protocol for the entire /Music-Production/ folder in Nextcloud across all projects, songs, iterations, and stems.
---

# Nextcloud Music Production Indexing & Linking Standard

This skill establishes the permanent standard practice and behavior for every project, song, and iteration in the **brickOS Sovereign Studio** connecting to Nextcloud (`https://nextcloud.moyercloud.com/`).

---

## 1. Core Principle: Universal ECV Standard

Whatever was established for **ECV** (*Every Candle's Victory*) must be the default behavior for **every song, every iteration, and every project** in the catalog:

1. **Deterministic WebDAV Structure**: Every project folder lives under `/Music-Production/{FOLDER}/`.
2. **Lossless Master Audio**: 24-bit / 48kHz WAV prints per iteration (e.g. `v1.0`, `v2.0`, `v3.0`), tagged with style names and Nashville LUFS -14.1 compliance.
3. **Lossless Isolated 4-Stems**: Stems stored in `stems/` with UVR5 isolation (Lead Vocal BS-Roformer, Choir/Harmonies, Instrumental Bed, Rhythm/Drums/Bass) dynamically routed to the Mini-DAW mixer channels.
4. **Visual & Video Deliverables**:
   - `visuals/`: 4K 1:1 Album Artwork (`.png`) and 16:9 Storyboard Scene Plates (`.png`).
   - `video/`: 9:16 Vertical Video Reels (`.mp4`) for mobile/TikTok and 16:9 YouTube 4K Visualizer Loops.
5. **Theological & SOP Documentation**:
   - `docs/`: Markdown files containing lyrics, chord progressions, OBI funnel checks, and theological guardrail audits.
6. **Streaming & Partial Content**:
   - Stems and previews stream via `/api/nextcloud/stream?path=...` supporting HTTP 206 Partial Content for instant scrubbing.
7. **Whiteboard Canvas Integration**:
   - Lyrics automatically populate the 2D infinite canvas for any selected style/version with auto-fit, word search, and thumbnail linking.

---

## 2. Directory Hierarchy Reference

```text
/remote.php/dav/files/{USER}/Music-Production/
  ├── {PROJECT_FOLDER}/
  │   ├── {PROJECT}_Master_{VERSION}_{STYLE}_24bit48k.wav
  │   ├── stems/
  │   │   ├── {PROJECT}_Lead_Vocal_Clean_BS-Roformer.wav
  │   │   ├── {PROJECT}_Harmonies_Choir_UVR5.wav
  │   │   ├── {PROJECT}_Core_Instrumental_Bed.wav
  │   │   └── {PROJECT}_Rhythm_Section_Drums_Bass.wav
  │   ├── visuals/
  │   │   ├── {PROJECT}_Cover_Art_4k_1x1.png
  │   │   └── {PROJECT}_Storyboard_Scene_Plate_16x9.png
  │   ├── video/
  │   │   ├── {PROJECT}_Studio_Cinematic_Reel_1080p_9x16.mp4
  │   │   └── {PROJECT}_Visualizer_Loop_4k_16x9.mp4
  │   └── docs/
  │       └── {PROJECT}_Lyrics_And_Theological_SOP.md
```

---

## 3. Catalog Matching & Automated Ingestion

When scanning or crawling Nextcloud folders, the system must:
- Match filenames against project aliases, acronyms, and track IDs with case-insensitive normalization.
- Map MIME types and naming tokens to `MASTER_AUDIO`, `UVR5_VOCAL_STEM`, `INSTRUMENTAL_STEM`, `VISUAL_ARTWORK`, `VIDEO_REEL`, or `LYRIC_SOP_DOC`.
- Auto-link verified assets with 100% confidence into the Mini-DAW mixer and Whiteboard canvas without requiring manual user re-tagging.
- Maintain persistent offline cache while seamlessly synchronizing live updates from Nextcloud WebDAV.
