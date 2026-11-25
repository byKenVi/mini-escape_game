'use strict';
const test = require('node:test');
const assert = require('node:assert');
const G = require('../lib/game');
const O = require('../lib/observatoire');

const tick = (room, role, msg) => { room.rev++; return G.act(room, role, msg); };
function started(spicyA = true, spicyB = true) {
  const room = G.createRoom('TEST', 3);
  G.join(room, null);
  tick(room, 'A', { t: 'ready', value: true, name: 'Kevin', spicy: spicyA });
  tick(room, 'B', { t: 'ready', value: true, name: 'Kékéli', spicy: spicyB });
  return room;
}
const at = (room, i) => { room.step = i; room.interlude = null; room.pausedAt = 0; room.rev++; return room.puzzles[i]; };
function enter(room, i) {
  const inst = at(room, i);
  room.pos = inst.scope ? inst.scope.start : 0;
  room.knobs = inst.focus ? inst.focus.start.slice() : null;
  room.shower = null;
  room.eclipse = inst.eclipse ? { plate: 0, at: 0, until: 0, from: 0 } : null;
  return inst;
}

test('observatoire : le mot final se forme avec les éclats, moitié des numéros de chaque côté', () => {
  const byNumber = O.SEALS.slice().sort((a, b) => a.number - b.number).map((s) => s.letter).join('');
  assert.strictEqual(byNumber, O.FINAL_WORD);
  assert.strictEqual(O.SEALS.filter((s) => s.to === 'A').length, 3);
  assert.strictEqual(G.snapshot(started(), 'B').names.A, 'Kevin');
  const anon = started(); anon.players.B.name = '';
  assert.strictEqual(G.snapshot(anon, 'A').names.B, 'Le Machiniste');
});

test('observatoire : la mise au point ne montre le nom qu’une fois les deux molettes réglées', () => {
  const room = started();
  const inst = enter(room, 0);
  const seen = () => G.snapshot(room, 'A').puzzle.focus;
  assert.ok(seen().dist >= 6);
  assert.notStrictEqual(seen().text, inst.answer, 'flou au départ');
  assert.ok(!JSON.stringify(G.snapshot(room, 'A')).includes(inst.answer), 'le nom ne fuit pas');
  assert.strictEqual(G.snapshot(room, 'A').puzzle.knobs, undefined, 'A ne voit pas les molettes');
  assert.strictEqual(G.snapshot(room, 'B').puzzle.focus, undefined, 'B ne voit pas l’image');
  assert.strictEqual(tick(room, 'A', { t: 'knob', k: 0, d: 1 }), false, 'seul B tourne les molettes');
  for (const k of [0, 1]) {
    while (room.knobs[k] !== inst.focus.target[k]) tick(room, 'B', { t: 'knob', k, d: room.knobs[k] < inst.focus.target[k] ? 1 : -1 });
  }
  assert.deepStrictEqual(G.snapshot(room, 'B').puzzle.knobs, inst.focus.target);
  assert.strictEqual(seen().dist, 0);
  assert.strictEqual(seen().text, inst.answer, 'net : le nom apparaît');
  room.knobs = [0, 0];
  assert.strictEqual(tick(room, 'B', { t: 'knob', k: 0, d: -1 }), false, 'butée à zéro');
  tick(room, 'A', { t: 'submit', answer: inst.answer.toLowerCase() });
  assert.strictEqual(room.step, 1);
});

test('observatoire : la grille tournante couvre chaque case une fois et redonne le message', () => {
  for (let k = 0; k < 60; k++) {
    const msg = O.GRILLE_PREFIX + 'NOVA';
    const { holes, grid } = O.buildGrille(msg);
    assert.strictEqual(holes.length, 4);
    let cur = holes, read = '';
    const used = new Set();
    for (let turn = 0; turn < 4; turn++) {
      for (const i of cur.slice().sort((a, b) => a - b)) { read += grid[i]; used.add(i); }
      cur = cur.map(O.rot);
    }
    assert.strictEqual(read, msg);
    assert.strictEqual(used.size, 16);
  }
  assert.strictEqual(O.rot(0), 3, 'un quart de tour vers la droite : le coin haut-gauche part en haut à droite');
});

