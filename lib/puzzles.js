'use strict';
// Toutes les énigmes. Les réponses ne quittent JAMAIS le serveur.

const rnd = (n) => Math.floor(Math.random() * n);
const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = (a) => a[rnd(a.length)];
const normalize = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

// Sceaux : lettre visible par les deux, numéro visible par un seul joueur. Mot final : REVOIR
const SEALS = [
  { letter: 'V', number: 3, to: 'A' },
  { letter: 'R', number: 1, to: 'B' },
  { letter: 'I', number: 5, to: 'A' },
  { letter: 'E', number: 2, to: 'B' },
  { letter: 'R', number: 6, to: 'A' },
  { letter: 'O', number: 4, to: 'B' },
];
const FINAL_WORD = 'REVOIR';

// Défis à voix haute entre deux énigmes : {x} est la personne visée, {y} l'autre. to: null = les deux.
const DARES = [
  { to: 'B', text: '{x}, une manie de {y} qui t’agace, et que tu ne changerais pour rien au monde.' },
  { to: 'A', text: '{x}, décris {y} en trois mots : un tendre, un drôle et un parfaitement injuste.' },
  { to: 'B', text: '{x}, imite la façon dont {y} dit « j’arrive » quand c’est faux.' },
  { to: null, text: 'À trois, dites en même temps qui a le plus ramé jusqu’ici. Aucune contestation admise.' },
  { to: 'B', text: '{x}, la toute première chose que vous ferez quand vous vous reverrez. Réponse précise exigée.' },
  { to: 'A', text: '{x}, à quel moment as-tu su, pour {y} ? Dix secondes. Interdiction de faire une blague.' },
];

/* ---------- 1. Les Quatre Reliures ---------- */
function p1() {
  const syms = ['moon', 'star', 'tower', 'flower'];
  const years = shuffle([1066, 1204, 1342, 1488, 1611, 1789, 1853]).slice(0, 4);
  const digits = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 4);
  const items = syms.map((s, i) => ({ sym: s, year: years[i], digit: digits[i] }));
  const answer = items.slice().sort((a, b) => a.year - b.year).map((x) => x.digit).join('');
  return {
    id: 'reliures',
    title: 'Les Quatre Reliures',
    story: 'Première étagère. Alexandrine rangeait ses secrets par date, et le tiroir du pupitre refuse de s’ouvrir.',
    views: {
      A: { type: 'books', mission: 'Tu as les quatre grimoires. Dis à l’autre quel symbole porte quelle date.', other: 'le cadenas, et la table qui change chaque symbole en chiffre.', books: shuffle(items).map(({ sym, year }) => ({ sym, year })) },
      B: { type: 'lock', mission: 'Tu as le cadenas. Demande à l’autre les dates de ses grimoires, puis suis ce que dit la plaque.', other: 'quatre grimoires, chacun avec un symbole et une date.', plaque: '« Du plus ancien au plus récent. »', table: shuffle(items).map(({ sym, digit }) => ({ sym, digit })) },
    },
    input: { kind: 'digits', length: 4, label: 'Code du cadenas' },
    answer,
    hints: ['Classez d’abord les symboles par date, du plus ancien au plus récent.', 'Remplacez ensuite chaque symbole par son chiffre, en gardant cet ordre.'],
    page: { from: 'Alexandrine', text: 'Cher Augustin, tu m’écris que tu ranges mes lettres par date. Moi, je range les tiennes par degré d’agacement. Tu occupes déjà trois étagères.' },
  };
}

/* ---------- 2. Le Disque de César ---------- */
function p2() {
  const word = pick(['PROMESSE', 'SOUVENIR', 'TOUJOURS', 'ETREINTE']);
  const shift = 3 + rnd(9);
  const cipher = word.split('').map((c) => String.fromCharCode(((c.charCodeAt(0) - 65 + shift) % 26) + 65)).join('');
  return {
    id: 'cesar',
    title: 'Le Disque de César',
    story: 'Augustin codait ses lettres et trouvait ça très romantique. Alexandrine trouvait ça surtout très agaçant.',
    views: {
      A: { type: 'cipher', mission: `Voici un mot codé de ${word.length} lettres, un mot qu’on écrit à quelqu’un qu’on aime. Épelle-le à l’autre.`, other: 'le disque de laiton qui permet de décoder ces lettres.', cipher },
      B: { type: 'wheel', mission: 'Tu as le disque. Note les lettres que l’autre t’épelle, puis tourne l’anneau jusqu’à lire un vrai mot.', other: 'un mot codé, à t’épeler lettre par lettre.' },
    },
    input: { kind: 'letters', length: word.length, label: 'Le mot déchiffré' },
    answer: word,
    hints: ['Chaque lettre a été décalée du même nombre de crans dans l’alphabet.', 'Cherche la lettre codée sur l’anneau extérieur et lis celle juste en dessous. Le bon réglage est entre le cran 3 et le cran 11.'],
    page: { from: 'Augustin', text: 'Alexandrine, j’ai codé cette lettre pour qu’aucun douanier ne sache que je pense à toi. Tu vas râler. J’adore quand tu râles, même à six mille kilomètres.' },
  };
}

