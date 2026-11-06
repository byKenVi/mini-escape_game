'use strict';
const test = require('node:test');
const assert = require('node:assert');
const G = require('../lib/game');
const P = require('../lib/puzzles');
const T = require('../lib/train');

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

function startedTrain(spicyA, spicyB) {
  const room = G.createRoom('TEST', 2);
  G.join(room, null);
  tick(room, 'A', { t: 'ready', value: true, name: 'Ken', spicy: spicyA });
  tick(room, 'B', { t: 'ready', value: true, name: 'Kékéli', spicy: spicyB });
  return room;
}

test('tome II : le mot final se forme avec les poinçons, moitié des numéros de chaque côté', () => {
  const byNumber = T.SEALS.slice().sort((a, b) => a.number - b.number).map((s) => s.letter).join('');
  assert.strictEqual(byNumber, T.FINAL_WORD);
  assert.strictEqual(T.SEALS.filter((s) => s.to === 'A').length, 3);
});

test('tome II : les entractes osés demandent l’accord des deux, sans révéler qui a refusé', () => {
  assert.strictEqual(startedTrain(true, false).spicy, false);
  assert.strictEqual(startedTrain(false, false).spicy, false);
  const both = startedTrain(true, true);
  assert.strictEqual(both.spicy, true);
  const refused = startedTrain(true, false);
  assert.ok(!Object.keys(G.snapshot(refused, 'A')).some((k) => k === 'theirSpicy' || k === 'spicy'));
  const seenByA = JSON.stringify(G.snapshot(refused, 'A'));
  assert.ok(!seenByA.includes('"spicy"'), 'le choix de l’autre ne part jamais au navigateur');
  for (let i = 0; i < 6; i++) {
    assert.deepStrictEqual(T.cardsFor(i, false).map((c) => c.heat || c.kind), i === 3 || i === 5 ? ['deep', 'tender'] : ['tender']);
    assert.strictEqual(T.cardsFor(i, true).at(-1).heat, 'spicy', 'en mode osé, chaque voiture finit sur un geste osé');
    assert.notStrictEqual(T.cardsFor(i, true).at(-1).text, T.cardsFor(i, false).at(-1).text);
  }
});

test('tome II : le tableau des départs ne laisse qu’un seul train', () => {
  for (let k = 0; k < 40; k++) {
    const p = T.buildAll()[0];
    assert.strictEqual(p.answer.length, 3);
    assert.ok(p.views.A.rows.some((r) => String(r.num) === p.answer));
  }
});

test('tome II : le labyrinthe est résoluble, et une cloison ramène au départ', () => {
  for (let k = 0; k < 25; k++) {
    const { maze } = T.buildAll()[2];
    assert.ok(T.shortestPath(maze.open, maze.size, maze.start, maze.goal) >= 12);
  }
  const room = startedTrain(false, false);
  room.step = 2;
  room.puzzles[2].maze = { size: 2, start: 0, goal: 3, open: [2, 4 | 8, 0, 1] };
  room.pos = 0;
  assert.strictEqual(tick(room, 'A', { t: 'move', dir: 'E' }), false, 'seul B avance');
  tick(room, 'B', { t: 'move', dir: 'E' });
  assert.strictEqual(room.pos, 1);
  tick(room, 'B', { t: 'move', dir: 'N' });
  assert.strictEqual(room.pos, 0, 'cloison : retour au départ');
  assert.strictEqual(room.stats.B.wrong, 1);
  assert.strictEqual(G.snapshot(room, 'A').puzzle.pos, undefined, 'A ne voit pas la position');
  tick(room, 'B', { t: 'move', dir: 'E' });
  tick(room, 'B', { t: 'move', dir: 'S' });
  assert.strictEqual(room.step, 3);
});

