import { SOPRulesPackage } from '../types';

export const CANONICAL_SOP_MARKDOWN = `# The Nashville SOP v1.9 — Lyrical & Theological Constitution
*brickOS Sovereign Records — Lead Theological & Production Standard Operating Procedures*

## Rule 1: The OBI Chorus Funnel (Mandatory Structure)
- Every sovereign track MUST feature an explicit, unambiguous \`[Chorus]\` tag.
- The chorus serves as the emotional, theological, and melodic center of gravity.
- Verses establish honest blue-collar struggle; the chorus opens into sovereign worship.
- **Trigger**: Detected by presence of \`[Chorus]\`.

## Rule 2: The Throne Room Pivot (Mandatory by Bridge)
- No song remains indefinitely in grief, desolation, or human limitation.
- By the bridge, there MUST be an intentional theological pivot into the Throne Room of God (\`[Bridge]\\n[The Throne Room Pivot]\`).
- Acknowledge the broken gravel road, but turn eyes to the King of Kings.
- **Trigger**: Scans for keywords \`throne room\`, \`pivot\`, or tag \`[The Throne Room Pivot]\`.

## Rule 3: Christianese Filter & Blue-Collar Reality
- Strip out tired, plastic church jargon.
- Replace generic "Christianese" clichés with 5:00 AM truck-cab honesty, grease on hands, and scriptural grit.
- **Blacklisted Clichés**:
  - \`blessed and highly favored\`
  - \`fellowship\`
  - \`anointing fall\`
  - \`walk in victory\`
  - \`financial breakthrough\`
- **Preferred Blue-Collar Vocab**:
  - Cold rain on windshield, heavy timber, broken bread, blood on the altar, calloused knees, mercy before sunrise.

## Rule 4: The 3:1 Sonic Scar Ratio
- Enforce three organic/analog human textures (acoustic resonator guitar, rough baritone vocal, wooden kick/snare) to one synthetic element.
- Reject heavy digital autotune; preserve vocal grain and honest rasp.

## Rule 5: Christocentric Theological Depth
- Focus on God's sovereignty, redemptive grace, and covenant faithfulness.
- Eliminate self-help theological moralism; exult Christ alone.
`;

export const INITIAL_SOP_RULES: SOPRulesPackage = {
  version: 'v1.9',
  updatedAt: '2026-09-24',
  rawMarkdown: CANONICAL_SOP_MARKDOWN,
  cliches: [
    'blessed and highly favored',
    'fellowship',
    'anointing fall',
    'walk in victory',
    'financial breakthrough'
  ],
  requiredTags: ['[Chorus]'],
  throneRoomTriggers: ['throne room', 'pivot'],
  sonicScarRatio: '3:1',
  rules: [
    {
      id: 'obi-chorus',
      name: 'OBI Chorus Funnel',
      description: 'Requires explicit [Chorus] tag as theological anchor.',
      triggerType: 'required_tag',
      tags: ['[Chorus]'],
      severity: 'error',
      enabled: true
    },
    {
      id: 'throne-room-pivot',
      name: 'Throne Room Pivot',
      description: 'Mandatory theological shift by bridge to the throne room.',
      triggerType: 'contains_any',
      tags: ['throne room', 'pivot', '[the throne room pivot]'],
      severity: 'warning',
      enabled: true
    },
    {
      id: 'christianese-filter',
      name: 'Christianese Filter',
      description: 'Blacklist of plastic jargon; demands blue-collar truck cab reality.',
      triggerType: 'forbidden_phrase',
      bannedPhrases: [
        'blessed and highly favored',
        'fellowship',
        'anointing fall',
        'walk in victory',
        'financial breakthrough'
      ],
      severity: 'error',
      enabled: true
    },
    {
      id: 'sonic-scar',
      name: '3:1 Sonic Scar Ratio',
      description: '3 organic elements to 1 processed/synthetic element.',
      triggerType: 'ratio',
      severity: 'info',
      enabled: true
    }
  ]
};
