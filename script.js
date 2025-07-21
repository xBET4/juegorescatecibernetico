const tablero = document.getElementById('tablero');
const mensaje = document.getElementById('mensaje');
const turnosDisplay = document.getElementById('turnos');
const preguntaVF = document.getElementById('preguntaVF');
const textoPregunta = document.getElementById('textoPregunta');
const intentosRestantesSpan = document.getElementById('intentosRestantes');
const resultadoDado = document.getElementById('resultadoDado');
const modalFinal = document.getElementById('modalFinal');
const mensajeFinal = document.getElementById('mensajeFinal');

const size = 8;// tablero 8x8
let turnos = 40;
let ayudaUsada = false;
let agente = { x: 0, y: 0 };

const MAX_INTENTOS = 3;
let intentosActuales = MAX_INTENTOS;

const mapa = Array.from({ length: size }, () => Array(size).fill('libre'));

const preguntasVF = [
  { pregunta: 'El código binario está compuesto solo por ceros y unos.', respuesta: true },
  { pregunta: 'Un firewall permite automáticamente todo el tráfico entrante.', respuesta: false },
  { pregunta: 'JavaScript es un lenguaje de programación que corre en el navegador.', respuesta: true },
  { pregunta: 'Los virus informáticos solo afectan a los humanos.', respuesta: false },
  { pregunta: 'Un firewall puede bloquear ataques de hackers.', respuesta: true },
  { pregunta: 'La seguridad cibernética solo depende del antivirus.', respuesta: false },
  { pregunta: 'HTTPS es un protocolo seguro para la web.', respuesta: true },
  { pregunta: 'Phishing es una técnica para obtener información confidencial.', respuesta: true },
  { pregunta: 'Las contraseñas largas y complejas son menos seguras.', respuesta: false },
  { pregunta: 'El software de código abierto es siempre inseguro.', respuesta: false },
  { pregunta: 'Las actualizaciones de software mejoran la seguridad.', respuesta: true },
  { pregunta: 'El malware solo se propaga por correo electrónico.', respuesta: false },
  { pregunta: 'Un hacker siempre actúa con permiso.', respuesta: false },
  { pregunta: 'El cifrado protege la información durante la transmisión.', respuesta: true },
  { pregunta: 'El antivirus puede eliminar todo tipo de malware.', respuesta: false },
  { pregunta: 'Las redes WiFi públicas son siempre seguras.', respuesta: false },
  { pregunta: 'Una contraseña segura debe tener letras, números y símbolos.', respuesta: true },
  { pregunta: 'El phishing es un intento de engañar para obtener datos personales.', respuesta: true },
  { pregunta: 'Actualizar el software puede mejorar la seguridad.', respuesta: true },
  { pregunta: 'Los ataques de fuerza bruta son intentos de adivinar contraseñas.', respuesta: true },
  { pregunta: 'El correo electrónico es la única forma de propagar malware.', respuesta: false },
  { pregunta: 'La autenticación de dos factores aumenta la seguridad.', respuesta: true },

];

let esperaRespuestaVF = false;
let destinoProximo = null;

function colocarElementos(tipo, cantidad) {
  let colocados = 0;
  while (colocados < cantidad) {
    const x = Math.floor(Math.random() * size);
    const y = Math.floor(Math.random() * size);
    // No colocar en inicio o final
    if ((x !== 0 || y !== 0) && (x !== size-1 || y !== size-1) && mapa[y][x] === 'libre') {
      mapa[y][x] = tipo;
      colocados++;
    }
  }
}

function inicializarMapa() {
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      mapa[y][x] = 'libre';
    }
  }
  colocarElementos('firewall', 30);
  colocarElementos('ayuda', 10);
}

inicializarMapa();

