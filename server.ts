import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, GenerateVideosOperation } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '60mb' }));
app.use(express.urlencoded({ extended: true, limit: '60mb' }));

// Lazy GoogleGenAI client accessor
function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not configured');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function stripBase64Header(dataStr: string): { cleanData: string; mimeType: string } {
  const matches = dataStr.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
  if (matches) {
    return { mimeType: matches[1], cleanData: matches[2] };
  }
  return { mimeType: 'image/png', cleanData: dataStr };
}

// 1. Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: !!process.env.GEMINI_API_KEY,
    time: new Date().toISOString(),
    engine: 'brickOS v5.5 Audio & Video Core',
  });
});

// 2. Search Grounding using gemini-3.5-flash with googleSearch tool
app.post('/api/gemini/search', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }
    const ai = getGenAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `You are an elite music industry research consultant grounded in current Billboard Christian/Gospel chart trends, Nashville Christian audio production benchmarks, and theological scripture reference indexing.\n\nQuery: ${query}`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || '';
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata || null;
    const sources: Array<{ title: string; url: string }> = [];

    if (groundingMetadata?.groundingChunks) {
      for (const chunk of groundingMetadata.groundingChunks) {
        if (chunk.web?.uri && chunk.web?.title) {
          sources.push({
            title: chunk.web.title,
            url: chunk.web.uri,
          });
        }
      }
    }

    res.json({
      answer: text,
      sources,
      searchQueries: groundingMetadata?.webSearchQueries || [],
    });
  } catch (err: any) {
    console.error('Search grounding error:', err);
    res.status(500).json({ error: err.message || 'Search grounding failed' });
  }
});

// 3. Lyrical & Theological Audit Engine (gemini-3.1-pro-preview / gemini-3.5-flash)
app.post('/api/gemini/audit-lyric', async (req, res) => {
  try {
    const { lyrics, title, genre, ep, bpm, thesis, vocal, model = 'gemini-3.1-pro-preview' } = req.body;
    const ai = getGenAI();

    const systemPrompt = `You are the Lead Theological & Lyrical Supervisor for brickOS Sovereign Records.
Your mandate is to strictly audit songs against the 5 Non-Negotiable Guardrails:
1. The OBI Funnel: Every line must drive toward the chorus payoff; ruthlessly flag wandering thoughts.
2. The 'Christianese' Filter: Replace tired religious clichés and generic praise phrases with raw, conversational poetics grounded in real, everyday faith journeys.
3. The Throne Room Pivot: Ensure the song structure pivots from a horizontal focus (human struggle, anxiety, sweat, testimony) to a vertical focus (Creator, Mind of Christ) by the bridge. If it sounds like a TED talk, it fails!
4. The 'Sonic Scar' Rule: Maintain a 3:1 (Perfect:Imperfect) balance; allow vulnerable flaws and authentic testimony over sterile digital perfection.
5. The 60-Second Hook Standalone Test: Is there a standalone 30–60s chorus or bridge that works as a high-impact devotional refrain for short-form audio (TikTok/Reels morning hour 6AM–9AM)?

Track Context:
Title: ${title}
EP Suite: ${ep}
Genre: ${genre} (${bpm} BPM)
Vocal Archetype: ${vocal}
Thesis: ${thesis}

Audit the provided lyrics thoroughly. Format your response with clear, actionable sections:
- Overall Verdict & Score (0-100)
- OBI Funnel & Cohesion Check
- 'Christianese' Filter Violations & Fresh Poetic Alternatives
- Throne Room Pivot Audit (Bridge check)
- 60-Second Standalone Hook Assessment
- Ready-to-use Rewrite Suggestions for weak sections.`;

    let responseText = '';
    try {
      const response = await ai.models.generateContent({
        model: model,
        contents: `${systemPrompt}\n\nLYRICS TO AUDIT:\n${lyrics}`,
      });
      responseText = response.text || '';
    } catch (primaryErr) {
      console.warn(`Model ${model} failed, falling back to gemini-3.5-flash:`, primaryErr);
      const fallbackResponse = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: `${systemPrompt}\n\nLYRICS TO AUDIT:\n${lyrics}`,
      });
      responseText = fallbackResponse.text || '';
    }

    res.json({ audit: responseText });
  } catch (err: any) {
    console.error('Lyric audit error:', err);
    res.status(500).json({ error: err.message || 'Lyric audit failed' });
  }
});

