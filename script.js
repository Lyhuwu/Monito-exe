// --- VARIABLES GLOBALES ---
let canvas, ctx, frames = 0, score = 0, gameLoopId, gameState = 'START';
const WIN_SCORE = 7;

// --- 🟢 PRECARGA FORZADA DE RECURSOS CRÍTICOS ---
// Esto es fundamental para evitar el retraso de 4 segundos.
// Obligamos al navegador a descargar la imagen final ahora mismo.
const preloadFinalImage = new Image();
preloadFinalImage.src = "fotos/monkys-abrazados.png";
const preloadAchievement = new Image();
preloadAchievement.src = "fotos/xvox.gif";

// --- OBJETOS DEL JUEGO ---
const monky = {
    x: 50, y: 0, width: 60, height: 60, speed: 0, gravity: 0.18, jump: 4.0,
    draw: function() {
        if(imgPlayer.complete && imgPlayer.naturalHeight !== 0) ctx.drawImage(imgPlayer, this.x, this.y, this.width, this.height);
        else { ctx.fillStyle = "#d81b60"; ctx.fillRect(this.x, this.y, this.width, this.height); }
    },
    update: function() {
        if (gameState === 'PLAYING') {
            this.speed += this.gravity; this.y += this.speed;
            if(this.y + this.height >= canvas.height || this.y <= 0) gameOverGlobal();
        }
    },
    flap: function() {
        if (gameState === 'PLAYING') {
            this.speed = -this.jump;
            let snd = document.getElementById("jumpSound"); snd.currentTime = 0; snd.play().catch(()=>{});
        }
    }
};

// BARRAS ROSAS (Configuración Fácil - Estilo Foto 2)
const pipes = {
    items: [], dx: 3, gap: 220,
    update: function() {
        if (gameState !== 'PLAYING') return;
        if(frames % 120 === 0) { 
            let maxPos = canvas.height - this.gap - 100; let minPos = 100;
            let yPos = Math.floor(Math.random() * (maxPos - minPos)) + minPos;
            this.items.push({ x: canvas.width, y: yPos });
        }
        for(let i = 0; i < this.items.length; i++) {
            let p = this.items[i]; p.x -= this.dx; let pipeW = 65; let m = 10; 
            // Detección de colisión con margen de tolerancia
            if (monky.x + m < p.x + pipeW && monky.x + monky.width - m > p.x) {
                if (monky.y + m < p.y || monky.y + monky.height - m > p.y + this.gap) gameOverGlobal();
            }
            // Puntuación
            if(p.x + pipeW <= 0) {
                this.items.shift(); score++;
                let snd = document.getElementById("scoreSound"); snd.currentTime = 0; snd.play().catch(()=>{});
                if(score >= WIN_SCORE) startCinematicEnding();
            }
        }
    },
    draw: function() {
        for(let i = 0; i < this.items.length; i++) {
            let p = this.items[i]; let pipeW = 65;
            ctx.fillStyle = "#ffcdd2"; ctx.strokeStyle = "#880e4f"; ctx.lineWidth = 3;
            // Barra Superior
            ctx.fillRect(p.x, 0, pipeW, p.y); ctx.strokeRect(p.x, -2, pipeW, p.y + 2);
            // Barra Inferior
            let bottomY = p.y + this.gap;
            ctx.fillRect(p.x, bottomY, pipeW, canvas.height - bottomY); ctx.strokeRect(p.x, bottomY, pipeW, canvas.height - bottomY + 2);
        }
    },
    reset: function() { this.items = []; }
};

// Recursos estándar
const imgPlayer = new Image(); imgPlayer.src = "fotos/monky-viajero.png";
const imgGoal = new Image();   imgGoal.src = "fotos/monky-meta.png";

// --- FUNCIONES DE CONTROL GLOBAL ---
window.iniciarJuegoGlobal = function() {
    document.getElementById("startScreen").classList.add("hidden-layer");
    gameState = 'PLAYING'; score = 0; frames = 0; monky.y = canvas.height / 2; monky.speed = 0; pipes.reset();
    // Desbloqueo de audio para móviles
    let winSnd = document.getElementById("winSound"); winSnd.volume = 0; winSnd.play().then(()=>{ winSnd.pause(); winSnd.currentTime=0; }).catch(()=>{});
    loop();
};

