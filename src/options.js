const DEFAULTS = { enabled: true, generator: "", resolution: "512x512", negative: "blurry, low quality, text", hideTag: true, count: "1" };
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
