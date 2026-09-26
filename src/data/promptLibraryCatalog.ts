import { PromptItem } from '../types';
import { MMH_IMAGE_PROMPTS, MMH_GROK_VIDEO_PROMPTS } from './canonicalPrompts';
import { CANONICAL_TRACKS } from './canonicalCatalog';

// Transform MMH Image Prompts into PromptItem format
const mmhImageItems: PromptItem[] = MMH_IMAGE_PROMPTS.map((p, idx) => ({
  id: `mmh-img-${String(idx + 1).padStart(2, '0')}`,
  song: "Meet Me Here",
  trackId: "TRK-16",
  title: p.title,
  modality: 'image',
  engine: p.engine || 'Midjourney / Flux',
  prompt: p.prompt,
  negativePrompt: "low quality, distorted fingers, extra limbs, oversaturated, plastic skin, cartoonish, watermark",
  aspectRatio: (p.aspectRatio as any) || "9:16",
  tags: [...(p.tags || []), "MMH 30-Shot", "Story Sequence"],
  isFavorite: idx === 0 || idx === 1 || idx === 2 || idx === 27, // Favorite key moments
  createdAt: "2026-09-24",
  notes: `Part of the 30-shot canonical Meet Me Here visual storyboard. Shot #${idx + 1}.`
}));

// Transform MMH Video Prompts into PromptItem format
const mmhVideoItems: PromptItem[] = MMH_GROK_VIDEO_PROMPTS.map((p, idx) => ({
  id: `mmh-vid-${String(idx + 1).padStart(2, '0')}`,
  song: "Meet Me Here",
  trackId: "TRK-16",
  title: p.title,
  modality: 'video',
  engine: p.engine || 'Grok / Veo 3 / Kling',
  prompt: p.prompt,
  negativePrompt: "fast erratic camera cuts, jittery morphing, unnatural facial movement, blurry motion, low resolution",
  aspectRatio: (p.aspectRatio as any) || "9:16",
  initialPrompt: p.initialPrompt,
  extensionPrompt: p.extensionPrompt,
  audioCues: p.audioCues,
  tags: [...(p.tags || []), "MMH Video Short", "Grok-Optimized", "10s+Extension"],
  isFavorite: idx === 0 || idx === 7 || idx === 11, // Key shorts
  createdAt: "2026-09-24",
  notes: "20-second YouTube Short sequence (10s initial + 10s seamless extension) with synchronized sound cues."
}));

