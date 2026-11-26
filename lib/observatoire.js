'use strict';
// L'Observatoire : le deuxième niveau à distance, en appel. Chacun chez soi, un écran chacun.
// Pendant leurs onze ans de séparation, Augustin cartographiait le ciel austral.
// Les réponses ne quittent JAMAIS le serveur.

const rnd = (n) => Math.floor(Math.random() * n);
const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = (a) => a[rnd(a.length)];
const gcd = (a, b) => (b ? gcd(b, a % b) : a);

// Éclats : lettre visible par les deux, numéro visible par un seul joueur. Mot final : ETOILE
const SEALS = [
  { letter: 'O', number: 3, to: 'A' },
  { letter: 'E', number: 6, to: 'B' },
  { letter: 'T', number: 2, to: 'A' },
  { letter: 'L', number: 5, to: 'B' },
  { letter: 'E', number: 1, to: 'A' },
  { letter: 'I', number: 4, to: 'B' },
];
const FINAL_WORD = 'ETOILE';
// Entractes partagés sur les deux écrans, avec des gages, comme dans le train.
// Pas de case à cocher ici : le niveau reste léger, les deux cartes coquines sont toujours là.
const SHARED = true;
const SPICY = false;

// Les entractes à distance : surtout se découvrir et rire, plus deux cartes un peu coquines.
// Tout se joue à la voix, en appel simple comme en vidéo.
// Chaque nuit : know (se découvrir) puis fun (pour rire) ; hot s'ajoute à la fin sur deux nuits.
// {x} est la personne visée, {y} l'autre. to: null = les deux. label remplace le titre de la carte.
const NIGHTS = [
  {
    know: { to: 'B', label: 'Jeu · Le verdict', text: '{x}, raconte à {y} ta dernière embrouille avec quelqu’un : un proche, un collègue, un inconnu, peu importe. La version honnête, pas celle qui t’arrange. {y} rend son verdict : qui avait raison ?' },
    fun: { to: 'A', label: 'Pour rire · L’imitation', text: '{x}, imite {y} au téléphone quand {y} a sommeil mais refuse de raccrocher. {y} met une note sur 10, puis c’est son tour.' },
  },
  {
    know: { to: null, label: 'Jeu · Les deux versions', text: 'Racontez chacun, à tour de rôle, comment vous vous êtes rapprochés, de votre point de vue : le moment où ça a basculé, ce que vous avez pensé sur le coup, ce que vous n’avez pas osé dire. Puis cherchez ce qui ne colle pas entre vos deux versions.' },
    fun: { to: null, label: 'Pour rire · L’historique', text: 'Chacun ouvre son historique de recherche et lit à voix haute ses cinq dernières recherches. Pas le droit d’en sauter une. L’autre peut exiger une explication pour chacune.' },
    hot: { to: 'B', label: 'À voix basse · Le baiser', text: '{x}, décris à {y} le baiser que tu lui ferais là, maintenant, s’il n’y avait pas tous ces kilomètres. Où sont tes mains, combien de temps ça dure, qui s’arrête en premier.' },
  },
  {
    know: { to: 'A', label: 'Confidence · Les versions de toi', text: '{x}, toi au réveil, toi en colère, toi avec ta famille, toi à 12 ans : choisis une de ces versions de toi et raconte-la à {y}. L’imitation est fortement conseillée.' },
    fun: { to: 'B', label: 'Jeu · Le oui forcé', text: '{x}, tu as droit à une question, une seule, et {y} ne peut y répondre que par « oui ». Ce oui compte pour de vrai, alors choisis bien. Quelle est ta question ?' },
  },
  {
    know: { to: 'B', label: 'Jeu · Deux vérités, un mensonge', text: '{x}, dis trois trucs sur toi que {y} ne sait pas encore : deux vrais, un faux. {y} doit trouver le faux. Si {y} se trompe, tu racontes l’histoire du vrai le plus bizarre.' },
    fun: { to: null, label: 'Jeu · Le cadeau à 5 €', text: 'Chacun décrit le cadeau à moins de 5 € qui lui fait le plus penser à l’autre, et explique pourquoi. Il faudra vraiment l’offrir.' },
  },
  {
    know: { to: 'A', label: 'Confidence · Le reproche', text: '{x}, c’est quoi le reproche que tu as peur que {y} te fasse un jour ? {y} répond sans se défendre, puis c’est son tour.' },
    fun: { to: null, label: 'Pour rire · La galerie', text: 'À tour de rôle : l’un donne une date au hasard, l’autre ouvre sa galerie photo à ce jour-là (ou au plus proche) et décrit la première photo qui tombe. Pas le droit d’en choisir une autre.' },
    hot: { to: 'A', label: 'À voix basse · La suite', text: '{x}, complète cette phrase à voix basse : « Si j’étais à côté de toi ce soir, la première chose que je ferais, c’est… ». Prends ton temps, donne des détails. Quand tu as fini, {y} te répond en un seul mot.' },
  },
  {
    know: { to: null, label: 'Jeu · Le contrat', text: 'Chacun demande à l’autre une chose à faire la prochaine fois que vous vous verrez : drôle, gentille ou pas très sage, au choix. L’autre peut refuser une fois, et dans ce cas il faut proposer autre chose. Notez les deux quelque part : c’est promis.' },
    fun: { to: 'B', label: 'Pour rire · La honte', text: '{x}, raconte à {y} le moment le plus gênant de ta vie que tu n’as encore jamais raconté. {y} n’a pas le droit de rire avant la fin.' },
  },
];
// Les cartes que les joueurs s'écrivent dans le salon : celle de A après la nuit III, celle de B après la nuit V.
const WRITTEN_AFTER = { 2: 'A', 4: 'B' };

