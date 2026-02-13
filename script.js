let canvas, ctx, frames = 0, score = 0, gameLoopId, gameState = 'START';
const WIN_SCORE = 7;

const monky = {
    x: 50, y: 0, width: 60, height: 60, speed: 0, gravity: 0.18, jump: 4.0,
    
    draw: function() { 
        if(imgPlayer.complete) ctx.drawImage(imgPlayer, this.x, this.y, this.width, this.height); 
    },
    
    update: function() {
        if (gameState === 'PLAYING') {
            this.speed += this.gravity; 
            this.y += this.speed;
            
            // Si toca suelo o techo -> Game Over
            if(this.y + this.height >= canvas.height || this.y <= 0) gameOverGlobal();
        }
    },
    
    flap: function() {
        if (gameState === 'PLAYING') {
            this.speed = -this.jump;
            
            // 👇 CÓDIGO DE SONIDO DE SALTO (CORREGIDO) 👇
            let jS = document.getElementById("jumpSound");
            if (jS) {
                jS.currentTime = 0; // Rebobina para que suene aunque le des rápido
                jS.volume = 0.4;    // Volumen suave
                jS.play().catch((e) => console.log("Error audio salto:", e));
            }
        }
    }
};

const pipes = {
    items: [], dx: 3, gap: 220,
    update: function() {
        if (gameState !== 'PLAYING') return;
        if(frames % 120 === 0) { 
            let yPos = Math.floor(Math.random() * (canvas.height - this.gap - 100)) + 100;
            this.items.push({ x: canvas.width, y: yPos });
        }
        for(let i = 0; i < this.items.length; i++) {
            let p = this.items[i]; p.x -= this.dx;
            if (monky.x + 10 < p.x + 65 && monky.x + 50 > p.x) {
                if (monky.y + 10 < p.y || monky.y + 50 > p.y + this.gap) gameOverGlobal();
            }
            if(p.x + 65 <= 0) {
                this.items.shift(); score++;
                document.getElementById("scoreSound").play().catch(()=>{});
                if(score >= WIN_SCORE) startCinematicEnding();
            }
        }
    },
    draw: function() {
        ctx.fillStyle = "#ffcdd2"; ctx.strokeStyle = "#880e4f"; ctx.lineWidth = 3;
        for(let p of this.items) {
            ctx.fillRect(p.x, 0, 65, p.y); ctx.strokeRect(p.x, -2, 65, p.y + 2);
            ctx.fillRect(p.x, p.y + this.gap, 65, canvas.height); ctx.strokeRect(p.x, p.y + this.gap, 65, canvas.height + 2);
        }
    },
    reset: function() { this.items = []; }
};

const imgPlayer = new Image(); imgPlayer.src = "fotos/monky-viajero.png";
const imgGoal = new Image();   imgGoal.src = "fotos/monky-meta.png";

window.iniciarJuegoGlobal = function() {
    // Evitar que se ejecute doble si le das muy rápido
    if (gameState === 'PLAYING') return;

    // 1. Detener música de fondo (Si existe)
    const music = document.getElementById("startMusic");
    if(music) {
        music.pause();
        music.currentTime = 0;
    }

    // 2. SONIDO DE CLICK (Método "Force Play" desde JS)
    // Esto crea el audio al instante, sin depender del HTML
    const sfx = new Audio('fotos/entrar.mp3'); 
    sfx.volume = 0.6; // Volumen al 60%
    sfx.play().catch((error) => {
        // Si falla, no importa, el juego sigue
        console.log("Error de audio:", error);
    });

    // 3. Ocultar pantalla e iniciar juego
    document.getElementById("startScreen").classList.add("hidden-layer");
    
    // Iniciar variables
    gameState = 'PLAYING'; 
    score = 0; 
    frames = 0; 
    monky.y = canvas.height / 2;
    pipes.reset(); 
    loop();
};

window.reiniciarJuegoGlobal = function() {
    document.getElementById("gameOverScreen").classList.add("hidden-layer");
    gameState = 'PLAYING'; score = 0; frames = 0; monky.y = canvas.height / 2;
    pipes.reset(); loop();
};

