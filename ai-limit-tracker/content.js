(() => {
  // Dead-Man's Switch: If a new version is already running, or context is dead, stop immediately.
  if (window.__ait_tracker_active || !chrome.runtime?.id) {
    if (!chrome.runtime?.id) console.log("AI Limit Tracker: Old script stopping due to extension update. Please refresh the page.");
    return;
  }
  window.__ait_tracker_active = true;

  const host = location.hostname;

  const DETECTORS = {
    "claude.ai": detectClaude,
    "chat.openai.com": detectChatGPT,
    "chatgpt.com": detectChatGPT,
    "gemini.google.com": detectGemini,
    "copilot.microsoft.com": detectCopilot,
    "grok.x.com": detectGrok,
    "x.com": detectGrok,
    "www.perplexity.ai": detectPerplexity,
    "www.meta.ai": detectMeta,
    "chat.mistral.ai": detectMistral,
    "you.com": detectYou,
    "chat.deepseek.com": detectDeepSeek
  };

  const AI_ID_MAP = {
    "claude.ai": "claude",
    "chat.openai.com": "chatgpt",
    "chatgpt.com": "chatgpt",
    "gemini.google.com": "gemini",
    "copilot.microsoft.com": "copilot",
    "grok.x.com": "grok",
    "x.com": "grok",
    "www.perplexity.ai": "perplexity",
    "www.meta.ai": "meta",
    "chat.mistral.ai": "mistral",
    "you.com": "you",
    "chat.deepseek.com": "deepseek"
  };

  function detectClaude() {
    try {
      const limitEl = document.querySelector('[data-testid="usage-limit"]') ||
        document.querySelector('.usage-limit') ||
        [...document.querySelectorAll('span,p,div')].find(el =>
          el.textContent.match(/\d+\s*(messages?|remaining|left)/i) && el.textContent.length < 80
        );
      if (limitEl) {
        const match = limitEl.textContent.match(/(\d+)\s*(?:of\s*(\d+))?/);
        if (match) return { used: parseInt(match[1]), limit: match[2] ? parseInt(match[2]) : null };
      }
      const msgs = document.querySelectorAll('[data-testid="human-turn"], .human-turn, [class*="human"]');
      if (msgs.length > 0) return { used: msgs.length };
    } catch(e) {}
    return null;
  }

  function detectChatGPT() {
    try {
      const limitEl = document.querySelector('[class*="limit"], [class*="usage"], [class*="quota"]');
      if (limitEl) {
        const match = limitEl.textContent.match(/(\d+)\s*(?:\/|of)\s*(\d+)/);
        if (match) return { used: parseInt(match[1]), limit: parseInt(match[2]) };
      }
      const convItems = document.querySelectorAll('div[data-message-author-role="user"]');
      if (convItems.length > 0) return { used: convItems.length };
      
      const textNodes = [...document.querySelectorAll('div, span, p')].filter(el => el.children.length === 0);
      const usageText = textNodes.find(el => el.textContent.toLowerCase().includes('messages remaining') || el.textContent.toLowerCase().includes('limit'));
      if (usageText) {
        const match = usageText.textContent.match(/(\d+)/);
        if (match) return { used: parseInt(match[0]) };
      }
    } catch(e) {}
    return null;
  }

  function detectGemini() {
    const msgs = document.querySelectorAll('.user-query, [class*="user-message"], .query-content');
    return msgs.length > 0 ? { used: msgs.length } : null;
  }

  function detectCopilot() {
    const msgs = document.querySelectorAll('[class*="user"], cib-chat-turn[source="user"]');
    return msgs.length > 0 ? { used: msgs.length } : null;
  }

  function detectGrok() {
    if (!location.pathname.includes('/grok') && !location.hostname.includes('grok')) return null;
    const msgs = document.querySelectorAll('[class*="user-message"], [data-testid*="user"]');
    return msgs.length > 0 ? { used: msgs.length } : null;
  }

  function detectPerplexity() {
    const msgs = document.querySelectorAll('[class*="query"], .user-message');
    return msgs.length > 0 ? { used: msgs.length } : null;
  }

  function detectMeta() {
    const msgs = document.querySelectorAll('[class*="user"], [data-message-role="user"]');
    return msgs.length > 0 ? { used: msgs.length } : null;
  }

  function detectMistral() {
    const msgs = document.querySelectorAll('[class*="user"], [data-role="user"]');
    return msgs.length > 0 ? { used: msgs.length } : null;
  }

  function detectYou() {
    const msgs = document.querySelectorAll('[class*="question"], [class*="user-message"]');
    return msgs.length > 0 ? { used: msgs.length } : null;
  }

  function detectDeepSeek() {
    const msgs = document.querySelectorAll('[class*="human"], [class*="user-message"]');
    return msgs.length > 0 ? { used: msgs.length } : null;
  }

  function injectUI(aiData) {
    if (!aiData) return;
    try {
      let container = document.getElementById('ai-limit-tracker-root');
      if (!container) {
        container = document.createElement('div');
        container.id = 'ai-limit-tracker-root';
        let target = document.querySelector('nav') || document.querySelector('[class*="sidebar"]') || document.querySelector('[class*="side-nav"]');
        if (target) {
          target.appendChild(container);
        } else {
          container.style.cssText = 'position:fixed;bottom:20px;left:20px;z-index:9999;';
          document.body.appendChild(container);
        }
        
        const shadow = container.attachShadow({ mode: 'open' });
        shadow.innerHTML = `
          <style>
            :host { --primary: #38bdf8; --bg: #1e293b; --text: #f8fafc; --border: rgba(255,255,255,0.1); }
            .widget { background: var(--bg); border: 1px solid var(--border); border-radius: 12px; padding: 12px; margin: 10px; font-family: 'Inter', system-ui, sans-serif; color: var(--text); box-shadow: 0 4px 12px rgba(0,0,0,0.3); width: calc(100% - 20px); box-sizing: border-box; }
            .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
            .title { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #64748b; }
            .pct { font-size: 12px; font-weight: 800; color: var(--primary); }
            .bar-track { height: 6px; background: rgba(255,255,255,0.05); border-radius: 10px; overflow: hidden; margin-bottom: 8px; }
            .bar-fill { height: 100%; background: var(--primary); border-radius: 10px; transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1); }
            .footer { display: flex; justify-content: space-between; font-size: 10px; color: #94a3b8; font-weight: 600; }
            .watermark { font-size: 8px; text-align: center; margin-top: 10px; opacity: 0.3; letter-spacing: 0.1em; }
          </style>
          <div class="widget">
            <div class="header"><span class="title">AI Usage</span><span class="pct" id="pct">0%</span></div>
            <div class="bar-track"><div class="bar-fill" id="bar"></div></div>
            <div class="footer"><span id="used">0 used</span><span id="limit">Limit: ∞</span></div>
            <div class="watermark">BY JOJIN</div>
          </div>
        `;
      }

      const shadow = container.shadowRoot;
      const limit = aiData.limit || 1;
      const p = aiData.limit === 999 ? 0 : Math.min(100, Math.round((aiData.used / limit) * 100));
      const limitText = aiData.limit === 999 ? '∞' : aiData.limit;
      
      shadow.getElementById('pct').textContent = `${p}%`;
      shadow.getElementById('bar').style.width = `${p}%`;
      shadow.getElementById('used').textContent = `${aiData.used} msgs`;
      shadow.getElementById('limit').textContent = `Limit: ${limitText}`;
      
      const color = p >= 95 ? '#ef4444' : (p >= 80 ? '#f59e0b' : '#38bdf8');
      shadow.getElementById('pct').style.color = color;
      shadow.getElementById('bar').style.background = color;
    } catch (e) {}
  }

  function run() {
    try {
      if (!chrome.runtime?.id) {
        if (typeof observer !== 'undefined') observer.disconnect();
        return;
      }

      const detector = DETECTORS[host];
      const aiId = AI_ID_MAP[host];
      if (!detector || !aiId) return;

      const result = detector();
      
      chrome.storage.local.get("ais", ({ ais }) => {
        if (chrome.runtime?.lastError || !ais) return;
        let currentAI = null;
        const updated = ais.map(ai => {
          if (ai.id !== aiId) return ai;
          currentAI = { ...ai, used: result?.used !== undefined ? result.used : ai.used, ...(result?.limit ? { limit: result.limit } : {}) };
          return currentAI;
        });
        if (currentAI) {
          injectUI(currentAI);
          chrome.storage.local.set({ ais: updated });
        }
      });
    } catch (e) {
      if (typeof observer !== 'undefined') observer.disconnect();
    }
  }

  const observer = new MutationObserver(() => {
    try {
      if (!chrome.runtime?.id) { observer.disconnect(); return; }
      clearTimeout(window._aitLimitTimer);
      window._aitLimitTimer = setTimeout(run, 1000);
    } catch(e) { if(observer) observer.disconnect(); }
  });

  run();
  if (document.body) observer.observe(document.body, { childList: true, subtree: true });
})();
