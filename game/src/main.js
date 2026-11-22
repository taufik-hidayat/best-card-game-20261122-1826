// Ember Sigil Duel — bootstrap. Interactive play, or a deterministic
// screenshot pose via ?shot=title|play|win|loss&seed=N.
import { createGame, startGame, playCard, endTurn, PHASE_TITLE, PHASE_PLAY } from './state.js';
import { renderTable, renderOverlay } from './render.js';
import { bindInput } from './input.js';
import { stageShot } from './shots.js';

const params = new URLSearchParams(window.location.search);
const seedParam = Number(params.get('seed'));
const seed = Number.isFinite(seedParam) ? seedParam : (Date.now() % 2147483647);
const shot = params.get('shot');

const root = document.getElementById('app');
const status = document.getElementById('status');

function announce(text) {
  if (status) status.textContent = text;
}

function render(game) {
  root.innerHTML = '';
  if (game.phase === PHASE_TITLE) {
    renderOverlay(root, game, () => {
      startGame(game);
      render(game);
      announce('The duel begins. Your move.');
    });
    return;
  }
  // Win / loss: the table stays visible behind the end overlay.
  renderTable(root, game,
    (index) => {
      if (playCard(game, index)) {
        render(game);
        announce(`Played ${game.playedThisTurn[game.playedThisTurn.length - 1]}.`);
        return true;
      }
      return false;
    },
    () => {
      endTurn(game);
      render(game);
      announce(game.phase === PHASE_PLAY ? 'Raven has moved. Your turn.' : 'The duel is over.');
    });
  if (game.phase !== PHASE_PLAY) {
    renderOverlay(root, game, () => {
      const fresh = createGame((seed + 1) % 2147483647);
      Object.assign(game, fresh);
      startGame(game);
      render(game);
    });
  }
}

if (shot) {
  // Deterministic pose: no animations, no input, one static frame.
  document.body.classList.add('shot');
  const game = stageShot(shot, seed);
  render(game);
} else {
  const game = createGame(seed);
  render(game);
  bindInput(game, {
    onPlayCard(index) {
      if (playCard(game, index)) {
        render(game);
        return true;
      }
      return false;
    },
    onEndTurn() {
      endTurn(game);
      render(game);
    },
    onStart() {
      if (game.phase === PHASE_TITLE) {
        startGame(game);
        render(game);
      } else if (game.phase !== PHASE_PLAY) {
        const fresh = createGame((Date.now() % 2147483647));
        Object.assign(game, fresh);
        startGame(game);
        render(game);
      }
    },
  });
  announce('Ember Sigil Duel. Press Enter to duel Raven.');
}
