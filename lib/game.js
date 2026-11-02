'use strict';
// Moteur du jeu : fonctions pures sur un objet « salle » sérialisable en JSON.
const crypto = require('crypto');
const Tome1 = require('./puzzles');
const Tome2 = require('./train');

const VOLUMES = { 1: Tome1, 2: Tome2 };
const vol = (room) => VOLUMES[room.volume] || Tome1;
const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ';
const ROLE_LABEL = { A: 'L’Archiviste', B: 'Cartographe' };
const MAX_EVENTS = 40;
const ONLINE_MS = 12000;
const TEASES = 7;

class GameError extends Error {
  constructor(code, msg, status) { super(msg); this.code = code; this.status = status || 400; }
}

function newCode() {
  let c = '';
  for (let i = 0; i < 4; i++) c += CODE_CHARS[crypto.randomInt(CODE_CHARS.length)];
  return c;
}
const newToken = () => crypto.randomBytes(12).toString('hex');
const newPlayer = () => ({ token: newToken(), name: '', ready: false, letter: '', spicy: false });
const emptyStats = () => ({ wrong: 0, hints: 0, teases: 0 });
const cleanText = (s, max) => String(s || '').replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, '').trim().slice(0, max);

function resetGame(room) {
  room.puzzles = vol(room).buildAll();
  room.phase = 'lobby';
  room.step = 0;
  room.startedAt = 0;
  room.endedAt = 0;
  room.pausedAt = 0;
  room.pausedMs = 0;
  room.spicy = false;
  room.hintLevels = {};
  room.stats = { A: emptyStats(), B: emptyStats() };
  room.journal = [];
  room.solvedSeals = [];
  room.played = [];
  room.events = [];
  room.pos = 0;
  room.quiz = null;
  for (const r of ['A', 'B']) {
    if (room.players[r]) { room.players[r].ready = false; room.players[r].letter = ''; room.players[r].spicy = false; }
  }
}

function createRoom(code, volume) {
  const room = { code, volume: VOLUMES[volume] ? Number(volume) : 1, rev: 1, players: { A: newPlayer(), B: null } };
  resetGame(room);
  return room;
}

function roleOf(room, token) {
  if (!token) return null;
  for (const r of ['A', 'B']) if (room.players[r] && room.players[r].token === token) return r;
  return null;
}

// Retourne { role, token }. Un jeton connu retrouve sa place, sinon on prend la place libre.
function join(room, token) {
  const known = roleOf(room, token);
  if (known) return { role: known, token, changed: false };
  const free = !room.players.A ? 'A' : !room.players.B ? 'B' : null;
  if (!free) throw new GameError('full', 'Cette salle est déjà complète.', 409);
  room.players[free] = newPlayer();
  return { role: free, token: room.players[free].token, changed: true };
}

function emit(room, ev) {
  room.events.push({ rev: room.rev, ...ev });
  if (room.events.length > MAX_EVENTS) room.events.splice(0, room.events.length - MAX_EVENTS);
}

// Prépare l'état propre à l'étape qui commence.
function enterStep(room) {
  const inst = room.puzzles[room.step];
  room.played = [];
  room.pos = inst && inst.maze ? inst.maze.start : 0;
  room.quiz = inst && inst.questions ? { i: 0, agree: 0, votes: { A: null, B: null }, last: null } : null;
}

function endPause(room) {
  if (!room.pausedAt) return false;
  room.pausedMs += Date.now() - room.pausedAt;
  room.pausedAt = 0;
  return true;
}

function advance(room) {
  const V = vol(room);
  const idx = room.step;
  const inst = room.puzzles[idx];
  room.journal.push(inst.page);
  if (idx < V.SEALS.length) room.solvedSeals.push(idx);
  room.step++;
  const finished = room.step >= room.puzzles.length;
  if (finished) { room.phase = 'done'; room.endedAt = Date.now(); }
  else enterStep(room);
  const cards = V.cardsFor(idx, room.spicy);
  // Dans le train, on ne chronomètre pas les entractes : prenez votre temps.
  if (room.volume === 2 && cards.length && !finished) room.pausedAt = Date.now();
  emit(room, {
    kind: 'solved', idx, title: inst.title, page: inst.page, finished,
    seal: idx < V.SEALS.length ? V.SEALS[idx] : null,
    cards,
  });
}

