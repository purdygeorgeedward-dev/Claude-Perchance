# Perchance

The original engine and still the default. Your own free generator page on perchance.org draws the image inside
the chat. Setup is in the [main README](../../README.md#setup-about-5-minutes).

- **Cost:** free.
- **Account:** a free Perchance account, so your generator can have a name (George's is `claude-perchance`).
- **Settings:** **Perchance generator name**.
- **Tag options:** sizes, `no:`, `seed:`, `guidance:` (1–30), `x2`–`x8`.
- **Can't do:** edit a picture. Perchance ignores reference pictures (tested 2026-11-19), so a tag with `ref:`
  uses AI Horde instead when fallback is on.
- **Style notes:** Perchance's model prefers plain descriptive sentences: subject, setting, style and lighting,
  then camera details.

## Troubleshooting

- **"Perchance generator didn't respond":** check **Perchance generator name** in settings, and open
  `perchance.org/<your-name>` once to make sure it saved.
- **Stuck on Cloudflare's "Starting..." check in Titanium:** Titanium's WebRTC protection blocks it. In Titanium,
  Settings > Privacy and security > WebRTC IP handling policy, change it away from "Disable non-proxied UDP"
  (confirmed by George on 2026-11-20).

## Gallery

All made by Claude with Perchance, inside the chat. Images live in [`docs/gallery/perchance/`](../gallery/perchance/).

<p>
<img src="../gallery/perchance/07-lighthouse-girl.jpg" width="32%" alt="A girl with a lantern by a lighthouse in a storm">
<img src="../gallery/perchance/02-storm-heroine.jpg" width="32%" alt="A superheroine in black and yellow flying through lightning">
<img src="../gallery/perchance/12-owl-griffin.jpg" width="32%" alt="A feathered griffin-like creature on black">
<img src="../gallery/perchance/03-jellyfish-diver.jpg" width="32%" alt="A diver among glowing jellyfish">
<img src="../gallery/perchance/04-mouse-burrow.jpg" width="32%" alt="A cosy candle-lit burrow with mice">
<img src="../gallery/perchance/05-koi-bridge.jpg" width="32%" alt="A koi fish over a red bridge in the snow, woodblock style">
<img src="../gallery/perchance/06-night-rider.jpg" width="32%" alt="A motorcyclist on a misty forest road">
<img src="../gallery/perchance/09-harbour-watercolour.jpg" width="32%" alt="A watercolour harbour with red houses under mountains">
<img src="../gallery/perchance/11-library-nook.jpg" width="32%" alt="A girl reading in a sunlit library nook with a cat">
<img src="../gallery/perchance/13-hovercraft.jpg" width="32%" alt="A red and black hovercraft racing at sunset">
<img src="../gallery/perchance/14-witch-flight.jpg" width="32%" alt="A witch on a broom over a lantern-lit harbour town">
<img src="../gallery/perchance/15-blacksmith.jpg" width="32%" alt="A woman forging at an anvil">
<img src="../gallery/perchance/16-retro-hacker.jpg" width="32%" alt="A hacker at a green-screen terminal in a cyberpunk city">
<img src="../gallery/perchance/17-elf-archer.jpg" width="32%" alt="An elf archer in a giant tree looking at a floating castle">
<img src="../gallery/perchance/18-space-pilot.jpg" width="32%" alt="A space pilot with a red scarf on a starship under a ringed planet">
<img src="../gallery/perchance/19-mech-pilot.jpg" width="32%" alt="A silver-haired pilot in armour beside a black and gold fighter">
<img src="../gallery/perchance/08-island-village.jpg" width="32%" alt="A tiny isometric island village with waterfalls">
<img src="../gallery/perchance/10-forest-droplet.jpg" width="32%" alt="A forest reflected in a dewdrop">
<img src="../gallery/perchance/20-anime-elf.jpg" width="32%" alt="An anime elf archer with silver hair sitting on a tree branch">
</p>

To compare engines on the same prompts, see [the comparison set](comparison-prompts.md).
