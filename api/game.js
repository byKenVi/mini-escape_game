'use strict';
const G = require('../lib/game');
const store = require('../lib/store');

const send = (res, status, body) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
};

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return JSON.parse(req.body);
  let data = '';
  for await (const chunk of req) { data += chunk; if (data.length > 16384) throw new G.GameError('too_big', 'Message trop long.', 413); }
  return data ? JSON.parse(data) : {};
}

const noRoom = () => new G.GameError('no_room', 'Salle introuvable. Vérifie le code.', 404);
const forbidden = () => new G.GameError('forbidden', 'Tu ne fais plus partie de cette salle.', 403);

async function create() {
  for (let i = 0; i < 10; i++) {
    const room = G.createRoom(G.newCode());
    if (await store.insert(room.code, room)) {
      return { you: { code: room.code, token: room.players.A.token }, state: G.snapshot(room, 'A') };
    }
  }
  throw new Error('Impossible de créer une salle');
}

async function join(code, token) {
  let you = null;
  const out = await store.update(code, (room) => {
    you = G.join(room, token);
    return you.changed ? true : store.NOOP;
  });
  if (!out) throw noRoom();
  return { you: { code, token: you.token }, state: G.snapshot(out.room, you.role) };
}

async function action(msg, code, token) {
  let role = null;
  const since = Number(msg.rev) || 0;
  const out = await store.update(code, (room) => {
    role = G.roleOf(room, token);
    if (!role) throw forbidden();
    return G.act(room, role, msg) ? true : store.NOOP;
  });
  if (!out) throw noRoom();
  if (msg.t === 'leave') return { left: true };
  return { state: G.snapshot(out.room, role), events: G.eventsFor(out.room, role, since) };
}

async function poll(code, token, since) {
  const now = Date.now();
  const { raw, seen } = await store.poll(code, token, now);
  if (!raw) throw noRoom();
  const room = JSON.parse(raw);
  const role = G.roleOf(room, token);
  if (!role) throw forbidden();
  const other = room.players[role === 'A' ? 'B' : 'A'];
  const body = { rev: room.rev, online: !!other && now - (seen[other.token] || 0) < G.ONLINE_MS };
  if (room.rev !== since) {
    body.state = G.snapshot(room, role);
    body.events = G.eventsFor(room, role, since);
  }
  return body;
}

module.exports = async (req, res) => {
  try {
    if (req.method === 'GET') {
      const q = new URL(req.url, 'http://x').searchParams;
      const code = String(q.get('code') || '').toUpperCase();
      return send(res, 200, await poll(code, q.get('token'), Number(q.get('rev')) || 0));
    }
    if (req.method !== 'POST') return send(res, 405, { error: 'method', msg: 'Méthode non autorisée.' });
    const msg = await readBody(req);
    if (!msg || typeof msg.t !== 'string') throw new G.GameError('bad', 'Message invalide.');
    if (msg.t === 'create') return send(res, 200, await create());
    const code = String(msg.code || '').toUpperCase().trim();
    if (msg.t === 'join') return send(res, 200, await join(code, msg.token));
    return send(res, 200, await action(msg, code, msg.token));
  } catch (e) {
    if (e instanceof G.GameError) return send(res, e.status, { error: e.code, msg: e.message });
    console.error(e);
    return send(res, 500, { error: 'server', msg: 'La bibliothèque a un souci. Réessaie dans un instant.' });
  }
};
