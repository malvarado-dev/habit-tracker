---
version: beta
name: Bad Neko Design System
description: A fresh, rounded system with white (or dark olive) pill cards on a cream habit sheet, lemon accents, and an Activity Bar, in light and dark modes with AA fixes.
colors:
  surface: "#FFFFFF"
  surface-sheet: "#FBFAF5"
  surface-dim: "#EDEDED"
  on-surface: "#1F1F1F"
  on-surface-muted: "#5E5A52"
  border: "#ECE8DF"
  primary: "#F5F04A"
  on-primary: "#1F1F1F"
  inverse: "#1F1F1F"
  on-inverse: "#FFFFFF"
  habit-1: "#A855F7"
  habit-2: "#3B82F6"
  habit-3: "#15943F"
  habit-4: "#DB2777"
  habit-5: "#EA580C"
  habit-6: "#0D9488"
  habit-7: "#58900B"
  habit-8: "#6366F1"
  habit-9: "#0E7490"
  habit-10: "#BE123C"
  habit-11: "#A16207"
  habit-12: "#475569"
  habit-default: "{colors.habit-6}"
  ring-good: "#D97706"
  ring-bad: "#475569"
  ring-track: "#E6E2D9"
  tray-bad: "#ECE7F2"
  chip-dark: "#3A3633"
  danger: "#B91C1C"
  surface-dark: "#3A3D33"
  surface-sheet-dark: "#2A2C24"
  surface-dim-dark: "#26281F"
  on-surface-dark: "#F2F1EA"
  on-surface-muted-dark: "#C9C7B8"
  border-dark: "#73786A"
  track-dark: "#1A1B16"
  habit-1-dark: "#C084FC"
  habit-2-dark: "#60A5FA"
  habit-3-dark: "#4ADE80"
  habit-4-dark: "#F472B6"
  habit-5-dark: "#FB923C"
  habit-6-dark: "#2DD4BF"
  habit-7-dark: "#A3E635"
  habit-8-dark: "#818CF8"
  habit-9-dark: "#22D3EE"
  habit-10-dark: "#FB7185"
  habit-11-dark: "#FDE047"
  habit-12-dark: "#94A3B8"
  ring-good-dark: "#FACC15"
  ring-bad-dark: "#94A3B8"
  danger-dark: "#FCA5A5"
typography:
  display:
    fontFamily: Urbanist
    fontSize: 32px
    fontWeight: 300
    lineHeight: 1.1
    letterSpacing: -0.02em
  title:
    fontFamily: Urbanist
    fontSize: 22px
    fontWeight: 600
    lineHeight: 1.2
  habit-name:
    fontFamily: Urbanist
    fontSize: 17px
    fontWeight: 600
    lineHeight: 1.25
  body:
    fontFamily: Urbanist
    fontSize: 16px
    fontWeight: 500
    lineHeight: 1.5
  label:
    fontFamily: Urbanist
    fontSize: 13px
    fontWeight: 700
    lineHeight: 1.3
  caption:
    fontFamily: Urbanist
    fontSize: 12px
    fontWeight: 600
    lineHeight: 1.3
rounded:
  md: 12px
  lg: 20px
  xl: 24px
  2xl: 28px
  full: 9999px
spacing:
  1: 4px
  2: 8px
  3: 12px
  4: 16px
  6: 24px
  8: 32px
