import { Track, EPCollection, NightCafePrompt } from '../types';

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
    lyrics: `[Bridge 1 | intimate | ambient pads]
Take the rough, Take the raw,
Sand away the pride.
Under the weight of the Master’s hand,
There’s nowhere left to hide.

[Bridge 2 | building energy | rhythmic pulse]
Take the rough, Take the raw,
Sand away the pride.
Under the weight of the Master’s hand,
There’s nowhere left to hide.

[Bridge 3 | maximum tension | rising pitch]
Spin the lathe, Feel the heat,
Until the work is done.
It’s not my image, not my will,
BUT THE LIKENESS OF THE SON!

[Selah | filtered drop | underwater effect]

[Drop | Heavy Melodic Dubstep | Massive Supersaws]
(THE MAKER'S HAND!)

[Verse 2 | 1:30 | Half-time | Driving sub-bass]
The blade meets the surface,
The sparks begin to fly.
Cutting out the hollow parts,
To let the truth rise high.

[Chorus | 2:00 | Anthemic vocal]
Oh, the Maker’s hand is steady,
When the steel is glowing red.
He’s writing out a story,
Where the old man is left for dead.

[Final Drop | 3:20 | Maximum Volume | Heavy Glitch FX]
(Explosive finale)

[Outro | 3:50 | Reverb tail | Fading synth]
In the grain... of the wood...`,
    versions: [
      { version: "v1.0 (Dubstep)", timestamp: "2026-09-02", reason: "Melodic Dubstep & Massive Supersaws", lyrics: "Take the rough, Take the raw, Sand away the pride..." },
      { version: "v2.0 (Spoken Rewrite)", timestamp: "2026-09-04", reason: "Emotional spoken word intro about male provider weight & loneliness", lyrics: "Spoken intro: Who helps this man when he doesn't have the answers? Take the rough, take the raw..." }
    ],
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
    lyrics: `The shadows tried to take your light,
And keep every morning still,
No, they never met the spirit,
Of a "Thy will be done" kind of will.
Through the seasons of the silence,
And the weight of all you lost,
You carried every burden,
Never counting up the cost.
From a husband to a daughter,
Stolen long before their time,
You were the steady heartbeat,
In the mountain and the climb.

This is a song of triumph, 
In a melody of grace,
You’re a giant, 
You’re defiant,
With the light upon your face!
You’re the beauty in the breaking,
You’re the story to be told,
It was mercy in the making,
Of a heart of solid gold.
Dedicated to the family,
Spirit brave and spirit true,
Every candle is a victory,
That was won because of you!

Doctors had their charts and graphs,
Winter wind was bold and cold,
A fire in your silence,
That the world has never told.
You looked cancer in the eye,
And you made the coward flee,
You rose up from the wreckage,
To find who you’re meant to be.

Solo Vocal, no reverb:
You’re a breathing miracle...

UNDERNEATH THE OPEN SKIES!

This is a song of triumph, 
In a melody of grace,
You’re a giant, 
You’re defiant,
With the light upon your face.

Light up every holiday,
Every candle's victory,
For the woman you chose to be.`,
    versions: [
      { version: "v1.0 (Solo Tribute)", timestamp: "2026-08-28", reason: "Raw intimate solo vocal & piano", lyrics: "The shadows tried to take your light... You're a breathing miracle..." },
      { version: "v2.0 (Gospel Group Shout)", timestamp: "2026-09-03", reason: "Full Gospel Choir & Hammond B3 Leslie swell with Mrs T", lyrics: "Intro: This is for you Mom... Full choir explosive finale underneath the open skies!" }
    ],
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
    lyrics: `[Intro]
[Stomp-and-clap rhythm, heavy stomps]
"Yeah... we're taking it back to the source. From the dust to the river. Let’s work."

[Verse 1]
There is a river... (Nothing but the blood!)
Runs through the desert... (Nothing but the blood!)
I was looking for a sign— (Looking for a sign!)
Leaving it behind. (Leave it all behind!)
Now I'm standing in the light! (Yeah, I'm standing in the light!)

[Chorus]
[Full Power - Wall of Sound]
Precious is the source! (Precious is the source!)
The river in my bones! (River in my bones!)
No other hope I find! (No other hope!)
NOTHING! BUT THE BLOOD OF JESUS! (NOTHING BUT THE BLOOD!)

[Verse 2]
Lies I told myself. (Lies I told myself!)
Trophies on a shelf. (Trophies on a shelf!)
Truth is breaking through. (The truth is breaking through!)
Making all things new. (Making all things new!)
Washed and I am clean! (Washed clean!)
Yeah, you know just what I mean!

[Bridge]
Grace—to the horizon. (To the horizon!)
Love—reaches the island. (Reaches the island!)
The River—yeah it’s rising. (The River is rising!)
CARRY THIS WANDERER HOME! (CARRY ME HOME!)

[Final Chorus & Reprise]
PRECIOUS IS THE SOURCE!
THE RIVER IN MY BONES!
NO OTHER HOPE I FIND!
NOTHING BUT THE BLOOD OF... JESUS!`,
    versions: [
      { version: "v1.0 (Gospel Wall)", timestamp: "2026-08-30", reason: "Stomp-and-clap soulful gospel wall of sound", lyrics: "There is a river... Runs through the desert..." },
      { version: "v2.0 (Mrs T Worship 6/8)", timestamp: "2026-09-02", reason: "Mrs T deep authoritative alto, Hammond B3, Throne Room Pivot", lyrics: "Where is the river that runs through the desert? Nothing but the blood of Jesus..." },
      { version: "v3.0 (Classic Blues-Rock)", timestamp: "2026-09-03", reason: "Overdriven Marshall stacks, pentatonic blues guitar solo, raspy fry", lyrics: "Heavy drum fill, bluesy pentatonic riff, raspy power belt..." },
      { version: "v4.0 (CHH Aggressive 808)", timestamp: "2026-09-04", reason: "Male rap hard hitting, 808 bass, brass fanfare", lyrics: "River in the drought. Shadow in my mouth. I was looking for a sign..." }
    ],
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
    lyrics: `[Verse 1 | intimate | breathy alto]
I was praying for a shoreline
where the waves don’t ever break.
Looking for a version of peace
that didn't have a price or an ache.
But the silence isn't safety
and the comfort isn't the goal.
There’s a friction in the waiting
that’s meant to make me whole.

[Pre-Chorus]
I’m dropping the anchor I held in my hand,
Trading the weakness that I understand.
He’s working in the weight to perfect the design,
This is the pressure that makes the diamond shine.

[Chorus 1 | anthemic | big lift | soaring strings]
It’s the leaning, not the leaving!
It’s the leaning, not the leaving!
There is a purpose in the pain,
A steady hand inside the flame!
I surrender the battle, I surrender the fight,
I trust the Father to turn on the light!
Oh, it’s the leaning, not the leaving!

[Verse 2]
I’m done with the heavy lifting
of trying to save my own life.
Until the only comfort I’m left with...
IS CHRIST AND CHRIST ALONE!

[Bridge | climax | massive vocal stack]
Unity is born when the pride starts to break!
Peace is the treasure that the fire can’t take!
We don’t find the light by avoiding the dark
But by letting the friction become the spark!`,
    versions: [
      { version: "v1.0 (Acoustic Cello)", timestamp: "2026-08-29", reason: "Piano and deep cello duet, intimate breathy alto", lyrics: "I was praying for a shoreline... It's the leaning, not the leaving..." },
      { version: "v2.0 (Stadium Rock)", timestamp: "2026-09-02", reason: "Overdriven Marshall stacks, syncopated snare crack, Benatar snarl", lyrics: "Overdriven Marshall stacks: I was clawing for a shoreline... IS CHRIST AND CALVARY!" }
    ],
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
    lyrics: `[Verse 1]
Saw a warning light flashin'
Halfway down Highway 9
Told myself I'd check tomorrow
Told myself I had the time
Funny thing about trouble
It don't stay where you leave it
You can paint over the symptoms
But eventually you'll see it
The cost is always cheaper
When you catch it at the start
Funny how I'll check an engine
Before I'll check my heart

[Pre-Chorus]
Patience ain't passive
Waiting ain't weak
Faith gets muddy boots
Walkin' where it can't see

[Chorus]
Check your heart light
Don't keep drivin' on
Somethin's runnin' warnin'
And you know somethin's wrong
God of all seasons
Won't You look inside of me
Check your heart light
Before it costs you everything!

[Bridge - Throne Room Pivot]
So I pulled off to the shoulder
Took my hands up off the wheel
Hauled the questions from my trunk
Brought the anger I couldn't heal!
Popped the hood right at the altar, said:
"God. This. Is. How. I. Feel!"
And the first thing I could whisper...
Was Your name!
JESUS!
You're rebuildin' me from the inside out!`,
    versions: [
      { version: "v1.0 (Brandon Swamptronica)", timestamp: "2026-08-25", reason: "BMV1 Brandon weathered raspy storyteller", lyrics: "Saw a warning light flashin' halfway down Highway 9..." },
      { version: "v2.0 (CYHLv2 Revival)", timestamp: "2026-08-28", reason: "Explosive 60s hook, tent revival roar", lyrics: "Check your heart light! Don't run cold! Quit burning miles down broken roads!" },
      { version: "v3.0 (Ms T v2 Alto)", timestamp: "2026-09-01", reason: "Deep alto chest-voice, warm B3 organ", lyrics: "Saw a warning light flashin' crossin' past the county line..." },
      { version: "v4.0 (Ms T v8 Master)", timestamp: "2026-09-04", reason: "Refined slant-rhyme bridge: Hauled questions from my trunk, God this is how I feel!", lyrics: "Popped the hood right at the altar, said: God. This. Is. How. I. Feel!" }
    ],
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
    lyrics: `[Intro]
(Atmospheric sound of stadium whistle, heavy distorted electric guitar feedback)
One team. One heartbeat. 
Check the tape. 77 on the jersey, weight is on the soul. Listen.

[Verse 1]
Nose guard breathing down my neck, smelling like the mud
Right guard, locking in the stance, it’s in the blood
Blue 42! The cadence is a war cry in the cold
Seventy-Seven on the line, doing what I’m told
Dirt in the fingernails, sweat stinging in the eyes
We don’t run for the trophies, we run for the prize!

[Chorus]
One team! One heartbeat! 
When the whistle blows, we don’t accept defeat!
Keep fighting, keep driving, keep flying high!
Calvary Eagles, we’re the kings of the sky!
From the one-yard line to the end zone floor
We don't just play the game—we're bringing the roar!

[Verse 2]
Coach yelling in the ear, echoing inside the helmet:
"If your line ain't straight, your mind ain't straight"—you felt it?
That’s the discipline, the gospel of the gridiron grind!

[Bridge]
I look to the Hill where my help comes from,
Before the victory's won, the battle's begun!
Quiet the mind. Hear the call.
One Team. One Heartbeat. Stand tall.`,
    versions: [
      { version: "v1.0 (The Prophet)", timestamp: "2026-09-02", reason: "Deep Baritone stadium rap delivery", lyrics: "One team. One heartbeat. 77 on the jersey..." },
      { version: "v2.0 (NF Combatant Rewrite)", timestamp: "2026-09-04", reason: "Rapid-fire triplets, surgical flow, dark industrial noise", lyrics: "Calvary on the jersey, vision getting blurry... Blue 42! Intellectual attack on the track!" }
    ],
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
    ep: "EP 2: Conflict Suite",
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
    lyrics: `[Intro: Spoken Word, Cinematic rain, slow heartbeat kick]
They see the uniform... 
They see the... "I got it." 
But nobody sees the hands... shaking... under the table. 
I’m the bridge everyone walks on... but who’s looking... underneath?

[Verse 1 | 76 BPM, lagged flow, behind the beat]
Coffee... at five. 
Mask on... by six.
Fixing the sink... while the soul’s in a fix.
My kids need a shield... 
And my wife... needs a rock.
The boss needs a win... and the church... needs to sing.
The silence... is screaming... in this truck.
I’m driving on empty... just running on luck.

[Verse 2]
Staring at the wood grain... tracing... every line.
The clock is ticking like a hammer... stealing all my time.
The "Ask" is coming... I can feel it in the heat.
The weight of the decision... the smell of my defeat.
Then I say... "I don't know"... 

[Stop Music - 3 second total vacuum silence]

...and the air... leaves the room.
I’m a ghost in my own hallway... I’ve forgotten my name.
Living for the honor... but I’m dying... in the shame.

[Chorus]
Who helps the man... when the man is the help?
Who catches the one... catching everyone else?
I’m at the end of the rope... and the knot’s coming loose.
Lord, I’m the provider... but I’m dying for You.
It’s so lonely in the dark... I can't even see my face.
Just a son without an answer... searching for Your grace.

[Bridge/Outro]
(Spoken) I don’t have it. I don’t have the answer! I’m just a son... 
[DYNAMIC SHIFT: Explosive Spoken Scream]
WHO CAN'T DO IT THIS TIME! 
[Distorted Reprise Scream]
GOD, I’M AT THE EDGE! I’M AT THE LAST LINE!
PLEASE... GOD! JUST MEET ME HERE!
...at the last line.`,
    versions: [
      { version: "v1.0 (Standard 76 BPM)", timestamp: "2026-09-02", reason: "Standard cinematic blue-collar psalm with 3s vacuum silence", lyrics: "Coffee at five. Mask on by six..." },
      { version: "v2.0 (Harder Scream)", timestamp: "2026-09-04", reason: "MMH Harder: Raw, exhausted, voice breaking at 2 a.m. in truck", lyrics: "WHO CAN'T DO IT THIS TIME?! LOGIC'S GONE! THIS IS THE LAST LINE!" }
    ],
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
    lyrics: `[Kane - CHH Industrial Cut]
[Intro]
Brick OS. System override. Kingdom logic in a binary world.

[Verse 1]
They got the data on your dopamine, they’re mining for your soul
A digital panopticon that’s fighting for control
It’s the validation-vacation, a synthetic location
Building your foundation on a pixelated nation? (Nah)
I see the ghost in the wires, the liar in the code
Selling you a shortcut on a heavy-burden road
You're counting "likes" while you're losing the Likeness!

[Chorus]
He’s not a GHOST in the machine!
He’s the KING of everything I’ve seen!
(Hard Stop - Bass Drop)
He’s NOT a ghost in the machine!
He’s the KING of everything I’ve seen!

[Verse 2]
I beat the system with the Wisdom, my vision is corrected
The enemy is frantic 'cause my spirit is protected
Domestic earnestness—I'm focused on my family tree
While you’re scrolling through the feed of a dead philosophy!`,
    versions: [
      { version: "v1.0 (Kane CHH)", timestamp: "2026-09-03", reason: "Kane deep industrial 808 CHH master", lyrics: "They got the data on your dopamine... He's not a ghost in the machine!" },
      { version: "v2.0 (Neon Gospel K-Pop)", timestamp: "2026-09-04", reason: "Neon Gospel female boss energy, high-pitch glitches, explosive choir", lyrics: "Watch the screen. Watch the shadow. The war is in the room. He's NOT a ghost in the machine!" }
    ],
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
    lyrics: `Twenty-six years in the ring, still standing
Four lives raised, yeah the grace was demanding
Forty-five years, just hitting my stride
Got the discipline locked, no place to hide
Steps on the pavement, 15k on the clock
Twice a day in the gym, yeah I’m solid as a rock
Just checked the watch, another record is gone
Yeah, I’m chasing the Son till the break of the dawn!

Consistent... Stronger... LET’S GO!

[Chorus]
I’m stayin’ consistent for my calling!
I’m gettin’ hotter for my husband!
I’m stayin’ stronger for our kids!
And I’m confident for me—yeah, look at what He did!

One’s moved out, got three still in the nest
I’m building up the temple, giving them my best
I want 'em to see what a finish line takes
It’s more than the muscles, it’s the spirit carrying the weight—
Through the ceiling, through the doubt, through the "I can't" noise
I’m a woman on a mission, let 'em hear the voice!

Another mile down.
Another record broken.
Stay consistent.
Hotter for him... stronger for them.
Forty-five and just getting started.
Confident!`,
    versions: [
      { version: "v1.0 (Master)", timestamp: "2026-09-02", reason: "Courtney's official workout anthem master cut", lyrics: "Twenty-six years in the ring, still standing..." }
    ],
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
    lyrics: `[Verse 1 | Male Voice | intimate | dry]
I’m staring at the table, 
you’re tracing out a line, 
Trying to find a future, 
where the stars and logic align. 

[Verse 1 | Female Voice | joins | breathy]
The map is getting heavy, 
the ink is running dry, 
We’re asking for a "how-to", 
when we’re meant to ask for "Why". 

[Pre-Chorus | Duet | building tension]
We’ve got a thousand reasons, 
to stay inside the door, 
Waiting on a signal, 
we’ve already heard before. 

[Chorus | Duet | anthemic | UNISON]
It’s a blindfold blessing, 
a holy "I don’t know," 
It’s the weight of the shadow, 
where the wild mercies grow. 
I’m trading the compass, 
for the pulse inside the chest, 
‘Cause "wherever" is a promise, 
and HIS "wherever" is my rest!

[Bridge]
The step is thin as paper,
The dark is thick as stone,
But the "wherever" of the Father,
Means we never walk alone!

[Chorus | Duet | maximum intensity | Power Belt]
It’s a blindfold blessing, 
a holy "I don’t know," 
Cause "wherever" is a promise, 
and HIS "wherever" is my rest!`,
    versions: [
      { version: "v1.0 (Country Duet)", timestamp: "2026-08-30", reason: "Solo cello, rhythmic acoustic tapping, Brandon & Monica duet", lyrics: "I'm staring at the table, you're tracing out a line..." },
      { version: "v2.0 (Progressive CEDM)", timestamp: "2026-09-02", reason: "128 BPM progressive house, massive stadium supersaw drop", lyrics: "Build-up: One, two, one two three let's go! It's a blindfold blessing! A holy I don't know!" }
    ],
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
    lyrics: `[Specific Delivery Instruction: ABSOLUTE A CAPPELLA START. NO INSTRUMENTS. Spoken Word, intimate, close-mic, dry.]

[Verse 1]
(Ms T - Spoken Word, slow and thoughtful)
I was caught in my reflection... just staring at the glass.
Counting every wrinkle... watching how the minutes pass.
Measuring my value by the fading of the light...
Listening to whispers... in the middle of the night.

[Pre-Chorus]
(SUDDEN IMPACT: Single, warm, low B3 Organ note swells slowly)
But the glass is just a witness made of silver and of sand!
It doesn't know the secrets or the power of His hand!
If you’re chasing down a ghost just to feel like you’re enough,
You’re betting on an image that’ll run when it gets tough!
Yeah, you’re hunting for a reason in a face that’s gonna change,
Looking for a beauty that can never be rearranged!

[Chorus]
[Explosive Drop - Deep Log Drums and Massive Gospel Choir]
The glass is gonna crack, the silver's gonna fade!
I’m trading in the mask for the way that I was made!
I'm a masterpiece of mercy, I'm a canvas of His grace!
I don't need a looking-glass to see the Father's face!
Eyes on the King, let the glass lose its sting!

[Bridge]
He looks at the heart... (Choir: Yes He does!)
He’s clearing the view... (Choir: Making it new!)
He’s taking the fragments... (Choir: Oh!)
And making it You!`,
    versions: [
      { version: "v1.0 (Master)", timestamp: "2026-09-03", reason: "Ms T master cut with absolute a cappella start into explosive gospel choir", lyrics: "I was caught in my reflection... just staring at the glass..." }
    ],
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
];

