'use strict';
// Tome II, Le Train de Nuit. À jouer dans la même pièce, dos à dos. Les réponses ne quittent JAMAIS le serveur.

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

// Après chaque voiture : une question, puis un geste. {x} est la personne visée, {y} l'autre. to: null = les deux.
const CARDS = [
  {
    deep: { to: 'A', text: '{x}, à quel moment précis as-tu arrêté de jouer un rôle devant {y} ?' },
    tender: { to: null, text: 'Retournez-vous. Front contre front, une minute, sans rien dire.', secs: 60 },
    spicy: { to: 'B', text: '{x}, retourne-toi et embrasse {y}, partout sauf sur la bouche. Trois endroits, à ton choix.' },
  },
  {
    deep: { to: 'B', text: '{x}, de quoi as-tu le plus peur pour vous deux ? Dis-le sans minimiser.' },
    tender: { to: 'A', text: '{x}, prends les mains de {y} et masse-les doucement, une minute.', secs: 60 },
    spicy: { to: 'A', text: '{x}, masse la nuque et les épaules de {y}. Une minute, sans un mot. Tes lèvres ont le droit de participer.', secs: 60 },
  },
  {
    deep: { to: 'A', text: '{x}, qu’est-ce que {y} t’a appris sur toi, sans le vouloir ?' },
    tender: { to: null, text: 'Un slow d’une minute, sans musique. Le train fera le rythme.', secs: 60 },
    spicy: { to: 'B', text: '{x}, ferme les yeux. {y} dépose un baiser sur toi, trois fois, où bon lui semble. Interdiction d’ouvrir les yeux avant la fin.' },
  },
  {
    deep: { to: 'B', text: '{x}, une chose que tu n’as encore jamais osé demander à {y}. Demande-la maintenant.' },
    tender: { to: null, text: 'Regardez-vous dans les yeux pendant une minute. Le premier qui rit doit un baiser.', secs: 60 },
    spicy: { to: null, text: 'Chacun retire un vêtement à l’autre, celui de son choix. Il reste au sol jusqu’à la fin du voyage.' },
  },
  {
    deep: { to: 'A', text: '{x}, dans dix ans, un soir ordinaire, chez vous : raconte-le. Précisément.' },
    tender: { to: 'B', text: '{x}, écris un mot du bout du doigt dans le dos de {y}. Trois essais pour le deviner.' },
    spicy: { to: 'B', text: '{x}, murmure à l’oreille de {y} ce que tu comptes faire à la fin de cette partie. {y} n’a le droit ni de répondre ni de bouger pendant une minute.', secs: 60 },
  },
  {
    deep: { to: 'B', text: '{x}, regarde {y} dans les yeux, et dis ce que tu ne dis pas assez.' },
    tender: { to: null, text: 'Un long baiser. Le premier qui se détache tape le mot de la dernière porte.' },
    spicy: { to: null, text: 'Un vrai baiser, sans limite de temps. Le premier qui se détache tape le mot de la dernière porte.' },
  },
];

function cardsFor(idx, spicy) {
  const c = CARDS[idx];
  if (!c) return [];
  return [{ kind: 'deep', ...c.deep }, { kind: 'act', ...(spicy ? c.spicy : c.tender) }];
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
      A: { type: 'lamp', mission: 'Allume la lanterne et dicte à l’autre chaque éclat : « court » ou « long ». Une longue pause sépare deux lettres.', other: 'le code du télégraphiste, pour traduire ce que tu dictes.', morse: word.split('').map((c) => MORSE[c]) },
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
const QUESTIONS = [
  'Qui a craqué le premier ?', 'Qui boude le plus longtemps ?', 'Qui ment le plus mal ?', 'Qui dit « j’arrive » sans bouger ?',
  'Qui s’endort devant le film ?', 'Qui a le plus mauvais caractère au réveil ?', 'Qui vole la couverture ?', 'Qui s’excuse en premier ?',
  'Qui fait le plus de crises de jalousie ?', 'Qui ferait le pire agent secret ?', 'Qui survivrait le moins longtemps dans un film d’horreur ?',
  'Qui finit l’assiette de l’autre ?', 'Qui relit ses messages dix fois avant d’envoyer ?', 'Qui a le plus de mauvaise foi ?',
  'Qui pleure devant les films ?', 'Qui a dit « je t’aime » en premier ?', 'Qui prend le plus de place dans le lit ?',
  'Qui se perd même avec une carte ?', 'Qui cède le premier quand il y a dispute ?', 'Qui commence les bêtises ?',
  'Qui attend que l’autre fasse le premier pas ?', 'Qui repense à la dispute trois jours après ?', 'Qui a le sourire le plus dangereux ?', 'Qui aime le plus, sans vouloir l’admettre ?',
];
const QUIZ_LENGTH = 6;
const QUIZ_PASS = 4;
const newQuestions = () => shuffle(QUESTIONS).slice(0, QUIZ_LENGTH);
function p4() {
  const mission = 'Le contrôleur vérifie que vous vous connaissez vraiment. Répondez chacun de votre côté, sans parler et sans vous retourner. Il lui faut 4 réponses identiques sur 6.';
  return {
    id: 'controleur',
    title: 'Le Contrôleur',
    story: '« Billets, s’il vous plaît. Et vous êtes ensemble depuis longtemps, tous les deux ? Je vais vérifier. »',
    views: {
      A: { type: 'quiz', mission, other: 'les mêmes questions, et interdiction de te répondre.' },
      B: { type: 'quiz', mission, other: 'les mêmes questions, et interdiction de te répondre.' },
    },
    input: { kind: 'quiz' },
    questions: newQuestions(),
    answer: '',
    hints: ['Ne répondez pas ce qui est vrai : répondez ce que l’autre va répondre.', 'Si vous échouez, le contrôleur repose d’autres questions. Rien n’est perdu, sauf un peu d’amour-propre.'],
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
    story: 'Voiture-lits. Une vitre sépare les deux couchettes. Un vitrail doit s’y dessiner des deux côtés pour que le loquet cède. Vous êtes dos à dos, ce n’est pas un hasard.',
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

module.exports = { buildAll, cardsFor, newQuestions, shortestPath, SEALS, FINAL_WORD, DIRS, QUIZ_LENGTH, QUIZ_PASS, MORSE };
