let hasWon = false;
const slider = document.getElementById('loveSlider');
const sound = document.getElementById('achievementSound');
const startScreen = document.getElementById('start-screen');
const startBtn = document.getElementById('start-btn');

// --- 1. LÓGICA DE INICIO (CLICK MÁGICO) ---
startBtn.addEventListener('click', () => {
    // Al hacer clic, reproducimos silencio para desbloquear el audio
    sound.volume = 0; 
    sound.play().then(() => {
        sound.pause();
        sound.currentTime = 0;
        console.log("Audio desbloqueado y listo 🔊");
    }).catch(error => {
        console.log("Error al intentar desbloquear:", error);
    });

    // Ocultamos la pantalla de inicio
    startScreen.classList.add('hidden');
});

// --- 2. DIFICULTAD (El slider regresa) ---
slider.addEventListener('touchend', slideBack);
slider.addEventListener('mouseup', slideBack);

function slideBack() {
    if (hasWon) return;
    let currentValue = parseInt(slider.value);
    
    if (currentValue < 99) {
        let interval = setInterval(() => {
            if (hasWon) { clearInterval(interval); return; }
            slider.value = parseInt(slider.value) - 2; 
            updateKmText(slider.value);
            if (slider.value <= 0) { clearInterval(interval); }
        }, 15);
    }
}

function updateKmText(val) {
    const kmText = document.getElementById('kmText');
    let maxKm = 3000;
    let currentKm = Math.round(maxKm - (maxKm * (val / 100)));
    if (!hasWon) { kmText.innerText = currentKm + " km restantes"; }
}

// --- 3. LÓGICA PRINCIPAL (GANAR) ---
function checkHug() {
    if (hasWon) { slider.value = 100; return; }

    const value = parseInt(slider.value);
    const letter = document.getElementById('hidden-letter');
    const goalMonky = document.getElementById('goalMonky');
    const hugSticker = document.getElementById('hugSticker');
    const kmText = document.getElementById('kmText');
    const body = document.querySelector('body');
    const achievement = document.getElementById('achievement');

    updateKmText(value);

    // --- ¡VICTORIA! ---
    if (value >= 99) {
        hasWon = true; 

        // A. SONIDO (¡Ahora sí!) 🔊
        sound.volume = 1.0; 
        sound.currentTime = 0;
        sound.play().catch(e => console.log("Error final:", e));

        // B. VISUALES 🏆
        achievement.classList.add('show');
        
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

        setTimeout(() => { achievement.classList.remove('show'); }, 5000);
    }
}