components:
  habit-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.habit-name}"
    rounded: "{rounded.full}"
    padding: "{spacing.3}"
  habit-icon:
    rounded: "{rounded.full}"
    size: 36px
    color: the habit's color (habit-default unless the user picks one)
  frequency-ring:
    track: "{colors.ring-track}"
    good: "{colors.ring-good}"
    bad: "{colors.ring-bad}"
    fill: clockwise from the top
    placement: around the habit icon, with the count (like "3/8") on the right of the card; on every habit with frequency on
  bad-habit-reveal:
    backgroundColor: "{colors.surface-dim}"
    textColor: "{colors.on-surface}"
    placement: revealed behind the card when it slides right; shows the linked bad habit name and a log button
  long-press-menu:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.xl}"
    items: Log [linked bad habit], Edit habit
  section-header:
    textColor: "{colors.on-surface-muted}"
    typography: "{typography.caption}"
    content: Today, Anytime
  bad-habits-tray:
    backgroundColor: "{colors.tray-bad}"
    rounded: "{rounded.xl}"
    padding: "{spacing.4}"
    content: "Bad habits" title, "Tap to count a slip" hint, and the bad habit chips
  bad-habit-chip:
    backgroundColor: "{colors.chip-dark}"
    textColor: "{colors.on-inverse}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    size: 44px
    content: name and a count badge; tap counts a slip, long-press opens the popover stepper
  count-badge:
    rounded: "{rounded.full}"
    zero: muted, shows 0
    above-zero: "{colors.primary}" with "{colors.on-primary}" text
    placement: always reserved on the chip, so the chip never changes width
  popover-stepper:
    backgroundColor: "{colors.inverse}"
    textColor: "{colors.on-inverse}"
    rounded: "{rounded.full}"
    content: minus, today's count, plus (lemon); points at its chip
    behavior: opens on long-press of a bad habit chip; tap outside to close
  habit-sheet:
    backgroundColor: "{colors.surface-sheet}"
    rounded: "{rounded.2xl}"
    padding: "{spacing.4}"
  activity-bar:
    backgroundColor: "{colors.inverse}"
    rounded: "{rounded.full}"
    padding: 3px
    height: 14px
  activity-bar-fill:
    backgroundColor: "{colors.primary}"
    rounded: "{rounded.full}"
    height: 8px
  activity-notch:
    count: 3
    placement: at one third, two thirds, and the end of the bar
    icons: full-color food bowl, yarn ball, and petting hand, sitting on the bar at the notches with bottoms aligned
    behavior: an icon rattles when the fill reaches its notch; when the bar is full, the chosen icon pops
  main-quest-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.xl}"
    padding: "{spacing.4}"
    placement: under the Activity Bar
    content: quest name, a progress line (like "3/7 Check in days"), and a progress bar
    behavior: tap opens Quests; a dot badge shows when a new quest is available
  history-link:
    textColor: "{colors.on-surface}"
    typography: "{typography.label}"
    placement: centered at the bottom of the habit sheet, underlined
    behavior: opens History
  explore-button:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    height: 52px
    placement: appears when the Activity Bar is full
  ad-card:
    backgroundColor: "{colors.surface-dim}"
    textColor: "{colors.on-surface}"
    borderColor: "{colors.border}"
    rounded: "{rounded.xl}"
    label: "Ad", always visible, styled unlike shop items
  menu-button:
    backgroundColor: see-through light fill over the room
    textColor: "{colors.on-surface}"
    rounded: "{rounded.full}"
    size: 44px
    placement: top left, over the room
  chip:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface-muted}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    size: 44px
  chip-selected:
    backgroundColor: "{colors.on-surface}"
    textColor: "{colors.surface-sheet}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    size: 44px
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    height: 52px
  button-remove:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.danger}"
    borderColor: "{colors.border}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    height: 52px
  undo-bar:
    backgroundColor: "{colors.inverse}"
    textColor: "{colors.on-inverse}"
    borderColor: "{colors.border}"
    borderWidth: 1px
    typography: "{typography.body}"
    rounded: "{rounded.full}"
    padding: "{spacing.3}"
---

# Bad Neko Design System

## Overview
A light, fresh, cozy look for Bad Neko. The living room sits behind, and white pill cards sit on a cream habit sheet with soft pill buttons. The tone stays playful, cozy, and rewarding, with a little mischief. It must never feel game-loud, guilt-driven, or cluttered. Very light gray text and thin small type fail contrast, so this system avoids both. Exact sheet and card colors are tuned in the Prototype 2 mockups.

