---
version: alpha
name: Background
description: The shared skies behind the critter, separate from every app theme; they change only with time of day (and later weather), never with the theme.
colors:
  day-top: "#F6D58E"
  day-mid: "#EBDD95"
  day-bottom: "#CFE6A2"
  day-sun: "#FFF4C2"
  day-cloud: "#FFFFFF"
  dusk-top: "#25344A"
  dusk-mid: "#4C4A63"
  dusk-low: "#9A6E6C"
  dusk-horizon: "#C9927A"
  dusk-moon: "#F3EBDD"
  night-top: "#262A55"
  night-mid: "#4A4880"
  night-low: "#7C7FA0"
  night-horizon: "#A9BC8E"
  night-moon: "#F4F1FF"
  star: "#FFFFFF"
  day-sparkle: "#B45309"
  on-sky-day: "#1F1F1F"
  on-sky-dark: "#FFFFFF"
---

# Background

## Overview
The Background is the critter's world: the sky, sun or moon, clouds, and stars behind the critter on Today. Like the critter, it is separate from the app theme. Switching between the light and dark theme changes the sheet and cards only; the Background stays the same. It changes only with time of day (day, dusk, night) and, later, with live weather by city.

## Colors
Three skies, each a top-to-bottom gradient. Day: warm peach to soft lime with a pale sun and white clouds. Dusk: deep blue through dusty violet to a warm peach horizon with a soft moon and a few stars. Night: indigo to a muted green horizon with a cool moon and stars. Every critter body color must read clearly on all three skies. The menu button and status bar use on-sky-day text on the day sky and on-sky-dark on dusk and night, and must keep 3:1 contrast.

## Typography
None. The Background has no text besides the status bar.

## Layout
The Background fills the whole screen behind the habit sheet. The sun or moon sits upper right; clouds and stars stay in the top third so they never sit behind the critter's face.

## Elevation & Depth
Flat. No glows around the sun, moon, or critter (removed 2026-10-18); rank shows through sky brightness, star brightness, and the S-rank rays or moon bounce.

Rank moment (T15, 2026-10-19): once every due habit is scored, a one-time effect plays 2 seconds later and grows with the rank. C: the sun or moon pulses once. B: a bigger pulse with sparkles twinkling around it. A: the sky flashes brighter and sparkles burst out from the sun or moon. S: a bright flash, the sun's rays flare (day only), and sparkles shower across the sky. It replays only if a later change raises the rank, never on app open, never on a Rest day, and never takes touches. The flash brightens the sky only; the critter is drawn in front of it and stays solid. Sparkles are day-sparkle amber by day (3.5:1 on the day sky) and star white at dusk and night. Reduced motion: the sky brightens briefly, more at higher ranks, and nothing moves. Every value lives in tuning.moment.

## Shapes
Round sun, a crescent moon that opens to the right (so it never reads as the sun; decided 2026-10-19), pill-shaped clouds, tiny round stars, and four-point sparkles for the rank moment.

## Components
Sky (day, dusk, night), sun, crescent moon, cloud, star, rank-moment sparkle. Later: weather layers (rain, snow, fog) on top of the sky, driven by the user's city.

## Do's and Don'ts
Do:
- Keep the Background the same in every theme.
- Change it only with time of day and, later, weather.
- Check the critter and menu contrast on every sky.

Don't:
- Tie sky colors to a theme.
- Put stars or clouds behind the critter's face.
- Add text to the Background.
