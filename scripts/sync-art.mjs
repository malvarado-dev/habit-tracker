// Copies the private art into assets/private/ (git ignores that folder), so the public repo never
// holds the art. Looks for the private bad-neko-art repo next to this one, or at ART_DIR.
// Any file it can't find gets a plain placeholder instead, so CI and the public web build still
// work without the art. Runs on install and before `npm start`. It pulls the art repo first
// (#129), and if the pull fails it warns and uses the art already there, so the app still starts.

import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
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
  // Pet looks (P2-15a): saved flat as tabby-gray-sit.png and so on.
  ['pet/tabby-gray/sit.png', 'pet.png'],
  ['pet/tabby-gray/walk.png', 'pet.png'],
  ['pet/tabby-gray/sleep.png', 'pet.png'],
  ['pet/tabby-grayreal/sit.png', 'pet.png'],
  ['pet/tabby-grayreal/walk.png', 'pet.png'],
  ['pet/tabby-grayreal/sleep.png', 'pet.png'],
  ['pet/accessories/bandage-tail.png', 'clear.png'],
  ['pet/accessories/bandage-leg.png', 'clear.png'],
  // Explore neighborhood layers (P2-16): saved as neighborhood-near.png and so on.
  ['explore/neighborhood-near.png', 'clear.png'],
  ['explore/neighborhood-mid.png', 'clear.png'],
  ['explore/neighborhood-far.png', 'clear.png'],
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

// Get the latest art. Skipped when there's no art repo (CI, the public web build).
if (existsSync(join(artDir, '.git'))) {
  try {
    execFileSync('git', ['pull', '--ff-only', '--quiet'], { cwd: artDir, stdio: 'pipe' });
  } catch (error) {
    const reason = String(error.stderr ?? error.message)
      .trim()
      .split('\n')[0];
    console.warn(`Art: couldn't pull ${artDir} (${reason}); using the art already there`);
  }
}

mkdirSync(outDir, { recursive: true });
let real = 0;
for (const [file, placeholder] of FILES) {
  const from = join(artDir, file);
  // Folder names become part of the file name, so tabby-gray/sit.png and tabby-grayreal/sit.png
  // don't collide. Top folders (pet/, room/, icons/) are dropped, as before.
  const to = join(outDir, file.split('/').slice(1).join('-'));
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
