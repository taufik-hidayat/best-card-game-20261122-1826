// DOM rendering: turns the pure game state into the table, hands, bars and
// overlays. Re-renders the dynamic regions from scratch on every change.
import { SUITS, cardById, AI_NAME } from './config.js';
import { PHASE_TITLE, PHASE_WIN, PHASE_LOSS } from './state.js';

function el(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined && text !== null) node.textContent = text;
  return node;
}

/** One face-up card. `opts.playable` dims it when the player cannot afford it. */
export function cardElement(card, opts = {}) {
  const suit = SUITS[card.suit];
  const node = el('div', `card suit-${card.suit}${opts.playable === false ? ' unaffordable' : ''}${opts.small ? ' small' : ''}`);
  node.dataset.cardId = card.id;

  const cost = el('div', 'card-cost', String(card.cost));
  cost.title = `${card.cost} mana`;
  node.appendChild(cost);

  const glyph = el('div', 'card-glyph', suit.glyph);
  glyph.style.color = suit.color;
  node.appendChild(glyph);

  node.appendChild(el('div', 'card-name', card.name));
  const valueBits = [];
  if (card.dmg) valueBits.push(`⚔ ${card.dmg}`);
  if (card.shield) valueBits.push(`⛨ ${card.shield}`);
  if (card.heal) valueBits.push(`✚ ${card.heal}`);
  if (card.draw) valueBits.push(`⇪ ${card.draw}`);
  node.appendChild(el('div', 'card-value', valueBits.join('  ')));
  node.appendChild(el('div', 'card-suit-name', suit.name));
  node.appendChild(el('div', 'card-text', card.text));
  if (opts.keyHint) node.appendChild(el('div', 'card-key', opts.keyHint));
  return node;
}

/** A face-down card back (the opponent's hand). */
function cardBackElement() {
  const node = el('div', 'card card-back');
  node.appendChild(el('div', 'card-back-glyph', '✦'));
  node.appendChild(el('div', 'card-back-name', 'SIGIL'));
  return node;
}

function hpBar(fighter) {
  const wrap = el('div', 'hp-wrap');
  const pct = Math.max(0, (fighter.hp / fighter.maxHp) * 100);
  const bar = el('div', 'hp-bar');
  const fill = el('div', 'hp-fill');
  fill.style.width = `${pct}%`;
  fill.classList.add(fighter.hp <= 10 ? 'low' : fighter.hp <= 18 ? 'mid' : 'high');
  bar.appendChild(fill);
  wrap.appendChild(bar);
  wrap.appendChild(el('span', 'hp-text', `${fighter.hp} / ${fighter.maxHp} HP`));
  if (fighter.shield > 0) wrap.appendChild(el('span', 'badge shield-badge', `⛨ ${fighter.shield} Shield`));
  if (fighter.chill > 0) wrap.appendChild(el('span', 'badge chill-badge', `❄ Chill ${fighter.chill}`));
  return wrap;
}

function manaGems(fighter) {
  const wrap = el('div', 'mana');
  wrap.appendChild(el('span', 'mana-label', 'MANA'));
  for (let i = 0; i < fighter.maxMana; i += 1) {
    wrap.appendChild(el('span', `mana-gem${i < fighter.mana ? ' on' : ''}`, '◆'));
  }
  wrap.appendChild(el('span', 'mana-text', `${fighter.mana}/${fighter.maxMana}`));
  return wrap;
}

function pileCounts(fighter) {
  const wrap = el('div', 'piles');
  wrap.appendChild(el('span', 'pile', `Deck ${fighter.deck.length}`));
  wrap.appendChild(el('span', 'pile', `Discard ${fighter.discard.length}`));
  return wrap;
}

