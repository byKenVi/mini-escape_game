(function () {
  'use strict';

  const $app = document.getElementById('app');
  const $toast = document.getElementById('toast');
  const $flyers = document.getElementById('flyers');
  const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
  // L'indice d'une taquinerie est envoyé au serveur : ne jamais réordonner, seulement ajouter à la fin.
  const TEASES = [
    { text: 'Réfléchis, ça te va bien' },
    { text: 'Tu écoutes, au moins ?' },
    { text: 'C’était écrit juste là' },
    { text: 'Je te l’avais dit' },
    { text: 'Mon petit génie' },
    { text: 'Je te garde quand même', heart: true },
    { text: 'Un bisou, pour la peine', heart: true },
    { text: 'Les yeux sur ton écran, tricheur', volume: 2 },
  ];
  const WRONG_LINES = [
    '{name} propose « {guess} ». Le mécanisme ne daigne même pas bouger.',
    '{name} a tenté « {guess} ». Alexandrine lève un sourcil.',
    '« {guess} » ? Vraiment, {name} ? Les livres retiennent tout.',
    '{name} vient de faire rire un fantôme avec « {guess} ».',
    '{name} : « {guess} ». Ce sera noté dans le registre.',
  ];
  const WRONG_MELODY = [
    'Le clavecin grince sous les doigts de {name}. On reprend du début.',
    'Fausse note, {name}. Alexandrine se bouche les oreilles.',
    '{name} vient d’inventer un nouveau genre musical. On reprend.',
  ];

  // Ce qui change d'un tome à l'autre, côté interface.
  const TOMES = {
    1: {
      chapter: 'Chapitre', chapterAll: 'Chapitres',
      roles: { A: 'L’Archiviste', B: 'Cartographe' },
      roleDesc: {
        A: 'Tu lis ce qui est écrit : grimoires, registres, partitions.',
        B: 'Tu manies ce qui s’ouvre : cadenas, disques, clavecin.',
      },
      prologue: [
        'Alexandrine gardait la grande bibliothèque. Augustin dessinait des cartes de pays où elle n’irait jamais. Pendant onze ans, ils ont vécu loin l’un de l’autre, et ils se sont écrit.',
        'Pour que personne d’autre ne lise leurs lettres, elle les a cachées ici, derrière des mécanismes qui ne s’ouvrent qu’à deux voix.',
        'Ce soir, la porte vient de se refermer derrière vous. Sur le pupitre, un billet encore frais :',
      ],
      note: 'Vous êtes deux, vous êtes loin, et vous vous parlez. Parfait, ce sont les seules règles. Sortez d’ici avant l’aube. Et taquinez-vous : chez moi, c’est obligatoire.',
      rules: (other) => [
        ['Vos écrans sont différents.', ` Ce que tu vois, ${other} ne le voit pas. Tout passe par la voix.`],
        ['Un seul de vous deux tape la réponse.', ' Peu importe lequel, le mécanisme s’ouvre pour vous deux.'],
        ['Les indices sont gratuits.', ' Sauf pour l’honneur : le registre note qui les demande.'],
      ],
      enter: 'Entrer dans la bibliothèque',
      ambience: 'Feu de cheminée',
      ambienceNote: 'Pour le feu de cheminée, un casque évite que l’autre l’entende dans l’appel.',
      lobbyHint: 'Envoie le lien, lance l’appel, et attends ici.',
      invite: 'Une bibliothèque, une porte fermée à clé, et tu es la seule personne qui peut m’en sortir. Appelle-moi et viens :',
      letterLabel: 'Un mot sous scellé',
      letterHolder: 'Écris quelque chose à l’autre. Alexandrine le garde sous cire : il ne s’ouvrira qu’une fois la porte franchie.',
      sealWord: 'sceau', sealsWord: 'sceaux',
      lastLetter: 'Dernière lettre', foundLetter: 'Lettre retrouvée', leaveBtn: 'Sortir',
      letterFrom: 'Le mot de', openLabel: 'Briser le sceau',
      outEyebrow: 'La porte est ouverte', outTitle: 'Dehors, c’est l’aube', outStory: 'Ils se sont revus au printemps. À votre tour.',
      replay: 'Rejouer, avec de nouveaux codes', shareName: 'la Bibliothèque d’Alexandrine',
      cardLegend: 'Alexandrine écoute. Elle n’a que ça à faire depuis deux siècles.',
      registry: 'Le registre d’Alexandrine', rereadLabel: 'Relire toutes leurs lettres',
    },
    2: {
      chapter: 'Voiture', chapterAll: 'Voitures',
      roles: { A: 'La Vigie', B: 'Le Télégraphiste' },
      roleDesc: {
        A: 'Tu vois ce que l’autre ne voit pas : tableaux, lanternes, plans. Tu décris.',
        B: 'Tu tiens ce qui s’ouvre : billets, codes, loquets. Tu écoutes, puis tu tranches.',
      },
      prologue: [
        'Il est rentré au printemps. Elle lui a dit qu’il était en retard. Et pour la première fois en onze ans, ils sont partis ensemble : deux billets sur le Nocturne, le train de nuit qui traverse l’Europe.',
        'Mais Alexandrine n’a jamais rien offert sans le verrouiller. Elle a laissé dans chaque voiture une épreuve pour Augustin. Puis, un soir, elle les a laissées pour d’autres.',
        'Ce soir, le train part. Sur la banquette, un télégramme vous attend :',
      ],
      note: 'Asseyez-vous l’un à côté de l’autre, chacun son écran. Une seule règle : on ne regarde pas celui de l’autre. Je vous fais confiance. Le contrôleur, beaucoup moins. Vous avez toute la nuit. Elle passe vite, vous verrez.',
      rules: (other) => [
        ['Côte à côte, un téléphone chacun.', ` Ce que tu vois, ${other} ne doit pas le voir. Promis, juré : les yeux sur ton écran, tout passe par la voix.`],
        ['Après chaque voiture, un entracte.', ' Un télégramme, puis un geste à faire ensemble, et parfois une question ou une carte que l’un de vous a écrite. Tout s’affiche sur vos deux écrans en même temps : on passe à la suite quand vous avez appuyé tous les deux. Le chrono s’arrête, et chacun peut passer une carte.'],
        ['Les indices sont gratuits.', ' Sauf pour l’honneur : le contrôleur note qui les demande.'],
      ],
      enter: 'Promis, je ne regarde pas',
      ambience: 'Bruit du train',
      ambienceNote: 'Un seul téléphone suffit pour le bruit du train : vous êtes dans la même pièce.',
      lobbyHint: 'Montre ce code à l’autre, ou envoie-lui le lien.',
      invite: 'Un train de nuit, deux billets, et une place à côté de moi. Viens :',
      letterLabel: 'Un billet retour',
      letterHolder: 'Écris quelque chose à l’autre. Le contrôleur le garde sous pli : il ne sera remis qu’à l’arrivée.',
      sealWord: 'poinçon', sealsWord: 'poinçons',
      lastLetter: 'Dernier télégramme', foundLetter: 'Télégramme retrouvé', leaveBtn: 'Descendre du train',
      letterFrom: 'Le billet retour de', openLabel: 'Ouvrir le pli',
      outEyebrow: 'Terminus', outTitle: 'Le jour se lève sur la mer', outStory: 'Revoir, c’était la promesse. Rester, c’est tous les matins d’après.',
      replay: 'Reprendre le train, avec de nouveaux codes', shareName: 'le Train de Nuit',
      cardLegend: 'Le chrono est arrêté. Le train, lui, continue.',
      registry: 'Le carnet du contrôleur', rereadLabel: 'Relire tous leurs télégrammes',
    },
  };
  const tome = () => TOMES[(state && state.volume) || 1];
  const roleName = (r) => tome().roles[r];
  const teases = () => TEASES.map((t, id) => ({ ...t, id })).filter((t) => !t.volume || t.volume === ((state && state.volume) || 1));

  const SYM = {
    moon: '<svg viewBox="0 0 48 48"><path d="M30 6a18 18 0 1 0 12 26A15 15 0 0 1 30 6z" fill="currentColor"/></svg>',
    star: '<svg viewBox="0 0 48 48"><path d="M24 3l5 15 15 6-15 6-5 15-5-15-15-6 15-6z" fill="currentColor"/></svg>',
    tower: '<svg viewBox="0 0 48 48"><path fill-rule="evenodd" d="M12 42V18h-2V8h6v4h4V8h8v4h4V8h6v10h-2v24zM20 42v-9a4 4 0 0 1 8 0v9z" fill="currentColor"/></svg>',
    flower: '<svg viewBox="0 0 48 48"><path fill-rule="evenodd" d="M24 4a8 8 0 0 1 8 8 8 8 0 1 1 0 24 8 8 0 1 1-16 0 8 8 0 1 1 0-24 8 8 0 0 1 8-8zm0 15a5 5 0 1 0 0 10 5 5 0 0 0 0-10z" fill="currentColor"/></svg>',
  };
  const WRONG_MAZE = [
    '{name} vient de rencontrer une cloison. Retour au départ.',
    'Bruit sourd dans le noir. {name} repart du début, et le nez en a pris un coup.',
    '{name} a foncé dans le mur. Le guide n’y est peut-être pas pour rien.',
  ];
  const WRONG_GRID = [
    'Le vitrail de {name} ne fait pas céder le loquet. Sa gauche est-elle bien sa gauche ?',
    'Le loquet ne bouge pas. Dans un miroir, {name}, tout s’inverse.',
  ];
  const SYM_NAME = { moon: 'Lune', star: 'Étoile', tower: 'Tour', flower: 'Fleur' };
  const ICON = {
    bulb: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.8.8 1 1.5 1 2.5h6c0-1 .2-1.7 1-2.5A6 6 0 0 0 12 3z"/></svg>',
    quill: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 4c-7 0-12 4-13 11l-2 5M7 15c5 0 10-3 13-11M9 12h4"/></svg>',
    heart: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-8.5-5.2-8.5-11.3A4.7 4.7 0 0 1 12 7a4.7 4.7 0 0 1 8.5 2.7C20.5 15.8 12 21 12 21z"/></svg>',
    fire: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3c1 4 5 5.5 5 10.5a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-6 1-9.5z"/></svg>',
  };
  const CREST = '<svg class="crest" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 14c8-3 16-3 24 2 8-5 16-5 24-2v36c-8-3-16-3-24 2-8-5-16-5-24-2z"/><path d="M32 16v36"/><circle cx="46" cy="30" r="4"/><path d="M46 34v8m0-3h3m-3 3h3"/></svg>';

  /* ---------- état ---------- */
  let session = load('ebib_session', null);
  let state = null, recv = 0, online = false, fails = 0, busy = false, leaving = false;
  let homeError = '', lastHtml = null, lastStepKey = '', lastEventRev = 0;
  let typed = '', wheelTurn = 0, scratch = emptyScratch();
  let nameDraft = load('ebib_name', ''), letterDraft = '', draftFor = '';
  let reveal = null, surpriseOpen = false, notesOpen = false, teaseOpen = false, hintArmed = false, envelopeOpen = false, confirmQuit = false;
  let introSeen = false, ambienceOn = load('ebib_ambience', false);
  let cardDraft = '', surpriseDraft = '', lastInterlude = '';
  let spicyDraft = false, lampRun = 0, lampLit = false, lampPlaying = false, cardTimer = null;
  let audioCtx = null, ambience = null, whiteNoise = null;
  let profileT, hintT, toastT, pollT;

  function load(key, fallback) { try { const v = localStorage.getItem(key); return v === null ? fallback : JSON.parse(v); } catch (e) { return fallback; } }
  function store(key, value) { try { value === null ? localStorage.removeItem(key) : localStorage.setItem(key, JSON.stringify(value)); } catch (e) {} }
  function saveSession(s) { session = s; store('ebib_session', s); }
  function urlRoom() { const r = new URLSearchParams(location.search).get('r'); return r ? r.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4) : ''; }
  function emptyScratch() { return { marks: [], grid: {}, digits: [] }; }
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = (ms) => { const s = Math.max(0, Math.floor(ms / 1000)); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); };
  const plural = (n, word) => `${n} ${word}${n > 1 ? 's' : ''}`;
  const pickOne = (a) => a[Math.floor(Math.random() * a.length)];
  const nameOf = (r) => (state ? state.names[r] : roleName(r));
  const otherOf = (r) => (r === 'A' ? 'B' : 'A');
  const fill = (tpl, map) => tpl.replace(/\{(\w+)\}/g, (_, k) => map[k]);

  /* ---------- réseau ---------- */
  async function api(body) {
    const res = await fetch('/api/game', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) { const err = new Error(json.msg || 'Erreur réseau'); err.code = json.error; throw err; }
    return json;
  }

  // Les actions partent une par une, dans l'ordre : les notes du clavecin ne doivent pas se croiser.
  let chain = Promise.resolve();
  function enqueue(task) { chain = chain.then(task, task); return chain; }
  function act(msg) {
    return enqueue(async () => {
      if (!session) return;
      try { apply(await api({ ...msg, code: session.code, token: session.token, rev: state ? state.rev : 0 })); fails = 0; }
      catch (e) { onApiError(e); }
    });
  }
  function enter(body) {
    busy = true; render();
    return enqueue(async () => {
      try { apply(await api(body)); fails = 0; schedulePoll(0); }
      catch (e) { onApiError(e); }
      busy = false; render();
    });
  }
  function onApiError(e) {
    if (e.code === 'no_room' || e.code === 'forbidden' || e.code === 'full') return dropToHome(e.message);
    if (state) toast('Le réseau fait des siennes, réessaie.', true);
    else { homeError = e.message === 'Failed to fetch' ? 'Pas de réseau pour l’instant.' : e.message; render(); }
  }
  function dropToHome(msg) {
    clearTimeout(pollT);
    saveSession(null);
    state = null; reveal = null; homeError = msg || ''; draftFor = ''; lastEventRev = 0; online = false;
    history.replaceState(null, '', '/');
    render();
  }

  function schedulePoll(delay) {
    clearTimeout(pollT);
    if (!session) return;
    const normal = document.hidden ? 5000 : state && state.phase === 'done' ? 4000 : 1000;
    pollT = setTimeout(poll, delay != null ? delay : fails ? Math.min(8000, 1000 * 2 ** fails) : normal);
  }
  async function poll() {
    const s = session;
    if (!s) return;
    try {
      const res = await fetch(`/api/game?code=${encodeURIComponent(s.code)}&token=${encodeURIComponent(s.token)}&rev=${state ? state.rev : 0}`);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) { const err = new Error(json.msg || 'Erreur'); err.code = json.error; throw err; }
      if (session === s) { fails = 0; apply(json); }
    } catch (e) {
      if (session !== s || leaving) return;
      if (e.code === 'no_room' || e.code === 'forbidden') return dropToHome(e.message);
      fails++;
      render();
    }
    schedulePoll();
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden) schedulePoll(0); });

  function apply(j) {
    if (j.left) return;
    if (j.you) { saveSession(j.you); history.replaceState(null, '', '?r=' + j.you.code); }
    if (typeof j.online === 'boolean') online = j.online;
    if (j.state && (!state || j.state.code !== state.code || j.state.rev >= state.rev)) onState(j.state);
    if (j.events && j.events.length) {
      const fresh = j.events.filter((e) => e.rev > lastEventRev);
      lastEventRev = Math.max(lastEventRev, ...j.events.map((e) => e.rev));
      fresh.forEach(onEvent);
    }
    render();
  }

  function onState(m) {
    const prev = state;
    if (!prev || prev.code !== m.code) lastEventRev = m.rev;
    state = m; recv = Date.now();
    const ik = m.interlude ? m.interlude.idx + ':' + m.interlude.stage : '';
    if (ik !== lastInterlude) { lastInterlude = ik; stopCardTimer(); }
    if (draftFor !== m.code) {
      draftFor = m.code;
      if (m.myName) nameDraft = m.myName;
      letterDraft = m.myLetter || '';
      spicyDraft = !!m.mySpicy;
      cardDraft = m.myCard || ''; surpriseDraft = m.mySurprise || '';
      introSeen = load('ebib_intro_' + m.code, false);
      if (nameDraft && !m.myName) act({ t: 'profile', name: nameDraft });
    }
    if (prev && prev.phase === 'done' && m.phase === 'lobby') {
      letterDraft = ''; spicyDraft = false; cardDraft = ''; surpriseDraft = ''; surpriseOpen = false; envelopeOpen = false; reveal = null;
      for (let i = 0; i < m.total; i++) store(scratchKey(m.code, i), null);
    }
    if (m.phase === 'playing' && m.puzzle) {
      const key = m.code + ':' + m.puzzle.idx;
      if (key !== lastStepKey) {
        lastStepKey = key; typed = ''; wheelTurn = 0; hintArmed = false; lampRun++; lampLit = false; lampPlaying = false;
        scratch = load(scratchKey(m.code, m.puzzle.idx), emptyScratch());
        window.scrollTo(0, 0);
      }
    } else if (m.phase === 'lobby') lastStepKey = '';
  }
  const scratchKey = (code, idx) => `ebib_scratch_${code}_${idx}`;
  const saveScratch = () => { if (state && state.puzzle) store(scratchKey(state.code, state.puzzle.idx), scratch); };

  function onEvent(e) {
    const me = state.role;
    if (e.kind === 'note') { if (e.by !== me) playNote(e.level); }
    else if (e.kind === 'wrong') {
      const lines = e.what === 'maze' ? WRONG_MAZE : e.what === 'grid' ? WRONG_GRID : e.guess ? WRONG_LINES : WRONG_MELODY;
      toast(fill(pickOne(lines), { name: nameOf(e.by), guess: e.guess }), true);
      playThud(); shakeAnswer(); buzz([40, 60, 40]);
    } else if (e.kind === 'round') {
      if (e.agree) playPing(); else playThud();
    } else if (e.kind === 'quizfail') {
      toast(`« Vous vous connaissez vraiment, tous les deux ? » Le contrôleur repose d’autres questions.`, true);
    } else if (e.kind === 'solved') {
      const show = () => {
        reveal = { ...e, stage: e.finished ? 'door' : 'letter' };
        if (e.finished) { playDoor(); setTimeout(() => { if (reveal && reveal.stage === 'door') { reveal.stage = 'letter'; render(); } }, 3400); }
        else playChime();
        buzz(90);
        render();
      };
      if (state.volume === 2 && !e.finished) { playChime(); buzz(90); return; }
      state.volume === 1 && e.idx === 4 ? setTimeout(show, 650) : show();
    } else if (e.kind === 'start') playChime();
    else if (e.kind === 'tease') { if (e.from !== me) flyTease(e); }
    else if (e.kind === 'hint') {
      if (e.by !== me) toast(`${nameOf(e.by)} a craqué : un indice vient de tomber.`);
      setTimeout(() => { const list = document.querySelectorAll('.hint'); if (list.length) list[list.length - 1].scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 120);
    }
  }

  /* ---------- audio ---------- */
  function ac() {
    if (!audioCtx) { try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} }
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }
  document.addEventListener('pointerdown', () => { ac(); if (ambienceOn && !ambience) startAmbience(); });
  function tone(freq, dur, type, vol, when) {
    const c = ac(); if (!c) return;
    const t = c.currentTime + (when || 0);
    const o = c.createOscillator(), g = c.createGain();
    o.type = type || 'triangle'; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.25, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + dur + 0.05);
  }
  function noiseBuffer(c, seconds, brown) {
    const buf = c.createBuffer(1, c.sampleRate * seconds, c.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < d.length; i++) {
      const w = Math.random() * 2 - 1;
      if (brown) { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } else d[i] = w;
    }
    return buf;
  }
  function burst(freq, q, vol, dur, when) {
    const c = ac(); if (!c) return;
    const t = c.currentTime + (when || 0);
    const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    whiteNoise = whiteNoise || noiseBuffer(c, 3, false);
    s.buffer = whiteNoise;
    f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(c.destination); s.start(t, 0, dur + 0.02);
  }
  function playNote(level) {
    const f = { 1: 261.63, 2: 329.63, 3: 392.0, 4: 523.25 }[level];
    tone(f, 0.9, 'sawtooth', 0.09); tone(f * 2, 0.5, 'triangle', 0.09); tone(f * 3, 0.25, 'sine', 0.03); burst(2800, 3, 0.05, 0.03);
    const k = document.querySelector(`.key[data-level="${level}"]`);
    if (k) { k.classList.add('hit'); setTimeout(() => k.classList.remove('hit'), 180); }
  }
  function playChime() { [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, 1.1, 'sine', 0.13, i * 0.12)); burst(500, 1, 0.12, 0.25); }
  function playThud() { tone(92, 0.28, 'sine', 0.3); burst(320, 1, 0.1, 0.09); }
  function playPing() { tone(880, 0.35, 'sine', 0.07); tone(1320, 0.3, 'sine', 0.04, 0.09); }
  function playPage() { burst(3800, 0.8, 0.05, 0.22); burst(2200, 0.7, 0.03, 0.3, 0.1); }
  function playDoor() { tone(58, 2.6, 'sawtooth', 0.09); burst(190, 2, 0.1, 2.4); [392, 523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, 2.2, 'sine', 0.09, 1.5 + i * 0.22)); }
  function startAmbience() {
    const c = ac(); if (!c || ambience) return;
    const out = c.createGain();
    out.gain.setValueAtTime(0.0001, c.currentTime); out.gain.exponentialRampToValueAtTime(0.5, c.currentTime + 2);
    out.connect(c.destination);
    if (state && state.volume === 2) {
      // Le roulement du train : un grondement grave et le double choc des rails.
      const rumble = c.createBufferSource(); rumble.buffer = noiseBuffer(c, 6, true); rumble.loop = true;
      const low = c.createBiquadFilter(); low.type = 'lowpass'; low.frequency.value = 240;
      const rumbleGain = c.createGain(); rumbleGain.gain.value = 0.5;
      rumble.connect(low); low.connect(rumbleGain); rumbleGain.connect(out); rumble.start();
      const clack = (when) => {
        const o = c.createOscillator(), g = c.createGain(), t = c.currentTime + when;
        o.type = 'triangle'; o.frequency.value = 72;
        g.gain.setValueAtTime(0.11, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.13);
        o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.16);
      };
      const rails = setInterval(() => { clack(0); clack(0.17); }, 1250);
      ambience = { out, stop() { clearInterval(rails); out.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.6); setTimeout(() => { rumble.stop(); out.disconnect(); }, 700); } };
      return;
    }
    const fire = c.createBufferSource(); fire.buffer = noiseBuffer(c, 6, true); fire.loop = true;
    const low = c.createBiquadFilter(); low.type = 'lowpass'; low.frequency.value = 520;
    const fireGain = c.createGain(); fireGain.gain.value = 0.32;
    fire.connect(low); low.connect(fireGain); fireGain.connect(out); fire.start();
    const pads = [110, 110.6, 164.8].map((f) => {
      const o = c.createOscillator(), g = c.createGain();
      o.type = 'sine'; o.frequency.value = f; g.gain.value = 0.018;
      o.connect(g); g.connect(out); o.start();
      return o;
    });
    const crackle = setInterval(() => { if (Math.random() < 0.55) burst(1400 + Math.random() * 3000, 4, 0.012 + Math.random() * 0.035, 0.02 + Math.random() * 0.04); }, 240);
    ambience = { out, stop() { clearInterval(crackle); out.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.6); setTimeout(() => { fire.stop(); pads.forEach((o) => o.stop()); out.disconnect(); }, 700); } };
  }
  function toggleAmbience() {
    ambienceOn = !ambienceOn; store('ebib_ambience', ambienceOn);
    if (ambienceOn) startAmbience(); else if (ambience) { ambience.stop(); ambience = null; }
    render();
  }

  /* ---------- petits effets ---------- */
  function toast(msg, bad) {
    $toast.textContent = msg; $toast.className = 'show' + (bad ? ' bad' : '');
    clearTimeout(toastT); toastT = setTimeout(() => { $toast.className = ''; }, bad ? 4200 : 3000);
  }
  function shakeAnswer() { const a = document.querySelector('.answerbox, .keys'); if (a) { a.classList.remove('shake'); void a.offsetWidth; a.classList.add('shake'); } }
  function flyTease(e) {
    const t = TEASES[e.id]; if (!t) return;
    playPing();
    const el = document.createElement('div');
    el.className = 'flyer' + (t.heart ? ' love' : '');
    el.style.setProperty('--tilt', `${(Math.random() * 7 - 3.5).toFixed(1)}deg`);
    el.innerHTML = `<small>${esc(nameOf(e.from))} t’écrit</small>${esc(t.text)}`;
    $flyers.appendChild(el);
    setTimeout(() => el.remove(), 4600);
    if (t.heart) hearts();
  }
  function hearts() {
    for (let i = 0; i < 10; i++) {
      const h = document.createElement('div');
      h.className = 'floatheart'; h.innerHTML = ICON.heart;
      h.style.left = `${12 + Math.random() * 76}%`;
      h.style.animationDelay = `${(Math.random() * 0.9).toFixed(2)}s`;
      h.style.setProperty('--s', (0.6 + Math.random() * 0.9).toFixed(2));
      $flyers.appendChild(h);
      setTimeout(() => h.remove(), 4200);
    }
  }

  /* ---------- vues ---------- */
  function viewHome() {
    const code = urlRoom();
    return `<main class="home" data-key="home">
      ${CREST}
      <p class="eyebrow">Escape game pour deux</p>
      <h1>La Bibliothèque<br>d’Alexandrine</h1>
      <p class="tag">Deux écrans différents, deux amoureux à retrouver,<br>et vous deux pour ouvrir les serrures.</p>
      <div class="tomes">
        <button class="tomecard t1" data-act="create" data-volume="1" ${busy ? 'disabled' : ''}>
          <span class="tomeno">Tome I</span>
          <b>La Bibliothèque</b>
          <span class="tomewhere">À distance, en appel</span>
          <span class="tomedesc">Une porte fermée à clé, onze ans de lettres et une heure pour sortir.</span>
        </button>
        <button class="tomecard t2" data-act="create" data-volume="2" ${busy ? 'disabled' : ''}>
          <span class="tomeno">Tome II</span>
          <b>Le Train de Nuit</b>
          <span class="tomewhere">Côte à côte, chacun son écran</span>
          <span class="tomedesc">La suite de leur histoire : sept voitures, des questions qui comptent et des cartes à oser.</span>
        </button>
      </div>
      <div class="card entry">
        <div class="sep">l’autre t’a donné un code ?</div>
        <label class="sr" for="joincode">Code de la salle</label>
        <div class="joinrow">
          <input class="codeinput" id="joincode" maxlength="4" placeholder="CODE" autocomplete="off" autocapitalize="characters" spellcheck="false" value="${esc(code)}">
          <button class="btn ghost" data-act="join" ${busy ? 'disabled' : ''}>Rejoindre</button>
        </div>
        <div class="err" role="alert">${esc(homeError)}</div>
      </div>
      <ol class="how">
        <li><b>Un téléphone chacun</b>Vous ne voyez jamais la même chose. Tout passe par la voix.</li>
        <li><b>Parlez</b>Il faut décrire, écouter, et assumer ses erreurs. L’autre s’en souviendra.</li>
        <li><b>Retrouvez les lettres</b>Sept étapes, une bonne heure de jeu, et une histoire d’amour à reconstituer.</li>
      </ol>
    </main>`;
  }

  function viewLobby() {
    const s = state, me = s.role, other = otherOf(me);
    return `<main class="lobby" data-key="lobby">
      <header class="lobbyhead">
        <p class="eyebrow">Salle d’attente</p>
        <div class="roomcode" aria-label="Code de la salle">${esc(s.code)}</div>
        ${s.volume === 2 ? '<p class="lobbytome">Tome II · Le Train de Nuit</p>' : ''}
        ${s.partner ? '' : `<button class="btn" data-act="invite">Inviter l’autre</button><p class="legend">${tome().lobbyHint}</p>`}
      </header>
      <div class="players">
        <div class="pl me">
          <div class="who">${roleName(me)}</div>
          <div class="pname">${esc(nameDraft || 'Toi')}</div>
          <div class="st on">${s.ready ? 'Devant la porte' : 'C’est toi'}</div>
        </div>
        <div class="pl ${s.partner ? '' : 'away'}">
          <div class="who">${roleName(other)}</div>
          <div class="pname">${s.partner ? esc(s.names[other] === roleName(other) ? 'L’autre' : s.names[other]) : '…'}</div>
          <div class="st ${s.partner ? 'on' : ''}">${s.partner ? (s.partnerReady ? 'N’attend plus que toi' : 'Dans la salle') : 'Pas encore là'}</div>
        </div>
      </div>
      <p class="roledesc">${tome().roleDesc[me]}${s.partner ? ' <button class="linkbtn" data-act="swap">Échanger les rôles</button>' : ''}</p>
      <div class="card form">
        <label for="pname">Ton prénom <span>(ou le surnom que l’autre va détester)</span></label>
        <input id="pname" class="field" maxlength="24" autocomplete="off" placeholder="Comment t’appeler ?" value="${esc(nameDraft)}">
        <label for="pletter">${tome().letterLabel} <span>(facultatif, mais ça se verra)</span></label>
        <textarea id="pletter" class="field" maxlength="800" rows="3" placeholder="${tome().letterHolder}">${esc(letterDraft)}</textarea>
        ${s.volume === 2 ? trainFields(s, other) : ''}
        ${s.volume === 2 ? `<label class="spicy" for="pspicy">
          <input type="checkbox" id="pspicy" ${spicyDraft ? 'checked' : ''}>
          <span><b>Entractes osés</b> J’ai 18 ans ou plus, et je dis oui. Si vous cochez tous les deux : un geste osé après chaque voiture, avec deux gestes tendres pour commencer en douceur. Sinon : uniquement des gestes tendres. Le jeu n’affiche jamais le choix de l’autre, et chaque carte peut être passée sans explication.</span>
        </label>` : ''}
      </div>
      <div class="row">
        <button class="btn big" data-act="ready" ${s.partner ? '' : 'disabled'}>${s.ready ? 'Attends, je reviens' : s.partnerReady ? 'On y va' : 'Je suis là, on commence'}</button>
      </div>
      ${s.partner ? '<div class="row"><button class="linkbtn" data-act="invite">Copier le lien d’invitation</button></div>' : ''}
      <div class="row"><button class="linkbtn dim" data-act="quit">Quitter cette salle</button></div>
    </main>`;
  }

  function trainFields(s, other) {
    const them = esc(s.partner && s.names[other] !== roleName(other) ? s.names[other] : 'l’autre');
    const when = s.role === 'A' ? 'III' : 'V';
    return `<label for="pcard">Ta carte pour ${them} <span>(facultatif)</span></label>
        <textarea id="pcard" class="field" maxlength="300" rows="3" placeholder="Une question à lui poser, ou un geste à lui demander. Exemple : « Raconte-moi la première fois que tu as pensé à moi. »">${esc(cardDraft)}</textarea>
        <p class="fieldnote">Elle s’affichera sur vos deux écrans après la voiture ${when}, signée de ton prénom.</p>`;
  }

  function viewIntro() {
    const t = tome();
    return `<div class="modal intro" data-key="intro"><div class="sheet parchment">
      <p class="eyebrow ink">Prologue</p>
      ${t.prologue.map((line, i) => `<p class="fade f${i + 1}">${line}</p>`).join('')}
      <blockquote class="hand fade f4">${t.note}<cite>— A.</cite></blockquote>
      <ul class="rules fade f5">${t.rules(esc(nameOf(otherOf(state.role)))).map(([head, body]) => `<li><b>${head}</b>${body}</li>`).join('')}</ul>
      <div class="row fade f5">
        <button class="btn" data-act="closeintro">${t.enter}</button>
        <button class="btn ghost ink ${ambienceOn ? 'active' : ''}" data-act="ambience" aria-pressed="${ambienceOn}">${ICON.fire}<span>${t.ambience} : ${ambienceOn ? 'oui' : 'non'}</span></button>
      </div>
      <p class="legend ink fade f5">${t.ambienceNote}</p>
    </div></div>`;
  }

  function sealsBar() {
    return `<div class="seals" role="img" aria-label="${state.seals.filter((x) => x.solved).length} ${tome().sealsWord} sur 6">${state.seals.map((s) => (s.solved
      ? `<div class="seal on">${esc(s.letter)}${s.number != null ? `<sup>${s.number}</sup>` : ''}</div>`
      : '<div class="seal"></div>')).join('')}</div>`;
  }

  function viewGame() {
    const s = state, p = s.puzzle, me = s.role, other = otherOf(me);
    const remaining = p.hintsMax - p.hints.length;
    const light = ['clues', 'score', 'cipher', 'ticket', 'chart', 'mazemap', 'line', 'notices'].includes(p.view.type);
    return `<main class="game" data-key="game">
      <header class="hud">
        <div class="hudleft"><span class="role">${esc(s.names[me])}</span><span class="timer" id="timer">${fmt(elapsed())}</span></div>
        <div class="hudright">
          <span class="conn ${online ? '' : 'off'}" title="${online ? 'Connecté' : 'Hors de l’écran pour le moment'}">${esc(s.names[other])}</span>
          <button class="iconbtn ${ambienceOn ? 'active' : ''}" data-act="ambience" aria-label="${tome().ambience}" aria-pressed="${ambienceOn}">${ICON.fire}</button>
        </div>
      </header>
      ${fails > 1 ? '<div class="netwarn">Connexion perdue, on réessaie…</div>' : ''}
      ${sealsBar()}
      <section class="puzzle" data-key="step-${p.idx}">
        <p class="eyebrow">${tome().chapter} ${ROMAN[p.idx]} sur ${ROMAN[s.total - 1]}</p>
        <h2 class="ptitle">${esc(p.title)}</h2>
        <p class="pstory">${esc(p.story)}</p>
        <div class="brief">
          <div class="you"><b>Toi</b>${esc(p.view.mission)}</div>
          <div class="them"><b>Chez ${esc(s.names[other])}</b><span>${esc(p.view.other)}</span></div>
        </div>
        <div class="panel ${light ? 'parchment' : 'dark'}">
          ${viewBody(p)}
          ${viewInput(p)}
        </div>
        <div class="hints">${p.hints.map((h, i) => `<div class="hint"><b>Indice ${i + 1}</b>${esc(h)}</div>`).join('')}</div>
      </section>
      <div class="row quitrow">${confirmQuit
    ? `<span class="legend">Tu ne pourras plus revenir dans cette salle.</span><button class="linkbtn" data-act="quitconfirm">Quitter quand même</button><button class="linkbtn" data-act="quitcancel">Rester</button>`
    : '<button class="linkbtn dim" data-act="quit">Quitter la partie</button>'}</div>
    </main>
    <nav class="dock" aria-label="Outils">
      <button class="dockbtn ${hintArmed ? 'armed' : ''}" data-act="hint" ${remaining > 0 ? '' : 'disabled'}>${ICON.bulb}<span>${hintArmed ? 'Vraiment ?' : remaining > 0 ? `Indice (${remaining})` : 'Plus d’indice'}</span></button>
      <button class="dockbtn ${notesOpen ? 'active' : ''}" data-act="notes" aria-expanded="${notesOpen}">${ICON.quill}<span>Carnet</span></button>
      <button class="dockbtn tease ${teaseOpen ? 'active' : ''}" data-act="teasemenu" aria-expanded="${teaseOpen}">${ICON.heart}<span>Taquiner</span></button>
    </nav>
    ${notesOpen ? notebook() : ''}
    ${teaseOpen ? teaseMenu() : ''}`;
  }

  function teaseMenu() {
    return `<div class="teasemenu" data-key="tease">
      <p class="eyebrow">Envoyer à ${esc(nameOf(otherOf(state.role)))}</p>
      ${teases().map((t) => `<button class="teasebtn ${t.heart ? 'love' : ''}" data-act="tease" data-id="${t.id}">${esc(t.text)}</button>`).join('')}
    </div>`;
  }

  function viewBody(p) {
    const v = p.view;
    switch (v.type) {
      case 'books': return `<div class="alcove"><div class="shelf">${v.books.map((b) => `<div class="book" aria-label="${SYM_NAME[b.sym]}, ${b.year}">${SYM[b.sym]}<div class="yr">${b.year}</div></div>`).join('')}</div></div>`;
      case 'lock': return `<div class="plaque">${esc(v.plaque)}</div><div class="table">${v.table.map((t) => `<div class="trow" aria-label="${SYM_NAME[t.sym]} égale ${t.digit}">${SYM[t.sym]}<span class="eq">=</span><span class="dg">${t.digit}</span></div>`).join('')}</div>`;
      case 'cipher': return `<div class="cipher" style="--len:${v.cipher.length}">${esc(v.cipher).split('').map((c) => `<span>${c}</span>`).join('')}</div>`;
      case 'wheel': return wheel();
      case 'sheet': return sheet(v);
      case 'clues': return `${v.intro ? `<p class="cintro">${esc(v.intro)}</p>` : ''}<ol class="cluelist">${v.clues.map((c) => `<li>${esc(c)}</li>`).join('')}</ol>${v.scratch === 'grid' ? scratchGrid() : ''}${v.scratch === 'digits' ? scratchDigits() : ''}`;
      case 'score': return staff(v);
      case 'keys': return `<div class="keys">${[1, 2, 3, 4].map((l) => `<button class="key" data-level="${l}" data-act="key" aria-label="Note ${l}">${l}<small>${['grave', 'médium', 'haut', 'aigu'][l - 1]}</small></button>`).join('')}</div>${lamps(p.input.length)}`;
      case 'door': return door(v);
      case 'board': return board(v);
      case 'ticket': return `<div class="stub"><p class="stubhead">Compagnie du Nocturne · Billet n° <span>▒▒▒</span></p><ul class="stublist">${v.clues.map((c) => `<li>${esc(c)}</li>`).join('')}</ul></div>`;
      case 'lamp': return lamp();
      case 'chart': return `<div class="chart">${Object.entries(v.chart).map(([l, code]) => `<div class="chartcell"><b>${l}</b><span>${code.replace(/\./g, '•').replace(/-/g, '▬')}</span></div>`).join('')}</div><p class="legend">• éclat court, ▬ éclat long</p>`;
      case 'mazemap': return mazeMap(v);
      case 'mazepad': return mazePad(v, p.pos);
      case 'quiz': return quiz(p.quiz);
      case 'mirrorsee': return `<div class="mirror see">${colHead(v.size)}${v.cells.map((on) => `<div class="pane ${on ? 'lit' : ''}"></div>`).join('')}</div><p class="legend">Les lignes se comptent de haut en bas, les colonnes de gauche à droite.</p>`;
      case 'mirrordo': return `<div class="mirror do">${colHead(v.size)}${Array.from({ length: v.size * v.size }, (_, i) => `<button class="pane ${scratch.marks.includes(i) ? 'lit' : ''}" data-cell="${i}" aria-pressed="${scratch.marks.includes(i)}" aria-label="Ligne ${Math.floor(i / v.size) + 1}, colonne ${i % v.size + 1}"></button>`).join('')}</div>`;
      case 'line': return `<div class="timeline"><div class="tl start"><b>Départ</b><span data-start="${esc(v.start)}">${esc(v.start)}</span></div>${v.legs.map((l) => `<div class="tl"><b>Jusqu’à ${esc(l.to)}</b><span data-min="${l.min}">${l.min} min</span></div>`).join('')}</div>`;
      case 'notices': return `<p class="stubhead">Avis du chef de train</p><ul class="stublist">${v.notices.map((n) => `<li data-delta="${n.delta}">${esc(n.text)}</li>`).join('')}</ul>`;
      default: return '';
    }
  }

  function board(v) {
    return `<div class="board"><div class="boardrow head"><span>N°</span><span>Destination</span><span>Départ</span><span>Voie</span></div>${v.rows.map((r, i) => `<button class="boardrow ${scratch.marks.includes(i) ? 'out' : ''}" data-cell="${i}" data-num="${r.num}" data-time="${esc(r.time)}" data-voie="${r.voie}" data-city="${esc(r.city)}"><span>${r.num}</span><span>${esc(r.city)}</span><span>${esc(r.time)}</span><span>${r.voie}</span></button>`).join('')}</div><p class="legend">Touche une ligne pour barrer un train.</p>`;
  }

  function lamp() {
    return `<div class="lampbox"><div class="lantern ${lampLit ? 'lit' : ''}" aria-hidden="true"><i></i></div>
      <button class="btn ghost" data-act="lamp" ${lampPlaying ? 'disabled' : ''}>${lampPlaying ? 'La lanterne parle…' : 'Allumer la lanterne'}</button></div>
      <p class="legend">Le signal se répète autant de fois que tu veux.</p>`;
  }
  function playLamp() {
    const seq = state.puzzle.view.morse, run = ++lampRun;
    lampPlaying = true; render();
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    (async () => {
      await wait(500);
      for (const letter of seq) {
        for (const sign of letter) {
          if (run !== lampRun) return;
          const dur = sign === '.' ? 320 : 960;
          // Pas de son : côte à côte, l'autre entendrait le code. Seule la lumière (et la vibration) parle.
          lampLit = true; render();
          if (navigator.vibrate) navigator.vibrate(dur);
          await wait(dur);
          lampLit = false; render();
          await wait(360);
        }
        await wait(1100);
      }
      if (run === lampRun) { lampPlaying = false; render(); }
    })();
  }

  function mazeWalls(v) {
    const C = 60, lines = [];
    v.open.forEach((bits, i) => {
      const r = Math.floor(i / v.size), c = i % v.size, x = c * C, y = r * C;
      if (!(bits & 1)) lines.push(`M${x} ${y}h${C}`);
      if (!(bits & 2)) lines.push(`M${x + C} ${y}v${C}`);
      if (!(bits & 4)) lines.push(`M${x} ${y + C}h${C}`);
      if (!(bits & 8)) lines.push(`M${x} ${y}v${C}`);
    });
    return lines.join('');
  }
  const mazeCenter = (i, size) => [(i % size) * 60 + 30, Math.floor(i / size) * 60 + 30];
  function mazeLabels(size) {
    return Array.from({ length: size }, (_, i) => `<text class="mz" x="${i * 60 + 30}" y="-8">${i + 1}</text><text class="mz" x="-12" y="${i * 60 + 36}">${i + 1}</text>`).join('');
  }
  function mazeMarks(v) {
    const [sx, sy] = mazeCenter(v.start, v.size), [gx, gy] = mazeCenter(v.goal, v.size);
    return `<text class="mzmark" x="${sx}" y="${sy + 7}">D</text><text class="mzmark goal" x="${gx}" y="${gy + 7}">S</text>`;
  }
  function mazeMap(v) {
    const S = v.size * 60;
    return `<div class="maze"><svg viewBox="-24 -24 ${S + 32} ${S + 32}" role="img" aria-label="Plan du couloir" data-open="${v.open.join(',')}">${mazeLabels(v.size)}${mazeMarks(v)}<path class="mzwall" d="${mazeWalls(v)}"/></svg></div>
      <p class="legend">D : le départ. S : la sortie. Les colonnes et les lignes sont numérotées de 1 à ${v.size}.</p>`;
  }
  function mazePad(v, pos) {
    const S = v.size * 60;
    const grid = Array.from({ length: v.size + 1 }, (_, i) => `<path class="mzgrid" d="M${i * 60} 0v${S}M0 ${i * 60}h${S}"/>`).join('');
    const [x, y] = mazeCenter(pos, v.size);
    const col = pos % v.size + 1, row = Math.floor(pos / v.size) + 1;
    const arrow = (dir, label, sym) => `<button class="padbtn ${dir}" data-act="move" data-dir="${dir}" aria-label="${label}">${sym}</button>`;
    return `<div class="maze dark"><svg viewBox="-24 -24 ${S + 32} ${S + 32}" role="img" aria-label="Ta position : colonne ${col}, ligne ${row}">${mazeLabels(v.size)}${grid}${mazeMarks(v)}<circle class="mztoken" r="14" style="transform:translate(${x}px,${y}px)"/></svg></div>
      <p class="mzpos" id="mzpos">Tu es colonne <b>${col}</b>, ligne <b>${row}</b></p>
      <div class="pad">${arrow('N', 'Vers le haut', '▲')}${arrow('W', 'Vers la gauche', '◀')}${arrow('E', 'Vers la droite', '▶')}${arrow('S', 'Vers le bas', '▼')}</div>`;
  }

  function quiz(q) {
    const s = state, me = s.role, other = otherOf(me);
    const votesHtml = q.myVote
      ? `<p class="qwait">Tu as répondu <b>${esc(s.names[q.myVote])}</b>. ${q.theyVoted ? 'Le contrôleur vérifie…' : `On attend ${esc(s.names[other])}.`}</p>`
      : `<div class="qbtns"><button class="btn" data-act="vote" data-who="${me}">${esc(s.names[me])}</button><button class="btn" data-act="vote" data-who="${other}">${esc(s.names[other])}</button></div>`;
    const last = q.last ? `<div class="qlast ${q.last.agree ? 'yes' : 'no'}"><b>${q.last.agree ? 'D’accord' : 'Désaccord'}</b><span>${esc(q.last.q)} ${esc(s.names.A)} a dit ${esc(s.names[q.last.A])}, ${esc(s.names.B)} a dit ${esc(s.names[q.last.B])}.</span></div>` : '';
    return `<div class="quiz" data-key="quiz">
      <div class="qscore"><span>Question ${q.i + 1} sur ${q.total}</span><span>${q.agree} accord${q.agree > 1 ? 's' : ''} sur ${q.pass}</span></div>
      <p class="question">${esc(q.question)}</p>
      ${votesHtml}
      ${last}
    </div>`;
  }

  const colHead = (n) => `<div class="mirhead" style="grid-column:1/-1">${Array.from({ length: n }, (_, i) => `<span>${i + 1}</span>`).join('')}</div>`;

  function moveToken(dir) {
    if (!state || !state.puzzle || state.puzzle.input.kind !== 'maze' || state.puzzle.view.type !== 'mazepad') return;
    act({ t: 'move', dir });
  }
  addEventListener('keydown', (e) => {
    const dir = { ArrowUp: 'N', ArrowRight: 'E', ArrowDown: 'S', ArrowLeft: 'W' }[e.key];
    if (dir && !e.target.closest('input,textarea') && state && state.puzzle && state.puzzle.input.kind === 'maze') { e.preventDefault(); moveToken(dir); }
  });

  function sheet(v) {
    return `<div class="sheetgrid" style="grid-template-columns:repeat(${v.cols},1fr)">${v.cells.map((on, i) => `<button class="cell ${on ? 'on ' + v.tint : ''} ${scratch.marks.includes(i) ? 'mark' : ''}" data-cell="${i}" aria-label="Ligne ${Math.floor(i / v.cols) + 1}, colonne ${i % v.cols + 1}, ${on ? 'allumée' : 'éteinte'}" aria-pressed="${scratch.marks.includes(i)}"></button>`).join('')}</div>
      <div class="sheetlegend"><span><i class="cell on ${v.tint}"></i>Allumée chez toi</span><span><i class="cell mark"></i>Encre (visible par toi seul)</span></div>`;
  }

  function scratchGrid() {
    const rows = [['Inès', 'Malik', 'Sofia', 'Théo'], ['Rouge', 'Vert', 'Bleu', 'Or']];
    const cell = (label, t) => { const v = scratch.grid[label + t] || ''; return `<td><button class="gc ${v}" data-grid="${label + t}" aria-label="${label}, table ${t} : ${v === 'yes' ? 'oui' : v === 'no' ? 'non' : 'vide'}"></button></td>`; };
    const block = (labels) => labels.map((l) => `<tr><th scope="row">${l}</th>${[1, 2, 3, 4].map((t) => cell(l, t)).join('')}</tr>`).join('');
    return `<div class="gridwrap"><p class="gridtitle">Ton tableau de déduction <span>(touche une case : oui, non, vide)</span></p><table class="gridtable"><thead><tr><th></th>${[1, 2, 3, 4].map((t) => `<th>Table ${t}</th>`).join('')}</tr></thead><tbody>${block(rows[0])}<tr class="gap"><td colspan="5"></td></tr>${block(rows[1])}</tbody></table></div>`;
  }

  function scratchDigits() {
    return `<div class="gridwrap"><p class="gridtitle">Barre les chiffres éliminés</p><div class="digitstrip">${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => `<button class="dgt ${scratch.digits.includes(d) ? 'out' : ''}" data-digit="${d}" aria-pressed="${scratch.digits.includes(d)}">${d}</button>`).join('')}</div></div>`;
  }

  function wheel() {
    const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', step = 360 / 26, C = 170;
    const letters = (r, cls) => Array.from(A).map((ch, i) => `<text class="${cls}" x="${C}" y="${C - r}" transform="rotate(${(i * step).toFixed(3)} ${C} ${C})">${ch}</text>`).join('');
    const ticks = Array.from(A).map((_, i) => `<line x1="${C}" y1="10" x2="${C}" y2="22" transform="rotate(${((i + 0.5) * step).toFixed(3)} ${C} ${C})"/>`).join('');
    const shown = ((wheelTurn % 26) + 26) % 26;
    return `<div class="disc"><svg viewBox="0 0 340 340" role="img" aria-label="Disque de chiffrement, cran ${shown}">
        <defs>
          <radialGradient id="brass" cx=".4" cy=".35"><stop offset="0" stop-color="#d9b163"/><stop offset=".7" stop-color="#8c6a2a"/><stop offset="1" stop-color="#5c4519"/></radialGradient>
          <radialGradient id="inner" cx=".45" cy=".4"><stop offset="0" stop-color="#3a2a1b"/><stop offset="1" stop-color="#1a120c"/></radialGradient>
        </defs>
        <circle cx="${C}" cy="${C}" r="168" fill="url(#brass)"/>
        <g class="ticks">${ticks}</g>
        ${letters(137, 'lo')}
        <g class="ringin" style="transform:rotate(${(wheelTurn * step).toFixed(3)}deg)">
          <circle cx="${C}" cy="${C}" r="124" fill="url(#inner)" stroke="#d9a441" stroke-width="1.5"/>
          ${letters(94, 'li')}
          <circle cx="${C}" cy="${C}" r="68" fill="none" stroke="#d9a44155"/>
          <path d="M${C} ${C - 62}l7 16h-14z" fill="#d9a441"/>
        </g>
        <circle cx="${C}" cy="${C}" r="7" fill="#d9a441"/>
      </svg></div>
      <div class="wctl"><button class="iconbtn large" data-act="wl" aria-label="Tourner vers la gauche">◀</button><b>Cran ${shown}</b><button class="iconbtn large" data-act="wr" aria-label="Tourner vers la droite">▶</button></div>
      <p class="legend">Anneau doré : la lettre codée. Juste en dessous, sur l’anneau sombre : la vraie lettre. Tourne cran par cran : dès que les premières lettres forment un début de mot, tu tiens le bon réglage.</p>`;
  }

  function staff(v) {
    const W = 520, y = (l) => 170 - (l - 1) * 44;
    const lines = [1, 2, 3, 4].map((l) => `<line x1="44" x2="${W - 8}" y1="${y(l)}" y2="${y(l)}"/><text class="ln" x="16" y="${y(l) + 6}">${l}</text>`).join('');
    const notes = v.levels.map((l, i) => {
      const x = 92 + i * ((W - 150) / (v.levels.length - 1));
      return `<g class="nt"><ellipse cx="${x}" cy="${y(l)}" rx="15" ry="11.5" transform="rotate(-18 ${x} ${y(l)})"/><path d="M${x + 13} ${y(l) - 3}v-52" /></g>`;
    }).join('');
    return `<div class="staff"><svg viewBox="0 0 ${W} 200" role="img" aria-label="Partition : ${v.levels.join(', ')}">${lines}${notes}</svg></div><p class="signature">${esc(v.signature)}</p>`;
  }

  function door(v) {
    const sockets = Array.from({ length: 6 }, () => null);
    state.seals.forEach((s) => { if (s.number != null) sockets[s.number - 1] = s.letter; });
    const known = sockets.filter(Boolean).length;
    return `<div class="doorart" aria-hidden="true"><div class="arch"><i class="dl"></i><i class="dr"></i></div></div>
      <blockquote class="riddle hand">${esc(v.riddle)}</blockquote>
      <div class="sockets">${sockets.map((l, i) => `<div class="socket ${l ? 'filled' : ''}"><span>${l ? esc(l) : ''}</span><em>${i + 1}</em></div>`).join('')}</div>
      <p class="legend">Tu as placé ${known} sceaux. Les ${6 - known} autres numéros sont chez ${esc(nameOf(otherOf(state.role)))}. Les lettres, vous les avez tous les deux en haut de l’écran.</p>`;
  }

  function lamps(n) { return `<div class="lamps">${Array.from({ length: n }, (_, i) => `<i class="${i < state.played ? 'on' : ''}"></i>`).join('')}</div>`; }

  function viewInput(p) {
    const inp = p.input;
    if (inp.kind === 'keys') return p.view.type === 'keys' ? '' : `<div class="answerbox"><div class="alabel">Notes jouées au clavecin</div>${lamps(inp.length)}</div>`;
    if (inp.kind === 'maze' || inp.kind === 'quiz') return '';
    if (inp.kind === 'grid') {
      return p.view.type === 'mirrordo'
        ? '<div class="answerbox"><button class="btn" data-act="submitgrid">Essayer le loquet</button></div>'
        : `<div class="answerbox"><div class="alabel">${esc(nameOf(otherOf(state.role)))} essaiera le loquet quand ce sera prêt.</div></div>`;
    }
    const digits = inp.kind === 'digits';
    const slots = Array.from({ length: inp.length }, (_, i) => `<span class="slot ${typed[i] ? 'full' : ''} ${i === typed.length ? 'next' : ''}">${esc(typed[i] || '')}</span>`).join('');
    return `<div class="answerbox">
      <label class="alabel" for="answer">${esc(inp.label || 'Réponse')}</label>
      <div class="slots" style="--n:${inp.length}">
        <input id="answer" inputmode="${digits ? 'numeric' : 'text'}" maxlength="${inp.length}" autocomplete="off" autocorrect="off" autocapitalize="characters" spellcheck="false" value="${esc(typed)}">
        ${slots}
      </div>
      <button class="btn" data-act="submit" ${typed.length === inp.length ? '' : 'disabled'}>Tourner le mécanisme</button>
    </div>`;
  }

  function notebook() {
    const v = load('ebib_notes_' + state.code, '');
    return `<div class="notebook" data-key="notes"><div class="nh"><span>Ton carnet (privé)</span><button data-act="notes" aria-label="Fermer le carnet">×</button></div><textarea id="notes" placeholder="Les lettres épelées, les dates, les insultes…">${esc(v)}</textarea></div>`;
  }

  // Tome II : l'entracte vit sur le serveur, pour que les deux écrans montrent la même carte.
  function sharedReveal() {
    const it = state.interlude;
    return { sync: true, idx: it.idx, title: it.title, page: it.page, seal: it.seal, stage: it.stage === 0 ? 'letter' : 'card', card: it.stage - 1, total: it.total, current: it.card, meReady: it.meReady, theyReady: it.theyReady };
  }
  function syncButton(r, label) {
    const other = esc(nameOf(otherOf(state.role)));
    if (r.meReady) return `<button class="btn" disabled>On attend ${other}…</button>`;
    return `<button class="btn" data-act="turn">${label}</button>${r.theyReady ? `<p class="legend waitnote">${other} a déjà appuyé.</p>` : ''}`;
  }

  function viewReveal(r) {
    if (r.stage === 'door') {
      return `<div class="doors" data-key="doors"><div class="glow"></div><div class="leaf l"><i></i></div><div class="leaf r"><i></i></div><div class="doorword">${esc(state.finalWord || 'REVOIR')}</div></div>`;
    }
    if (r.stage === 'card') {
      const c = r.sync ? r.current : r.cards[r.card];
      const total = r.sync ? r.total : r.cards.length;
      const text = c.kind === 'written' ? c.text : c.to ? fill(c.text, { x: nameOf(c.to), y: nameOf(otherOf(c.to)) }) : c.text;
      const next = r.card < total - 1;
      const train = state.volume === 2;
      const countdown = c.secs
        ? `<div class="cardtimer">${cardTimer
          ? `<b>${cardTimer.left}</b><span>secondes</span>`
          : `<button class="btn ghost" data-act="cardtimer" data-secs="${c.secs}">Lancer la minute</button>`}</div>`
        : '';
      const label = c.kind === 'written' ? `Carte de ${esc(nameOf(c.from))}, pour ${esc(nameOf(otherOf(c.from)))}` : c.kind === 'deep' ? 'Question · Réponds sincèrement' : !train ? 'Entracte · À voix haute' : c.heat === 'spicy' ? 'Geste · Osé' : 'Geste · Tendre';
      const icon = c.kind === 'written' ? ICON.quill : c.kind === 'deep' ? SYM.moon : c.heat === 'spicy' ? ICON.fire : ICON.heart;
      return `<div class="modal" data-key="card-${r.idx}-${r.card}"><div class="sheet darecard ${c.kind} ${c.heat ? 'heat-' + c.heat : ''}">
        <div class="cardhead"><p class="eyebrow">${label}</p>${total > 1 ? `<span class="cardcount">${r.card + 1} / ${total}</span>` : ''}</div>
        ${train ? `<div class="cardicon" aria-hidden="true">${icon}</div>` : ''}
        <p class="dare">${esc(text)}</p>
        ${countdown}
        <p class="legend">${tome().cardLegend}</p>
        ${r.sync ? syncButton(r, next ? 'Carte suivante' : 'On reprend le voyage') : `<button class="btn" data-act="${next ? 'nextcard' : 'closereveal'}">${next ? 'Carte suivante' : 'On continue'}</button>`}
        ${train ? `<button class="linkbtn" data-act="${r.sync ? 'skipcard' : next ? 'nextcard' : 'closereveal'}">On passe celle-là</button>` : ''}
      </div></div>`;
    }
    const t = tome();
    const seal = r.seal ? `<div class="sealbox"><div class="bigseal">${esc(r.seal.letter)}${r.seal.number != null ? `<sup>${r.seal.number}</sup>` : ''}</div>
      <p class="sealmsg">${r.seal.number != null ? `Le numéro <b>${r.seal.number}</b> n’apparaît que chez toi. Garde-le, ou dis-le : à toi de voir.` : `Ce ${t.sealWord} a un numéro, mais c’est ${esc(nameOf(otherOf(state.role)))} qui l’a.`}</p></div>` : '';
    const hasCards = r.sync || (r.cards && r.cards.length);
    const body = state.volume === 2
      ? `<div class="letter telegram parchment"><div class="tghead"><b>Télégramme</b><span>Cie du Nocturne · Voiture ${ROMAN[r.idx]}</span></div><p class="hand">${typewriter(r.page.text)}</p><p class="sig">— ${esc(r.page.from)}</p></div>`
      : `<div class="letter parchment"><p class="hand">${esc(r.page.text)}</p><p class="sig">— ${esc(r.page.from)}</p></div>`;
    return `<div class="modal" data-key="letter-${r.idx}"><div class="sheet letterwrap">
      <p class="eyebrow">${r.finished ? t.lastLetter : `${t.foundLetter} · ${esc(r.title)}`}</p>
      ${body}
      ${seal}
      ${r.sync ? syncButton(r, 'Voir la carte') : `<button class="btn" data-act="${hasCards ? 'toDare' : 'closereveal'}">${r.finished ? t.leaveBtn : 'Tourner la page'}</button>`}
    </div></div>`;
  }

  // Le télégramme s'imprime mot à mot. Les espaces fines sont posées avant le découpage,
  // sinon la ponctuation haute se retrouverait seule en début de ligne.
  function typewriter(text) {
    const words = String(text).replace(/ ([:;?!»])/g, ' $1').replace(/« /g, '« ').split(' ');
    return words.map((w, i) => `<span class="w" style="--w:${i}">${esc(w)}</span>`).join(' ');
  }

  function quizRecap() {
    const log = state.quizLog || [];
    if (!log.length) return '';
    const n = state.names;
    const misses = log.filter((l) => !l.agree).length;
    const rows = log.map((l) => `<li class="${l.agree ? 'yes' : 'no'}"><b>${esc(l.q)}</b><span>${esc(n.A)} a voté ${esc(n[l.A])} · ${esc(n.B)} a voté ${esc(n[l.B])}</span></li>`).join('');
    return `<details class="journal quizlog" open><summary>Les réponses au contrôleur · ${plural(misses, 'désaccord')}</summary>
      <p class="qlintro">${misses ? 'Les désaccords sont en rouge. Vous avez la nuit pour régler ça.' : 'Aucun désaccord. Le contrôleur est jaloux.'}</p>
      <ul>${rows}</ul></details>`;
  }

  function award(field, title, one, tie, none) {
    const s = state.stats, a = s.A[field], b = s.B[field];
    const n = Math.max(a, b);
    const text = (tpl, map) => fill(tpl, map).replace(/\(s\)/g, n > 1 ? 's' : '');
    if (!a && !b) return { title, text: none };
    if (a === b) return { title, text: text(tie, { n }) };
    return { title, text: text(one, { name: state.names[a > b ? 'A' : 'B'], n }) };
  }

  function viewDone() {
    const s = state, me = s.role, other = otherOf(me);
    const hints = s.stats.A.hints + s.stats.B.hints, wrong = s.stats.A.wrong + s.stats.B.wrong;
    const t = tome();
    const share = `On a ouvert la dernière porte de ${t.shareName} en ${fmt(s.elapsed)} (${plural(hints, 'indice')}, ${plural(wrong, 'erreur')}). ${location.origin}`;
    const awards = [
      award('wrong', 'La gâchette facile', '{name}, avec {n} essai(s) raté(s). Le registre s’en souviendra.', '{n} erreur(s) de chaque côté. Vous faites la paire.', 'Aucune erreur. Alexandrine soupçonne une tricherie.'),
      award('hints', 'L’humilité', '{name} a demandé {n} indice(s). C’est noté.', '{n} indice(s) de chaque côté. Personne n’a craqué seul.', 'Zéro indice. Quel orgueil.'),
      award('teases', 'L’insolence', '{name}, avec {n} message(s) envoyé(s) pendant que l’autre réfléchissait.', 'Égalité : {n} message(s) de chaque côté.', 'Personne n’a osé taquiner l’autre. Alexandrine est déçue.'),
    ];
    const letter = s.theirLetter;
    const letterBody = letter
      ? `<div class="letter parchment opened"><p class="hand keep">${esc(letter)}</p><p class="sig">— ${esc(s.names[other])}</p></div>`
      : `<div class="letter parchment opened"><p class="hand">${esc(s.names[other])} n’a rien glissé sous la porte. Alexandrine prend note : cette personne te doit un message. Ce soir.</p></div>`;
    return `<main class="done" data-key="done">
      ${CREST}
      <p class="eyebrow">${t.outEyebrow}</p>
      <h1>${t.outTitle}</h1>
      <div class="finalword" aria-label="${esc(s.finalWord)}">${esc(s.finalWord).split('').map((c, i) => `<span style="--i:${i}">${c}</span>`).join('')}</div>
      <p class="story">${t.outStory}</p>
      <section class="sealed">
        <h2>${t.letterFrom} ${esc(s.names[other])}</h2>
        ${envelopeOpen ? letterBody : `<button class="envelope" data-act="openenvelope" aria-label="${t.openLabel}"><span class="flap"></span><span class="wax">${esc((s.names[other] || 'A')[0].toUpperCase())}</span><em>${t.openLabel}</em></button>`}
      </section>
      ${s.theirSurprise ? `<section class="surprise">
        <h2>${esc(s.names[other])} a caché quelque chose pour toi</h2>
        ${surpriseOpen
    ? `<div class="letter telegram parchment opened"><div class="tghead"><b>Surprise</b><span>De la part de ${esc(s.names[other])}</span></div><p class="hand keep">${esc(s.theirSurprise)}</p></div>`
    : '<button class="btn big" data-act="opensurprise">Découvrir où chercher</button>'}
      </section>` : ''}
      <div class="stats">
        <div class="stat"><b>${fmt(s.elapsed)}</b><span>Temps</span></div>
        <div class="stat"><b>${hints}</b><span>${hints > 1 ? 'Indices' : 'Indice'}</span></div>
        <div class="stat"><b>${wrong}</b><span>${wrong > 1 ? 'Erreurs' : 'Erreur'}</span></div>
      </div>
      <section class="awards">
        <h2>${t.registry}</h2>
        ${awards.map((a) => `<div class="award"><b>${esc(a.title)}</b><span>${esc(a.text)}</span></div>`).join('')}
      </section>
      ${quizRecap()}
      <details class="journal"><summary>${t.rereadLabel}</summary>
        ${s.journal.map((j) => `<div class="jl"><p>${esc(j.text)}</p><span>— ${esc(j.from)}</span></div>`).join('')}
      </details>
      <div class="row">
        <button class="btn" data-act="restart">${t.replay}</button>
        <button class="btn ghost" data-act="share" data-text="${esc(share)}">Copier notre score</button>
      </div>
      <div class="row"><button class="linkbtn dim" data-act="quitconfirm">Quitter la salle</button></div>
    </main>`;
  }

  /* ---------- rendu ---------- */
  function elapsed() { if (!state) return 0; return state.phase === 'playing' && !state.paused ? state.elapsed + (Date.now() - recv) : state.elapsed; }

  // Mise à jour minimale du DOM : garde le focus, ne rejoue pas les animations, laisse tourner le disque.
  function morph(parent, next) {
    let a = parent.firstChild, b = next.firstChild;
    while (b) {
      const nextB = b.nextSibling;
      if (!a) parent.appendChild(b);
      else if (a.nodeType !== b.nodeType || a.nodeName !== b.nodeName || (a.getAttribute && a.getAttribute('data-key') !== b.getAttribute('data-key'))) {
        const nextA = a.nextSibling;
        parent.replaceChild(b, a);
        a = nextA;
      } else {
        if (a.nodeType === 3) { if (a.data !== b.data) a.data = b.data; }
        else if (a.nodeType === 1) { syncAttrs(a, b); if (a.nodeName !== 'TEXTAREA') morph(a, b); }
        a = a.nextSibling;
      }
      b = nextB;
    }
    while (a) { const n = a.nextSibling; parent.removeChild(a); a = n; }
  }
  function syncAttrs(a, b) {
    for (const { name } of Array.from(a.attributes)) {
      if (!b.hasAttribute(name) && !(a.nodeName === 'DETAILS' && name === 'open')) a.removeAttribute(name);
    }
    for (const { name, value } of Array.from(b.attributes)) {
      if (a.getAttribute(name) !== value) a.setAttribute(name, value);
    }
    if (a.nodeName === 'INPUT' && a.type === 'checkbox') a.checked = b.hasAttribute('checked');
    else if (a.nodeName === 'INPUT' && document.activeElement !== a) a.value = b.getAttribute('value') || '';
  }

  // Une partie dure plus d'une heure : l'écran ne doit pas s'éteindre pendant que l'autre parle.
  let wakeLock = null, wakePending = false;
  function keepAwake(on) {
    if (!('wakeLock' in navigator) || wakePending) return;
    if (on && !wakeLock && !document.hidden) {
      wakePending = true;
      navigator.wakeLock.request('screen').then((l) => { wakeLock = l; l.addEventListener('release', () => { wakeLock = null; }); }, () => {}).then(() => { wakePending = false; });
    } else if (!on && wakeLock) { wakeLock.release().catch(() => {}); wakeLock = null; }
  }
  const buzz = (p) => { if (navigator.vibrate) try { navigator.vibrate(p); } catch (e) {} };

  function render() {
    keepAwake(!!state && state.phase === 'playing');
    document.body.dataset.phase = state ? state.phase : 'home';
    const volume = String((state && state.volume) || 1);
    if (document.body.dataset.volume !== volume) { document.body.dataset.volume = volume; if (volume === '2') paintTrainScene(); }
    let html;
    if (!state) html = viewHome();
    else if (state.phase === 'lobby') html = viewLobby();
    else if (state.phase === 'playing') html = viewGame();
    else html = viewDone();
    if (state && state.phase === 'playing' && !introSeen) html += viewIntro();
    if (reveal) html += viewReveal(reveal);
    else if (state && state.phase === 'playing' && state.interlude) html += viewReveal(sharedReveal());
    html = html.replace(/ ([:;?!»])/g, ' $1').replace(/« /g, '« ');
    if (html === lastHtml) return;
    lastHtml = html;
    const tpl = document.createElement('div');
    tpl.innerHTML = html;
    morph($app, tpl);
  }

  setInterval(() => { const t = document.getElementById('timer'); if (t && state) t.textContent = fmt(elapsed()); }, 1000);

  /* ---------- interactions ---------- */
  function submitAnswer() {
    if (!state || !state.puzzle || typed.length !== state.puzzle.input.length) return;
    const answer = typed;
    act({ t: 'submit', answer });
  }
  function tryJoin(raw) {
    const c = String(raw || '').trim().toUpperCase();
    if (c.length !== 4) { homeError = 'Le code fait 4 lettres.'; render(); return; }
    homeError = '';
    enter({ t: 'join', code: c });
  }
  function pushProfile() { clearTimeout(profileT); if (state && state.phase === 'lobby') act({ t: 'profile', name: nameDraft, letter: letterDraft, spicy: spicyDraft, card: cardDraft, surprise: surpriseDraft }); }
  function copy(text, msg) {
    const done = () => toast(msg);
    const fallback = () => { const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); done(); } catch (e) {} ta.remove(); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fallback);
    else fallback();
  }
  function invite() {
    const url = location.origin + '/?r=' + state.code;
    const text = tome().invite;
    if (navigator.share && matchMedia('(pointer:coarse)').matches) {
      navigator.share({ title: 'La Bibliothèque d’Alexandrine', text, url }).catch((e) => { if (e.name !== 'AbortError') copy(`${text} ${url}`, 'Invitation copiée. À toi d’envoyer.'); });
    } else copy(`${text} ${url}`, 'Invitation copiée. À toi d’envoyer.');
  }

  $app.addEventListener('click', (e) => {
    const cell = e.target.closest('[data-cell]');
    if (cell) {
      const i = Number(cell.dataset.cell);
      scratch.marks = scratch.marks.includes(i) ? scratch.marks.filter((x) => x !== i) : scratch.marks.concat(i);
      saveScratch(); render();
      return;
    }
    const gc = e.target.closest('[data-grid]');
    if (gc) {
      const k = gc.dataset.grid, cur = scratch.grid[k] || '';
      scratch.grid[k] = cur === '' ? 'yes' : cur === 'yes' ? 'no' : '';
      saveScratch(); render();
      return;
    }
    const dg = e.target.closest('[data-digit]');
    if (dg) {
      const d = Number(dg.dataset.digit);
      scratch.digits = scratch.digits.includes(d) ? scratch.digits.filter((x) => x !== d) : scratch.digits.concat(d);
      saveScratch(); render();
      return;
    }
    const b = e.target.closest('[data-act]');
    if (!b) {
      if (teaseOpen && !e.target.closest('.teasemenu')) { teaseOpen = false; render(); }
      return;
    }
    switch (b.dataset.act) {
      case 'create': homeError = ''; enter({ t: 'create', volume: Number(b.dataset.volume) || 1 }); break;
      case 'join': tryJoin(document.getElementById('joincode').value); break;
      case 'ready': clearTimeout(profileT); store('ebib_name', nameDraft); act({ t: 'ready', value: !state.ready, name: nameDraft, letter: letterDraft, spicy: spicyDraft, card: cardDraft, surprise: surpriseDraft }); break;
      case 'swap': act({ t: 'swap' }); break;
      case 'invite': invite(); break;
      case 'closeintro': introSeen = true; store('ebib_intro_' + state.code, true); playPage(); render(); break;
      case 'ambience': toggleAmbience(); break;
      case 'submit': submitAnswer(); break;
      case 'hint':
        if (!hintArmed) { hintArmed = true; clearTimeout(hintT); hintT = setTimeout(() => { hintArmed = false; render(); }, 3500); render(); break; }
        hintArmed = false; clearTimeout(hintT); act({ t: 'hint' }); render();
        break;
      case 'notes': notesOpen = !notesOpen; teaseOpen = false; render(); break;
      case 'teasemenu': teaseOpen = !teaseOpen; notesOpen = false; render(); break;
      case 'tease': act({ t: 'tease', id: Number(b.dataset.id) }); teaseOpen = false; toast(`Envoyé à ${nameOf(otherOf(state.role))}.`); if (TEASES[Number(b.dataset.id)].heart) hearts(); render(); break;
      case 'wl': wheelTurn--; render(); break;
      case 'wr': wheelTurn++; render(); break;
      case 'key': playNote(Number(b.dataset.level)); act({ t: 'key', level: Number(b.dataset.level) }); break;
      case 'toDare': reveal.stage = 'card'; reveal.card = 0; playPage(); render(); break;
      case 'nextcard': stopCardTimer(); reveal.card++; playPage(); render(); break;
      case 'closereveal': stopCardTimer(); reveal = null; if (state.paused) act({ t: 'resume' }); playPage(); render(); break;
      case 'turn': act({ t: 'turn' }); playPage(); break;
      case 'skipcard': stopCardTimer(); act({ t: 'skip' }); playPage(); break;
      case 'cardtimer': startCardTimer(Number(b.dataset.secs)); break;
      case 'lamp': if (!lampPlaying) playLamp(); break;
      case 'move': moveToken(b.dataset.dir); break;
      case 'vote': act({ t: 'vote', who: b.dataset.who }); break;
      case 'submitgrid': {
        const size = state.puzzle.view.size;
        const answer = Array.from({ length: size * size }, (_, i) => (scratch.marks.includes(i) ? '1' : '0')).join('');
        act({ t: 'submit', answer });
        break;
      }
      case 'opensurprise': surpriseOpen = true; playChime(); hearts(); buzz(120); render(); break;
      case 'openenvelope': envelopeOpen = true; playThud(); playChime(); hearts(); render(); break;
      case 'restart': act({ t: 'restart' }); break;
      case 'share': copy(b.dataset.text, 'Score copié'); break;
      case 'quit':
        if (state.phase === 'lobby') { leave(); break; }
        confirmQuit = true; render();
        break;
      case 'quitcancel': confirmQuit = false; render(); break;
      case 'quitconfirm': leave(); break;
    }
  });
  function stopCardTimer() { if (cardTimer) clearInterval(cardTimer.id); cardTimer = null; }
  function startCardTimer(secs) {
    stopCardTimer();
    cardTimer = { left: secs, id: setInterval(() => {
      cardTimer.left--;
      if (cardTimer.left <= 0) { stopCardTimer(); playChime(); if (navigator.vibrate) navigator.vibrate(300); }
      render();
    }, 1000) };
    playPing(); render();
  }
  function leave() {
    confirmQuit = false;
    leaving = true;
    clearTimeout(pollT);
    act({ t: 'leave' });
    enqueue(async () => { dropToHome(''); leaving = false; });
  }

  $app.addEventListener('input', (e) => {
    const t = e.target;
    if (t.id === 'answer') {
      const digits = state && state.puzzle && state.puzzle.input.kind === 'digits';
      t.value = t.value.normalize('NFD').replace(digits ? /\D/g : /[^a-zA-Z]/g, '').toUpperCase();
      typed = t.value;
      render();
    } else if (t.id === 'joincode') {
      t.value = t.value.replace(/[^a-zA-Z]/g, '').toUpperCase();
    } else if (t.id === 'notes') {
      store('ebib_notes_' + state.code, t.value);
    } else if (t.id === 'pspicy') {
      spicyDraft = t.checked;
      pushProfile();
    } else if (t.id === 'pcard' || t.id === 'psurprise') {
      if (t.id === 'pcard') cardDraft = t.value; else surpriseDraft = t.value;
      clearTimeout(profileT); profileT = setTimeout(pushProfile, 700);
    } else if (t.id === 'pname' || t.id === 'pletter') {
      if (t.id === 'pname') { nameDraft = t.value; store('ebib_name', nameDraft); } else letterDraft = t.value;
      clearTimeout(profileT); profileT = setTimeout(pushProfile, 700);
      render();
    }
  });
  $app.addEventListener('focusout', (e) => { if (['pname', 'pletter', 'pcard', 'psurprise'].includes(e.target.id)) pushProfile(); });
  $app.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      if (e.target.id === 'answer') submitAnswer();
      else if (e.target.id === 'joincode') tryJoin(e.target.value);
    }
  });

  /* ---------- décor : rayonnages peints une fois, poussière, lumière de bougie ---------- */
  (function library() {
    const cv = document.getElementById('library'), cx = cv.getContext('2d');
    const palette = ['#4d1a16', '#2b3a2a', '#23304a', '#3b2a1b', '#54331c', '#3a1f33', '#1f2f35', '#5c4318', '#2e1c12', '#472316'];
    let paintedW = 0;
    function paint() {
      const W = innerWidth, H = Math.max(innerHeight, screen.height || 0);
      if (W === paintedW) return;
      paintedW = W;
      cv.width = W; cv.height = H;
      cx.fillStyle = '#120b07'; cx.fillRect(0, 0, W, H);
      const shelf = W < 600 ? 128 : 172;
      for (let row = 0; row * shelf < H + shelf; row++) {
        const base = (row + 1) * shelf - 14;
        const back = cx.createLinearGradient(0, base - shelf + 14, 0, base);
        back.addColorStop(0, '#080503'); back.addColorStop(1, '#1b110a');
        cx.fillStyle = back; cx.fillRect(0, base - shelf + 14, W, shelf - 14);
        let x = -10 - Math.random() * 20;
        while (x < W) {
          if (Math.random() < 0.05) { x += 18 + Math.random() * 40; continue; }
          const bw = 11 + Math.random() * 25, bh = (shelf - 30) * (0.62 + Math.random() * 0.34);
          const col = palette[Math.floor(Math.random() * palette.length)];
          const lean = Math.random() < 0.05 ? (Math.random() - 0.5) * 0.12 : 0;
          cx.save();
          cx.translate(x + bw / 2, base); cx.rotate(lean);
          cx.fillStyle = col; cx.fillRect(-bw / 2, -bh, bw, bh);
          const sh = cx.createLinearGradient(-bw / 2, 0, bw / 2, 0);
          sh.addColorStop(0, 'rgba(0,0,0,.55)'); sh.addColorStop(0.35, 'rgba(255,220,170,.09)'); sh.addColorStop(1, 'rgba(0,0,0,.6)');
          cx.fillStyle = sh; cx.fillRect(-bw / 2, -bh, bw, bh);
          if (Math.random() < 0.6) {
            cx.fillStyle = 'rgba(217,164,65,.45)';
            const n = 1 + Math.floor(Math.random() * 3);
            for (let k = 0; k < n; k++) cx.fillRect(-bw / 2 + 1, -bh + 8 + k * 7 + Math.random() * 2, bw - 2, 1.5);
          }
          cx.restore();
          x += bw + 1 + Math.random() * 1.5;
        }
        const plank = cx.createLinearGradient(0, base, 0, base + 14);
        plank.addColorStop(0, '#49301d'); plank.addColorStop(0.3, '#2f1e12'); plank.addColorStop(1, '#120b06');
        cx.fillStyle = plank; cx.fillRect(0, base, W, 14);
      }
      // Flou peint une seule fois dans l'image : un filtre CSS se recalculerait à chaque image.
      if ('filter' in cx) { cx.filter = 'blur(1.2px) saturate(.9)'; cx.drawImage(cv, 0, 0); cx.filter = 'none'; }
    }
    paint(); addEventListener('resize', paint);
  })();

  (function candleFollow() {
    const c = document.getElementById('candle');
    if (!matchMedia('(pointer:fine)').matches) return;
    let queued = false, x = 0, y = 0;
    addEventListener('pointermove', (e) => {
      x = e.clientX; y = e.clientY;
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => { queued = false; c.style.setProperty('--cx', x + 'px'); c.style.setProperty('--cy', y + 'px'); });
    });
  })();

  (function dust() {
    const cv = document.getElementById('dust'), cx = cv.getContext('2d');
    let W, H, parts = [];
    function size() {
      W = cv.width = innerWidth; H = cv.height = innerHeight;
      parts = Array.from({ length: Math.min(60, Math.floor(W / 20)) }, () => ({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.6 + 0.4, vy: -(Math.random() * 0.12 + 0.03), vx: (Math.random() - 0.5) * 0.08, a: Math.random() * 0.5 + 0.15, p: Math.random() * 6 }));
    }
    size(); addEventListener('resize', size);
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let lastFrame = 0;
    (function tick(now) {
      if (!document.hidden && document.body.dataset.volume !== '2' && now - lastFrame >= 40) {
        lastFrame = now;
        cx.clearRect(0, 0, W, H);
        for (const p of parts) {
          p.x += p.vx + Math.sin(p.p += 0.01) * 0.15; p.y += p.vy;
          if (p.y < -5) { p.y = H + 5; p.x = Math.random() * W; }
          cx.beginPath(); cx.arc(p.x, p.y, p.r, 0, 6.283); cx.fillStyle = `rgba(243,207,122,${p.a})`; cx.fill();
        }
      }
      requestAnimationFrame(tick);
    })(0);
  })();

  /* ---------- décor du train : paysages peints une fois, qu'on fait glisser ---------- */
  let scenePainted = false;
  function paintTrainScene() {
    if (scenePainted) return;
    scenePainted = true;
    const scene = document.getElementById('scene');
    const strip = (cls, width, height, draw) => {
      const cv = document.createElement('canvas');
      cv.width = width; cv.height = height;
      draw(cv.getContext('2d'), width, height);
      const el = document.createElement('div');
      el.className = 'strip ' + cls;
      el.style.setProperty('--tile', width + 'px');
      el.style.height = height + 'px';
      el.style.backgroundImage = `url(${cv.toDataURL()})`;
      scene.appendChild(el);
    };
    // La ligne d'horizon se referme sur elle-même pour que la bande boucle sans raccord visible.
    const ridge = (cx, W, H, base, amp, color, seed) => {
      const waves = [[2, amp], [5, amp * 0.5], [11, amp * 0.22], [23, amp * 0.1]].map(([n, a], i) => [n, a, seed * (i + 1)]);
      cx.beginPath(); cx.moveTo(0, H);
      for (let x = 0; x <= W; x += 4) {
        const y = base - waves.reduce((s, [n, a, ph]) => s + a * Math.sin((x / W) * n * 2 * Math.PI + ph), 0);
        cx.lineTo(x, y);
      }
      cx.lineTo(W, H); cx.closePath(); cx.fillStyle = color; cx.fill();
    };
    const sky = document.createElement('canvas');
    sky.className = 'sky';
    sky.width = innerWidth; sky.height = Math.round(innerHeight * 0.62);
    const sc = sky.getContext('2d');
    const g = sc.createLinearGradient(0, 0, 0, sky.height);
    g.addColorStop(0, '#060a1e'); g.addColorStop(0.7, '#142048'); g.addColorStop(1, '#2a3264');
    sc.fillStyle = g; sc.fillRect(0, 0, sky.width, sky.height);
    for (let i = 0; i < sky.width / 6; i++) {
      sc.fillStyle = `rgba(235,235,255,${(Math.random() * 0.7 + 0.15).toFixed(2)})`;
      const s = Math.random() < 0.08 ? 2 : 1;
      sc.fillRect(Math.random() * sky.width, Math.random() * sky.height * 0.85, s, s);
    }
    const mx = sky.width * 0.86, my = Math.min(sky.height * 0.14, 90);
    const halo = sc.createRadialGradient(mx, my, 10, mx, my, 110);
    halo.addColorStop(0, 'rgba(245,232,190,.42)'); halo.addColorStop(1, 'rgba(245,232,190,0)');
    sc.fillStyle = halo; sc.fillRect(mx - 110, my - 110, 220, 220);
    sc.fillStyle = '#f3e7c0'; sc.beginPath(); sc.arc(mx, my, 24, 0, 6.283); sc.fill();
    scene.appendChild(sky);
    strip('far', 1600, 220, (cx, W, H) => ridge(cx, W, H, 150, 34, '#111a3d', 1.3));
    strip('mid', 1400, 180, (cx, W, H) => ridge(cx, W, H, 118, 24, '#0b1230', 2.7));
    strip('near', 1000, 150, (cx, W, H) => {
      ridge(cx, W, H, 110, 9, '#050917', 0.6);
      cx.strokeStyle = '#050917'; cx.lineWidth = 2.5;
      for (let x = 60; x < W; x += 250) {
        cx.beginPath(); cx.moveTo(x, 118); cx.lineTo(x, 22); cx.moveTo(x - 13, 34); cx.lineTo(x + 13, 34); cx.stroke();
        cx.lineWidth = 1;
        cx.beginPath(); cx.moveTo(x + 13, 34); cx.quadraticCurveTo(x + 125, 62, x + 237, 34); cx.stroke();
        cx.lineWidth = 2.5;
      }
    });
    const frame = document.createElement('div');
    frame.className = 'trainframe';
    scene.appendChild(frame);
  }

  // Grain du papier : une petite image calculée une fois, répétée par le CSS.
  (function paperGrain() {
    const size = 128, cv = document.createElement('canvas');
    cv.width = cv.height = size;
    const cx = cv.getContext('2d'), img = cx.createImageData(size, size);
    for (let i = 0; i < img.data.length; i += 4) {
      img.data[i] = 90; img.data[i + 1] = 56; img.data[i + 2] = 20;
      img.data[i + 3] = Math.random() * 34;
    }
    cx.putImageData(img, 0, 0);
    document.documentElement.style.setProperty('--noise', `url(${cv.toDataURL()})`);
  })();

  /* ---------- démarrage ---------- */
  render();
  const invited = urlRoom();
  if (session && (!invited || invited === session.code)) enter({ t: 'join', code: session.code, token: session.token });
  else if (invited) { saveSession(null); enter({ t: 'join', code: invited }); }
})();
