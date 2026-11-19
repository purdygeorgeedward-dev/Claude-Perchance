# Claude Perchance

A browser extension that gives claude.ai inline image generation. Claude writes a tag like
`[[image: a red fox in the snow | portrait]]` and the extension renders it right in the chat
using [Perchance](https://perchance.org)'s free text-to-image plugin.

Works in Chrome/Edge/Brave (Manifest V3) and Firefox 113+.

## How it works

1. Claude emits `[[image: ...]]` tags (you teach it with a short instruction snippet).
2. The extension spots finished tags on claude.ai, hides the tag text, and adds an image card under it.
3. The card loads **your own small Perchance generator** and passes it the prompt. The generator renders
   the image with Perchance's `text-to-image-plugin`.

Perchance has no official image API, so this goes through a generator page you own. If Perchance changes how
generators or the plugin work, rendering may break.

## Setup (about 5 minutes)

### 1. Create your Perchance generator
1. Go to [perchance.org/welcome](https://perchance.org/welcome) and click to make a new generator.
2. Replace everything in the **left** panel with the contents of [`perchance/lists.txt`](perchance/lists.txt).
3. Replace everything in the **right** (HTML) panel with [`perchance/generator.html`](perchance/generator.html).
4. Click **Save**, and pick a name, e.g. `claude-render-yourname`. Your generator is now at
   `perchance.org/claude-render-yourname`.

### 2. Install the extension
**Chrome / Edge / Brave**
1. Download this repo (Code → Download ZIP) and unzip it.
2. Open `chrome://extensions`, turn on **Developer mode**.
3. Click **Load unpacked** and pick the unzipped folder.

**Firefox**
1. Open `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on…** and pick `manifest.json`. (Temporary add-ons are removed when Firefox
   restarts. For a permanent install, sign it on addons.mozilla.org as an unlisted add-on.)

### 3. Point the extension at your generator
Click the extension icon, type your generator name (e.g. `claude-render-yourname`), and click **Save**.

### 4. Teach Claude the tag
Paste the snippet from [`CLAUDE_INSTRUCTIONS.md`](CLAUDE_INSTRUCTIONS.md) into your claude.ai personal preferences
or a Project's instructions. Then ask Claude for a picture.

## Tag syntax

```
[[image: prompt]]
[[image: prompt | portrait]]              512x768
[[image: prompt | landscape]]             768x512
[[image: prompt | square]]                512x512 (default)
[[image: prompt | no: blurry, text]]      negative prompt
```

## Troubleshooting
- **"Perchance generator didn't respond"**: check the generator name in settings, and open
  `perchance.org/<your-name>` directly once to make sure it saved.
- **Perchance asks you to verify you're human**: click it inside the card; it's a normal Perchance check.
- **Nothing happens**: reload the claude.ai tab after installing or changing settings.

## Development
`node test/parse.test.js` runs the tag-parser tests.

Files: `src/content.js` (finds tags on claude.ai), `src/render.html/js` (extension page that hosts the
Perchance frame so claude.ai's security policy can't block it), `rules.json` (lets Perchance load in a frame),
`perchance/` (code for your generator).