/* ---------- 3. Les Deux Calques ---------- */
const FONT = {
  0: ['111', '101', '101', '101', '111'], 1: ['010', '110', '010', '010', '111'],
  2: ['111', '001', '111', '100', '111'], 3: ['111', '001', '111', '001', '111'],
  4: ['101', '101', '111', '001', '001'], 5: ['111', '100', '111', '001', '111'],
  6: ['111', '100', '111', '101', '111'], 7: ['111', '001', '001', '001', '001'],
  8: ['111', '101', '111', '101', '111'], 9: ['111', '101', '111', '001', '111'],
};
function p3() {
  const pool = [2, 3, 4, 5, 6, 7, 8, 9];
  const d1 = pick(pool), d2 = pick(pool);
  const rows = [];
  for (let r = 0; r < 5; r++) rows.push(FONT[d1][r] + '0' + FONT[d2][r]);
  const L = rows.join('').split('').map((c) => c === '1');
  const A = L.map(() => Math.random() < 0.5);
  const B = L.map((l, i) => A[i] !== l);
  const mission = 'Dictez-vous vos calques, ligne par ligne : « allumé, éteint… ». Si une case n’est allumée que d’un seul côté, touche-la : elle se remplit d’encre. L’encre dessine deux chiffres.';
  return {
    id: 'calques',
    title: 'Les Deux Calques',
    story: 'Il lui avait envoyé la moitié d’une carte et gardé l’autre. Sur la table de lecture, deux feuilles percées de petits trous de lumière.',
    views: {
      A: { type: 'sheet', mission, other: 'le même calque, mais avec d’autres cases allumées.', cols: 7, rows: 5, cells: A, tint: 'amber' },
      B: { type: 'sheet', mission, other: 'le même calque, mais avec d’autres cases allumées.', cols: 7, rows: 5, cells: B, tint: 'lapis' },
    },
    input: { kind: 'digits', length: 2, label: 'Le nombre révélé' },
    answer: `${d1}${d2}`,
    hints: ['Une case compte seulement si l’un l’a allumée et pas l’autre. Allumée des deux côtés ou éteinte des deux côtés : on l’ignore.', 'Les chiffres font 3 colonnes de large, séparés par la colonne du milieu, comme sur un écran de calculatrice.'],
    page: { from: 'Alexandrine', text: 'Tu gardes l’autre moitié de ta carte « pour me forcer à t’attendre ». C’est le cadeau le plus agaçant qu’on m’ait jamais fait. Je l’ai encadré.' },
  };
}

/* ---------- 4. Les Lecteurs du Soir ---------- */
function p4() {
  const mission = 'Le registre est déchiré : tu n’as que la moitié des indices. Lisez-vous vos fragments et remplissez le tableau.';
  const intro = 'Inès, Malik, Sofia et Théo sont assis aux tables 1 à 4. Chacun lit un tome : Rouge, Vert, Bleu ou Or.';
  return {
    id: 'lecteurs',
    title: 'Les Lecteurs du Soir',
    story: 'Quatre tables, quatre lecteurs fantômes, quatre tomes. Alexandrine notait tout. Absolument tout.',
    views: {
      A: { type: 'clues', scratch: 'grid', mission, intro, other: 'l’autre moitié du registre.', clues: [
        'Inès est assise à une table de numéro plus grand que celle de Malik.',
        'Le tome Vert est à la table 4.',
        'Théo ne lit ni le tome Rouge ni le tome Vert.',
        'Malik et Sofia ne sont pas à des tables voisines.',
        'Inès ne lit pas le tome Vert.',
      ] },
      B: { type: 'clues', scratch: 'grid', mission, intro, other: 'l’autre moitié du registre.', clues: [
        'Le tome Or est à une table de numéro inférieur à celle du tome Bleu.',
        'Inès ne lit pas le tome Bleu.',
        'Sofia est assise à une table voisine de celle d’Inès.',
        'Théo est assis à une table de numéro inférieur à celle d’Inès.',
        'Malik est assis à la table 1.',
      ] },
    },
    input: { kind: 'digits', length: 4, label: 'La table du tome Rouge, puis Vert, Bleu, Or' },
    answer: '3421',
    hints: ['Commencez par placer Malik et le tome Vert, puis déduisez qui est à la table 4.', 'Le code se lit couleur par couleur : le numéro de table du tome Rouge, puis Vert, puis Bleu, puis Or.'],
    page: { from: 'Augustin', text: 'Hier, dans une auberge, quelqu’un a lu à voix haute. J’ai cherché ta voix dans la sienne et j’ai eu l’air idiot. Ne le répète à personne.' },
  };
}