// MMH Dedicated Audio Prompts
const mmhAudioItems: PromptItem[] = [
  {
    id: "mmh-aud-01",
    song: "Meet Me Here",
    trackId: "TRK-16",
    title: "Meet Me Here – Raw & Vulnerable Breakdown (Suno v5.5)",
    modality: "audio",
    engine: "Suno v5.5",
    prompt: "Slow-Burn Cinematic CHH, 76 BPM, half-time feel, dark orchestral strings with distant rain and low truck engine rumble, deep distorted 808 sub-bass that feels like a heartbeat under pressure, emotional grand piano notes that feel lonely and heavy, vacuum atmospheric silence, subtle cinematic sound design",
    negativePrompt: "sibilance, radio pop polish, confident delivery, auto-tune, happy melodies, thin bass, fast tempo",
    bpm: 76,
    key: "D Minor",
    genre: "Slow-Burn Cinematic CHH",
    vocalArchetype: "Brandon / Weary Father (Mid-40s gravelly weary voice, vocal fry, breathy delivery, voice cracking under weight)",
    audioCues: "3 seconds dead vacuum silence after 'I don't know', sudden explosive strained scream 'WHO CAN'T DO IT THIS TIME?!', heavy door slam reverb tail",
    sliders: { weirdness: 16, styleInfluence: 72, voiceAudio: 100 },
    tags: ["Suno v5.5", "Cinematic CHH", "Vacuum Silence", "Door Slam", "Explosive Scream", "Weary Father"],
    isFavorite: true,
    createdAt: "2026-09-24",
    notes: "The definitive 2 AM truck breakdown cut. Features the famous 3-second vacuum silence and sudden scream."
  },
  {
    id: "mmh-aud-02",
    song: "Meet Me Here",
    trackId: "TRK-16",
    title: "Meet Me Here – Original PATD / Brandon Lagged Flow (Suno v4)",
    modality: "audio",
    engine: "Suno v4",
    prompt: "Cinematic rain, slow heavy rhythmic heartbeat kick drum, lagged 76 BPM flow, behind the beat, raw intimate grand piano, tectonic half-time drop, anthemic vocal stack",
    negativePrompt: "sibilance, synthesized autotune, upbeat pop, EDM drops",
    bpm: 76,
    key: "D Minor",
    genre: "Cinematic Blue-Collar Psalm",
    vocalArchetype: "Brandon or PATD (Emotive deep resonance, behind-the-beat delivery)",
    audioCues: "Heartbeat kick drum pulse, cinematic rain ambience, lagged rhythmic cadence",
    sliders: { weirdness: 14, styleInfluence: 70, voiceAudio: 100 },
    tags: ["Suno v4", "Blue-Collar Psalm", "Lagged Pocket", "Acoustic Rain"],
    isFavorite: false,
    createdAt: "2026-09-04",
    notes: "Original 76 BPM blue-collar psalm pocket with heartbeat kick."
  },
  {
    id: "mmh-aud-03",
    song: "Meet Me Here",
    trackId: "TRK-26",
    title: "Meet Me Here – Harder Scream Cut Reprise",
    modality: "audio",
    engine: "Suno v5.5",
    prompt: "Slow-burn cinematic CHH, 76 BPM, half-time feel, dark strings, distant rain, truck rumble, distorted 808 sub, dead vacuum silence, explosive scream",
    negativePrompt: "sibilance, radio pop, confident vocal, choir, motivational tone, clean mix",
    bpm: 76,
    key: "D Minor",
    genre: "Slow-Burn Cinematic CHH",
    vocalArchetype: "Brandon (Unpolished 2 AM Truck Breakdown)",
    audioCues: "Explosive vocal fry scream: 'WHO CAN'T DO IT THIS TIME?!', distorted door slam reverb",
    sliders: { weirdness: 18, styleInfluence: 75, voiceAudio: 100 },
    tags: ["Explosive Climax", "Scream Reprise", "Heavy Door Slam"],
    isFavorite: false,
    createdAt: "2026-09-04",
    notes: "Isolated reprise focusing on the emotional peak and raw vocal fry strain."
  }
];

