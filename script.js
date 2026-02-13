// Variables Globales
let canvas, ctx;
let frames = 0;
let score = 0;
let gameLoopId;
let gameState = 'START';
const WIN_SCORE = 7;

// Objetos (Monky y Tubos)
const monky = {
    x: 50, y: 0, width: 60, height: 60,
    speed: 0, gravity: 0.2, jump: 4.5,
    draw: function() {
        if(imgPlayer.complete && imgPlayer.naturalHeight !== 0) ctx.drawImage(imgPlayer, this.x, this.y, this.width, this.height);
        else { ctx.fillStyle = "#d81b60"; ctx.fillRect(this.x, this.y, this.width, this.height); }
    },
    update: function() {
        if (gameState === 'PLAYING') {
            this.speed += this.gravity;
            this.y += this.speed;
            if(this.y + this.height >= canvas.height || this.y <= 0) gameOver();
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
    items: [], dx: 3, gap: 180,
    update: function() {
        if (gameState !== 'PLAYING') return;
        if(frames % 100 === 0) { // Frecuencia de tubos
            let yPos = Math.floor(Math.random() * (canvas.height - this.gap - 100)) - 100;
            this.items.push({ x: canvas.width, y: yPos });
        }
        for(let i = 0; i < this.items.length; i++) {
            let p = this.items[i];
            p.x -= this.dx;
            let pipeW = 80; let pipeH = canvas.height;
            
            // Colisiones
            if (monky.x < p.x + pipeW && monky.x + monky.width > p.x &&
                (monky.y < p.y + pipeH || monky.y + monky.height > p.y + pipeH + this.gap)) {
                gameOver();
            }
            // Puntos
            if(p.x + pipeW <= 0) {
                this.items.shift();
                score++;
                document.getElementById("scoreSound").currentTime = 0;
                document.getElementById("scoreSound").play().catch(()=>{});
                if(score >= WIN_SCORE) startCinematicEnding();
            }
        }
    },
    draw: function() {
        for(let i = 0; i < this.items.length; i++) {
            let p = this.items[i];
            let pipeH = canvas.height;
            if(imgObstacle.complete && imgObstacle.naturalHeight !== 0) {
                ctx.drawImage(imgObstacle, p.x, p.y, 80, pipeH);
                ctx.drawImage(imgObstacle, p.x, p.y + pipeH + this.gap, 80, pipeH);
            } else {
                ctx.fillStyle = "#f8bbd0"; ctx.strokeStyle = "#880e4f"; ctx.lineWidth = 4;
                ctx.fillRect(p.x, p.y, 80, pipeH); ctx.strokeRect(p.x, p.y, 80, pipeH);
                ctx.fillRect(p.x, p.y + pipeH + this.gap, 80, pipeH); ctx.strokeRect(p.x, p.y + pipeH + this.gap, 80, pipeH);
            }
        }
    },
    reset: function() { this.items = []; }
};

// Imágenes
const imgPlayer = new Image(); imgPlayer.src = "fotos/monky-viajero.png";
const imgGoal = new Image();   imgGoal.src = "fotos/monky-meta.png"; 
const imgObstacle = new Image(); imgObstacle.src = "fotos/obstaculo.png";

// --- FUNCIONES GLOBALES (Para que el botón las encuentre) ---
window.iniciarJuego = function() {
    document.getElementById("startScreen").classList.add("invisible");
    gameState = 'PLAYING';
    score = 0; frames = 0;
    monky.y = canvas.height / 2; monky.speed = 0;
    pipes.reset();
    
    let winSnd = document.getElementById("winSound");
    winSnd.volume = 0; winSnd.play().then(()=>{ winSnd.pause(); winSnd.currentTime=0; }).catch(()=>{});
    
    loop();
};

window.reiniciarJuego = function() {
    document.getElementById("gameOverScreen").classList.add("invisible");
    gameState = 'PLAYING';
    score = 0; frames = 0;
    monky.y = canvas.height / 2; monky.speed = 0;
    pipes.reset();
    loop();
};

function gameOver() {
    gameState = 'END';
    cancelAnimationFrame(gameLoopId);
    document.getElementById("gameOverScreen").classList.remove("invisible");
}

let goalX = 0; let goalY = 0;
function startCinematicEnding() {
    gameState = 'MOVING_TO_HUG';
    pipes.items = []; 
    goalX = canvas.width * 0.8;
    goalY = canvas.height / 2 - 30;
}

function animateEnding() {
    if(imgGoal.complete) ctx.drawImage(imgGoal, goalX, goalY, 70, 70);
    let dx = goalX - monky.x; let dy = goalY - monky.y;
    monky.x += dx * 0.01; monky.y += dy * 0.01;
    monky.draw();
    if (Math.abs(dx) < 5 && Math.abs(dy) < 5) triggerFinalHug();
}

function triggerFinalHug() {
    gameState = 'END';
    cancelAnimationFrame(gameLoopId);
    let winSnd = document.getElementById("winSound");
    winSnd.volume = 1.0; winSnd.play().catch(()=>{});

    document.getElementById("finalScreen").classList.add("show-instant");
    document.getElementById("achievement-layer").classList.add("show-instant");
    
    let gif = document.getElementById("achievement-gif");
    let src = gif.src; gif.src = ''; gif.src = src;

    confetti({ spread: 360, ticks: 150, gravity: 0, decay: 0.92, startVelocity: 45, particleCount: 150, scalar: 1.2, shapes: ['heart'] });
    setTimeout(() => { document.getElementById("achievement-layer").classList.remove("show-instant"); }, 8000);
}

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
    ctx.fillStyle = "#FFF"; ctx.strokeStyle = "#880e4f";
    ctx.lineWidth = 3; ctx.font = "bold 40px Fredoka";
    ctx.strokeText(score, canvas.width/2 - 15, 80);
    ctx.fillText(score, canvas.width/2 - 15, 80);
}

// Inicializar al cargar
document.addEventListener('DOMContentLoaded', () => {
    canvas = document.getElementById("gameCanvas");
    ctx = canvas.getContext("2d");
    
    function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
    window.addEventListener('resize', resize);
    resize();
    
    // Controles Touch
    const handleInput = (e) => {
        if(e.target.tagName !== 'BUTTON') {
            if(e.type === 'touchstart') e.preventDefault();
            monky.flap();
        }
    };
    window.addEventListener("touchstart", handleInput, {passive: false});
    window.addEventListener("mousedown", handleInput);
});
