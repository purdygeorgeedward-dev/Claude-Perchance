// Scans Claude's chat for [[image: ...]] tags and renders each one inline.
(() => {
  const { findTags } = self.ClaudePerchanceParse;
  const DEFAULTS = { enabled: true, generator: "", resolution: "512x512", negative: "blurry, low quality, text", hideTag: true, count: "1" };
  let settings = { ...DEFAULTS };
  const cards = new Map(); // key -> card element (reused so iframes survive re-renders when possible)
  const SKIP = "textarea, input, [contenteditable='true'], .cp-card, script, style";
  const BLOCKS = "p, li, pre, blockquote, h1, h2, h3, h4, h5, h6, td";

  chrome.storage.sync.get(DEFAULTS, (s) => { settings = { ...DEFAULTS, ...s }; scan(); });
  chrome.storage.onChanged.addListener((changes) => {
    for (const k in changes) settings[k] = changes[k].newValue;
    for (const c of cards.values()) c.remove();
    cards.clear();
    document.querySelectorAll("[data-cp-hide]").forEach((el) => el.removeAttribute("data-cp-hide"));
    scan();
  });

  function keyFor(spec, block, index) {
    // Same prompt in the same message block keeps the same card.
    if (!block.dataset.cpId) block.dataset.cpId = Math.random().toString(36).slice(2);
    return [block.dataset.cpId, index, spec.prompt, spec.resolution, spec.negative, spec.seed, spec.guidance, spec.count].join("|");
  }

  function makeCard(spec) {
    const card = document.createElement("div");
    card.className = "cp-card";
    card.contentEditable = "false";
    const [w, h] = spec.resolution.split("x").map(Number);
    if (!settings.generator) {
      card.innerHTML = '<div class="cp-note">Claude Perchance: set your Perchance generator name in the extension settings to render images.</div>';
    } else {
      const q = { gen: settings.generator, prompt: spec.prompt, negative: spec.negative, resolution: spec.resolution };
      if (spec.seed != null) q.seed = spec.seed;
      if (spec.guidance != null) q.guidance = spec.guidance;
      if (spec.count > 1) q.count = spec.count;
      const src = chrome.runtime.getURL("src/render.html") + "?" + new URLSearchParams(q);
      const frame = document.createElement("iframe");
      frame.className = "cp-frame";
      frame.src = src;
      frame.loading = "lazy";
      frame.style.aspectRatio = `${w} / ${h + 70}`;
      frame.style.maxWidth = Math.min(w, 640) + "px";
      frame.setAttribute("allow", "clipboard-write");
      card.appendChild(frame);
    }
    const bar = document.createElement("div");
    bar.className = "cp-bar";
    const label = document.createElement("span");
    label.className = "cp-prompt";
    label.textContent = spec.prompt;
    label.title = spec.prompt + (spec.negative ? "\nNegative: " + spec.negative : "");
    const copy = document.createElement("button");
    copy.textContent = "Copy prompt";
    copy.onclick = () => navigator.clipboard.writeText(spec.prompt);
    bar.append(label, copy);
    card.appendChild(bar);
    return card;
  }

  // Text nodes of a block, in order (tags can be split across nodes by markdown/streaming).
  function textNodesIn(block) {
    const w = document.createTreeWalker(block, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => (n.parentElement && n.parentElement.closest(".cp-card") ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
    });
    const out = [];
    while (w.nextNode()) out.push(w.currentNode);
    return out;
  }

  function processBlock(block) {
    const nodes = textNodesIn(block);
    const text = nodes.map((n) => n.nodeValue).join("");
    if (text.indexOf("[[") === -1) return;
    const tags = findTags(text, settings);
    if (!tags.length) return;
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

  function scan(root) {
    if (!settings.enabled) return;
    root = root || document.body;
    if (!root) return;
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
  new MutationObserver(() => {
    if (pending) return;
    pending = true;
    setTimeout(() => { pending = false; scan(); }, 400); // debounce while Claude streams
  }).observe(document.documentElement, { childList: true, subtree: true, characterData: true });
})();
