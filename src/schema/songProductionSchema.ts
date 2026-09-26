import { Track, PromptItem, EngineSliders } from '../types';

/**
 * Standardized 4-Phase Storyboard Structure for every song in brickOS Studio
 */
export interface SongStoryboardPhase {
  phaseNumber: 1 | 2 | 3 | 4;
  phaseTitle: string;
  narrativeArc: string;
  shots: SongVisualPromptDef[];
}

export interface SongVisualPromptDef {
  shotNumber: number;
  title: string;
  modality: 'image' | 'video';
  engine: string;
  aspectRatio: '9:16' | '16:9' | '1:1';
  prompt: string;
  negativePrompt?: string;
  initialPrompt?: string; // 10s video seed
  extensionPrompt?: string; // 10s video continuation
  audioCues?: string;
  tags: string[];
}

/**
 * Standardized Song Metadata & Treatment Schema
 */
export interface SongPackageSchema {
  schemaVersion: '1.0.0';
  metadata: {
    id: string; // e.g. TRK-28
    title: string;
    ep: string;
    status: Track['status'];
    genre: string;
    bpm: number;
    key: string;
    vocalArchetype: string;
    vocalCast: string;
    thesis: string;
    targetAudience: string;
    theologicalAnchors: string[];
    createdAt: string;
    updatedAt: string;
  };
  audioProduction: {
    sunoPrompt: string;
    negativePrompt: string;
    engineSliders: EngineSliders;
    sonicMilestones: {
      introHook: string;
      preChorusBuild: string;
      throneRoomPivot: string;
      outroDecay: string;
    };
  };
  lyrics: {
    activeLyrics: string;
    versions: Array<{
      version: string;
      timestamp: string;
      reason: string;
      lyrics: string;
    }>;
  };
  visualTreatment: {
    artDirection: {
      colorPalette: string[];
      cinematicStyle: string;
      primaryMetaphor: string;
    };
    storyboard: SongStoryboardPhase[];
  };
}

/**
 * Generates the standardized 4-Phase Prompts for any song
 */
