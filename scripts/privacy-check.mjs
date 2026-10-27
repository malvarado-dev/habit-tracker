// Public-content guard. Reports locations, never the matching private text.
import { execFileSync } from 'node:child_process';

const git = (...args) => execFileSync('git', args, { encoding: 'utf8' });
const staged = process.argv.includes('--staged');
const paths = git(
  ...(staged
    ? ['diff', '--cached', '--name-only', '--diff-filter=ACMR', '-z']
    : ['ls-files', '-z']),
)
  .split('\0')
  .filter(Boolean);
const privateEmail =
  /\b[A-Z0-9._%+-]+@(?:gmail|googlemail|yahoo|hotmail|outlook|icloud|aol|protonmail|proton)\.(?:com|me)\b/i;
const homePath = /(?:[A-Z]:[\\/]Users[\\/]|\/(?:Users|home)\/)[^\s/\\$<>]+/i;
let failed = false;
for (const path of paths) {
  if (!/\.(?:md|txt|json|[cm]?js|tsx?|ya?ml|toml|sh)$/.test(path) && path !== 'LICENSE') continue;
  const content = git('show', `:${path}`);
  content.split('\n').forEach((line, index) => {
    if (!privateEmail.test(line) && !homePath.test(line)) return;
    console.error(`Privacy check: ${path}:${index + 1} contains a personal email or home path.`);
    failed = true;
  });
}
if (staged) {
  for (const kind of ['GIT_AUTHOR_IDENT', 'GIT_COMMITTER_IDENT']) {
    if (!/<[^>]+@(?:users\.noreply\.github\.com|noreply\.github\.com)>/.test(git('var', kind))) {
      console.error(`Privacy check: ${kind} must use a GitHub noreply email.`);
      failed = true;
    }
  }
}
if (failed) process.exitCode = 1;
else console.log('Privacy check passed. Manually review names and screenshot contents too.');