// Applique une action. Retourne false si rien n'a changé (pas d'écriture en base).
function act(room, role, msg) {
  const me = room.players[role];

  if (msg.t === 'profile') {
    if (typeof msg.name === 'string') me.name = cleanText(msg.name, 24);
    if (typeof msg.letter === 'string' && room.phase === 'lobby') me.letter = cleanText(msg.letter, 800);
    if (typeof msg.spicy === 'boolean' && room.phase === 'lobby') me.spicy = msg.spicy;
    return true;
  }

  if (msg.t === 'leave') {
    room.players[role] = null;
    const other = room.players[role === 'A' ? 'B' : 'A'];
    if (other && room.phase === 'lobby') other.ready = false;
    return true;
  }

  if (msg.t === 'ready') {
    if (room.phase !== 'lobby') return false;
    me.ready = !!msg.value;
    if (typeof msg.name === 'string') me.name = cleanText(msg.name, 24);
    if (typeof msg.letter === 'string') me.letter = cleanText(msg.letter, 800);
    if (typeof msg.spicy === 'boolean') me.spicy = msg.spicy;
    const { A: a, B: b } = room.players;
    if (a && b && a.ready && b.ready) {
      room.phase = 'playing';
      room.startedAt = Date.now();
      room.spicy = room.volume === 2 && a.spicy && b.spicy;
      enterStep(room);
      emit(room, { kind: 'start' });
    }
    return true;
  }

  if (msg.t === 'swap') {
    if (room.phase !== 'lobby') return false;
    const { A: a, B: b } = room.players;
    if (!a || !b) return false;
    room.players.A = b; room.players.B = a;
    a.ready = false; b.ready = false;
    return true;
  }

  if (msg.t === 'restart') {
    if (room.phase !== 'done') return false;
    resetGame(room);
    return true;
  }

  if (msg.t === 'tease') {
    if (room.phase !== 'playing') return false;
    const id = Number(msg.id);
    if (!Number.isInteger(id) || id < 0 || id >= TEASES) return false;
    room.stats[role].teases++;
    emit(room, { kind: 'tease', from: role, id });
    return true;
  }

  if (room.phase !== 'playing') return false;
  if (msg.t === 'resume') return endPause(room);
  // Si le message de reprise s'est perdu en route, la première action relance le chrono.
  const wasPaused = endPause(room);
  const inst = room.puzzles[room.step];

  if (msg.t === 'submit') {
    const kind = inst.input.kind;
    if (kind === 'keys' || kind === 'maze' || kind === 'quiz') return false;
    if (kind === 'grid' && role !== 'B') return false;
    const guess = cleanText(msg.answer, 40);
    if (!guess) return false;
    if (Tome1.normalize(guess) === inst.answer) { advance(room); return true; }
    room.stats[role].wrong++;
    emit(room, { kind: 'wrong', by: role, guess: kind === 'grid' ? '' : guess.toUpperCase(), what: kind });
    return true;
  }

  if (msg.t === 'key') {
    if (inst.input.kind !== 'keys' || role !== 'B') return false;
    const lvl = Number(msg.level);
    if (![1, 2, 3, 4].includes(lvl)) return false;
    room.played.push(lvl);
    emit(room, { kind: 'note', level: lvl, by: role });
    if (room.played.length >= inst.expected.length) {
      if (room.played.every((v, i) => v === inst.expected[i])) { advance(room); return true; }
      room.played = [];
      room.stats[role].wrong++;
      emit(room, { kind: 'wrong', by: role, guess: '', what: 'keys' });
    }
    return true;
  }

  if (msg.t === 'move') {
    if (inst.input.kind !== 'maze' || role !== 'B') return false;
    const d = Tome2.DIRS[msg.dir];
    if (!d) return false;
    const { open, size, start, goal } = inst.maze;
    if (!(open[room.pos] & d[2])) {
      room.pos = start;
      room.stats[role].wrong++;
      emit(room, { kind: 'wrong', by: role, guess: '', what: 'maze' });
      return true;
    }
    room.pos += d[0] * size + d[1];
    if (room.pos === goal) advance(room);
    return true;
  }

  if (msg.t === 'vote') {
    if (inst.input.kind !== 'quiz' || !room.quiz) return false;
    if (msg.who !== 'A' && msg.who !== 'B') return false;
    const q = room.quiz;
    if (q.votes[role]) return false;
    q.votes[role] = msg.who;
    if (!q.votes.A || !q.votes.B) return true;
    const agree = q.votes.A === q.votes.B;
    if (agree) q.agree++;
    q.last = { q: inst.questions[q.i], agree, A: q.votes.A, B: q.votes.B };
    q.i++;
    q.votes = { A: null, B: null };
    emit(room, { kind: 'round', agree });
    if (q.agree >= Tome2.QUIZ_PASS) { advance(room); return true; }
    if (q.i >= Tome2.QUIZ_LENGTH || q.agree + (Tome2.QUIZ_LENGTH - q.i) < Tome2.QUIZ_PASS) {
      emit(room, { kind: 'quizfail', agree: q.agree });
      inst.questions = Tome2.newQuestions();
      room.quiz = { i: 0, agree: 0, votes: { A: null, B: null }, last: q.last };
    }
    return true;
  }

  if (msg.t === 'hint') {
    const lvl = room.hintLevels[room.step] || 0;
    if (lvl >= inst.hints.length) return false;
    room.hintLevels[room.step] = lvl + 1;
    room.stats[role].hints++;
    emit(room, { kind: 'hint', by: role });
    return true;
  }

  return wasPaused;
}

