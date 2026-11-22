# Changelog

Dated notes of every push (Mountain Time).

## 2026-11-22 — v0.5.0 extension: one interface for all engines

- Pushed Sun Nov 22, 2026 (Mountain Time). Reinstall the extension (zip / xpi). Generator unchanged.
- Every engine now sits behind the same commands in `src/engines.js`: `generate_image`, `edit_image`, `get_image`,
  `list_models`. New engines are one adapter each.
- **Fallback** (setting, on by default): a failing engine hands over to the default engine, then Perchance. The card says so.
- **Picture edits**: `ref: <https link>` now edits the picture on AI Horde (img2img) and on Pollinations with a key.
  New tag option `strength: 0–1` (how much it may change; default 0.6).
- **Show models** buttons in settings list each engine's current models; tap one to use it.
- Pollinations, checked against its API docs 2026-11-22: keyed requests now go to gen.pollinations.ai (Bearer key);
  keyless use stays on image.pollinations.ai (one model, logo, 768px max, one image at a time; the card waits and retries
  on "too many requests"). Default Pollinations model is now the service's own default.
- AI Horde, checked against the horde-sdk docs 2026-11-22: censored images are dropped, guidance capped at 10, a
  "too many requests" answer waits and retries.
- Tested: tag parsing and the adapters (node, stand-in responses), and fallback/retry in Chromium on a stand-in
  claude.ai page. The real sites can't be reached from the build environment, so the first real images are untested.
- The .crx was not rebuilt (no signing key); use the .zip or .xpi.

## 2026-11-21 — v0.4.0 extension: more engines

- Pushed Sat Nov 21, 2026, ~11:40 AM MT. Reinstall the extension (zip / xpi). Generator unchanged.
- New engines besides Perchance: **Pollinations** and **AI Horde**, both free. Settings: **Default engine**,
  Pollinations model and optional key, AI Horde optional key and models.
- New tag option `engine: perchance | pollinations | horde` picks the engine for one image.
- The card shows the engine's name, progress (AI Horde: place in line and wait), and a **Try again** button on errors.
  Finished images are saved, swipeable and open in Full size like Perchance ones. Saved Perchance images are kept.
- Tested: tag parsing (node tests), engine steps against stand-in responses, and the cards in Chrome on a stand-in
  claude.ai page. The real sites can't be reached from the build environment, so the first real images are untested.
- The .crx package was not rebuilt (it needs the original signing key); Edge Canary stays on 0.3.4 until then.

## 2026-11-19 — docs: reference image unsupported

- Pushed Thu Nov 19, 2026, ~10:55 PM MT. Docs only.
- George's test (same seed, with and without `ref:`): neither image resembled the reference, so Perchance appears
  to ignore `referenceImage`. The option stays in the code but is marked unsupported and removed from CLAUDE_INSTRUCTIONS.md.

## 2026-11-19 — v0.3.4 extension + generator v0.2.8

- Pushed Thu Nov 19, 2026, ~10:50 PM MT. Reinstall the extension AND re-paste `perchance/generator.html`.
- New tag options: `ref: <https link>` and `blur: 0–1`, passed to the plugin as `referenceImage: { url, blur }`.
  Experimental: Perchance may have this switched off, in which case images come out as if no reference was given.
- Generator: new "test ref" button (fixed seed, blister-pack prompt, reference image from `test-assets/reference.jpg`, George's test image; delete the folder when done).

## 2026-11-19 — v0.3.3 extension

- Pushed Thu Nov 19, 2026, ~10:30 PM MT. Reinstall the extension. Generator unchanged.
- Reported (Quetta): a saved x4 card showed an empty grey box, though Full size still had the images.
- Saved images are now drawn in an isolated box that claude.ai's own styles can't reach, with ‹ › arrows and an
  "n / 4" counter like the live carousel.
- Back from Full size: unchanged and passes in testing. One Quetta report of leaving the page, possibly from a tab
  still running the older version; watching for it.

## 2026-11-19 — v0.3.2 extension

- Pushed Thu Nov 19, 2026, ~10:10 PM MT. Reinstall the extension. Generator unchanged.
- Perchance's top bar no longer shows while the image is "Preparing..." (it was only hidden once the image appeared).
- The prompt caption now has its own line under the buttons (up to 2 lines) instead of being cut to "A...".

## 2026-11-19 — v0.3.1 extension

- Pushed Thu Nov 19, 2026, ~10:05 PM MT. Reinstall the extension. Generator unchanged.
- Reported: pressing the phone's Back button in the full-size viewer left claude.ai entirely.
- The viewer now adds a history step, so Back just closes it. The close button is now a clearer "✕ Close".
- Tested in Chromium with a stand-in claude.ai page: Back and ✕ Close both close the viewer and stay on the chat.

## 2026-11-19 — v0.3.0 extension

- Pushed Thu Nov 19, 2026, ~8:55 PM MT. Reinstall the extension (remove the old one first). Generator unchanged.
- Reported: the card showed Perchance's own clutter (top bar, buttons over the image, a white gap, a
  Stable Diffusion license pop-up), and every image was generated again each time the chat was opened.
