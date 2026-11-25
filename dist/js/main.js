import { HoloAudio } from './audio.js';
import { BOARD, positionById } from './board.js';
import { CREATURES, creatureById } from './data.js';
import { applyAction, attackCreature, chooseAiAction, createGame, getCreature, legalMoves, legalTargets, moveCreature } from './engine.js';
const app = document.querySelector('#app');
const toast = document.querySelector('#toast');
const soundButton = document.querySelector('#sound-toggle');
if (!app || !toast || !soundButton)
    throw new Error('No se pudo inicializar la interfaz.');
const audio = new HoloAudio();
let selectedTeam = new Set(CREATURES.slice(0, 4).map((item) => item.id));
let mode = 'AI';
let difficulty = 'NORMAL';
let game = null;
let selectedCreature = null;
let interactionLocked = false;
let toastTimer = 0;
const playerName = (player) => player === 'P1' ? 'Equipo azur' : 'Equipo carmesí';
const setScreen = (hash) => {
    history.replaceState(null, '', hash);
    app.focus({ preventScroll: true });
};
const showToast = (message, kind = 'neutral') => {
    window.clearTimeout(toastTimer);
    toast.textContent = message;
    toast.className = `toast is-visible ${kind}`;
    toastTimer = window.setTimeout(() => { toast.className = 'toast'; }, 2100);
};
const statPips = (value, max = 8) => {
    const filled = Math.min(max, value);
    return `<span class="pips" aria-label="${value}">${'<i></i>'.repeat(filled)}${'<i class="off"></i>'.repeat(max - filled)}</span>`;
};
const renderHome = () => {
    setScreen('#inicio');
    app.innerHTML = `
    <section class="hero screen-shell">
      <div class="hero-copy">
        <p class="eyebrow">SISTEMA DE ENTRENAMIENTO · MESA 01</p>
        <h1>Domina el círculo.<br><em>Anticipa el combate.</em></h1>
        <p class="hero-lead">Un duelo táctico por turnos sobre una mesa holográfica de 25 nodos. Elige cuatro criaturas, controla el centro y desmaterializa al equipo rival.</p>
        <div class="hero-actions">
          <button id="new-game" class="primary-button" type="button"><span>NUEVA PARTIDA</span><b>→</b></button>
          <button id="how-to" class="text-button" type="button">Cómo se juega</button>
        </div>
        <div class="feature-strip" aria-label="Características de la demo">
          <span><b>25</b> nodos</span><span><b>8</b> criaturas</span><span><b>2</b> modos</span><span><b>1</b> acción/turno</span>
        </div>
      </div>
      <div class="hero-table" aria-hidden="true">
        <div class="holo-cone"></div><div class="mini-board">
          ${Array.from({ length: 12 }, (_, i) => `<i style="--i:${i}"></i>`).join('')}
          <span class="mini-core"></span><span class="mini-piece p1">SV</span><span class="mini-piece p2">GM</span>
        </div>
        <div class="table-base"><span></span></div>
        <p>HOLO TABLE ONLINE</p>
      </div>
    </section>
    <section id="rules" class="rules-panel screen-shell" hidden>
      <article><span>01</span><h3>Selecciona</h3><p>Haz clic en una criatura azur. Verás sus movimientos y objetivos legales.</p></article>
      <article><span>02</span><h3>Actúa</h3><p>Mueve a un nodo iluminado o ataca una criatura carmesí dentro de tu alcance.</p></article>
      <article><span>03</span><h3>Vence</h3><p>Cada acción termina el turno. Elimina las cuatro criaturas del rival.</p></article>
    </section>`;
    document.querySelector('#new-game')?.addEventListener('click', renderSetup);
    document.querySelector('#how-to')?.addEventListener('click', () => {
        const rules = document.querySelector('#rules');
        if (rules) {
            rules.hidden = !rules.hidden;
            rules.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    });
};
const renderSetup = () => {
    setScreen('#configurar');
    const chosen = selectedTeam.size;
    app.innerHTML = `
    <section class="setup screen-shell">
      <button id="back-home" class="back-button" type="button">← Volver</button>
      <header class="section-heading"><p class="eyebrow">CONFIGURACIÓN DE ESCARAMUZA</p><h1>Prepara tu proyección</h1><p>Elige exactamente cuatro combatientes. El equipo rival utilizará los cuatro restantes.</p></header>
      <div class="setup-grid">
        <section class="setup-options holo-panel">
          <div class="step-title"><span>01</span><div><h2>Modo de juego</h2><p>¿Quién controlará el equipo carmesí?</p></div></div>
          <div class="segmented" role="radiogroup" aria-label="Modo de juego">
            <button data-mode="AI" class="${mode === 'AI' ? 'active' : ''}" role="radio" aria-checked="${mode === 'AI'}"><b>VS IA</b><small>Duelo contra el sistema</small></button>
            <button data-mode="LOCAL" class="${mode === 'LOCAL' ? 'active' : ''}" role="radio" aria-checked="${mode === 'LOCAL'}"><b>VS LOCAL</b><small>Dos jugadores, un dispositivo</small></button>
          </div>
          <div class="difficulty ${mode === 'LOCAL' ? 'is-disabled' : ''}">
            <label>Dificultad de IA</label>
            <div class="chip-row"><button data-difficulty="EASY" class="${difficulty === 'EASY' ? 'active' : ''}">Iniciación</button><button data-difficulty="NORMAL" class="${difficulty === 'NORMAL' ? 'active' : ''}">Táctica</button></div>
          </div>
          <aside class="prototype-note"><b>PROTOCOLO 0.1</b><p>Los atributos ya gobiernan movimiento, alcance, daño y defensa. Las habilidades especiales se activarán en la siguiente iteración.</p></aside>
        </section>
        <section class="roster-section">
          <div class="step-title"><span>02</span><div><h2>Escuadrón azur</h2><p><strong id="pick-count">${chosen}/4</strong> criaturas seleccionadas</p></div></div>
          <div class="creature-grid">
            ${CREATURES.map((creature) => {
        const active = selectedTeam.has(creature.id);
        return `<button class="creature-card ${active ? 'selected' : ''}" data-creature="${creature.id}" type="button" aria-pressed="${active}">
                <span class="selection-mark">${active ? '✓' : '+'}</span>
                <span class="creature-sigil">${creature.sigil}</span>
                <span class="creature-meta"><small>${creature.role}</small><b>${creature.name}</b><em>${creature.title}</em></span>
                <span class="card-stats"><span>VID ${statPips(Math.ceil(creature.stats.maxHp / 2), 7)}</span><span>ATQ ${statPips(creature.stats.attack, 7)}</span><span>MOV <b>${creature.stats.movement}</b> · RNG <b>${creature.stats.range}</b></span></span>
              </button>`;
    }).join('')}
          </div>
        </section>
      </div>
      <footer class="setup-footer"><p><span class="team-dot azure"></span> Tu equipo <b>${chosen}</b><i>vs</i><span class="team-dot crimson"></span> Rival <b>${8 - chosen}</b></p><button id="launch-game" class="primary-button" type="button" ${chosen !== 4 ? 'disabled' : ''}><span>INICIAR PROYECCIÓN</span><b>→</b></button></footer>
    </section>`;
    document.querySelector('#back-home')?.addEventListener('click', renderHome);
    document.querySelectorAll('[data-mode]').forEach((button) => button.addEventListener('click', () => {
        mode = button.dataset['mode'];
        renderSetup();
    }));
    document.querySelectorAll('[data-difficulty]').forEach((button) => button.addEventListener('click', () => {
        if (mode === 'AI') {
            difficulty = button.dataset['difficulty'];
            renderSetup();
        }
    }));
    document.querySelectorAll('[data-creature]').forEach((button) => button.addEventListener('click', () => {
        const id = button.dataset['creature'];
        if (!id)
            return;
        if (selectedTeam.has(id))
            selectedTeam.delete(id);
        else if (selectedTeam.size < 4)
            selectedTeam.add(id);
        else {
            showToast('El escuadrón ya tiene cuatro criaturas.', 'danger');
            return;
        }
        audio.tone('select');
        renderSetup();
    }));
    document.querySelector('#launch-game')?.addEventListener('click', startGame);
};
const startGame = () => {
    const teamOne = [...selectedTeam];
    const teamTwo = CREATURES.map((item) => item.id).filter((id) => !selectedTeam.has(id));
    game = createGame(teamOne, teamTwo, mode, difficulty);
    selectedCreature = null;
    renderGame();
};
const renderBoard = (state) => {
    const selected = selectedCreature ? state.creatures.find((item) => item.instanceId === selectedCreature) : null;
    const moves = selected ? new Set(legalMoves(state, selected.instanceId)) : new Set();
    const targets = selected ? new Set(legalTargets(state, selected.instanceId).map((item) => item.instanceId)) : new Set();
    const edges = BOARD.flatMap((position) => position.neighbours
        .filter((id) => position.id.localeCompare(id) < 0)
        .map((id) => ({ a: position, b: positionById(id) })));
    return `<svg id="board" class="board-svg" viewBox="0 0 600 600" role="group" aria-label="Tablero circular de Dejarik">
    <defs><filter id="soft-glow"><feGaussianBlur stdDeviation="4" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter><radialGradient id="core"><stop offset="0" stop-color="#d7fbff" stop-opacity=".9"/><stop offset=".45" stop-color="#47d6f0" stop-opacity=".28"/><stop offset="1" stop-color="#47d6f0" stop-opacity="0"/></radialGradient></defs>
    <circle class="board-halo" cx="300" cy="300" r="282"/><circle class="board-ring" cx="300" cy="300" r="232"/><circle class="board-ring inner" cx="300" cy="300" r="126"/><circle class="core-glow" cx="300" cy="300" r="78" fill="url(#core)"/>
    <g class="board-edges">${edges.map(({ a, b }) => `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"/>`).join('')}</g>
    <g class="board-positions">${BOARD.map((position) => `<g class="node ${moves.has(position.id) ? 'legal' : ''}" data-position="${position.id}" tabindex="0" role="button" aria-label="Posición ${position.id}"><circle cx="${position.x}" cy="${position.y}" r="${position.ring === 'center' ? 24 : 13}"/><text x="${position.x}" y="${position.y + 4}">${position.id}</text></g>`).join('')}</g>
    <g class="pieces">${state.creatures.map((creature) => {
        const position = positionById(creature.position);
        const template = creatureById(creature.templateId);
        const maxHp = template.stats.maxHp;
        const isSelected = selectedCreature === creature.instanceId;
        const isTarget = targets.has(creature.instanceId);
        return `<g class="piece ${creature.owner === 'P1' ? 'azure-piece' : 'crimson-piece'} ${isSelected ? 'selected' : ''} ${isTarget ? 'targetable' : ''}" data-piece="${creature.instanceId}" transform="translate(${position.x} ${position.y})" tabindex="0" role="button" aria-label="${template.name}, ${creature.hp} de ${maxHp} de vida">
        <circle class="piece-aura" r="27"/><circle class="piece-body" r="20"/><text class="piece-label" y="5">${template.sigil}</text><rect class="hp-track" x="-21" y="25" width="42" height="4" rx="2"/><rect class="hp-value" x="-21" y="25" width="${42 * creature.hp / maxHp}" height="4" rx="2"/>
      </g>`;
    }).join('')}</g>
  </svg>`;
};
const rosterHtml = (state, player) => state.creatures.filter((item) => item.owner === player).map((item) => {
    const template = creatureById(item.templateId);
    const active = item.instanceId === selectedCreature;
    return `<button class="roster-unit ${active ? 'active' : ''}" data-roster-piece="${item.instanceId}" ${state.currentPlayer !== player ? 'disabled' : ''}><span>${template.sigil}</span><b>${template.name}</b><i><em style="width:${item.hp / template.stats.maxHp * 100}%"></em></i><small>${item.hp}/${template.stats.maxHp}</small></button>`;
}).join('') || '<p class="eliminated">Sin proyecciones</p>';
const renderGame = () => {
    if (!game)
        return;
    setScreen('#partida');
    const state = game;
    if (selectedCreature) {
        const selected = state.creatures.find((item) => item.instanceId === selectedCreature);
        if (!selected || selected.owner !== state.currentPlayer)
            selectedCreature = null;
    }
    const selected = selectedCreature ? getCreature(state, selectedCreature) : null;
    const template = selected ? creatureById(selected.templateId) : null;
    const humanCanAct = !interactionLocked && !(state.mode === 'AI' && state.currentPlayer === 'P2') && !state.winner;
    app.innerHTML = `
    <section class="game-layout">
      <aside class="game-sidebar left-sidebar">
        <button id="exit-game" class="back-button" type="button">← Abandonar</button>
        <div class="turn-card ${state.currentPlayer === 'P1' ? 'azure-turn' : 'crimson-turn'}"><small>TURNO ${state.turn}</small><span></span><h2>${playerName(state.currentPlayer)}</h2><p>${state.mode === 'AI' && state.currentPlayer === 'P2' ? 'Calculando maniobra…' : 'Selecciona una criatura'}</p></div>
        <div class="roster"><header><span class="team-dot azure"></span><b>Equipo azur</b><small>${state.creatures.filter((item) => item.owner === 'P1').length}/4</small></header>${rosterHtml(state, 'P1')}</div>
        <div class="roster"><header><span class="team-dot crimson"></span><b>Equipo carmesí</b><small>${state.creatures.filter((item) => item.owner === 'P2').length}/4</small></header>${rosterHtml(state, 'P2')}</div>
      </aside>
      <section class="table-stage">
        <div class="stage-heading"><span>SECTOR 7 · MESA ACTIVA</span><b>${state.mode === 'AI' ? `VS IA · ${state.difficulty === 'EASY' ? 'INICIACIÓN' : 'TÁCTICA'}` : 'DUELO LOCAL'}</b></div>
        <div class="board-wrap ${interactionLocked ? 'is-thinking' : ''}">${renderBoard(state)}<div class="scanline"></div></div>
        <div class="action-hint">${selected && template ? `<span class="selected-sigil">${template.sigil}</span><p><b>${template.name}</b><small>Haz clic en un nodo cian para mover o en un rival marcado para atacar.</small></p><div><span>MOV <b>${template.stats.movement}</b></span><span>RNG <b>${template.stats.range}</b></span><span>ATQ <b>${template.stats.attack}</b></span></div>` : `<span class="pulse-dot"></span><p><b>${humanCanAct ? 'Esperando selección' : 'Mesa bloqueada'}</b><small>${humanCanAct ? 'Cada turno permite mover o atacar una vez.' : 'La IA está evaluando el tablero.'}</small></p>`}</div>
      </section>
      <aside class="game-sidebar right-sidebar">
        <div class="log-heading"><div><p class="eyebrow">REGISTRO TÁCTICO</p><h2>Últimas acciones</h2></div><span class="live-dot">EN VIVO</span></div>
        <ol class="combat-log">${[...state.log].reverse().slice(0, 8).map((entry) => `<li class="${entry.kind.toLowerCase()}"><span>${String(entry.id).padStart(2, '0')}</span><p>${entry.text}</p></li>`).join('')}</ol>
        <div class="legend"><h3>Lectura de mesa</h3><p><i class="legend-node legal"></i> Movimiento legal</p><p><i class="legend-node target"></i> Objetivo al alcance</p><p><i class="legend-node center"></i> Núcleo: acceso a los 12 nodos interiores</p></div>
      </aside>
    </section>
    ${state.winner ? `<div class="victory-overlay" role="dialog" aria-modal="true"><div class="victory-card"><p class="eyebrow">SIMULACIÓN COMPLETADA</p><div class="victory-emblem">${state.winner === 'P1' ? 'AZ' : 'CR'}</div><h1>${playerName(state.winner)} vence</h1><p>La formación rival ha sido desmaterializada en <b>${state.turn}</b> turnos.</p><div><button id="rematch" class="primary-button"><span>REVANCHA</span><b>↻</b></button><button id="victory-home" class="text-button">Volver al inicio</button></div></div></div>` : ''}`;
    bindGameEvents(humanCanAct);
    if (state.winner)
        audio.tone('victory');
};
const bindGameEvents = (canAct) => {
    document.querySelector('#exit-game')?.addEventListener('click', () => { game = null; renderHome(); });
    document.querySelector('#rematch')?.addEventListener('click', startGame);
    document.querySelector('#victory-home')?.addEventListener('click', renderHome);
    document.querySelectorAll('[data-piece], [data-roster-piece]').forEach((element) => {
        const activate = () => {
            const id = element.dataset['piece'] ?? element.dataset['rosterPiece'];
            if (id && canAct)
                handlePiece(id);
        };
        element.addEventListener('click', activate);
        element.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ')
            activate(); });
    });
    document.querySelectorAll('[data-position]').forEach((element) => {
        const activate = () => {
            const position = element.dataset['position'];
            if (position && canAct)
                handlePosition(position);
        };
        element.addEventListener('click', activate);
        element.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ')
            activate(); });
    });
};
const handlePiece = (instanceId) => {
    if (!game)
        return;
    const piece = getCreature(game, instanceId);
    if (piece.owner === game.currentPlayer) {
        selectedCreature = selectedCreature === instanceId ? null : instanceId;
        audio.tone('select');
        renderGame();
        return;
    }
    if (!selectedCreature) {
        showToast('Selecciona primero una criatura de tu equipo.');
        return;
    }
    if (!legalTargets(game, selectedCreature).some((item) => item.instanceId === instanceId)) {
        showToast('Objetivo fuera de alcance.', 'danger');
        return;
    }
    const result = attackCreature(game, selectedCreature, instanceId);
    game = result.state;
    selectedCreature = null;
    audio.tone('attack');
    showToast(`${result.damage} de daño${result.defeated ? ' · proyección eliminada' : ''}`, result.defeated ? 'success' : 'danger');
    renderGame();
    scheduleAi();
};
const handlePosition = (position) => {
    if (!game || !selectedCreature)
        return;
    if (!legalMoves(game, selectedCreature).includes(position))
        return;
    game = moveCreature(game, selectedCreature, position);
    selectedCreature = null;
    audio.tone('move');
    renderGame();
    scheduleAi();
};
const scheduleAi = () => {
    if (!game || game.mode !== 'AI' || game.currentPlayer !== 'P2' || game.winner)
        return;
    interactionLocked = true;
    renderGame();
    window.setTimeout(() => {
        if (!game || game.currentPlayer !== 'P2' || game.winner) {
            interactionLocked = false;
            return;
        }
        const action = chooseAiAction(game);
        game = applyAction(game, action);
        interactionLocked = false;
        audio.tone(action.type === 'ATTACK' ? 'attack' : 'move');
        if (action.type === 'ATTACK')
            showToast('La IA ha ejecutado un ataque.', 'danger');
        renderGame();
    }, 720);
};
soundButton.addEventListener('click', () => {
    const enabled = audio.toggle();
    soundButton.textContent = enabled ? '◖)))' : '◖×';
    soundButton.ariaLabel = enabled ? 'Desactivar sonido' : 'Activar sonido';
    if (enabled)
        audio.tone('select');
});
document.querySelector('.brand')?.addEventListener('click', (event) => { event.preventDefault(); game = null; renderHome(); });
renderHome();
