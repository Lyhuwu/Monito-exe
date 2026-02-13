let canvas, ctx, frames = 0, score = 0, gameLoopId, gameState = 'START';
const WIN_SCORE = 7;

// --- OBJETOS ---
const monky = {
    x: 50, y: 0, width: 60, height: 60, speed: 0, gravity: 0.18, jump: 4.0,
    draw: function() { if(imgPlayer.complete) ctx.drawImage(imgPlayer, this.x, this.y, this.width, this.height); },
    update: function() {
        if (gameState === 'PLAYING') {
            this.speed += this.gravity; this.y += this.speed;
            if(this.y + this.height >= canvas.height || this.y <= 0) gameOverGlobal();
        }
    },
    flap: function() {
        if (gameState === 'PLAYING') {
            this.speed = -this.jump;
            document.getElementById("jumpSound").currentTime = 0;
            document.getElementById("jumpSound").play().catch(()=>{});
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

// --- CONTROL ---
window.iniciarJuegoGlobal = function() {
    document.getElementById("startScreen").classList.add("hidden-layer");
    gameState = 'PLAYING'; score = 0; frames = 0; monky.y = canvas.height / 2;
    pipes.reset(); loop();
};

window.reiniciarJuegoGlobal = function() {
    document.getElementById("gameOverScreen").classList.add("hidden-layer");
    gameState = 'PLAYING'; score = 0; frames = 0; monky.y = canvas.height / 2;
    pipes.reset(); loop();
};

function gameOverGlobal() {
    gameState = 'END'; cancelAnimationFrame(gameLoopId);
    document.getElementById("gameOverScreen").classList.remove("hidden-layer");
}

let goalX = 0, goalY = 0;
function startCinematicEnding() {
    gameState = 'MOVING_TO_HUG'; pipes.items = [];
    goalX = canvas.width * 0.8; goalY = canvas.height / 2 - 35;
}

function animateEnding() {
    ctx.drawImage(imgGoal, goalX, goalY, 70, 70);
    let dx = goalX - monky.x, dy = goalY - monky.y;
    monky.x += dx * 0.01; monky.y += dy * 0.01; monky.draw();
    if (Math.abs(dx) < 5 && Math.abs(dy) < 5) triggerFinalHug();
}

function triggerFinalHug() {
    gameState = 'END'; cancelAnimationFrame(gameLoopId);
    
    // 🟢 ACCIÓN SIMULTÁNEA 🟢
    
    // 1. Mostrar capas inmediatamente
    document.getElementById("finalScreen").classList.remove("hidden-layer");
    document.getElementById("achievement-layer").classList.remove("hidden-layer");
    
    // 2. Disparar animación de inflado
    document.getElementById("stickerAbacho").classList.add("animate-pop");

    // 3. Audio y Confeti
    document.getElementById("winSound").play().catch(()=>{});
    confetti({ spread: 360, ticks: 150, particleCount: 150, shapes: ['heart'] });
    
    // 4. Reiniciar GIF
    let gif = document.getElementById("achievement-gif");
    let src = gif.src; gif.src = ''; gif.src = src;

    // 🟢 TIEMPO DE LOGRO: 9.95 SEGUNDOS
    setTimeout(() => { document.getElementById("achievement-layer").classList.add("hidden-layer"); }, 9950);
}

function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (gameState === 'PLAYING') {
        monky.draw(); monky.update(); pipes.draw(); pipes.update();
        ctx.fillStyle = "#FFF"; ctx.font = "bold 45px Fredoka";
        ctx.fillText(score, canvas.width/2 - 15, 80);
        frames++; gameLoopId = requestAnimationFrame(loop);
    } else if (gameState === 'MOVING_TO_HUG') {
        animateEnding(); gameLoopId = requestAnimationFrame(loop);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    canvas = document.getElementById("gameCanvas"); ctx = canvas.getContext("2d");
    function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
    window.addEventListener('resize', resize); resize();
    window.addEventListener("touchstart", (e) => { if(e.target.tagName !== 'BUTTON') { e.preventDefault(); monky.flap(); }}, {passive: false});
    window.addEventListener("mousedown", (e) => { if(e.target.tagName !== 'BUTTON') monky.flap(); });
});
