export type TrackStatus = 
  | 'Idea / Concept' 
  | 'Lyrics Finalized' 
  | 'In Progress' 
  | 'UVR5 Stem Prep' 
  | 'Audio Master' 
  | 'Sent for Distribution' 
  | 'Released';

export interface TrackVersion {
  version: string;
  timestamp: string;
  reason: string;
  lyrics: string;
  bpm?: number;
  genre?: string;
  vocal?: string;
  archetype?: string;
  stylePrompt?: string;
}

export interface EngineSliders {
  weirdness: number;
  styleInfluence: number;
  voiceAudio: number;
}

export interface AuditFeedbackRecord {
  id: string;
  timestamp: string;
  model: string;
  feedback: string;
  status: 'pending' | 'applied' | 'dismissed';
  preRevisionVersion?: string;
  postRevisionVersion?: string;
}

export interface CompositionSessionSnapshot {
  lyrics: string;
  sunoPrompt: string;
  negativePrompt: string;
  engineSliders: EngineSliders;
  bpm: number;
  key: string;
  genre: string;
  vocal: string;
  vocalCast: string;
  thesis: string;
  selahPrayed?: boolean;
  status: TrackStatus;
  notes?: string;
  versionsCount: number;
  latestVersionTag?: string;
}

export interface CompositionSession {
  id: string;
  name: string;
  trackId: string;
  trackTitle: string;
  ep: string;
  createdAt: string;
  updatedAt: string;
  activeTab?: string;
  description?: string;
  tags: string[];
  isPinned?: boolean;
  color?: string;
  snapshot: CompositionSessionSnapshot;
}

export interface Track {
  id: string;
  ep: string;
  title: string;
  status: TrackStatus;
  genre: string;
  bpm: number;
  key: string;
  vocal: string;
  vocalCast: string;
  thesis: string;
  sunoPrompt: string;
  negativePrompt: string;
  engineSliders: EngineSliders;
  lyrics: string;
  versions: TrackVersion[];
  auditHistory?: AuditFeedbackRecord[];
  selahPrayed?: boolean;
  notes?: string;
}

export interface EPCollection {
  id: string;
  title: string;
  theme: string;
}

export type PromptModality = 'image' | 'video' | 'audio';

export interface PromptItem {
  id: string;
  song: string;
  trackId?: string;
  title: string;
  modality: PromptModality;
  engine: string;
  prompt: string;
  negativePrompt?: string;
  aspectRatio?: string;
  
  // Video specific
  initialPrompt?: string;
  extensionPrompt?: string;
  audioCues?: string;
  cameraMovement?: string;

  // Audio specific
  bpm?: number;
  key?: string;
  genre?: string;
  vocalArchetype?: string;
  sliders?: EngineSliders;

  tags: string[];
  isFavorite?: boolean;
  createdAt?: string;
  notes?: string;
}

export interface NightCafePrompt {
  song: string;
  idx: number;
  title: string;
  prompt: string;
  aspectRatio?: string;
  type?: 'image' | 'video' | 'audio' | 'storyboard';
  engine?: string;
  initialPrompt?: string;
  extensionPrompt?: string;
  audioCues?: string;
  tags?: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  model: string;
}

export interface MixerTrack {
  id: number;
  name: string;
  vol: number;
  pan: number;
  muted: boolean;
  solo: boolean;
  trimIn: number;
  trimOut: number;
  freq: number;
  waveType: OscillatorType;
  color: string;
}

export interface GeneratedImage {
  id: string;
  name?: string;
  url: string;
  prompt: string;
  aspectRatio: string;
  timestamp: string;
  mode: 'create' | 'edit';
  trackTitle?: string;
  trackId?: string;
  linkedTrackIds?: string[]; // Linking the same asset to other catalog projects
  tags?: string[];
  notes?: string;
  category?: string;
  geminiEditHistory?: Array<{
    timestamp: string;
    instruction: string;
    previousUrl?: string;
    newUrl?: string;
  }>;
}

export interface GeneratedVideo {
  id: string;
  name?: string;
  operationName: string;
  prompt: string;
  aspectRatio: '16:9' | '9:16';
  videoUrl?: string;
  status: 'pending' | 'ready' | 'failed';
  timestamp: string;
  modelUsed: string;
  trackTitle?: string;
  trackId?: string;
  linkedTrackIds?: string[];
  tags?: string[];
  notes?: string;
  category?: string;
}

export type UniversalAssetType = 'image' | 'video' | 'stem' | 'nextcloud' | 'lyric_checkpoint';

