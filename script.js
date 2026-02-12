let hasWon = false;
const slider = document.getElementById('loveSlider');

// --- DIFICULTAD (Regresa si sueltas) ---
slider.addEventListener('touchend', slideBack);
slider.addEventListener('mouseup', slideBack);

function slideBack() {
    if (hasWon) return;

    let currentValue = parseInt(slider.value);

    // Si no ha llegado al 99%, retrocede
    if (currentValue < 99) {
        let interval = setInterval(() => {
            if (hasWon) {
                clearInterval(interval);
                return;
            }
            slider.value = parseInt(slider.value) - 2; 
            updateKmText(slider.value);

            if (slider.value <= 0) {
                clearInterval(interval);
            }
        }, 15);
    }
}

function updateKmText(val) {
    const kmText = document.getElementById('kmText');
    let maxKm = 3000;
    let currentKm = Math.round(maxKm - (maxKm * (val / 100)));
    
    if (!hasWon) {
        kmText.innerText = currentKm + " km restantes";
    }
}

// --- LÓGICA PRINCIPAL ---
function checkHug() {
    if (hasWon) {
        slider.value = 100;
        return; 
    }

    const value = parseInt(slider.value);
    const letter = document.getElementById('hidden-letter');
    const goalMonky = document.getElementById('goalMonky');
    const hugSticker = document.getElementById('hugSticker');
    const kmText = document.getElementById('kmText');
    const body = document.querySelector('body');
    const achievement = document.getElementById('achievement');

    updateKmText(value);

    // --- VICTORIA ---
    if (value >= 99) {
        hasWon = true; 
        
        kmText.innerText = "¡Juntas! ❤️";
        
        goalMonky.classList.add('opacity-0');
        slider.classList.add('hide-thumb'); // Oculta el viajero
        hugSticker.classList.add('show');   // Muestra el abrazo
        
        // Muestra el logro
        achievement.classList.add('show');
        setTimeout(() => {
            achievement.classList.remove('show');
        }, 5000);

        body.style.backgroundColor = "#ffcdd2"; 

        if (!letter.classList.contains('show')) {
            letter.classList.add('show');
            
            var defaults = {
                spread: 360,
                ticks: 50,
                gravity: 0,
                decay: 0.94,
                startVelocity: 30,
                colors: ['#d81b60', '#f06292', '#ffffff']
            };

            confetti({
                ...defaults,
                particleCount: 100,
                scalar: 1.2,
                shapes: ['heart']
            });
            
            slider.disabled = true;
        }
    }
}
