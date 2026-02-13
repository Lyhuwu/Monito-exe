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

// --- 2. DIFICULTAD Y OBSTÁCULOS ---
slider.addEventListener('touchend', slideBack);
slider.addEventListener('mouseup', slideBack);

// Esta función ahora corre TODO el tiempo mientras deslizas para detectar turbulencia
slider.addEventListener('input', checkTurbulence);

function checkTurbulence() {
    if (hasWon) return;
    let val = parseInt(slider.value);

    // ZONAS DE TURBULENCIA (Entre 25-35 y entre 65-75)
    if ((val > 25 && val < 35) || (val > 65 && val < 75)) {
        gameBox.classList.add('shake'); // Efecto temblor
        statusText.innerText = "¡TURBULENCIA! 🌬️ Agárrate fuerte";
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
    
    // Si suelta el dedo antes de ganar...
    if (currentValue < 99) {
        
        // Verificamos si soltó el dedo JUSTO en la turbulencia
        let isStorm = (currentValue > 25 && currentValue < 35) || (currentValue > 65 && currentValue < 75);
        
        // Si es tormenta, retrocede MUCHO más rápido (DIFICULTAD)
        let speed = isStorm ? 30 : 15; // Velocidad del retroceso
        let pushBack = isStorm ? 5 : 2; // Cantidad de retroceso

        let interval = setInterval(() => {
            if (hasWon) { clearInterval(interval); return; }
            
            // Retrocede
            slider.value = parseInt(slider.value) - pushBack; 
            updateKmText(slider.value);
            
            // Actualizar visuales de turbulencia mientras retrocede
            checkTurbulence(); 

            if (slider.value <= 0) { 
                clearInterval(interval); 
                gameBox.classList.remove('shake'); // Quitar temblor al llegar a 0
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
    // También revisamos turbulencia aquí
    checkTurbulence();

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
        
        // Quitar efectos de tormenta
        gameBox.classList.remove('shake');
        statusText.innerText = "¡Llegaste! 🎉";

        // A. SONIDO
        sound.volume = 1.0; 
        sound.currentTime = 0;
        sound.play().catch(e => console.log("Error final:", e));

        // B. EL GIF (xvox.gif)
        gif.style.display = 'block';
        const currentSrc = gif.src;
        gif.src = ''; 
        gif.src = currentSrc;

        // C. RESTO DE EFECTOS
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

        // D. OCULTAR GIF A LOS 9.95 SEGUNDOS
        setTimeout(() => { 
            gif.style.display = 'none'; 
        }, 9950);
    }
}