// Additional Visual & Video Prompts for other songs in the catalog
const otherSongVisualAndVideoItems: PromptItem[] = [
  // Check Your Heart Light
  {
    id: "cyhl-img-01",
    song: "Check Your Heart Light",
    trackId: "TRK-08",
    title: "Muddy Boots Beside Open Truck Hood at Dusk",
    modality: "image",
    engine: "Midjourney / Flux",
    prompt: "Close-up of worn muddy leather work boots resting on gravel beside an open pickup truck hood on a country gravel shoulder at dusk. Amber hazard blinkers reflect off wet gravel, warm golden altar glow emanating from the engine bay, 9:16 vertical, photorealistic 8k.",
    negativePrompt: "clean new boots, studio lighting, plastic textures, cartoon",
    aspectRatio: "9:16",
    tags: ["Muddy Boots", "Altar Pull-Over", "Gravel Shoulder", "Country Dusk"],
    isFavorite: true,
    createdAt: "2026-09-20",
    notes: "Visual representation of 'Faith gets muddy boots walking down this street'."
  },
  {
    id: "cyhl-vid-01",
    song: "Check Your Heart Light",
    trackId: "TRK-08",
    title: "Check Your Heart Light – Popping The Hood at Altar (Veo 3)",
    modality: "video",
    engine: "Veo 3 / Kling",
    prompt: "Initial 10s: A weary driver steps out onto the gravel shoulder of Highway 9 at twilight. Amber hazard lights pulse rhythmically. Hands reach up and pop the truck hood open, golden light spills out onto his face. Extension 10s: He raises both hands, stepping back from the wheel, lips whispering a prayer as storm clouds break in the distance.",
    initialPrompt: "A weary driver steps out onto the gravel shoulder of Highway 9 at twilight. Amber hazard lights pulse rhythmically. Hands reach up and pop the truck hood open, golden light spills out onto his face.",
    extensionPrompt: "He raises both hands, stepping back from the wheel, lips whispering a prayer as storm clouds break in the distance, dramatic camera crane up into the golden sunset.",
    audioCues: "Hazard flasher clicking, gravel footsteps, distant thunder, rising Hammond B3 chord",
    aspectRatio: "9:16",
    tags: ["Veo 3", "YouTube Short", "Highway 9", "Throne Room Pivot"],
    isFavorite: true,
    createdAt: "2026-09-22",
    notes: "The Throne Room Pivot scene: Popped the hood right at the altar."
  },

  // The Work Ain't Done
  {
    id: "twad-img-01",
    song: "The Work Ain't Done",
    trackId: "TRK-27",
    title: "Clinician Bedside Firewall at Sunset",
    modality: "image",
    engine: "Midjourney / Flux",
    prompt: "Cinematic low-angle shot of a dedicated clinician in navy blue scrubs standing resolute at a hospital doorway threshold, holding a clipboard firmly against chest. Golden hour sunlight streams through the glass windows, haloing their silhouette, deep determined compassionate expression, 9:16 vertical, photorealistic 8k.",
    negativePrompt: "cartoony, clinic stock photo smiles, oversaturated, blurry",
    aspectRatio: "9:16",
    tags: ["Frontline Healthcare", "Bedside Firewall", "Doorway Threshold", "Holy Ground"],
    isFavorite: true,
    createdAt: "2026-09-24",
    notes: "Visual metaphor: 'Till that safety net is built, we stand as the firewall!'"
  },
  {
    id: "twad-vid-01",
    song: "The Work Ain't Done",
    trackId: "TRK-27",
    title: "Teach Back at Bedside – Discharge Done? (Veo 3)",
    modality: "video",
    engine: "Veo 3 / Kling",
    prompt: "Initial 10s: A hospital hallway with a wheelchair being prepared. The clinician gently pauses the transport at the room doorway, leaning down to make direct eye contact with the elderly patient and daughter. Extension 10s: The patient smiles and points to their inhaler, demonstrating understanding. The clinician nods with relief, high-fiving the daughter.",
    initialPrompt: "A hospital hallway with a wheelchair being prepared. The clinician gently pauses the transport at the room doorway, leaning down to make direct eye contact with the elderly patient and daughter.",
    extensionPrompt: "The patient smiles and points to their inhaler, demonstrating understanding. The clinician nods with relief, high-fiving the daughter as warm morning light fills the room.",
    audioCues: "Hospital call bell chime, rhythmic boom-bap rimshot, spoken voice: 'Teach back the truth before they step into the street.'",
    aspectRatio: "9:16",
    tags: ["Veo 3", "YouTube Short", "Clinical Teach Back", "Recovery Firewall"],
    isFavorite: true,
    createdAt: "2026-09-24",
    notes: "Emphasizes the core healthcare mission: extending Christ's healing ministry beyond discharge."
  },

  // Trading In The Mask
  {
    id: "titm-img-01",
    song: "Trading In The Mask",
    trackId: "TRK-24",
    title: "Shattered Porcelain Mask with 24k Gold Kintsugi",
    modality: "image",
    engine: "Midjourney / Flux",
    prompt: "Macro slow motion shot of an ornate white porcelain theatrical mask shattering mid-air, jagged cracks instantly mending and glowing with molten 24k liquid gold kintsugi seams. Deep obsidian background, golden bokeh dust particles, dramatic Rembrandt lighting, photorealistic 8k, 1:1 square.",
    negativePrompt: "cartoon, flat lighting, plastic, low detail",
    aspectRatio: "1:1",
    tags: ["Kintsugi", "Album Cover", "Porcelain Mask", "Liquid Gold"],
    isFavorite: true,
    createdAt: "2026-09-20",
    notes: "Official album art concept for Trading In The Mask."
  },
  {
    id: "titm-vid-01",
    song: "Trading In The Mask",
    trackId: "TRK-24",
    title: "Trading In The Mask – Reversing Shards into Heart (Veo 3)",
    modality: "video",
    engine: "Veo 3 / Kling",
    prompt: "Initial 10s: A hand drops a cracked handheld looking-glass mirror. Shards burst across the dark stone floor in slow motion. Extension 10s: The mirror shards begin floating upward in reverse motion, glowing with warm amber light, coalescing into a beating golden translucent heart.",
    initialPrompt: "A hand drops a cracked handheld looking-glass mirror. Shards burst across the dark stone floor in slow motion with shimmering silver dust.",
    extensionPrompt: "The mirror shards begin floating upward in reverse motion, glowing with warm amber light, coalescing into a beating golden translucent heart.",
    audioCues: "Glass shatter impact, single deep B3 organ swell, full gospel choir explosion",
    aspectRatio: "9:16",
    tags: ["Veo 3", "Looking-Glass", "Restoration", "Gospel Drop"],
    isFavorite: false,
    createdAt: "2026-09-22",
    notes: "The visual transition from broken glass to restored heart."
  },

  // Venom Into Victory
  {
    id: "viv-img-01",
    song: "Venom Into Victory",
    trackId: "TRK-18",
    title: "Golden Whistle & Shimmer Volcano",
    modality: "image",
    engine: "Midjourney / Flux",
    prompt: "Hyper-saturated K-Pop aesthetic, 3D chrome golden referee whistle spinning over a shimmering liquid gold lava volcano with electric magenta and neon cyan accents, volumetric stage lighting, 9:16 vertical, hyper-detailed 8k render.",
    negativePrompt: "drab colors, blue-collar grit, low resolution",
    aspectRatio: "9:16",
    tags: ["K-Pop", "Neon Gospel", "Golden Whistle", "Hyper-Pop"],
    isFavorite: false,
    createdAt: "2026-09-20",
    notes: "Visual for the high-energy K-Pop viral track."
  },

  // Brick by Brick
  {
    id: "bbb-img-01",
    song: "Brick by Brick",
    trackId: "TRK-01",
    title: "Foundational Cornerstone in Red Clay",
    modality: "image",
    engine: "Midjourney / Flux",
    prompt: "Cinematic shot of weathered granite cornerstone set into deep red clay soil under crisp morning light. Architectural blueprint sketches faintly glowing in the dust motes, plumb line hanging perfectly vertical, 8k photorealistic, 1:1 square.",
    negativePrompt: "crooked lines, cartoon, blurry blueprints",
    aspectRatio: "1:1",
    tags: ["Foundation", "Cornerstone", "Plumb Line", "Album Art"],
    isFavorite: true,
    createdAt: "2026-09-20",
    notes: "The cornerstone of the entire brickOS catalog."
  },

  // The Master's Hand
  {
    id: "tmh-img-01",
    song: "The Master's Hand",
    trackId: "TRK-02",
    title: "The Spinning Wood Lathe & Glowing Ribbons",
    modality: "image",
    engine: "Midjourney / Flux",
    prompt: "Macro 120fps shot of dark walnut spinning violently on a woodturning lathe, glowing golden shavings curling off in ribbons under a sharp chisel. Warm workshop lighting, atmospheric sawdust particles illuminated like stars, 16:9 cinematic, photorealistic 8k.",
    negativePrompt: "plastic tools, modern cnc machine, cartoon",
    aspectRatio: "16:9",
    tags: ["Wood Lathe", "Chiseling Pride", "Sanctification", "16:9 Cinematic"],
    isFavorite: false,
    createdAt: "2026-09-20",
    notes: "The central metaphor of sanctification under the lathe."
  },

  // Nothing But The Blood
  {
    id: "nbtb-img-01",
    song: "Nothing But The Blood",
    trackId: "TRK-04",
    title: "River of Living Water in Desert Canyon",
    modality: "image",
    engine: "Midjourney / Flux",
    prompt: "Epic cinematic wide shot of a radiant crystal living water river cutting through a cracked red desert canyon. Golden sunrise mist rising above the rapids, lush green life sprouting along the riverbanks, 16:9 cinematic landscape, 8k photorealistic.",
    negativePrompt: "polluted water, dark drab canyon, low res",
    aspectRatio: "16:9",
    tags: ["Living Water", "Desert River", "Hymn Reimagining", "16:9 Cinematic"],
    isFavorite: false,
    createdAt: "2026-09-20",
    notes: "The river in our bones flowing through the desert."
  },

  // The Milestone (Confident & Consistent)
  {
    id: "mil-img-01",
    song: "The Milestone",
    trackId: "TRK-21",
    title: "15k Step Pavement at Sunrise Tracking Shot",
    modality: "image",
    engine: "Midjourney / Flux",
    prompt: "Low-angle dynamic tracking shot of aggressive running shoes striking wet asphalt at sunrise, golden sunburst reflecting off puddles. Smartwatch glowing with '15,000 steps', steam rising from athlete's arms, 9:16 vertical, crisp sports photography.",
    negativePrompt: "couch potato, gym indoors, cartoon, blurry shoe",
    aspectRatio: "9:16",
    tags: ["Workout", "15k Steps", "Consistent", "Sunrise Run"],
    isFavorite: false,
    createdAt: "2026-09-22",
    notes: "Visual representation of Courtney's 45th birthday fitness milestone."
  },

  // Blindfold Blessing
  {
    id: "bfb-img-01",
    song: "Blindfold Blessing",
    trackId: "TRK-23",
    title: "Linen Blindfold & Mountain Bridge Dawn Mist",
    modality: "image",
    engine: "Midjourney / Flux",
    prompt: "Poetic portrait of a serene man in coarse linen blindfold walking calmly across a narrow wooden suspension bridge shrouded in dawn mountain clouds. Sunlight piercing through the fog, hand lightly touching the rope railing, 9:16 vertical, photorealistic 8k.",
    negativePrompt: "fearful face, modern clothes, falling, cartoon",
    aspectRatio: "9:16",
    tags: ["Blindfold", "Faith Step", "Mountain Mist", "Holy I Don't Know"],
    isFavorite: false,
    createdAt: "2026-09-22",
    notes: "The visual embodiment of 'A holy I don't know'."
  }
];

