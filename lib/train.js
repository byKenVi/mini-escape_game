'use strict';
// Tome II, Le Train de Nuit. À jouer côte à côte, chacun son écran, sans regarder celui de l'autre.
// Les réponses ne quittent JAMAIS le serveur.

const rnd = (n) => Math.floor(Math.random() * n);
const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = (a) => a[rnd(a.length)];
const hhmm = (m) => { m = ((m % 1440) + 1440) % 1440; return String(Math.floor(m / 60)).padStart(2, '0') + 'h' + String(m % 60).padStart(2, '0'); };

// Poinçons : lettre visible par les deux, numéro visible par un seul joueur. Mot final : RESTER
const SEALS = [
  { letter: 'S', number: 3, to: 'A' },
  { letter: 'R', number: 1, to: 'B' },
  { letter: 'E', number: 5, to: 'A' },
  { letter: 'E', number: 2, to: 'B' },
  { letter: 'R', number: 6, to: 'A' },
  { letter: 'T', number: 4, to: 'B' },
];
const FINAL_WORD = 'RESTER';

// Après chaque voiture : parfois une question, puis un geste.
// Si les deux ont accepté les entractes osés, chaque voiture donne un geste osé, précédé d'un geste tendre
// pour s'échauffer aux voitures marquées warmup. Sinon, uniquement les gestes tendres.
// {x} est la personne visée, {y} l'autre. to: null = les deux. Les gestes vont du plus doux au plus audacieux.
const CARDS = [
  {
    warmup: true,
    tender: { to: null, text: 'Posez vos téléphones. Front contre front, une minute, sans rien dire.', secs: 60 },
    spicy: { to: 'B', text: '{x}, pose ton téléphone et embrasse {y} à trois endroits de ton choix, partout sauf sur la bouche.' },
  },
  {
    tender: { to: 'A', text: '{x}, prends les mains de {y} et masse-les doucement pendant une minute.', secs: 60 },
    spicy: { to: 'A', text: '{x}, masse la nuque et les épaules de {y} pendant une minute, sans parler. Tu as aussi le droit d’y déposer des baisers.', secs: 60 },
  },
  {
    tender: { to: 'B', text: '{x}, embrasse doucement {y} sur la joue, puis sur le front, puis sur la main.' },
    spicy: { to: 'B', text: '{x}, ferme les yeux. {y} te donne trois baisers, où bon lui semble. Tu n’ouvres les yeux qu’après le troisième.' },
  },
  {
    warmup: true,
    deep: { to: 'B', text: '{x}, pose à {y} une question que tu n’as jamais osé lui poser. {y} doit répondre honnêtement.' },
    tender: { to: null, text: 'Regardez-vous dans les yeux pendant une minute, sans parler. Le premier qui rit doit un baiser à l’autre.', secs: 60 },
    spicy: { to: null, text: 'Chacun retire un vêtement à l’autre, celui de son choix. Il reste au sol jusqu’à la fin de la partie.' },
  },
  {
    tender: { to: 'A', text: '{x}, pose ta tête sur l’épaule de {y}. Pendant une minute, {y} te caresse les cheveux.', secs: 60 },
    spicy: { to: 'B', text: '{x}, murmure à l’oreille de {y} ce que tu as envie de faire après la partie. Pendant une minute, {y} n’a le droit ni de répondre, ni de bouger.', secs: 60 },
  },
  {
    deep: { to: 'A', text: '{x}, regarde {y} dans les yeux et dis-lui une qualité que tu lui trouves, et que tu ne lui as jamais vraiment dite.' },
    tender: { to: null, text: 'Un long baiser. Le premier qui se détache devra taper la réponse de la dernière énigme.' },
    spicy: { to: null, text: 'Un vrai baiser, sans limite de temps. Le premier qui se détache devra taper la réponse de la dernière énigme.' },
  },
];
// Les cartes que les joueurs s'écrivent dans le salon : celle de A après la voiture III, celle de B après la voiture V.
const WRITTEN_AFTER = { 2: 'A', 4: 'B' };

function cardsFor(idx, spicy) {
  const c = CARDS[idx];
  if (!c) return [];
  const tender = { kind: 'act', heat: 'tender', ...c.tender };
  const out = c.deep ? [{ kind: 'deep', ...c.deep }] : [];
  if (!spicy) out.push(tender);
  else { if (c.warmup) out.push(tender); out.push({ kind: 'act', heat: 'spicy', ...c.spicy }); }
  return out;
}

