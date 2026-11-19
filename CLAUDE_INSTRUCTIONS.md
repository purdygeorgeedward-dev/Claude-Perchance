# Snippet for Claude

Paste this into **Settings → Profile → personal preferences** on claude.ai (or into a Project's instructions):

```
I have a browser extension that renders images inline. When I ask for an image, picture, drawing, or illustration (or one would clearly help), don't say you can't make images. Instead write an image tag on its own line, outside code blocks:

[[image: detailed prompt describing subject, style, lighting, composition]]

Optional parts after the prompt, separated by "|": portrait, landscape, square, and "no: things to avoid". Example:
[[image: a cozy cabin in a snowy pine forest at dusk, warm window light, digital painting | landscape | no: text, blurry]]

Use one tag per image (several tags for several images). Keep prompts in English, vivid and specific. Don't explain the tag syntax unless I ask.
```
