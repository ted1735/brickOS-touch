import { SoundPreset } from '../types';

export const CANONICAL_SOUND_PRESETS: SoundPreset[] = [
  {
    id: 'PRESET-01-CALVARY-GRIT',
    name: 'Calvary Blue Collar Grit',
    category: 'Blue Collar Rock',
    description: 'Raw blue-collar Southern rock grit with overdriven tube guitars, live acoustic drums, and gravelly Nashville conviction.',
    vocalCast: 'Silas Thorne (Gravelly Nashville Voice)',
    sunoPrompt: 'Southern rock, gritty electric guitar riff, warm tube overdrive, natural acoustic drum room, live bass guitar, raw vocal timbre, Nashville blue-collar rock, 48kHz audio',
    negativePrompt: 'sibilance, high-frequency digital hiss, autotune artifacts, electronic synth pads, plastic drums, metallic reverb',
    engineSliders: {
      weirdness: 10,
      styleInfluence: 78,
      voiceAudio: 95
    },
    targetBpm: 76,
    targetKey: 'D Minor',
    tags: ['#SouthernRock', '#BlueCollar', '#SilasThorne', '#Grit'],
    isFavorite: true,
    isFactory: true,
    author: 'BRICK Records Nashville',
    createdAt: '2026-03-01T00:00:00.000Z'
  },
  {
    id: 'PRESET-02-SANCTUARY-TRAP',
    name: 'Sanctuary 808 Trap-Worship',
    category: 'Trap Worship',
    description: 'Subterranean 808 sub-bass, atmospheric reversed vocal chops, crisp rolling hi-hats, and emotive melodic hooks.',
    vocalCast: 'The Architect & Ms T (Dynamic Duet)',
    sunoPrompt: 'Christian hip hop, modern trap worship, rolling 808 sub bass, atmospheric choir pad, crisp trap hi-hats, emotional melodic hook, wide stereo reverb, cinematic production',
    negativePrompt: 'muddy low end, distorted master bus, mono drums, harsh sibilance, phasing vocals, flat 808',
    engineSliders: {
      weirdness: 14,
      styleInfluence: 82,
      voiceAudio: 92
    },
    targetBpm: 142,
    targetKey: 'F Minor',
    tags: ['#TrapWorship', '#808Sub', '#TheArchitect', '#MsT'],
    isFavorite: true,
    isFactory: true,
    author: 'BRICK Records Production',
    createdAt: '2026-03-01T00:00:00.000Z'
  },
  {
    id: 'PRESET-03-NASHVILLE-ACOUSTIC',
    name: 'Nashville Living Room Acoustic',
    category: 'Acoustic Folk',
    description: 'Intimate cedar-top acoustic fingerpicking, delicate cello drone, breathy upfront lead vocal, and natural wood room reflections.',
    vocalCast: 'Monica (Warm Breathy Alto)',
    sunoPrompt: 'Intimate acoustic folk worship, fingerpicked cedar acoustic guitar, warm upright acoustic bass, subtle cello drone, natural room ambience, breathy intimate lead vocal',
    negativePrompt: 'electronic synthesizers, autotune, heavy compression, synthetic reverb, drums, harsh high frequencies',
    engineSliders: {
      weirdness: 8,
      styleInfluence: 65,
      voiceAudio: 100
    },
    targetBpm: 68,
    targetKey: 'G Major',
    tags: ['#AcousticFolk', '#LivingRoom', '#Intimate', '#Monica'],
    isFavorite: false,
    isFactory: true,
    author: 'BRICK Records Nashville',
    createdAt: '2026-03-01T00:00:00.000Z'
  },
  {
    id: 'PRESET-04-THRONE-ROOM-GOSPEL',
    name: 'Throne Room Gospel Ballad',
    category: 'Gospel Soul',
    description: 'Powerful Hammond B3 organ swells, dynamic choir harmonies, emotive grand piano, and soaring vocal climax.',
    vocalCast: 'Brandon (Passionate Tenor Lead)',
    sunoPrompt: 'Contemporary gospel soul, emotional grand piano chords, Hammond B3 organ rotary speaker, full backing choir harmonies, soaring soulful lead vocal, dynamic climax, live gospel band',
    negativePrompt: 'electronic dance beats, thin vocals, harsh sibilance, robotic modulation, quantized robotic drums',
    engineSliders: {
      weirdness: 12,
      styleInfluence: 88,
      voiceAudio: 96
    },
    targetBpm: 64,
    targetKey: 'Eb Major',
    tags: ['#GospelSoul', '#HammondB3', '#ThroneRoom', '#Choir'],
    isFavorite: true,
    isFactory: true,
    author: 'BRICK Records Choir Division',
    createdAt: '2026-03-01T00:00:00.000Z'
  },
  {
    id: 'PRESET-05-MIDWEST-COUNTRY-DRIVE',
    name: 'Midwest Modern Country Drive',
    category: 'Modern Country',
    description: 'Crisp Telecaster chicken-pickin\', punchy acoustic strumming, pedal steel swells, and radio-ready Nashville hook clarity.',
    vocalCast: 'Silas Thorne & Kane',
    sunoPrompt: 'Modern Nashville country rock, bright Telecaster lead guitar, punchy acoustic rhythm guitar, subtle pedal steel swells, driving kick drum, polished vocal presence, Billboard Country sound',
    negativePrompt: 'synth bass, EDM buildups, mumble vocals, lo-fi hiss, excessive autotune, cluttered midrange',
    engineSliders: {
      weirdness: 10,
      styleInfluence: 75,
      voiceAudio: 98
    },
    targetBpm: 84,
    targetKey: 'A Major',
    tags: ['#CountryRock', '#Nashville', '#Telecaster', '#PedalSteel'],
    isFavorite: false,
    isFactory: true,
    author: 'BRICK Records Nashville',
    createdAt: '2026-03-01T00:00:00.000Z'
  },
  {
    id: 'PRESET-06-CINEMATIC-DRONE',
    name: 'Cinematic Ambient Drone Sanctuary',
    category: 'Ambient Drone',
    description: 'Ethereal shimmers, analog synth drones, bowed guitar textures, and contemplative worship soundscapes for prayer and reflection.',
    vocalCast: 'Ambient Pad & Choir Drone',
    sunoPrompt: 'Cinematic ambient worship, continuous analog synth drone, shimmering guitar swells, warm sub octave pad, ethereal choir vocalise, vast cathedral reverb, meditative sacred soundscape',
    negativePrompt: 'percussion, drums, fast tempo, aggressive transients, dry vocals, harsh treble',
    engineSliders: {
      weirdness: 24,
      styleInfluence: 60,
      voiceAudio: 90
    },
    targetBpm: 60,
    targetKey: 'D Major',
    tags: ['#AmbientDrone', '#Sanctuary', '#CathedralReverb', '#Meditation'],
    isFavorite: false,
    isFactory: true,
    author: 'BRICK Records Sound Lab',
    createdAt: '2026-03-01T00:00:00.000Z'
  },
  {
    id: 'PRESET-07-EAST-COAST-BOOMBAP',
    name: '90s East Coast Boom-Bap Devotional',
    category: 'Trap Worship',
    description: 'Classic SP-1200 style dusty drum break, warm upright jazz bass, vinyl crackle, and lyrical theological rhyme delivery.',
    vocalCast: 'The Architect',
    sunoPrompt: 'Golden era 90s hip hop, boom bap drum break, vinyl crackle warmth, upright jazz double bass line, subtle rhodes piano chords, clear articulate vocal delivery, raw authentic feel',
    negativePrompt: 'modern trap hi hats, 808 glide, EDM synths, heavy autotune, plastic snare',
    engineSliders: {
      weirdness: 12,
      styleInfluence: 85,
      voiceAudio: 95
    },
    targetBpm: 88,
    targetKey: 'C Minor',
    tags: ['#BoomBap', '#90sHipHop', '#TheArchitect', '#VinylWarmth'],
    isFavorite: true,
    isFactory: true,
    author: 'The Architect Studio',
    createdAt: '2026-03-01T00:00:00.000Z'
  }
];
