import test from 'node:test';
import assert from 'node:assert/strict';
import { BOARD, reachablePositions, shortestDistance } from '../dist/js/board.js';
import { attackCreature, chooseAiAction, createGame, legalMoves, legalTargets, moveCreature } from '../dist/js/engine.js';

const alpha = ['savrip', 'monnok', 'ghhhk', 'houjix'];
const beta = ['kintan', 'ngok', 'klor', 'molator'];

test('el tablero tiene 25 posiciones únicas y un grafo conectado', () => {
  assert.equal(BOARD.length, 25);
  assert.equal(new Set(BOARD.map((p) => p.id)).size, 25);
  assert.equal(shortestDistance('O0', 'O6'), 4);
  assert.equal(shortestDistance('I0', 'I6'), 2);
});

test('el cálculo de movimiento respeta ocupación y alcance', () => {
  const open = reachablePositions('O0', 1, new Set(['O1']));
  assert.deepEqual(new Set(open), new Set(['O11', 'I0']));
  const game = createGame(alpha, beta, 'LOCAL', 'NORMAL', 1);
  assert.ok(legalMoves(game, 'P1-savrip').length > 0);
  assert.ok(!legalMoves(game, 'P2-kintan').length);
});

test('mover consume el turno y conserva inmutabilidad', () => {
  const game = createGame(alpha, beta, 'LOCAL', 'NORMAL', 1);
  const target = legalMoves(game, 'P1-savrip')[0];
  assert.ok(target);
  const next = moveCreature(game, 'P1-savrip', target);
  assert.equal(game.currentPlayer, 'P1');
  assert.equal(next.currentPlayer, 'P2');
  assert.equal(next.turn, 2);
  assert.equal(next.creatures.find((c) => c.instanceId === 'P1-savrip')?.position, target);
});

test('un ataque híbrido aplica daño reproducible con semilla', () => {
  let game = createGame(alpha, beta, 'LOCAL', 'NORMAL', 7);
  const creatures = game.creatures.map((c) => c.instanceId === 'P2-kintan' ? { ...c, position: 'I10' } : c);
  game = { ...game, creatures };
  const targets = legalTargets(game, 'P1-savrip');
  assert.equal(targets[0]?.instanceId, 'P2-kintan');
  const result = attackCreature(game, 'P1-savrip', 'P2-kintan');
  assert.ok(result.damage >= 1);
  assert.equal(result.state.currentPlayer, 'P2');
  assert.equal(result.state.rngSeed, 1025555898);
});

test('la IA táctica prioriza un ataque disponible', () => {
  let game = createGame(alpha, beta, 'AI', 'NORMAL', 11);
  game = {
    ...game,
    currentPlayer: 'P2',
    creatures: game.creatures.map((c) => c.instanceId === 'P2-molator' ? { ...c, position: 'I10' } : c)
  };
  const action = chooseAiAction(game);
  assert.equal(action.type, 'ATTACK');
});
