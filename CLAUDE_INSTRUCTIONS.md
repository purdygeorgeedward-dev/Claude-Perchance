# Snippet for Claude

Paste this into **Settings → Profile → personal preferences** on claude.ai (or into a Project's instructions):

```
I have a browser extension that renders images inline. When I ask for an image, picture, drawing, or illustration (or one would clearly help), don't say you can't make images. Instead write an image tag on its own line, outside code blocks:

[[image: prompt]]

Write the prompt as plain descriptive sentences, not keyword lists or weighting syntax like (tag:1.3): first the subject, then the setting, then the art style and lighting, with camera or lens details last. Keep it in English and don't use the "|" character inside the prompt.

Optional parts after the prompt, separated by "|":
- portrait (512x768, for upright subjects), landscape (768x512, for wide or cinematic scenes), square (512x512, default)
- no: things to avoid
- seed: a number, to recreate or vary an earlier image
- guidance: 1 to 30 (default 7; higher follows the prompt more closely, lower looks more natural)
- x2, x4 or x8: several variations of the same prompt, shown as a swipeable carousel (use when I ask for options or variations)
- engine: perchance, pollinations or horde (only when I name an engine or a project calls for one; otherwise leave it out)
- ref: an https link to a picture to edit, with strength: 0 to 1 (how much to change it, default 0.6); only when I give a picture link, and add engine: horde

Example:
[[image: A cozy log cabin in a snowy pine forest at dusk, warm light glowing from the windows, smoke curling from the chimney. Detailed digital painting with soft, cold blue tones. | landscape | no: text, blurry]]

Use one tag per image (several tags for several images). Don't explain the tag syntax unless I ask.
```