/* ---------- 1. Les Billets ---------- */
const CITIES = ['Vienne', 'Venise', 'Istanbul', 'Trieste', 'Lisbonne', 'Prague', 'Budapest', 'Athènes'];
function buildBoard() {
  for (;;) {
    const nums = shuffle(Array.from({ length: 800 }, (_, i) => 100 + i)).slice(0, 6);
    const rows = shuffle(CITIES).slice(0, 6).map((city, i) => ({ city, num: nums[i], time: 1290 + rnd(30) * 5, voie: 1 + rnd(9) }));
    const target = pick(rows);
    const after = target.time - 5 * (1 + rnd(6));
    const even = target.voie % 2 === 0;
    const others = shuffle(rows.filter((r) => r !== target)).slice(0, 2);
    const tests = [
      (r) => r.time > after,
      (r) => (r.voie % 2 === 0) === even,
      (r) => !others.includes(r),
    ];
    const pass = (list) => rows.filter((r) => list.every((t) => t(r)));
    if (pass(tests).length !== 1) continue;
    if (tests.some((_, i) => pass(tests.filter((__, j) => j !== i)).length === 1)) continue; // chaque indice doit servir
    return {
      rows,
      answer: String(target.num),
      clues: [
        `Ton train part après ${hhmm(after)}.`,
        `Il part d’une voie au numéro ${even ? 'pair' : 'impair'}.`,
        `Il ne va ni à ${others[0].city}, ni à ${others[1].city}.`,
      ],
    };
  }
}
function p1() {
  const b = buildBoard();
  return {
    id: 'billets',
    title: 'Les Billets',
    story: 'Gare de nuit. Alexandrine a déchiré vos billets : le numéro du train est illisible, et le quai se vide.',
    views: {
      A: { type: 'board', mission: 'Tu as le tableau des départs. Lis-le à l’autre, ligne par ligne, et trouvez ensemble votre train.', other: 'le billet déchiré, avec ce qui reste des indications.', rows: b.rows.map((r) => ({ ...r, time: hhmm(r.time) })) },
      B: { type: 'ticket', mission: 'Tu as ce qui reste du billet. Élimine les trains que l’autre te lit : il n’en restera qu’un.', other: 'le tableau des départs.', clues: b.clues },
    },
    input: { kind: 'digits', length: 3, label: 'Le numéro de votre train' },
    answer: b.answer,
    hints: ['Commencez par barrer les trains qui partent trop tôt.', 'Il ne reste qu’un train qui respecte les trois indications : c’est son numéro à trois chiffres qu’il faut entrer.'],
    page: { from: 'Alexandrine', text: 'Deux billets, un seul compartiment. Tu as réservé sans me demander, et tu as bien fait. Ne le prends pas comme une habitude.' },
  };
}

/* ---------- 2. La Lanterne ---------- */
const MORSE = { A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....', I: '..', J: '.---', K: '-.-', L: '.-..', M: '--', N: '-.', O: '---', P: '.--.', Q: '--.-', R: '.-.', S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-', Y: '-.--', Z: '--..' };
function p2() {
  const word = pick(['NUIT', 'LUNE', 'QUAI', 'REVE', 'RAIL', 'NOIR']);
  return {
    id: 'lanterne',
    title: 'La Lanterne',
    story: 'Le train démarre. Au bout du couloir, une lanterne clignote derrière la vitre : quelqu’un vous parle.',
    views: {
      A: { type: 'lamp', mission: 'Allume la lanterne, écran contre toi, et dicte à l’autre chaque éclat : « court » ou « long ». Une longue pause sépare deux lettres.', other: 'le code du télégraphiste, pour traduire ce que tu dictes.', morse: word.split('').map((c) => MORSE[c]) },
      B: { type: 'chart', mission: 'Tu as le code du télégraphiste. L’autre te dicte des éclats : traduis-les, lettre par lettre.', other: 'la lanterne, et elle seule peut la lire.', chart: MORSE },
    },
    input: { kind: 'letters', length: word.length, label: 'Le mot de la lanterne' },
    answer: word,
    hints: ['Le mot fait quatre lettres, et il a un rapport avec ce voyage.', 'Un point du code, c’est un éclat court. Un trait, c’est un éclat long.'],
    page: { from: 'Augustin', text: 'Tu as éteint la lanterne en me disant : « À demain. » Je n’ai pas fermé l’œil de la nuit. Tu le savais très bien.' },
  };
}

