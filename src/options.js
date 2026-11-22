// const DEFAULTS = { enabled: true, generator: "claude-perchance", resolution: "512x512", negative: "blurry, low quality, text", hideTag: true, count: "1", debug: false };
// v0.4.0: engine settings
const DEFAULTS = { enabled: true, generator: "claude-perchance", resolution: "512x512", negative: "blurry, low quality, text", hideTag: true, count: "1", debug: false,
  engine: "perchance", pollinationsModel: "", pollinationsKey: "", hordeKey: "", hordeModels: "", fallback: true };
const $ = (id) => document.getElementById(id);
chrome.storage.sync.get(DEFAULTS, (s) => {
  for (const k in DEFAULTS) {
    if (typeof DEFAULTS[k] === "boolean") $(k).checked = s[k];
    else $(k).value = s[k];
  }
});
$("save").onclick = () => {
  const s = {};
  for (const k in DEFAULTS) s[k] = typeof DEFAULTS[k] === "boolean" ? $(k).checked : $(k).value.trim();
  s.generator = s.generator.replace(/^https?:\/\/(www\.)?perchance\.org\//, "").replace(/[^\w-]/g, "");
  $("generator").value = s.generator;
  chrome.storage.sync.set(s, () => { $("saved").textContent = "Saved"; setTimeout(() => ($("saved").textContent = ""), 1500); });
};

// v0.5.0: "Show models" asks the engine for its list (list_models) and lets a tap fill the box.
// AI Horde lists models with how many workers run each; tapping adds the name to the comma list.
document.querySelectorAll("button.models").forEach((b) => {
  b.onclick = () => {
    const engine = b.dataset.engine, into = $(b.dataset.into);
    const box = engine === "horde" ? $("hordeModelsList") : $("pollinationsModels");
    box.textContent = "Loading…";
    const settings = { pollinationsKey: $("pollinationsKey").value.trim(), hordeKey: $("hordeKey").value.trim() };
    chrome.runtime.sendMessage({ type: "claude-perchance:engine", command: "list_models", engine, settings }, (r) => {
      box.textContent = "";
      if (chrome.runtime.lastError || !r || r.error) {
        box.textContent = "Couldn't load models: " + ((r && r.error) || (chrome.runtime.lastError && chrome.runtime.lastError.message) || "no answer");
        return;
      }
      for (const m of r.models.slice(0, 60)) {
        const pick = document.createElement("button");
        pick.type = "button";
        pick.textContent = m.name + (m.count != null ? ` (${m.count} worker${m.count === 1 ? "" : "s"}${m.queued ? ", busy" : ""})` : "");
        pick.onclick = () => {
          if (engine === "horde") {
            const have = into.value.split(",").map((x) => x.trim()).filter(Boolean);
            if (!have.includes(m.name)) have.push(m.name);
            into.value = have.join(", ");
          } else into.value = m.name;
        };
        box.appendChild(pick);
      }
      if (!r.models.length) box.textContent = "No models listed right now.";
    });
  };
});
