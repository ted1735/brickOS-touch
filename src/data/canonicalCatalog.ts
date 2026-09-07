import { Track, EPCollection, NightCafePrompt } from '../types';

export const EP_COLLECTIONS: EPCollection[] = [
  { id: 'EP 1: Restoration', title: 'EP 1: The Restoration Project', theme: 'Refinement, Healing & Foundation' },
  { id: 'EP 2: Conflict Suite', title: 'EP 2: The Conflict Suite', theme: 'Family, Relationships & Sanctification' },
  { id: 'EP 3: War Room Anthems', title: 'EP 3: War Room Anthems', theme: 'Spiritual Warfare, Discipline & Identity' },
  { id: 'EP 4: Surrender Sessions', title: 'EP 4: The Surrender Sessions', theme: 'Surrender, Sovereignty & Divine Presence' },
];

export const VOCAL_ROSTER = [
  { name: 'Brandon', archetype: 'Raspy Male Vocal', bestFor: 'Modern Folk Worship, Indie, Weary Father' },
  { name: 'PATD', archetype: 'Emotive Deep Resonance', bestFor: 'Soul Piano Ballad, Soaring Rock' },
  { name: 'Kane', archetype: 'Sub-Sonic Steel', bestFor: 'Hard Rock, CHH, Deep Worship, Neo-Soul' },
  { name: 'Neon Gospel', archetype: 'Hyper-Pop Shimmer', bestFor: 'Aggressive K-Pop Fusion, Anthem' },
  { name: 'Monica', archetype: 'Gritty Soulful Raspy', bestFor: 'High-energy Hip-Hop, Trap, Gospel' },
  { name: 'Ms T', archetype: 'Emotive Raw Power', bestFor: 'Soulful Gospel Anthem, B3 Organ' },
  { name: 'Malachi Stone', archetype: 'Sub-Sonic Quarry', bestFor: 'Deep boom-bap, foundational authority' },
  { name: 'Silas Thorne', archetype: 'Aged Oak', bestFor: 'Blue-collar gothic, 5 AM diesel acoustics' },
];

