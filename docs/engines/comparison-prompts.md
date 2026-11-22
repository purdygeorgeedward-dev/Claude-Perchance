# Comparison set

The same six prompts, drawn by every engine with the same seed, so the galleries can be compared side by side.
Paste the block below into a Claude chat with the extension on. Claude draws each prompt three times, once per engine.

```
Draw each of these six prompts three times: once with engine: perchance, once with engine: horde, once with engine: pollinations. Use seed: 4242 for all of them and keep the prompt text exactly the same.

1. [[image: A low, wide electric racing car with sharp carbon-fibre aero blades tearing around a wet night circuit, spray trailing from its rear wheels and white floodlights reflecting on the track. Detailed, sleek photoreal render with crisp highlights, shot from a low angle with a wide lens. | landscape | no: text, logos, blurry]]
2. [[image: An armoured racing motorbike leaning hard into a mountain hairpin at dawn, the rider in a matte black suit with orange stripes, gravel kicking up from the tyre. Cinematic photoreal style with warm low sunlight and motion blur on the background. | landscape | no: text, blurry]]
3. [[image: A portrait of a racing pilot in a sleek grey and orange flight suit, helmet under one arm, standing in a clean modern hangar with a jet behind them. Detailed digital painting with cool, even studio lighting, shot at eye level with an 85mm lens. | portrait | no: text, blurry]]
4. [[image: A futuristic city racetrack weaving between glass towers at sunset, sleek racers streaking along elevated tubes of clear glass, warm gold sky and long shadows. Highly detailed concept art with clean lines, wide establishing shot. | landscape | no: text, blurry]]
5. [[image: A powerful black panther with faint carbon-fibre patterned fur crouched on a rocky ridge in a storm, eyes glowing amber, rain streaking past. Dramatic detailed digital painting with cold blue lighting and a lightning flash behind. | portrait | no: text, blurry]]
6. [[image: A quiet alpine lake at first light, mirror-still water reflecting snowy peaks, a single wooden jetty leading into the mist. Soft detailed landscape painting with pale blue and gold tones, shot from the end of the jetty. | landscape | no: text, blurry]]
```

## Adding the images to the galleries

1. Open each image with **Full size**, then tap **Save**.
2. Send the saved images to Claude in the project thread, saying which engine made each one.
3. Claude names them by number and subject (for example `01-night-circuit.jpg`), puts them in
   `docs/gallery/<engine>/`, and adds them to that engine's gallery.
