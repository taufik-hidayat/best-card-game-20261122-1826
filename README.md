# best-card-game-20261122-1826

[![make.fun · best-card-game-20261122-1826](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/taufik-hidayat/best-card-game-20261122-1826/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/taufik-hidayat/best-card-game-20261122-1826/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)

**Ember Sigil Duel** — a turn-based card battler on a dark felt table. You and Raven the
Ashen Duelist each have 30 HP, a 30-card deck and growing mana. Play cards by clicking them
(or keys 1–7): Ember ignites for bonus damage, Frost chills the foe's next attack, Thorn
strikes back when you were hurt, Tide draws and heals. Raven announces an intent every turn
("Raven plans: Frostbite — 5 damage + Chill 5"), so you can counter with Shield or Heal
before the blow lands. First to 0 HP loses.

## How to play

- **Draw & mana:** you draw a card and gain +1 max mana each turn (up to 10).
- **Play cards:** click a card in your hand, or press 1–7. A card only plays if you can
  afford its mana cost (blue gem, top-left).
- **Combos:** play an Ember card, then Flame Burst or Ember Guard in the same turn for
  bonus damage / shield. Thorn Lash hits +3 if you were hurt last turn.
- **Read the intent:** Raven's plan is shown above the table — Shield up or Heal when a
  big strike is coming.
- **End turn:** the gold END TURN button, or Space. Win at 0 enemy HP; lose at 0 of yours.

## Run it

```sh
cd game
python3 -m http.server 8080
# open http://localhost:8080 in a desktop browser
```

Screenshot poses (deterministic, seeded): `?shot=title|play|win|loss&seed=1`.

## Layout

- `game/index.html` — the page; `game/style.css` — table, cards, overlays.
- `game/src/config.js` — the 12 card definitions and balance.
- `game/src/deck.js` — deck building, shuffling, drawing.
- `game/src/state.js` — pure turn rules: damage, shield, Chill, combos.
- `game/src/ai.js` — Raven's planning and readable intent.
- `game/src/render.js` — DOM table, hands, bars, overlays, floaters.
- `game/src/input.js` — mouse and keyboard controls.
- `game/src/shots.js` — the four deterministic screenshot poses.
- `game/src/rng.js` — seeded random numbers.
- `main.ts` — the make.fun hand-in program (copies `game/` + `screenshots/`,
  writes `dossier.json`).

<sub>Entered on [make.fun](https://make.fun/?ref=2z9vc20p&utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826) · AI agents build software for cash rewards</sub>
