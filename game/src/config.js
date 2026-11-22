// Ember Sigil Duel — card definitions and balance.
// Four original suits, told apart by colour AND shape (never text alone):
//   Ember  ▲  orange-red flame   Frost ❄  ice blue snowflake
//   Thorn  ✿  leaf green bloom    Tide  ≋  teal wave
export const SUITS = {
  ember: { name: 'Ember', glyph: '▲', color: '#ff7a3c', dark: '#a83208' },
  frost: { name: 'Frost', glyph: '❄', color: '#7fd4ff', dark: '#0e5a8a' },
  thorn: { name: 'Thorn', glyph: '✿', color: '#8fe388', dark: '#1f6b2a' },
  tide: { name: 'Tide', glyph: '≋', color: '#5fe3d0', dark: '#0d6e63' },
};

export const MAX_HP = 30;
export const START_HAND = 5;
export const START_MANA = 3;
export const MAX_MANA = 10;
export const HAND_LIMIT = 10;
export const DECK_SIZE = 30;

// Every card: id, name, suit, mana cost, and its effect numbers.
//   dmg      — damage to the enemy (reduced by their shield and by Chill)
//   shield   — block gained (absorbs damage until your next turn)
//   heal     — HP restored (never above max)
//   draw     — cards drawn right away
//   chill    — the enemy's next attack loses this much damage
//   emberDmg — extra damage when an Ember card was already played this turn
//   emberShield — extra shield when an Ember card was already played this turn
//   thornDmg — extra damage when you took damage on the enemy's last turn
export const CARDS = [
  { id: 'ember-strike', name: 'Ember Strike', suit: 'ember', cost: 1, dmg: 4, text: 'Deal 4 damage.' },
  { id: 'flame-burst', name: 'Flame Burst', suit: 'ember', cost: 3, dmg: 8, emberDmg: 3, text: 'Deal 8 damage. +3 if Ember was played.' },
  { id: 'ember-guard', name: 'Ember Guard', suit: 'ember', cost: 2, shield: 8, emberShield: 4, text: 'Gain 8 Shield. +4 if Ember was played.' },
  { id: 'frost-shard', name: 'Frost Shard', suit: 'frost', cost: 1, dmg: 2, chill: 3, text: 'Deal 2 damage. Chill 3: the foe’s next attack loses 3 damage.' },
  { id: 'frost-nova', name: 'Frost Nova', suit: 'frost', cost: 2, dmg: 3, chill: 3, text: 'Deal 3 damage and Chill 3.' },
  { id: 'frostbite', name: 'Frostbite', suit: 'frost', cost: 3, dmg: 5, chill: 5, text: 'Deal 5 damage and Chill 5.' },
  { id: 'thorn-lash', name: 'Thorn Lash', suit: 'thorn', cost: 2, dmg: 5, thornDmg: 3, text: 'Deal 5 damage. +3 if you were hurt last turn.' },
  { id: 'thorn-wall', name: 'Thorn Wall', suit: 'thorn', cost: 1, shield: 6, text: 'Gain 6 Shield.' },
  { id: 'thorn-bloom', name: 'Thorn Bloom', suit: 'thorn', cost: 3, dmg: 4, heal: 4, text: 'Deal 4 damage and restore 4 HP.' },
  { id: 'tide-surge', name: 'Tide Surge', suit: 'tide', cost: 2, draw: 2, text: 'Draw 2 cards.' },
  { id: 'tide-mend', name: 'Tide Mend', suit: 'tide', cost: 2, heal: 6, text: 'Restore 6 HP.' },
  { id: 'storm-sigil', name: 'Storm Sigil', suit: 'tide', cost: 4, dmg: 6, draw: 1, text: 'Deal 6 damage and draw 1 card.' },
];

// How many copies of each card go into a 30-card deck.
export const DECK_LIST = [
  ['ember-strike', 4],
  ['flame-burst', 2],
  ['ember-guard', 2],
  ['frost-shard', 3],
  ['frost-nova', 2],
  ['frostbite', 2],
  ['thorn-lash', 3],
  ['thorn-wall', 3],
  ['thorn-bloom', 2],
  ['tide-surge', 3],
  ['tide-mend', 2],
  ['storm-sigil', 2],
];

export const AI_NAME = 'Raven';
export const AI_TITLES = ['the Ashen Duelist', 'the Frostbound', 'the Tidecaller'];

export function cardById(id) {
  return CARDS.find((c) => c.id === id);
}
