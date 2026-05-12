const DEFAULT_AIS = [
  { id: "claude",      name: "Claude",       company: "Anthropic",  plan: "Pro",   limit: 45,  used: 0, window: "5 hours",   resetMins: 300,  resetIn: 300,  logoBg: "#EEEDFE", logoTxt: "#534AB7"  },
  { id: "chatgpt",     name: "ChatGPT",      company: "OpenAI",     plan: "Plus",  limit: 80,  used: 0, window: "3 hours",   resetMins: 180,  resetIn: 180,  logoBg: "#E1F5EE", logoTxt: "#0F6E56"  },
  { id: "gemini",      name: "Gemini",        company: "Google",     plan: "Free",  limit: 60,  used: 0, window: "24 hours",  resetMins: 1440, resetIn: 1440, logoBg: "#E6F1FB", logoTxt: "#185FA5"  },
  { id: "copilot",     name: "Copilot",       company: "Microsoft",  plan: "Free",  limit: 30,  used: 0, window: "24 hours",  resetMins: 1440, resetIn: 1440, logoBg: "#EAF3DE", logoTxt: "#3B6D11"  },
  { id: "grok",        name: "Grok",          company: "xAI",        plan: "Free",  limit: 25,  used: 0, window: "2 hours",   resetMins: 120,  resetIn: 120,  logoBg: "#F1EFE8", logoTxt: "#5F5E5A"  },
  { id: "perplexity",  name: "Perplexity",    company: "Perplexity", plan: "Pro",   limit: 300, used: 0, window: "24 hours",  resetMins: 1440, resetIn: 1440, logoBg: "#EEEDFE", logoTxt: "#3C3489"  },
  { id: "meta",        name: "Meta AI",       company: "Meta",       plan: "Free",  limit: 50,  used: 0, window: "24 hours",  resetMins: 1440, resetIn: 1440, logoBg: "#E6F1FB", logoTxt: "#0C447C"  },
  { id: "mistral",     name: "Mistral",       company: "Mistral AI", plan: "Free",  limit: 20,  used: 0, window: "1 hour",    resetMins: 60,   resetIn: 60,   logoBg: "#FAECE7", logoTxt: "#993C1D"  },
  { id: "deepseek",    name: "DeepSeek",      company: "DeepSeek",   plan: "Free",  limit: 50,  used: 0, window: "24 hours",  resetMins: 1440, resetIn: 1440, logoBg: "#EEEDFE", logoTxt: "#26215C"  },
  { id: "you",         name: "You.com",       company: "You",        plan: "Free",  limit: 10,  used: 0, window: "24 hours",  resetMins: 1440, resetIn: 1440, logoBg: "#FBEAF0", logoTxt: "#993556"  },
  { id: "llama",       name: "Llama (Meta)",  company: "Meta",       plan: "Free",  limit: 40,  used: 0, window: "24 hours",  resetMins: 1440, resetIn: 1440, logoBg: "#E6F1FB", logoTxt: "#185FA5"  },
  { id: "pi",          name: "Pi",            company: "Inflection", plan: "Free",  limit: 999, used: 0, window: "Unlimited", resetMins: 0,    resetIn: 0,    logoBg: "#E1F5EE", logoTxt: "#085041"  }
];

chrome.runtime.onInstalled.addListener(async () => {
  const stored = await chrome.storage.local.get("ais");
  if (!stored.ais) {
    await chrome.storage.local.set({ ais: DEFAULT_AIS });
  }
  chrome.alarms.create("tick", { periodInMinutes: 1 });
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== "tick") return;
  const { ais } = await chrome.storage.local.get("ais");
  if (!ais) return;

  const updated = ais.map(ai => {
    if (ai.resetMins === 0) return ai;
    const newResetIn = Math.max(0, (ai.resetIn || 0) - 1);
    const newUsed = newResetIn === 0 ? 0 : ai.used;
    const newResetIn2 = newResetIn === 0 ? ai.resetMins : newResetIn;
    return { ...ai, resetIn: newResetIn2, used: newUsed };
  });

  await chrome.storage.local.set({ ais: updated });

  for (const ai of updated) {
    const pct = ai.limit === 999 ? 0 : Math.round((ai.used / ai.limit) * 100);
    if (pct >= 95) {
      chrome.notifications.create(`critical-${ai.id}-${Date.now()}`, {
        type: "basic",
        iconUrl: "icons/icon48.png",
        title: `${ai.name} — Limit Critical!`,
        message: `${ai.used}/${ai.limit} messages used (${pct}%). Resets in ${fmtReset(ai.resetIn)}.`
      });
    } else if (pct >= 80) {
      chrome.notifications.create(`warn-${ai.id}-${Date.now()}`, {
        type: "basic",
        iconUrl: "icons/icon48.png",
        title: `${ai.name} — Limit Warning`,
        message: `${ai.used}/${ai.limit} messages used (${pct}%).`
      });
    }
  }
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "INCREMENT_USAGE") {
    chrome.storage.local.get("ais", ({ ais }) => {
      const updated = ais.map(ai =>
        ai.id === msg.aiId ? { ...ai, used: Math.min(ai.used + 1, ai.limit) } : ai
      );
      chrome.storage.local.set({ ais: updated }, () => sendResponse({ ok: true }));
    });
    return true;
  }
  if (msg.type === "RESET_ALL") {
    chrome.storage.local.get("ais", ({ ais }) => {
      const updated = ais.map(ai => ({ ...ai, used: 0, resetIn: ai.resetMins }));
      chrome.storage.local.set({ ais: updated }, () => sendResponse({ ok: true }));
    });
    return true;
  }
  if (msg.type === "GET_DEFAULTS") {
    sendResponse({ ais: DEFAULT_AIS });
  }
});

function fmtReset(mins) {
  if (!mins || mins <= 0) return "soon";
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60), m = mins % 60;
  return `${h}h${m ? ` ${m}m` : ""}`;
}
