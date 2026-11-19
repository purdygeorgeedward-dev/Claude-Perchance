const assert = require("assert");
const { findTags } = require("../src/parse.js");

let t = findTags("Here you go:\n[[image: a red fox in snow]]\nEnjoy");
assert.strictEqual(t.length, 1);
assert.strictEqual(t[0].spec.prompt, "a red fox in snow");
assert.strictEqual(t[0].spec.resolution, "512x512");

t = findTags("[[image: castle at dusk | landscape | no: blurry, text]] and [[IMAGE:cat|512x768]]");
assert.strictEqual(t.length, 2);
assert.deepStrictEqual(t[0].spec, { prompt: "castle at dusk", negative: "blurry, text", resolution: "768x512" });
assert.strictEqual(t[1].spec.resolution, "512x768");

assert.strictEqual(findTags("[[image: unfinished while streaming").length, 0);
assert.strictEqual(findTags("[[image:   ]]").length, 0);

t = findTags("[[image: dog | portrait]]", { resolution: "768x512", negative: "ugly" });
assert.strictEqual(t[0].spec.resolution, "512x768");
assert.strictEqual(t[0].spec.negative, "ugly");
console.log("parse tests passed");
