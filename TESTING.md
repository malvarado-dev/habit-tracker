# Testing

Choose the smallest test that reliably catches the risk. Counts and ratios are not targets.
Before adding a case, check existing coverage. Reuse or extend it instead of repeating it.

## Choose the layer

| Layer                 | Purpose                                                                           | Tool                                   |
| --------------------- | --------------------------------------------------------------------------------- | -------------------------------------- |
| Unit                  | Rules, calculations, boundaries and reducer changes                               | Jest                                   |
| Component/integration | Real controls connected to state: taps, disabled states, labels, Undo and refresh | React Native Testing Library with Jest |
| Browser rendering     | Layout and theme appearance that need an actual browser                           | Playwright, marked `@rendering`        |
| E2E                   | Critical journeys across screens and persistence boundaries                       | Playwright                             |
| Native visual         | Android/iOS rendering, gestures, animation and feel                               | Device checks or native automation     |

Use unit cases for edge combinations. Use component/integration cases when the risk is how
controls and state work together. Mock platform plumbing, not the behavior being checked.
Read the installed testing library's `docs/guides/llm-guidelines.md` before component tests.

Every new E2E case must name the risk that a smaller test cannot cover. Keep it focused on a
critical journey. Do not repeat the same behavior in Light and Dark theme unless theme changes
that behavior. Use theme variants for rendering risks. Do not expand every case across every
theme, viewport and platform. Keep browser rendering checks separate from journey counts;
they still use the browser and do not prove native rendering.

## Regression and reliability

- New regression checks must fail with the relevant fix removed and pass with it. Record the
  observed failure, not just an assertion that the test would catch it.
- Test observable behavior, not source text or whole-tree snapshots. Source-text checks are
  allowed only for documented house rules. Keep visual checks focused and review baselines.
- Use independent fixtures and a fixed clock. No arbitrary sleeps. Advance time explicitly
  for timer behavior. Do not mock away the risk the test is meant to catch.
- Cover saved-count changes with a focused save/reload journey. Keep Real/Test isolation
  coverage where those boundaries are affected. Reuse existing coverage when sufficient.
- Remove or replace checks for removed behavior in the same change. Fix or remove flakes;
  retries expose them rather than turning them into a pass.
- Keep private art and screenshots of it out of the public repository and reports.

## Evidence and phone verification

The issue owns risks, planned layers, acceptance-criterion mapping and numbered manual steps.
The PR links to that procedure and reports actual results, fail-before/pass-after evidence,
skips and outstanding device checks. Count unit, component/integration, E2E and browser
rendering cases separately. Do not describe the combined Jest result as all unit tests or
the combined Playwright result as all E2E journeys.

Manual steps must state the setup, Test mode/design/theme, ordered actions and expected
results, including persistence. The PR supplies the unmerged branch and copyable commands
starting with `cd` to the project folder, plus Expo Go opening instructions.

Browser and JavaScript component tests cannot verify native text alignment or platform
rendering. Visual fixes require Android and iOS verification in the affected themes. Record
each platform as pending until checked. Owner screenshots can demonstrate failures; automated
web passes do not replace phone sign-off.

## Commands and locations

`npm run check` runs lint, formatting, types, unit and component/integration tests.
`npm run e2e` runs journeys and marked browser rendering checks. `npm run privacy:check`
is required before publishing. CI runs the same checks.

Unit cases live beside code in `*.test.ts`; component/integration cases use
`*.integration.test.tsx`. Browser cases live in `e2e/web`, with shared fixtures and page objects.
Review recordings from `npm run e2e:record` stay local because they can show private art.

References: [Practical Test Pyramid](https://martinfowler.com/articles/practical-test-pyramid.html),
[React Native testing](https://reactnative.dev/docs/testing-overview).
