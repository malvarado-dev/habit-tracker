// Copies the private art into assets/private/ (git ignores that folder), so the public repo never
// holds the art. Looks for the private bad-neko-art repo next to this one, or at ART_DIR.
// Any file it can't find gets a plain placeholder instead, so CI and the public web build still
// work without the art. Runs on install and before `npm start`; run `npm run art:sync` after
// pulling new art.

import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const artDir = resolve(process.env.ART_DIR ?? join(root, '..', 'bad-neko-art'));
const outDir = join(root, 'assets', 'private');
const placeholderDir = join(root, 'assets', 'placeholder');

// Every private file the app loads (src/scene/art.ts). Add new art here and in art.ts.
const FILES = [
  ['room/room-base.png', 'room.png'],
  ['room/bed-back.png', 'clear.png'],
  ['room/bed-front.png', 'clear.png'],
  ['pet/pet-cat-sit.png', 'pet.png'],
  ['pet/pet-cat-sit-eyes-closed.png', 'pet.png'],
  ['pet/pet-cat-sleep.png', 'pet.png'],
  ['pet/pet-cat-sleep-eyes-open.png', 'pet.png'],
  ['pet/pet-cat-walk.png', 'pet.png'],
  ['pet/pet-cat-walk-eyes-closed.png', 'pet.png'],
  ['icons/icon-food-bowl@1x.png', 'clear.png'],
  ['icons/icon-food-bowl@2x.png', 'clear.png'],
  ['icons/icon-food-bowl@3x.png', 'clear.png'],
  ['icons/icon-yarn-ball@1x.png', 'clear.png'],
  ['icons/icon-yarn-ball@2x.png', 'clear.png'],
  ['icons/icon-yarn-ball@3x.png', 'clear.png'],
  ['icons/icon-petting-hand@1x.png', 'clear.png'],
  ['icons/icon-petting-hand@2x.png', 'clear.png'],
  ['icons/icon-petting-hand@3x.png', 'clear.png'],
];

mkdirSync(outDir, { recursive: true });
let real = 0;
for (const [file, placeholder] of FILES) {
  const from = join(artDir, file);
  const to = join(outDir, basename(file));
  if (existsSync(from)) {
    copyFileSync(from, to);
    real++;
  } else {
    copyFileSync(join(placeholderDir, placeholder), to);
  }
}
console.log(
  real === FILES.length
    ? `Art: ${real} files from ${artDir}`
    : `Art: ${real} of ${FILES.length} found in ${artDir}; the rest are placeholders`,
);
