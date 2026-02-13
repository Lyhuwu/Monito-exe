/* --- VARIABLES GLOBALES --- */
let canvas, ctx, frames = 0, score = 0, gameLoopId, gameState = 'START';
const WIN_SCORE = 7;

/* --- OBJETOS DEL JUEGO --- */
const monky = {
    x: 50, y: 0, width: 60, height: 60, speed: 0, gravity: 0.18, jump: 4.0,

    draw: function() { 
        if(imgPlayer.complete) ctx.drawImage(imgPlayer, this.x, this.y, this.width, this.height); 
    },

    update: function() {
        if (gameState === 'PLAYING') {
            this.speed += this.gravity; 
            this.y += this.speed;
            // Choque con suelo o techo
            if(this.y + this.height >= canvas.height || this.y <= 0) gameOverGlobal();
        }
    },

    flap: function() {
        if (gameState === 'PLAYING') {
            this.speed = -this.jump;
            
            // Sonido de Salto (Usando tu archivo salto.mp3)
            let jS = document.getElementById("jumpSound");
            if (jS) {
                jS.currentTime = 0; 
                jS.volume = 0.4;
                jS.play().catch((e) => console.log("Error audio salto:", e));
            }
        }
    }
};

const pipes = {
    items: [], dx: 3, gap: 170, // Gap ajustado para dificultad media

    update: function() {
        if (gameState !== 'PLAYING') return;
        
        // Generar tubos cada 120 frames
        if(frames % 120 === 0) { 
            let yPos = Math.floor(Math.random() * (canvas.height - this.gap - 100)) + 100;
            this.items.push({ x: canvas.width, y: yPos });
        }

        for(let i = 0; i < this.items.length; i++) {
            let p = this.items[i]; 
            p.x -= this.dx;

            // Colisiones
            if (monky.x + 10 < p.x + 65 && monky.x + 50 > p.x) {
                if (monky.y + 10 < p.y || monky.y + 50 > p.y + this.gap) gameOverGlobal();
            }

            // Puntuación
            if(p.x + 65 <= 0) {
                this.items.shift(); 
                score++;
                
                // Sonido de punto (pasar.mp3)
                let scoreS = document.getElementById("scoreSound");
                if(scoreS) { scoreS.currentTime = 0; scoreS.play().catch(()=>{}); }

                // Ganar
                if(score >= WIN_SCORE) startCinematicEnding();
            }
        }
    },

    draw: function() {
        ctx.fillStyle = "#ffcdd2"; ctx.strokeStyle = "#880e4f"; ctx.lineWidth = 3;
        for(let p of this.items) {
            ctx.fillRect(p.x, 0, 65, p.y); 
            ctx.strokeRect(p.x, -2, 65, p.y + 2);
            ctx.fillRect(p.x, p.y + this.gap, 65, canvas.height); 
            ctx.strokeRect(p.x, p.y + this.gap, 65, canvas.height + 2);
        }
    },

    reset: function() { this.items = []; }
};

/* --- IMÁGENES --- */
const imgPlayer = new Image(); imgPlayer.src = "fotos/monky-viajero.png";
const imgGoal = new Image();   imgGoal.src = "fotos/monky-meta.png";

/* --- FUNCIONES DE CONTROL (GLOBALES) --- */
window.iniciarJuegoGlobal = function() {
    // 1. Detener música inicio
    const music = document.getElementById("startMusic");
    if(music) { music.pause(); music.currentTime = 0; }

    // 2. Sonido Click (entrar.mp3) - Método robusto JS
    const sfx = new Audio('fotos/entrar.mp3');
    sfx.volume = 0.6;
    sfx.play().catch(()=>{});

    // 3. Ocultar pantalla e iniciar
    const startScreen = document.getElementById("startScreen");
    if(startScreen) startScreen.classList.add("hidden-layer");

    gameState = 'PLAYING'; score = 0; frames = 0; monky.y = canvas.height / 2;
    pipes.reset(); 
    loop();
};

window.reiniciarJuegoGlobal = function() {
    document.getElementById("gameOverScreen").classList.add("hidden-layer");
    gameState = 'PLAYING'; score = 0; frames = 0; monky.y = canvas.height / 2;
    pipes.reset(); 
    loop();
};

function gameOverGlobal() {
    gameState = 'END'; cancelAnimationFrame(gameLoopId);
    
    // Sonido Choque (perdio.mp3)
    let crash = document.getElementById("crashSound");
    if(crash) { crash.currentTime = 0; crash.play().catch(()=>{}); }

    document.getElementById("gameOverScreen").classList.remove("hidden-layer");
}

/* --- CINEMÁTICA FINAL --- */
let goalX = 0, goalY = 0;

function startCinematicEnding() {
    gameState = 'MOVING_TO_HUG'; 
    pipes.items = []; 

    // Música Romántica (final.mp3)
    const finalMusic = document.getElementById("finalMusic");
    if (finalMusic) {
        finalMusic.volume = 0.2; 
        finalMusic.play().catch((e) => console.log("Error música final:", e));
    }

    goalX = canvas.width * 0.8; 
    goalY = canvas.height / 2 - 35;
}

function animateEnding() {
    ctx.drawImage(imgGoal, goalX, goalY, 70, 70);
    
    let dx = goalX - monky.x;
    let dy = goalY - monky.y;
    
    monky.x += dx * 0.02; // Velocidad lenta
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

    // Animación sticker
    sticker.classList.remove("sticker-inflate");
    void sticker.offsetWidth; 
    sticker.classList.add("sticker-inflate");

    // Sonido Logro
    let winS = document.getElementById("winSound");
    if(winS) winS.play().catch(()=>{});
    
    confetti({ spread: 360, ticks: 150, particleCount: 150, shapes: ['heart'] });
    
    if(achievementGif) {
        const src = achievementGif.src; achievementGif.src = ''; achievementGif.src = src;
    }

    setTimeout(() => { 
        if(achievementLayer) achievementLayer.classList.add("hidden-layer"); 
    }, 9950);
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

/* --- EVENTOS DE INICIALIZACIÓN --- */
document.addEventListener('DOMContentLoaded', () => {
    canvas = document.getElementById("gameCanvas"); 
    ctx = canvas.getContext("2d");
    
    function resize() { 
        canvas.width = window.innerWidth; 
        canvas.height = window.innerHeight; 
    }
    window.addEventListener('resize', resize); 
    resize();

    // Controles
    window.addEventListener("touchstart", (e) => { 
        if (gameState === 'START') unlockMusic();
        if (gameState === 'PLAYING') { e.preventDefault(); monky.flap(); }
    }, {passive: false});

    window.addEventListener("mousedown", (e) => { 
        if (gameState === 'START') unlockMusic();
        if (gameState === 'PLAYING') monky.flap();
    });

    // Intentar iniciar música de fondo
    const music = document.getElementById("startMusic");
    if(music) music.volume = 0.5;

    function unlockMusic() {
        if (music && music.paused && gameState === 'START') {
            music.play().catch(() => {});
        }
    }
});