// 3b. Automated Lyric Rewrite Engine incorporating approved audit feedback
app.post('/api/gemini/rewrite-lyrics', async (req, res) => {
  try {
    const { lyrics, auditFeedback, title, genre, ep, bpm, thesis, vocal, model = 'gemini-3.1-pro-preview' } = req.body;
    if (!lyrics) {
      return res.status(400).json({ error: 'Original lyrics are required' });
    }
    if (!auditFeedback) {
      return res.status(400).json({ error: 'Audit feedback is required to perform guided rewrite' });
    }

    const ai = getGenAI();
    const systemPrompt = `You are the Lead Master Lyricist & Theological Supervisor for brickOS Sovereign Records.
Your mandate is to rewrite and elevate the provided song lyrics strictly incorporating the approved critique and audit directives.

Strict Guardrails to Enforce:
1. Preserve the artist's raw authenticity, vocal persona (${vocal || 'Primary Vocal'}), and blue-collar storytelling while eliminating flagged religious cliches.
2. Sharpen the OBI funnel so every stanza drives directly toward the chorus payoff.
3. Ensure the Throne Room Pivot in the bridge clearly pivots vertically from human struggle to the Creator's sovereignty.
4. Maintain proper Suno structural meta-tags: [Verse 1], [Chorus], [Verse 2], [Bridge], [The Throne Room Pivot], [Outro], etc.
5. Output ONLY the complete, ready-to-sing rewritten lyrics with structural tags. Do not wrap in conversational preamble or extra explanations.`;

    const prompt = `${systemPrompt}

Track Context:
Title: ${title || 'Untitled Track'}
EP Suite: ${ep || 'Sovereign Release'}
Genre: ${genre || 'Christian Hip Hop / Worship'} (${bpm || 96} BPM)
Vocal Archetype: ${vocal || 'The Architect'}
Theological Thesis: ${thesis || 'Brokenness Redeemed In Christ'}

APPROVED AUDIT FEEDBACK & REVISION DIRECTIVES:
${auditFeedback}

ORIGINAL LYRICS:
${lyrics}

Output the full rewritten lyrics now:`;

    let responseText = '';
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
      });
      responseText = response.text || '';
    } catch (primaryErr) {
      console.warn(`Rewrite with ${model} failed, falling back to gemini-3.5-flash:`, primaryErr);
      const fallback = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
      });
      responseText = fallback.text || '';
    }

    // Strip any markdown code blocks if the model wrapped output
    responseText = responseText.replace(/^```[a-zA-Z]*\n/, '').replace(/\n```$/, '').trim();

    res.json({ rewrittenLyrics: responseText });
  } catch (err: any) {
    console.error('Lyric rewrite error:', err);
    res.status(500).json({ error: err.message || 'Lyric rewrite failed' });
  }
});