test('observatoire : les engrenages donnent le bon nombre de tours et le bon sens', () => {
  for (let k = 0; k < 300; k++) {
    const g = O.buildGears();
    // Simulation : on fait tourner la manivelle et on suit chaque roue.
    let turns = g.K, cw = g.crankCw;
    turns = (turns * g.c) / g.p1; cw = !cw; // engrène la grande roue
    // roue solidaire : même sens, mêmes tours
    if (g.idler) { cw = !cw; } // la roue folle inverse, sans changer la vitesse
    turns = (turns * g.p2) / g.d; cw = !cw; // engrène la couronne
    assert.strictEqual(turns, g.N);
    assert.strictEqual(cw, g.domeCw);
    assert.match(g.answer, /^[HI]\d+$/);
  }
  const room = started();
  const inst = enter(room, 3);
  assert.strictEqual(tick(room, 'A', { t: 'submit', answer: inst.answer }), false, 'seul B actionne la manivelle');
  const wrong = inst.answer.startsWith('H') ? 'I' + inst.answer.slice(1) : 'H' + inst.answer.slice(1);
  tick(room, 'B', { t: 'submit', answer: wrong });
  assert.strictEqual(room.stats.B.wrong, 1, 'mauvais sens');
  tick(room, 'B', { t: 'submit', answer: inst.answer });
  assert.strictEqual(room.step, 4);
});

test('observatoire : la comète, chaque carré de lunette est unique et seul le bon endroit compte', () => {
  for (let k = 0; k < 20; k++) {
    const sky = O.buildSky();
    const keys = new Set(sky.cells.map((_, i) => O.windowOf(sky.cells, i).join(',')));
    assert.strictEqual(keys.size, sky.cells.length);
  }
  const room = started();
  const inst = enter(room, 4);
  const snapB = G.snapshot(room, 'B').puzzle;
  assert.strictEqual(snapB.window.length, 9);
  assert.ok(!JSON.stringify(snapB).includes('"comet"'), 'B ne voit pas la comète');
  assert.strictEqual(G.snapshot(room, 'A').puzzle.window, undefined, 'A ne voit pas la lunette');
  assert.strictEqual(G.snapshot(room, 'A').puzzle.pos, undefined);
  tick(room, 'B', { t: 'shoot' });
  assert.strictEqual(room.stats.B.wrong, 1, 'plaque vierge');
  room.pos = 0;
  assert.strictEqual(tick(room, 'B', { t: 'move', dir: 'N' }), false, 'butée en haut de la carte');
  tick(room, 'B', { t: 'move', dir: 'E' });
  assert.strictEqual(room.pos, 1);
  tick(room, 'B', { t: 'move', dir: 'home' });
  assert.strictEqual(room.pos, inst.scope.start);
  const size = inst.scope.size, goal = inst.scope.comet;
  while (room.pos !== goal) {
    const dc = (goal % size) - (room.pos % size), dr = Math.floor(goal / size) - Math.floor(room.pos / size);
    tick(room, 'B', { t: 'move', dir: dc > 0 ? 'E' : dc < 0 ? 'W' : dr > 0 ? 'S' : 'N' });
  }
  tick(room, 'B', { t: 'shoot' });
  assert.strictEqual(room.step, 5);
});