- Images are now saved once finished and shown straight from storage when the chat is reopened. A new
  **Re-render** button makes a fresh image. Keeps the last 300 tags (needs the new "unlimitedStorage" permission).
- Inside the card only: Perchance's top bar (generators / edit / login) and the plugin's round buttons over
  the image (info, flag, heart, refresh) are hidden, and the gap below the image is gone.
- The plugin's "I made this Perchance plugin ... Stable Diffusion's license" pop-up is skipped.
- Generator name defaults to `claude-perchance`.
- Tested with stand-in pages (claude.ai and Perchance are mocked in the test browser): caching, reload,
  Re-render and the top-bar hiding work. Hiding the plugin's buttons and the pop-up is untested against the real plugin.
- New .crx signing key, so the .crx installs as a new extension ID.

## 2026-11-19 — README: verified Quetta install steps

- Pushed Thu Nov 19, 2026, evening MT.
- Quetta install path confirmed from George's screenshots: menu ︙ → Extensions → Developer options... →
  (from .zip/.crx/.user.js). Screenshots 12 and 13 added. Docs only; no code change.

## 2026-11-19 — v0.2.7 generator

- Pushed Thu Nov 19, 2026, ~7:50 PM MT.
- Test buttons now draw a random sci-fi or fantasy anime scene from a set of 6 (was a red fox), at that scene's
  natural shape (portrait or landscape). Each tap starts a fresh render (the same button tapped twice used to do nothing).
- Generator only; no extension reinstall needed. Re-paste `perchance/generator.html` and save.
- The waiting text now shows the generator version, e.g. "(generator v0.2.7)", so you can tell which code is pasted.
  GitHub's raw links can serve an old copy for up to 5 minutes after a push.

## 2026-11-19 — v0.2.6 extension + generator

- Pushed Thu Nov 19, 2026, ~7:40 PM MT.
- Reported: images were squashed/stretched into a small box.
- Cause: the generator forced the plugin's image to 100% width while its height stayed fixed.
- Generator: images now fill the width and keep their real shape (aspect ratio from the resolution: square, portrait, landscape).
- Extension: cards are full message width (up to 900px); the card's height follows the image shape at that width.
- **Needs the generator re-pasted and the extension reinstalled.**

## 2026-11-19 — v0.2.5 extension + generator

- Pushed Thu Nov 19, 2026, ~7:30 PM MT.
- New **Full size** button on each card: opens the image full-screen (tap to zoom to actual pixels, pinch also works),
  with ‹ › for carousels and a **Save** button that downloads the image.
