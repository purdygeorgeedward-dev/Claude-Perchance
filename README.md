# Claude Perchance

A browser extension that gives claude.ai inline image generation. Claude writes a tag like
`[[image: a red fox in the snow | portrait]]` and the extension renders it right in the chat
using [Perchance](https://perchance.org)'s free text-to-image plugin.

Works on desktop and on Android browsers that run extensions (Quetta, Edge Canary, Firefox Nightly, Iceraven and more; see the table below).

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

Download the file for your browser from the [latest release](../../releases/latest):
`claude-perchance.zip`, `claude-perchance.crx` or `claude-perchance.xpi`.

#### Android browsers

| Browser | Can install this file? | How |
|---|---|---|
| **Quetta** | Yes (.zip or .crx) | Menu ︙ → Extensions → "(from .crx / .zip / .user.js)" → pick the file |
| **Lemur** | Yes (.zip or .crx) | Extensions page → load from file |
| **HuBrowser Lite** | Yes (.zip or .crx) | Extensions page → load from file |
| **Microsoft Edge Canary** | Yes (.crx only) | Settings → About Microsoft Edge → tap the version number 7 times → back to Settings → Developer options → "Extension install by crx" → pick `claude-perchance.crx` |
| **Firefox Nightly** | Yes (.xpi, unsigned is allowed) | Settings → About Firefox Nightly → tap the logo 5 times ("Debug menu enabled") → back to Settings → "Install add-on from file" → pick `claude-perchance.xpi` |
| **Iceraven**, **Fennec (F-Droid)** | Probably, same steps as Nightly (unverified) | Same as Firefox Nightly. If it refuses an unsigned file, set `xpinstall.signatures.required` to `false` in `about:config` |
| **Firefox (release/Beta)** | Only once the add-on is signed by Mozilla | Same menu as Nightly, but unsigned files are rejected |
| **Microsoft Edge (stable)** | No, Edge Add-ons store only | Needs a store listing |
| **Yandex, Vivaldi** | Chrome Web Store only | Needs a store listing |
| **Chrome** | No extensions on Android | – |
| **Kiwi** | Discontinued Jan 2025 | – |

#### Desktop

- **Chrome / Edge / Brave:** unzip `claude-perchance.zip`, open `chrome://extensions`, turn on **Developer mode**,
  click **Load unpacked**, pick the unzipped folder.
- **Firefox:** `about:debugging#/runtime/this-firefox` → **Load Temporary Add-on…** → pick `manifest.json`
  (removed on restart; Firefox Developer Edition/Nightly can install the unsigned .xpi permanently with
  `xpinstall.signatures.required` = `false`).

On Firefox (any platform), if images don't appear, open the add-on's permissions and allow it on claude.ai and perchance.org.

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
`node test/parse.test.js` runs the tag-parser tests. `./build.sh` makes the .zip and .xpi in `dist/`
(the .crx needs a signing key: `npx crx3 -p key.pem -o dist/claude-perchance.crx dist/ext`).

Files: `src/content.js` (finds tags on claude.ai), `src/render.html/js` (extension page that hosts the
Perchance frame so claude.ai's security policy can't block it), `rules.json` (lets Perchance load in a frame),
`perchance/` (code for your generator).