## Colors
The room belongs to living-room.md and the pet to pet.md, not this theme; this theme covers the habit sheet, cards, text, Activity Bar, and controls. Cards stay white so the pet and habit icons pop. Dark mode (tokens ending in -dark) swaps the sheet to olive-charcoal and the cards to dark olive pills with a 1 px border-dark edge (3:1 on the sheet), with brighter habit and ring colors that pass AA on dark; lemon, the pet, and the room stay the same. Dark values for ring-track, tray-bad, and chip-dark are set in the mockups. Habit colors: a curated palette of 12 mid-tones that pass 3:1 on white; colors can repeat, and every habit uses habit-default until the user picks one. Lemon primary is the signature accent; it is only used on the dark inverse color or with dark text on top, because lemon on white is about 1.2:1. Rings fill gold for good logs and slate for linked bad logs on a light track. Bad habits sit in a lilac tray so they read apart from good habits and aren't tapped by mistake. Danger (deep red) is only for destructive actions like Remove habit.

## Typography
Urbanist: geometric and friendly, with wide, airy letters. Thin weight (300) only at display size and above; everything 16 px and below is 500 to 700. Nothing goes below 12 px.

## Layout
4-point spacing. Pill cards are 12 px apart with 12 px padding. The habit sheet has 16 px padding. Top to bottom on the sheet: Activity Bar, Main Quest card, Today section, Anytime section, Bad habits tray (only if the user added one), History link.

## Elevation & Depth
Depth comes from light, not dark: cards use a soft, warm, low shadow (0 4px 14px at 8% plus 0 1px 2px at 6%) and a hairline border. The habit sheet is solid; a see-through sheet muddies the cards. No heavy dark shadows.

## Shapes
Fully rounded everything: pill cards, chips, buttons, the Activity Bar, the popover stepper, and the Undo bar. The habit sheet uses 28 px top corners.

## Components
The Habit Card is a white pill: the habit icon in the habit's color and the name, and, on habits with frequency on, a ring around the icon that fills clockwise with the count on the right ("3/8"). Tap the card to log it. Slide it right to reveal its linked bad habit; long-press for a menu with Log [linked bad habit] and Edit habit. Each log plays a quick animation inside the card.

Bad habits live in a lilac tray under the habit cards. Each one is a dark chip with a count badge that always keeps its space: muted at 0, lemon above 0. Tap a chip to count a slip. Long-press opens a dark popover stepper (minus, count, plus) that points at the chip; tap outside to close.

The Activity Bar is a dark pill with a smooth lemon fill and 3 notches. Full-color icons sit on the bar at the notches (food bowl, yarn ball, petting hand), bottoms aligned. An icon does a quick rattle when the fill reaches its notch. A full bar is the day's check-in: the chosen icon pops, its moment plays in the room, and the Explore button appears. Subtle effects only, and they reduce to a brief brighten with reduced motion.

The Main Quest card sits under the Activity Bar and shows the active quest, a progress line ("3/7 Check in days"), and a bar. Tapping it opens Quests, and a dot badge shows when a new quest is available. Home has no separate Quests button. A centered "History" text link at the bottom of the sheet opens History. The menu button is a see-through round button at the top left, over the room.

The shop's ad card is always labeled "Ad" and styled unlike items. Chips and day buttons are pills on the card color; selected ones fill with the text color. The primary button is a lemon pill with dark text. The Remove habit button is a card-color pill with danger text. The Undo bar is a dark pill with a 1 px border. The habit sheet is fixed, with no grab handle; cards scroll inside it.

## Do's and Don'ts
Do:
- Keep cards white and let color live in the icon and ring.
- Use lemon only on dark or with dark text.
- Use weight 500 or more for any text 16 px and below.
- Show ring progress with the count text too, not color alone.
- Keep tap targets at 44 px or larger, and give every swipe and long-press a tap alternative.
- Label every ad as an ad.

Don't:
- Make it game-loud: no confetti spam, flashing, or fake streak urgency.
- Make it guilt-driven: bad habits never take anything away.
- Let it get cluttered: no charts or extra numbers on Today.
- Show ads in the habit layer or during a check-in.
- Use pastel habit colors; they fail contrast on white.
