// v0.3.0: runs in the page itself on image-generation.perchance.org. Skips the plugin's one-off
// "I made this Perchance plugin ... Stable Diffusion's license" pop-up; every other alert still shows.
(() => {
  const orig = window.alert;
  window.alert = function (msg) {
    if (/Stable Diffusion/i.test(String(msg))) return;
    return orig.apply(this, arguments);
  };
})();
