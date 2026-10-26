# Testing

How this project tests. Every ticket and pull request follows these rules.

## 1. Test by risk

Each ticket names its top risks. Tests go after those first. A test that wouldn't catch a real bug doesn't get written.

## 2. The pyramid

| Layer             | What it covers                                                                         | Tool                 | How many                                   |
| ----------------- | -------------------------------------------------------------------------------------- | -------------------- | ------------------------------------------ |
| Unit              | Rules and math: Activity Bar, streaks, locking, the day on screen, pet spots, coins    | Jest                 | Most tests live here                       |
| End to end        | User journeys on the web build: log and undo, edit a day, add a habit, save and reload | Playwright           | A handful per feature, critical paths only |
| Manual and visual | Feel: animation, art, layout on a real phone                                           | Recordings, playtest | Every feel ticket                          |

## 3. Test behavior, not code text

A test checks what the app does, never that a file contains some text. The only exceptions are house rules (no hardcoded colors or timings in screens, the CI Playwright version, no `Link asChild`), and those say so at the top.

## 4. No timing waits in end-to-end tests

End-to-end tests use the fixed clock and Test tools, never a wait for something random. Animation timing is unit tested and judged by eye in recordings.

## 5. User data is always covered end to end

Saving, reloading, and keeping Real and Test data apart always have end-to-end tests. Losing someone's data is the worst bug a tracker can have.

## 6. Removed code takes its tests with it

When a feature goes, its tests go in the same pull request. No tests for dead code.

## 7. Flaky tests get fixed or deleted

A test that fails without a real bug is fixed or removed within one ticket. Retries in CI show flakes; they don't hide them.

## 8. Every ticket has a Tests section

It lists the unit, end-to-end and manual checks, and each one maps to an acceptance criterion. The issue template asks for it.

## Where things live

- Unit tests: next to the code, `*.test.ts`.
- End-to-end tests: `e2e/web`, with page objects in `e2e/web/pages` and test data in `e2e/web/fixtures.ts`.
- Review recordings: `npm run e2e:record` (local only, they show private art).
- CI runs everything on every pull request.
