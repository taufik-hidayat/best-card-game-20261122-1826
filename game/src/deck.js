// Deck building, shuffling, drawing and discarding.
import { DECK_LIST, HAND_LIMIT } from './config.js';
import { shuffle } from './rng.js';

/** A fresh 30-card deck (card ids), shuffled with rng. */
export function buildDeck(rng) {
  const deck = [];
  for (const [id, count] of DECK_LIST) {
    for (let i = 0; i < count; i += 1) deck.push(id);
  }
  return shuffle(deck, rng);
}

/**
 * Draw `n` cards from `pile.deck` into `pile.hand` (reshuffling the discard
 * pile when the deck runs out). Returns the ids actually drawn.
 */
export function drawCards(pile, n) {
  const drawn = [];
  for (let i = 0; i < n; i += 1) {
    if (pile.hand.length >= HAND_LIMIT) break;
    if (pile.deck.length === 0) {
      if (pile.discard.length === 0) break;
      pile.deck = shuffle(pile.discard.splice(0), pile.rng);
    }
    drawn.push(pile.deck.pop());
    pile.hand.push(drawn[drawn.length - 1]);
  }
  return drawn;
}

/** Move a card id from hand to the discard pile. */
export function discardCard(pile, id) {
  const index = pile.hand.indexOf(id);
  if (index >= 0) pile.hand.splice(index, 1);
  pile.discard.push(id);
}
