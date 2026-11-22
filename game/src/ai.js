// Raven, the AI opponent: picks a readable plan (announced as its intent)
// and plays exactly the cards it announced, so the player can counter it.
import { cardById } from './config.js';
import { weightedPick } from './rng.js';

/** Score a card for the AI's current situation. Higher is better. */
function scoreCard(game, card) {
  const enemy = game.enemy;
  const player = game.player;
  let score = 0;
  if (card.dmg) score += card.dmg * (player.hp <= 8 ? 2.2 : 1.4);
  if (card.shield) score += card.shield * (enemy.hp <= 12 ? 1.6 : 0.9);
  if (card.heal) score += card.heal * (enemy.hp <= 14 ? 2.4 : 0.5);
  if (card.draw) score += 3;
  if (card.chill) score += 2.5;
  if (card.emberDmg && game.suitsThisTurn.has('ember')) score += 3;
  score -= card.cost * 1.5;
  return score;
}

/**
 * Choose the AI's next turn: up to two cards it can afford, picked greedily
 * by score, with a little randomness. Returns { cards, summary, kind }.
 * The summary is the intent the player reads before the AI acts.
 */
export function planAiTurn(game) {
  const enemy = game.enemy;
  const rng = game.rng;
  const affordable = enemy.hand
    .map((id) => cardById(id))
    .filter((c) => c && c.cost <= enemy.mana)
    .sort((a, b) => scoreCard(game, b) - scoreCard(game, a));

  const chosen = [];
  let mana = enemy.mana;
  // Slightly favour attack when the player is low, defence when Raven is low.
  const mood = weightedPick(['attack', 'defend', 'heal'], (m) => {
    if (m === 'attack') return game.player.hp <= 10 ? 5 : 3;
    if (m === 'defend') return game.enemy.hp <= 12 ? 4 : 2;
    return game.enemy.hp <= 14 ? 4 : 1;
  }, rng);
  const moodCard = affordable.find((c) =>
    mood === 'attack' ? c.dmg : mood === 'defend' ? c.shield : c.heal);
  if (moodCard) {
    chosen.push(moodCard.id);
    mana -= moodCard.cost;
  }
  for (const card of affordable) {
    if (chosen.length >= 2 || chosen.includes(card.id)) continue;
    if (card.cost <= mana && scoreCard(game, card) > 0) {
      chosen.push(card.id);
      mana -= card.cost;
    }
  }
  if (chosen.length === 0) return { cards: [], summary: 'Raven passes — no card to play.', kind: 'pass' };

  const parts = chosen.map((id) => {
    const c = cardById(id);
    const bits = [];
    if (c.dmg) bits.push(`${c.dmg} damage`);
    if (c.shield) bits.push(`${c.shield} Shield`);
    if (c.heal) bits.push(`heal ${c.heal}`);
    if (c.draw) bits.push(`draw ${c.draw}`);
    return `${c.name} (${bits.join(' + ')})`;
  });
  const kind = chosen.some((id) => cardById(id).heal) && !chosen.some((id) => cardById(id).dmg)
    ? 'heal'
    : chosen.some((id) => cardById(id).shield) && !chosen.some((id) => cardById(id).dmg)
      ? 'defend'
      : 'attack';
  return { cards: chosen, summary: `Raven plans: ${parts.join(' + ')}`, kind };
}