const displayName = (room, r) => (room.players[r] && room.players[r].name) || ROLE_LABEL[r];

function puzzleView(room, role) {
  const inst = room.puzzles[room.step];
  const lvl = room.hintLevels[room.step] || 0;
  const view = {
    id: inst.id, idx: room.step, title: inst.title, story: inst.story,
    view: inst.views[role], input: inst.input,
    hints: inst.hints.slice(0, lvl), hintsMax: inst.hints.length,
  };
  if (inst.maze && role === 'B') view.pos = room.pos;
  if (inst.questions && room.quiz) {
    const q = room.quiz;
    view.quiz = {
      i: q.i, total: Tome2.QUIZ_LENGTH, pass: Tome2.QUIZ_PASS, agree: q.agree,
      question: inst.questions[q.i],
      myVote: q.votes[role],
      theyVoted: !!q.votes[role === 'A' ? 'B' : 'A'],
      last: q.last,
    };
  }
  return view;
}

function snapshot(room, role) {
  const other = role === 'A' ? 'B' : 'A';
  const mine = room.players[role];
  const theirs = room.players[other];
  const now = Date.now();
  const elapsed = room.startedAt ? (room.endedAt || room.pausedAt || now) - room.startedAt - room.pausedMs : 0;
  const puzzle = room.phase === 'playing' ? puzzleView(room, role) : null;
  const V = vol(room);
  const seals = V.SEALS.map((s, i) => {
    const solved = room.solvedSeals.includes(i);
    return { solved, letter: solved ? s.letter : null, number: solved && s.to === role ? s.number : null };
  });
  const done = room.phase === 'done';
  return {
    code: room.code, volume: room.volume, rev: room.rev, role, phase: room.phase, step: room.step, total: room.puzzles.length,
    partner: !!theirs,
    ready: !!(mine && mine.ready),
    partnerReady: !!(theirs && theirs.ready),
    names: { A: displayName(room, 'A'), B: displayName(room, 'B') },
    myName: mine ? mine.name : '',
    myLetter: mine && room.phase === 'lobby' ? mine.letter : '',
    mySpicy: !!(mine && mine.spicy),
    theirLetter: done && theirs ? theirs.letter : null,
    puzzle, seals, journal: room.journal, played: room.played.length,
    elapsed, paused: !!room.pausedAt, stats: room.stats,
    finalWord: done ? V.FINAL_WORD : null,
  };
}

// Événements vus par un joueur : le numéro d'un sceau n'est donné qu'à son détenteur.
function eventsFor(room, role, sinceRev) {
  return room.events.filter((e) => e.rev > sinceRev).map((e) => {
    if (e.kind !== 'solved' || !e.seal) return e;
    const { to, number, letter } = e.seal;
    return { ...e, seal: { letter, number: to === role ? number : null } };
  });
}

module.exports = { GameError, ONLINE_MS, newCode, createRoom, roleOf, join, act, snapshot, eventsFor };