export function generateStandardStoryboardPrompts(
  trackId: string,
  title: string,
  genre: string,
  thesis: string,
  vocal: string,
  aspectRatio: '9:16' | '16:9' | '1:1' = '9:16'
): PromptItem[] {
  const cleanTitle = title.trim();
  const cleanId = trackId.toLowerCase();

  return [
    // Phase 1: Foundation & Tension
    {
      id: `${cleanId}-p1-img-01`,
      song: cleanTitle,
      trackId: trackId,
      title: `${cleanTitle} – Phase 1: Opening Tension & Dawn Light`,
      modality: 'image',
      engine: 'Midjourney / Flux',
      prompt: `Cinematic establishing shot for "${cleanTitle}". Early morning blue-hour transitioning to golden dawn, authentic textured artisan workspace or blue-collar setting, dramatic Rembrandt lighting, chiaroscuro shadow depth, 50mm anamorphic lens, 8k photorealistic. Metaphor: ${thesis}`,
      negativePrompt: 'cartoon, CGI glossy plastic, text watermark, flat lighting, oversaturated neon',
      aspectRatio,
      tags: [cleanTitle, 'Phase 1', 'Exposition', 'Dawn', 'Photorealistic'],
      isFavorite: true,
      createdAt: new Date().toISOString().split('T')[0],
      notes: `Standard Phase 1 Visual for ${cleanTitle}`
    },
    {
      id: `${cleanId}-p1-vid-01`,
      song: cleanTitle,
      trackId: trackId,
      title: `${cleanTitle} – Phase 1: 20s Short (Initial 10s + Continuation)`,
      modality: 'video',
      engine: 'Veo 3 / Grok',
      prompt: `Initial 10s: Slow camera tracking in on a resolute individual reflecting quietly in low warm light, steam rising, atmospheric tension. Extension 10s: The subject looks up with unwavering resolve as morning sunlight breaks across the frame, camera pulls back gracefully.`,
      initialPrompt: `Slow camera tracking in on a resolute individual reflecting quietly in low warm light, atmospheric tension, cinematic depth.`,
      extensionPrompt: `The subject looks up with unwavering resolve as morning sunlight breaks across the frame, camera pulls back gracefully.`,
      audioCues: `Subtle rhythmic pulse, distant rain/wind ambient foley, quiet acoustic guitar flatpick entrance.`,
      aspectRatio: aspectRatio === '1:1' ? '9:16' : aspectRatio,
      tags: [cleanTitle, 'Phase 1 Video', 'Veo 3', 'YouTube Short'],
      isFavorite: false,
      createdAt: new Date().toISOString().split('T')[0],
      notes: `20s standard YouTube Short sequence for Phase 1.`
    },

    // Phase 2: Development & Resistance
    {
      id: `${cleanId}-p2-img-01`,
      song: cleanTitle,
      trackId: trackId,
      title: `${cleanTitle} – Phase 2: The Grinding Work & Human Friction`,
      modality: 'image',
      engine: 'Midjourney / Flux',
      prompt: `Close-up shot of worn calloused hands actively laboring, coarse fabric and weathered wood or steel, shallow depth of field, dust motes floating in sunlight, high textural realism, documentary photography style, 8k. Context: ${cleanTitle}.`,
      negativePrompt: 'clean soft hands, stock photo smiles, plastic shine, cartoonish render',
      aspectRatio,
      tags: [cleanTitle, 'Phase 2', 'Labor', 'Hands', 'Friction'],
      isFavorite: false,
      createdAt: new Date().toISOString().split('T')[0],
      notes: `Phase 2: Visualizing human striving and resistance.`
    },

    // Phase 3: The Climax & Throne Room Pivot
    {
      id: `${cleanId}-p3-img-01`,
      song: cleanTitle,
      trackId: trackId,
      title: `${cleanTitle} – Phase 3: The Throne Room Pivot & Surrender`,
      modality: 'image',
      engine: 'Midjourney / Flux',
      prompt: `Epic cinematic breakthrough shot. Molten golden light pouring down from an open sanctuary sky, cracked broken vessels mended with glowing 24k gold Kintsugi seams, triumphant chiaroscuro, holy awe and sovereign reverence, 8k photorealistic. Thesis: ${thesis}`,
      negativePrompt: 'cheesy fantasy tropes, cheap lens flare, flat digital gradient',
      aspectRatio: '1:1',
      tags: [cleanTitle, 'Phase 3', 'Throne Room Pivot', 'Kintsugi', 'Master Art'],
      isFavorite: true,
      createdAt: new Date().toISOString().split('T')[0],
      notes: `Phase 3: The focal climax corresponding to the song's Bridge & drop.`
    },
    {
      id: `${cleanId}-p3-vid-01`,
      song: cleanTitle,
      trackId: trackId,
      title: `${cleanTitle} – Phase 3: Throne Room Pivot 20s Climax Short`,
      modality: 'video',
      engine: 'Veo 3 / Grok',
      prompt: `Initial 10s: Total visual freeze / slow motion as dust particles hang suspended in mid-air under dramatic spotlight. Extension 10s: An explosive cascade of golden light bursts forward as the full choir belts, camera rising rapidly toward the heavens.`,
      initialPrompt: `Total visual freeze / slow motion as dust particles hang suspended in mid-air under dramatic spotlight, sudden stillness.`,
      extensionPrompt: `An explosive cascade of golden light bursts forward as the full choir belts, camera rising rapidly toward the heavens.`,
      audioCues: `3 seconds dead vacuum silence, followed by explosive sub-bass drop, full vocal belt, and choir impact.`,
      aspectRatio: aspectRatio === '1:1' ? '9:16' : aspectRatio,
      tags: [cleanTitle, 'Phase 3 Video', 'Throne Room Pivot', 'Climax', 'Vacuum Silence'],
      isFavorite: true,
      createdAt: new Date().toISOString().split('T')[0],
      notes: `Video representation of the musical Throne Room Pivot.`
    },

    // Phase 4: Resolution & Kingdom Harvest
    {
      id: `${cleanId}-p4-img-01`,
      song: cleanTitle,
      trackId: trackId,
      title: `${cleanTitle} – Phase 4: Kingdom Resolution & Peace`,
      modality: 'image',
      engine: 'Midjourney / Flux',
      prompt: `Wide majestic vista at sunset. A solid stone foundation standing firm amidst flourishing mountain fields, soft golden hour glow, quiet resting peace, unshakeable confidence in Christ, 16:9 cinematic landscape, 8k photorealistic.`,
      negativePrompt: 'ruins, dark storm clouds, despair, artificial saturation',
      aspectRatio: '16:9',
      tags: [cleanTitle, 'Phase 4', 'Resolution', 'Sovereign Peace', '16:9'],
      isFavorite: false,
      createdAt: new Date().toISOString().split('T')[0],
      notes: `Phase 4: Visual resolution for Outro and Epilogue.`
    }
  ];
}

