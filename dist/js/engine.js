import { reachablePositions, shortestDistance } from './board.js';
import { creatureById } from './data.js';
const STARTS = {
    P1: ['O10', 'O11', 'O0', 'O1'],
    P2: ['O4', 'O5', 'O6', 'O7']
};
const nextRandom = (seed) => {
    const nextSeed = (seed * 1664525 + 1013904223) >>> 0;
    return { value: nextSeed / 4294967296, seed: nextSeed };
};
const otherPlayer = (player) => player === 'P1' ? 'P2' : 'P1';
const addLog = (state, kind, text) => [
    ...state.log,
    { id: state.log.length + 1, kind, text }
];
export const createGame = (teamOne, teamTwo, mode, difficulty = 'NORMAL', seed = Date.now() >>> 0) => {
    if (teamOne.length !== 4 || teamTwo.length !== 4)
        throw new Error('Cada equipo necesita cuatro criaturas.');
    const buildTeam = (ids, owner) => ids.map((templateId, index) => ({
        instanceId: `${owner}-${templateId}`,
        templateId,
        owner,
        position: STARTS[owner][index] ?? STARTS[owner][0],
        hp: creatureById(templateId).stats.maxHp
    }));
    return {
        mode, difficulty, currentPlayer: 'P1', turn: 1,
        creatures: [...buildTeam(teamOne, 'P1'), ...buildTeam(teamTwo, 'P2')],
        winner: null,
        log: [{ id: 1, kind: 'SYSTEM', text: 'Proyección estable. Comienza el equipo azur.' }],
        rngSeed: seed
    };
};
export const getCreature = (state, instanceId) => {
    const creature = state.creatures.find((item) => item.instanceId === instanceId);
    if (!creature)
        throw new Error('La criatura ya no está en el tablero.');
    return creature;
};
export const legalMoves = (state, instanceId) => {
    const creature = getCreature(state, instanceId);
    if (creature.owner !== state.currentPlayer || state.winner)
        return [];
    const occupied = new Set(state.creatures.map((item) => item.position));
    return reachablePositions(creature.position, creatureById(creature.templateId).stats.movement, occupied);
};
export const legalTargets = (state, instanceId) => {
    const attacker = getCreature(state, instanceId);
    if (attacker.owner !== state.currentPlayer || state.winner)
        return [];
    const range = creatureById(attacker.templateId).stats.range;
    return state.creatures.filter((target) => target.owner !== attacker.owner && shortestDistance(attacker.position, target.position) <= range);
};
const finishTurn = (state) => ({
    ...state,
    currentPlayer: otherPlayer(state.currentPlayer),
    turn: state.turn + 1
});
export const moveCreature = (state, instanceId, target) => {
    const creature = getCreature(state, instanceId);
    if (!legalMoves(state, instanceId).includes(target))
        throw new Error('Movimiento no válido.');
    const template = creatureById(creature.templateId);
    const moved = state.creatures.map((item) => item.instanceId === instanceId ? { ...item, position: target } : item);
    return finishTurn({
        ...state,
        creatures: moved,
        log: addLog(state, 'MOVE', `${template.name} se desplaza a ${target}.`)
    });
};
export const attackCreature = (state, attackerId, targetId) => {
    const attacker = getCreature(state, attackerId);
    const target = getCreature(state, targetId);
    if (!legalTargets(state, attackerId).some((item) => item.instanceId === targetId)) {
        throw new Error('Objetivo fuera de alcance.');
    }
    const attackerTemplate = creatureById(attacker.templateId);
    const targetTemplate = creatureById(target.templateId);
    const random = nextRandom(state.rngSeed);
    const roll = Math.floor(random.value * 4) - 1;
    const critical = roll === 2 ? 2 : 0;
    const damage = Math.max(1, attackerTemplate.stats.attack - Math.floor(targetTemplate.stats.defense / 2) + roll + critical);
    const remainingHp = Math.max(0, target.hp - damage);
    const defeated = remainingHp === 0;
    const survivors = state.creatures
        .map((item) => item.instanceId === targetId ? { ...item, hp: remainingHp } : item)
        .filter((item) => item.hp > 0);
    const winner = survivors.some((item) => item.owner === target.owner) ? null : attacker.owner;
    let log = addLog(state, 'ATTACK', `${attackerTemplate.name} inflige ${damage} de daño a ${targetTemplate.name}${critical ? ' · ¡crítico!' : ''}.`);
    if (defeated)
        log = [...log, { id: log.length + 1, kind: 'KO', text: `${targetTemplate.name} se desmaterializa.` }];
    if (winner)
        log = [...log, { id: log.length + 1, kind: 'SYSTEM', text: `${winner === 'P1' ? 'Equipo azur' : 'Equipo carmesí'} controla la mesa.` }];
    const resolved = {
        ...state,
        creatures: survivors,
        winner,
        log,
        rngSeed: random.seed
    };
    return {
        state: winner ? resolved : finishTurn(resolved),
        damage, roll, defeated
    };
};
export const applyAction = (state, action) => {
    if (action.type === 'MOVE')
        return moveCreature(state, action.creatureId, action.target);
    return attackCreature(state, action.creatureId, action.targetId).state;
};
const allActions = (state, player) => {
    if (state.currentPlayer !== player)
        return [];
    const actions = [];
    for (const creature of state.creatures.filter((item) => item.owner === player)) {
        for (const target of legalTargets(state, creature.instanceId)) {
            actions.push({ type: 'ATTACK', creatureId: creature.instanceId, targetId: target.instanceId });
        }
        for (const target of legalMoves(state, creature.instanceId)) {
            actions.push({ type: 'MOVE', creatureId: creature.instanceId, target });
        }
    }
    return actions;
};
const actionScore = (state, action) => {
    if (action.type === 'ATTACK') {
        const attacker = getCreature(state, action.creatureId);
        const target = getCreature(state, action.targetId);
        const attack = creatureById(attacker.templateId).stats.attack;
        const defense = creatureById(target.templateId).stats.defense;
        const expected = Math.max(1, attack - Math.floor(defense / 2) + 0.5);
        return (expected >= target.hp ? 1000 : 100) + expected * 8 - target.hp;
    }
    const mover = getCreature(state, action.creatureId);
    const enemies = state.creatures.filter((item) => item.owner !== mover.owner);
    const before = Math.min(...enemies.map((item) => shortestDistance(mover.position, item.position)));
    const after = Math.min(...enemies.map((item) => shortestDistance(action.target, item.position)));
    return (before - after) * 10 + (action.target === 'C' ? 3 : 0);
};
export const chooseAiAction = (state) => {
    const actions = allActions(state, 'P2');
    if (!actions.length)
        throw new Error('La IA no dispone de acciones.');
    const random = nextRandom(state.rngSeed);
    if (state.difficulty === 'EASY')
        return actions[Math.floor(random.value * actions.length)] ?? actions[0];
    return [...actions].sort((a, b) => actionScore(state, b) - actionScore(state, a))[0];
};
