export type PlayerId = 'P1' | 'P2';
export type GameMode = 'AI' | 'LOCAL';
export type Difficulty = 'EASY' | 'NORMAL';
export type PositionId = `O${number}` | `I${number}` | 'C';

export interface Stats {
  readonly maxHp: number;
  readonly attack: number;
  readonly defense: number;
  readonly movement: number;
  readonly range: number;
}

export interface CreatureTemplate {
  readonly id: string;
  readonly name: string;
  readonly title: string;
  readonly sigil: string;
  readonly role: string;
  readonly ability: string;
  readonly stats: Stats;
}

export interface CreatureState {
  readonly instanceId: string;
  readonly templateId: string;
  readonly owner: PlayerId;
  readonly position: PositionId;
  readonly hp: number;
}

export interface BoardPosition {
  readonly id: PositionId;
  readonly x: number;
  readonly y: number;
  readonly ring: 'outer' | 'inner' | 'center';
  readonly neighbours: readonly PositionId[];
}

export interface LogEntry {
  readonly id: number;
  readonly kind: 'SYSTEM' | 'MOVE' | 'ATTACK' | 'KO';
  readonly text: string;
}

export interface GameState {
  readonly mode: GameMode;
  readonly difficulty: Difficulty;
  readonly currentPlayer: PlayerId;
  readonly turn: number;
  readonly creatures: readonly CreatureState[];
  readonly winner: PlayerId | null;
  readonly log: readonly LogEntry[];
  readonly rngSeed: number;
}

export interface AttackResult {
  readonly state: GameState;
  readonly damage: number;
  readonly roll: number;
  readonly defeated: boolean;
}

export interface MoveAction {
  readonly type: 'MOVE';
  readonly creatureId: string;
  readonly target: PositionId;
}

export interface AttackAction {
  readonly type: 'ATTACK';
  readonly creatureId: string;
  readonly targetId: string;
}

export type GameAction = MoveAction | AttackAction;
