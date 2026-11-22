# AI Horde

A free, community-run network: volunteers lend their computers, and your image waits in line for one of them.
It offers many models and can edit a picture. API: [aihorde.net/api](https://aihorde.net/api/).

- **Cost:** free. Volunteers are thanked in "kudos"; a registered key earns and spends kudos, which moves you up the line.
- **Account:** none. Without a key the extension uses the anonymous key `0000000000`, which waits longest.
  A free key comes from [aihorde.net/register](https://aihorde.net/register).
- **Settings:**
  - **AI Horde key (optional)**: paste your key, or leave it empty to stay anonymous.
  - **AI Horde models (optional)**: names separated by commas, or empty for whatever is free. **Show models**
    lists what volunteers are running now, busiest first; tap a name to add it.
- **Tag options:** sizes (rounded to multiples of 64), `no:`, `seed:`, `guidance:` (capped at 10), `x2`–`x8`
  (one job), `ref:` with `strength:`.
- **Editing a picture:** `[[image: the same car in the rain at night | engine: horde | ref: https://… | strength: 0.5]]`.
  The link must be a public `https://` picture.
- **Safety filter:** the extension asks for safe-for-work images. Images a worker blocks are left out; if every image
  is blocked the card says so.

## What the card shows

While you wait: "AI Horde: place 12 in line, about 40 s…". A job that waits more than 15 minutes stops with a
message and a **Try again** button (or falls back, if fallback is on).

## Troubleshooting

- **"no worker can make this":** the size or model isn't being served right now. Try a smaller size, or clear
  **AI Horde models (optional)**.
- **Long waits:** normal for anonymous use at busy times. A free key helps.
- **"too many requests":** the card waits and tries again by itself.

## Gallery

Images live in [`docs/gallery/ai-horde/`](../gallery/ai-horde/). Made from [the comparison set](comparison-prompts.md)
so they can be compared with the other engines.

_No images yet._
