# Back du classement

Petit serveur Express qui répond à `GET /leaderboard`, d'après le contrat de Loris
(`contracts/Loris_contratAPI_leaderboard.yaml`).

```bash
npm install
npm start      # http://localhost:3000
npm test
```

```bash
curl -H "Authorization: Bearer usr_94a2b1" "http://localhost:3000/leaderboard?period=today"
```

## Ce qu'on a pris tel quel dans le contrat

- La route `GET /leaderboard`, avec `period=season` ou `today` (`season` si on ne met rien).
- Une réponse `{ period, total, items }`, avec 100 joueurs au maximum.
- À XP égal, celui qui a atteint son XP le plus tôt passe devant.
- Un joueur qui n'a jamais joué est dans la liste, avec 0 XP et niveau 1.
- Les erreurs ont la forme `{ code, message }` : 400 `INVALID_PERIOD` et 401 `UNAUTHORIZED`.

## Ce qui manquait ou restait flou dans le contrat

En lisant le contrat, plusieurs choses ne se déduisaient pas. À chaque fois on a dû
choisir, et c'est exactement là que le front peut avoir compris autre chose.

### Authentification
- **Comment on envoie le jeton ?** Le contrat prévoit un 401 mais ne définit aucun
  moyen de s'authentifier (pas de `securitySchemes`). On a supposé
  `Authorization: Bearer <id du joueur>`. Un jeton inconnu ou absent donne un 401.
- **Que devient `isCurrentPlayer` ?** Il dépend de qui est connecté, donc du jeton qu'on
  vient de deviner. Et si le joueur connecté est au-delà du top 100, le contrat ne dit
  pas s'il doit apparaître quand même. Chez nous il n'apparaît pas.
- **Qui est contrôlé en premier ?** Le contrat ne le dit pas. On vérifie le jeton avant
  `period`, donc sans jeton et avec une période invalide, on répond 401 et pas 400.

### La route et la réponse
- **Pas d'adresse de base.** Il n'y a ni `servers` ni préfixe `/api/v1`, alors que la
  slide en montre un. On a gardé `/leaderboard` tel quel.
- **Le tri n'est pas écrit.** Le contrat ne dit pas que le classement est trié par XP
  décroissant, on l'a déduit. Il décrit seulement le départage des égalités, dans le
  texte de présentation, pas dans la structure.
- **`achievedAt` n'est pas dans la réponse.** Le départage repose sur une date que le
  front ne reçoit jamais : il ne peut ni l'afficher ni vérifier le résultat. Et quand
  deux joueurs n'ont aucune date (jamais joué), le contrat ne dit rien. On les met
  après ceux qui ont une date, puis par ordre alphabétique du pseudo.
- **Le « top 100 » est dans le texte, pas dans les paramètres.** Il n'y a ni `page` ni
  `limit`. De plus, `total` est décrit comme « le nombre d'entrées retournées » : ce
  n'est donc pas le nombre total de joueurs, ce qui peut surprendre.
- **`period=today` n'est pas expliqué.** On a supposé qu'il s'agit de l'XP gagné
  aujourd'hui, que tout le monde reste listé (avec 0 si rien), et on n'a pas géré les
  fuseaux horaires.
- **`team` est « nullable » mais pas obligatoire.** Peut-il être absent, ou seulement
  `null` ? On l'envoie toujours, à `null` quand il n'y a pas d'équipe.
- **Un détail d'écran dans le contrat.** `isCurrentPlayer` est décrit comme « la ligne
  jaune ». C'est de l'affichage, ça n'a pas sa place dans un contrat de données.

### Les erreurs
- **Pas de 429.** La slide en montre un et le jeu limite à 60 requêtes par minute. Ici
  on ne limite rien.
- **Les codes d'erreur ne sont pas listés.** `code` est une chaîne libre : les exemples
  disent `INVALID_PERIOD` et `UNAUTHORIZED`, mais le schéma propose `BAD_REQUEST`. Le
  front ne sait donc pas quels codes il peut recevoir.
- **Pas de cas pour une route inconnue ou une panne.** On renvoie un 404
  `NOT_FOUND` au même format, mais ce n'est pas dans le contrat.

### Les noms
- Le contrat parle de `id`, `username`, `level`. La slide 21 utilise `playerId`,
  `pseudo`, `level`. L'identifiant est présenté comme un « UUID » alors que l'exemple
  (`usr_94a2b1`) n'en est pas un. On a gardé les noms du contrat.

## À faire au moment du branchement

Reprendre cette liste avec le front et noter ce qui ne colle pas, c'est ça qui compte
pour le rendu. Les points les plus risqués : le format du jeton, le tri, `total`,
`isCurrentPlayer`, et les noms des champs.
