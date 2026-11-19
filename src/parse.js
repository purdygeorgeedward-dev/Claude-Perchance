// Finds [[image: prompt | option | option]] tags in text.
// Options: portrait | landscape | square | WxH (e.g. 512x768) | no: <negative prompt> | seed: <int> | guidance: <1-30> | x4 (or count: 4), 1-8 images
(function (root) {
  const TAG_RE = /\[\[\s*image\s*:\s*([\s\S]*?)\]\]/gi;
  const SIZES = { square: "512x512", portrait: "512x768", landscape: "768x512" };

  function parseTag(body, defaults) {
    defaults = defaults || {};
    const parts = body.split("|").map((s) => s.trim()).filter(Boolean);
    const spec = {
      prompt: parts.shift() || "",
      negative: defaults.negative || "",
      resolution: defaults.resolution || "512x512",
      count: Math.min(8, Math.max(1, parseInt(defaults.count, 10) || 1)),
    };
    for (const p of parts) {
      const lower = p.toLowerCase();
      if (SIZES[lower]) spec.resolution = SIZES[lower];
      else if (/^\d{3,4}\s*x\s*\d{3,4}$/.test(lower)) spec.resolution = lower.replace(/\s/g, "");
      else if (/^(no|negative)\s*:/.test(lower)) spec.negative = p.replace(/^[^:]*:\s*/, "");
      else if (/^(x\s*\d+|\d+\s*x|count\s*:\s*\d+|images?\s*:\s*\d+)$/.test(lower))
        spec.count = Math.min(8, Math.max(1, parseInt(lower.match(/\d+/)[0], 10)));
      else if (/^seed\s*:\s*-?\d+$/.test(lower)) spec.seed = parseInt(lower.split(":")[1], 10);
      else if (/^(guidance|guidancescale|cfg)\s*:\s*\d+(\.\d+)?$/.test(lower))
        spec.guidance = Math.min(30, Math.max(1, parseFloat(lower.split(":")[1])));
      else spec.prompt += ", " + p; // unknown segment: treat as more prompt
    }
    return spec;
  }

  function findTags(text, defaults) {
    const out = [];
    TAG_RE.lastIndex = 0;
    let m;
    while ((m = TAG_RE.exec(text))) {
      const spec = parseTag(m[1], defaults);
      if (spec.prompt) out.push({ start: m.index, end: m.index + m[0].length, raw: m[0], spec });
    }
    return out;
  }

  const api = { findTags, parseTag, SIZES };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.ClaudePerchanceParse = api;
})(typeof self !== "undefined" ? self : this);
