'use strict';
const test = require('node:test');
const assert = require('node:assert');
const G = require('../lib/game');
const P = require('../lib/puzzles');

function startedRoom() {
  const room = G.createRoom('TEST');
  G.join(room, null);
  room.rev++; G.act(room, 'A', { t: 'ready', value: true, name: 'Ken' });
  room.rev++; G.act(room, 'B', { t: 'ready', value: true });
  return room;
}
const tick = (room, role, msg) => { room.rev++; return G.act(room, role, msg); };

test('le mot final se forme avec les sceaux, moitié des numéros de chaque côté', () => {
  const byNumber = P.SEALS.slice().sort((a, b) => a.number - b.number).map((s) => s.letter).join('');
  assert.strictEqual(byNumber, P.FINAL_WORD);
  assert.strictEqual(P.SEALS.filter((s) => s.to === 'A').length, 3);
  assert.strictEqual(P.DARES.length, P.SEALS.length);
});

test('les lecteurs du soir n’ont qu’une seule solution', () => {
  const perms = (a) => (a.length < 2 ? [a] : a.flatMap((x, i) => perms([...a.slice(0, i), ...a.slice(i + 1)]).map((p) => [x, ...p])));
  const sols = new Set();
  for (const [I, M, S, T] of perms([1, 2, 3, 4])) for (const [R, V, B, O] of perms([1, 2, 3, 4])) {
    const ok = I > M && V === 4 && T !== R && T !== V && Math.abs(M - S) !== 1 && I !== V
      && O < B && I !== B && Math.abs(S - I) === 1 && T < I && M === 1;
    if (ok) sols.add(`${R}${V}${B}${O}`);
  }
  assert.deepStrictEqual([...sols], ['3421']);
});

test('le coffre n’a qu’une seule solution', () => {
  const score = (g, s) => { let w = 0, m = 0; for (let i = 0; i < 3; i++) { if (g[i] === s[i]) w++; else if (s.includes(g[i])) m++; } return `${w}${m}`; };
  const sols = [];
  for (let n = 0; n < 1000; n++) {
    const s = String(n).padStart(3, '0');
    if (score('682', s) === '10' && score('206', s) === '02' && score('780', s) === '01' && score('614', s) === '01' && score('738', s) === '00') sols.push(s);
  }
  assert.deepStrictEqual(sols, ['042']);
});

test('les calques superposés dessinent la réponse', () => {
  for (let k = 0; k < 50; k++) {
    const p = P.buildAll()[2];
    const ink = p.views.A.cells.map((a, i) => a !== p.views.B.cells[i]);
    assert.strictEqual(ink.length, 35);
    for (let r = 0; r < 5; r++) assert.strictEqual(ink[r * 7 + 3], false, 'colonne du milieu vide');
  }
});

test('aucune réponse dans ce que reçoit un joueur', () => {
  const room = startedRoom();
  for (let i = 0; i < room.puzzles.length; i++) {
    const inst = room.puzzles[i];
    room.step = i;
    for (const role of ['A', 'B']) {
      const snap = G.snapshot(room, role);
      assert.strictEqual(snap.puzzle.answer, undefined);
      assert.strictEqual(snap.puzzle.expected, undefined);
      assert.ok(!JSON.stringify(snap.puzzle.view).includes(`"${inst.answer}"`));
    }
  }
});

test('partie complète : du salon à la porte, avec lettres scellées', () => {
  const room = G.createRoom('TEST');
  const joined = G.join(room, null);
  assert.strictEqual(joined.role, 'B');
  assert.throws(() => G.join(room, null), /complète/);
  tick(room, 'A', { t: 'profile', name: 'Ken', letter: 'Pour toi' });
  tick(room, 'B', { t: 'ready', value: true, letter: 'Pour toi aussi', name: 'Elle' });
  assert.strictEqual(room.phase, 'lobby');
  assert.strictEqual(G.snapshot(room, 'B').theirLetter, null, 'scellée avant la fin');
  tick(room, 'A', { t: 'ready', value: true });
  assert.strictEqual(room.phase, 'playing');

  tick(room, 'A', { t: 'submit', answer: '0000' });
  assert.strictEqual(room.stats.A.wrong, 1);
  tick(room, 'A', { t: 'tease', id: 2 });
  assert.strictEqual(room.stats.A.teases, 1);
  tick(room, 'B', { t: 'hint' });
  assert.strictEqual(room.stats.B.hints, 1);

  for (let i = 0; i < 7; i++) {
    const inst = room.puzzles[i];
    assert.strictEqual(room.step, i);
    if (inst.input.kind === 'keys') {
      assert.strictEqual(tick(room, 'A', { t: 'key', level: 1 }), false, 'seul B joue');
      const wrong = inst.expected.map((n, j) => (j === 0 ? (n % 4) + 1 : n));
      for (const level of wrong) tick(room, 'B', { t: 'key', level });
      assert.strictEqual(room.played.length, 0, 'fausse note : retour au début');
      assert.strictEqual(room.step, i);
      for (const level of inst.expected) tick(room, 'B', { t: 'key', level });
    } else {
      tick(room, i % 2 ? 'B' : 'A', { t: 'submit', answer: inst.answer.toLowerCase() });
    }
    const solved = G.eventsFor(room, 'A', room.rev - 1).find((e) => e.kind === 'solved');
    assert.strictEqual(solved.idx, i);
    if (i < 6) {
      const seal = P.SEALS[i];
      const forOwner = G.eventsFor(room, seal.to, room.rev - 1).find((e) => e.kind === 'solved').seal;
      const forOther = G.eventsFor(room, seal.to === 'A' ? 'B' : 'A', room.rev - 1).find((e) => e.kind === 'solved').seal;
      assert.strictEqual(forOwner.number, seal.number);
      assert.strictEqual(forOther.number, null);
    }
  }
  assert.strictEqual(room.phase, 'done');
  assert.strictEqual(G.snapshot(room, 'A').theirLetter, 'Pour toi aussi');
  assert.strictEqual(G.snapshot(room, 'B').theirLetter, 'Pour toi');
  assert.strictEqual(G.snapshot(room, 'A').finalWord, 'REVOIR');

  tick(room, 'B', { t: 'restart' });
  assert.strictEqual(room.phase, 'lobby');
  assert.strictEqual(room.players.A.letter, '');
  assert.strictEqual(room.players.A.name, 'Ken');
});

test('échange des rôles et départ : le jeton suit le joueur', () => {
  const room = G.createRoom('TEST');
  const tokenA = room.players.A.token;
  const { token: tokenB } = G.join(room, null);
  tick(room, 'A', { t: 'swap' });
  assert.strictEqual(G.roleOf(room, tokenA), 'B');
  assert.strictEqual(G.roleOf(room, tokenB), 'A');
  tick(room, 'A', { t: 'leave' });
  assert.strictEqual(G.roleOf(room, tokenB), null);
  assert.strictEqual(G.join(room, null).role, 'A');
});

test('le texte des joueurs est borné et nettoyé', () => {
  const room = G.createRoom('TEST');
  tick(room, 'A', { t: 'profile', name: `  Ke\u0000n${'x'.repeat(100)}`, letter: 'y'.repeat(5000) });
  assert.strictEqual(room.players.A.name.length, 24);
  assert.ok(room.players.A.name.startsWith('Ken'));
  assert.strictEqual(room.players.A.letter.length, 800);
});