window.reiniciarJuegoGlobal = function() {
    document.getElementById("gameOverScreen").classList.add("hidden-layer");
    gameState = 'PLAYING'; score = 0; frames = 0; monky.y = canvas.height / 2; monky.speed = 0; pipes.reset(); loop();
};

function gameOverGlobal() {
    gameState = 'END'; cancelAnimationFrame(gameLoopId);
    document.getElementById("gameOverScreen").classList.remove("hidden-layer");
}

// --- SECUENCIA FINAL CINEMÁTICA ---
let goalX = 0; let goalY = 0;
function startCinematicEnding() {
    gameState = 'MOVING_TO_HUG'; pipes.items = []; 
    goalX = canvas.width * 0.8; goalY = canvas.height / 2 - 35;
}

function animateEnding() {
    if(imgGoal.complete) ctx.drawImage(imgGoal, goalX, goalY, 70, 70);
    let dx = goalX - monky.x; let dy = goalY - monky.y;
    monky.x += dx * 0.01; monky.y += dy * 0.01; monky.draw();
    // Condición de llegada a la meta
    if (Math.abs(dx) < 5 && Math.abs(dy) < 5) triggerFinalHug();
}

function triggerFinalHug() {
    gameState = 'END'; cancelAnimationFrame(gameLoopId);
    
    // 🟢 EJECUCIÓN SINCRONIZADA INSTANTÁNEA 🟢
    
    // 1. Audio
    let winSnd = document.getElementById("winSound"); 
    winSnd.volume = 1.0; winSnd.play().catch(()=>{});

    // 2. Mostrar capas (Logro y Final) instantáneamente
    // Removemos la clase que los oculta
    document.getElementById("finalScreen").classList.remove("hidden-layer");
    document.getElementById("achievement-layer").classList.remove("hidden-layer");
    
    // 3. Disparar la animación del sticker (Pop-In)
    // Añadimos la clase que contiene la animación definida en CSS
    const sticker = document.getElementById("stickerFinal");
    // Reiniciamos la animación por si acaso
    sticker.classList.remove("animate-pop"); 
    void sticker.offsetWidth; // Forzar reflow (truco técnico para reiniciar animaciones CSS)
    sticker.classList.add("animate-pop");

    // 4. Reiniciar GIF del logro para que se reproduzca desde el inicio
    let gif = document.getElementById("achievement-gif");
    let src = gif.src; gif.src = ''; gif.src = src;

    // 5. Efectos visuales
    confetti({ spread: 360, ticks: 150, gravity: 0, decay: 0.92, startVelocity: 45, particleCount: 150, scalar: 1.2, shapes: ['heart'] });
    
    // Ocultar el logro después de 8 segundos
    setTimeout(() => { document.getElementById("achievement-layer").classList.add("hidden-layer"); }, 8000);
}

// --- BUCLE PRINCIPAL E INICIALIZACIÓN ---
function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (gameState === 'PLAYING') {
        monky.draw(); monky.update(); pipes.draw(); pipes.update();
        drawScore(); frames++; gameLoopId = requestAnimationFrame(loop);
    } else if (gameState === 'MOVING_TO_HUG') {
        animateEnding(); gameLoopId = requestAnimationFrame(loop);
    }
}
function drawScore() {
    ctx.fillStyle = "#FFF"; ctx.strokeStyle = "#880e4f"; ctx.lineWidth = 4; ctx.font = "bold 45px Fredoka";
    ctx.strokeText(score, canvas.width/2 - 15, 80); ctx.fillText(score, canvas.width/2 - 15, 80);
}

// Configuración inicial al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    canvas = document.getElementById("gameCanvas"); ctx = canvas.getContext("2d");
    function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
    window.addEventListener('resize', resize); resize();
    const handleInput = (e) => { if(e.target.tagName !== 'BUTTON') { if(e.type === 'touchstart') e.preventDefault(); monky.flap(); }};
    window.addEventListener("touchstart", handleInput, {passive: false}); window.addEventListener("mousedown", handleInput);
});
