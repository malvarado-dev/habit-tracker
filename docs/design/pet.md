---
version: beta
name: Pet
description: The pet's look, parts, colors, slots, and motion. Separate from every app theme, so a pet looks the same in any theme. The first pet is a rescue cat.
colors:
  coat-orange: "#E9A15B"
  coat-cream: "#F1E4CF"
  coat-white: "#F7F3EC"
  coat-black: "#3A3633"
  coat-gray: "#8E8B8A"
  coat-blue-gray: "#7F93A8"
  coat-brown: "#8A5A3B"
  coat-chocolate: "#5C3D2E"
  coat-cinnamon: "#B8754A"
  coat-fawn: "#D8B99A"
  coat-silver: "#C9CDD2"
  coat-golden: "#D9A45B"
  coat-lilac: "#B9A3C9"
  coat-mint: "#A8D5BA"
  coat-peach: "#F4B19A"
  ink: "#2B2622"
  nose: "#E58A8A"
  inner-ear: "#E8A0A0"
  blush: "#F08A9B"
---

# Pet

Status: colors and shapes are placeholders until the cat art is approved (see NEW Art Pipeline in Notion). Rules below are decided.

## Overview
The pet is its own system, separate from the app theme. A theme supplies the habit sheet and cards; the pet supplies its own body, face, and colors. The first pet is a rescue cat. Docs and code say "pet," not "cat," to leave room for other animals later. The pet is the star of the app: it must match the best companion and mascot apps on the market in art and animation. Cut scope, never quality.

## Colors
A curated coat palette: 12 natural colors (orange, cream, white, black, gray, blue-gray, brown, chocolate, cinnamon, fawn, silver, golden) and 3 playful ones (lilac, mint, peach). No free color picker. One ink color for eyes, mouth, and whiskers (never pure black). Every coat color must read clearly in the living room at every time of day; that check belongs to the living room.

## Typography
None. The pet has no text.

## Layout
The pet lives in the living room. Its spot follows Confidence: hiding behind the bed or under the couch (low), on the bed, on the couch or in the middle of the room (mid), on the window sill (high). Base pose: a three-quarter sit, body side-on facing right and head turned to the viewer. The sit shares one body with the walk.

## Elevation & Depth
Flat. No outlines. Depth comes from slightly darker shapes of the same color (inner ears, far legs, tail underside). No gradients or textures. One soft contact shadow sits under the paws and body; no other shadows.

## Shapes
Simple, organic, and huggable: soft tapering curves, gentle asymmetry, overlapping body masses. Structure matters: a clear head shape, short muzzle, cheeks, defined paws. Never a blob or balloon shape, never a stiff geometric toy.

Face: dot eyes with a colored iris and a small highlight, a small nose, a minimal mouth, thin whisker lines.

One rig for every pet:
- Breed (7, shown on screen as numbers): Domestic, Siamese, Persian, Bengal, Maine Coon, Ragdoll, Sphynx. Breeds are swappable parts (ears, tail, fur outline, face shape) plus pattern and color.
- Size: Skinny, Chunky, Dwarf (bone scaling; Dwarf is short legs only).
- Age: Kitten, Teen, Adult (face proportions and scale).
- Markings: Calico, Solid, Tabby. Calico and Tabby are off for Siamese, Bengal, and Ragdoll, which have their own pattern.
- Accents: belly, chin, face, and socks per paw.

Accessories attach to bones in 6 slots, so they move with the pet: Head (hats), Eyes (glasses), Mouth (mustaches), Neck (collars, bows, bandanas), Back (capes, wings), Paws (socks, boots, one per paw). Each item's pivot is its attach point. Items resize and recolor as data. Bandages are condition overlays (tail and leg), not slot items.

## Components
Expressions: neutral, happy, proud, surprised, shy, side-eye, smirk, gasp, sleepy, sick, guilty, annoyed, missed you. Eyes and mouth swap; ears and brows move with the expression.

Always-on motion: breathe, blink, ear twitch, tail flick. Idles for each spot. Activity Bar moments: eat (sometimes refuse or throw up), pounce on a toy (or ignore it), purr while petted (or a playful bite). Conditions: limp, sneeze, stinky lines, sleepy. Shared reactions are reused across events; key moments (Come Home, Major Events, each Daily Event's signature action) get unique animations.

Motion rules: anticipation before big moves, overshoot and settle, follow-through on ears and tail, held poses, the face acts in every reaction, no constant sine-wave bobbing, no even all-over scaling, loops with variation.

Personality as data: blink speed, bounce size, and idle timing are tunable values, not new art.

A sick or injured pet stays in good spirits. While the user is away, the pet gets stinky and misses them; it is never hurt by absence.

Reduced motion: no particles, bounces, or hops. The pet keeps blinking and breathes at half strength.

Animation: Prototype 2 uses whole-body motion on PNG layers (breathe, blink, small bounce) and a frame-by-frame walk for Explore. Not in Prototype 2: expressions, ear and tail motion. Moved to Rive only if chosen after Prototype 2. The pet is the only thing that may use Rive.

## Do's and Don'ts
Do:
- Keep the pet flat, organic, and simple, with real structure.
- Keep the same pet across every theme.
- Let mood show through the face and motion.
- Attach every accessory to a bone slot.

Don't:
- Tie pet colors to a theme.
- Add outlines, gradients, or shadows other than the contact shadow.
- Make it geometric, blobby, or balloon-like.
- Copy another artist's or app's characters, or use real brands in items.
- Ship art that looks AI-generated.