// Gages pour obtenir la réponse, une fois les trois indices épuisés. {x} a demandé la réponse, {y} est l'autre.
const ALL_GAGES = [
  '{y} pose une question indiscrète à {x}, qui doit répondre franchement.',
  '{x}, fais trois compliments à {y}. Aucun sur le physique.',
  '{x}, lis à {y} le dernier message que tu as envoyé à quelqu’un d’autre. En entier.',
  '{x}, avoue à {y} un truc que tu as fait cette semaine et que tu aurais préféré garder pour toi.',
  '{x}, dis à {y} quelque chose que tu n’as encore jamais osé lui dire. Pas forcément grave : un détail suffit.',
  '{x}, avoue à {y} la pensée la moins sage que tu as eue sur {y} cette semaine.',
  '{x}, dis clairement à {y} ce que tu comptes lui faire la prochaine fois que vous serez seuls. Pas de sous-entendus : les vrais mots.',
];
const GAGES = { spicy: ALL_GAGES, tender: ALL_GAGES };

function cardsFor(idx) {
  const n = NIGHTS[idx];
  if (!n) return [];
  const out = [{ kind: 'deep', ...n.know }, { kind: 'act', heat: 'tender', ...n.fun }];
  if (n.hot) out.push({ kind: 'act', heat: 'spicy', ...n.hot });
  return out;
}