- Generator now sends each finished image to the extension as a data URL (from the plugin's result or onFinish data).
  **Needs the generator re-pasted.** The button stays greyed out until an image arrives. If it never lights up,
  the plugin doesn't expose the image this way and needs another approach.

## 2026-11-19 — v0.2.4 extension

- Pushed Thu Nov 19, 2026, ~7:15 PM MT.
- Reported: image cards kept re-rendering endlessly.
- Loop guard: if the page re-creates the same message, a prompt is auto-rendered at most 2 times per minute.
  After that its card shows a "Render image" button instead of generating again.
- `.crx` rebuilt with the original signing key, so it is v0.2.4 like the `.zip` and `.xpi`.

## 2026-11-19 — v0.2.3 extension

- Pushed Thu Nov 19, 2026, ~7:03 PM MT.
- Reported: Quetta showed disturbing random images. Cause: Claude had quoted the tag format in code formatting
  (prompts "prompt" and "..."); the extension rendered them, and Perchance drew random images, 4 per tag.
- Tags inside code formatting (`code`, `pre`, `kbd`, `samp`) are now ignored.
- Tags whose prompt has fewer than 3 words are ignored (`MIN_WORDS` in `src/content.js`; `minWords` option in `src/parse.js`).
- Old lines commented out, not deleted. Tests added to `test/parse.test.js`.
- Rebuilt `packages/claude-perchance.zip` and `.xpi`. **The `.crx` is still v0.2.2**: it needs the original signing
  key, which is not in the repo. Install the `.zip` in Quetta.

## 2026-11-19 — v0.2.2 extension

- Pushed Thu Nov 19, 2026, ~7:00 PM MT.
- Content script now runs on every claude.ai and claude.com page and subdomain, in all frames, and also scans
  open shadow roots (with CSS injected there). Covers regular chats, chats in Projects and code pages.
- New "Show debug info on Claude pages" setting: a small pill at the bottom-left shows the version and how many
  tags/cards it found on the page, to diagnose pages where nothing renders.
- Generator (carousel only): each slide is attached to the page before the image is inserted.
  Single images are unchanged from the v0.2.1 generator fix.

## 2026-11-19 — generator fix (v0.2.1 generator code)

- Pushed Thu Nov 19, 2026, 6:48 PM MT (commit a685073).
- Reported: rendering broke after v0.2.0 (3:34 PM). Earlier versions worked.
- `perchance/generator.html`: a single image now runs exactly the v0.1.5 code (`#out.innerHTML = image(opts)`),
  with no carousel wrapper. The carousel is used only for x2/x4/x8. Old early-return line commented out, not deleted.
- Extension files unchanged; no reinstall needed. Re-paste `perchance/generator.html` into the generator's HTML editor and save.

## 2026-11-19 — v0.2.0 extension + generator

- Pushed Thu Nov 19, 2026, ~3:34 PM MT.
- `x2` / `x4` / `x8` (or `count: N`, 1–8) renders several images per tag in a swipeable carousel with ‹ › arrows
  and an "n / N" counter. New "Images per tag" setting.
- Broke single images in the generator; fixed by the v0.2.1 generator code above.
- Later the same day: `packages/claude-perchance.zip` was 404 because `.gitignore` excluded `*.zip`; now tracked.

## 2026-11-19 — v0.1.5 extension + generator

- Pushed Thu Nov 19, 2026, afternoon MT.
- New tag options `seed: <int>` and `guidance: <1–30>` (also `cfg:`), from George's research on the plugin's options.
- CLAUDE_INSTRUCTIONS.md asks Claude for plain descriptive sentences instead of keyword lists.
- README: saving the generator needs a Perchance login.

## 2026-11-19 — v0.1.4 extension

- Pushed Thu Nov 19, 2026, morning MT.
- A paragraph holding only a tag is hidden with an attribute plus CSS, so pages that restore their own text
  (claude.ai/code) still hide the tag.

## 2026-11-19 — v0.1.3 extension

- Tags split across several text nodes (markdown, streaming) are found and hidden; the card goes after the tag's block.

## 2026-11-19 — v0.1.2 extension

- Default negative prompt "blurry, low quality, text" (George's suggestion). Setting in options.

## 2026-11-19 — v0.1.1 extension

- Render status moved to a bar at the bottom of the card, so it doesn't cover Perchance.
- README: name the generator with Perchance's "change url" dialog (needs an account), not by typing a URL.

## 2026-11-18 — v0.1.0 first release

- Pushed Wed Nov 18, 2026, ~9:30 PM MT.
- Chrome MV3 + Firefox extension: finds `[[image: prompt | options]]` tags on claude.ai and renders each in a card
  that loads the user's Perchance generator through an extension page (bypasses claude.ai's CSP).
- Generator code (`perchance/`), options page, parser tests, CLAUDE_INSTRUCTIONS.md, README.
- Android browser install table and prebuilt .zip / .xpi / .crx in `packages/`.