export interface UniversalAssetItem {
  id: string;
  type: UniversalAssetType;
  name: string;
  url?: string;
  prompt?: string;
  notes?: string;
  trackId: string;
  trackTitle?: string;
  linkedTrackIds: string[];
  category: string;
  aspectRatio?: string;
  fileSizeFormatted?: string;
  format?: string;
  bpm?: number;
  key?: string;
  tags: string[];
  timestamp: string;
  originalRef?: any;
}

export interface YouTubeSEOReport {
  trackId: string;
  format: 'shorts' | 'longform';
  title: string;
  description: string;
  tags40Genre: string[];
  tags60Semantic: string[];
  schedulingWindow: string;
  signatureBlock: string;
  thumbnailPrompt1: string;
  thumbnailPrompt2: string;
  thumbnailPrompt3: string;
  woodworkingViolations: string[];
  score: number;
}

export interface OmniPostCampaign {
  id: string;
  trackTitle: string;
  template: 'viral_hook' | 'selah_bts' | 'anthem_drop' | 'fitness_15k';
  captionTikTok: string;
  captionIGReels: string;
  captionYTShorts: string;
  hashtags: string[];
  scheduledDate: string;
  audioStemUrl: string;
}

export interface ChordSheet {
  songTitle: string;
  key: string;
  bpm: number;
  timeSignature: string;
  chordProText: string;
  nashvilleText: string;
}

export type OfficialVocalArchetype = 
  | 'The Architect' 
  | 'Brandon' 
  | 'Ms T' 
  | 'Monica' 
  | 'Kane'
  | 'PATD'
  | 'Silas Thorne'
  | 'Neon Gospel';

export interface VocalArchetypeRecord {
  name: OfficialVocalArchetype;
  archetypeTitle: string;
  role: string;
  formantTexture: string;
  recommendedGenres: string;
}

export type StemPassType = 
  | 'Primary_Vocal' 
  | 'True_Instrumental' 
  | 'Dry_Studio_Vocal' 
  | 'DAW_Master_Session';

export interface AudioStemRecord {
  id: string;
  trackId: string;
  passType: StemPassType;
  modelUsed: string; // e.g. 'BS-Roformer-Viperx', 'Kim-Inst-v2', 'FoxJoy-DeReverb'
  isCompleted: boolean;
  webdavRelativePath: string;
  fullWebdavUrl: string;
  fileSizeBytes: number;
  sampleRateHz: number;
  bitDepth: number;
}

export type VisualAssetType = 
  | 'Album_Cover_Master' 
  | 'Video_Seed_Frame' 
  | 'Lyric_Video_Storyboard' 
  | 'Social_Shorts_Thumbnail' 
  | 'B_Roll_Cinematic_Plate';

export interface VisualAssetRecord {
  id: string;
  trackId: string;
  versionId: string;
  assetType: VisualAssetType;
  aspectRatio: '1:1' | '9:16' | '16:9';
  title: string;
  prompt: string;
  isActiveMaster: boolean;
  webdavRelativePath: string;
  fullWebdavUrl: string;
  similarityTags: string[];
  compatibleTracks: string[];
}

export interface InterchangeableAssetLink {
  id: string;
  primaryTrackId?: string;
  title: string;
  assetCategory: 'TRACK_BOUND' | 'CROSS_CATALOG_SHARED';
  assetType: 'VISUAL' | 'AUDIO_STEM' | 'VIDEO_PLATE' | 'BRANDING';
  webdavRelativePath: string;
  fullWebdavUrl: string;
  similarityTags: string[];
  compatibleTracks: string[]; // e.g. ['TRK-01', 'TRK-03', 'TRK-04', 'TRK-24']
  themeCluster: 'Theme_SanctuaryCross' | 'Theme_BlueCollarGrit' | 'CrossCatalog_BRoll' | 'Universal' | 'Theme_SurrenderMask';
  description: string;
  previewUrl?: string;
}

export interface SOPRuleDefinition {
  id: string;
  name: string;
  description: string;
  triggerType: 'required_tag' | 'forbidden_phrase' | 'contains_any' | 'ratio' | 'custom';
  tags?: string[];
  bannedPhrases?: string[];
  severity: 'error' | 'warning' | 'info';
  enabled: boolean;
}

export interface SOPRulesPackage {
  version: string;
  updatedAt: string;
  rawMarkdown: string;
  cliches: string[];
  requiredTags: string[];
  throneRoomTriggers: string[];
  sonicScarRatio: string;
  rules: SOPRuleDefinition[];
}

export type NextcloudAssetCategory =
  | 'MASTER_AUDIO'
  | 'UVR5_VOCAL_STEM'
  | 'INSTRUMENTAL_STEM'
  | 'LYRIC_SOP_DOC'
  | 'VISUAL_ARTWORK'
  | 'VIDEO_REEL'
  | 'CHORD_MIDI'
  | 'UNCATEGORIZED';