export const NIGHTCAFE_DEFAULT_PROMPTS: NightCafePrompt[] = [
  { song: "Brick by Brick", idx: 1, title: "Foundational Blueprint", prompt: "Cinematic shot of weathered granite cornerstone set into red clay soil under morning light, blueprint sketches faintly glowing in the dust, 8k photorealistic.", aspectRatio: "1:1" },
  { song: "The Master's Hand", idx: 2, title: "The Spinning Lathe", prompt: "Macro 120fps shot of dark walnut spinning on a woodturning lathe, glowing shavings curling off in golden ribbons, warm workshop lighting.", aspectRatio: "16:9" },
  { song: "Every Candle's Victory", idx: 3, title: "The Altar Under the Open Skies", prompt: "Triumphant wide shot of a resilient woman with gold in her eyes looking up underneath open sunrise skies, thousands of flickering candles.", aspectRatio: "16:9" },
  { song: "Nothing But The Blood", idx: 4, title: "River in the Desert", prompt: "Epic cinematic shot of a radiant living water river cutting through a cracked desert canyon, golden sunrise illuminating mist, photorealistic.", aspectRatio: "16:9" },
  { song: "Check Your Heart Light", idx: 5, title: "Muddy Boots at the Altar", prompt: "Close-up of worn muddy boots resting beside an open pickup truck hood on a country gravel shoulder at dusk, warm altar glow, 9:16 vertical.", aspectRatio: "9:16" },
  { song: "Glitter", idx: 6, title: "The Dark House Lit With Glitter", prompt: "Dark weathered craftsman home at twilight suddenly bursting with golden interior warmth and iridescent floating sparkles, photorealistic 8k.", aspectRatio: "1:1" },
  { song: "Meet Me Here", idx: 7, title: "5 AM Rain & Shaking Hands", prompt: "Close-up of rough calloused hands clasped under a dark wooden table, single tear on knuckles, blue-collar truck cab rain streaks, 9:16 vertical.", aspectRatio: "9:16" },
  { song: "Venom Into Victory", idx: 8, title: "Golden Whistle & Shimmer Volcano", prompt: "Hyper-saturated K-Pop aesthetic, 3D chrome golden whistle spinning over shimmering liquid gold lava volcano, pink neon accents, 9:16.", aspectRatio: "9:16" },
  { song: "Ghost In The Machine", idx: 9, title: "Silicon Cathedral", prompt: "Vast brutalist cathedral interior crossed with glowing optic fiber cables and towering server racks, stained glass holographic projections in gold.", aspectRatio: "16:9" },
  { song: "The Milestone", idx: 10, title: "15k Step Pavement", prompt: "Low-angle dynamic tracking of aggressive running shoes striking wet asphalt at sunrise, golden sunburst reflecting off puddles, 9:16 vertical.", aspectRatio: "9:16" },
  { song: "Blindfold Blessing", idx: 11, title: "Linen Blindfold & Canyon Mist", prompt: "Surrender portrait of artisan in coarse linen blindfold walking calmly onto mountain bridge shrouded in dawn clouds, 9:16.", aspectRatio: "9:16" },
  { song: "Trading In The Mask", idx: 12, title: "Shattered Porcelain Kintsugi", prompt: "Macro slow motion shot of white porcelain mask shattering and mending with molten glowing 24k gold seams, photorealistic 8k.", aspectRatio: "1:1" },
  { song: "Breath and Bone", idx: 13, title: "Awakening of Dry Bones", prompt: "Desert canyon with scarred cedar and resurrected life, holy golden wind swirling, touching the scars of the Living One, 16:9.", aspectRatio: "16:9" },
];
