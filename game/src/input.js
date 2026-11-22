// Keyboard and mouse input: click a card (or press 1–7) to play it,
// Space / Enter ends the turn, Enter starts or restarts from an overlay.
export function bindInput(game, actions) {
  document.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    const key = event.key;
    if (key >= '1' && key <= '7') {
      const index = Number(key) - 1;
      if (actions.onPlayCard(index)) event.preventDefault();
    } else if (key === ' ' || key === 'Enter') {
      if (game.phase === 'play') {
        actions.onEndTurn();
        event.preventDefault();
      } else if (key === 'Enter') {
        actions.onStart();
        event.preventDefault();
      }
    }
  });
}
