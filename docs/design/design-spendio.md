---
version: alpha
name: Habit Tracker Spendio
description: A fresh, rounded system with white (or dark olive) pill cards, colored progress rings, and lemon accents, in light and dark modes, inspired by the Spendio Dribbble shot with AA fixes.
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
  energy-flag:
    size: 18px
    lightColor: "{colors.surface}"
    darkColor: "{colors.inverse}"
    placement: standing on top of the energy-bar at the S rank cutoff (90%), pole touching the bar
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
    backgroundColor: "{colors.inverse}"
    textColor: "{colors.on-inverse}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    size: 44px
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    height: 52px
  undo-bar:
    backgroundColor: "{colors.inverse}"
    textColor: "{colors.on-inverse}"
    typography: "{typography.body}"
    rounded: "{rounded.full}"
    padding: "{spacing.3}"
---

# Habit Tracker Spendio Design System

## Overview
A light, fresh take on Habit Tracker, inspired by the Spendio Dribbble shot. The shared Background sits above, and white pill cards sit on a solid warm white habit sheet, and each habit has its own color shown in its icon and progress ring. The tone stays playful, cozy, and rewarding. It must never feel game-loud, guilt-driven, or cluttered. Spendio's very light gray text and thin small type failed contrast, so both are fixed here.

## Colors
The sky belongs to the shared Background (background.md), not this theme; this theme covers the habit sheet, cards, text, and Energy bar. Cards stay white so habit colors pop. Dark mode (tokens ending in -dark) swaps the sheet to olive-charcoal and the cards to dark olive pills with a 1 px border-dark edge (3:1 on the sheet, since the card itself is only 1.3:1), with brighter habit and score colors that pass AA on dark; lemon and the critter stay the same. Each habit color is a mid-tone, not a pastel, so its ring passes 3:1 on white; pale tints of it fill the icon circle. Lemon primary is Spendio's signature; it is only ever used on the dark inverse color or with dark text on top, because lemon on white is about 1.2:1. Score labels use deep pink, green, and amber at 5:1 or better on white, and their stars use brighter versions that pass 3:1. Score needed stars are outlined and Not today stars are filled gray, so the two states differ by shape, not just shade.

## Typography
Urbanist: geometric and friendly, matching Spendio's wide, airy letters. Thin weight (300) only at display size and above; everything 16 px and below is 500 to 700, because Spendio's thin small text was hard to read. Nothing goes below 12 px.

## Layout
4-point spacing. Pill cards are 12 px apart with 12 px padding. The habit sheet has 16 px padding. Comfortable density with plenty of air.

## Elevation & Depth
Depth comes from light, not dark: cards use a soft, warm, low shadow (0 4px 14px at 8% plus 0 1px 2px at 6%) and a hairline border. The habit sheet is a solid warm white (#FBFAF5); a see-through sheet let the critter body show through and muddied the cards. No heavy dark shadows.

## Shapes
Fully rounded everything: pill cards, chips, buttons, the Energy bar, and the Undo bar. The habit sheet uses 28 px top corners. Icons sit in circles inside their progress ring.

## Components
The Habit Card is a white pill: a progress ring with the habit icon inside, the name, the status slot, and three stars on the right. The ring fills for each day this week scored Started, On track, or Nailed it, in the habit's color; screen readers hear "3 of 4 this week." The ring is the default; progress bubbles under the name are a Settings option being tested. Not today turns the card light gray and shows filled gray stars. The Energy bar is a dark pill with a smooth lemon fill and a checkered flag, no handle. The fill is today's score, so every star moves it, and a full bar means 3 stars on everything that counts today. The flag is an 18 px pole and checker in card white and inverse dark, standing on the bar at the S rank cutoff (90%) like a finish line. On a Rest day the bar shows full. Chips are white pills that turn dark when selected. The primary button is a lemon pill with dark text. The Undo bar is a dark pill. The habit sheet is fixed, with no grab handle; cards scroll inside it. The critter is not part of this theme: its look and colors come from the shared critter palette in critter.md, so a user's critter looks the same in every theme. The sky comes from the shared Background (background.md), not this theme.

## Do's and Don'ts
Do:
- Keep cards white and let habit colors live in the ring and icon.
- Use lemon only on dark or with dark text.
- Use weight 500 or more for any text 16 px and below.
- Show Score needed vs Not today by star shape, not shade alone.
- Keep tap targets at 44 px or larger.

Don't:
- Make it game-loud: no confetti spam, flashing, or fake streak urgency.
- Make it guilt-driven: Not today is a choice, never a failure.
- Let it get cluttered: no charts or extra numbers on Today.
- Use pale gray text on the gradient.
- Use pastel habit colors for rings; they fail contrast on white.
