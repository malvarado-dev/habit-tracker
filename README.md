# Habit Tracker

A habit tracker where checking in takes seconds and a critter companion grows with you. Working name; the final name comes later.

**Status:** Stage 3 of 8, core-loop prototype. The earlier HTML prototype (v0) is saved under the tag [`v0-html`](../../tree/v0-html).

## Try it

- **Web:** https://malvarado-dev.github.io/habit-tracker/ (works on phones, tablets, and desktop)
- **Android:** open in Expo Go during development (`npm start`, then scan the QR code)

## Tech

Expo (React Native) with Expo Router, TypeScript in strict mode, Jest for unit tests. App rules (scores, ranks, weekly targets) live in plain TypeScript in `src/rules`, separate from the screens in `src/app`. Every interactive element has a test ID for Playwright (web) and Maestro (phones).

## Run it locally

```bash
npm install
npm start          # dev server; press w for web
npm run check      # lint, format, types, and tests
```

## Contributing

This is a personal portfolio project. Outside contributions are not accepted, and pull requests from other accounts are closed automatically. See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

The code is released under the [MIT License](LICENSE). Critter art, animations, the app name, and branding are not part of this repository and remain all rights reserved.