/* ---------- 1. La Mise au point ---------- */
// Deux molettes, une seule image : la netteté dépend de la distance totale au bon réglage.
const FOCUS_MAX = 12;
const STAR_NAMES = ['ALTAIR', 'DENEB', 'RIGEL', 'SIRIUS', 'CAPELLA', 'ANTARES'];
function p1() {
  const word = pick(STAR_NAMES);
  let target, start;
  do {
    target = [2 + rnd(FOCUS_MAX - 3), 2 + rnd(FOCUS_MAX - 3)];
    start = [rnd(FOCUS_MAX + 1), rnd(FOCUS_MAX + 1)];
  } while (Math.abs(target[0] - start[0]) < 3 || Math.abs(target[1] - start[1]) < 3);
  let garble;
  do { garble = Array.from(word, () => String.fromCharCode(65 + rnd(26))).join(''); } while (garble === word);
  return {
    id: 'miseaupoint',
    title: 'La Mise au point',
    story: 'Première nuit. Avant de regarder le ciel, Augustin réglait sa lunette sur une mire peinte au loin. Ce soir, quelqu’un y a écrit le nom de l’étoile du rendez-vous. Et tout est flou.',
    views: {
      A: { type: 'focusimg', mission: 'Tu as l’œil à la lunette. À chaque cran que l’autre tourne, dis-lui si l’image devient plus nette ou plus floue, jusqu’à pouvoir lire le nom.', other: 'les deux molettes de réglage, et aucune image.' },
      B: { type: 'knobs', mission: 'Tu as les deux molettes de la lunette, mais tu ne vois rien. Tourne-les cran par cran, et écoute l’autre : plus net, ou plus flou ?', other: 'l’œil à la lunette, et l’image floue.' },
    },
    input: { kind: 'letters', length: word.length, label: 'Le nom de l’étoile' },
    focus: { start, target, garble },
    answer: word,
    hints: [
      'Réglez une seule molette à la fois. Quand la netteté recommence à baisser, revenez d’un cran : cette molette est réglée.',
      'Une fois la première molette réglée, ne la touchez plus, et faites pareil avec la seconde. La jauge est pleine quand les deux sont bonnes.',
      `Le nom fait ${word.length} lettres et commence par ${word[0]}. C’est l’une de ces étoiles : ${STAR_NAMES.join(', ')}.`,
    ],
    reveal: `Le nom écrit sur la mire est ${word}.`,
    page: { from: 'Augustin', text: 'Il m’a fallu une heure pour régler cette lunette. Il m’en faudrait moins pour te retrouver dans une foule. Ce soir, je t’ai cherchée juste à côté de notre étoile. Tu étais en retard, comme d’habitude.' },
  };
}

/* ---------- 2. La Grille d'Augustin ---------- */
// Une grille tournante : quatre trous, quatre quarts de tour, seize lettres.
const GRILLE_WORDS = ['LUNE', 'VEGA', 'MARS', 'NOVA'];
const GRILLE_PREFIX = 'LAREPONSEEST';
const rot = (i) => { const r = Math.floor(i / 4), c = i % 4; return c * 4 + (3 - r); }; // un quart de tour vers la droite
function buildGrille(message) {
  // Le carré 4×4 se découpe en quatre orbites de quatre cases : un trou par orbite, et chaque case sert une fois.
  const orbit = (i) => [i, rot(i), rot(rot(i)), rot(rot(rot(i)))];
  const holes = [0, 1, 2, 5].map((i) => orbit(i)[rnd(4)]).sort((a, b) => a - b);
  const grid = Array(16).fill('');
  let k = 0, cur = holes;
  for (let turn = 0; turn < 4; turn++) {
    for (const i of cur.slice().sort((a, b) => a - b)) grid[i] = message[k++];
    cur = cur.map(rot);
  }
  return { holes, grid };
}
function p2() {
  const word = pick(GRILLE_WORDS);
  const g = buildGrille(GRILLE_PREFIX + word);
  return {
    id: 'grille',
    title: 'La Grille d’Augustin',
    story: 'Alexandrine avait percé à jour son disque de laiton. Alors il a inventé mieux : un carré de lettres qui n’a aucun sens, et une carte trouée qui, posée dessus, leur en rend un.',
    views: {
      A: { type: 'grillegrid', mission: 'Tu as le carré de lettres. Tout seul, il ne veut rien dire. Lis à l’autre les lettres des cases qu’il te désigne, dans l’ordre.', other: 'la carte trouée, qui tourne d’un quart de tour.', grid: g.grid },
      B: { type: 'grillemask', mission: 'Tu as la carte trouée. Donne à l’autre la ligne et la colonne de chaque trou, puis tourne la carte d’un quart de tour vers la droite. Quatre fois.', other: 'un carré de seize lettres sans queue ni tête.', holes: g.holes },
    },
    input: { kind: 'letters', length: word.length, label: 'Le mot caché' },
    answer: word,
    hints: [
      'Lisez les trous ligne par ligne, de gauche à droite, comme dans un livre. Puis tournez la carte d’un quart de tour vers la droite, et recommencez.',
      'Commencez avec la petite étoile en haut à gauche. Quatre positions, quatre lettres par position : seize lettres en tout, qui forment une phrase.',
      'Les douze premières lettres disent « LA RÉPONSE EST ». Les quatre dernières sont la réponse.',
    ],
    reveal: `La grille dit : LA RÉPONSE EST ${word}. Tapez ${word}.`,
    page: { from: 'Alexandrine', text: 'Ta grille m’a pris trois soirs. Tu étais fier de toi, je le sens d’ici. Je te préviens : j’en ai fabriqué une aussi. Ce que j’ai caché dessous, tu le liras en rentrant. Pas avant.' },
  };
}

