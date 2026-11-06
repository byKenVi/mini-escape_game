# La Bibliothèque d'Alexandrine

Escape game coopératif à deux. Chaque joueur voit un écran différent : il faut décrire, écouter, et se taquiner. En chemin, les joueurs retrouvent les lettres qu'Alexandrine et Augustin se sont écrites.

- **Tome I, La Bibliothèque** : à distance, en appel.
- **Tome II, Le Train de Nuit** : côte à côte, un téléphone chacun, en promettant de ne pas regarder l'écran de l'autre. Après chaque voiture, un entracte partagé sur les deux écrans : un télégramme, un geste osé si les deux joueurs majeurs disent oui (avec deux gestes tendres pour s'échauffer), sinon un geste tendre, parfois une question ou une carte écrite par l'un des joueurs dans le salon. On avance quand les deux ont appuyé ; chacun peut passer une carte seul.

## Lancer en local
    npm start        # http://localhost:3000
    npm test

Aucune dépendance à installer. En local, les salles sont gardées en mémoire. Pour jouer à deux sur la même machine, utiliser deux navigateurs différents (ou une fenêtre privée) : la session est gardée dans le navigateur.

## Déploiement (Vercel)
Chaque push sur `main` déploie. Les fonctions Vercel ne gardent rien en mémoire entre deux appels, donc les salles vivent dans Redis (Upstash, via le Marketplace Vercel). Variables nécessaires, ajoutées automatiquement par l'intégration :

    KV_REST_API_URL
    KV_REST_API_TOKEN

Les navigateurs interrogent `/api/game` environ une fois par seconde, ce qui survit aux coupures réseau et aux téléphones mis en veille.

## Structure
- `lib/puzzles.js` : le tome I, ses 7 chapitres, ses lettres et ses entractes (réponses uniquement côté serveur)
- `lib/train.js` : le tome II, ses 7 voitures, ses télégrammes et ses cartes
- `lib/game.js` : les règles, sans réseau ni stockage
- `lib/store.js` : Redis ou mémoire, écriture optimiste si les deux joueurs agissent en même temps
- `api/game.js` : l'API appelée par le navigateur
- `dev-server.js` : serveur local
- `public/` : l'interface

## Ajouter une énigme
Ajouter une fonction dans le fichier du tome (vue A, vue B, réponse, indices, lettre), l'ajouter dans `buildAll()`, et si besoin un nouveau `type` de vue dans `viewBody()` de `public/app.js`. Les six premières étapes donnent chacune un sceau : garder `SEALS` et les cartes d'entracte alignés.

## Ajouter un tome
Créer un fichier qui exporte `buildAll`, `cardsFor`, `SEALS` et `FINAL_WORD`, le déclarer dans `VOLUMES` (`lib/game.js`) et dans `TOMES` (`public/app.js`), puis lui donner son thème sous `body[data-volume="N"]` dans `public/style.css`.
