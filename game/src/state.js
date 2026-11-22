// Game state and turn rules — pure logic, no DOM. The renderer reads this.
import { MAX_HP, START_HAND, START_MANA, MAX_MANA, cardById, AI_NAME } from './config.js';
import { buildDeck, drawCards, discardCard } from './deck.js';
import { makeRng } from './rng.js';
import { planAiTurn } from './ai.js';

export const PHASE_TITLE = 'title';
export const PHASE_PLAY = 'play';
export const PHASE_WIN = 'win';
export const PHASE_LOSS = 'loss';

export function makeFighter(name) {
  return {
    name,
    hp: MAX_HP,
    maxHp: MAX_HP,
    shield: 0,
    mana: START_MANA,
    maxMana: START_MANA,
    chill: 0, // incoming damage is reduced by this much, once
    deck: [],
    hand: [],
    discard: [],
    rng: null,
  };
}

/** A fresh duel. `seed` drives both decks and the AI. */
export function createGame(seed) {
  const rng = makeRng(seed);
  const game = {
    seed,
    rng,
    phase: PHASE_TITLE,
    turn: 1,
    player: makeFighter('You'),
    enemy: makeFighter(AI_NAME),
    playedThisTurn: [], // card ids the player played this turn, in order
    suitsThisTurn: new Set(),
    enemySuitsThisTurn: new Set(),
    hurtLastTurn: false,
    enemyHurtLastTurn: false,
    log: [],
    floaters: [], // { side, text, kind } — rendered as floating numbers
    lastAiCards: [], // cards the AI just played, shown on the table
    aiPlan: null, // { cards: [ids], summary: string, kind: 'attack'|'defend'|'heal' }
  };
  game.player.rng = rng;
  game.enemy.rng = rng;
  game.player.deck = buildDeck(rng);
  game.enemy.deck = buildDeck(rng);
  drawCards(game.player, START_HAND);
  drawCards(game.enemy, START_HAND);
  game.aiPlan = planAiTurn(game);
  addLog(game, `${AI_NAME} shuffles in. First to 0 HP loses — good luck, duelist.`);
  return game;
}

export function addLog(game, text) {
  game.log.push(text);
  if (game.log.length > 40) game.log.splice(0, game.log.length - 40);
}

function addFloater(game, side, text, kind) {
  game.floaters.push({ side, text, kind });
}

/** Damage after shield and Chill. Returns the HP actually lost. */
export function dealDamage(game, target, amount, sourceName) {
  if (amount <= 0) return 0;
  let remaining = amount;
  if (target.chill > 0) {
    const soaked = Math.min(target.chill, remaining);
    remaining -= soaked;
    target.chill -= soaked;
    addLog(game, `Chill soaks ${soaked} damage.`);
  }
  let blocked = 0;
  if (target.shield > 0 && remaining > 0) {
    blocked = Math.min(target.shield, remaining);
    target.shield -= blocked;
    remaining -= blocked;
  }
  target.hp = Math.max(0, target.hp - remaining);
  if (blocked > 0) addFloater(game, target === game.player ? 'player' : 'enemy', `-${blocked} shield`, 'shield');
  if (remaining > 0) addFloater(game, target === game.player ? 'player' : 'enemy', `-${remaining}`, 'damage');
  if (remaining > 0 && target === game.player) game.hurtLastTurn = true;
  if (remaining > 0 && target === game.enemy) game.enemyHurtLastTurn = true;
  if (target.hp === 0) {
    game.phase = target === game.enemy ? PHASE_WIN : PHASE_LOSS;
    addLog(game, target === game.enemy ? `${AI_NAME} falls! Victory is yours.` : 'You fall. The sigils fade…');
  }
  return remaining;
}

function healFighter(game, target, amount) {
  const healed = Math.min(amount, target.maxHp - target.hp);
  target.hp += healed;
  if (healed > 0) addFloater(game, target === game.player ? 'player' : 'enemy', `+${healed}`, 'heal');
  return healed;
}