/* ---------- 3. Les Perséides ---------- */
// Une pluie d'étoiles filantes sur les deux écrans à la fois. Chaque lettre ne passe que chez un seul joueur.
const WISHES = ['ENSEMBLE', 'BIENTOT', 'ATTENDRE', 'DOUCEUR'];
const SHOWER_LEAD = 3500;
function buildShower(word) {
  let owners;
  do { owners = Array.from(word, () => (Math.random() < 0.5 ? 'A' : 'B')); }
  while (owners.filter((o) => o === 'A').length < 3 || owners.filter((o) => o === 'B').length < 3);
  const meteors = { A: [], B: [] };
  let t = 800;
  for (let i = 0; i < word.length; i++) {
    t += 1800 + rnd(1300);
    meteors[owners[i]].push({ t, x: 18 + rnd(66), y: 6 + rnd(38), letter: word[i] });
  }
  const total = t + 2400;
  // Des étoiles filantes sans lettre, pour le plaisir et pour brouiller les pistes.
  for (const r of ['A', 'B']) {
    for (let k = 0; k < 6; k++) meteors[r].push({ t: 400 + rnd(total - 2200), x: 10 + rnd(80), y: 4 + rnd(50), letter: '' });
    meteors[r].sort((a, b) => a.t - b.t);
  }
  return { meteors, total, owners };
}
function p3() {
  const word = pick(WISHES);
  const s = buildShower(word);
  const mission = 'Lancez la pluie : les étoiles filantes passent sur vos deux ciels en même temps. Certaines portent une lettre, mais chacun ne voit que les siennes. Dites-les à voix haute dès qu’elles passent : l’ordre d’apparition donne le vœu.';
  return {
    id: 'perseides',
    title: 'Les Perséides',
    story: 'Une nuit d’août. Ils s’étaient promis de compter les étoiles filantes ensemble, chacun sous son ciel. Augustin jurait qu’elles portaient des lettres. Personne ne l’a jamais cru.',
    views: {
      A: { type: 'shower', mission, other: 'le même ciel, et les autres lettres.', meteors: s.meteors.A, total: s.total },
      B: { type: 'shower', mission, other: 'le même ciel, et les autres lettres.', meteors: s.meteors.B, total: s.total },
    },
    input: { kind: 'letters', length: word.length, label: 'Le vœu' },
    shower: { total: s.total },
    answer: word,
    hints: [
      'Dites « top » et votre lettre dès qu’une étoile filante en porte une. La pluie repasse dans le même ordre autant de fois que vous voulez.',
      'Notez au carnet vos lettres dans l’ordre où elles passent, en glissant entre elles celles que l’autre annonce.',
      `Le vœu fait ${word.length} lettres, commence par ${word[0]} et finit par ${word[word.length - 1]}.`,
    ],
    reveal: `Le vœu des étoiles filantes est ${word}.`,
    page: { from: 'Augustin', text: 'Quarante-trois étoiles filantes cette nuit. J’ai fait le même vœu quarante-trois fois. Le ciel doit commencer à se lasser de moi. Toi, ne te lasse pas.' },
  };
}

