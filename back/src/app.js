import express from 'express';
import { players } from './players.js';
import { PERIODS, buildLeaderboard } from './leaderboard.js';

const error = (res, status, code, message) => res.status(status).json({ code, message });

// Le contrat ne dit pas comment le jeton est envoyé : on attend "Authorization: Bearer <id du joueur>".
function playerFromRequest(req) {
  const match = /^Bearer (.+)$/.exec(req.get('Authorization') ?? '');
  return match ? players.find((p) => p.id === match[1]) : undefined;
}

export function createApp() {
  const app = express();

  app.get('/leaderboard', (req, res) => {
    const player = playerFromRequest(req);
    if (!player) {
      return error(res, 401, 'UNAUTHORIZED', 'Jeton de session absent ou expiré.');
    }

    const period = req.query.period ?? 'season';
    if (typeof period !== 'string' || !PERIODS.includes(period)) {
      return error(res, 400, 'INVALID_PERIOD', "Le paramètre period doit valoir 'season' ou 'today'.");
    }

    res.json(buildLeaderboard(period, player.id));
  });

  app.use((req, res) => error(res, 404, 'NOT_FOUND', 'Route inconnue.'));

  return app;
}
