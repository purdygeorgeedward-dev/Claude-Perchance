// Engine adapters against stand-in responses (the real sites can't be reached from the build environment).
const assert = require("assert");
const E = require("../src/engines.js");
let calls = [];
function reply(status, body, headers = {}) {
  const isBuf = body instanceof Uint8Array;
  return {
    ok: status >= 200 && status < 300, status,
    headers: { get: (k) => headers[k.toLowerCase()] || null },
    json: async () => body, text: async () => (isBuf ? "" : JSON.stringify(body)),
    arrayBuffer: async () => (isBuf ? body : new Uint8Array([1, 2, 3])).buffer,
  };
}
let route;
global.fetch = async (url, opt = {}) => { calls.push({ url: String(url), opt }); return route(String(url), opt); };
const spec = { prompt: "a red fox", resolution: "512x768", negative: "blurry", count: 2, seed: 5 };

(async () => {
  // Pollinations, no key: keyless address, scaled to 768 max, no model
  calls = []; route = () => reply(200, new Uint8Array([9]), { "content-type": "image/jpeg" });
  let r = await E.run({ command: "generate_image", engine: "pollinations", spec: { ...spec, resolution: "1024x1024" }, index: 1, settings: {} });
  assert.ok(r.images[0].startsWith("data:image/jpeg;base64,"));
  assert.ok(calls[0].url.startsWith("https://image.pollinations.ai/prompt/a%20red%20fox?"));
  assert.ok(/width=768&height=768&seed=6/.test(calls[0].url));
  // with key: gen address, Bearer header, model, image= for edits
  calls = [];
  const ks = { pollinationsKey: "sk_test", pollinationsModel: "flux" };
  await E.run({ command: "edit_image", engine: "pollinations", spec, index: 0, settings: ks, source: "https://x.test/a.png" });
  assert.ok(calls[0].url.startsWith("https://gen.pollinations.ai/image/a%20red%20fox?"));
  assert.ok(calls[0].url.includes("model=flux") && calls[0].url.includes("image=https%3A%2F%2Fx.test%2Fa.png"));
  assert.strictEqual(calls[0].opt.headers.Authorization, "Bearer sk_test");
  assert.deepStrictEqual(await E.run({ command: "capabilities", engine: "pollinations", settings: {} }), { edit: false });
  await assert.rejects(E.run({ command: "edit_image", engine: "pollinations", spec, settings: {}, source: "https://x" }), /needs a Pollinations key/);
  // rate limit carries retryAfter
  route = () => reply(402, {}, { "retry-after": "45" });
  await assert.rejects(E.run({ command: "generate_image", engine: "pollinations", spec, settings: {} }), (e) => e.retryAfter === 45);
  // models
  route = () => reply(200, [{ name: "flux", description: "x" }, "turbo"]);
  assert.deepStrictEqual((await E.run({ command: "list_models", engine: "pollinations", settings: {} })).models.map((m) => m.name), ["flux", "turbo"]);

  // AI Horde: start
  calls = []; route = () => reply(202, { id: "job1", kudos: 10 });
  r = await E.run({ command: "generate_image", engine: "horde", spec, want: 2, settings: { hordeModels: "Deliberate, AlbedoBase XL (SDXL)" } });
  assert.deepStrictEqual(r, { job: "job1" });
  const body = JSON.parse(calls[0].opt.body);
  assert.strictEqual(calls[0].url, "https://aihorde.net/api/v2/generate/async");
  assert.strictEqual(calls[0].opt.headers.apikey, "0000000000");
  assert.ok(/^claude-drawing-hand:0\.5\.1:/.test(calls[0].opt.headers["Client-Agent"]));
  assert.strictEqual(body.prompt, "a red fox ### blurry");
  // Deliberate is SD 1.5: long side 768
  assert.deepStrictEqual([body.params.width, body.params.height, body.params.n, body.params.seed], [512, 768, 2, "5"]);
  assert.deepStrictEqual(body.models, ["Deliberate", "AlbedoBase XL (SDXL)"]);
  // no models named: SDXL defaults, scaled to 1024 on the long side
  calls = [];
  await E.run({ command: "generate_image", engine: "horde", spec: { ...spec, resolution: "768x512" }, settings: {} });
  let db = JSON.parse(calls[0].opt.body);
  assert.strictEqual(db.models[0], "AlbedoBase XL (SDXL)");
  assert.deepStrictEqual([db.params.width, db.params.height, db.params.steps, db.params.cfg_scale, db.params.karras], [1024, 704, 30, 7, true]);
  // Flux: few steps, guidance 1
  calls = [];
  await E.run({ command: "generate_image", engine: "horde", spec: { ...spec, guidance: 9 }, settings: { hordeModels: "Flux.1-Schnell fp8 (Compact)" } });
  db = JSON.parse(calls[0].opt.body);
  assert.deepStrictEqual([db.params.steps, db.params.cfg_scale, db.params.sampler_name], [4, 1, "k_euler"]);
  assert.strictEqual(body.source_image, undefined);
  // edit: img2img with strength
  calls = [];
  await E.run({ command: "edit_image", engine: "horde", spec: { ...spec, strength: 0.3 }, settings: {}, source: "https://x.test/a.png" });
  const eb = JSON.parse(calls[0].opt.body);
  assert.deepStrictEqual([eb.source_image, eb.source_processing, eb.params.denoising_strength], ["https://x.test/a.png", "img2img", 0.3]);
  // get_image: waiting, then done
  route = (u) => reply(200, { done: false, wait_time: 12, queue_position: 3 });
  assert.deepStrictEqual(await E.run({ command: "get_image", engine: "horde", job: "job1" }), { done: false, wait: 12, queue: 3 });
  route = (u) => u.includes("/check/") ? reply(200, { done: true })
    : reply(200, { generations: [{ img: "QUJD", censored: false, model: "Juggernaut XL" }, { img: "", censored: true }] });
  r = await E.run({ command: "get_image", engine: "horde", job: "job1" });
  assert.deepStrictEqual(r, { done: true, images: ["data:image/webp;base64,QUJD"], models: ["Juggernaut XL"] });
  route = () => reply(200, { faulted: true });
  await assert.rejects(E.run({ command: "get_image", engine: "horde", job: "j" }), /failed on the worker/);
  // models, busiest first
  calls = []; route = () => reply(200, [{ name: "A", count: 1, queued: 0, eta: 3 }, { name: "B", count: 9, queued: 5, eta: 20 }]);
  r = await E.run({ command: "list_models", engine: "horde", settings: {} });
  assert.strictEqual(calls[0].url, "https://aihorde.net/api/v2/status/models?type=image");
  assert.deepStrictEqual(r.models.map((m) => m.name), ["B", "A"]);
  await assert.rejects(E.run({ command: "generate_image", engine: "nope" }), /Unknown engine/);
  console.log("engine adapter tests passed");
})().catch((e) => { console.error(e); process.exit(1); });
