let hasWon = false;
const slider = document.getElementById('loveSlider');
const sound = document.getElementById('achievementSound');

// --- 1. PREPARAR EL SONIDO (DESBLOQUEO MÓVIL) ---
// Esto es vital: Apenas tocas el slider para empezar,
// cargamos el audio en silencio. Así el navegador ya tiene "permiso"
// para sonarlo fuerte cuando llegues a la meta.
slider.addEventListener('touchstart', unlockAudio, { once: true });
slider.addEventListener('mousedown', unlockAudio, { once: true });

function unlockAudio() {
    sound.volume = 0.1; // Volumen bajito para desbloquear
    sound.play().then(() => {
        sound.pause();
        sound.currentTime = 0; // Lo regresamos al inicio
        sound.volume = 1.0; // Lo dejamos listo con volumen alto
    }).catch(e => {
        console.log("Audio esperando interacción...");
    });
}

// --- DIFICULTAD (Retroceso) ---
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

// --- LÓGICA PRINCIPAL ---
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

    // --- ¡AQUÍ ES EL MOMENTO EXACTO! (Llegó a la meta) ---
    if (value >= 99) {
        hasWon = true; 

        // 1. SONIDO (Disparo inmediato) 🔊
        // Lo ponemos primero para ganar milisegundos
        sound.currentTime = 0; // Asegura que empiece desde el segundo 0
        sound.play().catch(e => console.log("Error audio"));

        // 2. ANIMACIÓN VISUAL (Sincronizada) 🏆
        achievement.classList.add('show');
        
        // 3. RESTO DE EFECTOS
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

        // Ocultar logro visualmente a los 5 segundos
        setTimeout(() => { achievement.classList.remove('show'); }, 5000);
    }
}
