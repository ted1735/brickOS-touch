/**
 * Automation Userscripts from brickOS-Automations
 * Ready for 1-click clipboard copy or .user.js download
 */

export const SUNO_USERSCRIPT_CODE = `// ==UserScript==
// @name         brickOS Suno 1-Click Auto-Fill Bridge (v1.0)
// @namespace    https://brickos.moyercloud.com/
// @version      1.0.0
// @description  Instantly injects Title, Lyrics, Style, and Excluded Styles from brickOS into Suno.com without manual copy-pasting.
// @author       Ted Moyer / BRICK Records
// @match        https://suno.com/*
// @match        https://*.suno.com/*
// @grant        GM_setClipboard
// @grant        GM_addStyle
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';
    console.log("[brickOS] Suno 1-Click Auto-Fill Bridge Active.");

    const customCss = \`
        #brickos-suno-hud {
            position: fixed;
            bottom: 24px;
            right: 24px;
            z-index: 999999;
            background: rgba(15, 23, 42, 0.95);
            border: 1px solid #4f46e5;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.7), 0 0 15px 0 rgba(99, 102, 241, 0.4);
            border-radius: 12px;
            padding: 10px 14px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            color: #f8fafc;
            display: flex;
            align-items: center;
            gap: 10px;
            backdrop-filter: blur(8px);
            transition: all 0.2s ease-in-out;
        }
        #brickos-suno-hud:hover {
            transform: translateY(-2px);
            box-shadow: 0 14px 28px -4px rgba(0, 0, 0, 0.8), 0 0 20px 2px rgba(99, 102, 241, 0.6);
        }
        #brickos-inject-btn {
            background: linear-gradient(135deg, #4f46e5, #7c3aed);
            color: white;
            border: none;
            padding: 6px 12px;
            font-size: 12px;
            font-weight: 700;
            border-radius: 6px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        #brickos-inject-btn:hover {
            background: linear-gradient(135deg, #4338ca, #6d28d9);
        }
        #brickos-status {
            font-size: 11px;
            color: #94a3b8;
            font-family: monospace;
        }
    \`;
    const styleEl = document.createElement('style');
    styleEl.innerHTML = customCss;
    document.head.appendChild(styleEl);

    function setReactInputValue(element, value) {
        if (!element) return;
        const proto = Object.getPrototypeOf(element);
        const nativeSetter = Object.getOwnPropertyDescriptor(proto, 'value') ||
                             Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value') ||
                             Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value');
        if (nativeSetter && nativeSetter.set) {
            nativeSetter.set.call(element, value);
        } else {
            element.value = value;
        }
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
        element.dispatchEvent(new Event('blur', { bubbles: true }));
    }

    const hud = document.createElement('div');
    hud.id = 'brickos-suno-hud';
    hud.innerHTML = \`
        <div style="width: 8px; height: 8px; border-radius: 50%; background: #10b981; box-shadow: 0 0 8px #10b981;"></div>
        <div style="display: flex; flex-direction: column;">
            <span style="font-size: 11px; font-weight: 800; color: #818cf8; letter-spacing: 0.5px;">brickOS SYNC</span>
            <span id="brickos-status">Ready</span>
        </div>
        <button id="brickos-inject-btn">
            <span>⚡ Paste from brickOS</span>
        </button>
    \`;
    document.body.appendChild(hud);

    const statusEl = document.getElementById('brickos-status');
    const injectBtn = document.getElementById('brickos-inject-btn');

    function ensureCustomModeActive() {
        const switches = Array.from(document.querySelectorAll('button[role="switch"], [aria-label*="Custom" i], button'));
        for (const el of switches) {
            if (el.textContent.includes('Custom') || el.getAttribute('aria-label')?.includes('Custom')) {
                const isChecked = el.getAttribute('aria-checked') === 'true' || el.getAttribute('data-state') === 'checked';
                if (!isChecked) {
                    el.click();
                    console.log("[brickOS] Toggled Suno Custom Mode ON.");
                }
                break;
            }
        }
    }

    function locateSunoFields() {
        const textareas = Array.from(document.querySelectorAll('textarea'));
        const lyricsField = textareas.find(ta =>
            (ta.placeholder && /lyrics|write your lyrics/i.test(ta.placeholder)) ||
            (ta.name && /prompt/i.test(ta.name))
        ) || textareas[0];

        const inputsAndTextareas = Array.from(document.querySelectorAll('input, textarea'));
        const styleField = inputsAndTextareas.find(el =>
            el.placeholder && /style of music|genres|instruments/i.test(el.placeholder)
        );

        const excludeField = inputsAndTextareas.find(el =>
            el.placeholder && /exclude|negative|avoid/i.test(el.placeholder)
        );

        const titleField = Array.from(document.querySelectorAll('input')).find(input =>
            input.placeholder && /title|song title/i.test(input.placeholder)
        );

        return { lyricsField, styleField, excludeField, titleField };
    }

    async function executeAutoFill() {
        statusEl.textContent = "Reading clipboard...";
        try {
            const clipText = await navigator.clipboard.readText();
            if (!clipText || !clipText.trim().startsWith('{')) {
                statusEl.textContent = "No JSON payload";
                alert("[brickOS] No valid brickOS payload found on clipboard. Click '⚡ 1-Click Export to Suno' in brickOS first.");
                return;
            }

            const payload = JSON.parse(clipText);
            if (payload.signature !== "brickOS-Suno-v5.5") {
                statusEl.textContent = "Invalid packet";
                alert("[brickOS] Clipboard does not contain a brickOS-Suno packet.");
                return;
            }

            ensureCustomModeActive();

            setTimeout(() => {
                const { lyricsField, styleField, excludeField, titleField } = locateSunoFields();
                let injectedCount = 0;

                if (lyricsField && payload.lyrics) {
                    setReactInputValue(lyricsField, payload.lyrics);
                    injectedCount++;
                }

                if (styleField && payload.style) {
                    setReactInputValue(styleField, payload.style);
                    injectedCount++;
                }

                if (excludeField && payload.excludedStyles) {
                    setReactInputValue(excludeField, payload.excludedStyles);
                    injectedCount++;
                }

                if (titleField && payload.title) {
                    setReactInputValue(titleField, payload.title);
                    injectedCount++;
                }

                statusEl.textContent = \\\`Injected \\\${injectedCount}/4 fields!\\\`;
                console.log("[brickOS] Successfully populated Suno fields:", payload.title);
            }, 300);

        } catch (err) {
            console.error("[brickOS] Injection error:", err);
            statusEl.textContent = "Failed";
            alert("[brickOS] Clipboard access failed. Make sure to allow clipboard permissions for Suno.");
        }
    }

    injectBtn.addEventListener('click', executeAutoFill);

    if (window.location.hash.includes('brickos_autofill')) {
        setTimeout(executeAutoFill, 1200);
    }
})();
`;