// 3c. 3-Way Song Version Comparative Audit Engine
app.post('/api/gemini/compare-versions', async (req, res) => {
  try {
    const { title, ep, genre, vocal, thesis, bpm, versions, model = 'gemini-3.1-pro-preview' } = req.body;
    if (!versions || !Array.isArray(versions) || versions.length < 2) {
      return res.status(400).json({ error: 'At least 2 versions are required for comparative audit' });
    }

    const ai = getGenAI();
    const systemPrompt = `You are the Executive Theological Producer and Nashville A&R Director for brickOS Sovereign Records.
Your mandate is to perform a rigorous 3-way comparative audit across multiple song versions (e.g. initial draft vs rewrite vs master).

Evaluation Framework:
1. THEOLOGICAL PROGRESSION: Did subsequent rewrites deepen biblical resonance, or did they accidentally dilute the theological thesis into generic praise cliches?
2. THE 'CHRISTIANESE' FILTER: Compare how colloquial, blue-collar authenticity and concrete imagery evolved vs tired religious jargon.
3. THE THRONE ROOM PIVOT: Inspect the Bridge across all versions. Does it execute a clear horizontal-to-vertical shift into worship by the bridge?
4. CADENCE & VOCAL PRIMACY: Evaluate rhythm, syllable count, and Suno arrangement bracket tags ([Verse], [Chorus], [Build], [Drop]).
5. GOLDEN MASTER SYNTHESIS: Propose the ideal hybrid combination of the strongest stanzas across all versions.

Format your output with clear markdown headings:
- ### 🏆 Comparative Verdict & Version Ranking
- ### 📜 Version Evolution & Line-by-Line Changes
- ### 🛡️ Theological & Christianese Audit
- ### 👑 Throne Room Pivot Audit (Bridge)
- ### ⚡ Golden Master Synthesis (Recommended Combined Lyrics)`;

    const versionBlocks = versions
      .map((v: any, idx: number) => `--- VERSION ${idx + 1}: ${v.versionTag || `v${idx + 1}`} (Updated: ${v.updatedAt || 'N/A'}) ---\n${v.content}`)
      .join('\n\n');

    const prompt = `${systemPrompt}

TRACK CONTEXT:
Title: ${title || 'Active Track'}
EP Suite: ${ep || 'Sovereign Records'}
Genre: ${genre || 'Christian Hip Hop / Modern Worship'} (${bpm || 96} BPM)
Vocal Archetype: ${vocal || 'Primary Vocal'}
Thesis: ${thesis || 'Brokenness Redeemed In Christ'}

VERSIONS SUBMITTED FOR AUDIT:
${versionBlocks}

Deliver your comprehensive comparative audit now:`;

    let responseText = '';
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
      });
      responseText = response.text || '';
    } catch (primaryErr) {
      console.warn(`Version compare with ${model} failed, falling back to gemini-3.5-flash:`, primaryErr);
      const fallback = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
      });
      responseText = fallback.text || '';
    }

    res.json({ audit: responseText });
  } catch (err: any) {
    console.error('Version compare error:', err);
    res.status(500).json({ error: err.message || 'Version comparison failed' });
  }
});

// 4. Multi-Turn Gemini Chatbot (with custom roles)
app.post('/api/gemini/chat', async (req, res) => {
  try {
    const { messages, systemInstruction, model = 'gemini-3.5-flash' } = req.body;
    const ai = getGenAI();

    // Map conversation messages to GenAI format
    const contents = (messages || []).map((m: { role: string; content: string }) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    let responseText = '';
    try {
      const response = await ai.models.generateContent({
        model: model,
        contents,
        config: {
          systemInstruction: systemInstruction || 'You are an elite music producer and theologian inside brickOS Studio.',
        },
      });
      responseText = response.text || '';
    } catch (primaryErr) {
      console.warn(`Chat model ${model} failed, falling back to gemini-3.5-flash:`, primaryErr);
      const fallbackResponse = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents,
        config: {
          systemInstruction: systemInstruction || 'You are an elite music producer and theologian inside brickOS Studio.',
        },
      });
      responseText = fallbackResponse.text || '';
    }

    res.json({ reply: responseText });
  } catch (err: any) {
    console.error('Chat error:', err);
    res.status(500).json({ error: err.message || 'Chat generation failed' });
  }
});

