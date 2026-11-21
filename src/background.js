// v0.4.0: other image engines. Runs as the extension's background worker, which may contact the engines'
// sites (claude.ai's own page rules stop the chat page from doing it). Each message does one short step,
// so the worker never has to stay awake through a long wait: the chat page asks again for the next step.
const AGENT = "claude-perchance:0.4.0:github.com/purdygeorgeedward-dev/claude-perchance";

function toDataUrl(buf, type) {
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return "data:" + (type || "image/jpeg") + ";base64," + btoa(bin);
}

function size(spec) {
  const [w, h] = (spec.resolution || "512x512").split("x").map(Number);
  return { w: w || 512, h: h || 512 };
}

// Pollinations: one image per call. Free with no account; a key (optional) removes the small logo.
async function pollinations(job) {
  const { spec, index, settings } = job;
  const { w, h } = size(spec);
  const seed = spec.seed != null ? spec.seed + index : Math.floor(Math.random() * 2147483647);
  const q = new URLSearchParams({ width: w, height: h, seed, model: settings.pollinationsModel || "flux" });
  if (spec.negative) q.set("negative_prompt", spec.negative);
  if (spec.guidance != null) q.set("guidance", spec.guidance);
  const headers = {};
  if (settings.pollinationsKey) { headers.Authorization = "Bearer " + settings.pollinationsKey; q.set("nologo", "true"); }
  const r = await fetch("https://image.pollinations.ai/prompt/" + encodeURIComponent(spec.prompt) + "?" + q, { headers });
  if (!r.ok) throw new Error("Pollinations: " + r.status + " " + (await r.text()).slice(0, 160));
  const type = (r.headers.get("content-type") || "image/jpeg").split(";")[0];
  if (!type.startsWith("image/")) throw new Error("Pollinations sent no image (" + type + ")");
  return { dataUrl: toDataUrl(await r.arrayBuffer(), type) };
}

// AI Horde: start a job, then the chat page checks on it, then collects the images.
const HORDE = "https://aihorde.net/api/v2/generate/";
function hordeHeaders(settings) {
  return { "Content-Type": "application/json", apikey: settings.hordeKey || "0000000000", "Client-Agent": AGENT };
}
async function hordeStart(job) {
  const { spec, settings } = job;
  const { w, h } = size(spec);
  const params = {
    width: Math.round(w / 64) * 64, height: Math.round(h / 64) * 64, n: Math.max(1, spec.count || 1),
    steps: 30, sampler_name: "k_euler_a", cfg_scale: spec.guidance != null ? spec.guidance : 7,
  };
  if (spec.seed != null) params.seed = String(spec.seed);
  const body = {
    prompt: spec.prompt + (spec.negative ? " ### " + spec.negative : ""),
    params, nsfw: false, censor_nsfw: true, r2: false, shared: false,
  };
  const models = (settings.hordeModels || "").split(",").map((s) => s.trim()).filter(Boolean);
  if (models.length) body.models = models;
  const r = await fetch(HORDE + "async", { method: "POST", headers: hordeHeaders(settings), body: JSON.stringify(body) });
  const d = await r.json().catch(() => ({}));
  if (!r.ok || !d.id) throw new Error("AI Horde: " + (d.message || r.status));
  return { id: d.id };
}
async function hordeCheck(job) {
  const r = await fetch(HORDE + "check/" + encodeURIComponent(job.id), { headers: { "Client-Agent": AGENT } });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error("AI Horde: " + (d.message || r.status));
  if (d.faulted) throw new Error("AI Horde: the job failed on the worker");
  if (d.is_possible === false) throw new Error("AI Horde: no worker can make this (try another model or size)");
  return { done: !!d.done, wait: d.wait_time, queue: d.queue_position };
}
async function hordeResult(job) {
  const r = await fetch(HORDE + "status/" + encodeURIComponent(job.id), { headers: { "Client-Agent": AGENT } });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error("AI Horde: " + (d.message || r.status));
  const images = [];
  for (const g of d.generations || []) {
    if (!g.img) continue;
    if (/^https:\/\//.test(g.img)) {
      const ir = await fetch(g.img);
      images.push(toDataUrl(await ir.arrayBuffer(), (ir.headers.get("content-type") || "image/webp").split(";")[0]));
    } else images.push("data:image/webp;base64," + g.img);
  }
  if (!images.length) throw new Error("AI Horde: the job finished without images (it may have been filtered)");
  return { images };
}

const STEPS = { pollinations, hordeStart, hordeCheck, hordeResult };
chrome.runtime.onMessage.addListener((msg, sender, reply) => {
  if (!msg || msg.type !== "claude-perchance:engine" || !STEPS[msg.step]) return;
  STEPS[msg.step](msg).then(reply, (e) => reply({ error: String(e && e.message || e) }));
  return true; // answer comes later
});
