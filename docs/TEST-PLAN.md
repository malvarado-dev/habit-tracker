# Prototype 2 Test Plan

How Prototype 2 (Bad Neko) gets judged. How we test is in [TESTING.md](../TESTING.md); this page says what is covered. Spec: SPEC-01 Prototype 2 Brief (Notion).

## Coverage by ticket

Unit tests sit next to the code in `src/` (`*.test.ts`). End-to-end specs are in `e2e/web/`.

| Ticket                                  | Top risk                                       | Unit                                                    | End to end                              | Manual                                  |
| --------------------------------------- | ---------------------------------------------- | ------------------------------------------------------- | --------------------------------------- | --------------------------------------- |
| P2-08a Logging and rings                | A tap logs wrong or Undo loses a log           | `rules/ring`, `rules/sheet`, `tracker/state`            | `logging`                               | Tap feel on phone                       |
| P2-08b Slide actions, linked bad habits | Skip moves the bar; wrong chip shows           | `rules/linked`, `components/menuSwipe`                  | `slide`                                 | Slide feel on phone                     |
| P2-08c Coins from logs                  | Coins can be farmed or lost on Undo            | `rules/coins`                                           | `coins`                                 | Coin bar animation and sound            |
| P2-09 Bad habits tray                   | A slip moves the Activity Bar                  | `rules/badHabits`                                       | `bad-habits`                            | Tray reads as separate from good habits |
| P2-10 Design 1 / Design 2 toggle        | Switching loses or changes logs                | `tracker/designToggle`, `rules/design`                  | `design-toggle`                         | None                                    |
| P2-11 Pet idle motion, P2-11b bounce    | Motion stutters or looks stiff                 | `scene/petMotion`                                       | `pet-motion`                            | Idle recording                          |
| P2-12 Pet spots and wake rule           | Pet in the wrong spot or wakes on a slip       | `rules/petPlace`, `scene/roomGeometry`                  | `pet-spots`                             | Spots look right on phone               |
| P2-13 Stats: Love and Confidence        | Stats touch Real data from Test mode           | `rules/petStats`                                        | `pet-stats`                             | None                                    |
| P2-14 Activity Bar payoff               | A full bar doesn't play, or blocks a log       | `rules/activityBar`, `rules/payoff`, `scene/petMoments` | `activity-payoff`                       | Moment recording                        |
| P2-15a Pet looks                        | Overlays don't snap on every look              | `scene/petLookData`                                     | `pet-looks`                             | Bandages on all three cats              |
| P2-15 Heal Neko quest                   | Quest counts wrong days or never ends          | `rules/quest`, `components/mainQuestText`               | `heal-quest`                            | Quest card states read clearly          |
| P2-16 Explore                           | Explore offered twice or pet never comes home  | `rules/explore`, `rules/sky`                            | `explore`                               | Explore recording, day and night        |
| QA #113 Accessibility                   | Serious axe problems come back                 | None                                                    | `accessibility`                         | Screen reader spot check                |
| All: user data                          | Logs lost on reload; Test data leaks into Real | `tracker/save`, `rules/dayOnScreen`, `rules/locking`    | `user-data`, `history`, `history-edits` | Use it for real every day               |

## Gaps

Listed here, not fixed. Each becomes its own ticket if we want it.

- No review recording yet for the Activity Bar moment or Explore. `e2e/recordings/pet-motion.record.ts` only covers idle and the reaction.
- Heal quest and pet looks each have one end-to-end journey. Enough for now; add more only if a bug shows up.

## Recordings for the quality-bar review

Run `npm run e2e:record`. Videos save to `test-results/` and stay on the local machine; they show private art, so they never go in this repo.

1. Idle: pet breathing and blinking, then a reaction (exists)
2. One moment: a full Activity Bar plays one event (needs a recording)
3. Explore: the neighborhood loop with each cat (needs a recording)

## Playtest checklist

For SPEC-01 questions 1 to 3 and 6. Use it for real for a week, then answer each. Notes go in the Notion Playtest Notes database.

| #   | Question                       | Watch for                                               | Pass                                                                |
| --- | ------------------------------ | ------------------------------------------------------- | ------------------------------------------------------------------- |
| 1   | Is there a clear finish line?  | Do I know when today is done without thinking?          | I stop logging because the bar says I'm done, not because I gave up |
| 2   | Do I want to come back?        | Do I open it the next day without a reminder?           | I open it on my own most days of the week                           |
| 3   | How long does a check-in take? | Time from opening the app to closing it                 | Under 30 seconds on a normal day                                    |
| 6   | Is code animation enough?      | Does the pet feel alive next to the Duolingo/Finch bar? | Nothing looks stiff or cheap in the three recordings                |
