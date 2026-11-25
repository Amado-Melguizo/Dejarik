const point = (radius, index) => {
    const angle = ((index * 30) - 90) * Math.PI / 180;
    return { x: 300 + Math.cos(angle) * radius, y: 300 + Math.sin(angle) * radius };
};
const outer = Array.from({ length: 12 }, (_, index) => {
    const coords = point(232, index);
    return {
        id: `O${index}`,
        ...coords,
        ring: 'outer',
        neighbours: [
            `O${(index + 11) % 12}`,
            `O${(index + 1) % 12}`,
            `I${index}`
        ]
    };
});
const inner = Array.from({ length: 12 }, (_, index) => {
    const coords = point(126, index);
    return {
        id: `I${index}`,
        ...coords,
        ring: 'inner',
        neighbours: [
            `I${(index + 11) % 12}`,
            `I${(index + 1) % 12}`,
            `O${index}`,
            'C'
        ]
    };
});
const center = {
    id: 'C', x: 300, y: 300, ring: 'center',
    neighbours: Array.from({ length: 12 }, (_, index) => `I${index}`)
};
export const BOARD = [...outer, ...inner, center];
export const positionById = (id) => {
    const position = BOARD.find((item) => item.id === id);
    if (!position)
        throw new Error(`Posición desconocida: ${id}`);
    return position;
};
export const shortestDistance = (from, to) => {
    if (from === to)
        return 0;
    const visited = new Set([from]);
    let frontier = [from];
    let distance = 0;
    while (frontier.length) {
        distance += 1;
        const next = [];
        for (const current of frontier) {
            for (const neighbour of positionById(current).neighbours) {
                if (neighbour === to)
                    return distance;
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
export const reachablePositions = (from, movement, occupied) => {
    const visited = new Set([from]);
    let frontier = [from];
    const result = [];
    for (let step = 0; step < movement; step += 1) {
        const next = [];
        for (const current of frontier) {
            for (const neighbour of positionById(current).neighbours) {
                if (visited.has(neighbour) || occupied.has(neighbour))
                    continue;
                visited.add(neighbour);
                next.push(neighbour);
                result.push(neighbour);
            }
        }
        frontier = next;
    }
    return result;
};
