# AI Limit Tracker — Chrome Extension

Monitor message limits, reset timers, and usage across all major AI platforms.

## Platforms Tracked
- Claude (Anthropic)
- ChatGPT (OpenAI)
- Gemini (Google)
- Copilot (Microsoft)
- Grok (xAI)
- Perplexity
- Meta AI
- Mistral
- DeepSeek
- Llama (Meta)
- You.com
- Pi (Inflection)

## Install in Chrome

1. Open Chrome and go to: `chrome://extensions`
2. Enable **Developer mode** (toggle in top-right corner)
3. Click **"Load unpacked"**
4. Select this entire `ai-limit-tracker` folder
5. The extension icon appears in your toolbar — pin it for easy access

## Install in Edge / Brave / Opera (Chromium-based)

Same steps — go to `edge://extensions` or `brave://extensions`, enable Developer mode, Load unpacked.

## How to use

- Click the extension icon to open the popup tracker
- Each AI platform shows usage %, messages used/left, and time until reset
- Use **"+ log msg"** to manually count a message
- Click **✎ edit** to update your plan, limits, or usage for any platform
- The content script auto-detects message counts on supported AI websites
- Click **"Open full dashboard"** for the expanded view
- **Export JSON** to save your usage data

## Auto-detection

The content script (`content.js`) runs on each AI website and tries to read usage counts automatically by scanning the page. Because AI sites update their UI frequently, manual logging is the most reliable method.

## Reset Timers

Limits reset automatically when the countdown hits zero — no action needed.

## Permissions used

- `storage` — saves your usage data locally
- `alarms` — 1-minute tick for countdown timers
- `notifications` — alerts when limits are near
- `tabs` / `scripting` — opens the full dashboard tab
- Host permissions — allows the content script to read AI website pages

---
Made with the AI Limit Tracker builder.