/* ---------- 3. Le Couloir ---------- */
const DIRS = { N: [-1, 0, 1, 4], E: [0, 1, 2, 8], S: [1, 0, 4, 1], W: [0, -1, 8, 2] };
function buildMaze(size) {
  for (;;) {
    const open = Array.from({ length: size * size }, () => 0);
    const seen = new Set([0]);
    const stack = [0];
    while (stack.length) {
      const cur = stack[stack.length - 1];
      const r = Math.floor(cur / size), c = cur % size;
      const options = Object.values(DIRS).filter(([dr, dc]) => {
        const nr = r + dr, nc = c + dc;
        return nr >= 0 && nc >= 0 && nr < size && nc < size && !seen.has(nr * size + nc);
      });
      if (!options.length) { stack.pop(); continue; }
      const [dr, dc, bit, back] = pick(options);
      const next = (r + dr) * size + c + dc;
      open[cur] |= bit; open[next] |= back;
      seen.add(next); stack.push(next);
    }
    const goal = size * size - 1;
    if (shortestPath(open, size, 0, goal) >= size * 2 + 2) return { open, size, start: 0, goal };
  }
}
function shortestPath(open, size, from, to) {
  const dist = new Map([[from, 0]]);
  const queue = [from];
  while (queue.length) {
    const cur = queue.shift();
    if (cur === to) return dist.get(cur);
    const r = Math.floor(cur / size), c = cur % size;
    for (const [dr, dc, bit] of Object.values(DIRS)) {
      if (!(open[cur] & bit)) continue;
      const next = (r + dr) * size + c + dc;
      if (!dist.has(next)) { dist.set(next, dist.get(cur) + 1); queue.push(next); }
    }
  }
  return -1;
}
function p3() {
  const maze = buildMaze(5);
  return {
    id: 'couloir',
    title: 'Le Couloir',
    story: 'Plus une lumière dans la voiture. Pour atteindre la suivante, il faut traverser les compartiments à l’aveugle.',
    views: {
      A: { type: 'mazemap', mission: 'Tu as le plan, avec toutes les cloisons. Guide l’autre pas à pas. Attention : tu ne vois pas sa position, il faut la lui demander.', other: 'une lampe de poche : sa position, la sortie, et aucune cloison.', size: maze.size, open: maze.open, start: maze.start, goal: maze.goal },
      B: { type: 'mazepad', mission: 'Tu avances dans le noir. Dis à l’autre où tu es pour te faire guider. Une cloison, et tu retournes au départ.', other: 'le plan avec toutes les cloisons, mais pas ta position.', size: maze.size, start: maze.start, goal: maze.goal },
    },
    input: { kind: 'maze' },
    maze,
    answer: '',
    hints: ['Donnez un nom aux cases : colonne de 1 à 5, ligne de 1 à 5. Ce sera plus simple de se repérer.', 'Sur le plan, partez de la sortie et remontez jusqu’au départ : le chemin est unique.'],
    page: { from: 'Alexandrine', text: 'Onze ans de lettres, et je découvre que tu ronfles. Personne ne m’avait prévenue. Je te garde quand même. Du ronflement, on reparlera.' },
  };
}

