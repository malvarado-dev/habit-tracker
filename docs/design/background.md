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

## Shapes
Round sun and moon, pill-shaped clouds, tiny round stars.

## Components
Sky (day, dusk, night), sun, moon, cloud, star. Later: weather layers (rain, snow, fog) on top of the sky, driven by the user's city.

## Do's and Don'ts
Do:
- Keep the Background the same in every theme.
- Change it only with time of day and, later, weather.
- Check the critter and menu contrast on every sky.

Don't:
- Tie sky colors to a theme.
- Put stars or clouds behind the critter's face.
- Add text to the Background.