test('observatoire : la pluie d’étoiles filantes part pour les deux, et chaque lettre ne passe que chez un seul', () => {
  for (let k = 0; k < 40; k++) {
    const s = O.buildShower('ENSEMBLE');
    const letters = [...s.meteors.A, ...s.meteors.B].filter((m) => m.letter).sort((a, b) => a.t - b.t);
    assert.strictEqual(letters.map((m) => m.letter).join(''), 'ENSEMBLE');
    assert.ok(s.meteors.A.filter((m) => m.letter).length >= 3 && s.meteors.B.filter((m) => m.letter).length >= 3);
    for (let i = 1; i < letters.length; i++) assert.ok(letters[i].t - letters[i - 1].t >= 1800, 'le temps de se le dire');
    assert.ok(letters.at(-1).t < s.total);
  }
  const room = started();
  const inst = enter(room, 2);
  assert.ok(!JSON.stringify(G.snapshot(room, 'A').puzzle).includes(inst.answer));
  tick(room, 'B', { t: 'shower' });
  const a = G.snapshot(room, 'A').puzzle.shower, b = G.snapshot(room, 'B').puzzle.shower;
  assert.strictEqual(a.run, 1);
  assert.strictEqual(b.run, 1);
  assert.ok(a.inMs > 2000, 'un décompte avant la pluie');
  assert.strictEqual(tick(room, 'A', { t: 'shower' }), false, 'on ne relance pas pendant la pluie');
  room.shower.at -= inst.shower.total + 5000;
  tick(room, 'A', { t: 'shower' });
  assert.strictEqual(room.shower.run, 2, 'relance une fois la pluie passée');
});

test('observatoire : l’éclipse, seul A voit venir le contact, B déclenche à l’aveugle', () => {
  const room = started();
  enter(room, 5);
  assert.strictEqual(tick(room, 'B', { t: 'launch' }), false, 'seul A lance la poursuite');
  assert.strictEqual(tick(room, 'B', { t: 'shutter' }), false, 'rien à photographier avant le lancement');
  tick(room, 'A', { t: 'launch' });
  const seenA = G.snapshot(room, 'A').puzzle.eclipse, seenB = G.snapshot(room, 'B').puzzle.eclipse;
  assert.ok(seenA.inMs >= 5900 && seenA.dur === O.PLATES[0]);
  assert.strictEqual(seenB.running, true);
  assert.strictEqual(seenB.inMs, undefined, 'B ne connaît pas le moment');
  assert.strictEqual(tick(room, 'A', { t: 'launch' }), false, 'pas deux poursuites à la fois');
  tick(room, 'B', { t: 'shutter' });
  assert.strictEqual(room.stats.B.wrong, 1, 'trop tôt');
  assert.strictEqual(room.eclipse.plate, 0);
  for (let p = 0; p < O.PLATES.length; p++) {
    tick(room, 'A', { t: 'launch' });
    room.eclipse.at = Date.now() - 100; room.eclipse.until = room.eclipse.at + O.PLATES[p];
    tick(room, 'B', { t: 'shutter' });
  }
  assert.strictEqual(room.step, 6, 'trois plaques réussies');
  const late = started();
  enter(late, 5);
  tick(late, 'A', { t: 'launch' });
  late.eclipse.at = Date.now() - 2500; late.eclipse.until = late.eclipse.at + 1500;
  assert.strictEqual(G.snapshot(late, 'B').puzzle.eclipse.running, false);
  tick(late, 'B', { t: 'shutter' });
  assert.strictEqual(late.stats.B.wrong, 1, 'trop tard');
  assert.strictEqual(late.eclipse.at, 0, 'il faut relancer la poursuite');
  assert.strictEqual(tick(late, 'B', { t: 'shutter' }), false);
});

test('observatoire : l’éclipse se passe contre un gage, les autres énigmes donnent leur réponse', () => {
  const room = started(false, true);
  assert.strictEqual(room.spicy, false);
  const inst = enter(room, 5);
  for (let i = 0; i < inst.hints.length; i++) tick(room, 'A', { t: 'hint' });
  tick(room, 'B', { t: 'askanswer' });
  assert.ok(O.GAGES.tender.includes(G.snapshot(room, 'A').puzzle.gage.text), 'tendre si un seul a refusé');
  tick(room, 'A', { t: 'gagedone' });
  assert.strictEqual(room.step, 6);
  for (const p of O.buildAll()) {
    assert.strictEqual(p.hints.length, 3, p.id);
    assert.ok(p.reveal || p.passOnGage, `${p.id} doit pouvoir se débloquer`);
  }
});