// 5. Create & Edit Images with aspect ratio control (gemini-3.1-flash-image-preview)
app.post('/api/gemini/generate-image', async (req, res) => {
  try {
    const { prompt, aspectRatio = '1:1', mode = 'create', base64Image, mimeType = 'image/png', model = 'gemini-3.1-flash-image-preview' } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }
    const ai = getGenAI();

    // Supported aspect ratios
    const validAspectRatios = ['1:1', '2:3', '3:2', '3:4', '4:3', '9:16', '16:9', '21:9', '1:4', '1:8', '4:1', '8:1'];
    const chosenAspect = validAspectRatios.includes(aspectRatio) ? aspectRatio : '1:1';

    let parts: any[] = [];
    if (mode === 'edit' && base64Image) {
      const { cleanData, mimeType: parsedMime } = stripBase64Header(base64Image);
      parts = [
        {
          inlineData: {
            data: cleanData,
            mimeType: mimeType || parsedMime || 'image/png',
          },
        },
        { text: prompt },
      ];
    } else {
      parts = [{ text: prompt }];
    }

    // Try requested model first, with fallbacks if needed
    const modelCandidates = [model, 'gemini-3.1-flash-image', 'gemini-3.1-flash-lite-image'];
    let lastError: any = null;
    let imageBase64: string | null = null;
    let outputMimeType = 'image/png';
    let textDescription = '';

    for (const candidate of modelCandidates) {
      try {
        const response = await ai.models.generateContent({
          model: candidate,
          contents: { parts },
          config: {
            imageConfig: {
              aspectRatio: chosenAspect as any,
            },
          },
        });

        const returnedParts = response.candidates?.[0]?.content?.parts || [];
        for (const part of returnedParts) {
          if (part.inlineData?.data) {
            imageBase64 = part.inlineData.data;
            outputMimeType = part.inlineData.mimeType || 'image/png';
          } else if (part.text) {
            textDescription += part.text + ' ';
          }
        }

        if (imageBase64) {
          break;
        }
      } catch (e) {
        lastError = e;
        console.warn(`Model ${candidate} failed for image generation, trying next:`, e);
      }
    }

    if (!imageBase64) {
      throw lastError || new Error('No image was returned by the model');
    }

    res.json({
      imageUrl: `data:${outputMimeType};base64,${imageBase64}`,
      text: textDescription.trim(),
      aspectRatio: chosenAspect,
    });
  } catch (err: any) {
    console.error('Image generation error:', err);
    res.status(500).json({ error: err.message || 'Image generation failed' });
  }
});

// 6. Analyze Images with Gemini Pro (gemini-3.1-pro-preview)
app.post('/api/gemini/analyze-image', async (req, res) => {
  try {
    const { base64Image, mimeType = 'image/png', prompt } = req.body;
    if (!base64Image) {
      return res.status(400).json({ error: 'base64Image is required' });
    }
    const ai = getGenAI();
    const { cleanData, mimeType: parsedMime } = stripBase64Header(base64Image);

    const userPrompt = prompt || 'Analyze this image in detail for album art, video seed frame suitability, color harmony, visual mood, theological symbolism, and short-form hook retention.';

    let responseText = '';
    const candidates = ['gemini-3.1-pro-preview', 'gemini-3.5-flash'];

    for (const model of candidates) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: {
            parts: [
              {
                inlineData: {
                  data: cleanData,
                  mimeType: mimeType || parsedMime || 'image/png',
                },
              },
              { text: userPrompt },
            ],
          },
        });
        responseText = response.text || '';
        if (responseText) break;
      } catch (err) {
        console.warn(`Model ${model} failed for image analysis:`, err);
      }
    }

    res.json({ analysis: responseText });
  } catch (err: any) {
    console.error('Image analysis error:', err);
    res.status(500).json({ error: err.message || 'Image analysis failed' });
  }
});

// 7. Veo 3 Video Generation: Generate from text or Animate Image (veo-3.1-fast-generate-preview)
app.post('/api/gemini/generate-video', async (req, res) => {
  try {
    const { prompt, aspectRatio = '16:9', base64Image, mimeType = 'image/png', resolution = '720p' } = req.body;
    const ai = getGenAI();

    const chosenAspect = (aspectRatio === '9:16' ? '9:16' : '16:9') as '16:9' | '9:16';
    const chosenRes = (resolution === '1080p' ? '1080p' : '720p') as '720p' | '1080p';

    const videoConfig: any = {
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt || 'Cinematic video shot with dramatic atmospheric lighting and subtle motion',
      config: {
        numberOfVideos: 1,
        resolution: chosenRes,
        aspectRatio: chosenAspect,
      },
    };

    if (base64Image) {
      const { cleanData, mimeType: parsedMime } = stripBase64Header(base64Image);
      videoConfig.image = {
        imageBytes: cleanData,
        mimeType: mimeType || parsedMime || 'image/png',
      };
    }

    let operation: any = null;
    try {
      operation = await ai.models.generateVideos(videoConfig);
    } catch (primaryErr: any) {
      console.warn('veo-3.1-fast-generate-preview failed, trying veo-3.1-lite-generate-preview:', primaryErr);
      videoConfig.model = 'veo-3.1-lite-generate-preview';
      operation = await ai.models.generateVideos(videoConfig);
    }

    res.json({
      operationName: operation.name,
      status: 'pending',
      modelUsed: videoConfig.model,
      aspectRatio: chosenAspect,
    });
  } catch (err: any) {
    console.error('Video generation start error:', err);
    res.status(500).json({ error: err.message || 'Video generation failed' });
  }
});

