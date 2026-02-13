let hasWon = false;
const slider = document.getElementById('loveSlider');
const sound = document.getElementById('achievementSound');
const startScreen = document.getElementById('start-screen');
const startBtn = document.getElementById('start-btn');
const gif = document.getElementById('achievement-gif'); 
const gameBox = document.getElementById('game-box');
const statusText = document.getElementById('status-text');

// --- 1. INICIO ---
startBtn.addEventListener('click', () => {
    sound.volume = 0; 
    sound.play().then(() => {
        sound.pause();
        sound.currentTime = 0;
    }).catch(e => console.log("Error unlock:", e));
    startScreen.classList.add('hidden');
});

// --- 2. DIFICULTAD (CAMPO MINADO) ---
slider.addEventListener('touchend', slideBack);
slider.addEventListener('mouseup', slideBack);

// Revisar bombas constantemente
slider.addEventListener('input', checkObstacles);

function checkObstacles() {
    if (hasWon) return;
    let val = parseInt(slider.value);

    // ZONAS DE BOMBAS (15-25, 45-55, 75-85)
    let hitBomb = (val > 15 && val < 25) || (val > 45 && val < 55) || (val > 75 && val < 85);

    if (hitBomb) {
        gameBox.classList.add('shake'); 
        statusText.innerText = "¡BOMBA! 💥 Corre!!";
        statusText.style.color = "red";
    } else {
        gameBox.classList.remove('shake');
        statusText.innerText = "¡No lo sueltes o se regresará!";
        statusText.style.color = "#ad1457";
    }
}

function slideBack() {
    if (hasWon) return;
    let currentValue = parseInt(slider.value);
    
    if (currentValue < 99) {
        
        // Verificamos si soltó el dedo en zona de bomba
        let hitBomb = (currentValue > 15 && currentValue < 25) || 
                      (currentValue > 45 && currentValue < 55) || 
                      (currentValue > 75 && currentValue < 85);
        
        // Si toca bomba, regresa MUY rápido (Velocidad 5ms, Retroceso 8px)
        let speed = hitBomb ? 5 : 15; 
        let pushBack = hitBomb ? 8 : 2; 

        let interval = setInterval(() => {
            if (hasWon) { clearInterval(interval); return; }
            
            slider.value = parseInt(slider.value) - pushBack; 
            updateKmText(slider.value);
            
            // Checar visuales mientras retrocede
            checkObstacles(); 

            if (slider.value <= 0) { 
                clearInterval(interval); 
                gameBox.classList.remove('shake'); 
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

// --- 3. LÓGICA PRINCIPAL ---
function checkHug() {
    checkObstacles(); // Revisión continua

    if (hasWon) { slider.value = 100; return; }

    const value = parseInt(slider.value);
    const letter = document.getElementById('hidden-letter');
    const goalMonky = document.getElementById('goalMonky');
    const hugSticker = document.getElementById('hugSticker');
    const kmText = document.getElementById('kmText');
    const body = document.querySelector('body');

    updateKmText(value);

    // --- ¡VICTORIA! ---
    if (value >= 99) {
        hasWon = true; 
        
        // Limpiar efectos
        gameBox.classList.remove('shake');
        statusText.innerText = "¡Llegaste! 🎉";

        // A. SONIDO
        sound.volume = 1.0; 
        sound.currentTime = 0;
        sound.play().catch(e => console.log("Error final:", e));

        // B. EL GIF GIGANTE
        gif.style.display = 'block';
        const currentSrc = gif.src;
        gif.src = ''; 
        gif.src = currentSrc;

        // C. EFECTOS
        kmText.innerText = "¡Juntas! ❤️";
        body.style.backgroundColor = "#ffcdd2"; 
        
        goalMonky.classList.add('opacity-0');
        slider.classList.add('hide-thumb');
        hugSticker.classList.add('show');
        
        if (!letter.classList.contains('show')) {
            letter.classList.add('show');
            var defaults = { spread: 360, ticks: 50, gravity: 0, decay: 0.94, startVelocity: 30, colors: ['#d81b60', '#f06292', '#ffffff'] };
            confetti({ ...defaults, particleCount: 100, scalar: 1.2, shapes: ['heart'] });
            slider.disabled = true;
        }

        // OCULTAR GIF A LOS 9.95 SEGUNDOS
        setTimeout(() => { 
            gif.style.display = 'none'; 
        }, 9950);
    }
}
