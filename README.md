# La Bibliothèque d'Alexandrine

Escape game coopératif à deux, à jouer en appel. Chaque joueur voit un écran différent : il faut décrire, écouter, et se taquiner. En chemin, les joueurs retrouvent les lettres qu'Alexandrine et Augustin se sont écrites à distance.

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
- `lib/puzzles.js` : les 7 chapitres, les lettres, les entractes (réponses uniquement côté serveur)
- `lib/game.js` : les règles, sans réseau ni stockage
- `lib/store.js` : Redis ou mémoire, écriture optimiste si les deux joueurs agissent en même temps
- `api/game.js` : l'API appelée par le navigateur
- `dev-server.js` : serveur local
- `public/` : l'interface

## Ajouter une énigme
Ajouter une fonction dans `lib/puzzles.js` (vue A, vue B, réponse, indices, lettre), l'ajouter dans `buildAll()`, et si besoin un nouveau `type` de vue dans `viewBody()` de `public/app.js`. Les six premiers chapitres donnent chacun un sceau : garder `SEALS` et `DARES` alignés.
