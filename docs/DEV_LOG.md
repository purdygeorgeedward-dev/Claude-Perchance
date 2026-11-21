# Development log

How Claude Perchance was built, what went wrong, and what we learned. George tested everything on an Android
phone (Quetta and Firefox Nightly); Claude wrote the code in a cloud session that **cannot reach perchance.org**,
so every Perchance-side change was first tested by George. Times are Mountain Time. Version-by-version details
are in [CHANGELOG.md](../CHANGELOG.md).

## The idea (Wed Nov 18, evening)

ChatGPT and Gemini show images inline; Claude doesn't. Perchance has a free text-to-image plugin but no API.
Plan: Claude writes a tag like `[[image: a dragon over a city | landscape]]`, a browser extension spots it and
shows a card that loads a small Perchance generator page George owns, and passes it the prompt.

Two design choices came from claude.ai's security rules: the card is an iframe of an **extension page**
(claude.ai's Content Security Policy would block perchance.org directly), and the extension strips Perchance's
frame-blocking headers. The prompt is sent down through the nested frames with `postMessage` until the generator
answers.

v0.1.0 shipped with the extension, the generator code, a settings page, parser tests and an install table for
every Android browser that runs desktop extensions.

## Getting Perchance set up (Thu Nov 19, morning)

The first setup steps were written from memory ("the left panel") and were wrong. George pushed back, and we
switched to working from his screenshots, one step at a time. What we learned about Perchance on a phone:

- **The editor layout:** top bar (generators, + new, save, login), preview on top, then the fullscreen / html /
  reload buttons, then the lists editor at the bottom. A new generator may open an AI helper chat first; the
  keyboard icon switches to the code editor.
- **"Select all" only selects the visible text** in the phone editor, so clearing it takes several rounds.
- **A generator saved from "+ new" while logged out never really existed** ("cannot find a generator with that name").
- **Typing `perchance.org/your-name` does not create a generator.** Custom names need a free Perchance account and
  the **change url** dialog. George named his `claude-perchance`.
- **Saving needs a login**; the per-generator password from an anonymous save didn't work.

Installing was its own hunt. Firefox Nightly refused the unsigned add-on until `xpinstall.signatures.required`
was set to `false`. Quetta's path, confirmed later from screenshots: Extensions → Developer options... →
(from .zip/.crx/.user.js).

The first image (a fox in the snow) rendered in Firefox Nightly that afternoon.

## Making it feel native (v0.1.1 to v0.1.5)

- **The raw tag text stayed visible.** Tags were split across several text nodes (v0.1.3), and on claude.ai/code
  the page put its text back after we blanked it (v0.1.4). Fix: hide a tag-only paragraph with CSS instead of
  editing the text.
- George suggested the default negative prompt **"blurry, low quality, text"** (v0.1.2).
- From George's research document: **seed** and **guidance** options, and plain descriptive prompts instead of
  keyword lists (v0.1.5).

## Carousels and a broken release (v0.2.0 to v0.2.2)

George often makes 4 or 8 images for visual development, so v0.2.0 added `x4` / `x8` as a swipeable carousel.
**It broke single images.** The generator fix (v0.2.1) went back to the exact v0.1.5 code for one image and uses
the carousel only for several. Lesson: keep the path that works untouched when adding a new one.

Same day, the download link for the .zip returned **404**: `.gitignore` excluded `*.zip`, so the package was never
pushed. Fixed by tracking the packages folder.

v0.2.2 made the extension run on every kind of claude.ai page (projects, code, frames, shadow roots) and added a
debug pill for "nothing renders" reports.

## Runaway rendering (v0.2.3, v0.2.4)

George saw cards **endlessly rendering nonsense images**. Two causes:

- Example tags quoted in **code formatting**, and placeholder tags like `[[image: prompt]]`, were rendered as real
  requests; Perchance draws random things for near-empty prompts. v0.2.3 ignores tags in code and prompts under 3 words.
- When the page re-created a message, its card was rebuilt and **rendered again**, over and over. v0.2.4 allows at
  most 2 automatic renders of a prompt per minute, then shows a "Render image" button.

## Viewing and sizing (v0.2.5 to v0.2.7)

- **Full size** viewer with zoom and Save (v0.2.5). The generator sends each finished image up as a data URL.
- **Distortion:** the generator forced images to full width while their height stayed fixed. v0.2.6 keeps the
  real shape and makes cards full width.
- George tired of the fox test image; the test buttons now draw random sci-fi/fantasy anime scenes (v0.2.7).

**Stale links:** after pushes George kept getting the old fox. GitHub's raw links are cached for about 5 minutes.
From then on every link uses the commit id (`raw.githubusercontent.com/<commit>/...`), and the generator shows its
version in its waiting text so you can see which code is pasted.

## Cleaning up the card (v0.3.0 to v0.3.3)

Once it worked in Quetta, George found the card cluttered: Perchance's own top bar, the plugin's round buttons
over the image, a white gap, and a Stable Diffusion license pop-up. Every image also re-rendered each time a chat
was opened.

- **v0.3.0:** finished images are saved in extension storage and shown on reload; a **Re-render** button makes a
  new one. Inside cards only, a small script in Perchance's frames hides the top bar and the overlay buttons and
  skips the license pop-up. The generator name now defaults to `claude-perchance`.
- **v0.3.1 / v0.3.2:** Android's **Back button left claude.ai** from the full-size view; the viewer now adds a
  history step so Back closes it, plus a clear ✕ Close. The top bar no longer flashes while an image prepares,
  and the prompt caption got its own line.
- **v0.3.3:** saved images showed as a **blank grey box** in Quetta even though Full size had them; claude.ai's
  own styles were the likely cause. They are now drawn in an isolated shadow root, with carousel arrows.

## Reference images: tested, not supported (v0.3.4)

George's research mentioned a `referenceImage` option. v0.3.4 added `ref:` and `blur:` to tags and a test
button. Test: same prompt and seed with and without his reference image. Neither result resembled the
reference, so Perchance appears to ignore it. The option stays in the code but is marked unsupported and was
taken out of Claude's instructions.

## Lessons learned

1. **Never write UI steps from memory.** Work from the user's screenshots, one step at a time, with the exact
   button names on screen. Keep those screenshots in `docs/screenshots/`.
2. **Know the user's setup.** George uses Quetta, Firefox Nightly and Iceraven because they run desktop
   extensions on Android. Mobile-first steps for those browsers, always.
3. **Give commit-pinned links**, and show a version number on screen, so stale caches can't cause confusion.
4. **Don't break what works.** When adding a feature, leave the working path alone and branch around it.
5. **Check `.gitignore` before promising a download link.**
6. **Guard against loops.** Anything that runs automatically on page changes needs a limit.
7. **Pages fight back.** claude.ai restores its text, rebuilds messages and styles images; hiding with CSS,
   isolating with shadow DOM and keying cards by content held up better than editing the page.
8. **Test the unknowns with the user, and report plainly.** perchance.org is unreachable from the build
   environment, so each Perchance-side guess was flagged as untested until George confirmed it.

## More engines (v0.4.0, Nov 21, 2026)

George asked for other image engines so different projects can try different methods, with Perchance kept as the
free default. Added Pollinations (one web address per image, no account) and AI Horde (volunteer-run; start a job,
check it, collect it). The calls run in a background worker because claude.ai's page rules block outside requests;
each message is one short step so the worker never has to stay awake through Horde's queue. A tag picks an engine
with `engine: …`; settings pick the default.