/* ---------- 4. Les Engrenages ---------- */
// Manivelle → roue → roue solidaire → (roue folle) → couronne de la coupole.
// Deux roues qui s'engrènent tournent en sens contraire ; la roue folle change le sens, pas la vitesse.
function buildGears() {
  for (;;) {
    const c = pick([10, 12, 15, 16]);
    const r1 = pick([2, 3]);
    const p1 = c * r1;
    const p2 = pick([12, 14, 16, 18, 20, 24]);
    const r2 = pick([1.5, 2, 2.5, 3]);
    const d = p2 * r2;
    const N = pick([1, 2, 3]);
    const K = N * r1 * r2;
    if (!Number.isInteger(d) || !Number.isInteger(K) || K < 4 || K > 24 || p1 > 48 || d > 60) continue;
    const idler = Math.random() < 0.5 ? 13 + rnd(10) : 0;
    const domeCw = Math.random() < 0.5;
    const crankCw = idler ? !domeCw : domeCw;
    return { c, p1, p2, d, idler, N, K, domeCw, crankCw, answer: (crankCw ? 'H' : 'I') + K };
  }
}
const SENS = (cw) => (cw ? 'des aiguilles d’une montre' : 'inverse des aiguilles d’une montre');
function p4() {
  const g = buildGears();
  const num = g.c * g.p2, den = g.p1 * g.d, k = gcd(num, den);
  const lines = [
    `La manivelle fait tourner une roue de ${g.c} dents.`,
    `Cette roue engrène une grande roue de ${g.p1} dents.`,
    `Sur le même axe que la roue de ${g.p1} dents, et solidaire d’elle : une roue de ${g.p2} dents.`,
    g.idler
      ? `La roue de ${g.p2} dents engrène une roue folle de ${g.idler} dents, qui engrène à son tour la couronne de la coupole : ${g.d} dents.`
      : `La roue de ${g.p2} dents engrène directement la couronne de la coupole : ${g.d} dents.`,
  ];
  return {
    id: 'engrenages',
    title: 'Les Engrenages',
    story: 'La coupole pèse trois tonnes, et Augustin n’avait que ses bras. Une manivelle, des roues dentées, et une fente qui doit s’arrêter pile face à l’étoile : pas un tour de plus.',
    views: {
      A: { type: 'gears', mission: 'Tu as le plan de la mécanique, roue par roue. Explique-le à l’autre, et calculez ensemble combien de tours de manivelle il faut, et dans quel sens.', other: 'la manivelle, et l’ordre d’Augustin : combien de tours doit faire la coupole.', c: g.c, p1: g.p1, p2: g.p2, d: g.d, idler: g.idler, lines },
      B: { type: 'crank', mission: 'Tu as la manivelle. Tu sais comment la coupole doit tourner, mais pas ce qu’il y a entre les deux. Écoute l’autre, puis règle le nombre de tours et le sens.', other: 'le plan de la mécanique, roue par roue.', target: `La coupole doit faire ${g.N} tour${g.N > 1 ? 's' : ''} complet${g.N > 1 ? 's' : ''}, dans le sens ${SENS(g.domeCw)}.`, note: 'Les sens se lisent de face, comme sur le plan de la mécanique.' },
    },
    input: { kind: 'crank', label: 'La manivelle' },
    answer: g.answer,
    hints: [
      'Deux roues qui s’engrènent tournent en sens contraire. Deux roues sur le même axe, solidaires, tournent ensemble : même sens, même nombre de tours.',
      'Une roue de 12 dents doit faire 3 tours pour qu’une roue de 36 dents en fasse un. Une roue folle, coincée entre deux autres, ne change pas le nombre de tours : seulement le sens.',
      `Pour un tour de manivelle, la coupole fait ${num / k}/${den / k} de tour. Et la manivelle tourne ${g.idler ? 'dans le sens contraire de' : 'dans le même sens que'} la coupole.`,
    ],
    reveal: `Il faut ${g.K} tours de manivelle, dans le sens ${SENS(g.crankCw)}.`,
    page: { from: 'Alexandrine', text: 'Tu me décris tes engrenages sur quatre pages. Je n’y ai rien compris, et j’ai tout relu deux fois. Ne me demande pas pourquoi. Enfin si : demande-le-moi en face.' },
  };
}

