# Implementation Plan: BrickOS v10 SOP Integration & Studio Co-Producer AI Overhaul

Integrate the official **BrickOS v10: Official Music Production SOP** directly into the Studio Co-Producer AI (Gemini Copilot), set **`gemini-3.1-pro-preview`** as the default reasoning engine for high-density lyrical and arrangement tasks, eliminate unwanted religious clichés by strictly enforcing the "Christianese Filter" (Conversational Poetics), provide a custom Gem prompt editor so users can view and edit their prompt instructions at any time, and enhance execution reliability with an elapsed-time indicator and cancel/retry support.

---

## 1. User Feedback & Problem Diagnosis

1. **Default Model Upgrade**: The user requested that the default model for Co-Producer be upgraded to **`gemini-3.1-pro-preview`** because of the heavy volume of content, lyrical reasoning, multi-block Suno prompt architecture, and detailed poetic imagery.
2. **Unwanted Religious Tropes**: The previous hardcoded system prompt in the codebase called the assistant a "Theological & Lyrical Assistant" and crudely forced theological phrasing, leading Gemini to rewrite lyrics with generic praise clichés and religious buzzwords.
3. **User's Canonical Gem**: The user provided the complete official **BrickOS v10: Official Music Production SOP**, which specifically commands:
   * **The 'Christianese' Filter**: *"Replace religious clichés with 'Conversational Poetics'. Write like real people talk about authentic struggles, redemption, and faith journeys."*
   * Strict adherence to the OBI Funnel, Throne Room Pivot, 3:1 Sonic Scar Rule, 4-Block Suno Output Structure, and brick Master Vocal Roster.
4. **Execution Delay on TRK-29**: The user noted that requests on TRK-29 take 60+ seconds and previously gave the impression of getting stuck due to lack of an elapsed timer or progress indicator.
5. **Custom Prompt/Gem Access**: Users need to see, edit, and paste their custom Gem instructions directly inside the app, with persistent storage.

---

## 2. Proposed Changes

### A. Default Model Configuration
- **Set `gemini-3.1-pro-preview` as Default Engine**:
  - Update `chatModel` initial state to default to `'gemini-3.1-pro-preview'` in `src/brickos_music_studio_ai_production_workspace.tsx`, `src/components/StudioCopilotTab.tsx`, and `src/components/StudioCopilotDrawer.tsx`.
  - Update server default to `'gemini-3.1-pro-preview'` with automatic fallback to `'gemini-3.8-flash'` if needed.

### B. System Instruction & Prompt Modernization
- **Embed BrickOS v10 SOP as Default**:
  - Create `src/data/canonicalCoProducerSOP.ts` exporting the exact, verbatim BrickOS v10 SOP markdown provided by the user.
  - Set this as the default system prompt for the Studio Co-Producer AI across the application.
- **Eliminate Clichés & Reframe Role**:
  - Rename the role from "Lyric & Theological Assistant" to **"Elite Nashville Producer & Songwriting Mentor (brickOS v10)"**.
  - Pass the complete BrickOS v10 SOP with the current track metadata (Title, Genre, BPM, Key, Thesis, EP Mission Suite, Lyrics) to `/api/gemini/chat`.

### C. In-App Gem Instructions & Prompt Editor
- **Custom Gem Prompt Editor Modal**:
  - Create `src/components/CoProducerPromptEditorModal.tsx`.
  - Allows songwriters to:
    1. View the full active BrickOS v10 SOP.
    2. Edit or paste their own custom Gem instructions at any time.
    3. Reset to the official BrickOS v10 default with one click.
    4. Save to `localStorage` (`brickos_coproducer_custom_sop`) so custom Gem instructions persist across browser sessions.
  - Add an accessible **"Gem Instructions & SOP"** button to `StudioCopilotTab` and `StudioCopilotDrawer` headers.

### D. Co-Producer Robustness & Elapsed-Time Progress (TRK-29 Fix)
- **Elapsed Generation Timer**:
  - Add a live timer to the chat thinking state (`"Co-Producer reasoning with gemini-3.1-pro-preview... (XXs elapsed)"`).
  - Add a helpful notice when duration exceeds 30s (`"Deep reasoning and multi-block song arrangements can take 45–90 seconds. Still processing..."`).
- **Abort & Cancel Control**:
  - Introduce an `AbortController` in `handleSendMessage`.
  - Display a red **"Cancel"** button during generation so users can abort if they wish to adjust their prompt without freezing the interface.
- **History Sanitization**:
  - Filter out error and notice banners (`⚠️ Gemini Response Notice`) before submitting conversation turns to `/api/gemini/chat` to prevent malformed multi-turn payload errors.

### E. Server Endpoint & Timeout Optimization
- In `server.ts`:
  - Enhance `/api/gemini/chat` to gracefully accept custom system instructions without fallback to generic theological text.
  - Prioritize `gemini-3.1-pro-preview` as the preferred model candidate when requested.

---

## 3. Verification Plan

### Automated Verification
- Run `compile_applet` to verify TypeScript compilation and zero build regressions.
- Verify clean imports and types across `src/data/canonicalCoProducerSOP.ts`, `src/components/CoProducerPromptEditorModal.tsx`, `StudioCopilotTab.tsx`, and `StudioCopilotDrawer.tsx`.

### Manual / Functional Verification
1. **Model Default**: Verify that upon loading, the Co-Producer model dropdown defaults to `gemini-3.1-pro-preview (Deep Reasoning)`.
2. **Gem Instructions Editor**: Click "Gem Instructions & SOP" in the Co-Producer header; verify modal opens with BrickOS v10 SOP preloaded; edit and save; verify persistence in localStorage.
3. **Anti-Cliché Chat Generation**: Send a prompt asking for lyrics/song coaching; verify response strictly follows Conversational Poetics and Nashville songwriting standards with zero generic Christianese clichés.
4. **Timer & Cancel Handling**: Send a multi-turn prompt on TRK-29; observe elapsed seconds ticking smoothly; test the Cancel button to verify clean abort without UI freeze.
