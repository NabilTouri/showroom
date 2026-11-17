// Patches the original src/car/textures.js so grain() draws from the same seeded generator as
// the current app (see prepare.sh). Idempotent.
import fs from 'node:fs';

const file = process.argv[2];
let src = fs.readFileSync(file, 'utf8');
if (!src.includes('__seededRandom')) {
  const prng = `
let __seed = 0;
function __seededRandom(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
`;
  const replace = (from, to) => {
    if (!src.includes(from)) throw new Error(`pattern not found: ${from}`);
    src = src.replace(from, to);
  };
  replace("import * as THREE from 'three';", `import * as THREE from 'three';\n${prng}`);
  replace('const layers = [];', 'const layers = []; const random = __seededRandom(++__seed);');
  replace('a[i] = Math.random();', 'a[i] = random();');
  fs.writeFileSync(file, src);
}
