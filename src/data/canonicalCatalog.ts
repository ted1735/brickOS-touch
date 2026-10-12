import { Track, EPCollection, NightCafePrompt } from '../types';
import {
  THE_WORK_AINT_DONE_VERSIONS,
  CHECK_YOUR_HEART_LIGHT_VERSIONS,
  NOTHING_BUT_THE_BLOOD_VERSIONS,
  MEET_ME_HERE_VERSIONS,
  CALVARY_GRIT_VERSIONS,
  GHOST_IN_THE_MACHINE_VERSIONS,
  CONFIDENT_AND_CONSISTENT_VERSIONS,
  BLINDFOLD_BLESSING_VERSIONS,
  TRADING_IN_THE_MASK_VERSIONS,
  LEANING_NOT_LEAVING_VERSIONS,
  THE_MASTERS_HAND_VERSIONS,
  EVERY_CANDLES_VICTORY_VERSIONS
} from './songVersionsCatalog';
import { ALL_CANONICAL_PROMPTS } from './canonicalPrompts';

export const EP_COLLECTIONS: EPCollection[] = [
  { id: 'EP 1: Restoration', title: 'EP 1: The Restoration Project', theme: 'Refinement, Healing & Foundation' },
  { id: 'EP 2: Conflict Suite', title: 'EP 2: The Conflict Suite', theme: 'Family, Relationships & Sanctification' },
  { id: 'EP 3: War Room Anthems', title: 'EP 3: War Room Anthems', theme: 'Spiritual Warfare, Discipline & Identity' },
  { id: 'EP 4: Surrender Sessions', title: 'EP 4: The Surrender Sessions', theme: 'Surrender, Sovereignty & Divine Presence' },
];

export const VOCAL_ROSTER = [
  { name: 'Brandon', archetype: 'Weathered Raspy Campfire Storyteller', bestFor: 'Modern Roots Worship, Indie Folk, Blue-Collar Psalm' },
  { name: 'PATD', archetype: 'Emotive Deep Resonance', bestFor: 'Soul Piano Ballad, Soaring Rock, Orchestral Tension' },
  { name: 'Kane', archetype: 'Tectonic Powerhouse / Sub-Sonic Steel', bestFor: 'Hard Rock, Aggressive CHH, Industrial Rap' },
  { name: 'Monica', archetype: 'Gritty Soulful Raspy', bestFor: 'High-energy Hip-Hop, Trap-Gospel, Workout Anthems' },
  { name: 'Ms T', archetype: 'Deep Alto Chest-Voice Worship Leader', bestFor: 'Soulful Gospel Anthem, Raw Cry, B3 Organ Belts' },
  { name: 'The Architect', archetype: 'Sub-Sonic Quarry / Boom-Bap Authority', bestFor: 'Foundational Kingdom Boom-Bap, Plumb-Line CHH' },
  { name: 'The Pop Prodigy', archetype: 'Neon Gospel Hyper-Pop Shimmer', bestFor: 'Aggressive K-Pop Fusion, 60s Viral Volcano Drops' },
  { name: 'Silas Thorne', archetype: 'Aged Oak / Blue-Collar Gothic', bestFor: 'Blue-Collar Noir, 5 AM Diesel Acoustics, Worksite Confessions' },
];

