// Runs inside an extension page (so claude.ai's CSP can't block it) and hosts the Perchance generator.
// Perchance nests generator code in an inner iframe, so we post the prompt to every descendant frame
// until the generator acknowledges it.
const params = new URLSearchParams(location.search);
const job = {
  type: "claude-perchance:render",
  id: Math.random().toString(36).slice(2),
  prompt: params.get("prompt") || "",
  negative: params.get("negative") || "",
  resolution: params.get("resolution") || "512x512",
};
if (params.has("seed")) job.seed = Number(params.get("seed"));
if (params.has("guidance")) job.guidance = Number(params.get("guidance"));
const gen = (params.get("gen") || "").trim().replace(/^https?:\/\/(www\.)?perchance\.org\//, "").replace(/[^\w-]/g, "");
const status = document.getElementById("status");

const frame = document.createElement("iframe");
frame.onload = () => { if (!acked && status.textContent === "Loading Perchance…") status.textContent = ""; };
frame.src = "https://perchance.org/" + encodeURIComponent(gen);
frame.allow = "clipboard-write";
document.body.appendChild(frame);

let acked = false;
function postAll(win, depth) {
  try { win.postMessage(job, "*"); } catch (e) {}
  if (depth > 3) return;
  try { for (let i = 0; i < win.frames.length; i++) postAll(win.frames[i], depth + 1); } catch (e) {}
}

window.addEventListener("message", (e) => {
  const d = e.data;
  if (!d || typeof d !== "object" || d.id !== job.id) return;
  if (d.type === "claude-perchance:ack") { acked = true; status.textContent = ""; }
  if (d.type === "claude-perchance:done") status.textContent = "";
});

const started = Date.now();
const timer = setInterval(() => {
  if (acked) return clearInterval(timer);
  if (Date.now() - started > 45000) {
    clearInterval(timer);
    status.textContent = "Perchance generator didn't respond. Check the generator name in settings.";
    return;
  }
  postAll(frame.contentWindow, 0);
}, 700);