/** Apply one card's effect for `owner` against `foe`. Assumes cost already paid. */
export function applyCard(game, owner, foe, card) {
  const playedSuits = owner === game.player ? game.suitsThisTurn : game.enemySuitsThisTurn;
  const emberActive = playedSuits.has('ember');
  let dmg = card.dmg || 0;
  if (card.emberDmg && emberActive) dmg += card.emberDmg;
  if (card.thornDmg && owner === game.player && game.hurtLastTurn) dmg += card.thornDmg;
  if (card.thornDmg && owner === game.enemy && game.enemyHurtLastTurn) dmg += card.thornDmg;
  let shield = card.shield || 0;
  if (card.emberShield && emberActive) shield += card.emberShield;

  if (dmg > 0) {
    dealDamage(game, foe, dmg, owner.name);
    const verb = owner.name === 'You' ? 'play' : 'plays';
    addLog(game, `${owner.name} ${verb} ${card.name} — ${dmg} damage.`);
  }
  if (shield > 0) {
    owner.shield += shield;
    addFloater(game, owner === game.player ? 'player' : 'enemy', `+${shield} shield`, 'shield');
    const verb = owner.name === 'You' ? 'gain' : 'gains';
    addLog(game, `${owner.name} ${verb} ${shield} Shield.`);
  }
  if (card.heal) {
    const healed = healFighter(game, owner, card.heal);
    const verb = owner.name === 'You' ? 'restore' : 'restores';
    addLog(game, `${owner.name} ${verb} ${healed} HP.`);
  }
  if (card.chill) {
    foe.chill += card.chill;
    addLog(game, `${foe.name} is Chilled (${card.chill}) — their next attack is weaker.`);
  }
  if (card.draw) {
    const drawn = drawCards(owner, card.draw);
    const verb = owner.name === 'You' ? 'draw' : 'draws';
    addLog(game, `${owner.name} ${verb} ${drawn.length} card${drawn.length === 1 ? '' : 's'}.`);
  }
}

/** The player plays the card at hand index `i`. Returns false when illegal. */
export function playCard(game, i) {
  if (game.phase !== PHASE_PLAY) return false;
  const id = game.player.hand[i];
  if (id === undefined) return false;
  const card = cardById(id);
  if (game.player.mana < card.cost) return false;
  game.player.mana -= card.cost;
  discardCard(game.player, id);
  game.playedThisTurn.push(id);
  game.suitsThisTurn.add(card.suit);
  applyCard(game, game.player, game.enemy, card);
  return true;
}

/** Start of the player's turn: draw, grow mana, clear old shield. */
export function beginPlayerTurn(game) {
  game.turn += 1;
  game.player.shield = 0;
  game.player.maxMana = Math.min(MAX_MANA, game.player.maxMana + 1);
  game.player.mana = game.player.maxMana;
  game.playedThisTurn = [];
  game.suitsThisTurn = new Set();
  drawCards(game.player, 1);
  addLog(game, `— Turn ${game.turn}: your move. ${game.player.mana} mana. —`);
}

/** The AI executes the plan it announced, then plans its next move. */
export function runAiTurn(game) {
  if (game.phase !== PHASE_PLAY) return;
  game.enemy.shield = 0;
  game.enemy.maxMana = Math.min(MAX_MANA, game.enemy.maxMana + 1);
  game.enemy.mana = game.enemy.maxMana;
  game.lastAiCards = [];
  game.enemySuitsThisTurn = new Set();
  const plan = game.aiPlan || { cards: [] };
  for (const id of plan.cards) {
    const card = cardById(id);
    if (!card || game.enemy.mana < card.cost) continue;
    if (!game.enemy.hand.includes(id)) continue;
    game.enemy.mana -= card.cost;
    discardCard(game.enemy, id);
    game.enemySuitsThisTurn.add(card.suit);
    game.lastAiCards.push(id);
    applyCard(game, game.enemy, game.player, card);
    if (game.phase !== PHASE_PLAY) break;
  }
  if (game.phase !== PHASE_PLAY) return;
  drawCards(game.enemy, 1);
  game.enemyHurtLastTurn = false;
  game.aiPlan = planAiTurn(game);
  beginPlayerTurn(game);
}

/** End the player's turn: the AI acts, then a new player turn begins. */
export function endTurn(game) {
  if (game.phase !== PHASE_PLAY) return;
  addLog(game, 'You end your turn.');
  game.hurtLastTurn = false;
  runAiTurn(game);
}

export function startGame(game) {
  game.phase = PHASE_PLAY;
  addLog(game, `— Turn 1: your move. ${game.player.mana} mana. —`);
}