function renderizarTablero() {
  tablero.innerHTML = '';
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const casilla = document.createElement('div');
      casilla.classList.add('casilla');

      if (x === agente.x && y === agente.y) {
        casilla.classList.add('agente');
        casilla.textContent = '🕵️';
      } else if (x === 0 && y === 0) {
        casilla.classList.add('inicio');
        casilla.textContent = 'Inicio';
      } else if (x === size-1 && y === size-1) {
        casilla.classList.add('final');
        casilla.textContent = 'Final';
      } else {
        switch(mapa[y][x]) {
          case 'firewall':
            casilla.classList.add('firewall');
            casilla.textContent = '🔒';
            break;
          case 'ayuda':
            casilla.classList.add('ayuda');
            casilla.textContent = '💡';
            break;
          // Aquí es donde tienes que añadir el nuevo caso:
          case 'superado':
            casilla.classList.add('superado');
            casilla.textContent = '❌';
            break;
          default:
            casilla.classList.add('libre');
            casilla.textContent = '';
            break;
        }
      }
      tablero.appendChild(casilla);
    }
  }
}


function obtenerPreguntaVF() {
  const index = Math.floor(Math.random() * preguntasVF.length);
  return preguntasVF[index];
}

function mostrarPreguntaVF() {
  const pregunta = obtenerPreguntaVF();
  textoPregunta.textContent = pregunta.pregunta;
  esperaRespuestaVF = true;
  intentosActuales = MAX_INTENTOS;
  intentosRestantesSpan.textContent = intentosActuales;
  preguntaVF.dataset.respuestaCorrecta = pregunta.respuesta;
  preguntaVF.classList.remove('oculto');
  deshabilitarControles(true);
}

function mover(direccion) {
  if (turnos <= 0 || esperaRespuestaVF) return;

  let nuevaX = agente.x;
  let nuevaY = agente.y;
  if (direccion === 'arriba') nuevaY--;
  if (direccion === 'abajo') nuevaY++;
  if (direccion === 'izquierda') nuevaX--;
  if (direccion === 'derecha') nuevaX++;

  if (nuevaX < 0 || nuevaX >= size || nuevaY < 0 || nuevaY >= size) return;

  const destino = mapa[nuevaY][nuevaX];
  if (destino === 'firewall') {
    destinoProximo = { x: nuevaX, y: nuevaY };
    mostrarPreguntaVF();
  } else if (destino === 'ayuda' && !ayudaUsada) {
    mensaje.textContent = '🧠 ¡Ayuda obtenida! Se elimina un firewall cercano.';
    ayudaUsada = true;
    eliminarFirewallCercano(nuevaX, nuevaY);
    actualizarEstadoMovimiento(nuevaX, nuevaY);
  } else {
    actualizarEstadoMovimiento(nuevaX, nuevaY);
  }
}

function actualizarEstadoMovimiento(nuevaX, nuevaY) {
  agente.x = nuevaX;
  agente.y = nuevaY;
  turnos--;
  actualizarTurnos();
  mensaje.textContent = '';

  if (agente.x === size - 1 && agente.y === size - 1) {
    mostrarFinal('🎉 ¡Misión cumplida! Has rescatado al agente.', true);
  } else if (turnos <= 0) {
    mostrarFinal('💀 ¡Juego terminado! El agente quedó atrapado.');
  }
  renderizarTablero();
}

function responderVF(respuestaUsuario) {
  if (!esperaRespuestaVF) return;
  const correcto = preguntaVF.dataset.respuestaCorrecta === 'true';

if (respuestaUsuario === correcto) {
  mensaje.textContent = '✅ ¡Respuesta correcta! Firewall superado.';

  // Cambiar el estado del firewall a 'superado' para esa casilla
  mapa[destinoProximo.y][destinoProximo.x] = 'superado';

  actualizarEstadoMovimiento(destinoProximo.x, destinoProximo.y);

  esperaRespuestaVF = false;
  destinoProximo = null;
  preguntaVF.classList.add('oculto');
  deshabilitarControles(false);
}

  else {
    intentosActuales--;
    if (intentosActuales > 0) {
      mensaje.textContent = `❌ Respuesta incorrecta. Te quedan ${intentosActuales} intento(s).`;
      intentosRestantesSpan.textContent = intentosActuales;
    } else {
      mensaje.textContent = '❌ Respuesta incorrecta. Pierdes un turno adicional.';
      turnos -= 2;
      actualizarTurnos();
      esperaRespuestaVF = false;
      destinoProximo = null;
      preguntaVF.classList.add('oculto');
      deshabilitarControles(false);
      if (turnos <= 0) {
        mostrarFinal('💀 ¡Juego terminado! El agente quedó atrapado.');
      }
    }
  }
}

