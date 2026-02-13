let hasWon = false;
const slider = document.getElementById('loveSlider');
const sound = document.getElementById('achievementSound');
const startScreen = document.getElementById('start-screen');
const startBtn = document.getElementById('start-btn');
const gif = document.getElementById('achievement-gif'); 

// --- 1. INICIO (Activar audio y quitar pantalla) ---
startBtn.addEventListener('click', () => {
    sound.volume = 0; 
    sound.play().then(() => {
        sound.pause();
        sound.currentTime = 0;
    }).catch(e => console.log("Error unlock:", e));
    
    // Ocultar pantalla
    startScreen.classList.add('hidden');
});

// --- 2. DIFICULTAD ---
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

// --- 3. LÓGICA PRINCIPAL ---
function checkHug() {
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

        // A. SONIDO
        sound.volume = 1.0; 
        sound.currentTime = 0;
        sound.play().catch(e => console.log("Error final:", e));

        // B. EL GIF (xvox.gif)
        gif.style.display = 'block';
        
        // Reiniciar animación del GIF
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
