// v0.3.0: runs inside Perchance frames, but only changes anything when the frame sits inside a
// Claude Perchance card (our render page pings every frame with "claude-perchance:embed").
// - perchance.org page: hides Perchance's top bar (generators / edit / login) by pinning the
//   generator's frame over the whole card.
// - image-generation.perchance.org (the plugin's image frame): hides the small buttons laid over
//   the image (info, flag, heart, refresh).
(() => {
  let embedded = false;
  const host = location.hostname;

  window.addEventListener("message", (e) => {
    const d = e.data;
    if (!d || typeof d !== "object") return;
    if (d.type !== "claude-perchance:embed" && d.type !== "claude-perchance:render") return;
    if (embedded) return;
    embedded = true;
    start();
  });

  function start() {
    const style = document.createElement("style");
    style.textContent = "html,body{background:transparent!important;margin:0!important;padding:0!important;overflow:hidden!important}";
    (document.head || document.documentElement).appendChild(style);
    const tick = host === "perchance.org" ? pinGenerator : host.startsWith("image-generation.") ? hideOverlays : null;
    if (!tick) return;
    tick();
    new MutationObserver(tick).observe(document.documentElement, { childList: true, subtree: true });
    setInterval(tick, 1000);
  }

  // Make the biggest frame on Perchance's page (the generator itself) cover everything else.
  function pinGenerator() {
    let best = null, area = 0;
    document.querySelectorAll("iframe").forEach((f) => {
      if (/image-generation\./.test(f.src || "")) return; // never the image frame itself
      const r = f.getBoundingClientRect();
      if (r.width * r.height > area) { area = r.width * r.height; best = f; }
    });
    if (!best || best.dataset.cpPinned) return;
    best.dataset.cpPinned = "1";
    best.style.cssText += ";position:fixed!important;inset:0!important;width:100vw!important;height:100vh!important;" +
      "max-width:none!important;max-height:none!important;margin:0!important;border:0!important;z-index:2147483647!important;background:transparent!important";
  }

  // Hide small things floating over the image (the plugin's round icon buttons).
  function hideOverlays() {
    document.querySelectorAll("body *").forEach((el) => {
      if (el.dataset.cpHidden) return;
      const pos = getComputedStyle(el).position;
      if (pos !== "absolute" && pos !== "fixed") return;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.width > 90 || r.height > 90) return;
      el.dataset.cpHidden = "1";
      el.style.setProperty("display", "none", "important");
    });
  }
})();
