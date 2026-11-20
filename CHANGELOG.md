# Changelog

Dated notes of every push (Mountain Time).

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
