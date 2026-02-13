document.addEventListener('DOMContentLoaded', () => {

    // --- 1. CONFIGURACIÓN INICIAL ---
    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");
    
    // Ajuste de Pantalla Completa (Responsive)
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas(); // Ajustar al cargar

    // --- 2. RECURSOS (Imágenes y Sonidos) ---
    const imgPlayer = new Image(); imgPlayer.src = "fotos/monky-viajero.png";
    const imgGoal = new Image();   imgGoal.src = "fotos/monky-meta.png"; 
    const imgObstacle = new Image(); imgObstacle.src = "fotos/obstaculo.png"; 
    
    // Referencias al HTML
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

    // Variables de Juego
    let frames = 0;
    let score = 0;
    let gameLoopId;
    let gameState = 'START'; 
    const WIN_SCORE = 7; // Meta de puntos

    // --- 3. OBJETOS DEL JUEGO ---
    
    // EL MONKY (Jugador)
    const monky = {
        x: 50, 
        y: canvas.height / 2, 
        width: 60, 
        height: 60,
        speed: 0, 
        gravity: 0.18, // Cae suave
        jump: 4.0,     // Salto controlado
        
        draw: function() {
            if(imgPlayer.complete && imgPlayer.naturalHeight !== 0) {
                ctx.drawImage(imgPlayer, this.x, this.y, this.width, this.height);
            } else {
                // Cuadro rosa si falla la imagen
                ctx.fillStyle = "#d81b60"; ctx.fillRect(this.x, this.y, this.width, this.height);
            }
        },
        update: function() {
            if (gameState === 'PLAYING') {
                this.speed += this.gravity;
                this.y += this.speed;
                
                // Límites de pantalla (Techo y Suelo)
                if(this.y + this.height >= canvas.height || this.y <= 0) {
                    gameOver();
                }
            }
        },
        flap: function() {
            if (gameState === 'PLAYING') {
                this.speed = -this.jump;
                jumpSnd.currentTime = 0; 
                jumpSnd.play().catch(()=>{});
            }
        }
    };

    // LOS OBSTÁCULOS (Tuberías)
    const pipes = {
        items: [], 
        dx: 2.5,     // 🟢 VELOCIDAD: Lenta para que sea fácil
        gap: 220,    // 🟢 HUECO: Gigante (220px) para pasar sobrado
        
        update: function() {
            if (gameState !== 'PLAYING') return;

            // Generar obstáculos cada cierto tiempo (según ancho de pantalla)
            if(frames % 140 === 0) { 
                // Calculamos posición aleatoria
                let yPos = Math.floor(Math.random() * (canvas.height - this.gap - 100)) - 100;
                this.items.push({ x: canvas.width, y: yPos });
            }

            for(let i = 0; i < this.items.length; i++) {
                let p = this.items[i];
                p.x -= this.dx;

                // 🟢 ANCHO: Delgado (50px)
                let pipeW = 50; 
                let pipeH = canvas.height; // Altura segura para cubrir pantalla

                // DETECCIÓN DE COLISIÓN (HITBOX PERMISIVA)
                // Le sumamos/restamos 10px al monky para que si roza la orilla NO muera.
                let hitboxMargin = 10;

                if (
                    (monky.x + hitboxMargin) < p.x + pipeW && 
                    (monky.x + monky.width - hitboxMargin) > p.x &&
                    (
                        (monky.y + hitboxMargin) < p.y + pipeH || 
                        (monky.y + monky.height - hitboxMargin) > p.y + pipeH + this.gap
                    )
                ) {
                    gameOver();
                }

                // CONTADOR DE PUNTOS
                if(p.x + pipeW <= 0) {
                    this.items.shift();
                    score++;
                    scoreSnd.currentTime = 0; 
                    scoreSnd.play().catch(()=>{});
                    
                    // GANAR
                    if(score >= WIN_SCORE) startCinematicEnding();
                }
            }
        },
        draw: function() {
            for(let i = 0; i < this.items.length; i++) {
                let p = this.items[i];
                let pipeH = canvas.height;
                
                // Dibujar Imagen o Rectángulo
                if(imgObstacle.complete && imgObstacle.naturalHeight !== 0) {
                    ctx.drawImage(imgObstacle, p.x, p.y, 50, pipeH);
                    ctx.drawImage(imgObstacle, p.x, p.y + pipeH + this.gap, 50, pipeH);
                } else {
                    // Estilo por defecto si no hay imagen
                    ctx.fillStyle = "#f8bbd0"; ctx.strokeStyle = "#880e4f"; ctx.lineWidth = 3;
                    ctx.fillRect(p.x, p.y, 50, pipeH); ctx.strokeRect(p.x, p.y, 50, pipeH);
                    ctx.fillRect(p.x, p.y + pipeH + this.gap, 50, pipeH); ctx.strokeRect(p.x, p.y + pipeH + this.gap, 50, pipeH);
                }
            }
        },
        reset: function() { this.items = []; }
    };

    // --- 4. BUCLE PRINCIPAL (Game Loop) ---
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
        ctx.lineWidth = 4; ctx.font = "bold 40px Fredoka";
        ctx.strokeText(score, canvas.width/2 - 15, 80);
        ctx.fillText(score, canvas.width/2 - 15, 80);
    }

    // --- 5. FUNCIONES DE CONTROL ---
    
    // Función global para el botón de inicio
    window.iniciarJuego = function() {
        startScreen.classList.add("invisible");
        gameState = 'PLAYING';
        score = 0; frames = 0;
        monky.y = canvas.height / 2; monky.speed = 0;
        pipes.reset();
        
        // Precargar sonido de victoria (hack para iOS)
        winSnd.volume = 0; 
        winSnd.play().then(()=>{ winSnd.pause(); winSnd.currentTime=0; }).catch(()=>{});
        
        loop();
    };

    window.reiniciarJuego = function() {
        gameOverScreen.classList.add("invisible");
        gameState = 'PLAYING';
        score = 0; frames = 0;
        monky.y = canvas.height / 2; monky.speed = 0;
        pipes.reset();
        loop();
    };

    function gameOver() {
        gameState = 'END';
        cancelAnimationFrame(gameLoopId);
        gameOverScreen.classList.remove("invisible");
    }

    // --- 6. CINEMÁTICA FINAL ---
    let goalX = 0; let goalY = 0;
    
    function startCinematicEnding() {
        gameState = 'MOVING_TO_HUG';
        pipes.items = []; // Limpiar obstáculos
        // Meta a la derecha de la pantalla
        goalX = canvas.width * 0.8;
        goalY = canvas.height / 2 - 35;
    }

    function animateEnding() {
        // Dibujar a Sofi (Meta)
        if(imgGoal.complete) ctx.drawImage(imgGoal, goalX, goalY, 70, 70);
        
        // Mover a Monky hacia ella suavemente
        let dx = goalX - monky.x;
        let dy = goalY - monky.y;
        
        monky.x += dx * 0.015; // Velocidad de acercamiento
        monky.y += dy * 0.015;
        
        monky.draw();

        // Si están muy cerca -> ABRAZO
        if (Math.abs(dx) < 5 && Math.abs(dy) < 5) {
            triggerFinalHug();
        }
    }

    function triggerFinalHug() {
        gameState = 'END';
        cancelAnimationFrame(gameLoopId);

        // 1. Sonido
        winSnd.volume = 1.0; 
        winSnd.play().catch(()=>{});

        // 2. Mostrar Pantallas (INSTANTÁNEO)
        finalScreen.classList.add("show-instant");
        achievementLayer.classList.add("show-instant");
        
        // Reiniciar GIF para que se mueva desde el principio
        let src = achievementGif.src; 
        achievementGif.src = ''; 
        achievementGif.src = src;

        // 3. Confeti
        confetti({ 
            spread: 360, ticks: 150, gravity: 0, decay: 0.92, 
            startVelocity: 45, particleCount: 150, scalar: 1.2, shapes: ['heart'] 
        });

        // Ocultar logro después de 8 segundos
        setTimeout(() => { 
            achievementLayer.classList.remove("show-instant"); 
        }, 8000);
    }

    // --- 7. CONTROLES DE ENTRADA (Touch y Click) ---
    const handleInput = (e) => {
        // Evitar saltar si tocamos un botón
        if(e.target.tagName !== 'BUTTON') {
            if(e.type === 'touchstart') e.preventDefault(); // Prevenir scroll
            monky.flap();
        }
    };
    
    window.addEventListener("touchstart", handleInput, {passive: false});
    window.addEventListener("mousedown", handleInput);

});