export interface NextcloudFolderAsset {
  id: string;
  filename: string;
  folderId: string; // e.g. '207332'
  category: NextcloudAssetCategory;
  fileSizeBytes: number;
  fileSizeFormatted: string;
  mimeType: string;
  webdavPath: string;
  shareUrl: string;
  matchedTrackId: string | null; // e.g. 'TRK-01' or null
  matchedTrackTitle?: string;
  matchConfidence: number; // 0 - 100
  suggestedTrackId?: string;
  suggestedCategory?: NextcloudAssetCategory;
  isMatched: boolean;
  bpm?: number;
  key?: string;
  audioDurationSeconds?: number;
  previewAudioType?: 'vocal' | 'harmony' | 'instrumental' | 'drums' | 'sawtooth';
  previewImageUrl?: string;
  notes?: string;
  name?: string;
  linkedTrackIds?: string[]; // Cross-catalog project links
  tags?: string[];
  lastSyncedAt: string;
}

export interface NextcloudSyncConfig {
  serverUrl: string;
  username: string;
  appPassword?: string;
  webdavRoot: string;
  folderIdOrShareUrl: string;
  lastConnectionStatus: 'connected' | 'unauthorized' | 'error' | 'idle';
  lastPingMs?: number;
  lastSyncTimestamp?: string;
}

export interface VideoExpressSceneClip {
  sceneNumber: number;
  sceneTitle: string;
  spokenLine: string;
  charCount: number;
  durationSeconds: number;
  cameraMovement: string;
  avatarExpression: string;
  trimHeadSeconds: number;
  trimTailSeconds: number;
  audioVoiceoverId: string;
  renderStatus: 'pending' | 'generating' | 'synced' | 'verified';
  evidenceStatus: 'pass' | 'fail';
}