/* ---------- 5. La Comète ---------- */
// La lunette ne montre qu'un carré de 3×3 cases. Chaque carré possible est unique sur la carte.
const SKY = 9;
const STAR_KINDS = ['big', 'small', 'blue', 'red'];
const COLS = 'ABCDEFGHI';
const coord = (i) => COLS[i % SKY] + (Math.floor(i / SKY) + 1);
function windowOf(cells, pos) {
  const r = Math.floor(pos / SKY), c = pos % SKY, out = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const rr = r + dr, cc = c + dc;
      out.push(rr < 0 || cc < 0 || rr >= SKY || cc >= SKY ? 'edge' : cells[rr * SKY + cc]);
    }
  }
  return out;
}
const dist = (a, b) => Math.abs(Math.floor(a / SKY) - Math.floor(b / SKY)) + Math.abs((a % SKY) - (b % SKY));
function buildSky() {
  for (;;) {
    const cells = Array.from({ length: SKY * SKY }, () => (Math.random() < 0.42 ? pick(STAR_KINDS) : ''));
    const seen = new Set();
    let unique = true;
    for (let i = 0; i < cells.length && unique; i++) {
      const key = windowOf(cells, i).join(',');
      if (seen.has(key)) unique = false;
      seen.add(key);
    }
    if (!unique) continue;
    const comet = (1 + rnd(SKY - 2)) * SKY + 1 + rnd(SKY - 2);
    const far = shuffle(cells.map((_, i) => i)).filter((i) => dist(i, comet) >= 6);
    if (!far.length) continue;
    return { cells, comet, start: far[0], size: SKY };
  }
}
function route(from, to) {
  const dc = (to % SKY) - (from % SKY), dr = Math.floor(to / SKY) - Math.floor(from / SKY);
  const part = (n, pos, neg) => (n ? `${Math.abs(n)} cran${Math.abs(n) > 1 ? 's' : ''} ${n > 0 ? pos : neg}` : '');
  return [part(dc, 'vers la droite', 'vers la gauche'), part(dr, 'vers le bas', 'vers le haut')].filter(Boolean).join(', puis ');
}
function p5() {
  const sky = buildSky();
  return {
    id: 'comete',
    title: 'La Comète',
    story: 'Augustin avait calculé le retour d’une comète. Elle devait apparaître cette nuit, à un point précis du ciel. Encore fallait-il y pointer la lunette, et la lunette ne voit qu’un tout petit bout de ciel.',
    views: {
      A: { type: 'skychart', mission: 'Tu as la carte du ciel et l’emplacement de la comète. Tu ne sais pas où pointe la lunette de l’autre : fais-toi décrire ce qu’elle montre, retrouve l’endroit sur ta carte, puis guide-la jusqu’à la comète.', other: 'la lunette, qui ne montre que neuf cases de ciel, et pas la comète.', size: SKY, cells: sky.cells, comet: sky.comet },
      B: { type: 'scope', mission: 'Tu tiens la lunette. Elle ne montre qu’un petit carré de ciel, et la comète est trop pâle pour toi. Décris les étoiles à l’autre, laisse-toi guider, et photographie au bon endroit.', other: 'la carte du ciel entier, avec la comète.', size: SKY },
    },
    input: { kind: 'scope' },
    scope: sky,
    answer: '',
    hints: [
      'Décrivez le carré entier, case par case : quel type d’étoile, et où (en haut à gauche, au centre…). Une case noire hachurée veut dire que la lunette touche le bord de la carte.',
      'Pour être sûrs de l’endroit, bougez d’un cran et décrivez à nouveau. Sur la carte, touchez une case pour y poser un repère.',
      `Au départ, la lunette pointait en ${coord(sky.start)}.`,
    ],
    reveal: `La comète est en ${coord(sky.comet)}. Depuis le point de départ (${coord(sky.start)}) : ${route(sky.start, sky.comet)}. Le bouton « Revenir au départ » ramène la lunette au point de départ.`,
    page: { from: 'Augustin', text: 'Elle est revenue, exactement à l’heure. Soixante-seize ans de voyage, et pas une minute de retard. Je l’ai trouvée insolente. Puis j’ai pensé à toi, qui attends, et qui n’as jamais été en retard d’un seul jour.' },
  };
}

