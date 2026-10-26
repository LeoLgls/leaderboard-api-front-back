import { useEffect, useState } from 'react';
import { ApiError, fetchLeaderboard } from './api.js';

const periods = [
  { value: 'season', label: 'Cette saison' },
  { value: 'today', label: "Aujourd'hui" },
];

function formatNumber(value) {
  return new Intl.NumberFormat('fr-FR').format(value);
}

function getErrorMessage(error) {
  if (error instanceof ApiError) {
    if (error.status === 400) {
      return `La période demandée est invalide.${error.message ? ` ${error.message}` : ''}`;
    }
    if (error.status === 401) {
      return 'Tu dois être authentifié pour consulter le classement. Connecte-toi puis réessaie.';
    }
    return error.message;
  }

  return 'Impossible de contacter le serveur. Vérifie la connexion et réessaie.';
}

function LeaderboardTable({ items }) {
  if (items.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-icon" aria-hidden="true">✦</span>
        <h2>Pas encore de joueurs classés</h2>
        <p>Le classement apparaîtra ici dès que des résultats seront disponibles.</p>
      </div>
    );
  }

  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th scope="col">Rang</th>
            <th scope="col">Joueur</th>
            <th scope="col">Équipe</th>
            <th scope="col">Niveau</th>
            <th scope="col" className="numeric">XP</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr
              key={item.id}
              className={item.isCurrentPlayer ? 'current-player' : undefined}
              aria-current={item.isCurrentPlayer ? 'true' : undefined}
            >
              <td>
                <span className={`rank rank-${item.rank <= 3 ? item.rank : 'other'}`}>
                  {item.rank}
                </span>
              </td>
              <th scope="row" className="player-name">
                {item.username}
                {item.isCurrentPlayer && <span className="you-label">Vous</span>}
              </th>
              <td className="team-name">{item.team ?? '—'}</td>
              <td><span className="level">Niv. {item.level}</span></td>
              <td className="numeric xp-value">{formatNumber(item.xp)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function App() {
  const [period, setPeriod] = useState('season');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadLeaderboard() {
      setLoading(true);
      setError('');
      setData(null);

      try {
        const result = await fetchLeaderboard(period, controller.signal);
        setData(result);
      } catch (loadError) {
        if (loadError.name !== 'AbortError') {
          setError(getErrorMessage(loadError));
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadLeaderboard();
    return () => controller.abort();
  }, [period, reloadCount]);

  return (
    <main className="page-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Hub, accueil">
          <span className="brand-mark" aria-hidden="true">H</span>
          <span>HUB<span className="brand-dot">.</span></span>
        </a>
        <span className="topbar-label">ESPACE JOUEURS</span>
      </header>

      <section className="content">
        <div className="intro">
          <p className="eyebrow"><span className="eyebrow-line" /> PERFORMANCE</p>
          <h1>Classement<span className="title-dot">.</span></h1>
          <p className="subtitle">Les joueurs qui font la différence.</p>
        </div>

        <section className="leaderboard-card" aria-labelledby="leaderboard-heading">
          <div className="card-header">
            <div>
              <h2 id="leaderboard-heading">Le leaderboard</h2>
              <p className="card-caption">Jusqu'aux 100 meilleurs joueurs</p>
            </div>
            <div className="period-switch" aria-label="Période du classement">
              {periods.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={period === option.value ? 'period-button active' : 'period-button'}
                  aria-pressed={period === option.value}
                  onClick={() => setPeriod(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="results-summary" aria-live="polite">
            <span className="status-dot" />
            {loading
              ? 'Chargement du classement…'
              : error
                ? 'Classement indisponible'
                : `${formatNumber(data?.total ?? 0)} joueur${data?.total === 1 ? '' : 's'}`}
          </div>

          {error ? (
            <div className="error-state" role="alert">
              <span className="error-icon" aria-hidden="true">!</span>
              <div>
                <h2>Impossible d'afficher le classement</h2>
                <p>{error}</p>
                <button className="retry-button" type="button" onClick={() => setReloadCount((count) => count + 1)}>
                  Réessayer
                </button>
              </div>
            </div>
          ) : loading ? (
            <div className="loading-state" role="status">
              <span className="spinner" aria-hidden="true" />
              <span>Récupération des résultats</span>
            </div>
          ) : (
            <LeaderboardTable items={data?.items ?? []} />
          )}

          <footer className="card-footer">
            <span>Classement limité au top 100</span>
            <span>Mis à jour à chaque consultation</span>
          </footer>
        </section>

        <p className="footnote">
          En cas d'égalité d'XP, le serveur applique le départage défini par le contrat.
        </p>
      </section>
    </main>
  );
}
