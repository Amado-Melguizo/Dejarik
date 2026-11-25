# Dejarik · Demo jugable 0.1

Vertical slice de un juego táctico por turnos sobre una mesa circular de 25 nodos. Esta versión valida el bucle principal antes de introducir cuentas, Firebase, multijugador online o renderizado 3D.

## Qué incluye

- Pantalla de inicio y guía breve.
- Selección de 4 criaturas entre 8 perfiles diferentes.
- Modo **1 vs IA** y **1 vs 1 local**.
- IA de iniciación (aleatoria) y táctica (prioriza bajas, daño y aproximación).
- Tablero circular modelado como grafo: 12 nodos exteriores, 12 interiores y centro.
- Movimiento por alcance, ocupación de nodos, ataque por distancia, defensa, daño híbrido y críticos.
- Vida, eliminación, cambio de turno, registro táctico y victoria.
- Interfaz responsive, navegación básica por teclado y sonidos sintetizados sin assets externos.
- Build estática compatible con GitHub Pages.

## Ejecutar la demo

El directorio `dist/` está compilado y listo para publicar.

```bash
python3 -m http.server 4173 -d dist
```

Después abre `http://localhost:4173`.

## Desarrollo

Requisitos: Node.js 22+ y TypeScript 6.

```bash
npm install
npm run build
npm test
npm run serve
```

## Reglas de esta versión

1. Cada equipo empieza con cuatro criaturas.
2. En su turno, un jugador puede **mover o atacar** con una criatura.
3. El movimiento se calcula sobre el grafo sin atravesar nodos ocupados.
4. Un ataque es legal si la distancia mínima es menor o igual que `RNG`.
5. Daño: `máx(1, ATQ - floor(DEF / 2) + variación + crítico)`.
6. Al llegar a 0 de vida, la proyección desaparece.
7. Gana el primer equipo que elimina las cuatro criaturas rivales.

Las habilidades aparecen como identidad de diseño, pero sus efectos activos se posponen a la Demo 0.2 para mantener acotada la primera validación.

## Arquitectura

El motor está separado del DOM:

- `src/engine.ts`: estado, reglas, combate e IA.
- `src/board.ts`: grafo, distancias y rutas.
- `src/data.ts`: contenido configurable de criaturas.
- `src/main.ts`: presentación e interacción.
- `src/audio.ts`: feedback sonoro sintetizado.

La capa de reglas es TypeScript puro y puede migrarse a un servicio Angular o a Cloud Functions sin reescribir la lógica. La presentación de esta entrega es deliberadamente estática y sin dependencias runtime para que la demo pueda abrirse, probarse y desplegarse ya; la integración en el shell Angular previsto por el HLD queda como siguiente refactor técnico.

## GitHub Pages

1. Sube el repositorio a GitHub.
2. En **Settings → Pages → Source**, elige **GitHub Actions**.
3. Haz push a `main`.
4. El workflow compila, ejecuta las pruebas y publica `dist/`.

## Alcance excluido

Firebase Auth/Firestore, persistencia, matchmaking online, habilidades activas, animaciones específicas por pareja, ranking, chat, amigos, 3D y assets licenciados.

## Propiedad intelectual

Prototipo personal no oficial. No incluye logotipos, música, imágenes ni modelos de terceros. Antes de una publicación pública debe revisarse el uso de nombres y cualquier material asociado a franquicias de terceros.
