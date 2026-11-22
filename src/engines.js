// v0.5.0: one interface for every image engine. Each engine is an adapter with the same four commands:
//   generateImage(req)  start drawing; answers { images } when done at once, or { job } to check on later
//   getImage(job)       check a job; answers { done, wait, queue } and, once done, { images }
//   editImage(req)      like generateImage, but req.source is a picture (https link) to start from
//   listModels(settings) the models the engine offers right now: [{ name, count?, queued?, eta? }]
// plus `can(settings)`, which says what it can do with the current settings: { edit: bool }.
// req = { spec, index, settings }; spec comes from parse.js (prompt, resolution, negative, seed, guidance, count, ...).
// Perchance is drawn in a frame on the chat page, not here, so it has no adapter in this file; content.js treats
// the name "perchance" as the last stop of every fallback chain.
(function (root) {
  const VERSION = "0.5.1";
  const AGENT = "claude-drawing-hand:" + VERSION + ":github.com/purdygeorgeedward-dev/claudes-drawing-hand";

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
  // An error that tells the chat page to wait and ask again (rate limits).
  function retryLater(engine, seconds, why) {
    const e = new Error(engine + ": " + why);
    e.retryAfter = Math.max(1, Math.min(300, seconds || 30));
    return e;
  }

  // ---------------------------------------------------------------- Pollinations
  // Checked 2026-11-22 against github.com/pollinations/pollinations APIDOCS.md:
  //  - With a key: GET https://gen.pollinations.ai/image/{prompt}?model&width&height&seed&image, "Authorization: Bearer <key>".
  //    Models (no key needed): GET https://gen.pollinations.ai/image/models. Reference/edit picture: image=<url>.
  //  - Without a key: the older keyless address image.pollinations.ai/prompt/{prompt} still draws with one model,
  //    a logo, at most 768px, one request at a time per IP (HTTP 402/429 with Retry-After when too quick).
  const POLLI_GEN = "https://gen.pollinations.ai";
  const POLLI_FREE = "https://image.pollinations.ai/prompt/";
  const pollinations = {
    id: "pollinations",
    name: "Pollinations",
    can(settings) { return { edit: !!(settings && settings.pollinationsKey) }; },
    async generateImage(req) { return this._draw(req, null); },
    async editImage(req) {
      if (!this.can(req.settings).edit) throw new Error("Pollinations: editing a picture needs a Pollinations key (settings)");
      return this._draw(req, req.source);
    },
    async _draw({ spec, index, settings }, source) {
      const key = settings.pollinationsKey;
      let { w, h } = size(spec);
      const seed = spec.seed != null ? spec.seed + (index || 0) : Math.floor(Math.random() * 2147483647);
      const q = new URLSearchParams({ width: w, height: h, seed });
      const headers = {};
      let url;
      if (key) {
        if (settings.pollinationsModel) q.set("model", settings.pollinationsModel);
        if (source) q.set("image", source);
        headers.Authorization = "Bearer " + key;
        url = POLLI_GEN + "/image/" + encodeURIComponent(spec.prompt) + "?" + q;
      } else {
        const scale = Math.min(1, 768 / Math.max(w, h));
        q.set("width", Math.round(w * scale)); q.set("height", Math.round(h * scale));
        if (spec.negative) q.set("negative_prompt", spec.negative);
        url = POLLI_FREE + encodeURIComponent(spec.prompt) + "?" + q;
      }
      const r = await fetch(url, { headers });
      if (r.status === 402 || r.status === 429) {
        throw retryLater("Pollinations", Number(r.headers.get("retry-after")) || 45,
          key ? "out of credit or too many requests (" + r.status + ")" : "free use allows one image at a time; waiting");
      }
      if (r.status === 401 || r.status === 403) throw new Error("Pollinations: the key was refused (" + r.status + ")");
      if (!r.ok) throw new Error("Pollinations: " + r.status + " " + (await r.text()).slice(0, 160));
      const type = (r.headers.get("content-type") || "image/jpeg").split(";")[0];
      if (!type.startsWith("image/")) throw new Error("Pollinations sent no image (" + type + ")");
      return { images: [toDataUrl(await r.arrayBuffer(), type)] };
    },
    async getImage() { throw new Error("Pollinations: images come back at once; there is no job to check"); },
    async listModels() {
      const r = await fetch(POLLI_GEN + "/image/models");
      if (!r.ok) throw new Error("Pollinations: models list " + r.status);
      const d = await r.json();
      const list = Array.isArray(d) ? d : d.data || d.models || [];
      return list.map((m) => (typeof m === "string" ? { name: m } : { name: m.name || m.id, description: m.description }))
        .filter((m) => m.name);
    },
  };

  // ---------------------------------------------------------------- AI Horde
  // Checked 2026-11-22 against the horde-sdk docs (which mirror the v2 API):
  //  POST /v2/generate/async { prompt, params{width,height (multiples of 64), steps, n (1-20), seed (string),
  //    cfg_scale (0-10), sampler_name, denoising_strength (0-1)}, models[], nsfw, censor_nsfw, r2, shared,
  //    source_image (public URL or base64), source_processing ("img2img") } -> 202 { id, kudos }
  //  GET /v2/generate/check/{id} -> { done, faulted, is_possible, wait_time, queue_position, finished, ... }
  //  GET /v2/generate/status/{id} -> { generations[{ img (base64 webp, or a link when r2), seed, censored, model }] }
  //  GET /v2/status/models?type=image -> [{ name, count, queued, jobs, eta, performance, type }]
  //  Headers: apikey (anonymous: 0000000000), Client-Agent "name:version:contact".
  const HORDE = "https://aihorde.net/api/v2/";
  function hordeHeaders(settings) {
    return { "Content-Type": "application/json", apikey: (settings && settings.hordeKey) || "0000000000", "Client-Agent": AGENT };
  }
  // Checked 2026-11-22 against the Horde's model reference (github.com/Haidra-Org/AI-Horde-image-model-reference):
  // these names exist and are SDXL ("stable_diffusion_xl").
  const HORDE_DEFAULT_MODELS = ["AlbedoBase XL (SDXL)", "AlbedoBase XL 3.1", "Juggernaut XL", "SDXL 1.0"];
  // Settings per model family. side = long edge in pixels; cfg null = use the tag's guidance (default 7).
  const HORDE_FAMILIES = {
    sdxl: { side: 1024, steps: 30, sampler: "k_euler_a", karras: true, cfg: null },
    sd1: { side: 768, steps: 30, sampler: "k_euler_a", karras: true, cfg: null },
    flux: { side: 1024, steps: 4, sampler: "k_euler", karras: false, cfg: 1 },
    cascade: { side: 1024, steps: 20, sampler: "k_euler_a", karras: false, cfg: 4 },
  };
  function hordeFamily(name) {
    if (/flux/i.test(name)) return "flux";
    if (/cascade/i.test(name)) return "cascade";
    if (/xl|pony|illustrious/i.test(name)) return "sdxl";
    return "sd1";
  }
  async function hordeJson(r) {
    const d = await r.json().catch(() => ({}));
    if (r.status === 429) throw retryLater("AI Horde", 10, "too many requests; waiting");
    if (!r.ok) throw new Error("AI Horde: " + (d.message || r.status));
    return d;
  }
  const horde = {
    id: "horde",
    name: "AI Horde",
    can() { return { edit: true }; },
    async generateImage(req) { return this._start(req, null); },
    async editImage(req) { return this._start(req, req.source); },
    async _start({ spec, settings, want }, source) {
      // v0.5.1: with no models named, AI Horde gave the job to any worker, including Flux and Stable Cascade
      // models that need very different settings (George got a red streak). Now an SDXL list is the default,
      // and steps, guidance, sampler and size follow the model family.
      const models = (settings.hordeModels || "").split(",").map((s) => s.trim()).filter(Boolean);
      const use = models.length ? models : HORDE_DEFAULT_MODELS;
      const fam = HORDE_FAMILIES[hordeFamily(use[0])];
      const { w, h } = size(spec);
      const scale = fam.side / Math.max(w, h);
      const params = {
        width: Math.max(64, Math.round(w * scale / 64) * 64), height: Math.max(64, Math.round(h * scale / 64) * 64),
        n: Math.min(20, Math.max(1, want || spec.count || 1)),
        steps: fam.steps, sampler_name: fam.sampler, karras: fam.karras,
        cfg_scale: fam.cfg != null ? fam.cfg : Math.min(10, spec.guidance != null ? spec.guidance : 7),
      };
      if (spec.seed != null) params.seed = String(spec.seed);
      const body = {
        prompt: spec.prompt + (spec.negative ? " ### " + spec.negative : ""),
        params, nsfw: false, censor_nsfw: true, r2: false, shared: false,
      };
      if (source) {
        body.source_image = source;
        body.source_processing = "img2img";
        params.denoising_strength = spec.strength != null ? spec.strength : 0.6;
      }
      body.models = use;
      const d = await hordeJson(await fetch(HORDE + "generate/async", { method: "POST", headers: hordeHeaders(settings), body: JSON.stringify(body) }));
      if (!d.id) throw new Error("AI Horde: no job id came back");
      return { job: d.id };
    },
    async getImage({ job }) {
      const c = await hordeJson(await fetch(HORDE + "generate/check/" + encodeURIComponent(job), { headers: { "Client-Agent": AGENT } }));
      if (c.faulted) throw new Error("AI Horde: the job failed on the worker");
      if (c.is_possible === false) throw new Error("AI Horde: no worker can make this (try another model or size)");
      if (!c.done) return { done: false, wait: c.wait_time, queue: c.queue_position };
      const d = await hordeJson(await fetch(HORDE + "generate/status/" + encodeURIComponent(job), { headers: { "Client-Agent": AGENT } }));
      const images = [], used = [];
      for (const g of d.generations || []) {
        if (!g.img || g.censored) continue;
        if (g.model && !used.includes(g.model)) used.push(g.model);
        if (/^https:\/\//.test(g.img)) {
          const ir = await fetch(g.img);
          images.push(toDataUrl(await ir.arrayBuffer(), (ir.headers.get("content-type") || "image/webp").split(";")[0]));
        } else images.push("data:image/webp;base64," + g.img);
      }
      if (!images.length) throw new Error("AI Horde: the job finished without images (it may have been filtered)");
      return { done: true, images, models: used };
    },
    async listModels() {
      const list = await hordeJson(await fetch(HORDE + "status/models?type=image", { headers: { "Client-Agent": AGENT } }));
      return (Array.isArray(list) ? list : [])
        .map((m) => ({ name: m.name, count: m.count, queued: m.queued, eta: m.eta }))
        .filter((m) => m.name)
        .sort((a, b) => (b.count || 0) - (a.count || 0));
    },
  };

  const ADAPTERS = { pollinations, horde };

  // The one entry point the background worker calls: { command, engine, ... } -> answer.
  async function run(msg) {
    const a = ADAPTERS[msg.engine];
    if (!a) throw new Error("Unknown engine: " + msg.engine);
    const settings = msg.settings || {};
    switch (msg.command) {
      case "generate_image": return a.generateImage({ spec: msg.spec, index: msg.index, want: msg.want, settings });
      case "edit_image": return a.editImage({ spec: msg.spec, index: msg.index, want: msg.want, settings, source: msg.source });
      case "get_image": return a.getImage({ job: msg.job, settings });
      case "list_models": return { models: await a.listModels(settings) };
      case "capabilities": return a.can(settings);
      default: throw new Error("Unknown command: " + msg.command);
    }
  }

  const api = { VERSION, ADAPTERS, run };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.ClaudePerchanceEngines = api;
})(typeof self !== "undefined" ? self : this);