export interface VideoExpressProject {
  id: string;
  title: string;
  trackId: string;
  trackTitle: string;
  characterName: string;
  characterArchetype: string;
  characterPrompt: string;
  referenceImageLocked: boolean;
  referenceImageSeed: number;
  referenceImageUrl?: string;
  voiceCloneName: string;
  voiceModel: string;
  aspectRatio: '9:16' | '16:9';
  totalDurationSeconds: number;
  deadAirTrimDefault: number;
  scenes: VideoExpressSceneClip[];
  systemPromptMd: string;
  evidenceTableVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export type SoundPresetCategory = 
  | 'Blue Collar Rock' 
  | 'Trap Worship' 
  | 'Modern Country' 
  | 'Acoustic Folk' 
  | 'Gospel Soul' 
  | 'Ambient Drone' 
  | 'Custom';

export interface SoundPreset {
  id: string;
  name: string;
  category: SoundPresetCategory;
  description: string;
  vocalCast?: string;
  sunoPrompt: string; // Block 2 Style Prompt
  negativePrompt: string; // Block 3 Excluded Styles
  engineSliders: EngineSliders; // Block 4 Engine Sliders
  targetBpm?: number;
  targetKey?: string;
  tags: string[];
  isFavorite?: boolean;
  isFactory?: boolean;
  author?: string;
  createdAt: string;
  updatedAt?: string;
}

// ==============================================================================
// DAW EFFECTS, PROCESSING RACK & PRESETS DEFINITIONS
// ==============================================================================

export interface DawMasterEq {
  low: number; // -12dB to +12dB (80 Hz Low Shelf)
  mid: number; // -12dB to +12dB (1 kHz Parametric Bell)
  high: number; // -12dB to +12dB (10 kHz High Shelf)
  enabled: boolean;
}

export interface DawCompressor {
  threshold: number; // -40dB to 0dB
  ratio: number; // 1:1 to 20:1
  attack: number; // 0.001s to 0.1s
  release: number; // 0.05s to 1.0s
  makeup: number; // 0dB to +12dB
  enabled: boolean;
}

export interface DawLimiter {
  ceiling: number; // -3.0dB to 0.0dB True Peak ceiling
  threshold: number; // -12.0dB to 0.0dB drive into limiter
  release: number; // 0.01s to 0.5s release time
  lookahead?: number; // lookahead in ms (0-10ms)
  enabled: boolean;
}

export interface DawReverb {
  mix: number; // 0% to 100% Wet
  decay: number; // 0.5s to 8.0s
  roomType: 'plate' | 'hall' | 'room' | 'cathedral';
  enabled: boolean;
}

export interface DawTapeDrive {
  drive: number; // 0% to 100% saturation
  warmth: boolean;
  enabled: boolean;
}

export interface DawStereoWidth {
  width: number; // 0% (Mono) to 200% (Super-wide)
  isMonoCollapse: boolean;
}

export interface DawEffectsState {
  eq: DawMasterEq;
  compressor: DawCompressor;
  limiter?: DawLimiter;
  reverb: DawReverb;
  tapeDrive: DawTapeDrive;
  stereo: DawStereoWidth;
  busRouting: 'master' | 'vocal' | 'instrumental' | 'suno' | 'ref';
  activeFxPresetName?: string;
  targetLufs?: number;
  correctionGainDb?: number;
  truePeakCeilingDb?: number;
}

export type MasteringCategory = 
  | 'Streaming'
  | 'Radio & Commercial'
  | 'Modern Punch'
  | 'Warm Vintage'
  | 'Acoustic & Classical'
  | 'Broadcast & Dialogue'
  | 'Corrective';

export interface MasteringPreset {
  id: string;
  name: string;
  category: MasteringCategory;
  targetLufs: number; // e.g. -14.0, -12.0, -9.0
  truePeakCeiling: number; // e.g. -1.0 dBTP
  targetLra?: number; // Target Loudness Range (LU)
  description: string;
  badge: string;
  platformSpec?: string;
  effects: DawEffectsState;
  limiterCeilingDb?: number;
  hpfCutoffHz?: number;
  tags: string[];
  isCustom?: boolean;
}

export interface LufsMeasurementData {
  momentaryLufs: number;
  shortTermLufs: number;
  integratedLufs: number;
  truePeakDb: number;
  lra: number;
  crestFactorDb: number;
  phaseCorrelation: number;
  targetLufs: number;
  targetCeilingDb: number;
  correctionGainDb: number;
  isCompliant: boolean;
  isClippingRisk: boolean;
  autoMatchActive: boolean;
}

export interface DawPresetsState {
  activeSoundPresetId?: string;
  activeSoundPresetName?: string;
  engineSliders: EngineSliders;
  sunoPrompt: string;
  negativePrompt: string;
  vocalCast?: string;
  targetBpm: number;
  targetKey: string;
  genre: string;
  activeFxPresetName?: string;
}

export interface DawTracksState {
  stems: MixerTrack[];
  masterVolume: number;
  cropPreset: '30s' | '60s' | 'full';
}

export type SnapshotTriggerType = 'auto' | 'manual' | 'preset_change' | 'milestone';

export interface SessionSnapshot {
  id: string;
  sessionId?: string;
  trackId: string;
  trackTitle: string;
  ep: string;
  timestamp: string;
  label: string;
  trigger: SnapshotTriggerType;
  dawTracks: DawTracksState;
  effects: DawEffectsState;
  presets: DawPresetsState;
  workspace: {
    activeTab: string;
    status: TrackStatus;
    bpm: number;
    key: string;
    lyricsExcerpt?: string;
  };
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ==============================================================================
// BLOCKSUITE & INFINITE WHITEBOARD DATA STRUCTURES
// ==============================================================================

export type BlockSuiteBlockType = 
  | 'song_section'   // [Verse], [Chorus], [Bridge], [Pre-Chorus], [Outro], [Intro], [Drop]
  | 'sticky_note'    // Quick brainstorm note / colorful sticky
  | 'chords_prog'    // Musical chord chart / Camelot harmonic flow
  | 'theology_sop'   // Nashville SOP & Throne Room rule check
  | 'suno_prompt'    // AI Style & Audio synthesis block
  | 'heading'        // Document heading (H1, H2, H3)
  | 'paragraph'      // Freeform lyric or production text
  | 'checklist';     // Task / milestone checklist block

export interface BlockSuiteConnector {
  id: string;
  sourceBlockId: string;
  targetBlockId: string;
  label?: string;
  color?: string;
  style?: 'curved' | 'straight' | 'orthogonal';
}

export interface BlockSuiteBlock {
  id: string;
  type: BlockSuiteBlockType;
  title: string;
  subtitle?: string;
  content: string;
  x: number;
  y: number;
  width: number;
  height?: number;
  color: string;
  tags?: string[];
  chords?: string;
  isLocked?: boolean;
  orderIndex: number;
  sectionTag?: string; // e.g. '[Verse 1]', '[Chorus]', '[Bridge]'
  completed?: boolean;
}

export interface WhiteboardCanvasDoc {
  id: string;
  title: string;
  trackId: string;
  trackTitle: string;
  ep?: string;
  activeMode: 'edgeless' | 'page'; // BlockSuite isomorphic mode
  blocks: BlockSuiteBlock[];
  connectors: BlockSuiteConnector[];
  viewport: {
    panX: number;
    panY: number;
    zoom: number;
  };
  gridType: 'dots' | 'grid' | 'blueprint' | 'blank';
  nextcloudSyncStatus?: {
    lastExportTime?: string;
    remotePath?: string;
    status: 'synced' | 'pending' | 'idle' | 'failed';
  };
  createdAt: string;
  updatedAt: string;
}