// 8. Poll Veo Video Operation
app.post('/api/gemini/video-status', async (req, res) => {
  try {
    const { operationName } = req.body;
    if (!operationName) {
      return res.status(400).json({ error: 'operationName is required' });
    }
    const ai = getGenAI();
    const op = new GenerateVideosOperation();
    op.name = operationName;

    const updated = await ai.operations.getVideosOperation({ operation: op });
    res.json({
      done: !!updated.done,
      error: updated.error || null,
      hasVideo: !!updated.response?.generatedVideos?.[0]?.video?.uri,
    });
  } catch (err: any) {
    console.error('Video status polling error:', err);
    res.status(500).json({ error: err.message || 'Video polling failed' });
  }
});

// 9. Download Generated Video (Server-side proxy)
app.post('/api/gemini/video-download', async (req, res) => {
  try {
    const { operationName } = req.body;
    if (!operationName) {
      return res.status(400).json({ error: 'operationName is required' });
    }
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY missing' });
    }
    const ai = getGenAI();
    const op = new GenerateVideosOperation();
    op.name = operationName;

    const updated = await ai.operations.getVideosOperation({ operation: op });
    const uri = updated.response?.generatedVideos?.[0]?.video?.uri;
    if (!uri) {
      return res.status(404).json({ error: 'Video URI not available in operation response' });
    }

    const videoRes = await fetch(uri, {
      headers: { 'x-goog-api-key': apiKey },
    });

    if (!videoRes.ok) {
      throw new Error(`Video fetch failed with status ${videoRes.status}`);
    }

    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Disposition', 'inline; filename="brickos_veo_render.mp4"');

    if (videoRes.body) {
      // @ts-ignore
      const nodeStream = (await import('stream')).Readable.fromWeb(videoRes.body as any);
      nodeStream.pipe(res);
    } else {
      const buffer = Buffer.from(await videoRes.arrayBuffer());
      res.send(buffer);
    }
  } catch (err: any) {
    console.error('Video download error:', err);
    res.status(500).json({ error: err.message || 'Video download failed' });
  }
});

// 10. Analyze Video Content (gemini-3.1-pro-preview)
app.post('/api/gemini/analyze-video', async (req, res) => {
  try {
    const { prompt, videoBase64, mimeType = 'video/mp4', contextInfo } = req.body;
    const ai = getGenAI();

    const userPrompt = prompt || `Perform a rigorous retention audit and cinematic critique on this video clip:
1. 3-Second Hook Velocity: Does it stop the scroll within 0-3 seconds?
2. Visual Chiaroscuro & Lighting: Does it match the kingdom aesthetic (weathered cedar, rusted steel, golden Kintsugi)?
3. Completion Likelihood: Estimate if it achieves the 70% threshold needed to trigger a 10s video extension.
4. Editorial Feedback: Pacing, color grading, and short-form crop safety.`;

    let parts: any[] = [];
    if (videoBase64) {
      const { cleanData, mimeType: parsedMime } = stripBase64Header(videoBase64);
      parts = [
        {
          inlineData: {
            data: cleanData,
            mimeType: mimeType || parsedMime || 'video/mp4',
          },
        },
        { text: `${userPrompt}\n\nContext:\n${contextInfo || 'brickOS sovereign music promotional asset'}` },
      ];
    } else {
      parts = [
        { text: `${userPrompt}\n\nVideo Description & Metadata:\n${contextInfo || 'Cinematic video sequence'}` },
      ];
    }

    const candidates = ['gemini-3.1-pro-preview', 'gemini-3.5-flash'];
    let responseText = '';

    for (const model of candidates) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: { parts },
        });
        responseText = response.text || '';
        if (responseText) break;
      } catch (err) {
        console.warn(`Model ${model} failed for video analysis:`, err);
      }
    }

    res.json({ analysis: responseText });
  } catch (err: any) {
    console.error('Video analysis error:', err);
    res.status(500).json({ error: err.message || 'Video analysis failed' });
  }
});