/* ---------- 4. Le Contrôleur ---------- */
// Trois paliers, du plus léger au plus intime. Rien ne suppose une vie commune installée.
const QUESTIONS = {
  light: [
    'Qui est le plus souvent en retard ?', 'Qui répond le plus vite aux messages ?', 'Qui est le plus gourmand ?', 'Qui rit le plus fort ?',
    'Qui est le plus têtu ?', 'Qui parle le plus ?', 'Qui passe le plus de temps sur son téléphone ?', 'Qui est le plus maladroit ?',
  ],
  us: [
    'Qui a envoyé le premier message, quand vous vous êtes rapprochés ?', 'Qui envoie le plus de messages dans la journée ?',
    'Qui propose le plus souvent de s’appeler ?', 'Qui a le plus de mal à raccrocher à la fin d’un appel ?',
    'Qui se vexe le plus facilement ?', 'Qui fait le plus de compliments à l’autre ?', 'Qui taquine le plus l’autre ?',
    'Qui garde le plus de captures d’écran de vos conversations ?',
  ],
  close: [
    'Qui pense le plus à l’autre dans la journée ?', 'Qui a fait le premier pas, quand vous vous êtes rapprochés ?',
    'Qui a été le plus surpris de vous voir vous rapprocher ?', 'Qui s’attache le plus vite ?', 'Qui a le plus peur de mal faire avec l’autre ?',
    'Qui garde le plus ses sentiments pour soi ?', 'Qui avait le plus le trac avant ce soir ?', 'Qui a le plus hâte de la prochaine fois où vous vous verrez ?',
  ],
};
const QUIZ_LENGTH = 6;
const QUIZ_PASS = 4;
// Deux questions de chaque palier, dans l'ordre : on commence léger, on finit intime.
const newQuestions = () => [...shuffle(QUESTIONS.light).slice(0, 2), ...shuffle(QUESTIONS.us).slice(0, 2), ...shuffle(QUESTIONS.close).slice(0, 2)];
function p4() {
  const mission = 'Une question s’affiche. Chacun touche en secret, sur son propre écran, le prénom qui correspond le mieux. Ne dites rien avant que vous ayez répondu tous les deux. Le contrôleur veut 4 réponses identiques sur 6.';
  return {
    id: 'controleur',
    title: 'Le Contrôleur',
    story: '« Billets, s’il vous plaît. Vous voyagez ensemble, tous les deux ? Voyons si vous vous connaissez vraiment. »',
    views: {
      A: { type: 'quiz', mission, other: 'les mêmes questions, et interdiction de te répondre.' },
      B: { type: 'quiz', mission, other: 'les mêmes questions, et interdiction de te répondre.' },
    },
    input: { kind: 'quiz' },
    questions: newQuestions(),
    answer: '',
    hints: ['Ne répondez pas forcément ce qui est vrai : répondez ce que l’autre va répondre. C’est ça qui compte pour le contrôleur.', 'Si vous n’avez pas 4 réponses identiques, le contrôleur repose 6 nouvelles questions. Rien n’est perdu.'],
    page: { from: 'Augustin', text: 'Le contrôleur nous a demandé depuis combien de temps nous étions ensemble. Tu as répondu : « Pas assez, monsieur. » Je te jure que j’ai rougi.' },
  };
}

/* ---------- 5. Le Miroir ---------- */
function buildMirror(size) {
  for (;;) {
    const cells = Array.from({ length: size * size }, () => Math.random() < 0.42);
    const count = cells.filter(Boolean).length;
    const mirrored = cells.map((_, i) => cells[Math.floor(i / size) * size + (size - 1 - (i % size))]);
    const same = cells.filter((v, i) => v === mirrored[i]).length;
    if (count >= 8 && count <= 13 && same <= size * size - 8) return { cells, mirrored };
  }
}
function p5() {
  const size = 5;
  const m = buildMirror(size);
  return {
    id: 'miroir',
    title: 'Le Miroir',
    story: 'Voiture-lits. Une vitre sépare les deux couchettes. Un vitrail doit s’y dessiner des deux côtés pour que le loquet cède. Vous êtes assis côte à côte, et pourtant vous ne voyez pas la même face.',
    views: {
      A: { type: 'mirrorsee', mission: 'Voici le vitrail vu de ton côté. Décris-le à l’autre, case par case. Mais attention : de son côté, on regarde l’autre face de la vitre.', other: 'la même vitre, vue de l’autre côté, et rien de dessiné.', size, cells: m.cells },
      B: { type: 'mirrordo', mission: 'Reproduis le vitrail que l’autre te décrit. Mais tu es de l’autre côté de la vitre : ce qui est à sa gauche est à ta droite.', other: 'le vitrail, vu de son côté.', size },
    },
    input: { kind: 'grid', label: 'Le vitrail' },
    answer: m.mirrored.map((v) => (v ? '1' : '0')).join(''),
    hints: ['Les lignes restent les mêmes. Seules les colonnes s’inversent : la colonne 1 de l’autre est ta colonne 5.', 'La colonne du milieu ne change pas. Commencez par elle pour vous mettre d’accord.'],
    page: { from: 'Alexandrine', text: 'Je t’ai regardé dans le miroir, ce matin. Tu ne le savais pas. Tu as l’air idiot quand tu te crois seul, et je pourrais regarder ça jusqu’à la fin.' },
  };
}

