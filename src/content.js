// Scans Claude's chat for [[image: ...]] tags and renders each one inline.
(() => {
  const { findTags } = self.ClaudePerchanceParse;
  // const DEFAULTS = { enabled: true, generator: "claude-perchance", resolution: "512x512", negative: "blurry, low quality, text", hideTag: true, count: "1", debug: false };
  // v0.4.0: engine settings
  const DEFAULTS = { enabled: true, generator: "claude-perchance", resolution: "512x512", negative: "blurry, low quality, text", hideTag: true, count: "1", debug: false,
    engine: "perchance", pollinationsModel: "", pollinationsKey: "", hordeKey: "", hordeModels: "", fallback: true };
  const ENGINE_NAMES = { perchance: "Perchance", pollinations: "Pollinations", horde: "AI Horde" };
  const engineOf = (spec) => spec.engine || settings.engine || "perchance";
  let settings = { ...DEFAULTS };
  const cards = new Map(); // key -> card element (reused so iframes survive re-renders when possible)
  // const SKIP = "textarea, input, [contenteditable='true'], .cp-card, script, style"; // before v0.2.3
  // v0.2.3: also skip code formatting, so a tag quoted as an example is never rendered.
  const SKIP = "textarea, input, [contenteditable='true'], .cp-card, script, style, code, pre, kbd, samp";
  const MIN_WORDS = 3; // v0.2.3: a tag needs at least 3 words of prompt
  const BLOCKS = "p, li, pre, blockquote, h1, h2, h3, h4, h5, h6, td";

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area && area !== "sync") return; // v0.3.0: ignore image-cache writes (storage.local)
    for (const k in changes) settings[k] = changes[k].newValue;
    for (const c of cards.values()) c.remove();
    cards.clear();
    document.querySelectorAll("[data-cp-hide]").forEach((el) => el.removeAttribute("data-cp-hide"));
    const pill = document.getElementById("cp-debug");
    if (pill && !settings.debug) pill.remove();
    scan();
  });

  function keyFor(spec, block, index) {
    // Same prompt in the same message block keeps the same card.
    if (!block.dataset.cpId) block.dataset.cpId = Math.random().toString(36).slice(2);
    return [block.dataset.cpId, index, spec.prompt, spec.resolution, spec.negative, spec.seed, spec.guidance, spec.count, spec.ref, spec.blur, spec.strength, engineOf(spec)].join("|");
  }

  // v0.2.4: loop guard. If the page keeps re-creating the same message, the same image would be generated
  // again and again. After 2 renders of one prompt within a minute, further cards wait for a tap instead.
  const renderLog = new Map(); // spec signature -> timestamps of auto-renders
  function tooManyRenders(spec) {
    const sig = [spec.prompt, spec.resolution, spec.negative, spec.seed, spec.guidance, spec.count].join("|");
    const now = Date.now();
    const times = (renderLog.get(sig) || []).filter((t) => now - t < 60000);
    const blocked = times.length >= 2;
    if (!blocked) times.push(now);
    renderLog.set(sig, times);
    return blocked;
  }

  // v0.3.0: image cache. Finished images are kept in extension storage, keyed by generator + prompt +
  // options, so reopening a chat shows them instantly instead of generating them again.
  const CACHE_MAX = 300;
  function cacheKey(spec) {
    // const sig = [settings.generator, spec.prompt, spec.resolution, spec.negative, spec.seed, spec.guidance, spec.count, spec.ref, spec.blur].join("|");
    // v0.4.0: other engines get their own entries; Perchance keys stay as they were, so saved images still show
    const engine = engineOf(spec);
    const sig = [engine === "perchance" ? settings.generator : "engine:" + engine + ":" + (engine === "pollinations" ? settings.pollinationsModel : settings.hordeModels),
      spec.prompt, spec.resolution, spec.negative, spec.seed, spec.guidance, spec.count, spec.ref, spec.blur].join("|");
    let h = 2166136261;
    for (let i = 0; i < sig.length; i++) { h ^= sig.charCodeAt(i); h = Math.imul(h, 16777619); }
    return "cp-img:" + (h >>> 0).toString(36) + ":" + sig.length;
  }
  function cacheGet(spec, cb) {
    const k = cacheKey(spec);
    try { chrome.storage.local.get(k, (r) => cb((r && r[k] && r[k].images) || null)); } catch (e) { cb(null); }
  }
  function cachePut(spec, images) {
    const k = cacheKey(spec);
    try {
      chrome.storage.local.get("cp-index", (r) => {
        const index = ((r && r["cp-index"]) || []).filter((x) => x !== k);
        index.push(k);
        const drop = index.length > CACHE_MAX ? index.splice(0, index.length - CACHE_MAX) : [];
        chrome.storage.local.set({ [k]: { images, t: Date.now() }, "cp-index": index });
        if (drop.length) chrome.storage.local.remove(drop);
      });
    } catch (e) {}
  }
  function cacheDelete(spec) { try { chrome.storage.local.remove(cacheKey(spec)); } catch (e) {} }

  // Images arriving from our own card frames (generator -> Perchance page -> render.html -> this page).
  window.addEventListener("message", (e) => {
    const d = e.data;
    if (!d || d.type !== "claude-perchance:image" || typeof d.dataUrl !== "string" || !/^data:image\/(png|jpeg|webp);base64,/.test(d.dataUrl)) return;
    let card = null;
    for (const c of cards.values()) {
      const f = c.querySelector("iframe.cp-frame");
      if (!f || !f.contentWindow) continue;
      let w = e.source;
      for (let i = 0; i < 6 && w; i++) { if (w === f.contentWindow) { card = c; break; } if (w === w.parent) break; w = w.parent; }
      if (card) break;
    }
    if (!card) return;
    const idx = Math.max(0, Math.min(7, Number(d.index) || 0));
    card.cpImages[idx] = d.dataUrl;
    card.cpFullBtn.disabled = false;
    card.cpFullBtn.title = "";
    // v0.3.0: cache once every image of the tag has arrived.
    const want = Math.max(1, card.cpSpec.count || 1);
    if (card.cpImages.filter(Boolean).length >= want) {
      cachePut(card.cpSpec, card.cpImages.slice(0, want));
      // v0.5.1: show the finished images ourselves instead of relying on Perchance's frame, which stayed
      // blank in Firefox Nightly (George, 2026-11-22) although the image had arrived and Full size showed it.
      const media = card.querySelector(".cp-media");
      if (media && media.querySelector("iframe.cp-frame")) setTimeout(() => showCached(card, media, card.cpImages.slice(0, want)), 300);
    }
  });

  function openViewer(images, start, prompt) {
    const list = images.filter(Boolean);
    if (!list.length) return;
    let i = Math.min(start, list.length - 1), zoomed = false;
    const ov = document.createElement("div");
    ov.className = "cp-viewer";
    const img = document.createElement("img");
    const top = document.createElement("div");
    top.className = "cp-viewer-bar";
    const count = document.createElement("span");
    const save = document.createElement("a");
    save.textContent = "Save";
    const prev = document.createElement("button"); prev.textContent = "‹";
    const next = document.createElement("button"); next.textContent = "›";
    const close = document.createElement("button"); close.textContent = "✕ Close"; close.className = "cp-close";
    const wrap = document.createElement("div");
    wrap.className = "cp-viewer-img";
    wrap.appendChild(img);
    const slug = (prompt || "image").toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40).replace(/^-|-$/g, "");
    const show = () => {
      img.src = list[i];
      save.href = list[i];
      // save.download = `${slug || "image"}-${i + 1}.${list[i].startsWith("data:image/png") ? "png" : "jpg"}`;
      save.download = `${slug || "image"}-${i + 1}.${list[i].startsWith("data:image/png") ? "png" : list[i].startsWith("data:image/webp") ? "webp" : "jpg"}`;
      count.textContent = list.length > 1 ? `${i + 1} / ${list.length}` : "";
      prev.style.visibility = next.style.visibility = list.length > 1 ? "visible" : "hidden";
    };
    prev.onclick = () => { i = (i + list.length - 1) % list.length; show(); };
    next.onclick = () => { i = (i + 1) % list.length; show(); };
    img.onclick = () => { zoomed = !zoomed; wrap.classList.toggle("zoomed", zoomed); };
    // v0.3.1: the viewer gets its own history entry, so the phone's Back button closes it instead of
    // leaving claude.ai. The page's own state is copied in so its router treats the entry as its own.
    let closed = false;
    const done = () => {
      if (closed) return;
      closed = true;
      ov.remove();
      document.removeEventListener("keydown", key);
      window.removeEventListener("popstate", onPop);
    };
    const onPop = () => done();
    const closeViaHistory = () => {
      if (!closed && history.state && history.state.cpViewer) history.back(); // popstate then closes it
      else done();
    };
    const key = (e) => { if (e.key === "Escape") closeViaHistory(); if (e.key === "ArrowLeft") prev.onclick(); if (e.key === "ArrowRight") next.onclick(); };
    close.onclick = closeViaHistory;
    try { history.pushState({ ...(history.state || {}), cpViewer: true }, "", location.href); } catch (e) {}
    window.addEventListener("popstate", onPop);
    document.addEventListener("keydown", key);
    top.append(prev, count, next, save, close);
    ov.append(top, wrap);
    document.body.appendChild(ov);
    show();
  }

  // v0.3.0: the card is built at once; its picture area is filled from the cache if possible,
  // otherwise with a live Perchance frame (or a "Render image" button when the loop guard trips).
  function makeCard(spec) {
    const card = document.createElement("div");
    card.className = "cp-card";
    card.contentEditable = "false";
    card.cpSpec = spec;
    card.cpImages = [];
    const media = document.createElement("div");
    media.className = "cp-media";
    card.appendChild(media);

    const bar = document.createElement("div");
    bar.className = "cp-bar";
    const label = document.createElement("span");
    label.className = "cp-prompt";
    label.textContent = spec.prompt;
    label.title = spec.prompt + (spec.negative ? "\nNegative: " + spec.negative : "");
    const copy = document.createElement("button");
    copy.textContent = "Copy prompt";
    copy.onclick = () => navigator.clipboard.writeText(spec.prompt);
    const full = document.createElement("button");
    full.textContent = "Full size";
    full.disabled = true;
    full.title = "Available once the image has finished";
    full.onclick = () => openViewer(card.cpImages, card.cpAt ? card.cpAt() : 0, spec.prompt);
    const redo = document.createElement("button");
    redo.textContent = "Re-render";
    redo.title = "Make a new image from the same prompt";
    // redo.onclick = () => { cacheDelete(spec); card.cpImages = []; full.disabled = true; card.cpAt = null; showFrame(card, media, false); };
    redo.onclick = () => { cacheDelete(spec); card.cpImages = []; full.disabled = true; card.cpAt = null; showEngine(card, media, false); };
    card.cpFullBtn = full;
    bar.append(label, full, redo, copy);
    card.appendChild(bar);
    // v0.5.0: a line under the card saying when an engine was skipped or fell back
    const note = document.createElement("div");
    note.className = "cp-fallback";
    card.appendChild(note);
    card.cpNote = (t) => { note.textContent = t || ""; note.style.display = t ? "" : "none"; };
    card.cpNote("");

    // v0.4.0: the engine's name on the card when it isn't Perchance
    if (engineOf(spec) !== "perchance") label.textContent = "[" + ENGINE_NAMES[engineOf(spec)] + "] " + spec.prompt;
    if (!settings.generator && engineOf(spec) === "perchance") {
      media.innerHTML = '<div class="cp-note">Claude&#39;s Drawing Hand: set your Perchance generator name in the extension settings to render images.</div>';
      return card;
    }
    cacheGet(spec, (images) => {
      const want = Math.max(1, spec.count || 1);
      if (images && images.filter(Boolean).length >= want) {
        card.cpImages = images.slice();
        full.disabled = false;
        full.title = "";
        showCached(card, media, images);
      // } else showFrame(card, media, tooManyRenders(spec));
      } else showEngine(card, media, tooManyRenders(spec));
    });
    return card;
  }

  function showFrame(card, media, paused) {
    const spec = card.cpSpec;
    const [w, h] = spec.resolution.split("x").map(Number);
    const q = { gen: settings.generator, prompt: spec.prompt, negative: spec.negative, resolution: spec.resolution };
    if (spec.seed != null) q.seed = spec.seed;
    if (spec.guidance != null) q.guidance = spec.guidance;
    if (spec.count > 1) q.count = spec.count;
    if (spec.ref) { q.ref = spec.ref; if (spec.blur != null) q.blur = spec.blur; } // v0.3.4
    const src = chrome.runtime.getURL("src/render.html") + "?" + new URLSearchParams(q);
    const frame = document.createElement("iframe");
    frame.className = "cp-frame";
    frame.loading = "lazy";
    // v0.3.0: Perchance's top bar is now hidden, so the frame is just the image's height (was + 64px).
    frame.style.height = `calc(100cqw * ${h} / ${w})`;
    frame.setAttribute("allow", "clipboard-write");
    media.innerHTML = "";
    if (paused) {
      const btn = document.createElement("button");
      btn.className = "cp-render";
      btn.textContent = "Render image";
      btn.onclick = () => { btn.replaceWith(frame); frame.src = src; };
      media.appendChild(btn);
    } else {
      frame.src = src;
      media.appendChild(frame);
    }
  }

  // v0.4.0: Pollinations and AI Horde. The background worker talks to their sites one step at a time;
  // the card shows progress, then the finished images exactly like saved ones.
  // v0.5.0: the steps are the shared engine commands (generate_image, edit_image, get_image, list_models),
  // and a failing engine hands over to the next one in the chain (tag's engine, default engine, Perchance).
  function ask(msg) {
    return new Promise((ok, fail) => {
      try {
        chrome.runtime.sendMessage({ type: "claude-perchance:engine", settings, ...msg }, (r) => {
          if (chrome.runtime.lastError) return fail(new Error(chrome.runtime.lastError.message));
          if (!r) return fail(new Error("no answer from the extension"));
          if (r.error) { const e = new Error(r.error); e.retryAfter = r.retryAfter; return fail(e); }
          ok(r);
        });
      } catch (e) { fail(e); }
    });
  }
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  // Engines to try, in order. Without fallback, only the first.
  function chainOf(spec) {
    const first = engineOf(spec);
    if (!settings.fallback) return [first];
    return [...new Set([first, settings.engine || "perchance", "perchance"])];
  }
  function showEngine(card, media, paused) {
    const chain = chainOf(card.cpSpec);
    if (chain[0] === "perchance") return showFrame(card, media, paused);
    showRemote(card, media, paused, chain, 0, []);
  }

  function showRemote(card, media, paused, chain, step, notes) {
    const spec = card.cpSpec;
    const engine = chain[step];
    if (engine === "perchance") {
      card.cpNote(notes.join(" "));
      return showFrame(card, media, paused);
    }
    const [w, h] = spec.resolution.split("x").map(Number);
    media.innerHTML = "";
    const box = document.createElement("div");
    box.className = "cp-wait";
    box.style.height = `calc(100cqw * ${h} / ${w})`;
    media.appendChild(box);
    const say = (t) => { box.textContent = t; };
    card.cpNote(notes.join(" "));
    if (paused) {
      const btn = document.createElement("button");
      btn.className = "cp-render";
      btn.textContent = "Render image";
      btn.onclick = () => showRemote(card, media, false, chain, step, notes);
      box.appendChild(btn);
      return;
    }
    const run = card.cpRun = {};
    const live = () => card.cpRun === run && card.isConnected;
    const want = Math.max(1, spec.count || 1);
    const NAME = ENGINE_NAMES[engine];
    // Ask, waiting and asking again when the site says "too many requests".
    async function askPatiently(msg) {
      for (let tries = 0; ; tries++) {
        try { return await ask(msg); } catch (e) {
          if (!e.retryAfter || tries >= 5 || !live()) throw e;
          for (let s = e.retryAfter; s > 0 && live(); s--) { say(`${NAME}: busy, trying again in ${s} s…`); await sleep(1000); }
        }
      }
    }
    (async () => {
      // A reference picture is only used by engines that can edit; others are skipped while one later can.
      let command = "generate_image";
      if (spec.ref) {
        const caps = await ask({ command: "capabilities", engine });
        if (caps.edit) command = "edit_image";
        else if (chain.slice(step + 1).some((e) => e !== "perchance")) throw Object.assign(new Error(NAME + " can't use a reference picture"), { skip: true });
        else notes = notes.concat(NAME + " ignored the reference picture.");
      }
      let images = [];
      const started = Date.now();
      while (images.length < want && live()) {
        say(`${NAME}: ${want > 1 ? `drawing image ${images.length + 1} of ${want}` : "drawing"}…`);
        const r = await askPatiently({ command, engine, spec, index: images.length, want: want - images.length, source: spec.ref });
        if (r.images) { images = images.concat(r.images); continue; }
        for (;;) {
          if (!live()) return;
          if (Date.now() - started > 15 * 60000) throw new Error(NAME + ": still waiting after 15 minutes");
          const c = await askPatiently({ command: "get_image", engine, job: r.job });
          if (c.done) {
            images = images.concat(c.images || []);
            if (c.models && c.models.length) notes = notes.concat("Model: " + c.models.join(", ") + "."); // v0.5.1
            break;
          }
          say(`${NAME}: ${c.queue ? `place ${c.queue} in line, ` : ""}about ${Math.max(1, Math.round(c.wait || 0))} s…`);
          await sleep(4000);
        }
      }
      if (!live() || !images.length) return;
      images = images.slice(0, want);
      card.cpNote(notes.join(" "));
      card.cpImages = images.slice();
      card.cpFullBtn.disabled = false;
      card.cpFullBtn.title = "";
      cachePut(spec, images);
      showCached(card, media, images);
    })().catch((e) => {
      if (!live()) return;
      const m = String(e.message || e);
      const why = m.startsWith(NAME) ? m : NAME + ": couldn't reach the site (" + m + ")";
      if (step + 1 < chain.length) {
        const next = chain[step + 1];
        return showRemote(card, media, false, chain, step + 1,
          notes.concat(e.skip ? why + "; used " + ENGINE_NAMES[next] + "." : why + "; fell back to " + ENGINE_NAMES[next] + "."));
      }
      box.textContent = why + " ";
      const again = document.createElement("button");
      again.className = "cp-render";
      again.textContent = "Try again";
      again.onclick = () => showEngine(card, media, false);
      box.appendChild(again);
    });
  }

  // Saved images: shown directly, swipeable when there are several.
  // v0.3.3: drawn inside a shadow root so claude.ai's own image styles can't hide them (Quetta showed
  // an empty grey box), with ‹ › arrows and a counter like the live carousel.
  const CACHED_CSS = `
    :host { display: block; position: relative; }
    .car { display: flex; overflow-x: auto; scroll-snap-type: x mandatory; scrollbar-width: none; }
    .car::-webkit-scrollbar { display: none; }
    img { flex: 0 0 100%; width: 100%; height: auto; display: block; scroll-snap-align: center; cursor: zoom-in;
          opacity: 1 !important; visibility: visible !important; filter: none !important; max-width: none; margin: 0; }
    .count { position: absolute; top: 8px; left: 50%; transform: translateX(-50%); background: rgba(0,0,0,.6); color: #fff;
             font: 13px system-ui, sans-serif; padding: 2px 10px; border-radius: 10px; pointer-events: none; }
    .arrow { position: absolute; top: 50%; transform: translateY(-50%); border: 0; width: 34px; height: 34px; border-radius: 50%;
             background: rgba(0,0,0,.45); color: #fff; font-size: 20px; line-height: 34px; padding: 0; cursor: pointer; }
    .prev { left: 6px; } .next { right: 6px; }`;
  function showCached(card, media, images) {
    const list = images.filter(Boolean);
    media.innerHTML = "";
    const host = document.createElement("div");
    media.appendChild(host);
    const root = host.attachShadow({ mode: "open" });
    const style = document.createElement("style");
    style.textContent = CACHED_CSS;
    const car = document.createElement("div");
    car.className = "car";
    list.forEach((url, i) => {
      const img = document.createElement("img");
      img.src = url;
      img.alt = card.cpSpec.prompt;
      img.onclick = () => openViewer(list, i, card.cpSpec.prompt);
      car.appendChild(img);
    });
    root.append(style, car);
    card.cpAt = () => Math.round(car.scrollLeft / (car.clientWidth || 1));
    if (list.length > 1) {
      const count = document.createElement("div");
      count.className = "count";
      const prev = document.createElement("button"); prev.className = "arrow prev"; prev.textContent = "‹";
      const next = document.createElement("button"); next.className = "arrow next"; next.textContent = "›";
      const show = () => { count.textContent = card.cpAt() + 1 + " / " + list.length; };
      const go = (k) => car.scrollTo({ left: Math.max(0, Math.min(list.length - 1, card.cpAt() + k)) * car.clientWidth, behavior: "smooth" });
      prev.onclick = () => go(-1);
      next.onclick = () => go(1);
      car.addEventListener("scroll", show, { passive: true });
      show();
      root.append(count, prev, next);
    }
  }

  // Text nodes of a block, in order (tags can be split across nodes by markdown/streaming).
  function textNodesIn(block) {
    const w = document.createTreeWalker(block, NodeFilter.SHOW_TEXT, {
      // acceptNode: (n) => (n.parentElement && n.parentElement.closest(".cp-card") ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT), // before v0.2.3
      acceptNode: (n) => (n.parentElement && n.parentElement.closest(SKIP) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
    });
    const out = [];
    while (w.nextNode()) out.push(w.currentNode);
    return out;
  }

  function processBlock(block) {
    const nodes = textNodesIn(block);
    const text = nodes.map((n) => n.nodeValue).join("");
    if (text.indexOf("[[") === -1) return;
    // const tags = findTags(text, settings); // before v0.2.3
    const tags = findTags(text, { ...settings, minWords: MIN_WORDS });
    if (!tags.length) return;
    tagsSeen += tags.length;
    let anchor = block;
    tags.forEach((t, i) => {
      const key = keyFor(t.spec, block, i);
      let card = cards.get(key);
      if (!card) { card = makeCard(t.spec); card.cpBlock = block; cards.set(key, card); }
      if (anchor.nextSibling !== card) anchor.after(card);
      anchor = card;
    });
    if (!settings.hideTag) return;
    // If the block holds nothing but tags, hide the whole block with an attribute + CSS. This survives
    // pages that re-render or restore their text (unlike editing the text itself).
    let rest = "", last = 0;
    for (const t of tags) { rest += text.slice(last, t.start); last = t.end; }
    rest += text.slice(last);
    if (!rest.trim()) { block.setAttribute("data-cp-hide", ""); return; }
    // Otherwise blank out the tag characters node by node; edit nodeValue in place (never remove React-owned nodes).
    let offset = 0;
    for (const n of nodes) {
      const v = n.nodeValue, nStart = offset, nEnd = offset + v.length;
      offset = nEnd;
      let out = "", pos = nStart;
      for (const t of tags) {
        const a = Math.max(t.start, nStart), b = Math.min(t.end, nEnd);
        if (a >= b) continue;
        out += v.slice(pos - nStart, a - nStart);
        pos = b;
      }
      out += v.slice(pos - nStart);
      if (out !== v) n.nodeValue = out;
    }
  }

  // Open shadow roots (some page layouts render messages inside them). Each gets our CSS and an observer.
  const shadowRoots = new Set();
  let lastShadowSweep = 0;
  function findShadowRoots(force) {
    const now = Date.now();
    if (!force && now - lastShadowSweep < 3000) return;
    lastShadowSweep = now;
    const visit = (root) => {
      root.querySelectorAll("*").forEach((el) => {
        const sr = el.shadowRoot;
        if (sr && !shadowRoots.has(sr)) {
          shadowRoots.add(sr);
          const st = document.createElement("link");
          st.rel = "stylesheet";
          st.href = chrome.runtime.getURL("src/content.css");
          sr.appendChild(st);
          observer.observe(sr, { childList: true, subtree: true, characterData: true });
        }
        if (sr) visit(sr);
      });
    };
    if (document.body) visit(document.body);
  }

  let tagsSeen = 0;
  function scan() {
    if (!settings.enabled || !document.body) return;
    tagsSeen = 0;
    findShadowRoots();
    scanRoot(document.body);
    shadowRoots.forEach((sr) => scanRoot(sr));
    if (settings.debug) showDebug();
  }

  function showDebug() {
    let pill = document.getElementById("cp-debug");
    if (!pill) {
      pill = document.createElement("div");
      pill.id = "cp-debug";
      pill.style.cssText = "position:fixed;left:8px;bottom:8px;z-index:2147483647;background:#222;color:#fff;font:12px system-ui;padding:4px 8px;border-radius:8px;opacity:.85;pointer-events:none";
      document.documentElement.appendChild(pill);
    }
    pill.textContent = `Claude's Drawing Hand ${chrome.runtime.getManifest().version}: ${tagsSeen} tag(s), ${cards.size} card(s), ` +
      `${shadowRoots.size} shadow root(s), ${window === window.top ? "top page" : "frame"} ${location.host}${location.pathname.slice(0, 24)}`;
  }

  function scanRoot(root) {
    // Drop cards whose message was re-rendered or removed.
    for (const [k, c] of cards) if (!c.cpBlock.isConnected) { c.remove(); cards.delete(k); }
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) =>
        n.nodeValue.includes("[") && n.parentElement && !n.parentElement.closest(SKIP)
          ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT,
    });
    const blocks = new Set();
    while (walker.nextNode()) {
      const el = walker.currentNode.parentElement;
      blocks.add(el.closest(BLOCKS) || el);
    }
    blocks.forEach(processBlock);
  }

  let pending = false;
  var observer = new MutationObserver(() => {
    if (pending) return;
    pending = true;
    setTimeout(() => { pending = false; scan(); }, 400); // debounce while Claude streams
  });
  observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });

  chrome.storage.sync.get(DEFAULTS, (s) => { settings = { ...DEFAULTS, ...s }; scan(); });

})();
