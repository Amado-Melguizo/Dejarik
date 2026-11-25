import type { BoardPosition, PositionId } from './types.js';

const point = (radius: number, index: number): { x: number; y: number } => {
  const angle = ((index * 30) - 90) * Math.PI / 180;
  return { x: 300 + Math.cos(angle) * radius, y: 300 + Math.sin(angle) * radius };
};

const outer: BoardPosition[] = Array.from({ length: 12 }, (_, index) => {
  const coords = point(232, index);
  return {
    id: `O${index}` as PositionId,
    ...coords,
    ring: 'outer' as const,
    neighbours: [
      `O${(index + 11) % 12}` as PositionId,
      `O${(index + 1) % 12}` as PositionId,
      `I${index}` as PositionId
    ]
  };
});

const inner: BoardPosition[] = Array.from({ length: 12 }, (_, index) => {
  const coords = point(126, index);
  return {
    id: `I${index}` as PositionId,
    ...coords,
    ring: 'inner' as const,
    neighbours: [
      `I${(index + 11) % 12}` as PositionId,
      `I${(index + 1) % 12}` as PositionId,
      `O${index}` as PositionId,
      'C' as PositionId
    ]
  };
});

const center: BoardPosition = {
  id: 'C', x: 300, y: 300, ring: 'center',
  neighbours: Array.from({ length: 12 }, (_, index) => `I${index}` as PositionId)
};

export const BOARD: readonly BoardPosition[] = [...outer, ...inner, center];
export const positionById = (id: PositionId): BoardPosition => {
  const position = BOARD.find((item) => item.id === id);
  if (!position) throw new Error(`Posición desconocida: ${id}`);
  return position;
};

export const shortestDistance = (from: PositionId, to: PositionId): number => {
  if (from === to) return 0;
  const visited = new Set<PositionId>([from]);
  let frontier: PositionId[] = [from];
  let distance = 0;
  while (frontier.length) {
    distance += 1;
    const next: PositionId[] = [];
    for (const current of frontier) {
      for (const neighbour of positionById(current).neighbours) {
        if (neighbour === to) return distance;
        if (!visited.has(neighbour)) {
          visited.add(neighbour);
          next.push(neighbour);
        }
      }
    }
    frontier = next;
  }
  return Number.POSITIVE_INFINITY;
};

export const reachablePositions = (
  from: PositionId,
  movement: number,
  occupied: ReadonlySet<PositionId>
): readonly PositionId[] => {
  const visited = new Set<PositionId>([from]);
  let frontier: PositionId[] = [from];
  const result: PositionId[] = [];
  for (let step = 0; step < movement; step += 1) {
    const next: PositionId[] = [];
    for (const current of frontier) {
      for (const neighbour of positionById(current).neighbours) {
        if (visited.has(neighbour) || occupied.has(neighbour)) continue;
        visited.add(neighbour);
        next.push(neighbour);
        result.push(neighbour);
      }
    }
    frontier = next;
  }
  return result;
};
