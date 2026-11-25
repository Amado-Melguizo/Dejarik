export const CREATURES = [
    {
        id: 'savrip', name: 'Mantellian Savrip', title: 'El coloso', sigil: 'SV', role: 'Tanque',
        ability: 'Golpe brutal', stats: { maxHp: 13, attack: 7, defense: 6, movement: 2, range: 1 }
    },
    {
        id: 'monnok', name: 'Monnok', title: 'El cazador', sigil: 'MN', role: 'Asalto',
        ability: 'Barrido', stats: { maxHp: 10, attack: 7, defense: 4, movement: 3, range: 1 }
    },
    {
        id: 'ghhhk', name: 'Ghhhk', title: 'La muralla', sigil: 'GH', role: 'Defensa',
        ability: 'Piel pétrea', stats: { maxHp: 12, attack: 5, defense: 7, movement: 2, range: 1 }
    },
    {
        id: 'houjix', name: 'Houjix', title: 'El guardián', sigil: 'HX', role: 'Control',
        ability: 'Contraataque', stats: { maxHp: 11, attack: 5, defense: 6, movement: 3, range: 1 }
    },
    {
        id: 'kintan', name: 'Kintan Strider', title: 'La vanguardia', sigil: 'KS', role: 'Movilidad',
        ability: 'Embestida', stats: { maxHp: 9, attack: 6, defense: 4, movement: 4, range: 1 }
    },
    {
        id: 'ngok', name: "Ng'ok", title: 'El acechante', sigil: 'NG', role: 'Tirador',
        ability: 'Púa a distancia', stats: { maxHp: 8, attack: 6, defense: 3, movement: 3, range: 3 }
    },
    {
        id: 'klor', name: "K'lor'slug", title: 'La amenaza', sigil: 'KL', role: 'Hostigador',
        ability: 'Veneno', stats: { maxHp: 9, attack: 6, defense: 4, movement: 3, range: 2 }
    },
    {
        id: 'molator', name: 'Grimtaash Molator', title: 'El verdugo', sigil: 'GM', role: 'Artillería',
        ability: 'Rugido sísmico', stats: { maxHp: 10, attack: 8, defense: 3, movement: 2, range: 2 }
    }
];
export const creatureById = (id) => {
    const template = CREATURES.find((creature) => creature.id === id);
    if (!template)
        throw new Error(`Criatura desconocida: ${id}`);
    return template;
};