export const CANONICAL_TRACKS: Track[] = [
  // ==========================================
  // EP 1: THE RESTORATION PROJECT (TRK-01 to TRK-08)
  // ==========================================
  {
    id: "TRK-01",
    ep: "EP 1: Restoration",
    title: "Brick by Brick",
    status: "Audio Master",
    genre: "Christian Hip Hop / Boom-Bap",
    bpm: 88,
    key: "D Minor",
    vocal: "The Architect",
    vocalCast: "The Architect (Sub-Sonic Quarry)",
    thesis: "The label's foundation; Brokenness Redeemed In Christ's Kingdom.",
    sunoPrompt: "Christian Hip Hop, 88 BPM, Key of D Minor, boom-bap drums, gritty MPC swing, warm upright bass, authentic male rap vocal",
    negativePrompt: "sibilance, high-frequency hiss, piercing treble, digital artifacts, muddy bass, synthetic choir, autotune",
    engineSliders: { weirdness: 12, styleInfluence: 65, voiceAudio: 100 },
    lyrics: `They see ruins, 
I see the blueprint. 
B-R-I-C-K, 
Yeah, let’s build.

Streets hum a hymn, 
But the chords ring hollow. 
Lost sheep move, 
In the paths they follow. 
Stones start to crack, 
Under weights of sorrow, 
But we’re grabbing the hammer, 
For a new tomorrow.

Alleyway prayers, 
On the cracked cement. 
Grace spilled like oil, 
From a jagged vessel. 
It’s a heavy lift, 
It’s a soul-level wrestle, 
But the Architect’s here, 
And He’s making a statement.

Kingdom Come, 
Kingdom Come. 
Where the broken hearts run, 
Where the lost find home. 
Yeah, we’re stacking the stones, 
We’re starting the fix, 
Building the hope, 
Brick by brick.

Brokenness Redeemed, 
In Christ’s Kingdom. 
That’s the code, 
That’s the life, 
That’s the freedom. 
Not a polished palace, 
For the proud and the vain, 
But a shelter for the weary, 
In the pouring rain.

You’re a brick, 
I’m a brick, 
Weathered and worn. 
Mortar made of mercy, 
Since the day we were born. 
Put the pride in the dirt, 
Let the old walls fall, 
The Master is building, 
A house for us all!

Kingdom Come, 
Kingdom Come. 
Where the broken hearts run, 
Where the lost find home. 
Yeah, we’re stacking the stones, 
We’re starting the fix, 
Building the hope, 
Brick by brick.`,
    versions: [
      { version: "v3.0", timestamp: "2026-09-01", reason: "Brick by Brick v3 Master Boom-Bap Cut", lyrics: "They see ruins, I see the blueprint. B-R-I-C-K..." },
      { version: "v1.0", timestamp: "2026-08-20", reason: "Initial sketch", lyrics: "They see ruins..." }
    ],
    selahPrayed: true,
  },
  {
    id: "TRK-02",
    ep: "EP 1: Restoration",
    title: "The Master's Hand",
    status: "Audio Master",
    genre: "Melodic Dubstep / Spoken Word",
    bpm: 140,
    key: "F# Minor",
    vocal: "Brandon / Silas Thorne",
    vocalCast: "Brandon (Aged Oak / Raspy Storyteller)",
    thesis: "The metaphor of the lathe, sanding, and fire for sanctification.",
    sunoPrompt: "Heavy Melodic Dubstep, 140 BPM, Key of F# Minor, massive supersaws, filtered drops, wood lathe foley, raw spoken word intro",
    negativePrompt: "sibilance, piercing treble, muddy low end, robotic artifacting, autotune",
    engineSliders: { weirdness: 14, styleInfluence: 72, voiceAudio: 100 },
    lyrics: THE_MASTERS_HAND_VERSIONS[0].lyrics,
    versions: THE_MASTERS_HAND_VERSIONS,
    selahPrayed: true,
  },
  {
    id: "TRK-03",
    ep: "EP 1: Restoration",
    title: "Every Candle's Victory",
    status: "Sent for Distribution",
    genre: "Soulful Country-Rock / Gospel",
    bpm: 78,
    key: "G Major",
    vocal: "Brandon / Ms T",
    vocalCast: "Brandon & Mrs T (Worship & Gospel Choir)",
    thesis: "A tribute to mother's strength and cancer survival; a breathing miracle underneath the open skies.",
    sunoPrompt: "Gospel Soul Country Rock, 78 BPM, Key of G Major, warm Hammond organ swell, soulful acoustic piano, raw dynamic belt",
    negativePrompt: "sibilance, synthetic instruments, robotic vocal tune, flat dynamics",
    engineSliders: { weirdness: 10, styleInfluence: 70, voiceAudio: 100 },
    lyrics: EVERY_CANDLES_VICTORY_VERSIONS[0].lyrics,
    versions: EVERY_CANDLES_VICTORY_VERSIONS,
    selahPrayed: true,
  },
  {
    id: "TRK-04",
    ep: "EP 1: Restoration",
    title: "Nothing But The Blood",
    status: "Lyrics Finalized",
    genre: "EDM / Hip-Hop / Gospel / Rock Reimagining",
    bpm: 110,
    key: "E Minor",
    vocal: "Mrs T / Kane",
    vocalCast: "Mrs T (Deep Alto) & Kane (808 Rap)",
    thesis: "Modern reimagining of the classic hymn; the river in our bones, washing and making all things new.",
    sunoPrompt: "Modern Gospel EDM Trap Hybrid, 110 BPM, Key of E Minor, stomp-clap rhythm, heavy 808s, soaring alto belt",
    negativePrompt: "sibilance, thin chorus, autotune, robotic pitch",
    engineSliders: { weirdness: 14, styleInfluence: 75, voiceAudio: 100 },
    lyrics: NOTHING_BUT_THE_BLOOD_VERSIONS[0].lyrics,
    versions: NOTHING_BUT_THE_BLOOD_VERSIONS,
    selahPrayed: true,
  },
  {
    id: "TRK-05",
    ep: "EP 1: Restoration",
    title: "The Higher Measure",
    status: "Audio Master",
    genre: "Stomp-Clap Folk / Celtic Cello",
    bpm: 104,
    key: "D Major",
    vocal: "Silas Thorne / Brandon",
    vocalCast: "Silas Thorne (Aged Oak)",
    thesis: "Focusing on the mission: Extending the Healing Ministry of Christ to fix the metrics.",
    sunoPrompt: "Stomp-clap Acoustic Folk, 104 BPM, Key of D Major, cello pluck, soaring violin lead, driving rhythm, earnest male vocal",
    negativePrompt: "sibilance, EDM synths, drum machines, autotune",
    engineSliders: { weirdness: 10, styleInfluence: 68, voiceAudio: 100 },
    lyrics: `[Intro]
[Hard stomp-clap rhythm, heavy on the 1 and 3, Rhythmic Acoustic Guitar]

The clock doesn't stop, 
The doors never close, 
Twenty-four-seven, 
Highs and lows, 
We see the charts, 
We see the trends, 
But that’s only where, 
The story begins.

[Verse 1]
Check the dashboard, 
Watch the data climb, 
Efficiency models, 
Trading life for time, 
It’s a man-made measure, 
A target for someone to score, 
But at the bedside, 
We see the soul.

[Chorus]
It’s not about... the metrics, 
It’s about... the mission, 
Extending the ministry, 
With a Heaven-sent vision, 
Every patient, 
Every bed, 
Every word, 
That Christ has said, 
The stakes are eternal, 
Not a mark on a page!

[Refrain Outro]
If you care like Christ did, 
With every touch and breath, 
You don’t just hit a target, 
You conquer life and death!`,
    versions: [
      { version: "v1.0 (Master)", timestamp: "2026-09-01", reason: "Celtic violin & stomp-clap master cut", lyrics: "The clock doesn't stop, the doors never close..." }
    ],
    selahPrayed: true,
  },
  {
    id: "TRK-06",
    ep: "EP 1: Restoration",
    title: "Break the Bond / Correction is Restoration",
    status: "In Progress",
    genre: "Cinematic CHH / Industrial Gospel",
    bpm: 92,
    key: "C Minor",
    vocal: "The Architect",
    vocalCast: "The Architect & Kane",
    thesis: "Correction is restoration; shattering the chains of self-sufficiency.",
    sunoPrompt: "Cinematic CHH, 92 BPM, Key of C Minor, industrial percussion, chain rattle foley, authoritative baritone",
    negativePrompt: "sibilance, cheerful pop, muddy low end",
    engineSliders: { weirdness: 14, styleInfluence: 65, voiceAudio: 100 },
    lyrics: `[Verse 1]
Tied to the metrics of a hollow town,
Building towers that were meant to fall down.
Correction isn't vengeance, correction is the cure,
Pruning back the branches to make the harvest pure!

[Chorus]
Break the bond, let the restoration start!
Hammer of the Word breaking open the heart!
Not a casualty of judgment, but a child of grace,
Lifted from the ruins to behold His face!`,
    versions: [
      { version: "v1.0", timestamp: "2026-09-03", reason: "Foundational EP 1 track", lyrics: "Tied to the metrics of a hollow town..." }
    ],
    selahPrayed: false,
  },
  {
    id: "TRK-07",
    ep: "EP 1: Restoration",
    title: "Leaning Not Leaving",
    status: "Sent for Distribution",
    genre: "Roots Acoustic / Stadium Rock Dual-Cut",
    bpm: 72,
    key: "C Major",
    vocal: "Brandon / Monica",
    vocalCast: "Brandon & Monica (Breathy Alto to Power Belt)",
    thesis: "Silence isn't safety; purpose in the pain; pressure makes the diamond shine.",
    sunoPrompt: "Roots Acoustic to Epic Stadium Rock, 72 BPM, Key of C Major, piano cello duet building to roaring Marshall stacks",
    negativePrompt: "sibilance, synth pop, artificial pitch correction",
    engineSliders: { weirdness: 12, styleInfluence: 70, voiceAudio: 100 },
    lyrics: LEANING_NOT_LEAVING_VERSIONS[0].lyrics,
    versions: LEANING_NOT_LEAVING_VERSIONS,
    selahPrayed: true,
  },
  {
    id: "TRK-08",
    ep: "EP 1: Restoration",
    title: "Check Your Heart Light",
    status: "Released",
    genre: "Swamptronica Revival Worship / Roots Rock",
    bpm: 104,
    key: "G Major",
    vocal: "Brandon / Ms T",
    vocalCast: "Brandon Lake meets Ms T (Southern Roots Belt)",
    thesis: "Ignore the heart light and it costs you everything; faith gets muddy boots.",
    sunoPrompt: "Swamptronica Revival Worship, 104 BPM, Key of G Major, driving banjo roll, stomp-clap percussion, resonator slide, massive choir",
    negativePrompt: "sibilance, high-frequency hiss, piercing treble, digital artifacts, autotune",
    engineSliders: { weirdness: 12, styleInfluence: 72, voiceAudio: 100 },
    lyrics: CHECK_YOUR_HEART_LIGHT_VERSIONS[0].lyrics,
    versions: CHECK_YOUR_HEART_LIGHT_VERSIONS,
    selahPrayed: true,
  },

  // ==========================================
  // EP 2: THE CONFLICT SUITE (TRK-09 to TRK-16)
  // ==========================================
  {
    id: "TRK-09",
    ep: "EP 2: Conflict Suite",
    title: "Glitter",
    status: "Sent for Distribution",
    genre: "High-Energy Pop / Romantic Soul",
    bpm: 112,
    key: "A Major",
    vocal: "Brandon",
    vocalCast: "Brandon (Warm Romantic Tenor)",
    thesis: "A high-energy tribute to Courtney’s pizazz and beauty; love transforming a cold dark house.",
    sunoPrompt: "High-energy Romantic Soul Pop, 112 BPM, Key of A Major, warm driving bassline, jangly acoustic guitars, joyful brass accents",
    negativePrompt: "sibilance, cynicism, dark moody pads, distorted bass",
    engineSliders: { weirdness: 8, styleInfluence: 65, voiceAudio: 100 },
    lyrics: `[VERSE 1]
The paint was holding up, the bones were good
I looked like all the other houses in the neighborhood
But inside there was silence, a chill in the air
I'd gotten used to no one knowing I was there

[CHORUS]
'Cause I was a house with no lights on
Just waiting for someone to come home
I was a frame with no picture
'Til you brought all your glitter!

[VERSE 2]
We'd talk about the intimate details
No subject was ever off the rails
We'd sit for hours in that car at night
And wouldn't leave until we got it right

[BRIDGE]
So let the storms rage outside the door
I'm not the man I was before
I see it now, you're all glitter
And I'm not scared anymore!

[CHORUS]
'Cause I was a house with no lights on
Just waiting for someone to come home
I was a frame with no picture
'Til you brought all your glitter!`,
    versions: [
      { version: "v1.0 (Master)", timestamp: "2026-08-31", reason: "Master cut tribute to Courtney's pizazz", lyrics: "The paint was holding up, the bones were good..." }
    ],
    selahPrayed: true,
  },
  {
    id: "TRK-10",
    ep: "EP 2: Conflict Suite",
    title: "The Blueprint & The Blood",
    status: "Lyrics Finalized",
    genre: "Blue-Collar Heartland Rock / Acoustic",
    bpm: 92,
    key: "G Major",
    vocal: "Brandon / Silas Thorne",
    vocalCast: "Brandon (Raspy Fatherhood Delivery)",
    thesis: "Balancing spiritual weight with career demands; CNC designs, fatherhood, steady hand of reason.",
    sunoPrompt: "Blue-Collar Heartland Rock, 92 BPM, Key of G Major, workshop foley, acoustic guitar flatpicking, steady driving kick, raspy male vocal",
    negativePrompt: "sibilance, plastic synths, autotune, pop clichés",
    engineSliders: { weirdness: 12, styleInfluence: 68, voiceAudio: 100 },
    lyrics: `[Verse 1]
Sawdust drifting on the CNC design,
Balancing the quota on the production line.
Heavy lifting from the morning till the dusk,
Building out an empire that the world can trust.
Steady hand of reason when my children ask the 'why',
Teaching them that mercy is what money cannot buy.

[Chorus]
The blueprint in my hands, the blood upon the door!
Built to last through every storm, we don't fall to the floor!
It's the craftsman's calling, it's the father's spine,
Every measurement aligned with the King's design!

[Bridge]
From the workshop table to the evening prayer,
Laying down the tools because the Lord is there.`,
    versions: [
      { version: "v1.0", timestamp: "2026-09-02", reason: "Lyrics Finalized; Built to Last subtitle", lyrics: "Sawdust drifting on the CNC design..." }
    ],
    selahPrayed: true,
  },
  {
    id: "TRK-11",
    ep: "EP 2: Conflict Suite",
    title: "Unity in the Friction",
    status: "Sent for Distribution",
    genre: "Christian Hip Hop / Trap-Gospel Duet",
    bpm: 128,
    key: "C# Minor",
    vocal: "Monica & Kane",
    vocalCast: "Monica (Gritty Soul) & Kane (Tectonic Sub-Sonic)",
    thesis: "Two stones. One house. The fire in the friction keeps the cold outside; sanctification.",
    sunoPrompt: "Christian Hip Hop Trap-Gospel, 128 BPM, Key of C# Minor, heavy 808 sub-bass, cinematic brass stabs, gritty female rap-singing, deep baritone",
    negativePrompt: "sibilance, weak 808s, flat percussion, robotic autotune",
    engineSliders: { weirdness: 15, styleInfluence: 75, voiceAudio: 100 },
    lyrics: `[Intro]
[Heavy 808 Sub-Bass; Stomp-and-clap rhythm; Cinematic Brass stabs]
(Kane - Spoken Word) Yeah. Two stones. One house. Let's build the fire.

[Verse 1]
(Monica - Gritty, soulful)
We tried to keep it quiet, walkin' on the glass
Tiptoe round the living room, hopin' it would pass
But silence isn't safety when the walls are made of stone
You can't build a kingdom if you're buildin' it alone

[Pre-Chorus]
(Kane - Harmonizing; building trap percussion)
Yeah, we hit the edges, yeah, we feel the grind
But that's the heavy lifting when two lives align
I don't want the easy road if it means we fall apart
I want the holy collision of the messy heart!

[Chorus]
Don't run from the spark when the stones collide!
The fire in the friction keeps the cold outside!
It's the sharpening of iron, it's the testing of the mold
Unity is stronger when the truth is being told!
Yeah, there's unity in the friction!

[Verse 2]
(Kane - Aggressive, rhythmic baritone rap)
They sell us a commercial, a picture-perfect frame
Where nobody argues and there's never any blame
But I want the real thing, the grit and the grace
The beauty of the struggle written right across your face

[Bridge]
(Monica) The sparks fly, but they just make a flame
(Kane) Exposing what's fake and calling it by name
(Both Vocals - Massive build) That's how the Father turns two into one — sanctification!`,
    versions: [
      { version: "v1.0 (Master Duet)", timestamp: "2026-09-01", reason: "Monica & Kane official Trap-Gospel master", lyrics: "Two stones. One house. Don't run from the spark when the stones collide!" }
    ],
    selahPrayed: true,
  },
  {
    id: "TRK-12",
    ep: "EP 2: Conflict Suite",
    title: "The Anchor",
    status: "Lyrics Finalized",
    genre: "Cinematic Worship / Emotional Ballad",
    bpm: 72,
    key: "Bb Major",
    vocal: "Brandon / PATD",
    vocalCast: "Brandon (Emotive Protective Resonance)",
    thesis: "Profound, protective romantic foundation guarding against external noise and crises.",
    sunoPrompt: "Cinematic Worship Ballad, 72 BPM, Key of Bb Major, warm grand piano, swelling strings, intimate protective vocal",
    negativePrompt: "sibilance, cold reverb, synth leads, autotune",
    engineSliders: { weirdness: 10, styleInfluence: 65, voiceAudio: 100 },
    lyrics: `[Verse 1]
You've lived a transient life on shifting seas,
Running from the thunder on your trembling knees.
I promise you an unmovable, permanent stone,
In the middle of the storm you will not stand alone.

[Chorus]
I will be the anchor when the ocean breaks!
Holding fast to mercy for our family's sakes!
Guarding your heart from the noise and the cry,
Underneath the banner of the Most High!`,
    versions: [
      { version: "v1.0", timestamp: "2026-09-03", reason: "The Anchor lyrics finalized", lyrics: "You've lived a transient life on shifting seas..." }
    ],
    selahPrayed: true,
  },
  {
    id: "TRK-13",
    ep: "EP 2: Conflict Suite",
    title: "Calvary Grit",
    status: "In Progress",
    genre: "Stadium Hip-Hop / NF Triplets",
    bpm: 138,
    key: "D Minor",
    vocal: "The Prophet / The Combatant",
    vocalCast: "Kane (The Prophet) & Rapid Tenor (The Combatant)",
    thesis: "Gridiron grind as spiritual warfare; 77 on the jersey; One team, one heartbeat.",
    sunoPrompt: "Dark Cinematic Industrial Stadium CHH, 138 BPM, Key of D Minor, clock-ticking hi-hats, distorted electric guitar, rapid triplets",
    negativePrompt: "sibilance, cheerful melodies, clean pop radio",
    engineSliders: { weirdness: 16, styleInfluence: 74, voiceAudio: 100 },
    lyrics: CALVARY_GRIT_VERSIONS[0].lyrics,
    versions: CALVARY_GRIT_VERSIONS,
    selahPrayed: false,
  },
  {
    id: "TRK-14",
    ep: "EP 2: Conflict Suite",
    title: "Venom Into Victory",
    status: "In Progress",
    genre: "K-Pop Fusion / Hyper-Pop CHH",
    bpm: 132,
    key: "F Minor",
    vocal: "The Pop Prodigy",
    vocalCast: "The Pop Prodigy (Neon Gospel)",
    thesis: "Pink venom in veins, soul turning gold; Stanley cup cold, spirit is fire; Joy is the cue.",
    sunoPrompt: "Aggressive K-Pop CHH Fusion, 132 BPM, Key of F Minor, cinematic whistle, heavy 808 pulse, massive volcano drop, glitter synth arps",
    negativePrompt: "sibilance, acoustic ballad, slow tempo, muddy bass",
    engineSliders: { weirdness: 22, styleInfluence: 78, voiceAudio: 100 },
    lyrics: `[Intro | Cinematic Whistle & Heavy K-Pop 808 Pulse]
[Vocal: The Pop Prodigy | Assertive & Focused]

[Verse 1]
Pink venom in the veins, but the soul’s turning gold
Greatest show on the planet in the stories untold
Got the squish-mallow comfort, stacking peace in the wild
While the sunflowers dance for the Kingdom-bought child

[Verse 2]
Stanley cup cold, but the Spirit is fire
Baking bread in the kitchen, lifting praise even higher
Walking on the beach under black skies or blue
Acting crazy in the rain 'cause the Joy is the cue!

[Pre-Chorus]
It’s a circus, it’s a riot, beautiful mess
Leaving all the worry and the clutter and the stress
The dog is barking loud like he’s leading the parade
Facing every shadow and I’m not even afraid!

[Chorus | Massive Volcano Drop]
The glory in the spirit, got me beautifully whole
Heaven’s got the rhythm and He’s taking all the control!
Sparkle-sparkle, shimmer-glow! 
VENOM INTO VICTORY!
VENOM INTO VICTORY!
The Greatest Show in history has only just begun!

[Post-Chorus]
Grace like GLITTER! (Uh-huh!)
Mercy like a SQUISH! (Yeah!)`,
    versions: [
      { version: "v1.0 (K-Pop Master)", timestamp: "2026-09-03", reason: "The Pop Prodigy K-pop viral volcano drop", lyrics: "Pink venom in the veins, but the soul's turning gold..." }
    ],
    selahPrayed: false,
  },
  {
    id: "TRK-15",
    ep: "EP 2: Conflict Suite",
    title: "The Final Say",
    status: "In Progress",
    genre: "Cinematic Stadium Worship",
    bpm: 74,
    key: "Eb Major",
    vocal: "Brandon / PATD",
    vocalCast: "Brandon (Soaring Tenor)",
    thesis: "The schemes the enemy may deploy cannot steal our peace or kill our joy. The Lamb of God has the final say.",
    sunoPrompt: "Cinematic Stadium Worship, 74 BPM, Key of Eb Major, grand piano, crescendo strings, driving kick, wall of sound vocal harmonies",
    negativePrompt: "sibilance, flat dynamics, muddy low end, robotic autotune",
    engineSliders: { weirdness: 10, styleInfluence: 70, voiceAudio: 100 },
    lyrics: `[Verse 1]
When the King speaks His decree,
No earthly force can set it free.
What He has planned is good as done,
His sovereign promise has begun.
So let the doubt and error fade,
The final verdict He has made.

[Chorus]
The schemes the enemy may deploy,
Cannot steal our peace or kill our joy!
The power that rules the earth and sky,
Will always be the one... 
The reason I survive!
The Lamb of God has overcome,
He has the final say!

[Bridge]
Look at the empty place He slept,
The promise that the grave has kept!
It wasn't death that held the keys,
We heard His voice upon the breeze!
He is alive, He is ALIVE!`,
    versions: [
      { version: "v1.0", timestamp: "2026-09-04", reason: "Cinematic stadium worship cut", lyrics: "When the King speaks His decree..." }
    ],
    selahPrayed: false,
  },
  {
    id: "TRK-16",
    ep: "EP 4: Surrender Sessions",
    title: "Meet Me Here",
    status: "Audio Master",
    genre: "Blue-Collar Gothic CHH / Psalm",
    bpm: 76,
    key: "D Minor",
    vocal: "Brandon / Silas Thorne",
    vocalCast: "Brandon (Raw Weary Father) / PATD",
    thesis: "Who helps the man when the man is the help? 5 AM kitchen, shaking hands under table, 3s vacuum silence.",
    sunoPrompt: "Slow-Burn Cinematic CHH, 76 BPM, half-time feel, dark orchestral strings, distant rain, deep 808 heartbeat, emotional grand piano",
    negativePrompt: "sibilance, radio pop polish, confident delivery, auto-tune, happy melodies",
    engineSliders: { weirdness: 16, styleInfluence: 72, voiceAudio: 100 },
    lyrics: MEET_ME_HERE_VERSIONS[0].lyrics,
    versions: MEET_ME_HERE_VERSIONS,
    selahPrayed: true,
  },

  // ==========================================
  // EP 3: WAR ROOM ANTHEMS (TRK-17 to TRK-21)
  // ==========================================
  {
    id: "TRK-17",
    ep: "EP 3: War Room Anthems",
    title: "In Our Veins",
    status: "Lyrics Finalized",
    genre: "Heavy Tribal Worship Ballad",
    bpm: 78,
    key: "D Minor",
    vocal: "Kane & Ms T",
    vocalCast: "Kane & Mrs T (Deep Tribal Resonance)",
    thesis: "Heavy tribal chant turned into worship ballad; God of the galaxies running through our veins.",
    sunoPrompt: "Heavy Tribal Worship Ballad, 78 BPM, Key of D Minor, deep war drums, low male choir chants, massive brass stabs, soaring female lead",
    negativePrompt: "sibilance, thin synthesizers, cheerful acoustic pop",
    engineSliders: { weirdness: 14, styleInfluence: 72, voiceAudio: 100 },
    lyrics: `[Verse 1]
From the dust of the ground to the stars in the night,
We were formed by the Word that commanded the light.
Not an accident woven in flesh and in clay,
We are carrying the fire of the Ancient of Days!

[Chorus]
In our veins, in our veins!
The God of the galaxies breaking our chains!
From generation to generation He reigns,
The blood of the Savior is deep in our veins!`,
    versions: [
      { version: "v1.0", timestamp: "2026-09-02", reason: "Heavy tribal worship ballad lyrics finalized", lyrics: "From the dust of the ground to the stars in the night..." }
    ],
    selahPrayed: true,
  },
  {
    id: "TRK-18",
    ep: "EP 3: War Room Anthems",
    title: "We Bow We Shout",
    status: "Lyrics Finalized",
    genre: "Modern Tribal Worship Anthem",
    bpm: 84,
    key: "A Minor",
    vocal: "The Architect / Kane",
    vocalCast: "Kane (Tectonic Powerhouse)",
    thesis: "Modern tribal anthem of reverence: We bow in the silence, we shout in the light.",
    sunoPrompt: "Modern Tribal Worship Anthem, 84 BPM, Key of A Minor, dynamic floor toms, massive gang chants, reverent pauses",
    negativePrompt: "sibilance, EDM synths, bubblegum vocals",
    engineSliders: { weirdness: 12, styleInfluence: 70, voiceAudio: 100 },
    lyrics: `[Verse 1]
Before the altar of the Holy One,
The silver moon, the rising sun.
We bow in the silence where the mysteries hide,
Stripped of our ego and emptied of pride.

[Chorus]
We bow in the silence! We shout in the light!
The Lion of Judah has conquered the night!
Reverence and fire, holy and bold,
Standing on ground that the prophets foretold!`,
    versions: [
      { version: "v1.0", timestamp: "2026-09-03", reason: "Lyrics finalized tribal anthem", lyrics: "Before the altar of the Holy One..." }
    ],
    selahPrayed: true,
  },
  {
    id: "TRK-19",
    ep: "EP 3: War Room Anthems",
    title: "Through The Valley Or The Flame",
    status: "Lyrics Finalized",
    genre: "Genre-Bending Battleground Roots",
    bpm: 90,
    key: "E Minor",
    vocal: "Brandon / Silas Thorne",
    vocalCast: "Silas Thorne (Aged Oak)",
    thesis: "A genre-bending exploration of trials; finding purpose inside the fire.",
    sunoPrompt: "Genre-Bending Roots Battleground, 90 BPM, Key of E Minor, rustic resonator, thunderous kick, weathered male rasp",
    negativePrompt: "sibilance, pop sheen, flat dynamics",
    engineSliders: { weirdness: 12, styleInfluence: 68, voiceAudio: 100 },
    lyrics: `[Verse 1]
Shadows of death stretching over the road,
Carrying the burden of an ancient load.
Whether the canyon or whether the furnace,
The presence of God is our sovereign assurance!

[Chorus]
Through the valley or the flame!
I will testify the power of His name!
The fire won't burn and the water won't drown,
Where the blood was spilled is where victory is found!`,
    versions: [
      { version: "v1.0", timestamp: "2026-09-02", reason: "Lyrics finalized", lyrics: "Shadows of death stretching over the road..." }
    ],
    selahPrayed: true,
  },
  {
    id: "TRK-20",
    ep: "EP 3: War Room Anthems",
    title: "Ghost In The Machine",
    status: "In Progress",
    genre: "Industrial CHH / K-Pop Fusion Dual-Cut",
    bpm: 130,
    key: "Eb Minor",
    vocal: "Kane / Neon Gospel",
    vocalCast: "Kane (CHH Industrial) & Neon Gospel (K-Pop Shimmer)",
    thesis: "Spiritual warfare against algorithm panopticon: He’s not a ghost in the machine, He’s the King of everything.",
    sunoPrompt: "Industrial Trap CHH, 130 BPM, Key of Eb Minor, industrial 808 distortion, metallic percussion, deep resonant chest voice",
    negativePrompt: "sibilance, generic pop, muddy sub bass",
    engineSliders: { weirdness: 18, styleInfluence: 75, voiceAudio: 100 },
    lyrics: GHOST_IN_THE_MACHINE_VERSIONS[0].lyrics,
    versions: GHOST_IN_THE_MACHINE_VERSIONS,
    selahPrayed: false,
  },
  {
    id: "TRK-21",
    ep: "EP 3: War Room Anthems",
    title: "The Milestone (Confident & Consistent)",
    status: "Sent for Distribution",
    genre: "Christian Hip Hop / 128 BPM Workout Anthem",
    bpm: 128,
    key: "G Minor",
    vocal: "Monica",
    vocalCast: "Monica (Gritty Soulful Raspy)",
    thesis: "Courtney's workout health journey anthem; 26 years in the ring; 15k steps on the clock; hotter for husband, stronger for kids.",
    sunoPrompt: "Christian Hip Hop CEDM, 128 BPM, Key of G Minor, heavy sub-bass, Monica gritty soulful rasp, 808 trap drops, pumping sidechain",
    negativePrompt: "sibilance, slow tempo, mellow acoustic guitar, auto-tune",
    engineSliders: { weirdness: 10, styleInfluence: 72, voiceAudio: 100 },
    lyrics: CONFIDENT_AND_CONSISTENT_VERSIONS[0].lyrics,
    versions: CONFIDENT_AND_CONSISTENT_VERSIONS,
    selahPrayed: true,
  },

  // ==========================================
  // EP 4: THE SURRENDER SESSIONS (TRK-22 to TRK-26)
  // ==========================================
  {
    id: "TRK-22",
    ep: "EP 4: Surrender Sessions",
    title: "Breath and Bone",
    status: "Lyrics Finalized",
    genre: "Cinematic Worship / Resurrected Life",
    bpm: 76,
    key: "D Major",
    vocal: "Brandon",
    vocalCast: "Brandon (Crystal Clear Emotive Tenor)",
    thesis: "Resurrection encounter; not a ghost, but the Life; touching scars, eating fish with the King.",
    sunoPrompt: "Cinematic Orchestral Worship, 76 BPM, Key of D Major, crystal clear vocals, heavy marching snare drums, grand strings, soaring melody",
    negativePrompt: "sibilance, lo-fi hiss, synthetic choir, autotune",
    engineSliders: { weirdness: 10, styleInfluence: 70, voiceAudio: 100 },
    lyrics: `[Verse 1: Crystal clear vocals]
The iron was bolted
The cedar was scarred
We’d walled out the world
Every window was barred
We were huddling in shadows
Nursing our grief
Locked in a prison
Of pure unbelief
But You didn’t need permission
You didn’t need a key
You didn’t wait for a welcome
To invade our misery
Through the grain of the wood
Through the weight of the stone
You stood in our terror
And called us Your own
We shivered like children
At a ghost in the room
Startled by Life
Breaking out of the tomb!

[Chorus]
Oh, behold the hands! Behold the feet!
Where mercy and my wonder meet!
You’re not a shadow, You’re not a dream
You’re the breath and the bone of the King!
My heart is amazed
My soul is undone
Touching the scars
Of the Living One!
It’s really You—not a ghost, but the Life
Standing here whole
Through the death and the strife!

[Bridge: Drop instruments, Heavy marching snare drums enter]
You asked for a seat
You asked for a meal
To prove that the scars
And the skin were both real
We brought You the fish
From the coals of the fire
Death has been conquered
And the stone has lost its weight!

[Outro]
Touch and see...
Flesh and bone...
Peace be still...
You're home.`,
    versions: [
      { version: "v1.0", timestamp: "2026-09-03", reason: "Breath & Bone Master Lyric Library Cut", lyrics: "The iron was bolted, the cedar was scarred..." }
    ],
    selahPrayed: true,
  },
  {
    id: "TRK-23",
    ep: "EP 4: Surrender Sessions",
    title: "Blindfold Blessing",
    status: "Sent for Distribution",
    genre: "Country Duet / Progressive CEDM Dual-Cut",
    bpm: 128,
    key: "A Major",
    vocal: "Brandon & Monica",
    vocalCast: "Brandon & Monica Duet",
    thesis: "A holy 'I don't know'; 'wherever' is a promise, and HIS 'wherever' is my rest.",
    sunoPrompt: "Christian EDM Progressive House or Acoustic Country Duet, dynamic tension and release, euphoric supersaws, male and female duet",
    negativePrompt: "sibilance, robotic tuning, muddy bass",
    engineSliders: { weirdness: 12, styleInfluence: 72, voiceAudio: 100 },
    lyrics: BLINDFOLD_BLESSING_VERSIONS[0].lyrics,
    versions: BLINDFOLD_BLESSING_VERSIONS,
    selahPrayed: true,
  },
  {
    id: "TRK-24",
    ep: "EP 4: Surrender Sessions",
    title: "Trading In The Mask",
    status: "Audio Master",
    genre: "A Cappella Spoken Word to Explosive Gospel",
    bpm: 82,
    key: "Eb Major",
    vocal: "Ms T",
    vocalCast: "Ms T (Emotive Raw Power & Gospel Choir)",
    thesis: "The glass is gonna crack, the silver's gonna fade; trading in the mask for the way that I was made.",
    sunoPrompt: "A Cappella Spoken Word into Explosive Gospel Choir, 82 BPM, Key of Eb Major, warm B3 organ, log drums, handclaps, raw chest belt",
    negativePrompt: "sibilance, electronic synths, autotune, pop polish",
    engineSliders: { weirdness: 10, styleInfluence: 74, voiceAudio: 100 },
    lyrics: TRADING_IN_THE_MASK_VERSIONS[0].lyrics,
    versions: TRADING_IN_THE_MASK_VERSIONS,
    selahPrayed: true,
  },
  {
    id: "TRK-25",
    ep: "EP 4: Surrender Sessions",
    title: "Never-ending What’s Next",
    status: "Lyrics Finalized",
    genre: "Spoken Word / Deep Soulful Alto Anthem",
    bpm: 70,
    key: "F Major",
    vocal: "Ms T",
    vocalCast: "Ms T (Deep Soulful Alto Solo)",
    thesis: "Living in the margins of a calendar that bleeds; trust isn't a feeling, it's a total lean.",
    sunoPrompt: "Spoken Word Gospel Alto Anthem, 70 BPM, Key of F Major, intimate piano, orchestral pulse, full gospel choir drop, cello solo",
    negativePrompt: "sibilance, techno beats, robotic pitch",
    engineSliders: { weirdness: 10, styleInfluence: 70, voiceAudio: 100 },
    lyrics: `[Spoken Word, Deep Soulful Alto Solo]
[Intimate Piano Intro]
I’m living in the margins 
Of a calendar that bleeds
Planting rows of "maybe" 
When I should be sowing seeds

[Vocal Fry | Breathful]
The ink is barely settled 
On the task I just turned in
Before the ghost of "What Is Next" 
Is crawling ‘neath my skin

[Build | Orchestral Pulse]
My understanding is a broken glass
Trying to catch a future 
That’ll never last
I’m leaning all my weight 
On a shifting sand
Instead of letting go... 
Into the Master’s hand

[Anthemic Drop | Full Gospel Choir]
Trust isn't a feeling
It’s a total lean
Into the spaces 
Of the "yet unseen"
In every frantic hallway
In every "what’s to come"
I acknowledge the Father 
Until the noise is dumb!

[Bridge]
Stop the clock! Stop the chase!
The "What’s Next" is found In the "Present Grace!"
He’s not just the goal At the end of the road
He’s the One who’s carrying The entire load!

[Selah Outro | Solo Cello | Piano]
In all your ways... Acknowledge Him.
The assignment is Him.`,
    versions: [
      { version: "v1.0", timestamp: "2026-09-03", reason: "Never-ending What's Next master lyrics", lyrics: "I'm living in the margins of a calendar that bleeds..." }
    ],
    selahPrayed: true,
  },
  {
    id: "TRK-26",
    ep: "EP 4: Surrender Sessions",
    title: "Meet Me Here (Harder Scream)",
    status: "In Progress",
    genre: "Slow-Burn Cinematic CHH / Raw Breakdown",
    bpm: 76,
    key: "D Minor",
    vocal: "Brandon / Weary Father",
    vocalCast: "Brandon (Unpolished 2 AM Truck Breakdown)",
    thesis: "Raw 2 AM breakdown at the last line; sudden explosive scream WHO CAN'T DO IT THIS TIME.",
    sunoPrompt: "Slow-Burn Cinematic CHH, 76 BPM, half-time feel, dark strings, distant rain, truck rumble, distorted 808 sub, dead vacuum silence, explosive scream",
    negativePrompt: "sibilance, radio pop, confident vocal, choir, motivational tone, clean mix",
    engineSliders: { weirdness: 18, styleInfluence: 75, voiceAudio: 100 },
    lyrics: `[Intro – Spoken, exhausted, close-mic, heavy breathing]
They see the uniform… see the “I’ve got it handled.”
Nobody sees my hands shaking under the table.
I’m the bridge everybody walks on…
But who’s looking underneath?

[Verse 1]
Coffee black at 4:47.
Mask strapped on by 6.
Fixing the leaky sink while everything inside me is about to split.
Kids need a shield, wife needs a rock that won’t crumble,
Boss needs results, church needs me steady on the map.
Silence screaming in this truck cab,
Running on empty, running on luck.

[Verse 2]
Staring at the wood grain, tracing every crack in the dashboard.
Clock hammering louder than my heartbeat, stealing what little I have left.
Then I finally choke out… “I don’t know…”

(3 seconds dead vacuum silence — just breathing)

…And the whole world goes hollow.
I’m a ghost in my own house, forgotten what my real name even sounds like.
Been living for their honor… slowly dying in the shame.

[Chorus]
Who helps the man when the man is the help?
Who catches the one carrying everybody else?
End of my rope, the knot is slipping loose…
Lord, I’m dying here for You.

[Bridge – spoken, voice breaking]
I don’t have it.
I don’t have the answer this time…
I’m just a son…

(Sudden explosive scream — raw and strained)
WHO CAN’T DO IT THIS TIME?!

(Distorted, heavy door slam reverb)

I DON’T HAVE IT!
LOGIC’S GONE!
I’M AT THE EDGE — THIS IS THE LAST LINE!

(Cracked whisper, barely holding on)
Please… God…
Just meet me here…
…at the last line.`,
    versions: [
      { version: "v1.0 (Harder Scream Cut)", timestamp: "2026-09-04", reason: "Raw emotional breakdown at 2 AM in truck, explosive scream", lyrics: "WHO CAN'T DO IT THIS TIME?! I DON'T HAVE IT! THIS IS THE LAST LINE!" }
    ],
    selahPrayed: false,
  },
  {
    id: "TRK-27",
    ep: "EP 1: Restoration",
    title: "The Work Ain't Done",
    status: "Audio Master",
    genre: "Folk-Hop / Boom-Bap CHH / K-Pop Ministry Hybrid",
    bpm: 102,
    key: "G Minor",
    vocal: "Kane / Brandon",
    vocalCast: "Kane (Tectonic Baritone) & Brandon (Frontline Grit)",
    thesis: "Extending the Healing Ministry of Christ; discharge done? Not when the ink dries! Success is keeping recovery from crashing in the parking lot.",
    sunoPrompt: "Frontline Folk-Hop to Boom-Bap Hybrid, 102 BPM, Key of G Minor, tight rimshot on 2 and 4, acoustic guitar flatpicking, heavy foot-stomp kick, tectonic baritone authority, teach back hook",
    negativePrompt: "sibilance, high-frequency hiss, piercing treble, autotune, clinical throughput jargon without soul",
    engineSliders: { weirdness: 12, styleInfluence: 72, voiceAudio: 100 },
    lyrics: THE_WORK_AINT_DONE_VERSIONS[0].lyrics,
    versions: THE_WORK_AINT_DONE_VERSIONS,
    selahPrayed: true,
  },
  {
    id: "TRK-28",
    ep: "EP 3: War Room Anthems",
    title: "Standing at the Breach",
    status: "In Progress",
    genre: "Cinematic CHH / Southern Rock Hybrid",
    bpm: 84,
    key: "A Minor",
    vocal: "Brandon / Kane",
    vocalCast: "Brandon (Frontline Grit) & Kane (Tectonic Powerhouse)",
    thesis: "Holding the line in the gap when everything tries to pull family apart; raw battle-tested resilience.",
    sunoPrompt: "Cinematic CHH, Southern Rock, 84 BPM, A Minor, heavy acoustic stomp, distorted slide guitar, raw raspy male vocal",
    negativePrompt: "sibilance, high-frequency hiss, piercing treble, autotune, generic pop choir, motivational fluff",
    engineSliders: { weirdness: 10, styleInfluence: 70, voiceAudio: 100 },
    lyrics: `[Verse 1]
Midnight oil burning in the kitchen glow.
Tracing every bill and every note below.
I won't let this foundation break in two...
Standing in the gap for what is true.

[Chorus]
Who's standing at the breach when the wind blows hard?
Keep the shield lifted up in the quiet dark.
Not by might, not by pride in what we do...
We're standing at the breach with You.`,
    versions: [
      { version: "v1.0", timestamp: "2026-10-01", reason: "Initial battle-tested arrangement draft", lyrics: "Standing at the breach when the wind blows hard..." }
    ],
    selahPrayed: false,
  },
  {
    id: "TRK-29",
    ep: "EP 4: Surrender Sessions",
    title: "Track 29 (At the Last Line)",
    status: "In Progress",
    genre: "Slow-Burn Acoustic Roots / Cinematic CHH",
    bpm: 78,
    key: "E Minor",
    vocal: "Brandon",
    vocalCast: "Brandon (Unpolished 2 AM Truck Breakdown)",
    thesis: "Raw 2 AM vulnerability; breaking through religious clichés into honest, conversational surrender at the foot of the cross.",
    sunoPrompt: "Slow-Burn Acoustic Roots CHH, 78 BPM, Key of E Minor, flatpick acoustic guitar, warm sub-bass, unpolished raspy vocal, intimate room mic, zero reverb wash",
    negativePrompt: "sibilance, high-frequency hiss, piercing treble, autotune, generic church cliches, clean radio pop, synthesizer pad wash",
    engineSliders: { weirdness: 15, styleInfluence: 75, voiceAudio: 100 },
    lyrics: `[Intro – Spoken, close mic, tired breath]
No stage lights tonight.
Just grease on my knuckles and gravel under my boots.
I'm done pretending I've got it all figured out.

[Verse 1]
Two lane highway, dashboard glow at 3 AM.
Tired of the phrases and the polished hymns.
If I can't speak the truth when my chest is tight,
Then what's the point of fighting through another night?

[Chorus - 60-Second Refrain]
Strip away the slogans, strip away the pride.
I don't need a sermon just to feel alive.
Meet me in the wreckage, meet me in the grit...
Where the broken heart is where the healing fits.

[Verse 2]
Hands on the wheel, calloused and sore.
Left my excuses right outside the door.
Real faith isn't pretty words upon a page—
It's breathing in the quiet when the storms still rage.

[Bridge - Throne Room Pivot]
Here at the bottom of the canyon floor...
I'm not asking for an easy way out no more.
Take the broken pieces, take this heavy breath...
You are the life that overcomes the death.

[Outro]
Right here at the last line...
Meet me here.`,
    versions: [
      { version: "v1.0 (Work in Progress)", timestamp: "2026-10-11", reason: "Active songwriting session with Co-Producer AI", lyrics: "Strip away the slogans, strip away the pride..." }
    ],
    selahPrayed: false,
  },
];

export const NIGHTCAFE_DEFAULT_PROMPTS: NightCafePrompt[] = ALL_CANONICAL_PROMPTS;