/* ---------- 6. L'Heure d'Arrivée ---------- */
const STOPS = ['Dijon', 'Lausanne', 'Milan', 'Vérone', 'Trieste', 'Zagreb', 'Belgrade', 'Sofia'];
function p6() {
  const stops = shuffle(STOPS).slice(0, 4).sort((a, b) => STOPS.indexOf(a) - STOPS.indexOf(b));
  const legs = stops.map((to) => ({ to, min: 25 + rnd(15) * 5 }));
  const start = 1290 + rnd(20) * 5;
  const late = 10 + rnd(6) * 5;
  const halt = 5 + rnd(4) * 5;
  const gain = 5 + rnd(3) * 5;
  const notices = [
    { text: `Travaux avant ${stops[1]} : ${late} minutes de retard.`, delta: late },
    { text: `Arrêt prolongé à ${stops[2]} : ${halt} minutes de plus.`, delta: halt },
    { text: `Le mécanicien rattrape ${gain} minutes avant ${stops[3]}.`, delta: -gain },
  ];
  const arrival = start + legs.reduce((s, l) => s + l.min, 0) + notices.reduce((s, n) => s + n.delta, 0);
  const pad = (n) => String(n).padStart(2, '0');
  const norm = ((arrival % 1440) + 1440) % 1440;
  return {
    id: 'heure',
    title: 'L’Heure d’Arrivée',
    story: 'Le chef de train refuse d’ouvrir la voiture-bar à qui ne sait pas à quelle heure on arrive. Il ne vous le dira pas : il s’amuse.',
    views: {
      A: { type: 'line', mission: 'Tu as la feuille de route : l’heure de départ et la durée de chaque trajet. Lis-la à l’autre, puis calculez ensemble.', other: 'les avis de retard du chef de train.', start: hhmm(start), legs },
      B: { type: 'notices', mission: 'Tu as les avis du chef de train : ils changent l’horaire prévu. Ajoute-les à ce que l’autre te lit.', other: 'la feuille de route, avec le départ et les durées.', notices },
    },
    input: { kind: 'digits', length: 4, label: 'L’heure d’arrivée, par exemple 0615 pour 6h15' },
    answer: pad(Math.floor(norm / 60)) + pad(norm % 60),
    hints: ['Additionnez toutes les durées de trajet, puis les avis. Les minutes rattrapées se retirent.', 'Ajoutez le total à l’heure de départ. Si vous dépassez minuit, vous repartez de 00h00.'],
    page: { from: 'Augustin', text: 'Il reste une heure, et je voudrais que la ligne soit plus longue. Moi qui ai passé ma vie à raccourcir les distances sur des cartes.' },
  };
}

/* ---------- 7. La Dernière Porte ---------- */
function p7() {
  const mission = 'Remets les six poinçons dans l’ordre de leurs numéros. Tu ne connais que la moitié des numéros : l’autre a le reste.';
  return {
    id: 'derniere',
    title: 'La Dernière Porte',
    story: 'Le train ralentit. Au bout de la dernière voiture, une porte attend un mot de six lettres. Vous connaissez déjà celui d’avant.',
    views: {
      A: { type: 'door', mission, other: 'les trois autres numéros, et la fin de la phrase.', riddle: 'Se revoir, c’était la promesse…' },
      B: { type: 'door', mission, other: 'les trois autres numéros, et le début de la phrase.', riddle: '… mais le plus doux, c’est tous les matins d’après.' },
    },
    input: { kind: 'letters', length: 6, label: 'Le mot de la dernière porte' },
    answer: FINAL_WORD,
    hints: ['Mettez vos numéros en commun : chacun de vous en détient trois.', 'Lisez les lettres dans l’ordre des numéros, de 1 à 6.'],
    page: { from: 'Alexandrine', text: 'Nous ne sommes jamais vraiment descendus de ce train. Revoir, c’était la promesse. Rester, c’est tous les matins d’après. Et vous deux, ne perdez pas vos billets.' },
  };
}

function buildAll() { return [p1(), p2(), p3(), p4(), p5(), p6(), p7()]; }

module.exports = { buildAll, cardsFor, WRITTEN_AFTER, QUESTIONS, newQuestions, shortestPath, SEALS, FINAL_WORD, DIRS, QUIZ_LENGTH, QUIZ_PASS, MORSE };