export const CANONICAL_TRACKS: Track[] = [
  {
    id: "TRK-01",
    ep: "EP 1: Restoration",
    title: "Brick by Brick",
    status: "In Progress",
    genre: "Christian Hip Hop / Boom-Bap",
    bpm: 88,
    key: "D Minor",
    vocal: "The Architect",
    vocalCast: "Malachi Stone (Sub-Sonic Quarry)",
    thesis: "Brokenness Redeemed In Christ's Kingdom; foundation stone.",
    sunoPrompt: "Christian Hip Hop, 88 BPM, Key of D Minor, boom-bap drums, gritty MPC swing, warm upright bass, authentic male rap vocal",
    negativePrompt: "sibilance, high-frequency hiss, piercing treble, digital artifacts, muddy bass, synthetic choir, autotune",
    engineSliders: { weirdness: 12, styleInfluence: 65, voiceAudio: 100 },
    lyrics: `[Vocal Archetype: Malachi Stone]
[Delivery: Laid-back confidence, behind the beat, gritty MPC pocket]

[Verse 1]
They see ruins, I see the blueprint.
B-R-I-C-K, yeah, let’s build.
Streets hum a hymn, but the chords ring hollow.
Carrying cement where the broken souls follow.
Laying plumb lines straight through the midnight rain,
Trading all the rubble for the Kingdom pane.

[Chorus]
[High-Energy 60-Second Hook Target]
Kingdom Come, Kingdom Come!
Where the shattered hearts run!
Building the hope from the corner to the crown,
Brick by brick, tearing old walls down!
Yeah, brick by brick, Christ on the throne,
Never built on sand, we are living stone!

[Bridge]
[The Throne Room Pivot - Vertical Resolution]
Lord, take the mortar from my trembling hands,
I was just a builder on sinking sands.
Now the cornerstone is set, now the temple stands,
Holy, Holy, Holy is Your true design.`,
    versions: [
      { version: "v1.0", timestamp: "2026-09-01", reason: "Initial Suno draft", lyrics: "They see ruins,\nI see the blueprint." }
    ],
    selahPrayed: true,
  },
  {
    id: "TRK-02",
    ep: "EP 1: Restoration",
    title: "The Master's Hand",
    status: "Idea / Concept",
    genre: "Melodic Dubstep / Spoken Word",
    bpm: 140,
    key: "F Minor",
    vocal: "The Craftsman",
    vocalCast: "PATD (Emotive Deep Resonance)",
    thesis: "The metaphor of the lathe, sanding, and fire for sanctification.",
    sunoPrompt: "Melodic Dubstep, 140 BPM, Key of F Minor, woodshop lathe foley, deep atmospheric pads, explosive melodic drop",
    negativePrompt: "sibilance, piercing treble, muffled bass, chaotic noise, autotune",
    engineSliders: { weirdness: 14, styleInfluence: 60, voiceAudio: 100 },
    lyrics: `[Vocal Archetype: PATD]
[Delivery: Conversational spoken word building into soaring chest-voice melody]

[Verse 1]
The smell of raw cedar on the concrete floor.
You spun the spindle till my edges tore.
I wanted polish, but You brought the blade,
Shaving every mask that my ego made.

[Chorus]
[60-Second Standalone Hook]
Hold me on the lathe, turn me in the fire,
Shape this crooked timber to Your heart's desire!
Out of the dust, into the grain,
Glory in the shaving, beauty in the pain!

[Bridge]
[The Throne Room Pivot]
You are the Potter, You are the Master Craftsman,
I surrender every splinter. Thy will be done.`,
    versions: [{ version: "v1.0", timestamp: "2026-09-01", reason: "Initial sketch", lyrics: "The smell of raw cedar..." }]
  },
  {
    id: "TRK-03",
    ep: "EP 1: Restoration",
    title: "Every Candle's Victory",
    status: "Lyrics Finalized",
    genre: "Soulful Gospel / Choir",
    bpm: 74,
    key: "Eb Major",
    vocal: "Gospel Choir Lead",
    vocalCast: "Ms T (Emotive Raw Power)",
    thesis: "Tribute to mother's cancer survival; breathing miracle.",
    sunoPrompt: "Soulful Gospel, 74 BPM, Key of Eb Major, B3 Hammond organ, polyphonic gospel choir, warm dry lead vocal",
    negativePrompt: "sibilance, high-frequency hiss, electronic synth, digital artifacts, autotune",
    engineSliders: { weirdness: 8, styleInfluence: 70, voiceAudio: 100 },
    lyrics: `[Vocal Archetype: Ms T]
[Delivery: Vulnerable close-mic proximity, growing into thunderous gospel power]

[Verse 1]
White hospital walls, monitor beeping slow,
Cold linoleum floor where the tears used to flow.
Doctor shook his head, but the prayer wouldn't quit,
Every breath in her lungs was an altar lit.

[Chorus]
[60-Second Viral Refrain]
Every candle burning is a victory won!
Every morning waking is the rising Son!
Darkness couldn't swallow what Your grace revived,
By the stripes on Your back, she is still alive!

[Bridge]
[The Throne Room Pivot]
Not our strength, but Your holy breath!
You conquered the grave, You swallowed death!
Jesus, Physician, King of all days!`,
    versions: [{ version: "v1.0", timestamp: "2026-09-02", reason: "Mother's anniversary tribute draft", lyrics: "White hospital walls..." }]
  },
  {
    id: "TRK-04",
    ep: "EP 1: Restoration",
    title: "Nothing But The Blood",
    status: "In Progress",
    genre: "Gospel / Rock / CHH",
    bpm: 112,
    key: "G Minor",
    vocal: "Mrs T / Kane",
    vocalCast: "Kane (Sub-Sonic Steel) & Ms T",
    thesis: "River in the desert; modern genre-bending hymn.",
    sunoPrompt: "Genre-Bending Modern Hymn, 112 BPM, Key of G Minor, heavy 808s meets distorted rock guitars and soulful organ",
    negativePrompt: "sibilance, piercing highs, thin vocals, muddy low end",
    engineSliders: { weirdness: 16, styleInfluence: 68, voiceAudio: 100 },
    lyrics: `[Vocal Archetype: Kane & Ms T]
[Verse 1 - Kane]
What can wash away the stain of the street?
No detergent on the market makes the soul complete.
Tried the legalism checklist, ended in defeat,
Now I lay my dirty garments at the Mercy Seat.

[Chorus - Ms T & Polyphonic Choir]
Nothing but the blood! Nothing but the blood!
Flowing like a river through the desert mud!
Oh precious is the flow, that makes me white as snow!`,
    versions: [{ version: "v1.0", timestamp: "2026-09-02", reason: "Duet session init", lyrics: "What can wash away..." }]
  },
  {
    id: "TRK-07",
    ep: "EP 1: Restoration",
    title: "Check Your Heart Light",
    status: "In Progress",
    genre: "Swamptronica Revival Worship",
    bpm: 104,
    key: "G Major",
    vocal: "Brandon / Ms T",
    vocalCast: "Brandon (Raspy Male Vocal)",
    thesis: "Warning light on dash; popping the hood at the altar.",
    sunoPrompt: "Swamp Rock Revival Worship, 104 BPM, Key of G Major, slide resonator guitar, heavy foot stomps, analog sub bass",
    negativePrompt: "sibilance, glossy pop production, autotune, stadium reverb",
    engineSliders: { weirdness: 18, styleInfluence: 62, voiceAudio: 100 },
    lyrics: `[Vocal Archetype: Brandon]
[Verse 1]
Amber glow flickering on the dashboard glass,
Told myself I'd fix it when the season passed.
Engine knocking hard under twenty pounds of pride,
Can’t keep driving on a breakdown on the inside.

[Chorus]
Pop the hood at the altar, let the Healer in!
Check that heart light blinking through the noise and sin!
Oil of the Spirit, wash the cylinders clean!`,
    versions: [{ version: "v1.0", timestamp: "2026-09-03", reason: "Automotive metaphor writing session", lyrics: "Amber glow flickering..." }]
  },
  {
    id: "TRK-08",
    ep: "EP 2: Conflict Suite",
    title: "Glitter",
    status: "Lyrics Finalized",
    genre: "Upbeat Pop / Acoustic",
    bpm: 120,
    key: "E Major",
    vocal: "Pop Vocalist",
    vocalCast: "Neon Gospel (Hyper-Pop Shimmer)",
    thesis: "Tribute to Courtney; dark house illuminated with joy.",
    sunoPrompt: "Upbeat Faith Pop, 120 BPM, Key of E Major, sparkling acoustic flatpicking, rhythmic claps, radiant vocal harmonies",
    negativePrompt: "sibilance, melancholy, dark distortion, muddy bass",
    engineSliders: { weirdness: 8, styleInfluence: 72, voiceAudio: 100 },
    lyrics: `[Vocal Archetype: Neon Gospel]
[Verse 1]
She walks into the shadows with a broom and light,
Turns the greyscale Tuesday into something bright.
Spilling gratitude across the kitchen floor,
Loving through the seasons when the storm’s at the door.

[Chorus]
You leave glitter on the darkest road,
Lifting every burden from a heavy load!
Joy is our weapon, love is the song!`,
    versions: [{ version: "v1.0", timestamp: "2026-09-03", reason: "Courtney dedication draft", lyrics: "She walks into the shadows..." }]
  },
  {
    id: "TRK-09",
    ep: "EP 2: Conflict Suite",
    title: "Calvary Grit",
    status: "UVR5 Stem Prep",
    genre: "Dark Industrial CHH",
    bpm: 140,
    key: "C Minor",
    vocal: "The Prophet / NF Tenor",
    vocalCast: "Kane (Sub-Sonic Steel)",
    thesis: "Gridiron #77 discipline; football as spiritual warfare.",
    sunoPrompt: "Dark Industrial CHH, 140 BPM, Key of C Minor, aggressive distorted 808s, heavy metal riffs, breathless cadence",
    negativePrompt: "sibilance, cheerful melodies, lo-fi mellow guitar, synthetic choir",
    engineSliders: { weirdness: 14, styleInfluence: 68, voiceAudio: 100 },
    lyrics: `[Vocal Archetype: Kane]
[Delivery: Razor-sharp plosives, aggressive cadence, unyielding discipline]

[Verse 1]
Number seventy-seven in the trenches, grass on the helmet face,
They think it's just a game, but it's warfare in this place.
Shed the block, hold the gap, fourth and one on the line,
Satan wants the territory, but the victory is divine!

[Chorus]
[60-Second Hook Target]
Calvary Grit! We don't bow, we don't quit!
Every blow against the armor, holy fire gets lit!
Trenches of the spirit, blood upon the field,
Christ has won the championship, we will never yield!

[Bridge]
[The Throne Room Pivot]
Strip the pads, drop the pride on the sideline floor,
The war is already finished at the cross's door!`,
    versions: [{ version: "v1.0", timestamp: "2026-09-01", reason: "Lineman spiritual warfare concept", lyrics: "Number seventy-seven..." }]
  },
  {
    id: "TRK-13",
    ep: "EP 2: Conflict Suite",
    title: "Meet Me Here",
    status: "In Progress",
    genre: "Blue-Collar Gothic CHH",
    bpm: 76,
    key: "D Minor",
    vocal: "Brandon / Weary Father",
    vocalCast: "Silas Thorne (Aged Oak)",
    thesis: "Who helps the man when the man is the help; 5 AM truck breakdown.",
    sunoPrompt: "Slow-Burn Cinematic CHH, 76 BPM, Key of D Minor, dark strings, distant rain and diesel truck rumble, 808 sub, vacuum silence",
    negativePrompt: "sibilance, clean radio sound, happy melodies, autotune",
    engineSliders: { weirdness: 18, styleInfluence: 60, voiceAudio: 100 },
    lyrics: `[Vocal Archetype: Silas Thorne]
[Specific Delivery: Raspy, conversational, exhausted male confession]

[Verse 1]
Coffee at five. Mask on by six.
Fixing the sink while the soul’s in a fix.
Kids need a shield, wife needs a rock,
Deadlines piling on the kitchen clock.
Parked on the shoulder in the freezing sleet,
Head on the steering wheel, running on defeat.
Then I say... "I don't know"...
[3 seconds vacuum silence]

[Chorus]
[60-Second Standalone Hook]
Who helps the man when the man is the help?
I swallow the cry till it chokes in my chest.
I built all the walls, but I forgot how to rest.
Lord, I'm dying for You. Just meet me here.

[Bridge]
[The Throne Room Pivot]
You knelt in Gethsemane, You know the sweat and blood,
You carry the father when he sinks in the mud.
Not my strength, but Your Spirit alone!`,
    versions: [
      { version: "v1.0", timestamp: "2026-09-03", reason: "Truck cab voice note transcription", lyrics: "Coffee at five. Mask on by six." }
    ],
    selahPrayed: true,
  },
  {
    id: "TRK-16",
    ep: "EP 3: War Room Anthems",
    title: "Ghost In The Machine",
    status: "Idea / Concept",
    genre: "Industrial CHH / K-Pop",
    bpm: 132,
    key: "F# Minor",
    vocal: "Kane / Neon Gospel",
    vocalCast: "Neon Gospel & Kane",
    thesis: "Digital panopticon; algorithm vs Kingdom frequency.",
    sunoPrompt: "Industrial K-Pop CHH, 132 BPM, Key of F# Minor, glitched 808s, cybernetic arpeggios, aggressive rap delivery",
    negativePrompt: "sibilance, acoustic ballad, slow tempo, organic folk",
    engineSliders: { weirdness: 20, styleInfluence: 65, voiceAudio: 100 },
    lyrics: `[Vocal Archetype: Neon Gospel & Kane]
[Verse 1]
Blue light burning on the retinas at 2 AM,
Dopamine drip like an automated requiem.
Algorithms feeding all the panic to the feed,
Selling self-worship while the inner spirit bleeds.

[Chorus]
Break out of the simulation, tune to the Holy Ghost!
We don't bow to servers, we revere the Lord of Hosts!`,
    versions: [{ version: "v1.0", timestamp: "2026-09-04", reason: "Tech detox concept", lyrics: "Blue light burning..." }]
  },
  {
    id: "TRK-17",
    ep: "EP 3: War Room Anthems",
    title: "Confident & Consistent",
    status: "Sent for Distribution",
    genre: "CEDM / Workout Anthem",
    bpm: 128,
    key: "G Minor",
    vocal: "Monica",
    vocalCast: "Monica (Gritty Soulful Raspy)",
    thesis: "Courtney's 15k step workout anthem; 26 years strong in the ring.",
    sunoPrompt: "Christian EDM, 128 BPM, Key of G Minor, 16-bar riser into explosive synth drop, workout anthem, Monica raspy vocal, 808 trap drops",
    negativePrompt: "sibilance, slow tempo, lo-fi beats, mellow guitar",
    engineSliders: { weirdness: 10, styleInfluence: 70, voiceAudio: 100 },
    lyrics: `[Vocal Archetype: Monica]
[Specific Delivery: Gritty, commanding, high-energy festival anthem]

[Verse 1]
Twenty-six years in the ring, still standing,
Steps on the pavement, 15k on the clock!
Every drop of sweat is an altar expanding,
Building on the foundation, built on the Rock!
Cardio burning, devil on the run,
Fighting the good fight under the morning sun!

[Chorus]
[60-Second Hook Target - Massive CEDM Drop]
I’m stayin’ consistent for my calling!
I’m gettin’ hotter for my husband!
I’m stayin’ stronger for our kids!
No backslide, no retreat, no surrender,
Jesus is the King, the Eternal Defender!

[Bridge]
[The Throne Room Pivot]
You renew my youth like the eagles soaring high,
When my legs give out, You are the supply!
Glory to the Lamb who gives the power to overcome!`,
    versions: [
      { version: "v1.0", timestamp: "2026-09-02", reason: "Initial CEDM session", lyrics: "Twenty-six years in the ring" }
    ],
    selahPrayed: true,
  },
  {
    id: "TRK-18",
    ep: "EP 3: War Room Anthems",
    title: "In Our Veins",
    status: "In Progress",
    genre: "Heavy Tribal Chant / Worship",
    bpm: 100,
    key: "E Minor",
    vocal: "Tribal Lead",
    vocalCast: "Ms T & Choir",
    thesis: "God of galaxies running through human DNA.",
    sunoPrompt: "Tribal Cinematic Worship, 100 BPM, Key of E Minor, talking drum, massive shekere, pounding djembe, polyphonic vocal choir",
    negativePrompt: "sibilance, sterile digital synths, Western four-on-the-floor, autotune",
    engineSliders: { weirdness: 12, styleInfluence: 65, voiceAudio: 100 },
    lyrics: `[Vocal Archetype: Ms T]
[Verse 1]
Before the stars were spoken into place,
You mapped our heartbeat in the depths of grace.
The breath that moved across the deep,
Awakens every promise that You swore to keep.

[Chorus]
In our veins, in our veins!
The resurrection power that broke the chains!
From the dust of the ground to the throne on high!`,
    versions: [{ version: "v1.0", timestamp: "2026-09-04", reason: "Afrogospel / Tribal crossover", lyrics: "Before the stars..." }]
  },
  {
    id: "TRK-22",
    ep: "EP 4: Surrender Sessions",
    title: "Blindfold Blessing",
    status: "Lyrics Finalized",
    genre: "Country / CEDM Duet",
    bpm: 126,
    key: "F Major",
    vocal: "Acoustic Duet / CEDM",
    vocalCast: "Brandon & Neon Gospel",
    thesis: "Trading the compass for the pulse; holy I don't know.",
    sunoPrompt: "Country CEDM Hybrid, 126 BPM, Key of F Major, banjo flatpicking meets euphoric four-on-the-floor synth drop",
    negativePrompt: "sibilance, dark industrial noise, muffled vocals",
    engineSliders: { weirdness: 15, styleInfluence: 68, voiceAudio: 100 },
    lyrics: `[Vocal Archetype: Brandon & Neon Gospel]
[Verse 1]
Threw the roadmap out the passenger side,
Nothing left to steer, nothing left to hide.
I spent twenty years trying to predict the bend,
Now I hold Your hand to the very end.

[Chorus]
It’s a blindfold blessing, wherever we go!
Trading all my control for the holy 'I don't know'!
Lead me blind, Lord, lead me true!`,
    versions: [{ version: "v1.0", timestamp: "2026-09-05", reason: "Surrender session", lyrics: "Threw the roadmap..." }]
  },
  {
    id: "TRK-23",
    ep: "EP 4: Surrender Sessions",
    title: "Trading In The Mask",
    status: "In Progress",
    genre: "Soulful Gospel / Chiaroscuro",
    bpm: 96,
    key: "Eb Major",
    vocal: "Ms T",
    vocalCast: "Ms T (Emotive Raw Power)",
    thesis: "Porcelain mask crumbling; mirror of silver and sand.",
    sunoPrompt: "Soulful Chiaroscuro Gospel, 96 BPM, Key of Eb Major, Rhodes piano, deep pocket drums, authentic imperfect vocal rasp",
    negativePrompt: "sibilance, autotune, robotic pitch, sterile mix, wide washed reverb",
    engineSliders: { weirdness: 10, styleInfluence: 70, voiceAudio: 100 },
    lyrics: `[Vocal Archetype: Ms T]
[Verse 1]
Painted on the smile for the congregation hall,
Hiding all the cracks that were spreading down the wall.
Heavy porcelain crumbling at the seams,
You don't need my performance, You want my honest screams.

[Chorus]
[60-Second Hook Target]
I’m trading in the mask for the real reflection,
Crumbling to dust in Your resurrection!
Here is the scar, here is the clay,
Wash all the fake perfection away!

[Bridge]
[The Throne Room Pivot]
You looked past the cover, You saw into the heart,
Kintsugi in gold where I fell apart!`,
    versions: [{ version: "v1.0", timestamp: "2026-09-04", reason: "Kintsugi vulnerability session", lyrics: "Painted on the smile..." }]
  },
  {
    id: "TRK-24",
    ep: "EP 4: Surrender Sessions",
    title: "Breath and Bone",
    status: "Audio Master",
    genre: "Resurrection Anthem",
    bpm: 72,
    key: "D Major",
    vocal: "Resurrection Choir",
    vocalCast: "PATD (Emotive Deep Resonance)",
    thesis: "Touch the scars; not a ghost, but flesh and bone.",
    sunoPrompt: "Cinematic Resurrection Anthem, 72 BPM, Key of D Major, tom-centric percussion, tape-warped acoustic, lush analog pads",
    negativePrompt: "sibilance, high-frequency hiss, piercing treble, digital artifacts",
    engineSliders: { weirdness: 8, styleInfluence: 75, voiceAudio: 100 },
    lyrics: `[Vocal Archetype: PATD]
[Verse 1]
Touch the nail prints, touch the spear in the side,
Not an apparition in the shadows of the night.
He who walked through death stands before us today,
Rolling every boulder from our hardened hearts away!

[Chorus]
Breath and bone, seated on the throne!
Never will He leave His chosen alone!
Lungs full of life, fire in our eyes,
Behold the Lamb who forever shall rise!`,
    versions: [{ version: "v1.0", timestamp: "2026-09-03", reason: "Easter anthem master", lyrics: "Touch the nail prints..." }]
  },
  {
    id: "TRK-26",
    ep: "EP 4: Surrender Sessions",
    title: "Meet Me Here (Harder)",
    status: "In Progress",
    genre: "Dark Industrial CHH",
    bpm: 76,
    key: "D Minor",
    vocal: "Weary Rapper",
    vocalCast: "Kane (Sub-Sonic Steel)",
    thesis: "Unfiltered breakdown; vacuum silence and strained scream.",
    sunoPrompt: "Extreme Blue-Collar Gothic CHH, 76 BPM, Key of D Minor, brutal 808s, raw vocal rasp, room tone, 5 seconds total vacuum silence",
    negativePrompt: "sibilance, clean radio sound, happy melodies, polished pitch correction",
    engineSliders: { weirdness: 18, styleInfluence: 65, voiceAudio: 100 },
    lyrics: `[Vocal Archetype: Kane]
[Verse 1]
Screaming in the cab with the engine stalled out,
Tired of the platitudes they preach about.
If You are near to the broken in the dust,
Smash all my self-reliance into holy trust!

[Chorus]
[60-Second Hook]
Meet me here where the blood and grease blend,
Meet me at the place where the strong men bend!
I have no plan B, I have no shield left,
Lord, I am dying for You!`,
    versions: [{ version: "v1.0", timestamp: "2026-09-04", reason: "Heavy breakdown variation", lyrics: "Screaming in the cab..." }]
  }
];