test('tome II : le contrôleur compte les accords et repose d’autres questions en cas d’échec', () => {
  const room = startedTrain(false, false);
  room.step = 3;
  room.quiz = { i: 0, agree: 0, votes: { A: null, B: null }, last: null };
  tick(room, 'A', { t: 'vote', who: 'A' });
  assert.strictEqual(G.snapshot(room, 'B').puzzle.quiz.theyVoted, true);
  assert.ok(!JSON.stringify(G.snapshot(room, 'B').puzzle.quiz).includes('"votes"'), 'le vote reste caché');
  assert.strictEqual(tick(room, 'A', { t: 'vote', who: 'B' }), false, 'on ne revote pas');
  tick(room, 'B', { t: 'vote', who: 'B' });
  assert.strictEqual(room.quiz.agree, 0);
  assert.strictEqual(room.quiz.i, 1);
  tick(room, 'A', { t: 'vote', who: 'A' }); tick(room, 'B', { t: 'vote', who: 'B' });
  assert.strictEqual(room.quiz.i, 2);
  tick(room, 'A', { t: 'vote', who: 'A' }); tick(room, 'B', { t: 'vote', who: 'B' });
  assert.strictEqual(room.quiz.i, 0, 'quatre accords devenus impossibles : nouvelle série');
  assert.strictEqual(room.step, 3);
  for (let i = 0; i < 4; i++) { tick(room, 'A', { t: 'vote', who: 'A' }); tick(room, 'B', { t: 'vote', who: 'A' }); }
  assert.strictEqual(room.step, 4);
  assert.strictEqual(room.quizLog.length, 7, 'chaque question tranchée est notée');
  assert.deepStrictEqual(room.quizLog.map((l) => l.agree), [false, false, false, true, true, true, true]);
  assert.strictEqual(G.snapshot(room, 'A').quizLog, null, 'le carnet ne s’ouvre qu’à l’arrivée');
  room.phase = 'done';
  assert.strictEqual(G.snapshot(room, 'B').quizLog.length, 7);
});

test('tome II : les rôles ont leurs propres noms, et les gestes disent s’ils sont osés', () => {
  const room = startedTrain(false, false);
  room.players.B.name = '';
  assert.strictEqual(G.snapshot(room, 'A').names.B, 'Le Télégraphiste');
  assert.strictEqual(G.snapshot(startedRoom(), 'A').names.B, 'Cartographe');
  assert.strictEqual(T.cardsFor(0, true).at(-1).heat, 'spicy');
  assert.strictEqual(T.cardsFor(0, false)[0].heat, 'tender');
});

test('tome II : en mode osé, surtout de l’osé, un peu de tendre pour s’échauffer, deux questions', () => {
  const all = [0, 1, 2, 3, 4, 5].flatMap((i) => T.cardsFor(i, true));
  const count = (f) => all.filter(f).length;
  assert.strictEqual(count((c) => c.heat === 'spicy'), 6);
  assert.strictEqual(count((c) => c.heat === 'tender'), 2);
  assert.strictEqual(count((c) => c.kind === 'deep'), 2);
  assert.ok(!/slow|danse/i.test(JSON.stringify(all.concat([0, 1, 2, 3, 4, 5].flatMap((i) => T.cardsFor(i, false))))));
});

test('tome II : plus aucune consigne ne demande de se mettre dos à dos', () => {
  const texts = JSON.stringify([T.buildAll(), [0, 1, 2, 3, 4, 5].map((i) => [T.cardsFor(i, true), T.cardsFor(i, false)])]);
  assert.ok(!/dos à dos|retourne-toi|retournez-vous|vous retourner/i.test(texts));
});

test('tome II : le vitrail se reproduit en miroir et seul B le valide', () => {
  const room = startedTrain(false, false);
  room.step = 4;
  const inst = room.puzzles[4];
  const cells = inst.views.A.cells;
  const mirrored = cells.map((_, i) => (cells[Math.floor(i / 5) * 5 + (4 - (i % 5))] ? '1' : '0')).join('');
  assert.strictEqual(mirrored, inst.answer);
  const straight = cells.map((v) => (v ? '1' : '0')).join('');
  assert.notStrictEqual(straight, mirrored, 'copier sans inverser ne doit pas marcher');
  assert.strictEqual(tick(room, 'A', { t: 'submit', answer: mirrored }), false);
  tick(room, 'B', { t: 'submit', answer: straight });
  assert.strictEqual(room.step, 4);
  assert.ok(!JSON.stringify(G.snapshot(room, 'B').puzzle).includes(inst.answer));
  tick(room, 'B', { t: 'submit', answer: mirrored });
  assert.strictEqual(room.step, 5);
});

test('tome II : partie complète, le chrono s’arrête pendant les entractes', () => {
  const room = startedTrain(true, true);
  for (let i = 0; i < 7; i++) {
    const inst = room.puzzles[i];
    if (inst.maze) {
      room.pos = inst.maze.goal - 1;
      inst.maze.open[room.pos] |= 2;
      tick(room, 'B', { t: 'move', dir: 'E' });
    } else if (inst.questions) {
      for (let q = 0; q < 4; q++) { tick(room, 'A', { t: 'vote', who: 'A' }); tick(room, 'B', { t: 'vote', who: 'A' }); }
    } else {
      tick(room, inst.input.kind === 'grid' ? 'B' : 'A', { t: 'submit', answer: inst.answer });
    }
    assert.strictEqual(room.step, i + 1);
    if (i < 6) {
      assert.ok(room.pausedAt > 0, 'pause pendant l’entracte');
      assert.strictEqual(G.snapshot(room, 'A').paused, true);
      while (room.interlude) { tick(room, 'A', { t: 'turn' }); tick(room, 'B', { t: 'turn' }); }
      assert.strictEqual(room.pausedAt, 0);
      assert.strictEqual(tick(room, 'B', { t: 'turn' }), false, 'plus rien à tourner');
    }
  }
  assert.strictEqual(room.phase, 'done');
  assert.strictEqual(G.snapshot(room, 'B').finalWord, 'RESTER');
});

