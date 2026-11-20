# Changelog

Dated notes of every push (Mountain Time).

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