export const NIGHTCAFE_DEFAULT_PROMPTS: NightCafePrompt[] = [
  { song: "Calvary Grit", idx: 1, title: "The Barren Ridge", prompt: "Low-angle cinematic tracking shot skimming cracked desert earth toward a weathered cedar fence post wrapped in rusted wire, dramatic thunderhead clouds churning at sunset, intense amber rim light on windblown dust, photorealistic 8k, steady 60fps.", aspectRatio: "16:9" },
  { song: "Calvary Grit", idx: 2, title: "The Forged Anvil", prompt: "Extreme slow-motion 120fps macro shot orbiting a heavy blacksmith anvil outdoors in driving wind, red-hot steel glowing as cold rain hits and steams violently, glowing sparks drifting across dark stone, dramatic chiaroscuro side lighting.", aspectRatio: "16:9" },
  { song: "Meet Me Here", idx: 26, title: "The Ancient Portal", prompt: "Slow cinematic glide through an overgrown mossy stone archway framed with climbing white wild roses, opening into a sun-drenched secluded cedar forest glade, morning mist rising gently, 8k photorealistic.", aspectRatio: "9:16" },
  { song: "Meet Me Here", idx: 27, title: "5 AM Diesel Cab", prompt: "Intimate close-up inside a blue-collar pickup truck cab at 5:00 AM, rain streaming down the cold windshield, glowing amber dashboard gauges, steam rising from a beat-up thermos, dark melancholic dawn lighting.", aspectRatio: "9:16" },
  { song: "Confident & Consistent", idx: 31, title: "Silicon Labyrinth", prompt: "Macro tracking shot gliding across dense multi-layered circuit boards, glowing neon cyan and electric cobalt data pulses racing along copper PCB traces, dark industrial tech aesthetic, razor-sharp metallic focus.", aspectRatio: "16:9" },
  { song: "Confident & Consistent", idx: 32, title: "15k Step Pavement", prompt: "Dynamic low-angle camera tracking aggressive running shoes striking wet asphalt at sunrise, golden sunburst reflecting off puddles, athletic sweat droplets in slow motion, relentless forward momentum.", aspectRatio: "9:16" },
  { song: "Trading In The Mask", idx: 40, title: "Cracked Porcelain Kintsugi", prompt: "Macro slow motion shot of an ornate white porcelain theatrical mask shattering and mending with molten glowing 24k gold seams, dramatic dark studio backdrop, soft rim lighting, photorealistic 8k.", aspectRatio: "1:1" },
  { song: "Brick by Brick", idx: 45, title: "Foundational Cornerstone", prompt: "Cinematic pedestal shot rising up a monumental weathered granite cornerstone set in deep dark soil, golden chisel marks catching the morning horizon, ancient olive trees in background.", aspectRatio: "1:1" }
];