function gameOverGlobal() {
    gameState = 'END'; cancelAnimationFrame(gameLoopId);
    
    // 🔊 SONIDO DE CHOQUE
    let crash = document.getElementById("crashSound");
    crash.currentTime = 0; // Reiniciar por si choca muy seguido
    crash.play().catch(()=>{});

    document.getElementById("gameOverScreen").classList.remove("hidden-layer");
}

let goalX = 0, goalY = 0;

function startCinematicEnding() {
    gameState = 'MOVING_TO_HUG'; 
    pipes.items = []; 
    goalX = canvas.width * 0.8; 
    goalY = canvas.height / 2 - 35;
}

function animateEnding() {
    ctx.drawImage(imgGoal, goalX, goalY, 70, 70);
    
    let dx = goalX - monky.x;
    let dy = goalY - monky.y;
    
    monky.x += dx * 0.02;
    monky.y += dy * 0.02;
    
    monky.draw();

    if (Math.abs(dx) < 5 && Math.abs(dy) < 5) triggerFinalHug();
}

function triggerFinalHug() {
    gameState = 'END'; cancelAnimationFrame(gameLoopId);
    
    const finalScreen = document.getElementById("finalScreen");
    const achievementLayer = document.getElementById("achievement-layer");
    const sticker = document.getElementById("stickerAbacho");
    const achievementGif = document.getElementById("achievement-gif");

    achievementLayer.classList.remove("hidden-layer");
    finalScreen.classList.add("visible");

    sticker.classList.remove("sticker-inflate");
    void sticker.offsetWidth; 
    sticker.classList.add("sticker-inflate");

    document.getElementById("winSound").play().catch(()=>{});
    confetti({ spread: 360, ticks: 150, particleCount: 150, shapes: ['heart'] });
    
    const src = achievementGif.src; achievementGif.src = ''; achievementGif.src = src;

    setTimeout(() => { document.getElementById("achievement-layer").classList.add("hidden-layer"); }, 9950);
}

function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (gameState === 'PLAYING') {
        monky.draw(); monky.update(); pipes.draw(); pipes.update();
        ctx.fillStyle = "#FFF"; ctx.font = "bold 45px Fredoka";
        ctx.fillText(score, canvas.width/2 - 15, 80);
        frames++; gameLoopId = requestAnimationFrame(loop);
    } 
    else if (gameState === 'MOVING_TO_HUG') {
        animateEnding();
        gameLoopId = requestAnimationFrame(loop);
    }
}

// --- EVENTOS DE INICIALIZACIÓN ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. CONFIGURACIÓN DEL CANVAS (Lo que ya tenías)
    canvas = document.getElementById("gameCanvas"); 
    ctx = canvas.getContext("2d");
    
    function resize() { 
        canvas.width = window.innerWidth; 
        canvas.height = window.innerHeight; 
    }
    window.addEventListener('resize', resize); 
    resize();

    // 2. CONTROLES TÁCTILES Y MOUSE (Lo que ya tenías)
    window.addEventListener("touchstart", (e) => { 
        // Si es el primer toque y la música no suena, intentamos arrancarla
        if (gameState === 'START') unlockMusic();
        
        if (gameState === 'PLAYING') { e.preventDefault(); monky.flap(); }
    }, {passive: false});

    window.addEventListener("mousedown", (e) => { 
        if (gameState === 'START') unlockMusic();
        if (gameState === 'PLAYING') monky.flap();
    });

    // 3. MÚSICA DE FONDO (Lo nuevo corregido)
    const music = document.getElementById("startMusic");
    if(music) music.volume = 0.5; // Volumen suave

    // Función auxiliar para desbloquear audio en móviles
    function unlockMusic() {
        if (music && music.paused && gameState === 'START') {
            music.play().catch(() => {});
            // Una vez que suena, ya no necesitamos intentar desbloquearlo
            // (El navegador ya nos dio permiso)
        }
    }
});