/* ---------- 6. L'Éclipse ---------- */
// Celui qui voit le Soleil ne peut pas déclencher, celui qui déclenche ne voit rien.
// Le noir complet dure de moins en moins. On tolère un petit retard : l'appel et le réseau en ajoutent un.
const PLATES = [2600, 2000, 1500];
const EARLY = 250;
const GRACE = 450;
function p6() {
  return {
    id: 'eclipse',
    title: 'L’Éclipse',
    story: 'Le grand jour d’Augustin : une éclipse totale, quelques secondes de nuit en plein jour. Trois plaques photographiques, à prendre pendant le noir complet. Son assistant ne voyait rien du ciel et n’a jamais raté une plaque. Augustin disait qu’il n’avait jamais eu besoin de lui crier « maintenant ».',
    views: {
      A: { type: 'eclipse', mission: 'Toi seul vois le Soleil. Lance la poursuite : la Lune glisse vers lui, puis le cache complètement pendant quelques secondes. C’est pendant ce noir que l’autre doit déclencher, mais l’autre ne voit rien : tout dépend de ta voix. Le noir raccourcit à chaque plaque.', other: 'l’obturateur, et aucune vue sur le ciel.' },
      B: { type: 'shutter', mission: 'Tu as l’obturateur, mais aucune vue sur le ciel. La plaque n’est bonne que si tu déclenches pendant le noir complet, et seul l’autre voit quand il arrive. Trois plaques à réussir.', other: 'la lunette, et le Soleil dedans.' },
    },
    input: { kind: 'eclipse' },
    eclipse: { plates: PLATES },
    answer: '',
    hints: [
      'Dans un appel, la voix arrive toujours avec un petit retard. Si vous attendez que le noir soit là pour le dire, il sera presque fini quand l’autre appuiera.',
      'La Lune avance toujours à la même vitesse : on peut prévoir quand elle touchera le Soleil. Comptez à rebours pendant qu’elle approche, « trois, deux, un, top », et déclenchez sur le « top ».',
      'Toujours voilées ? Le bouton « Passer » vous fait passer l’éclipse, en échange d’un gage.',
    ],
    passOnGage: true,
    page: { from: 'Alexandrine', text: 'Tu m’envoies une photographie du Soleil noir. Je l’ai posée sur mon bureau. Tout le monde me demande ce que c’est. Je réponds : « La preuve qu’il pense à moi même en plein jour. »' },
  };
}

/* ---------- 7. La Coupole ---------- */
function p7() {
  const mission = 'Remets les six éclats dans l’ordre de leurs numéros. Tu ne connais que la moitié des numéros : l’autre a le reste.';
  return {
    id: 'coupole',
    title: 'La Coupole',
    story: 'Dernière nuit. La coupole ne s’ouvre qu’avec un mot de six lettres : ce qu’ils regardaient chaque soir, chacun de son côté du monde.',
    views: {
      A: { type: 'door', mission, other: 'les trois autres numéros, et la fin de la phrase.', riddle: 'Chaque soir, à la même heure, chacun la cherchait au-dessus de soi…' },
      B: { type: 'door', mission, other: 'les trois autres numéros, et le début de la phrase.', riddle: '… et c’était la même, des deux côtés du monde.' },
    },
    input: { kind: 'letters', length: 6, label: 'Le mot de la coupole' },
    answer: FINAL_WORD,
    hints: ['Mettez vos numéros en commun : chacun de vous en détient trois.', 'Lisez les lettres dans l’ordre des numéros, de 1 à 6.', 'C’est ce qu’ils regardaient chaque soir, à la même heure.'],
    reveal: `Le mot de la coupole est ${FINAL_WORD}.`,
    page: { from: 'Alexandrine', text: 'Onze ans, la même étoile, chaque soir. Je ne lui ai jamais dit que, certains soirs, il pleuvait chez moi, et que je la regardais quand même. Vous deux, les soirs de pluie, appelez-vous. C’est pareil.' },
  };
}

function buildAll() { return [p1(), p2(), p3(), p4(), p5(), p6(), p7()]; }

module.exports = {
  buildAll, cardsFor, GAGES, WRITTEN_AFTER, SEALS, FINAL_WORD, SHARED, SPICY, NIGHTS,
  FOCUS_MAX, rot, buildGrille, GRILLE_PREFIX, buildShower, SHOWER_LEAD, buildGears,
  SKY, windowOf, buildSky, coord, PLATES, EARLY, GRACE,
};