// 11. Nextcloud Live WebDAV Connection Test
app.post('/api/nextcloud/test-connection', async (req, res) => {
  const startTime = Date.now();
  try {
    const {
      serverUrl = 'https://nextcloud.moyercloud.com',
      username = 'ncted',
      password = '',
      webdavPath = '/remote.php/dav/files/ncted/Music-Production'
    } = req.body;

    const targetUrl = `${serverUrl.replace(/\/$/, '')}${webdavPath.startsWith('/') ? webdavPath : '/' + webdavPath}`;
    const headers: Record<string, string> = {
      'User-Agent': 'brickOS-Studio-Nextcloud-Bridge/5.5',
      'Depth': '0',
    };

    if (password) {
      const authString = Buffer.from(`${username}:${password}`).toString('base64');
      headers['Authorization'] = `Basic ${authString}`;
    }

    // Attempt PROPFIND first (standard WebDAV)
    let response;
    let methodUsed = 'PROPFIND';
    try {
      response = await fetch(targetUrl, {
        method: 'PROPFIND',
        headers,
      });
    } catch (methodErr) {
      // Fallback to GET/HEAD if PROPFIND blocked by edge proxy
      methodUsed = 'GET';
      response = await fetch(targetUrl, {
        method: 'GET',
        headers,
      });
    }

    const latencyMs = Date.now() - startTime;
    const isSuccess = response.status >= 200 && response.status < 300;
    const isAuthRequired = response.status === 401;

    let responseSnippet = '';
    try {
      const rawText = await response.text();
      responseSnippet = rawText.slice(0, 300);
    } catch {
      // ignore
    }

    res.json({
      success: isSuccess,
      status: response.status,
      statusText: response.statusText,
      latencyMs,
      targetUrl,
      folderPath: '/Music-Production',
      methodUsed,
      isAuthRequired,
      message: isSuccess
        ? `Successfully connected to Nextcloud WebDAV /Music-Production for ${username} (${latencyMs}ms)`
        : isAuthRequired
        ? `Authentication required (HTTP 401). Nextcloud WebDAV is live at ${targetUrl}, but requires an App Password.`
        : `Nextcloud returned HTTP ${response.status} ${response.statusText}`,
      snippet: responseSnippet,
    });
  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    console.error('Nextcloud connection test error:', err);
    res.status(500).json({
      success: false,
      status: 0,
      latencyMs,
      error: err.message || 'Failed to reach Nextcloud server',
      message: `Failed to connect to Nextcloud: ${err.message}`,
    });
  }
});

