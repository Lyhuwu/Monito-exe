document.addEventListener('DOMContentLoaded', () => {
    // --- INICIALIZACIÓN DEL SISTEMA ---
    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");
    
    // Ajuste dinámico de resolución para Pantalla Completa Real
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        // Recalcular posiciones relativas si el juego está activo
        if (gameState === 'PLAYING') monky.y = canvas.height / 2;
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas(); // Primera llamada al cargar

    // Recursos
    const imgPlayer = new Image(); imgPlayer.src = "fotos/monky-viajero.png";
    const imgGoal = new Image();   imgGoal.src = "fotos/monky-meta.png"; 
    const imgObstacle = new Image(); imgObstacle.src = "fotos/obstaculo.png"; 
    
    // Referencias DOM (UI)
    const startScreen = document.getElementById("startScreen");
    const gameOverScreen = document.getElementById("gameOverScreen");
    const finalScreen = document.getElementById("finalScreen");
    const achievementLayer = document.getElementById("achievement-layer");
    const achievementGif = document.getElementById("achievement-gif");
    const btnStart = document.getElementById("btnStart");
    const btnRetry = document.getElementById("btnRetry");

    // Audio
    const jumpSnd = document.getElementById("jumpSound");
    const scoreSnd = document.getElementById("scoreSound");
    const winSnd = document.getElementById("winSound");

    // Variables de Estado
    let frames = 0;
    let score = 0;
    let gameLoopId;
    let gameState = 'START'; 
    const WIN_SCORE = 7; 

    // --- ENTIDADES DEL JUEGO ---
    const monky = {
        x: 50, y: canvas.height / 2, width: 60, height: 60, // Un poco más grande para pantallas full
        speed: 0, gravity: 0.2, jump: 4.5,
        
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
                // Colisiones con límites de pantalla
                if(this.y + this.height >= canvas.height || this.y <= 0) gameOver();
            }
        },
        flap: function() {
            if (gameState === 'PLAYING') {
                this.speed = -this.jump;
                jumpSnd.currentTime = 0; jumpSnd.play().catch(()=>{});
            }
        }
    };

    const pipes = {
        items: [], dx: 3, gap: 180, // Ajustado para fullscreen
        
        update: function() {
            if (gameState !== 'PLAYING') return;

            // Generación dinámica basada en el ancho de pantalla
            if(frames % Math.floor(canvas.width / 3) === 0) {
                let yPos = Math.floor(Math.random() * (canvas.height - this.gap - 100)) - 100;
                this.items.push({ x: canvas.width, y: yPos });
            }

            for(let i = 0; i < this.items.length; i++) {
                let p = this.items[i];
                p.x -= this.dx;
                let pipeW = 80; // Obstáculos más anchos
                let pipeH = canvas.height; // Altura relativa

                // Lógica de Colisión Simplificada
                if (monky.x < p.x + pipeW && monky.x + monky.width > p.x &&
                    (monky.y < p.y + pipeH || monky.y + monky.height > p.y + pipeH + this.gap)) {
                    gameOver();
                }

                // Puntuación
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
                let pipeH = canvas.height; // Usar altura completa para asegurar cobertura
                
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

    // --- MOTOR DE RENDERIZADO ---
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
        ctx.lineWidth = 3; ctx.font = "bold 40px Fredoka";
        ctx.strokeText(score, canvas.width/2 - 15, 80);
        ctx.fillText(score, canvas.width/2 - 15, 80);
    }

    // --- CONTROL DE ESTADOS ---
    function iniciarJuego() {
        startScreen.classList.add("invisible");
        gameState = 'PLAYING';
        score = 0; frames = 0;
        monky.y = canvas.height / 2; monky.speed = 0;
        pipes.reset();
        // Precarga de audio crítico
        winSnd.volume = 0; winSnd.play().then(()=>{ winSnd.pause(); winSnd.currentTime=0; }).catch(()=>{});
        loop();
    }

    function reiniciarJuego() {
        gameOverScreen.classList.add("invisible");
        gameState = 'PLAYING';
        score = 0; frames = 0;
        monky.y = canvas.height / 2; monky.speed = 0;
        pipes.reset();
        loop();
    }

    function gameOver() {
        gameState = 'END';
        cancelAnimationFrame(gameLoopId);
        gameOverScreen.classList.remove("invisible");
    }

    // --- SECUENCIA FINAL ---
    let goalX = 0; let goalY = 0;
    
    function startCinematicEnding() {
        gameState = 'MOVING_TO_HUG';
        pipes.items = []; 
        // Posición relativa al tamaño de pantalla
        goalX = canvas.width * 0.8;
        goalY = canvas.height / 2 - 30;
    }

    function animateEnding() {
        if(imgGoal.complete) ctx.drawImage(imgGoal, goalX, goalY, 70, 70);
        
        let dx = goalX - monky.x;
        let dy = goalY - monky.y;
        // Velocidad cinemática
        monky.x += dx * 0.01; 
        monky.y += dy * 0.01;
        monky.draw();

        if (Math.abs(dx) < 5 && Math.abs(dy) < 5) triggerFinalHug();
    }

    function triggerFinalHug() {
        gameState = 'END';
        cancelAnimationFrame(gameLoopId);

        // EJECUCIÓN SINCRONIZADA INSTANTÁNEA
        // 1. Audio
        winSnd.volume = 1.0; winSnd.play().catch((e)=>console.warn("Audio bloqueado:", e));

        // 2. Visuales (Uso de clase show-instant para cero delay)
        finalScreen.classList.add("show-instant");
        achievementLayer.classList.add("show-instant");
        
        // Reiniciar GIF
        let src = achievementGif.src; achievementGif.src = ''; achievementGif.src = src;

        // 3. Efectos
        confetti({ spread: 360, ticks: 150, gravity: 0, decay: 0.92, startVelocity: 45, particleCount: 150, scalar: 1.2, shapes: ['heart'] });

        // Limpieza del logro
        setTimeout(() => { achievementLayer.classList.remove("show-instant"); }, 8000);
    }

    // --- INPUT HANDLERS ---
    btnStart.addEventListener('click', iniciarJuego);
    btnRetry.addEventListener('click', reiniciarJuego);

    const handleInput = (e) => {
        if(e.target.tagName !== 'BUTTON') {
            if(e.type === 'touchstart') e.preventDefault();
            monky.flap();
        }
    };
    window.addEventListener("touchstart", handleInput, {passive: false});
    window.addEventListener("mousedown", handleInput);
});