/**
 * Creates a complete standardized Track object adhering to the schema
 */
export function buildStandardTrackPackage(params: {
  id: string;
  title: string;
  ep: string;
  genre: string;
  bpm: number;
  key: string;
  vocalArchetype: string;
  vocalCast?: string;
  thesis: string;
  lyrics?: string;
  sunoPrompt?: string;
  negativePrompt?: string;
  engineSliders?: EngineSliders;
}): { track: Track; prompts: PromptItem[]; schemaPackage: SongPackageSchema } {
  const finalTitle = params.title.trim() || 'New Sovereign Track';
  const finalLyrics = params.lyrics?.trim() || `[Vocal Archetype: ${params.vocalArchetype}]\n[Verse 1]\nFrom the foundation of the cornerstone,\nWe stand where truth is made known.\n\n[Chorus]\n[The 60-Second Hook]\nBrokenness redeemed in sovereign grace,\nLooking into the Father's face!\n\n[Bridge]\n[The Throne Room Pivot]\n[Sudden 2-Second Vacuum Silence]\nNOT BY MIGHT, NOR BY POWER,\nBUT BY THE SPIRIT IN THIS HOUR!\n\n[Outro]\nRest upon the cornerstone.`;

  const sunoPrompt = params.sunoPrompt || 
    `Sovereign ${params.genre}, ${params.bpm} BPM, Key of ${params.key}, raw dynamic vocal belt, organic Nashville acoustics, deep punchy rhythmic bass, warm Hammond B3 swell, Throne Room Pivot`;

  const negativePrompt = params.negativePrompt || 
    'sibilance, high-frequency hiss, piercing treble, digital artifacts, muddy bass, autotune, robotic pitch correction, lo-fi wash';

  const engineSliders: EngineSliders = params.engineSliders || {
    weirdness: 12,
    styleInfluence: 68,
    voiceAudio: 100
  };

  const track: Track = {
    id: params.id,
    ep: params.ep,
    title: finalTitle,
    status: 'Idea / Concept',
    genre: params.genre,
    bpm: params.bpm,
    key: params.key,
    vocal: params.vocalArchetype.split(' (')[0],
    vocalCast: params.vocalCast || `${params.vocalArchetype} (Lead Vocalist)`,
    thesis: params.thesis || `Theological thesis for "${finalTitle}": Sovereignty and surrender in Christ.`,
    sunoPrompt,
    negativePrompt,
    engineSliders,
    lyrics: finalLyrics,
    versions: [
      {
        version: 'v1.0',
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        reason: 'Initial creation via Standardized Production Schema',
        lyrics: finalLyrics,
        bpm: params.bpm,
        genre: params.genre,
        vocal: params.vocalArchetype
      }
    ],
    selahPrayed: false
  };

  const prompts = generateStandardStoryboardPrompts(
    params.id,
    finalTitle,
    params.genre,
    track.thesis,
    params.vocalArchetype
  );

  const schemaPackage: SongPackageSchema = {
    schemaVersion: '1.0.0',
    metadata: {
      id: track.id,
      title: track.title,
      ep: track.ep,
      status: track.status,
      genre: track.genre,
      bpm: track.bpm,
      key: track.key,
      vocalArchetype: params.vocalArchetype,
      vocalCast: track.vocalCast,
      thesis: track.thesis,
      targetAudience: 'Christian Believers, Men of God, Sovereign Worshipers, Blue Collar Workers',
      theologicalAnchors: ['Brokenness Redeemed', 'Christ The Cornerstone', 'Sovereignty'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    audioProduction: {
      sunoPrompt: track.sunoPrompt,
      negativePrompt: track.negativePrompt,
      engineSliders: track.engineSliders,
      sonicMilestones: {
        introHook: '0:00 - Organic acoustic & voice intro',
        preChorusBuild: '0:35 - Driving sub-bass & acoustic rhythmic surge',
        throneRoomPivot: '2:15 - Sudden vacuum silence into explosive vocal stack',
        outroDecay: '3:10 - Hammond B3 chord decay & natural room reverberation'
      }
    },
    lyrics: {
      activeLyrics: track.lyrics,
      versions: track.versions
    },
    visualTreatment: {
      artDirection: {
        colorPalette: ['#1e1b4b', '#d97706', '#0f172a', '#f59e0b', '#ffffff'],
        cinematicStyle: '8k photorealistic chiaroscuro, natural golden sunlight, shallow depth of field',
        primaryMetaphor: track.thesis
      },
      storyboard: [
        {
          phaseNumber: 1,
          phaseTitle: 'Phase 1: Foundation & Tension',
          narrativeArc: 'Exposition: Early morning reflection, human limitation, quiet dawn.',
          shots: prompts.filter(p => p.tags.includes('Phase 1')).map((p, idx) => ({
            shotNumber: idx + 1,
            title: p.title,
            modality: p.modality as 'image' | 'video',
            engine: p.engine,
            aspectRatio: (p.aspectRatio as any) || '9:16',
            prompt: p.prompt,
            negativePrompt: p.negativePrompt,
            initialPrompt: p.initialPrompt,
            extensionPrompt: p.extensionPrompt,
            audioCues: p.audioCues,
            tags: p.tags
          }))
        },
        {
          phaseNumber: 2,
          phaseTitle: 'Phase 2: Development & Resistance',
          narrativeArc: 'The struggle: Calloused hands laboring, physical friction, the wear of self-reliance.',
          shots: prompts.filter(p => p.tags.includes('Phase 2')).map((p, idx) => ({
            shotNumber: idx + 1,
            title: p.title,
            modality: p.modality as 'image' | 'video',
            engine: p.engine,
            aspectRatio: (p.aspectRatio as any) || '9:16',
            prompt: p.prompt,
            negativePrompt: p.negativePrompt,
            initialPrompt: p.initialPrompt,
            extensionPrompt: p.extensionPrompt,
            audioCues: p.audioCues,
            tags: p.tags
          }))
        },
        {
          phaseNumber: 3,
          phaseTitle: 'Phase 3: The Climax & Throne Room Pivot',
          narrativeArc: 'The turning point: 3-second vacuum silence, surrender, golden Kintsugi redemption.',
          shots: prompts.filter(p => p.tags.includes('Phase 3')).map((p, idx) => ({
            shotNumber: idx + 1,
            title: p.title,
            modality: p.modality as 'image' | 'video',
            engine: p.engine,
            aspectRatio: (p.aspectRatio as any) || '9:16',
            prompt: p.prompt,
            negativePrompt: p.negativePrompt,
            initialPrompt: p.initialPrompt,
            extensionPrompt: p.extensionPrompt,
            audioCues: p.audioCues,
            tags: p.tags
          }))
        },
        {
          phaseNumber: 4,
          phaseTitle: 'Phase 4: Resolution & Kingdom Harvest',
          narrativeArc: 'Resolution: Peace in Christ, unshakeable stone foundation, eternal security.',
          shots: prompts.filter(p => p.tags.includes('Phase 4')).map((p, idx) => ({
            shotNumber: idx + 1,
            title: p.title,
            modality: p.modality as 'image' | 'video',
            engine: p.engine,
            aspectRatio: (p.aspectRatio as any) || '16:9',
            prompt: p.prompt,
            negativePrompt: p.negativePrompt,
            tags: p.tags
          }))
        }
      ]
    }
  };

  return { track, prompts, schemaPackage };
}
