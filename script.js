document.addEventListener('DOMContentLoaded', () => {

    // --- CONFIGURACIÓN ---
    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");
    
    // Imágenes
    const imgPlayer = new Image(); imgPlayer.src = "fotos/monky-viajero.png";
    const imgGoal = new Image();   imgGoal.src = "fotos/monky-meta.png"; 
    const imgObstacle = new Image(); imgObstacle.src = "fotos/obstaculo.png"; 
    
    // Elementos del DOM
    const startScreen = document.getElementById("startScreen");
    const gameOverScreen = document.getElementById("gameOverScreen");
    const finalScreen = document.getElementById("finalScreen");
    const btnStart = document.getElementById("btnStart");
    const btnRetry = document.getElementById("btnRetry");
    const gifLogro = document.getElementById("achievement-gif");

    // Sonidos
    const jumpSnd = document.getElementById("jumpSound");
    const scoreSnd = document.getElementById("scoreSound");
    const winSnd = document.getElementById("winSound");

    // Variables de Juego
    let frames = 0;
    let score = 0;
    let gameLoopId;
    let gameState = 'START'; 
    
    // --- 🟢 CAMBIO 1: META A 7 PUNTOS ---
    const WIN_SCORE = 7; 

    // --- OBJETOS ---
    const monky = {
        x: 50, y: 250, width: 50, height: 50,
        
        // Físicas "Easy Mode"
        speed: 0, 
        gravity: 0.18, 
        jump: 3.8,     
        
        draw: function() {
            if(imgPlayer.complete && imgPlayer.naturalHeight !== 0) {
                ctx.drawImage(imgPlayer, this.x, this.y, this.width, this.height);
            } else {
                ctx.fillStyle = "#d81b60"; ctx.fillRect(this.x, this.y, this.width, this.height);
            }
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
                jumpSnd.currentTime = 0; 
                jumpSnd.play().catch(() => {});
            }
        }
    };

    const pipes = {
        items: [], 
        dx: 2.5, 
        gap: 170, 
        
        update: function() {
            if (gameState !== 'PLAYING') return;

            if(frames % 120 === 0) {
                let yPos = Math.floor(Math.random() * (canvas.height - this.gap - 100)) - 100;
                this.items.push({ x: canvas.width, y: yPos });
            }

            for(let i = 0; i < this.items.length; i++) {
                let p = this.items[i];
                p.x -= this.dx;

                let pipeW = 50; let pipeH = 300; 

                // Colisiones
                if (monky.x < p.x + pipeW && monky.x + monky.width > p.x &&
                    (monky.y < p.y + pipeH || monky.y + monky.height > p.y + pipeH + this.gap)) {
                    gameOver();
                }

                // Puntos
                if(p.x + pipeW <= 0) {
                    this.items.shift();
                    score++;
                    scoreSnd.currentTime = 0; scoreSnd.play().catch(()=>{});
                    if(score >= WIN_SCORE) startCinematicEnding();
                }
            }
        },
        draw: function() {
            for(let i = 0; i < this.items.length; i++) {
                let p = this.items[i];
                let pipeH = 300;
                
                // --- 🟢 CAMBIO 2: ESTILO DE BARRAS MEJORADO ---
                if(imgObstacle.complete && imgObstacle.naturalHeight !== 0) {
                    // Si tienes imagen, la dibujamos normal
                    ctx.drawImage(imgObstacle, p.x, p.y, 50, pipeH);
                    ctx.drawImage(imgObstacle, p.x, p.y + pipeH + this.gap, 50, pipeH);
                } else {
                    // Si NO hay imagen (o falla), dibujamos barras bonitas rosas
                    ctx.fillStyle = "#f8bbd0"; // Rosa claro (Relleno)
                    ctx.strokeStyle = "#880e4f"; // Borde oscuro
                    ctx.lineWidth = 2;

                    // Tubo Arriba
                    ctx.fillRect(p.x, p.y, 50, pipeH);
                    ctx.strokeRect(p.x, p.y, 50, pipeH);
                    
                    // Tubo Abajo
                    ctx.fillRect(p.x, p.y + pipeH + this.gap, 50, pipeH);
                    ctx.strokeRect(p.x, p.y + pipeH + this.gap, 50, pipeH);
                }
            }
        },
        reset: function() { this.items = []; }
    };

    // --- GAME LOOP ---
    function loop() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (gameState === 'PLAYING') {
            monky.draw(); monky.update();
            pipes.draw(); pipes.update();
            drawScore();
            frames++;
            gameLoopId = requestAnimationFrame(loop);
        } 
        else if (gameState === 'MOVING_TO_HUG') {
            animateEnding();
            gameLoopId = requestAnimationFrame(loop);
        }
    }

    function drawScore() {
        ctx.fillStyle = "#FFF"; ctx.strokeStyle = "#880e4f";
        ctx.lineWidth = 3; ctx.font = "40px Fredoka";
        ctx.strokeText(score, canvas.width/2 - 10, 60);
        ctx.fillText(score, canvas.width/2 - 10, 60);
    }

    // --- FUNCIONES CONTROL ---
    function iniciarJuego() {
        startScreen.classList.add("hidden");
        gameState = 'PLAYING';
        score = 0; frames = 0;
        monky.y = 250; monky.speed = 0;
        pipes.reset();
        
        winSnd.volume = 0; 
        winSnd.play().then(() => {
            winSnd.pause(); winSnd.currentTime = 0;
        }).catch(() => {});

        loop();
    }

    function reiniciarJuego() {
        gameOverScreen.classList.add("hidden");
        gameState = 'PLAYING';
        score = 0; frames = 0;
        monky.y = 250; monky.speed = 0;
        pipes.reset();
        loop();
    }

    function gameOver() {
        gameState = 'END';
        cancelAnimationFrame(gameLoopId);
        gameOverScreen.classList.remove("hidden");
    }

    // --- 🟢 CAMBIO 3: FINAL CINEMÁTICO LENTO ---
    let goalX = 250; let goalY = 250;
    
    function startCinematicEnding() {
        gameState = 'MOVING_TO_HUG';
        pipes.items = []; // Limpiamos obstáculos
        
        // Colocamos a la Monky Meta un poco lejos para que el viaje dure más
        goalX = canvas.width - 70; 
        goalY = canvas.height / 2 - 30; // Centrada verticalmente
    }

    function animateEnding() {
        // Dibujar a Sofi (Meta)
        if(imgGoal.complete) ctx.drawImage(imgGoal, goalX, goalY, 60, 60);
        
        // Calcular distancia
        let dx = goalX - monky.x;
        let dy = goalY - monky.y;
        
        // MOVIMIENTO SUAVE Y LENTO
        // Antes era 0.05 (rápido). Ahora es 0.015 (muy lento y suave)
        monky.x += dx * 0.015; 
        monky.y += dy * 0.015;
        
        monky.draw();

        // Detectar si llegaron (cuando están muy cerca)
        if (Math.abs(dx) < 5 && Math.abs(dy) < 5) triggerFinalHug();
    }

    function triggerFinalHug() {
        gameState = 'END';
        cancelAnimationFrame(gameLoopId);
        finalScreen.classList.remove("hidden");
        
        winSnd.volume = 1.0; winSnd.play().catch(()=>{});
        
        gifLogro.style.display = 'block';
        let src = gifLogro.src; gifLogro.src = ''; gifLogro.src = src;

        var defaults = { spread: 360, ticks: 100, gravity: 0, decay: 0.94, startVelocity: 30 };
        confetti({ ...defaults, particleCount: 100, scalar: 1.2, shapes: ['heart'] });

        setTimeout(() => { gifLogro.style.display = 'none'; }, 9950);
    }

    // --- LISTENERS ---
    btnStart.addEventListener('click', iniciarJuego);
    btnRetry.addEventListener('click', reiniciarJuego);

    window.addEventListener("touchstart", (e) => { 
        if(e.target.tagName !== 'BUTTON') { e.preventDefault(); monky.flap(); }
    }, {passive: false});
    
    window.addEventListener("click", (e) => {
        if(e.target.tagName !== 'BUTTON') monky.flap();
    });
});
