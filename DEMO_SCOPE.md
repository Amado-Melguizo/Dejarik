# Demo 0.1 — alcance cerrado

## Objetivo
Validar en una sesión de 5–10 minutos si seleccionar, posicionar, atacar y eliminar criaturas produce un bucle táctico comprensible y entretenido.

## Flujo entregado
Inicio → nueva partida → modo/dificultad → equipo → tablero → mover/atacar → daño/eliminación → cambio de turno → victoria/revancha.

## Decisiones provisionales de reglas
- Una acción por turno.
- Equipos de cuatro; el rival recibe las cuatro criaturas no elegidas.
- Grafo de 25 posiciones.
- Combate híbrido con variación de -1 a +2 y bonificación crítica de +2.
- Sin línea de visión ni bloqueos de ataque en 0.1.
- El centro conecta con todos los nodos interiores para crear riesgo y movilidad.

## Criterios de aceptación
- No se puede mover una pieza rival ni mover a un nodo ocupado.
- Los objetivos fuera de alcance no reciben daño.
- Toda acción válida cambia el turno exactamente una vez.
- La IA siempre genera una acción legal.
- Las criaturas a 0 HP desaparecen.
- La partida termina al eliminar el último rival.
- La build no necesita servidor de aplicación ni servicios externos.

## Próxima iteración sugerida
Demo 0.2: shell Angular, habilidades activas, selección independiente del segundo equipo, animación de combate por arquetipo, ajuste de balance y persistencia local de preferencias.
