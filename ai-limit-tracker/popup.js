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
  const healthy = allAIs.filter(a => pct(a.used, a.limit) < 80).length;

  summaryEl.textContent = '';
  
  const cells = [
    { label: 'Platforms', val: total, cls: '' },
    { label: 'Avg usage', val: `${avgP}%`, cls: statusClass(avgP) },
    { label: 'Critical', val: critical, cls: critical > 0 ? "danger" : "ok" },
    { label: 'Healthy', val: healthy, cls: 'ok' }
  ];

  cells.forEach(c => {
    const div = document.createElement('div');
    div.className = 'sum-cell';
    const lbl = document.createElement('div');
    lbl.className = 'sum-label';
    lbl.textContent = c.label;
    const val = document.createElement('div');
    val.className = 'sum-val ' + c.cls;
    val.textContent = c.val;
    div.appendChild(lbl);
    div.appendChild(val);
    summaryEl.appendChild(div);
  });
}

function renderCards() {
  const list = filteredAIs();
  const container = document.getElementById("cards");
  if (!container) return;
  
  container.textContent = '';
  
  if (!list.length) {
    const empty = document.createElement('div');
    empty.className = 'empty';
    empty.textContent = 'No platforms match this filter.';
    container.appendChild(empty);
    return;
  }

  list.forEach(ai => {
    const idx = allAIs.indexOf(ai);
    const p = pct(ai.used, ai.limit);
    const sc = statusClass(p);
    const left = ai.limit === 999 ? "∞" : ai.limit - ai.used;

    const card = document.createElement('div');
    card.className = `card ${sc}-card`;

    // Card Top
    const top = document.createElement('div');
    top.className = 'card-top';
    
    const aiRow = document.createElement('div');
    aiRow.className = 'ai-row';
    const pill = document.createElement('div');
    pill.className = 'logo-pill';
    pill.style.background = ai.logoBg;
    pill.style.color = ai.logoTxt;
    pill.textContent = ai.name.slice(0, 1);
    
    const nameCol = document.createElement('div');
    const nameDiv = document.createElement('div');
    nameDiv.className = 'ai-name';
    nameDiv.textContent = ai.name;
    const subDiv = document.createElement('div');
    subDiv.className = 'ai-sub';
    subDiv.textContent = `${ai.company} · ${ai.plan}`;
    nameCol.appendChild(nameDiv);
    nameCol.appendChild(subDiv);
    
    aiRow.appendChild(pill);
    aiRow.appendChild(nameCol);
    
    const cRight = document.createElement('div');
    cRight.className = 'card-right';
    const pctDiv = document.createElement('div');
    pctDiv.className = `pct ${sc}`;
    pctDiv.textContent = ai.limit === 999 ? "∞" : p + "%";
    cRight.appendChild(pctDiv);
    
    top.appendChild(aiRow);
    top.appendChild(cRight);

    // Bar
    const track = document.createElement('div');
    track.className = 'bar-track';
    const fill = document.createElement('div');
    fill.className = 'bar-fill';
    fill.style.width = `${ai.limit === 999 ? 5 : p}%`;
    fill.style.background = barColor(p);
    track.appendChild(fill);

    // Meta chips
    const meta = document.createElement('div');
    meta.className = 'meta';
    [
      { l: 'Used', v: ai.used },
      { l: 'Left', v: left },
      { l: 'Limit', v: ai.limit === 999 ? "∞" : ai.limit },
      { l: 'Reset', v: fmtReset(ai.resetIn, ai.window) }
    ].forEach(m => {
      const chip = document.createElement('div');
      chip.className = 'chip';
      const cl = document.createElement('div');
      cl.className = 'chip-label';
      cl.textContent = m.l;
      const cv = document.createElement('div');
      cv.className = 'chip-val';
      cv.textContent = m.v;
      chip.appendChild(cl);
      chip.appendChild(cv);
      meta.appendChild(chip);
    });

    // Footer
    const footer = document.createElement('div');
    footer.className = 'reset-row';
    const winSpan = document.createElement('span');
    winSpan.textContent = `Window: ${ai.window}`;
    const btnSpan = document.createElement('span');
    
    const logBtn = document.createElement('button');
    logBtn.className = 'log-btn';
    logBtn.dataset.idx = idx;
    logBtn.textContent = '+ log msg';
    
    const editBtn = document.createElement('button');
    editBtn.className = 'edit-btn-sm';
    editBtn.dataset.edit = idx;
    editBtn.textContent = '✎ edit';
    
    btnSpan.appendChild(logBtn);
    btnSpan.appendChild(document.createTextNode(' '));
    btnSpan.appendChild(editBtn);
    
    footer.appendChild(winSpan);
    footer.appendChild(btnSpan);

    card.appendChild(top);
    card.appendChild(track);
  });

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