// 12. Nextcloud Live Sync Folder / Share Endpoint
app.post('/api/nextcloud/sync-folder', async (req, res) => {
  const startTime = Date.now();
  try {
    const {
      folderId = '207332',
      serverUrl = 'https://nextcloud.moyercloud.com',
      username = 'ncted',
      password = '',
      webdavPath = '/remote.php/dav/files/ncted/Music-Production',
      folderPath = '/Music-Production'
    } = req.body;

    // Check direct WebDAV directory
    const targetUrl = `${serverUrl.replace(/\/$/, '')}${webdavPath.startsWith('/') ? webdavPath : '/' + webdavPath}`;
    const headers: Record<string, string> = {
      'User-Agent': 'brickOS-Studio-Nextcloud-Bridge/5.5',
      'Depth': '1',
    };

    if (password) {
      const authString = Buffer.from(`${username}:${password}`).toString('base64');
      headers['Authorization'] = `Basic ${authString}`;
    }

    let liveItemsFound = 0;
    let liveFiles: Array<{ name: string; size: number; href: string; mimeType: string }> = [];
    let isLiveAuthenticated = false;

    try {
      const davRes = await fetch(targetUrl, {
        method: 'PROPFIND',
        headers,
      });

      if (davRes.status >= 200 && davRes.status < 300) {
        isLiveAuthenticated = true;
        const xml = await davRes.text();
        // Simple XML regex parser for WebDAV multistatus responses
        const hrefMatches = [...xml.matchAll(/<d:href>([^<]+)<\/d:href>/gi)];
        const lengthMatches = [...xml.matchAll(/<d:getcontentlength>([^<]+)<\/d:getcontentlength>/gi)];

        for (let i = 0; i < hrefMatches.length; i++) {
          const href = decodeURIComponent(hrefMatches[i][1]);
          const filename = href.split('/').filter(Boolean).pop() || '';
          // Filter out hidden files, root drive references, and the /Music-Production container folder itself
          if (
            filename &&
            !filename.startsWith('.') &&
            filename.toLowerCase() !== 'music-production' &&
            filename.toLowerCase() !== 'ncted' &&
            filename.toLowerCase() !== 'files'
          ) {
            const size = lengthMatches[i] ? parseInt(lengthMatches[i][1], 10) : 0;
            liveFiles.push({
              name: filename,
              size,
              href,
              mimeType: filename.endsWith('.wav')
                ? 'audio/wav'
                : filename.endsWith('.mp3')
                ? 'audio/mpeg'
                : filename.endsWith('.png')
                ? 'image/png'
                : filename.endsWith('.jpg') || filename.endsWith('.jpeg')
                ? 'image/jpeg'
                : filename.endsWith('.mp4')
                ? 'video/mp4'
                : 'application/octet-stream'
            });
          }
        }
        liveItemsFound = liveFiles.length;
      }
    } catch (davErr) {
      console.warn('Live WebDAV PROPFIND query failed:', davErr);
    }

    const latencyMs = Date.now() - startTime;

    res.json({
      success: true,
      folderId,
      serverUrl,
      username,
      isLiveAuthenticated,
      liveItemsFound,
      liveFiles,
      files: liveFiles,
      latencyMs,
      timestamp: new Date().toISOString(),
      message: isLiveAuthenticated
        ? `Successfully synchronized live WebDAV folder /Music-Production with ${liveItemsFound} remote files (${latencyMs}ms)`
        : `Connected to Nextcloud. Folder ${folderId} (/Music-Production) initialized. For live WebDAV file downloads, provide an App Password.`
    });
  } catch (err: any) {
    console.error('Nextcloud sync error:', err);
    res.status(500).json({ error: err.message || 'Nextcloud sync failed' });
  }
});

// 13. Nextcloud WebDAV File Upload / Backup Endpoint (PUT)
app.post('/api/nextcloud/upload-file', async (req, res) => {
  const startTime = Date.now();
  try {
    const {
      serverUrl = 'https://nextcloud.moyercloud.com',
      username = 'ncted',
      password = '',
      filePath = '/remote.php/dav/files/ncted/Music-Production/brainstorming/canvas_backup.md',
      content = '',
      contentType = 'text/markdown; charset=utf-8'
    } = req.body;

    const cleanPath = filePath.startsWith('/') ? filePath : '/' + filePath;
    const targetUrl = `${serverUrl.replace(/\/$/, '')}${cleanPath}`;

    const headers: Record<string, string> = {
      'User-Agent': 'brickOS-Studio-Nextcloud-Bridge/5.5',
      'Content-Type': contentType,
    };

    if (password) {
      const authString = Buffer.from(`${username}:${password}`).toString('base64');
      headers['Authorization'] = `Basic ${authString}`;
    }

    const response = await fetch(targetUrl, {
      method: 'PUT',
      headers,
      body: content,
    });

    const latencyMs = Date.now() - startTime;
    const isSuccess = response.status >= 200 && response.status < 300;

    res.json({
      success: isSuccess,
      status: response.status,
      statusText: response.statusText,
      targetUrl,
      filePath: cleanPath,
      latencyMs,
      message: isSuccess
        ? `Successfully saved to Nextcloud WebDAV at ${cleanPath} (${latencyMs}ms)`
        : response.status === 401
        ? `Nextcloud authentication required (HTTP 401). Please verify your Nextcloud App Password.`
        : `Nextcloud returned HTTP ${response.status}: ${response.statusText}`
    });
  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    console.error('Nextcloud upload error:', err);
    res.status(500).json({
      success: false,
      status: 0,
      latencyMs,
      error: err.message || 'Nextcloud upload failed'
    });
  }
});

// Vite middleware integration
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[brickOS Studio] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
