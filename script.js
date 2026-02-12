let hasWon = false;
const slider = document.getElementById('loveSlider');
const sound = document.getElementById('achievementSound');

// --- HACK: DESBLOQUEAR AUDIO EN MÓVIL ---
// Los celulares no dejan sonar nada si no hay un toque previo.
// Esto carga el sonido en silencio al primer toque para tenerlo listo.
document.body.addEventListener('touchstart', unlockAudio, { once: true });
document.body.addEventListener('click', unlockAudio, { once: true });

function unlockAudio() {
    // Intentamos reproducir y pausar inmediatamente
    sound.play().then(() => {
        sound.pause();
        sound.currentTime = 0;
    }).catch(e => console.log("Audio esperando interacción..."));
}

// --- DIFICULTAD (Retroceso) ---
slider.addEventListener('touchend', slideBack);
slider.addEventListener('mouseup', slideBack);

function slideBack() {
    if (hasWon) return;
    let currentValue = parseInt(slider.value);
    
    // Si suelta antes de llegar al final
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

    // --- ¡GANASTE! ---
    if (value >= 99) {
        hasWon = true; 
        kmText.innerText = "¡Juntas! ❤️";
        
        goalMonky.classList.add('opacity-0');
        slider.classList.add('hide-thumb');
        hugSticker.classList.add('show');
        
        // 1. Mostrar Logro
        achievement.classList.add('show');
        
        // 2. REPRODUCIR SONIDO 🔊
        sound.volume = 1.0; 
        sound.currentTime = 0; // Reiniciar por si acaso
        sound.play().catch(error => alert("Error de audio: " + error)); // Esto te dirá si algo falla

        // Ocultar logro a los 5 seg
        setTimeout(() => { achievement.classList.remove('show'); }, 5000);

        body.style.backgroundColor = "#ffcdd2"; 

        if (!letter.classList.contains('show')) {
            letter.classList.add('show');
            var defaults = { spread: 360, ticks: 50, gravity: 0, decay: 0.94, startVelocity: 30, colors: ['#d81b60', '#f06292', '#ffffff'] };
            confetti({ ...defaults, particleCount: 100, scalar: 1.2, shapes: ['heart'] });
            slider.disabled = true;
        }
    }
}