export const NIGHTCAFE_USERSCRIPT_CODE = `// ==UserScript==
// @name         brickOS NightCafe Automation Hub & Queue Runner
// @namespace    https://brickos.moyercloud.com/
// @version      1.0.0
// @description  Automated bulk queue runner for NightCafe Studio (Google Veo, Flux Dev, Kling). Injects floating execution overlay into creator.nightcafe.studio.
// @author       Ted Moyer / BRICK Records
// @match        https://creator.nightcafe.studio/*
// @match        https://*.nightcafe.studio/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';
    console.log("[brickOS] NightCafe Automation Hub Active.");

    if (document.getElementById('nc-runner-overlay')) return;

    function setNativeValue(element, value) {
        if (!element) return;
        const valueSetter = Object.getOwnPropertyDescriptor(element, 'value')?.set;
        const prototype = Object.getPrototypeOf(element);
        const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
        if (prototypeValueSetter && valueSetter !== prototypeValueSetter) {
            prototypeValueSetter.call(element, value);
        } else if (valueSetter) {
            valueSetter.call(element, value);
        } else {
            element.value = value;
        }
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
    }

    const overlay = document.createElement('div');
    overlay.id = 'nc-runner-overlay';
    overlay.style.cssText = \`
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 999999;
        background: rgba(15, 23, 42, 0.95);
        color: #f8fafc;
        border: 2px solid #2563eb;
        border-radius: 12px;
        padding: 14px 16px;
        width: 320px;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.7), 0 0 15px 0 rgba(37, 99, 235, 0.4);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 12px;
        backdrop-filter: blur(10px);
    \`;

    overlay.innerHTML = \`
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-size:14px;">⚡</span>
                <strong style="color:#60a5fa;font-size:13px;letter-spacing:0.5px;">brickOS NC Runner</strong>
            </div>
            <span id="nc-status-badge" style="background:#1e293b;color:#38bdf8;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:bold;font-family:monospace;">READY</span>
        </div>
        <div style="background:#1e293b;border-radius:6px;height:6px;overflow:hidden;margin-bottom:8px;">
            <div id="nc-progress-bar" style="background:#2563eb;width:0%;height:100%;transition:width 0.3s;"></div>
        </div>
        <div id="nc-current-title" style="font-weight:bold;margin-bottom:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#e2e8f0;">Idle</div>
        <div id="nc-log-line" style="font-size:11px;color:#94a3b8;height:32px;overflow:hidden;line-height:1.2;margin-bottom:10px;">Paste queue JSON or run from brickOS dashboard.</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">
            <button id="nc-paste-btn" style="background:#2563eb;color:#fff;border:none;padding:6px;border-radius:6px;cursor:pointer;font-weight:bold;font-size:11px;">📋 Paste Queue</button>
            <button id="nc-stop-btn" style="background:#334155;color:#fff;border:none;padding:6px;border-radius:6px;cursor:pointer;font-weight:bold;font-size:11px;">Hide</button>
        </div>
    \`;

    document.body.appendChild(overlay);

    const statusBadge = document.getElementById('nc-status-badge');
    const progressBar = document.getElementById('nc-progress-bar');
    const titleEl = document.getElementById('nc-current-title');
    const logEl = document.getElementById('nc-log-line');
    const pasteBtn = document.getElementById('nc-paste-btn');
    const stopBtn = document.getElementById('nc-stop-btn');

    let queue = [];
    let currentIndex = 0;
    let isPaused = false;
    let timerId = null;
    const INTERVAL_MS = 12000;

    stopBtn.onclick = () => {
        clearTimeout(timerId);
        overlay.style.display = 'none';
    };

    function executeNext() {
        if (currentIndex >= queue.length) {
            statusBadge.innerText = 'COMPLETE';
            statusBadge.style.background = '#166534';
            titleEl.innerText = 'All Scenes Submitted!';
            logEl.innerText = \\\`Finished queue of \\\${queue.length} prompts.\\\`;
            progressBar.style.width = '100%';
            pasteBtn.innerText = '📋 Load New';
            return;
        }

        if (isPaused) {
            timerId = setTimeout(executeNext, 1000);
            return;
        }

        const item = queue[currentIndex];
        const pct = Math.round((currentIndex / queue.length) * 100);
        
        progressBar.style.width = pct + '%';
        statusBadge.innerText = \\\`\\\${currentIndex + 1}/\\\${queue.length}\\\`;
        titleEl.innerText = \\\`\\\${item.song || 'Scene'} - \\\${item.title}\\\`;
        logEl.innerText = item.prompt;

        const textarea = document.querySelector('textarea[placeholder*="prompt" i], textarea[name="prompt" i], textarea');
        if (!textarea) {
            logEl.innerText = 'Waiting for NightCafe prompt input field...';
            timerId = setTimeout(executeNext, 3000);
            return;
        }

        textarea.focus();
        setNativeValue(textarea, item.prompt);

        setTimeout(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const createBtn = buttons.find(b => {
                const txt = b.textContent.trim().toLowerCase();
                return (txt.includes('create') || txt.includes('generate')) && !b.disabled;
            });

            if (createBtn) {
                createBtn.click();
                console.log(\\\`[brickOS NC] Queued (\\\${currentIndex + 1}/\\\${queue.length}): \\\${item.title}\\\`);
            } else {
                console.warn('[brickOS NC] Create button disabled or pending.');
            }

            currentIndex++;
            timerId = setTimeout(executeNext, INTERVAL_MS);
        }, 800);
    }

    pasteBtn.onclick = async () => {
        try {
            const clipText = await navigator.clipboard.readText();
            if (!clipText || !clipText.trim().startsWith('[')) {
                alert("[brickOS] Clipboard does not contain a JSON prompt array. Click 'Copy DevTools Console Payload' or copy queue in brickOS.");
                return;
            }
            queue = JSON.parse(clipText);
            currentIndex = 0;
            statusBadge.innerText = \\\`0/\\\${queue.length}\\\`;
            statusBadge.style.background = '#2563eb';
            titleEl.innerText = \\\`Loaded \\\${queue.length} Scenes\\\`;
            logEl.innerText = 'Starting automated dispatch loop...';
            pasteBtn.innerText = 'Running...';
            executeNext();
        } catch (err) {
            console.error(err);
            alert("[brickOS] Clipboard read failed. Please allow clipboard permissions.");
        }
    };
})();
`;
