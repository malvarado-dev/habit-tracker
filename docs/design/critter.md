---
version: alpha
name: Critter
description: The shared critter palette and parts, separate from every app theme, so a user's critter looks the same in any theme.
colors:
  body-sunny: "#FFC400"
  body-sky: "#2F9BFF"
  body-mint: "#3CCB6E"
  body-pink: "#FF6FA5"
  body-tangerine: "#FF8A3D"
  body-violet: "#9B6BFF"
  ink: "#1F1F1F"
  mouth: "#FF4D3A"
components:
  critter:
    backgroundColor: "{colors.body-sunny}"
    textColor: "{colors.ink}"
---

# Critter

## Overview
The critter is its own system, separate from the app theme. A theme supplies the sky and the cards; the critter supplies its own body, face, and colors. A user's critter looks the same whichever theme they use. Sunny yellow is the default for the prototype and for comparing themes.

## Colors
Six body colors (sunny, sky, mint, pink, tangerine, violet), one ink color for the eyes and mouth, and one mouth color for the tongue. Every theme must look good behind every body color, in day and night skies; that check belongs to the theme.

## Typography
None. The critter has no text.

## Layout
The critter sits in the Background, centered, rising from the bottom of the screen with its face above the habit sheet. Its body runs off the bottom of the screen, so it never needs legs or a bottom edge.

## Elevation & Depth
Flat. No outlines, shading, or shadows.

## Shapes
Built from interchangeable parts: a body shape (dome, drop, bean), eyes (dots, ovals, arcs), and a mouth that changes with mood (asleep, flat, smile, big). Personality can be data, like blink speed or bounce size, with no new art.

Every body shares the same anchor points (top of head, face, neck, waist). Each anchor carries its own scale, position, and angle per body, so an item attached to it fits every body without new art. Items can be resized and recolored as data. Eyes are a separate part with a face layout (two eyes at launch; one eye possible later). Face items such as glasses and masks carry fit tags (for example, "two eyes" or "two eyes, one eye"), and the shop and closet only show items that fit the critter being dressed.

## Components
Idle motion is subtle: slow breathing, a blink every few seconds, and an occasional glance. A tap plays a small wiggle. The mouth follows the live rank (decided 2026-10-19): flat at C, a closed smile at B, a big open smile at A and S. At C, and before the first check-in, the critter is asleep whenever the app opens, with closed eyes and Zs drifting up beside its head; tapping it or scoring any habit wakes it with a small hop and stretch, and closing the app while still at C puts it back to sleep. A Rest day is awake with a flat mouth. It hops a little on each score, and hops bigger for the rank moment (once at C and B, twice at A, one big jump at S). The body keeps going well below its box (bodyExtension), so no hop ever shows its bottom edge. History (PRD-05, decided 2026-10-19) uses the same parts as day snapshots: C shows the sleeping critter (closed eyes, no Zs), B the closed smile, A and S the big smile. History tells A from S on the calendar cell (a lemon fill on S days), not on the critter. A Rest day in History shows the word "Rest" and no critter. Cheeks and other extras are gamification customizations, not rank faces. No glow or halo around the critter (removed 2026-10-18). Reduced motion keeps blinking and breathing at half strength, holds the Zs still, and turns off glancing, hops, and the wiggle. In the app, parts are assembled in code or Rive. Every asset is art-directed against this guide and reviewed before it ships; nothing should look generic or AI-generated.

## Do's and Don'ts
Do:
- Keep the critter flat and simple.
- Keep the same critter across every theme.
- Let mood show through the face and motion.
- Attach every item to a shared anchor point.

Don't:
- Tie critter colors to a theme.
- Add legs, outlines, or shading.
- Ship art that looks AI-generated.
