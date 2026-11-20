const assert = require("assert");
const { findTags } = require("../src/parse.js");

let t = findTags("Here you go:\n[[image: a red fox in snow]]\nEnjoy");
assert.strictEqual(t.length, 1);
assert.strictEqual(t[0].spec.prompt, "a red fox in snow");
assert.strictEqual(t[0].spec.resolution, "512x512");

t = findTags("[[image: castle at dusk | landscape | no: blurry, text]] and [[IMAGE:cat|512x768]]");
assert.strictEqual(t.length, 2);
assert.deepStrictEqual(t[0].spec, { prompt: "castle at dusk", negative: "blurry, text", resolution: "768x512", count: 1 });
assert.strictEqual(t[1].spec.resolution, "512x768");

assert.strictEqual(findTags("[[image: unfinished while streaming").length, 0);
assert.strictEqual(findTags("[[image:   ]]").length, 0);

t = findTags("[[image: dog | portrait]]", { resolution: "768x512", negative: "ugly" });
assert.strictEqual(t[0].spec.resolution, "512x768");
assert.strictEqual(t[0].spec.negative, "ugly");
t = findTags("[[image: knight | seed: 123 | guidance: 9 | portrait]]");
assert.strictEqual(t[0].spec.seed, 123);
assert.strictEqual(t[0].spec.guidance, 9);
assert.strictEqual(t[0].spec.prompt, "knight");
t = findTags("[[image: knight | guidance: 99 | seed: -1]]");
assert.strictEqual(t[0].spec.guidance, 30);
assert.strictEqual(t[0].spec.seed, -1);
assert.strictEqual(findTags("[[image: x]]")[0].spec.seed, undefined);
assert.strictEqual(findTags("[[image: x]]")[0].spec.count, 1);
assert.strictEqual(findTags("[[image: x | x4]]")[0].spec.count, 4);
assert.strictEqual(findTags("[[image: x | count: 8 | portrait]]")[0].spec.count, 8);
assert.strictEqual(findTags("[[image: x | images: 20]]")[0].spec.count, 8);
assert.strictEqual(findTags("[[image: x]]", { count: "4" })[0].spec.count, 4);
assert.strictEqual(findTags("[[image: x | 512x768]]")[0].spec.count, 1); // a size, not a count
console.log("parse tests passed");
// v0.2.3: minimum word count
assert.strictEqual(findTags("[[image: prompt]]", { minWords: 3 }).length, 0);
assert.strictEqual(findTags("[[image: ...]]", { minWords: 3 }).length, 0);
assert.strictEqual(findTags("[[image: prompt | portrait | no: ...]]", { minWords: 3 }).length, 0);
assert.strictEqual(findTags("[[image: a red fox in snow | portrait]]", { minWords: 3 }).length, 1);
assert.strictEqual(findTags("[[image: prompt]]").length, 1); // no minimum unless asked
console.log("v0.2.3 tests passed");
// v0.3.4: reference image
t = findTags("[[image: a knight on a hill | ref: https://example.com/A.jpg?x=1 | blur: 0.3]]");
assert.strictEqual(t[0].spec.ref, "https://example.com/A.jpg?x=1");
assert.strictEqual(t[0].spec.blur, 0.3);
assert.strictEqual(t[0].spec.prompt, "a knight on a hill");
assert.strictEqual(findTags("[[image: x | blur: 5]]")[0].spec.blur, 1);
assert.strictEqual(findTags("[[image: x | ref: http://insecure.example/a.jpg]]")[0].spec.ref, undefined);
console.log("v0.3.4 tests passed");
