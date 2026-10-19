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
Built from interchangeable parts: a body shape (dome, drop, bean), eyes (dots, ovals, arcs), and a mouth that changes with mood (asleep, okay, happy, delighted). Personality can be data, like blink speed or bounce size, with no new art.

## Components
Idle motion is subtle: slow breathing, a blink every few seconds, and an occasional glance. A tap plays a small wiggle. The first check-in wakes the critter with a small hop and stretch, and it hops a little on each score. The mouth follows the live rank: okay below B, happy at B and A, delighted at S. No glow or halo around the critter (removed 2026-10-18). Reduced motion keeps blinking and breathing at half strength, and turns off glancing, hops, and the wiggle. In the app, parts are assembled in code or Rive, never as AI-generated images.

## Do's and Don'ts
Do:
- Keep the critter flat and simple.
- Keep the same critter across every theme.
- Let mood show through the face and motion.

Don't:
- Tie critter colors to a theme.
- Add legs, outlines, or shading.
- Use generated images for critters.
