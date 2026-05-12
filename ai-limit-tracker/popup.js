/**
 * AI Limit Tracker
 * Built with ❤️ by Jojin
 * 2026
 */
let allAIs = [];
let currentFilter = "all";
let editIdx = null;

function pct(used, limit) {
  if (limit === 999) return 0;
  return Math.min(100, Math.round((used / limit) * 100));
}
function statusClass(p) {
  if (p >= 95) return "danger";
  if (p >= 80) return "warn";
  return "ok";
}
function barColor(p) {
  if (p >= 95) return "var(--danger)";
  if (p >= 80) return "var(--warn)";
  return "var(--primary)";
}
function fmtReset(mins, win) {
  if (!win || win === "Unlimited") return "∞";
  if (!mins || mins <= 0) return "Resetting…";
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60), m = mins % 60;
  return `${h}h${m ? ` ${m}m` : ""}`;
}
function isPaid(ai) {
  return !["Free", "free"].includes(ai.plan);
}

function filteredAIs() {
  if (currentFilter === "all") return allAIs;
  if (currentFilter === "danger") return allAIs.filter(a => pct(a.used, a.limit) >= 95);
  if (currentFilter === "warn") return allAIs.filter(a => { const p = pct(a.used, a.limit); return p >= 80 && p < 95; });
  if (currentFilter === "ok") return allAIs.filter(a => pct(a.used, a.limit) < 80);
  if (currentFilter === "free") return allAIs.filter(a => !isPaid(a));
  if (currentFilter === "paid") return allAIs.filter(a => isPaid(a));
  return allAIs;
}

function renderSummary() {
  const summaryEl = document.getElementById("summary");
  if (!summaryEl) return;
  
  const total = allAIs.length;
  const avgP = allAIs.length ? Math.round(allAIs.reduce((s, a) => s + pct(a.used, a.limit), 0) / total) : 0;
  const critical = allAIs.filter(a => pct(a.used, a.limit) >= 95).length;
  const warn = allAIs.filter(a => { const p = pct(a.used, a.limit); return p >= 80 && p < 95; }).length;
  const healthy = allAIs.filter(a => pct(a.used, a.limit) < 80).length;
  summaryEl.innerHTML = `
    <div class="sum-cell"><div class="sum-label">Platforms</div><div class="sum-val">${total}</div></div>
    <div class="sum-cell"><div class="sum-label">Avg usage</div><div class="sum-val ${statusClass(avgP)}">${avgP}%</div></div>
    <div class="sum-cell"><div class="sum-label">Critical</div><div class="sum-val ${critical > 0 ? "danger" : "ok"}">${critical}</div></div>
    <div class="sum-cell"><div class="sum-label">Healthy</div><div class="sum-val ok">${healthy}</div></div>
  `;
}

function renderCards() {
  const list = filteredAIs();
  const container = document.getElementById("cards");
  if (!container) return;
  if (!list.length) {
    container.innerHTML = `<div class="empty">No platforms match this filter.</div>`;
    return;
  }
  container.innerHTML = list.map(ai => {
    const idx = allAIs.indexOf(ai);
    const p = pct(ai.used, ai.limit);
    const sc = statusClass(p);
    const left = ai.limit === 999 ? "∞" : ai.limit - ai.used;
    return `<div class="card ${sc}-card">
      <div class="card-top">
        <div class="ai-row">
          <div class="logo-pill" style="background:${ai.logoBg};color:${ai.logoTxt}">${ai.name.slice(0,1)}</div>
          <div>
            <div class="ai-name">${ai.name}</div>
            <div class="ai-sub">${ai.company} · ${ai.plan}</div>
          </div>
        </div>
        <div class="card-right">
          <div class="pct ${sc}">${ai.limit === 999 ? "∞" : p + "%"}</div>
        </div>
      </div>
      <div class="bar-track"><div class="bar-fill" style="width:${ai.limit === 999 ? 5 : p}%;background:${barColor(p)}"></div></div>
      <div class="meta">
        <div class="chip"><div class="chip-label">Used</div><div class="chip-val">${ai.used}</div></div>
        <div class="chip"><div class="chip-label">Left</div><div class="chip-val">${left}</div></div>
        <div class="chip"><div class="chip-label">Limit</div><div class="chip-val">${ai.limit === 999 ? "∞" : ai.limit}</div></div>
        <div class="chip"><div class="chip-label">Reset</div><div class="chip-val" style="font-size:10px">${fmtReset(ai.resetIn, ai.window)}</div></div>
      </div>
      <div class="reset-row">
        <span>Window: ${ai.window}</span>
        <span>
          <button class="log-btn" data-idx="${idx}">+ log msg</button>
          &nbsp;
          <button class="edit-btn-sm" data-edit="${idx}">✎ edit</button>
        </span>
      </div>
    </div>`;
  }).join("");

  container.querySelectorAll(".log-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.dataset.idx);
      if (allAIs[idx].used < allAIs[idx].limit || allAIs[idx].limit === 999) {
        allAIs[idx].used++;
        saveAndRender();
      }
    });
  });

  container.querySelectorAll(".edit-btn-sm").forEach(btn => {
    btn.addEventListener("click", () => openEdit(parseInt(btn.dataset.edit)));
  });
}

