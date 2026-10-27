This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## How we work (any AI tool or person)

the project owner owns the project and makes every decision. He has no programming background: explain in plain words, and ask questions instead of guessing.

- **Plan first.** Before writing code, show a short plan and rate each decision Good, Risky or Bad. Wait for the project owner's go-ahead. Ask any questions before building.
- **Do only what's asked.** No extra fixes, refactors or reviews unless asked. Raise them as suggestions instead.
- **Tickets.** Show the project owner each new ticket before posting it to GitHub. Every ticket carries its design reference (Figma link or screenshot) and a Tests section (`.github/ISSUE_TEMPLATE/ticket.md`).
- **Branches and PRs.** One ticket, one branch, one PR against `main`. Fill in `.github/PULL_REQUEST_TEMPLATE.md`. Never merge, never push to `main`, never force-push. the project owner merges.
- **Done means checked.** `npm run check` and `npm run e2e` pass, and new tests cover the ticket's risks (`TESTING.md`). Tests must fail without the fix.
- **Art stays private.** Pet, room, Explore and icon art lives in the private `bad-neko-art` repo and is copied in by `scripts/sync-art.mjs` (git ignores `assets/private/`). Never commit art, screenshots of it, or paths to it into this public repo. Without the art repo the app shows plain placeholders; for visual bugs, rely on the project owner's screenshots and ask him to check on his phone.
- **Numbers live in one place.** Timings, effects, sizes, colors and positions go in `src/config/tuning.ts` (art-measured positions in `src/scene/room-layout.json`). No hardcoded colors or timings in screens; a test enforces it.
- **The pet is separate from the theme.** Room, pet and Explore art never change with Light or Dark theme.
- **Words.** Plain, natural wording in docs, tickets and PRs; no jargon status labels. Docs stay one page. Never use em dashes. Never name the outside apps used as design references; the themes are "Light theme" and "Dark theme". Docs and code say "pet", not "cat".
- **Commits.** Small, clear messages that say what changed and why.

## Public identity and privacy

Use the public handle or "the project owner" in public files, tickets, PRs, comments, and test reports. Do not publish personal names, personal email addresses, workplace details, or local account names. Keep private background in local, untracked notes instead. Use `$HOME` or placeholders for user-specific paths in public instructions; do not paste absolute paths from this machine.

Before committing, verify the Git author and committer use the approved public handle and GitHub-provided `noreply` email. Never copy an identity from old commits or override it with a personal email. Check public descriptions and screenshots before posting. Run `npm run privacy:check` before publishing tracked changes. This check detects personal email domains and local home paths; reviewing names and screenshot contents remains a manual check. Changing account settings does not remove old commit metadata. Never rewrite history or force-push without separate explicit approval.

## Starting or resuming work

Every contributor, including Codex and Claude, reads this file, `TESTING.md`, and the relevant issue and PR templates before creating or updating tickets, code, tests, or PRs. Do this again in a new chat or after a break; do not rely on chat memory or copy another ticket as the authority. Read the current issue and linked implementation decisions before continuing existing work.

## Issues and pull requests

- **Issue = agreed work.** Follow `.github/ISSUE_TEMPLATE/ticket.md`: risk, goal, design, scope, out of scope, numbered acceptance criteria, and planned tests mapped to those criteria. Suggest the needed Figma frame or screenshot for visual work. Record approved scope changes here before implementing them; distinguish current Prototype 2 decisions from historical Prototype 1 material.
- **PR = implementation and evidence.** Link the issue and follow `.github/PULL_REQUEST_TEMPLATE.md`. Briefly explain the resulting behavior and relevant implementation choices, dependencies or deviations. Report tests actually run, results, regression evidence, and outstanding phone checks. Do not copy or paraphrase the full scope, acceptance criteria, or test plan into a second checklist. Refer to issue criteria by number when useful.
- **Review once.** Keep requirements in the issue. The PR may use different wording to explain what changed, but must not introduce conflicting requirements. If implementation changes the agreement, update the issue and summarize the difference in the PR. Put detailed manual test steps in the issue once; the PR links to them and calls out anything still pending.
- **Before posting or updating.** Check the issue and PR against these files, including Design and Tests. Keep all applicable template sections; say why a check is not applicable rather than marking unrun tests as passed. Create regular PRs, not drafts, unless the project owner explicitly requests a draft. Never merge them.

## Testing

Follow `TESTING.md` when writing tickets and tests. New tickets use `.github/ISSUE_TEMPLATE/ticket.md`, including its Design and Tests sections.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md