test('observatoire : chaque nuit, une carte pour se découvrir ; le sensuel seulement avec le double oui', () => {
  for (let i = 0; i < 6; i++) {
    const hot = O.cardsFor(i, true), soft = O.cardsFor(i, false);
    for (const cards of [hot, soft]) {
      assert.ok(cards.some((c) => c.kind === 'deep'), 'se découvrir, chaque nuit');
      assert.ok(cards.some((c) => c.heat === 'tender'), 'rire, chaque nuit');
    }
    assert.ok(!soft.some((c) => c.heat === 'spicy'), 'aucune carte osée sans le double oui');
    assert.ok([...hot, ...soft].every((c) => c.label && c.text), 'chaque carte a son titre');
  }
  const all = [0, 1, 2, 3, 4, 5].flatMap((i) => O.cardsFor(i, true));
  assert.strictEqual(all.filter((c) => c.heat === 'spicy').length, 2, 'deux cartes coquines, pas plus');
  // À distance : rien à retirer ni à montrer, que l'appel soit en vidéo ou non. Pas de chanson, pas de mielleux.
  const texts = JSON.stringify([O.NIGHTS, O.GAGES]);
  assert.ok(!/vêtement|retire|enlève|photo|vidéo|caméra|chant|tu me manques/i.test(texts), 'jouable en appel simple, sans chanter');
  assert.ok(!/notre lit|votre lit|chez vous|film/i.test(texts));
});

test('observatoire : aucune réponse dans ce que reçoit un joueur', () => {
  const room = started();
  for (let i = 0; i < room.puzzles.length; i++) {
    const inst = enter(room, i);
    for (const role of ['A', 'B']) {
      const snap = G.snapshot(room, role);
      assert.strictEqual(snap.puzzle.answer, undefined);
      for (const k of ['focus', 'scope', 'eclipse', 'shower']) if (inst[k]) assert.ok(!('comet' in (snap.puzzle[k] || {})));
      if (inst.answer) assert.ok(!JSON.stringify(snap.puzzle).includes(`"${inst.answer}"`), `${inst.id} chez ${role}`);
    }
  }
});

test('observatoire : partie complète, entractes partagés et chrono arrêté', () => {
  const room = started();
  for (let i = 0; i < 7; i++) {
    const inst = room.puzzles[i];
    assert.strictEqual(room.step, i);
    if (inst.focus) { room.knobs = inst.focus.target.slice(); tick(room, 'A', { t: 'submit', answer: inst.answer }); }
    else if (inst.scope) { room.pos = inst.scope.comet; tick(room, 'B', { t: 'shoot' }); }
    else if (inst.eclipse) {
      for (let p = 0; p < 3; p++) { tick(room, 'A', { t: 'launch' }); room.eclipse.at = Date.now(); room.eclipse.until = room.eclipse.at + 2000; tick(room, 'B', { t: 'shutter' }); }
    } else tick(room, inst.input.kind === 'crank' ? 'B' : 'A', { t: 'submit', answer: inst.answer });
    assert.strictEqual(room.step, i + 1, inst.id);
    if (i < 6) {
      assert.ok(room.pausedAt > 0);
      const cards = room.interlude.cards;
      assert.ok(cards.some((c) => c.kind === 'deep'));
      while (room.interlude) { tick(room, 'A', { t: 'turn' }); tick(room, 'B', { t: 'turn' }); }
      assert.strictEqual(room.pausedAt, 0);
    }
  }
  assert.strictEqual(room.phase, 'done');
  assert.strictEqual(G.snapshot(room, 'A').finalWord, 'ETOILE');
});
