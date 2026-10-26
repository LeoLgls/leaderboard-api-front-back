import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';

let server;
let base;
const auth = (id) => ({ Authorization: `Bearer ${id}` });

before(async () => {
  server = createApp().listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  base = `http://localhost:${server.address().port}`;
});
after(() => server.close());

const get = (path, headers = {}) => fetch(base + path, { headers });

test('200 : la forme de la réponse suit le contrat', async () => {
  const res = await get('/leaderboard', auth('usr_94a2b1'));
  assert.equal(res.status, 200);
  const body = await res.json();

  assert.deepEqual(Object.keys(body).sort(), ['items', 'period', 'total']);
  assert.equal(body.period, 'season');
  assert.equal(body.total, body.items.length);
  assert.ok(body.total >= 0 && body.total <= 100);

  for (const e of body.items) {
    assert.ok(Number.isInteger(e.rank) && e.rank >= 1 && e.rank <= 100);
    assert.equal(typeof e.id, 'string');
    assert.ok(typeof e.username === 'string' && e.username.length >= 1 && e.username.length <= 32);
    assert.ok(e.team === null || typeof e.team === 'string');
    assert.ok(Number.isInteger(e.level) && e.level >= 1);
    assert.ok(Number.isInteger(e.xp) && e.xp >= 0);
    assert.equal(typeof e.isCurrentPlayer, 'boolean');
  }
});

test('le classement saison reprend l\'écran du hub', async () => {
  const { items } = await (await get('/leaderboard', auth('usr_94a2b1'))).json();
  assert.equal(items.length, 11);
  assert.deepEqual(items.map((e) => e.username).slice(0, 3), ['Ishak MESSAOUDI', 'Jérémy', 'clément lisnard']);
  assert.deepEqual(items.map((e) => e.rank), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  assert.deepEqual(items.slice(-2).map((e) => [e.username, e.xp, e.level]), [['Dylan', 0, 1], ['Dylan_Test', 0, 1]]);
});

test('isCurrentPlayer vaut true pour une seule ligne : le joueur connecté', async () => {
  const { items } = await (await get('/leaderboard', auth('usr_94a2b1'))).json();
  const mine = items.filter((e) => e.isCurrentPlayer);
  assert.equal(mine.length, 1);
  assert.equal(mine[0].username, 'Loris');
});

test('period=today : seuls les XP du jour comptent, les autres restent listés à 0', async () => {
  const body = await (await get('/leaderboard?period=today', auth('usr_94a2b1'))).json();
  assert.equal(body.period, 'today');
  assert.equal(body.total, 11);
  assert.equal(body.items[0].username, 'Jérémy');
  assert.equal(body.items[0].xp, 70);
  assert.ok(body.items.slice(1).every((e) => e.xp === 0));
});

test('400 INVALID_PERIOD si period est inconnu', async () => {
  const res = await get('/leaderboard?period=week', auth('usr_94a2b1'));
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.equal(body.code, 'INVALID_PERIOD');
  assert.equal(typeof body.message, 'string');
});

test('401 UNAUTHORIZED sans jeton ou avec un jeton inconnu', async () => {
  for (const headers of [{}, auth('usr_inconnu'), { Authorization: 'Basic abc' }]) {
    const res = await get('/leaderboard', headers);
    assert.equal(res.status, 401);
    assert.equal((await res.json()).code, 'UNAUTHORIZED');
  }
});

test('le jeton est vérifié avant le paramètre : sans jeton et period invalide => 401', async () => {
  assert.equal((await get('/leaderboard?period=week')).status, 401);
});
