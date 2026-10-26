# Front du classement

## Démarrer

```bash
npm install
npm run dev
```

Par défaut, le front appelle `/leaderboard` sur la même origine. Si le backend
est sur une autre origine, copier `.env.example` vers `.env` et renseigner
`VITE_API_BASE_URL` (par exemple `http://localhost:3000`), puis redémarrer Vite.

L'écran consomme le contrat `GET /leaderboard` défini dans
`contracts/Loris_contratAPI_leaderboard.yaml`. Le contrat ne précisant pas le
transport d'authentification, aucun jeton ni mécanisme de connexion n'est ajouté
au front ; une réponse `401` est affichée à l'utilisateur.
