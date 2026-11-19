// Scans Claude's chat for [[image: ...]] tags and renders each one inline.
(() => {
  const { findTags } = self.ClaudePerchanceParse;
  const DEFAULTS = { enabled: true, generator: "", resolution: "512x512", negative: "", hideTag: true };
  let settings = { ...DEFAULTS };
  const cards = new Map(); // key -> card element (reused so iframes survive re-renders when possible)
  const SKIP = "textarea, input, [contenteditable='true'], .cp-card, script, style";
  const BLOCKS = "p, li, pre, blockquote, h1, h2, h3, h4, h5, h6, td, div";

  chrome.storage.sync.get(DEFAULTS, (s) => { settings = { ...DEFAULTS, ...s }; scan(); });
  chrome.storage.onChanged.addListener((changes) => {
    for (const k in changes) settings[k] = changes[k].newValue;
    for (const c of cards.values()) c.remove();
    cards.clear();
    scan();
  });

  function keyFor(spec, block, index) {
    // Same prompt in the same message block keeps the same card.
    if (!block.dataset.cpId) block.dataset.cpId = Math.random().toString(36).slice(2);
    return block.dataset.cpId + "|" + index + "|" + spec.prompt + "|" + spec.resolution + "|" + spec.negative;
  }

  function makeCard(spec) {
    const card = document.createElement("div");
    card.className = "cp-card";
    card.contentEditable = "false";
    const [w, h] = spec.resolution.split("x").map(Number);
    if (!settings.generator) {
      card.innerHTML = '<div class="cp-note">Claude Perchance: set your Perchance generator name in the extension settings to render images.</div>';
    } else {
      const src = chrome.runtime.getURL("src/render.html") + "?" + new URLSearchParams({
        gen: settings.generator, prompt: spec.prompt, negative: spec.negative, resolution: spec.resolution,
      });
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

  function processTextNode(node) {
    const text = node.nodeValue;
    if (!text || text.indexOf("[[") === -1) return;
    const tags = findTags(text, settings);
    if (!tags.length) return;
    const block = node.parentElement.closest(BLOCKS) || node.parentElement;
    let anchor = block;
    tags.forEach((t, i) => {
      const key = keyFor(t.spec, block, i);
      let card = cards.get(key);
      if (!card) { card = makeCard(t.spec); card.cpBlock = block; cards.set(key, card); }
      if (anchor.nextSibling !== card) anchor.after(card);
      anchor = card;
    });
    if (settings.hideTag) {
      // Edit nodeValue in place (never remove React-owned nodes).
      let out = "", last = 0;
      for (const t of tags) { out += text.slice(last, t.start); last = t.end; }
      node.nodeValue = (out + text.slice(last)).replace(/\n{3,}/g, "\n\n");
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
        n.nodeValue.includes("[[") && n.parentElement && !n.parentElement.closest(SKIP)
          ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT,
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(processTextNode);
  }

  let pending = false;
  new MutationObserver(() => {
    if (pending) return;
    pending = true;
    setTimeout(() => { pending = false; scan(); }, 400); // debounce while Claude streams
  }).observe(document.documentElement, { childList: true, subtree: true, characterData: true });
})();