function eliminarFirewallCercano(x, y) {
  const direcciones = [
    [0, -1],
    [0, 1],
    [-1, 0],
    [1, 0],
  ];
  for (const [dx, dy] of direcciones) {
    const nx = x + dx;
    const ny = y + dy;
    if (nx >= 0 && ny >= 0 && nx < size && ny < size) {
      if (mapa[ny][nx] === 'firewall') {
        mapa[ny][nx] = 'libre';
        return;
      }
    }
  }
}

let movimientosPendientes = 0;

function deshabilitarControles(deshabilitar) {
  const botones = document.querySelectorAll('.controles button');
  botones.forEach(b => (b.disabled = deshabilitar));
}

function moverConDado(direccion) {
  if (turnos <= 0 || esperaRespuestaVF || movimientosPendientes <= 0) return;

  mover(direccion);
  movimientosPendientes--;

  if (movimientosPendientes <= 0) {
    mensaje.textContent += ' Ya no tienes movimientos pendientes.';
    deshabilitarControles(false);
  } else {
    mensaje.textContent += ` Te quedan ${movimientosPendientes} movimiento(s) pendientes.`;
  }
}

function lanzarDado() {
  if (turnos <= 0 || esperaRespuestaVF) {
    mensaje.textContent = 'No puedes lanzar el dado ahora.';
    return;
  }

  if (movimientosPendientes > 0) {
    mensaje.textContent = `Aún tienes ${movimientosPendientes} movimiento(s) pendiente(s). Usa esos primero.`;
    return;
  }
  
  deshabilitarControles(true);
  resultadoDado.textContent = '🎲 Lanzando dado...';

  setTimeout(() => {
    const resultado = Math.floor(Math.random() * 6) + 1;
    movimientosPendientes += resultado;
    resultadoDado.textContent = `Resultado del dado: ${resultado}`;
    mensaje.textContent = `🎲 Lanzaste un dado y salió ${resultado}. Puedes mover ${movimientosPendientes} veces.`;
    deshabilitarControles(false);
  }, 1000);
}

function mostrarFinal(mensaje, ganador = false) {
  mensajeFinal.textContent = mensaje;
  modalFinal.classList.remove('oculto');
  deshabilitarControles(true);
  esperaRespuestaVF = true;
  if (ganador) {
    // Aquí puedes agregar efectos de victoria si quieres
  }
}

function reiniciarJuego() {
  turnos = 10;
  ayudaUsada = false;
  agente = { x: 0, y: 0 };
  movimientosPendientes = 0;
  esperaRespuestaVF = false;
  destinoProximo = null;
  modalFinal.classList.add('oculto');
  mensaje.textContent = '';
  resultadoDado.textContent = 'Resultado del dado: -';
  preguntaVF.classList.add('oculto');
  
  inicializarMapa();
  actualizarTurnos();
  deshabilitarControles(false);
  renderizarTablero();
}

renderizarTablero();

document.querySelectorAll('.controles button').forEach(button => {
  button.onclick = () => {
    const direccion = button.getAttribute('data-dir');
    if (movimientosPendientes > 0) {
      moverConDado(direccion);
    } else {
      mover(direccion);
    }
  };
});

function actualizarTurnos() {
  turnosDisplay.textContent = `Turnos restantes: ${turnos}`;
}

function copiarEnlace() {
  const enlaceInput = document.getElementById('enlaceJuego');
  enlaceInput.select();
  enlaceInput.setSelectionRange(0, 99999);
  document.execCommand('copy');
  alert('¡Enlace copiado! Comparte el juego con tus amigos.');
}
