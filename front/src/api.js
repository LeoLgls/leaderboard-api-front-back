const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, '') ?? '';

export class ApiError extends Error {
  constructor(message, status, code) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

function isLeaderboardResponse(value, requestedPeriod) {
  return (
    value !== null &&
    typeof value === 'object' &&
    value.period === requestedPeriod &&
    Number.isInteger(value.total) &&
    value.total >= 0 &&
    value.total <= 100 &&
    Array.isArray(value.items) &&
    value.total === value.items.length &&
    value.items.every(
      (item) =>
        item !== null &&
        typeof item === 'object' &&
        typeof item.id === 'string' &&
        Number.isInteger(item.rank) &&
        item.rank >= 1 &&
        item.rank <= 100 &&
        typeof item.username === 'string' &&
        item.username.length >= 1 &&
        item.username.length <= 32 &&
        (item.team === undefined || item.team === null || typeof item.team === 'string') &&
        Number.isInteger(item.level) &&
        item.level >= 1 &&
        Number.isInteger(item.xp) &&
        item.xp >= 0 &&
        typeof item.isCurrentPlayer === 'boolean',
    )
  );
}

export async function fetchLeaderboard(period, signal) {
  const response = await fetch(
    `${apiBaseUrl}/leaderboard?period=${encodeURIComponent(period)}`,
    { signal },
  );

  let body;
  try {
    body = await response.json();
  } catch {
    throw new ApiError(
      'La réponse du serveur est invalide. Réessaie plus tard.',
      response.status,
    );
  }

  if (!response.ok) {
    const message =
      typeof body?.message === 'string'
        ? body.message
        : response.status === 401
          ? 'Tu dois être authentifié pour consulter le classement.'
          : `Le serveur a répondu avec une erreur (${response.status}).`;

    throw new ApiError(message, response.status, body?.code);
  }

  if (!isLeaderboardResponse(body, period)) {
    throw new ApiError(
      'Le serveur a renvoyé des données qui ne correspondent pas au contrat.',
      response.status,
    );
  }

  return body;
}
