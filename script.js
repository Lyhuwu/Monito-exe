let hasWon = false;
const slider = document.getElementById('loveSlider');
const sound = document.getElementById('achievementSound');
const startScreen = document.getElementById('start-screen');
const startBtn = document.getElementById('start-btn');
const gif = document.getElementById('achievement-gif'); 
const gameBox = document.getElementById('game-box');
const statusText = document.getElementById('status-text');
const traveler = document.getElementById('traveler');
const trackContainer = document.querySelector('.track-container');

// --- 1. INICIO ---
startBtn.addEventListener('click', () => {
    sound.volume = 0; 
    sound.play().then(() => {
        sound.pause();
        sound.currentTime = 0;
    }).catch(e => console.log("Error unlock:", e));
    startScreen.classList.add('hidden');
    // Mover monito al inicio
    updateMonkyPosition(0);
});

// --- 2. MOVIMIENTO MATEMÁTICO (CURVAS) ---
// Usamos listeners directos para máxima respuesta
slider.addEventListener('input', checkGameLoop);
slider.addEventListener('touchend', slideBack);
slider.addEventListener('mouseup', slideBack);

function checkGameLoop() {
    if (hasWon) { 
        slider.value = 100; 
        return; 
    }

    let val = parseInt(slider.value);
    
    // Mover visualmente
    updateMonkyPosition(val);

    // Detectar Bombas (Zonas: 20-30, 45-55, 70-80)
    let hitBomb = (val > 20 && val < 30) || (val > 45 && val < 55) || (val > 70 && val < 80);

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

    // Ganar
    if (val >= 99) {
        winGame();
    }
}

// FÓRMULA MATEMÁTICA DE LA ONDA (Seno)
function updateMonkyPosition(percent) {
    // Ancho total disponible (restamos el ancho del monito aprox 70px)
    let maxW = trackContainer.offsetWidth - 60; 
    let maxH = trackContainer.offsetHeight;
    
    // Posición X: Lineal según el slider
    let posX = (percent / 100) * maxW;
    
    // Posición Y: Onda Senoidal (Math.sin)
    // Multiplicamos percent por un factor para hacer 2 ondas completas
    // 40 es la amplitud (qué tan alto/bajo va)
    let wave = Math.sin((percent / 100) * Math.PI * 4); 
    let posY = (maxH / 2) - 35 + (wave * 35); 

    traveler.style.left = posX + 'px';
    traveler.style.top = posY + 'px';
}

// --- DIFICULTAD (RETROCESO) ---
function slideBack() {
    if (hasWon) return;
    let currentValue = parseInt(slider.value);
    
    if (currentValue < 99) {
        let hitBomb = (currentValue > 20 && currentValue < 30) || 
                      (currentValue > 45 && currentValue < 55) || 
                      (currentValue > 70 && currentValue < 80);
        
        let speed = hitBomb ? 5 : 15; 
        let pushBack = hitBomb ? 4 : 1; 

        let interval = setInterval(() => {
            if (hasWon) { clearInterval(interval); return; }
            
            let newVal = parseInt(slider.value) - pushBack;
            slider.value = newVal;
            
            updateMonkyPosition(newVal); 
            updateKmText(newVal);
            
            if (slider.value <= 0) { 
                clearInterval(interval); 
                gameBox.classList.remove('shake'); 
                statusText.innerText = "¡Vamos de nuevo!";
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

    // Gif Logro
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
    
    // Ocultar monito viajero y meta
    traveler.style.opacity = '0'; 
    goalMonky.classList.add('opacity-0');
    hugSticker.classList.add('show');
    
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