/** The whole table for the play phase. */
export function renderTable(root, game, onPlayCard, onEndTurn) {
  root.innerHTML = '';
  const table = el('div', 'table');

  // ——— Opponent row ———
  const foe = el('div', 'fighter-row foe-row');
  const foeInfo = el('div', 'fighter-info');
  foeInfo.appendChild(el('div', 'fighter-name', `⚔ ${AI_NAME} — the Ashen Duelist`));
  foeInfo.appendChild(hpBar(game.enemy));
  foeInfo.appendChild(pileCounts(game.enemy));
  foe.appendChild(foeInfo);

  const foeHand = el('div', 'hand foe-hand');
  const backs = Math.min(game.enemy.hand.length, 7);
  for (let i = 0; i < backs; i += 1) foeHand.appendChild(cardBackElement());
  foeHand.appendChild(el('div', 'hand-count', `${game.enemy.hand.length} cards`));
  foe.appendChild(foeHand);

  const intent = el('div', `intent intent-${game.aiPlan ? game.aiPlan.kind : 'pass'}`,
    game.aiPlan ? game.aiPlan.summary : 'Raven is thinking…');
  foe.appendChild(intent);
  table.appendChild(foe);

  // ——— Centre: played cards + log ———
  const centre = el('div', 'centre');
  const played = el('div', 'played');
  played.appendChild(el('div', 'played-label', 'ON THE TABLE'));
  const playedRow = el('div', 'played-row');
  for (const id of game.lastAiCards) playedRow.appendChild(cardElement(cardById(id), { small: true }));
  for (const id of game.playedThisTurn) playedRow.appendChild(cardElement(cardById(id), { small: true }));
  if (playedRow.childElementCount === 0) {
    playedRow.appendChild(el('div', 'played-empty', 'No cards played yet — click a card in your hand.'));
  }
  played.appendChild(playedRow);
  centre.appendChild(played);

  const logBox = el('div', 'log');
  logBox.appendChild(el('div', 'log-label', 'DUEL LOG'));
  const lines = el('div', 'log-lines');
  for (const line of game.log.slice(-6)) lines.appendChild(el('div', 'log-line', line));
  logBox.appendChild(lines);
  centre.appendChild(logBox);
  table.appendChild(centre);

  // ——— Player row ———
  const me = el('div', 'fighter-row me-row');
  const meInfo = el('div', 'fighter-info');
  meInfo.appendChild(el('div', 'fighter-name', 'YOU — Sigil Duelist'));
  meInfo.appendChild(hpBar(game.player));
  meInfo.appendChild(manaGems(game.player));
  meInfo.appendChild(pileCounts(game.player));
  const endBtn = el('button', 'end-turn', 'END TURN  ⏎');
  endBtn.addEventListener('click', onEndTurn);
  meInfo.appendChild(endBtn);
  me.appendChild(meInfo);

  const myHand = el('div', 'hand my-hand');
  game.player.hand.forEach((id, i) => {
    const card = cardById(id);
    const node = cardElement(card, { playable: game.player.mana >= card.cost, keyHint: i < 7 ? String(i + 1) : '' });
    node.addEventListener('click', () => onPlayCard(i));
    myHand.appendChild(node);
  });
  me.appendChild(myHand);
  table.appendChild(me);

  // Turn banner
  const banner = el('div', 'turn-banner', `TURN ${game.turn} — Your move · click a card to play it · keys 1–7 · Space ends turn`);
  table.appendChild(banner);

  root.appendChild(table);
  renderFloaters(root, game);
}

function renderFloaters(root, game) {
  // Screenshot poses freeze animations, so transient floaters would sit
  // frozen mid-flight and overlap — never render them in a posed frame.
  if (document.body.classList.contains('shot')) {
    game.floaters.length = 0;
    return;
  }
  const layer = root.querySelector('.floaters') || el('div', 'floaters');
  if (!root.querySelector('.floaters')) root.appendChild(layer);
  for (const f of game.floaters) {
    const node = el('span', `floater ${f.kind} ${f.side}`, f.text);
    layer.appendChild(node);
    node.addEventListener('animationend', () => node.remove());
    setTimeout(() => node.remove(), 1800);
  }
  game.floaters.length = 0;
}

/** Full-screen overlay: title / win / loss. */
export function renderOverlay(root, game, onStart) {
  const overlay = el('div', 'overlay');
  if (game.phase === PHASE_TITLE) {
    overlay.classList.add('title-screen');
    overlay.appendChild(el('div', 'title-kicker', 'A DUEL OF SIGILS AND SPELLS'));
    overlay.appendChild(el('h1', 'title-main', 'EMBER SIGIL DUEL'));
    const suits = el('div', 'title-suits');
    for (const key of Object.keys(SUITS)) {
      const s = SUITS[key];
      const chip = el('div', 'suit-chip');
      chip.appendChild(el('span', 'suit-chip-glyph', s.glyph));
      chip.style.color = s.color;
      chip.appendChild(el('span', 'suit-chip-name', s.name));
      suits.appendChild(chip);
    }
    overlay.appendChild(suits);
    overlay.appendChild(el('p', 'title-rules',
      '30 HP each. Draw, gain mana, play cards — Ember ignites, Frost chills, ' +
      'Thorn strikes back, Tide draws. Read Raven’s intent, then counter it. First to 0 HP loses.'));
    const btn = el('button', 'big-button', '⚔  DUEL RAVEN  ⚔');
    btn.addEventListener('click', onStart);
    overlay.appendChild(btn);
    overlay.appendChild(el('p', 'title-hint', 'Click a card to play it · keys 1–7 play cards · Space ends your turn'));
  } else if (game.phase === PHASE_WIN) {
    overlay.classList.add('win-screen');
    overlay.appendChild(el('div', 'end-glyph', '👑'));
    overlay.appendChild(el('h1', 'end-title', 'VICTORY!'));
    overlay.appendChild(el('p', 'end-text',
      `Raven falls in ${game.turn} turns. The sigils blaze gold — you are the Ember Champion.`));
    overlay.appendChild(el('p', 'end-score', `You ${game.player.hp} HP  ·  Raven 0 HP`));
    const btn = el('button', 'big-button', '↻  DUEL AGAIN');
    btn.addEventListener('click', onStart);
    overlay.appendChild(btn);
  } else if (game.phase === PHASE_LOSS) {
    overlay.classList.add('loss-screen');
    overlay.appendChild(el('div', 'end-glyph', '💀'));
    overlay.appendChild(el('h1', 'end-title', 'DEFEAT'));
    overlay.appendChild(el('p', 'end-text',
      `Raven’s sigils gutter out your last ember on turn ${game.turn}. The table waits for a rematch.`));
    overlay.appendChild(el('p', 'end-score', `You 0 HP  ·  Raven ${game.enemy.hp} HP`));
    const btn = el('button', 'big-button', '↻  TRY AGAIN');
    btn.addEventListener('click', onStart);
    overlay.appendChild(btn);
  }
  root.appendChild(overlay);
}
