(function () {
  'use strict';

  const $app = document.getElementById('app');
  const $toast = document.getElementById('toast');
  const $flyers = document.getElementById('flyers');
  const ROLE_NAME = { A: 'L’Archiviste', B: 'Cartographe' };
  const ROLE_DESC = {
    A: 'Tu lis ce qui est écrit : grimoires, registres, partitions.',
    B: 'Tu manies ce qui s’ouvre : cadenas, disques, clavecin.',
  };
  const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
  const TEASES = [
    { text: 'Réfléchis, ça te va bien' },
    { text: 'Tu écoutes, au moins ?' },
    { text: 'C’était écrit juste là' },
    { text: 'Je te l’avais dit' },
    { text: 'Mon petit génie' },
    { text: 'Je te garde quand même', heart: true },
    { text: 'Un bisou, pour la peine', heart: true },
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

  const SYM = {
    moon: '<svg viewBox="0 0 48 48"><path d="M30 6a18 18 0 1 0 12 26A15 15 0 0 1 30 6z" fill="currentColor"/></svg>',
    star: '<svg viewBox="0 0 48 48"><path d="M24 3l5 15 15 6-15 6-5 15-5-15-15-6 15-6z" fill="currentColor"/></svg>',
    tower: '<svg viewBox="0 0 48 48"><path fill-rule="evenodd" d="M12 42V18h-2V8h6v4h4V8h8v4h4V8h6v10h-2v24zM20 42v-9a4 4 0 0 1 8 0v9z" fill="currentColor"/></svg>',
    flower: '<svg viewBox="0 0 48 48"><path fill-rule="evenodd" d="M24 4a8 8 0 0 1 8 8 8 8 0 1 1 0 24 8 8 0 1 1-16 0 8 8 0 1 1 0-24 8 8 0 0 1 8-8zm0 15a5 5 0 1 0 0 10 5 5 0 0 0 0-10z" fill="currentColor"/></svg>',
  };
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
  let reveal = null, notesOpen = false, teaseOpen = false, hintArmed = false, envelopeOpen = false, confirmQuit = false;
  let introSeen = false, ambienceOn = load('ebib_ambience', false);
  let audioCtx = null, ambience = null;
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
  const nameOf = (r) => (state ? state.names[r] : ROLE_NAME[r]);
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
    if (draftFor !== m.code) {
      draftFor = m.code;
      if (m.myName) nameDraft = m.myName;
      letterDraft = m.myLetter || '';
      introSeen = load('ebib_intro_' + m.code, false);
      if (nameDraft && !m.myName) act({ t: 'profile', name: nameDraft });
    }
    if (prev && prev.phase === 'done' && m.phase === 'lobby') {
      letterDraft = ''; envelopeOpen = false; reveal = null;
      for (let i = 0; i < m.total; i++) store(scratchKey(m.code, i), null);
    }
    if (m.phase === 'playing' && m.puzzle) {
      const key = m.code + ':' + m.puzzle.idx;
      if (key !== lastStepKey) {
        lastStepKey = key; typed = ''; wheelTurn = 0; hintArmed = false;
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
      const lines = e.guess ? WRONG_LINES : WRONG_MELODY;
      toast(fill(pickOne(lines), { name: nameOf(e.by), guess: e.guess }), true);
      playThud(); shakeAnswer();
    } else if (e.kind === 'solved') {
      const show = () => {
        reveal = { ...e, stage: e.finished ? 'door' : 'letter' };
        if (e.finished) { playDoor(); setTimeout(() => { if (reveal && reveal.stage === 'door') { reveal.stage = 'letter'; render(); } }, 3400); }
        else playChime();
        render();
      };
      e.idx === 4 ? setTimeout(show, 650) : show();
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
    s.buffer = noiseBuffer(c, Math.max(dur, 0.05), false);
    f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(c.destination); s.start(t);
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
      <p class="tag">Une porte fermée à clé. Deux écrans différents.<br>Et vous deux, chacun à un bout du fil.</p>
      <div class="card entry">
        <button class="btn" data-act="create" ${busy ? 'disabled' : ''}>${busy ? 'Ouverture des portes…' : 'Créer une salle'}</button>
        <div class="sep">ou</div>
        <label class="sr" for="joincode">Code de la salle</label>
        <div class="joinrow">
          <input class="codeinput" id="joincode" maxlength="4" placeholder="CODE" autocomplete="off" autocapitalize="characters" spellcheck="false" value="${esc(code)}">
          <button class="btn ghost" data-act="join" ${busy ? 'disabled' : ''}>Rejoindre</button>
        </div>
        <div class="err" role="alert">${esc(homeError)}</div>
      </div>
      <ol class="how">
        <li><b>Appelez-vous</b>L’appel, c’est votre seul moyen de jouer. Sans lui, personne ne sort.</li>
        <li><b>Parlez</b>Vous ne voyez jamais la même chose. Il faut décrire, écouter, et assumer ses erreurs.</li>
        <li><b>Retrouvez les lettres</b>Sept chapitres, environ 45 minutes, et une histoire d’amour à reconstituer.</li>
      </ol>
    </main>`;
  }

  function viewLobby() {
    const s = state, me = s.role, other = otherOf(me);
    return `<main class="lobby" data-key="lobby">
      <header class="lobbyhead">
        <p class="eyebrow">Salle d’attente</p>
        <div class="roomcode" aria-label="Code de la salle">${esc(s.code)}</div>
        ${s.partner ? '' : `<button class="btn" data-act="invite">Inviter l’autre</button><p class="legend">Envoie le lien, lance l’appel, et attends ici.</p>`}
      </header>
      <div class="players">
        <div class="pl me">
          <div class="who">${ROLE_NAME[me]}</div>
          <div class="pname">${esc(nameDraft || 'Toi')}</div>
          <div class="st on">${s.ready ? 'Devant la porte' : 'C’est toi'}</div>
        </div>
        <div class="pl ${s.partner ? '' : 'away'}">
          <div class="who">${ROLE_NAME[other]}</div>
          <div class="pname">${s.partner ? esc(s.names[other] === ROLE_NAME[other] ? 'L’autre' : s.names[other]) : '…'}</div>
          <div class="st ${s.partner ? 'on' : ''}">${s.partner ? (s.partnerReady ? 'N’attend plus que toi' : 'Dans la salle') : 'Pas encore là'}</div>
        </div>
      </div>
      <p class="roledesc">${ROLE_DESC[me]}${s.partner ? ' <button class="linkbtn" data-act="swap">Échanger les rôles</button>' : ''}</p>
      <div class="card form">
        <label for="pname">Ton prénom <span>(ou le surnom que l’autre va détester)</span></label>
        <input id="pname" class="field" maxlength="24" autocomplete="off" placeholder="Comment t’appeler ?" value="${esc(nameDraft)}">
        <label for="pletter">Un mot sous scellé <span>(facultatif, mais ça se verra)</span></label>
        <textarea id="pletter" class="field" maxlength="800" rows="3" placeholder="Écris quelque chose à l’autre. Alexandrine le garde sous cire : il ne s’ouvrira qu’une fois la porte franchie.">${esc(letterDraft)}</textarea>
      </div>
      <div class="row">
        <button class="btn big" data-act="ready" ${s.partner ? '' : 'disabled'}>${s.ready ? 'Attends, je reviens' : s.partnerReady ? 'On y va' : 'Je suis là, on commence'}</button>
      </div>
      ${s.partner ? '<div class="row"><button class="linkbtn" data-act="invite">Copier le lien d’invitation</button></div>' : ''}
      <div class="row"><button class="linkbtn dim" data-act="quit">Quitter cette salle</button></div>
    </main>`;
  }

  function viewIntro() {
    return `<div class="modal intro" data-key="intro"><div class="sheet parchment">
      <p class="eyebrow ink">Prologue</p>
      <p class="fade f1">Alexandrine gardait la grande bibliothèque. Augustin dessinait des cartes de pays où elle n’irait jamais. Pendant onze ans, ils ont vécu loin l’un de l’autre, et ils se sont écrit.</p>
      <p class="fade f2">Pour que personne d’autre ne lise leurs lettres, elle les a cachées ici, derrière des mécanismes qui ne s’ouvrent qu’à deux voix.</p>
      <p class="fade f3">Ce soir, la porte vient de se refermer derrière vous. Sur le pupitre, un billet encore frais :</p>
      <blockquote class="hand fade f4">Vous êtes deux, vous êtes loin, et vous vous parlez. Parfait, ce sont les seules règles. Sortez d’ici avant l’aube. Et taquinez-vous : chez moi, c’est obligatoire.<cite>— A.</cite></blockquote>
      <ul class="rules fade f5">
        <li><b>Vos écrans sont différents.</b> Ce que tu vois, ${esc(nameOf(otherOf(state.role)))} ne le voit pas. Tout passe par la voix.</li>
        <li><b>Un seul de vous deux tape la réponse.</b> Peu importe lequel, le mécanisme s’ouvre pour vous deux.</li>
        <li><b>Les indices sont gratuits.</b> Sauf pour l’honneur : le registre note qui les demande.</li>
      </ul>
      <div class="row fade f5">
        <button class="btn" data-act="closeintro">Entrer dans la bibliothèque</button>
        <button class="btn ghost ink ${ambienceOn ? 'active' : ''}" data-act="ambience" aria-pressed="${ambienceOn}">${ICON.fire}<span>Feu de cheminée : ${ambienceOn ? 'oui' : 'non'}</span></button>
      </div>
      <p class="legend ink fade f5">Pour le feu de cheminée, un casque évite que l’autre l’entende dans l’appel.</p>
    </div></div>`;
  }

  function sealsBar() {
    return `<div class="seals" role="img" aria-label="${state.seals.filter((x) => x.solved).length} sceaux sur 6">${state.seals.map((s) => (s.solved
      ? `<div class="seal on">${esc(s.letter)}${s.number != null ? `<sup>${s.number}</sup>` : ''}</div>`
      : '<div class="seal"></div>')).join('')}</div>`;
  }

  function viewGame() {
    const s = state, p = s.puzzle, me = s.role, other = otherOf(me);
    const remaining = p.hintsMax - p.hints.length;
    const light = ['clues', 'score', 'cipher'].includes(p.view.type);
    return `<main class="game" data-key="game">
      <header class="hud">
        <div class="hudleft"><span class="role">${esc(s.names[me])}</span><span class="timer" id="timer">${fmt(elapsed())}</span></div>
        <div class="hudright">
          <span class="conn ${online ? '' : 'off'}" title="${online ? 'Connecté' : 'Hors de l’écran pour le moment'}">${esc(s.names[other])}</span>
          <button class="iconbtn ${ambienceOn ? 'active' : ''}" data-act="ambience" aria-label="Feu de cheminée" aria-pressed="${ambienceOn}">${ICON.fire}</button>
        </div>
      </header>
      ${fails > 1 ? '<div class="netwarn">Connexion perdue, on réessaie…</div>' : ''}
      ${sealsBar()}
      <section class="puzzle" data-key="step-${p.idx}">
        <p class="eyebrow">Chapitre ${ROMAN[p.idx]} sur ${ROMAN[s.total - 1]}</p>
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
      ${TEASES.map((t, i) => `<button class="teasebtn ${t.heart ? 'love' : ''}" data-act="tease" data-id="${i}">${esc(t.text)}</button>`).join('')}
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
      default: return '';
    }
  }

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
      <p class="legend">Anneau extérieur : la lettre codée. Juste en dessous, sur l’anneau sombre : la vraie lettre.</p>`;
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

  function viewReveal() {
    const r = reveal;
    if (r.stage === 'door') {
      return `<div class="doors" data-key="doors"><div class="glow"></div><div class="leaf l"><i></i></div><div class="leaf r"><i></i></div><div class="doorword">${esc(state.finalWord || 'REVOIR')}</div></div>`;
    }
    if (r.stage === 'dare') {
      const d = r.dare;
      const text = d.to ? fill(d.text, { x: nameOf(d.to), y: nameOf(otherOf(d.to)) }) : d.text;
      return `<div class="modal" data-key="dare-${r.idx}"><div class="sheet darecard">
        <p class="eyebrow">Entracte · À voix haute</p>
        <p class="dare">${esc(text)}</p>
        <p class="legend">Alexandrine écoute. Elle n’a que ça à faire depuis deux siècles.</p>
        <button class="btn" data-act="closereveal">On continue</button>
      </div></div>`;
    }
    const seal = r.seal ? `<div class="sealbox"><div class="bigseal">${esc(r.seal.letter)}${r.seal.number != null ? `<sup>${r.seal.number}</sup>` : ''}</div>
      <p class="sealmsg">${r.seal.number != null ? `Le numéro <b>${r.seal.number}</b> n’apparaît que chez toi. Garde-le, ou dis-le : à toi de voir.` : `Ce sceau a un numéro, mais c’est ${esc(nameOf(otherOf(state.role)))} qui l’a.`}</p></div>` : '';
    return `<div class="modal" data-key="letter-${r.idx}"><div class="sheet letterwrap">
      <p class="eyebrow">${r.finished ? 'Dernière lettre' : `Lettre retrouvée · ${esc(r.title)}`}</p>
      <div class="letter parchment"><p class="hand">${esc(r.page.text)}</p><p class="sig">— ${esc(r.page.from)}</p></div>
      ${seal}
      <button class="btn" data-act="${r.dare ? 'toDare' : 'closereveal'}">${r.finished ? 'Sortir' : 'Tourner la page'}</button>
    </div></div>`;
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
    const share = `On a ouvert la porte de la Bibliothèque d’Alexandrine en ${fmt(s.elapsed)} (${plural(hints, 'indice')}, ${plural(wrong, 'erreur')}). ${location.origin}`;
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
      <p class="eyebrow">La porte est ouverte</p>
      <h1>Dehors, c’est l’aube</h1>
      <div class="finalword" aria-label="${esc(s.finalWord)}">${esc(s.finalWord).split('').map((c, i) => `<span style="--i:${i}">${c}</span>`).join('')}</div>
      <p class="story">Ils se sont revus au printemps. À votre tour.</p>
      <section class="sealed">
        <h2>Le mot de ${esc(s.names[other])}</h2>
        ${envelopeOpen ? letterBody : `<button class="envelope" data-act="openenvelope" aria-label="Briser le sceau"><span class="flap"></span><span class="wax">${esc((s.names[other] || 'A')[0].toUpperCase())}</span><em>Briser le sceau</em></button>`}
      </section>
      <div class="stats">
        <div class="stat"><b>${fmt(s.elapsed)}</b><span>Temps</span></div>
        <div class="stat"><b>${hints}</b><span>${hints > 1 ? 'Indices' : 'Indice'}</span></div>
        <div class="stat"><b>${wrong}</b><span>${wrong > 1 ? 'Erreurs' : 'Erreur'}</span></div>
      </div>
      <section class="awards">
        <h2>Le registre d’Alexandrine</h2>
        ${awards.map((a) => `<div class="award"><b>${esc(a.title)}</b><span>${esc(a.text)}</span></div>`).join('')}
      </section>
      <details class="journal"><summary>Relire toutes leurs lettres</summary>
        ${s.journal.map((j) => `<div class="jl"><p>${esc(j.text)}</p><span>— ${esc(j.from)}</span></div>`).join('')}
      </details>
      <div class="row">
        <button class="btn" data-act="restart">Rejouer, avec de nouveaux codes</button>
        <button class="btn ghost" data-act="share" data-text="${esc(share)}">Copier notre score</button>
      </div>
      <div class="row"><button class="linkbtn dim" data-act="quitconfirm">Quitter la salle</button></div>
    </main>`;
  }

  /* ---------- rendu ---------- */
  function elapsed() { if (!state) return 0; return state.phase === 'playing' ? state.elapsed + (Date.now() - recv) : state.elapsed; }

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
    if (a.nodeName === 'INPUT' && document.activeElement !== a) a.value = b.getAttribute('value') || '';
  }

  function render() {
    document.body.dataset.phase = state ? state.phase : 'home';
    let html;
    if (!state) html = viewHome();
    else if (state.phase === 'lobby') html = viewLobby();
    else if (state.phase === 'playing') html = viewGame();
    else html = viewDone();
    if (state && state.phase === 'playing' && !introSeen) html += viewIntro();
    if (reveal) html += viewReveal();
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
  function pushProfile() { clearTimeout(profileT); if (state && state.phase === 'lobby') act({ t: 'profile', name: nameDraft, letter: letterDraft }); }
  function copy(text, msg) {
    const done = () => toast(msg);
    const fallback = () => { const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); done(); } catch (e) {} ta.remove(); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fallback);
    else fallback();
  }
  function invite() {
    const url = location.origin + '/?r=' + state.code;
    const text = 'Une bibliothèque, une porte fermée à clé, et tu es la seule personne qui peut m’en sortir. Appelle-moi et viens :';
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
      case 'create': homeError = ''; enter({ t: 'create' }); break;
      case 'join': tryJoin(document.getElementById('joincode').value); break;
      case 'ready': clearTimeout(profileT); store('ebib_name', nameDraft); act({ t: 'ready', value: !state.ready, name: nameDraft, letter: letterDraft }); break;
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
      case 'toDare': reveal.stage = 'dare'; playPage(); render(); break;
      case 'closereveal': reveal = null; playPage(); render(); break;
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
    } else if (t.id === 'pname' || t.id === 'pletter') {
      if (t.id === 'pname') { nameDraft = t.value; store('ebib_name', nameDraft); } else letterDraft = t.value;
      clearTimeout(profileT); profileT = setTimeout(pushProfile, 700);
      render();
    }
  });
  $app.addEventListener('focusout', (e) => { if (e.target.id === 'pname' || e.target.id === 'pletter') pushProfile(); });
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
    (function tick() {
      if (!document.hidden) {
        cx.clearRect(0, 0, W, H);
        for (const p of parts) {
          p.x += p.vx + Math.sin(p.p += 0.01) * 0.15; p.y += p.vy;
          if (p.y < -5) { p.y = H + 5; p.x = Math.random() * W; }
          cx.beginPath(); cx.arc(p.x, p.y, p.r, 0, 6.283); cx.fillStyle = `rgba(243,207,122,${p.a})`; cx.fill();
        }
      }
      requestAnimationFrame(tick);
    })();
  })();

  /* ---------- démarrage ---------- */
  render();
  const invited = urlRoom();
  if (session && (!invited || invited === session.code)) enter({ t: 'join', code: session.code, token: session.token });
  else if (invited) { saveSession(null); enter({ t: 'join', code: invited }); }
})();
