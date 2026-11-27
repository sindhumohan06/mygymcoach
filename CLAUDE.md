# My Gym Coach

A personal workout app for working towards a first pull-up. It's used one-handed on a phone, mid-workout, added to the home screen.

## Layout

A static site with no build step and no dependencies to install. Plain `<script>` tags (not modules) load in order and share top-level names, so keep that order: three.js, `figure3d.js`, `exercises.js`, `app.js`.

- **`index.html`**: the page shell: meta tags, the `#app` container and the script tags.
- **`styles.css`**: theme tokens on `:root`, with the dark theme repeated under `prefers-color-scheme` and `[data-theme="dark"]`. Change both dark blocks together.
- **`figure3d.js`**: `View3D`, the three.js (r128, loaded from cdnjs) figure. Each animation in `E` has camera settings, keyframe poses (limbs solved with 2-bone IK) and a `muscles` map that colours body parts with `--m1` (primary) or `--m2` (secondary).
- **`exercises.js`**: `STEPS`, the workout in order. Each exercise has a name, the animation key `anim`, reps (`big` + `unit`), `sets`, `rest` seconds, the muscle key labels `mpl`/`msl`, `tips` (how to do it) and `mistakes` (`[mistake, fix]` pairs). The tips sheet renders both lists, so every exercise needs both. Keep `mpl`/`msl` in step with the animation's `muscles` map (`msl` is optional, for when nothing is coloured `m2`), and keep one tip or mistake per line.
- **`app.js`**: state and rendering. `S` is today's session, saved to localStorage under `pullup-coach-v1`; session history lives under `pullup-coach-history`, hang practice days under `pullup-coach-hangs`, the avatar under `pullup-coach-avatar`. `render()` rebuilds the whole screen as an HTML string on every change: welcome, workout, finished or hang practice.
- **`manifest.webmanifest`** and the PNG icons: the home-screen app.

## Workout screen

- **Set 1** of an exercise: a big 3D demo with the muscle key, then a compact card (name, "Set 1/3" chip, reps). While resting, a compact rest card with a small ring sits below it.
- **Set 2 on** (`.focus`): a full card with a centred chip and big reps, or a big rest ring with a "Set 2/3 next" chip. The card is only as tall as its content, and the demo takes the remaining height (at least 100px).
- **Done** logs the set and starts the rest timer.
- **Voice:** `say()` speaks via speechSynthesis: "10 seconds" before a rest ends, then what's next (`nextLine()`), and a line at the finish. `spoken()` turns `big`/`unit` into speakable text, so check it when adding new rep formats. iOS needs `unlockAudio()` (called on taps) to prime speech.

## Hang practice

A second home-screen button runs easy grip hangs on their own, any day: `HANG` sets 10 rounds of 10 s hanging and 20 s resting, after an 8 s get-ready. The `hang` object holds the running session in memory only (not saved), and the voice counts down "3, 2, 1" into each hang. Finishing, or leaving after half the rounds, logs the day in `hangs`. The calendar marks those days with a dot, separate from workout days, and they don't count towards the week.

## Design rules

The owner has set these. Keep to them unless asked otherwise.
- **Colour:** black and white only, via `--accent` (black in light mode, white in dark). The only colours are the muscle highlights (`--m1`, `--m2`), the confetti that reuses them, and the resistance band (`--band`).
- **Separation:** no borders on cards, chips, pills or icon buttons. Separate things by fill colour (`--surface` on `--bg`). Buttons need `border:0`, or the browser default border shows.
- **Labels:** no small decorative labels; the owner doesn't read them. Prefer short forms like "3/9" and "Set 2/3".
- **Counts:** build "n/total" with `frac()` so screen readers hear "n of total", and build set chips with `chip()`.
- **Layout:** design for a phone in portrait, including short screens (568px tall). Check light and dark mode.

## Checking changes

There are no tests. Serve the folder and screenshot it with Playwright:

```sh
python3 -m http.server 8765   # then open http://localhost:8765/index.html
```

In cloud sessions, cdnjs is blocked, so the 3D demo shows a "needs a connection" message instead of the figure. That's fine for layout checks.

## Git

Work on a branch, not `main`. Commit messages are a short imperative summary ("Show the set number as a chip above the reps"), with a body when the reason isn't obvious.
