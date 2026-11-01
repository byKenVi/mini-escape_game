'use strict';
// Stockage des salles : Upstash Redis (REST) en production, mémoire en local.
const ROOM_TTL = 12 * 3600;
const MAX_RETRIES = 12;
const NOOP = Symbol('noop');

const roomKey = (code) => `room:${code}`;
const seenKey = (code) => `seen:${code}`;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function redisStore(url, token) {
  async function cmd(args) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(args),
    });
    const json = await res.json();
    if (!res.ok || json.error) throw new Error(`Redis : ${json.error || res.status}`);
    return json.result;
  }
  const CAS = "if redis.call('GET',KEYS[1])==ARGV[1] then redis.call('SET',KEYS[1],ARGV[2],'EX',ARGV[3]) return 1 else return 0 end";
  const POLL = "redis.call('HSET',KEYS[2],ARGV[1],ARGV[2]) redis.call('EXPIRE',KEYS[2],ARGV[3]) return {redis.call('GET',KEYS[1]),redis.call('HGETALL',KEYS[2])}";
  return {
    insert: async (code, raw) => (await cmd(['SET', roomKey(code), raw, 'NX', 'EX', ROOM_TTL])) === 'OK',
    read: (code) => cmd(['GET', roomKey(code)]),
    swap: async (code, prev, next) => (await cmd(['EVAL', CAS, 1, roomKey(code), prev, next, ROOM_TTL])) === 1,
    async poll(code, token, now) {
      const [raw, flat] = await cmd(['EVAL', POLL, 2, roomKey(code), seenKey(code), token, now, ROOM_TTL]);
      const seen = {};
      for (let i = 0; flat && i < flat.length; i += 2) seen[flat[i]] = Number(flat[i + 1]);
      return { raw, seen };
    },
  };
}

function memoryStore() {
  const rooms = new Map();
  const seen = new Map();
  return {
    insert: async (code, raw) => { if (rooms.has(code)) return false; rooms.set(code, raw); return true; },
    read: async (code) => rooms.get(code) || null,
    swap: async (code, prev, next) => { if (rooms.get(code) !== prev) return false; rooms.set(code, next); return true; },
    async poll(code, token, now) {
      const map = seen.get(code) || {};
      map[token] = now;
      seen.set(code, map);
      return { raw: rooms.get(code) || null, seen: { ...map } };
    },
  };
}

function backend() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) return redisStore(url, token);
  if (process.env.VERCEL) throw new Error('Base Redis non configurée (KV_REST_API_URL / KV_REST_API_TOKEN).');
  return memoryStore();
}
let instance = null;
const db = () => (instance = instance || backend());

// Lecture-modification-écriture optimiste : on recommence si l'autre joueur a écrit entre-temps.
// fn(room) retourne NOOP pour ne rien écrire. Retourne { room, result }.
async function update(code, fn) {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const raw = await db().read(code);
    if (!raw) return null;
    const room = JSON.parse(raw);
    room.rev++;
    const result = fn(room);
    if (result === NOOP) return { room: JSON.parse(raw), result };
    if (await db().swap(code, raw, JSON.stringify(room))) return { room, result };
    await wait(30 + Math.random() * 70 * (attempt + 1));
  }
  throw new Error('Trop de conflits d’écriture');
}

module.exports = {
  NOOP, update,
  insert: (code, room) => db().insert(code, JSON.stringify(room)),
  poll: (code, token, now) => db().poll(code, token, now),
};
