let hasWon = false;
const slider = document.getElementById('loveSlider');
const sound = document.getElementById('achievementSound');
const startScreen = document.getElementById('start-screen');
const startBtn = document.getElementById('start-btn');
const gif = document.getElementById('achievement-gif'); 
const gameBox = document.getElementById('game-box');
const statusText = document.getElementById('status-text');
const traveler = document.getElementById('traveler');
const routePath = document.getElementById('route-path'); // La línea SVG

// --- 1. INICIO ---
startBtn.addEventListener('click', () => {
    sound.volume = 0; 
    sound.play().then(() => {
        sound.pause();
        sound.currentTime = 0;
    }).catch(e => console.log("Error unlock:", e));
    startScreen.classList.add('hidden');
    // Actualizar posición inicial
    moveMonkyAlongPath(0);
});

// --- 2. EL MOTOR DEL JUEGO (MOVIMIENTO Y CURVAS) ---
slider.addEventListener('touchend', slideBack);
slider.addEventListener('mouseup', slideBack);
slider.addEventListener('input', checkGameLoop);

// Esta función se ejecuta todo el tiempo mientras mueves el dedo
function checkGameLoop() {
    if (hasWon) { 
        slider.value = 100; // Si ganó, se queda al final
        return; 
    }

    let val = parseInt(slider.value);
    
    // 1. MOVER AL MONITO POR LA CURVA
    moveMonkyAlongPath(val);

    // 2. DETECTAR BOMBAS
    // Zonas de peligro (aproximadas a donde están visualmente)
    let hitBomb = (val > 20 && val < 26) || (val > 48 && val < 54) || (val > 76 && val < 82);

    if (hitBomb) {
        gameBox.classList.add('shake'); 
        statusText.innerText = "¡BOMBA! 💥 ¡Cuidado!";
        statusText.style.color = "red";
    } else {
        gameBox.classList.remove('shake');
        statusText.innerText = "¡Sigue el camino!";
        statusText.style.color = "#ad1457";
    }

    updateKmText(val);

    // 3. CHECK DE VICTORIA
    if (val >= 99) {
        winGame();
    }
}

// --- FUNCIÓN MATEMÁTICA PARA SEGUIR EL CAMINO ---
function moveMonkyAlongPath(percentage) {
    // Obtenemos el largo total de la línea dibujada
    const pathLength = routePath.getTotalLength();
    
    // Calculamos en qué punto exacto estamos según el slider (0 a 100)
    const movePoint = pathLength * (percentage / 100);
    
    // Obtenemos las coordenadas X e Y de ese punto
    const pos = routePath.getPointAtLength(movePoint);

    // Movemos al monito a esas coordenadas
    // Restamos un poco (40px) para centrar la imagen sobre la línea
    traveler.style.left = (pos.x - 40) + 'px'; 
    traveler.style.top = (pos.y - 40) + 'px';
}

// --- DIFICULTAD (RETROCESO) ---
function slideBack() {
    if (hasWon) return;
    let currentValue = parseInt(slider.value);
    
    if (currentValue < 99) {
        
        // Bombas hacen retroceder más rápido
        let hitBomb = (currentValue > 20 && currentValue < 26) || 
                      (currentValue > 48 && currentValue < 54) || 
                      (currentValue > 76 && currentValue < 82);
        
        let speed = hitBomb ? 5 : 15; 
        let pushBack = hitBomb ? 5 : 1; // Un poco más difícil

        let interval = setInterval(() => {
            if (hasWon) { clearInterval(interval); return; }
            
            // Bajamos valor
            let newVal = parseInt(slider.value) - pushBack;
            slider.value = newVal;
            
            // Actualizamos visualmente al monito mientras retrocede
            moveMonkyAlongPath(newVal); 
            updateKmText(newVal);
            
            if (slider.value <= 0) { 
                clearInterval(interval); 
                gameBox.classList.remove('shake'); 
                statusText.innerText = "¡Vamos de nuevo!";
                statusText.style.color = "#ad1457";
            }
        }, speed);
    }
}

function updateKmText(val) {
    const kmText = document.getElementById('kmText');
    let maxKm = 3000;
    let currentKm = Math.round(maxKm - (maxKm * (val / 100)));
    if (!hasWon) { kmText.innerText = currentKm + " km restantes"; }
}

// --- VICTORIA ---
function winGame() {
    hasWon = true; 
    
    gameBox.classList.remove('shake');
    statusText.innerText = "¡Llegaste! 🎉";

    // Sonido
    sound.volume = 1.0; 
    sound.currentTime = 0;
    sound.play().catch(e => console.log("Error final:", e));

    // Gif
    gif.style.display = 'block';
    const currentSrc = gif.src;
    gif.src = ''; 
    gif.src = currentSrc;

    // Visuales
    const kmText = document.getElementById('kmText');
    const goalMonky = document.getElementById('goalMonky');
    const hugSticker = document.getElementById('hugSticker');
    const letter = document.getElementById('hidden-letter');
    const body = document.querySelector('body');

    kmText.innerText = "¡Juntas! ❤️";
    body.style.backgroundColor = "#ffcdd2"; 
    
    // Ocultamos monito viajero y meta, mostramos abrazo
    traveler.style.opacity = '0'; 
    goalMonky.classList.add('opacity-0');
    hugSticker.classList.add('show');
    
    // Desactivar slider
    slider.disabled = true;

    if (!letter.classList.contains('show')) {
        letter.classList.add('show');
        var defaults = { spread: 360, ticks: 50, gravity: 0, decay: 0.94, startVelocity: 30, colors: ['#d81b60', '#f06292', '#ffffff'] };
        confetti({ ...defaults, particleCount: 100, scalar: 1.2, shapes: ['heart'] });
    }

    setTimeout(() => { 
        gif.style.display = 'none'; 
    }, 9950);
                       }
