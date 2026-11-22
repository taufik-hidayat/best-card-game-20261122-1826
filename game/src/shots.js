// Screenshot poses behind ?shot=title|play|win|loss&seed=N.
// Each pose is staged from the real rules (an autopilot plays real turns),
// then pinned to readable showcase numbers, so the frame is exactly what
// a short game really looks like and the same seed always gives it.
import { cardById } from './config.js';
import { drawCards } from './deck.js';
import { PHASE_TITLE, PHASE_PLAY, PHASE_WIN, PHASE_LOSS, createGame, startGame, playCard, endTurn, addLog } from './state.js';

/** Greedy autopilot: play the most damaging affordable card until none fits. */
function autopilotTurn(game) {
  let played = false;
  for (let guard = 0; guard < 12; guard += 1) {
    let best = -1;
    let bestDmg = -1;
    game.player.hand.forEach((id, i) => {
      const card = cardById(id);
      if (card.cost <= game.player.mana && (card.dmg || 0) + (card.shield || 0) > bestDmg) {
        bestDmg = (card.dmg || 0) + (card.shield || 0);
        best = i;
      }
    });
    if (best < 0) break;
    if (!playCard(game, best)) break;
    played = true;
  }
  return played;
}

function stagePlay(game) {
  startGame(game);
  for (let turn = 0; turn < 4 && game.phase === PHASE_PLAY; turn += 1) {
    autopilotTurn(game);
    endTurn(game);
  }
  if (game.phase !== PHASE_PLAY) return;
  // Refill both hands first, so the final turn has cards to play.
  drawCards(game.player, 5 - game.player.hand.length);
  drawCards(game.enemy, 5 - game.enemy.hand.length);
  // Make sure the table shows cards on both sides.
  if (game.playedThisTurn.length < 2) autopilotTurn(game);
  // Refill both hands after the autopilot spent them, so the frame shows a full hand.
  drawCards(game.player, 5 - game.player.hand.length);
  drawCards(game.enemy, 5 - game.enemy.hand.length);
  game.floaters.length = 0; // a posed frame shows no mid-flight numbers
  // Pin the showcase numbers: a close mid-game, readable at a glance.
  game.player.hp = 24;
  game.player.shield = 4;
  game.enemy.hp = 18;
  game.enemy.shield = 0;
  game.player.maxMana = 6;
  game.player.mana = 6;
  game.enemy.maxMana = 6;
  game.enemy.mana = 3;
  addLog(game, 'You play Thorn Lash — 5 damage.');
  addLog(game, 'Raven plans: Frostbite (5 damage + Chill 5).');
  addLog(game, 'Ember combo ready: play an Ember card, then Flame Burst.');
}

export function stageShot(name, seed) {
  const game = createGame(seed);
  if (name === 'play') {
    stagePlay(game);
    return game;
  }
  if (name === 'win') {
    startGame(game);
    game.phase = PHASE_WIN;
    game.enemy.hp = 0;
    game.player.hp = 14;
    game.player.shield = 6;
    game.turn = 7;
    addLog(game, 'You play Flame Burst — 11 damage. Raven falls! Victory is yours.');
    return game;
  }
  if (name === 'loss') {
    startGame(game);
    game.phase = PHASE_LOSS;
    game.player.hp = 0;
    game.enemy.hp = 9;
    game.turn = 8;
    addLog(game, 'Raven plays Storm Sigil — 6 damage. You fall. The sigils fade…');
    return game;
  }
  game.phase = PHASE_TITLE;
  return game;
}
