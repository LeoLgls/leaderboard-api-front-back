# Back classement

API Express qui implémente `contracts/Loris_contratAPI_leaderboard.yaml`.

```bash
npm install
npm start      # http://localhost:3000
npm test
```

```bash
curl -H "Authorization: Bearer usr_94a2b1" "http://localhost:3000/leaderboard?period=today"
```

## Ce que le contrat dit et qui est appliqué tel quel
- `GET /leaderboard?period=season|today` (défaut `season`), réponse `{ period, total, items }`.
- Top 100 maximum, `total` = nombre d'entrées renvoyées, pas de pagination.
- Égalité d'XP : départage par `achievedAt` le plus ancien.
- Joueur sans partie : présent, 0 XP, niveau 1.
- Erreurs au format plat `{ code, message }` : 400 `INVALID_PERIOD`, 401 `UNAUTHORIZED`.

## Ce que le contrat ne dit pas, et choix faits ici (à vérifier au branchement)
1. **Envoi du jeton** : pas de `securitySchemes`. Choix : en-tête `Authorization: Bearer <id du joueur>`.
   Un jeton inconnu donne 401, et c'est lui qui détermine `isCurrentPlayer`.
2. **Ordre des contrôles** : jeton d'abord (401), puis `period` (400).
3. **Égalité sans date** (joueurs jamais actifs) : classés après ceux qui ont une date, puis par pseudo.
4. **`team`** : toujours présent dans la réponse, `null` si aucune équipe (le contrat ne le met pas dans `required`).
5. **`period=today`** : tous les joueurs restent listés, avec leur XP du jour (0 si rien).
6. **Pas de préfixe `/api/v1`** : la route est `/leaderboard`, comme dans le contrat.
7. **Pas de 429** : le contrat n'en parle pas, donc aucune limite de requêtes.
8. **Erreur serveur ou route inconnue** : 404 `{ code: "NOT_FOUND", message }` pour toute autre route.
