# Changelog

Dated notes of every push (Mountain Time).

## 2026-11-19 — generator fix (v0.2.1 generator code)

- Pushed Thu Nov 19, 2026, ~6:55 PM MT.
- Reported: rendering broke after v0.2.0 (3:34 PM). Earlier versions worked.
- `perchance/generator.html`: a single image now runs exactly the v0.1.5 code (`#out.innerHTML = image(opts)`),
  with no carousel wrapper. The carousel is used only for x2/x4/x8. Old early-return line commented out, not deleted.
- Extension files unchanged; no reinstall needed. Re-paste `perchance/generator.html` into the generator's HTML editor and save.
