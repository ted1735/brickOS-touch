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
}

export interface EngineSliders {
  weirdness: number;
  styleInfluence: number;
  voiceAudio: number;
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
  selahPrayed?: boolean;
  notes?: string;
}

export interface EPCollection {
  id: string;
  title: string;
  theme: string;
}

export interface NightCafePrompt {
  song: string;
  idx: number;
  title: string;
  prompt: string;
  aspectRatio?: string;
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
  url: string;
  prompt: string;
  aspectRatio: string;
  timestamp: string;
  mode: 'create' | 'edit';
  trackTitle?: string;
}

export interface GeneratedVideo {
  id: string;
  operationName: string;
  prompt: string;
  aspectRatio: '16:9' | '9:16';
  videoUrl?: string;
  status: 'pending' | 'ready' | 'failed';
  timestamp: string;
  modelUsed: string;
  trackTitle?: string;
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

