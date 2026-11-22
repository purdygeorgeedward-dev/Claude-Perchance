// The extension's background worker. It contacts the image engines' sites (claude.ai's own page rules stop the
// chat page from doing it). v0.5.0: every engine sits behind one interface in engines.js (generate_image,
// edit_image, get_image, list_models). Each message is one short step, so the worker never has to stay awake
// through a long wait: the chat page asks again for the next step.
// Firefox loads engines.js first from the manifest's "scripts" list; Chrome's service worker imports it here.
if (!self.ClaudePerchanceEngines && typeof importScripts === "function") importScripts("engines.js");

chrome.runtime.onMessage.addListener((msg, sender, reply) => {
  if (!msg || msg.type !== "claude-perchance:engine") return;
  self.ClaudePerchanceEngines.run(msg).then(reply, (e) =>
    reply({ error: String((e && e.message) || e), retryAfter: e && e.retryAfter }));
  return true; // answer comes later
});