/* ---------- 5. La Partition de Fès ---------- */
function p5() {
  let levels;
  do { levels = Array.from({ length: 6 }, () => 1 + rnd(4)); }
  while (levels.join('') === levels.slice().reverse().join('') || new Set(levels).size < 3);
  const expected = levels.slice().reverse();
  return {
    id: 'partition',
    title: 'La Partition de Fès',
    story: 'Dans l’alcôve, un clavecin à quatre touches et un pupitre vide. La partition est ailleurs, et son sens de lecture aussi.',
    views: {
      A: { type: 'score', mission: 'Dicte les six notes à l’autre : 1 est la plus grave, 4 la plus aiguë. Alexandrine insiste pour que tu les chantes.', other: 'le clavecin à quatre touches.', levels, signature: 'Copié à Fès, comme on y écrit.' },
      B: { type: 'keys', mission: 'Joue les six notes que l’autre te dicte. Une fausse note et le clavecin revient au début.', other: 'la partition, et l’obligation de te la chanter.' },
    },
    input: { kind: 'keys', length: expected.length },
    expected,
    answer: expected.join(''),
    hints: ['Si la mélodie jouée telle quelle ne marche pas, c’est que le sens de lecture n’est pas le bon. Relisez la signature.', 'À Fès, on écrit en arabe : de droite à gauche. Jouez la partition en partant de la dernière note.'],
    page: { from: 'Alexandrine', text: 'J’ai appris ton air préféré à l’envers, pour que tu ne le reconnaisses pas. Le jour où tu rentreras, je le jouerai à l’endroit. Prépare une bonne excuse.' },
  };
}

/* ---------- 6. Le Cadenas du Coffre ---------- */
function p6() {
  const mission = 'Des essais sont gravés sur le coffre, chacun avec le verdict du mécanisme. Tu n’en vois qu’une partie : mettez-les en commun.';
  return {
    id: 'cadenas',
    title: 'Le Cadenas du Coffre',
    story: 'Au fond de la salle, un coffre à trois chiffres. Quelqu’un a déjà essayé, et a gravé ses échecs dans le métal.',
    views: {
      A: { type: 'clues', scratch: 'digits', mission, other: 'les essais gravés à l’arrière du coffre.', clues: [
        '6 8 2 : un chiffre est correct et bien placé.',
        '2 0 6 : deux chiffres sont corrects mais mal placés.',
        '7 8 0 : un chiffre est correct mais mal placé.',
      ] },
      B: { type: 'clues', scratch: 'digits', mission, other: 'les essais gravés à l’avant du coffre.', clues: [
        '6 1 4 : un chiffre est correct mais mal placé.',
        '7 3 8 : aucun chiffre n’est correct.',
      ] },
    },
    input: { kind: 'digits', length: 3, label: 'Le code du coffre' },
    answer: '042',
    hints: ['« 738 : aucun chiffre correct » élimine le 7, le 3 et le 8. Barrez-les.', 'Dans « 682 », seul le 2 peut être le chiffre bien placé : il est donc en dernière position. Cherchez les deux autres.'],
    page: { from: 'Augustin', text: 'La distance est un mauvais copiste : elle recopie tout, sauf l’essentiel. Je rentre au printemps. Garde-moi la table près de la fenêtre. Et ton sale caractère.' },
  };
}

/* ---------- 7. La Grande Porte ---------- */
function p7() {
  const mission = 'Pose les six sceaux dans l’ordre de leurs numéros. Tu ne connais que la moitié des numéros : l’autre a le reste.';
  return {
    id: 'porte',
    title: 'La Grande Porte',
    story: 'Six sceaux de cire brillent dans le noir. La porte attend un mot de six lettres, le dernier qu’ils se sont écrit.',
    views: {
      A: { type: 'door', mission, other: 'les trois autres numéros, et la fin de la phrase.', riddle: 'Ce qu’on se promet sur un quai de gare…' },
      B: { type: 'door', mission, other: 'les trois autres numéros, et le début de la phrase.', riddle: '… et ce qu’on attend, tout le temps d’après.' },
    },
    input: { kind: 'letters', length: 6, label: 'Le mot de la porte' },
    answer: FINAL_WORD,
    hints: ['Mettez vos numéros en commun : chacun de vous en détient trois.', 'Lisez les lettres dans l’ordre des numéros, de 1 à 6.'],
    page: { from: 'Alexandrine', text: 'Il est rentré au printemps. Je lui ai dit qu’il était en retard. Il ne l’était pas. Vous voilà dehors, vous deux. Le plus dur, vous le savez mieux que moi, ce n’était pas les serrures. À très vite.' },
  };
}

function buildAll() { return [p1(), p2(), p3(), p4(), p5(), p6(), p7()]; }
const cardsFor = (idx) => (DARES[idx] ? [{ kind: 'act', ...DARES[idx] }] : []);

module.exports = { buildAll, cardsFor, normalize, SEALS, DARES, FINAL_WORD };
