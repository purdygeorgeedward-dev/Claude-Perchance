// const DEFAULTS = { enabled: true, generator: "claude-perchance", resolution: "512x512", negative: "blurry, low quality, text", hideTag: true, count: "1", debug: false };
// v0.4.0: engine settings
const DEFAULTS = { enabled: true, generator: "claude-perchance", resolution: "512x512", negative: "blurry, low quality, text", hideTag: true, count: "1", debug: false,
  engine: "perchance", pollinationsModel: "flux", pollinationsKey: "", hordeKey: "", hordeModels: "" };
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
  if (!s.pollinationsModel) s.pollinationsModel = "flux";
  chrome.storage.sync.set(s, () => { $("saved").textContent = "Saved"; setTimeout(() => ($("saved").textContent = ""), 1500); });
};
