let canvas, ctx, frames = 0, score = 0, gameLoopId, gameState = 'START';
const WIN_SCORE = 7;

// --- LÓGICA DE VICTORIA ---
function triggerFinalHug() {
    gameState = 'END';
    cancelAnimationFrame(gameLoopId);
    
    // 1. Activación Atómica (Sin Retrasos)
    document.getElementById("finalScreen").classList.remove("hidden-layer");
    document.getElementById("achievement-layer").classList.remove("hidden-layer");
    
    // 2. Disparar Animación de Inflado
    document.getElementById("stickerAbacho").classList.add("animate-pop");

    // 3. Audio y Confeti
    document.getElementById("winSound").play().catch(()=>{});
    confetti({ spread: 360, ticks: 150, particleCount: 150, shapes: ['heart'] });
    
    // 4. Reinicio forzado del GIF para sincronizar
    let gif = document.getElementById("achievement-gif");
    let src = gif.src; gif.src = ''; gif.src = src;

    // 🟢 DURACIÓN EXACTA: 9.95 SEGUNDOS
    setTimeout(() => { 
        document.getElementById("achievement-layer").classList.add("hidden-layer"); 
    }, 9950);
}

// ... Resto del código de movimiento y tuberías rosas ...