test('tome II : l’entracte avance quand les deux ont appuyé, et chacun peut passer une carte seul', () => {
  const room = startedTrain(false, false);
  tick(room, 'A', { t: 'submit', answer: room.puzzles[0].answer });
  assert.strictEqual(G.snapshot(room, 'A').interlude.stage, 0, 'd’abord le télégramme');
  assert.strictEqual(tick(room, 'A', { t: 'skip' }), false, 'on ne passe pas le télégramme');
  tick(room, 'A', { t: 'turn' });
  assert.strictEqual(room.interlude.stage, 0, 'on attend l’autre');
  assert.strictEqual(G.snapshot(room, 'B').interlude.theyReady, true);
  assert.strictEqual(tick(room, 'A', { t: 'turn' }), false, 'appuyer deux fois ne compte pas');
  tick(room, 'B', { t: 'hint' });
  assert.ok(room.pausedAt > 0, 'une autre action ne relance pas le chrono pendant l’entracte');
  tick(room, 'B', { t: 'turn' });
  assert.strictEqual(G.snapshot(room, 'B').interlude.card.kind, 'act');
  tick(room, 'B', { t: 'skip' });
  assert.strictEqual(room.interlude, null, 'une seule personne suffit pour passer');
  assert.strictEqual(room.pausedAt, 0);
});

test('tome II : les cartes écrites arrivent après les voitures III et V, la surprise seulement à la fin', () => {
  const room = G.createRoom('TEST', 2);
  G.join(room, null);
  tick(room, 'A', { t: 'ready', value: true, card: 'Raconte-moi ton plus beau souvenir de nous.', surprise: 'Regarde sous le coussin bleu.' });
  tick(room, 'B', { t: 'ready', value: true, card: 'Chante-moi le refrain de ta chanson préférée.' });
  assert.strictEqual(room.phase, 'playing');
  assert.ok(!JSON.stringify(G.snapshot(room, 'B')).includes('coussin'), 'la surprise reste cachée');
  room.step = 2;
  tick(room, 'A', { t: 'submit', answer: 'faux' });
  room.puzzles[2] = { ...room.puzzles[0], answer: 'OK' };
  tick(room, 'A', { t: 'submit', answer: 'OK' });
  assert.deepStrictEqual(room.interlude.cards.map((c) => c.kind), ['written', 'act']);
  assert.strictEqual(room.interlude.cards[0].from, 'A');
  room.interlude = null; room.pausedAt = 0;
  room.step = 4;
  room.puzzles[4] = { ...room.puzzles[0], input: { kind: 'digits' }, answer: 'OK' };
  tick(room, 'A', { t: 'submit', answer: 'OK' });
  assert.match(room.interlude.cards[0].text, /refrain/);
  room.phase = 'done';
  assert.strictEqual(G.snapshot(room, 'B').theirSurprise, 'Regarde sous le coussin bleu.');
  assert.strictEqual(G.snapshot(room, 'A').theirSurprise, '');
});

test('tome II : le contrôleur va du plus léger au plus intime', () => {
  const qs = T.newQuestions();
  assert.strictEqual(qs.length, T.QUIZ_LENGTH);
  assert.ok(qs.slice(0, 2).every((q) => T.QUESTIONS.light.includes(q)));
  assert.ok(qs.slice(4).every((q) => T.QUESTIONS.close.includes(q)));
});

test('aucune réponse du tome II dans ce que reçoit un joueur', () => {
  const room = startedTrain(false, false);
  for (let i = 0; i < room.puzzles.length; i++) {
    const inst = room.puzzles[i];
    room.step = i;
    for (const role of ['A', 'B']) {
      const snap = G.snapshot(room, role);
      assert.strictEqual(snap.puzzle.answer, undefined);
      assert.strictEqual(snap.puzzle.maze, undefined);
      assert.strictEqual(snap.puzzle.questions, undefined);
    }
    if (inst.answer && inst.id !== 'billets') assert.ok(!JSON.stringify(G.snapshot(room, 'B').puzzle.view).includes(`"${inst.answer}"`));
  }
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
