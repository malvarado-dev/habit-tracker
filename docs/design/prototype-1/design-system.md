---
version: alpha
name: Habit Tracker Design System
description: A fresh, rounded system with white (or dark olive) pill cards, colored progress rings, and lemon accents, in light and dark modes with AA fixes.
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
  score-started: "#BE185D"
  score-started-star: "#EC4899"
  score-on-track: "#15803D"
  score-on-track-star: "#16A34A"
  score-nailed-it: "#B45309"
  score-nailed-it-star: "#D97706"
  star-score-needed: "#8E8E93"
  star-not-today: "#6B7280"
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
  score-started-dark: "#F9A8D4"
  score-on-track-dark: "#4ADE80"
  score-nailed-it-dark: "#FACC15"
  star-score-needed-dark: "#A3A396"
  star-not-today-dark: "#8E8E82"
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
  habit-card-not-today:
    backgroundColor: "{colors.surface-dim}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.full}"
    padding: "{spacing.3}"
  progress-ring:
    rounded: "{rounded.full}"
    size: 48px
  habit-icon:
    rounded: "{rounded.full}"
    size: 36px
  star-score-needed:
    textColor: "{colors.star-score-needed}"
    size: 18px
  star-not-today:
    textColor: "{colors.star-not-today}"
    size: 18px
    style: outlined, crossed out by a 2px diagonal slash (bottom left to top right)
  status-slot:
    typography: "{typography.label}"
  habit-sheet:
    backgroundColor: "{colors.surface-sheet}"
    rounded: "{rounded.2xl}"
    padding: "{spacing.4}"
  energy-bar:
    backgroundColor: "{colors.inverse}"
    rounded: "{rounded.full}"
    padding: 3px
    height: 14px
  energy-bar-fill:
    backgroundColor: "{colors.primary}"
    rounded: "{rounded.full}"
    height: 8px
  energy-bar-label:
    textColor: "{colors.on-surface}"
    typography: "{typography.habit-name}"
    weight: 700
    content: "Today" on the left (Today only), the percentage on the right
  energy-tick:
    width: 3px
    rounded: "{rounded.full}"
    color: "{colors.on-inverse}"
    passedColor: "{colors.on-primary}"
    placement: inside the energy-bar at the B, A, and S rank cutoffs (50, 75, 90%); the S tick runs 3px past the bar
  weekly-goal-met:
    textColor: "{colors.on-surface}"
    habitNameColor: the habit's color
    size: 19px
    weight: 700
    placement: centered under the energy-bar, plain text, no box
  menu-button:
    textColor: "{colors.on-surface}"
    rounded: "{rounded.full}"
    size: 44px
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

# Habit Tracker Design System

## Overview
A light, fresh look for Habit Tracker. The shared Background sits above, and white pill cards sit on a solid warm white habit sheet, and each habit has its own color shown in its icon and progress ring. The tone stays playful, cozy, and rewarding. It must never feel game-loud, guilt-driven, or cluttered. Very light gray text and thin small type fail contrast, so this system avoids both.

## Colors
The sky belongs to the shared Background (background.md), not this theme; this theme covers the habit sheet, cards, text, and Energy bar. Cards stay white so habit colors pop. Dark mode (tokens ending in -dark) swaps the sheet to olive-charcoal and the cards to dark olive pills with a 1 px border-dark edge (3:1 on the sheet, since the card itself is only 1.3:1), with brighter habit and score colors that pass AA on dark; lemon and the critter stay the same. Each habit color is a mid-tone, not a pastel, so its ring passes 3:1 on white; pale tints of it fill the icon circle. Lemon primary is the signature accent; it is only ever used on the dark inverse color or with dark text on top, because lemon on white is about 1.2:1. Score labels use deep pink, green, and amber at 5:1 or better on white, and their stars use brighter versions that pass 3:1. To do stars are outlined, and Skip stars are outlined and crossed out by a diagonal slash, so the two states differ by shape, not just shade. Danger (deep red, 6.5:1 on white; light red in dark, 5.8:1 on dark cards) is only for destructive actions like Remove habit, never for scores.

## Typography
Urbanist: geometric and friendly, with wide, airy letters. Thin weight (300) only at display size and above; everything 16 px and below is 500 to 700, because thin small text is hard to read. Nothing goes below 12 px.

## Layout
4-point spacing. Pill cards are 12 px apart with 12 px padding. The habit sheet has 16 px padding. Comfortable density with plenty of air.

## Elevation & Depth
Depth comes from light, not dark: cards use a soft, warm, low shadow (0 4px 14px at 8% plus 0 1px 2px at 6%) and a hairline border. The habit sheet is a solid warm white (#FBFAF5); a see-through sheet let the critter body show through and muddied the cards. No heavy dark shadows.

## Shapes
Fully rounded everything: pill cards, chips, buttons, the Energy bar, and the Undo bar. The habit sheet uses 28 px top corners. Icons sit in circles inside their progress ring.

## Components
The Habit Card is a white pill: a progress ring with the habit icon inside, the name, the status slot, and three stars on the right. The ring fills for each day this week scored Started, On track, or Nailed it, in the habit's color; screen readers hear "3 of 4 this week." The ring is the default; progress bubbles under the name are a Settings option being tested. Skip turns the card light gray and crosses out each outlined gray star with a diagonal slash. The Energy bar is a dark pill with a smooth lemon fill, with "Today" on the left and the percentage on the right above it, both in on-surface at the same size. Three thin ticks sit inside the bar at the B, A, and S rank cutoffs (50, 75, 90%); the S tick is a little taller. A tick is light on the dark track until the fill passes it, then dark on the lemon fill. No letters and no flag. The fill counts habits due today plus Any days habits still owed this week, so every counted star moves it the same amount; a habit whose weekly goal is already met doesn't move it. Crossing the S tick sweeps a shimmer across the fill; reaching 100% also brightens the fill briefly and pops a few sparkles off the end. Both are subtle, play only on an upward crossing, and reduce to the brighten with reduced motion. On a Rest day the bar shows full. When a habit's weekly goal is met, "Weekly goal met · Habit" fades in under the bar as plain text, 19 px bold, with the habit name in its habit color (every habit color passes 3:1 as large text on both sheets), and the bar gets a soft lemon glow. Text only fades, never scales, so it stays sharp. Chips and day buttons are pills on the card color; selected ones fill with the text color (on-surface) and use the sheet color for their label, so they are near-black in light and near-white in dark. The primary button is a lemon pill with dark text. The Remove habit button is a card-color pill with danger text. The Undo bar is a dark pill with a 1 px border, which keeps its edge visible on the dark sheet. The habit sheet is fixed, with no grab handle; cards scroll inside it. The critter is not part of this theme: its look and colors come from the shared critter palette in critter.md, so a user's critter looks the same in every theme. The sky comes from the shared Background (background.md), not this theme.

## Do's and Don'ts
Do:
- Keep cards white and let habit colors live in the ring and icon.
- Use lemon only on dark or with dark text.
- Use weight 500 or more for any text 16 px and below.
- Show To do vs Skip by star shape (plain outline vs outline with a slash), not shade alone.
- Keep tap targets at 44 px or larger.

Don't:
- Make it game-loud: no confetti spam, flashing, or fake streak urgency.
- Make it guilt-driven: Skip is a choice, never a failure.
- Let it get cluttered: no charts or extra numbers on Today.
- Use pale gray text on the gradient.
- Use pastel habit colors for rings; they fail contrast on white.