function render() {
  renderSummary();
  renderCards();
}

function saveAndRender() {
  chrome.storage.local.set({ ais: allAIs }, render);
}

function openEdit(idx) {
  editIdx = idx;
  const ai = allAIs[idx];
  const titleEl = document.getElementById("ep-title");
  if (titleEl) titleEl.textContent = "Edit — " + ai.name;
  
  const planEl = document.getElementById("ep-plan");
  if (planEl) planEl.value = ai.plan;
  
  const limitEl = document.getElementById("ep-limit");
  if (limitEl) limitEl.value = ai.limit === 999 ? "" : ai.limit;
  
  const usedEl = document.getElementById("ep-used");
  if (usedEl) usedEl.value = ai.used;
  
  const windowEl = document.getElementById("ep-window");
  if (windowEl) windowEl.value = ai.window;
  
  const panelEl = document.getElementById("edit-panel");
  if (panelEl) panelEl.classList.add("open");
}

function setupListeners() {
  const epCancel = document.getElementById("ep-cancel");
  if (epCancel) {
    epCancel.addEventListener("click", () => {
      const panel = document.getElementById("edit-panel");
      if (panel) panel.classList.remove("open");
      editIdx = null;
    });
  }

  const epSave = document.getElementById("ep-save");
  if (epSave) {
    epSave.addEventListener("click", () => {
      if (editIdx === null) return;
      const ai = allAIs[editIdx];
      
      const planEl = document.getElementById("ep-plan");
      const limitEl = document.getElementById("ep-limit");
      const usedEl = document.getElementById("ep-used");
      const windowEl = document.getElementById("ep-window");

      if (planEl) ai.plan = planEl.value || ai.plan;
      if (limitEl) {
        const lv = limitEl.value;
        ai.limit = (!lv || lv === "") ? 999 : Math.max(1, parseInt(lv));
      }
      if (usedEl) ai.used = Math.max(0, parseInt(usedEl.value) || 0);
      if (windowEl) ai.window = windowEl.value;

      const panel = document.getElementById("edit-panel");
      if (panel) panel.classList.remove("open");
      editIdx = null;
      saveAndRender();
    });
  }

  const refreshBtn = document.getElementById("refresh-btn");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", () => {
      chrome.storage.local.get("ais", ({ ais }) => {
        if (ais) { allAIs = ais; render(); }
      });
    });
  }

  const resetAllBtn = document.getElementById("reset-all-btn");
  if (resetAllBtn) {
    resetAllBtn.addEventListener("click", () => {
      if (confirm("Reset all usage counters?")) {
        allAIs = allAIs.map(ai => ({ ...ai, used: 0, resetIn: ai.resetMins }));
        saveAndRender();
      }
    });
  }

  const openFullBtn = document.getElementById("open-full-btn");
  if (openFullBtn) {
    // If we are already on dashboard.html, hide the button
    if (window.location.pathname.includes("dashboard.html")) {
      openFullBtn.style.display = "none";
    } else {
      openFullBtn.addEventListener("click", () => {
        chrome.tabs.create({ url: chrome.runtime.getURL("dashboard.html") });
      });
    }
  }

  if (document.getElementById("export-btn")) {
    document.getElementById("export-btn").addEventListener("click", () => {
      const blob = new Blob([JSON.stringify(allAIs, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ai-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
    });
  }

  if (document.getElementById("import-btn")) {
    document.getElementById("import-btn").addEventListener("click", () => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".json";
      input.onchange = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const data = JSON.parse(event.target.result);
            if (Array.isArray(data) && data.length > 0 && data[0].name) {
              allAIs = data;
              chrome.storage.local.set({ ais: allAIs }, () => {
                alert("Data imported successfully!");
                render();
              });
            } else {
              throw new Error("Invalid format");
            }
          } catch (err) {
            alert("Error: Invalid backup file.");
          }
        };
        reader.readAsText(file);
      };
      input.click();
    });
  }

  const filterBar = document.getElementById("filter-bar");
  if (filterBar) {
    filterBar.addEventListener("click", e => {
      const btn = e.target.closest(".fbtn");
      if (!btn) return;
      currentFilter = btn.dataset.filter;
      document.querySelectorAll(".fbtn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      renderCards();
    });
  }

  // Handle toggle switches in dashboard.html (via event delegation)
  document.addEventListener("click", (e) => {
    const toggle = e.target.closest(".toggle");
    if (toggle) {
      toggle.classList.toggle("on");
      toggle.classList.toggle("off");
    }
  });
}

// Initial load
chrome.storage.local.get("ais", ({ ais }) => {
  if (ais) { allAIs = ais; render(); }
});

chrome.storage.onChanged.addListener((changes) => {
  if (changes.ais) { allAIs = changes.ais.newValue; render(); }
});

// Call setup
setupListeners();