// Audio Generation Prompts for each canonical track in the catalog (Suno v4 / v5.5)
const canonicalTrackAudioPrompts: PromptItem[] = CANONICAL_TRACKS.map(trk => ({
  id: `aud-${trk.id.toLowerCase()}`,
  song: trk.title,
  trackId: trk.id,
  title: `${trk.title} – Official Suno Studio Prompt [${trk.bpm} BPM]`,
  modality: 'audio',
  engine: 'Suno v5.5 / v4',
  prompt: trk.sunoPrompt,
  negativePrompt: trk.negativePrompt,
  bpm: trk.bpm,
  key: trk.key,
  genre: trk.genre,
  vocalArchetype: trk.vocalCast || trk.vocal,
  sliders: trk.engineSliders,
  tags: [trk.ep, `${trk.bpm} BPM`, trk.key, "Canonical Track", "Studio Master"],
  isFavorite: trk.id === 'TRK-16' || trk.id === 'TRK-27' || trk.id === 'TRK-08' || trk.id === 'TRK-04',
  createdAt: "2026-09-24",
  notes: `Official Suno AI engine prompt for ${trk.title}. Tuned for 24-Bit / 48kHz linear PCM mastering.`
}));

// Master export combining MMH Image, MMH Video, MMH Audio, and other canonical assets
export const CANONICAL_PROMPT_LIBRARY: PromptItem[] = [
  ...mmhAudioItems,
  ...mmhVideoItems,
  ...mmhImageItems,
  ...otherSongVisualAndVideoItems,
  ...canonicalTrackAudioPrompts
];
