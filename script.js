document.addEventListener('DOMContentLoaded', () => {

    // --- 1. CONFIGURACIÓN DE PANTALLA ---
    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");
    
    // Ajuste para que ocupe toda la pantalla del celular sin bordes
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas(); 

    // --- 2. RECURSOS (Imágenes y Audio) ---
    // Nota: Ya no usamos 'obstaculo.png' porque dibujaremos las barras rosadas
    const imgPlayer = new Image(); imgPlayer.src = "fotos/monky-viajero.png";
    const imgGoal = new Image();   imgGoal.src = "fotos/monky-meta.png"; 
    
    // Elementos del HTML
    const startScreen = document.getElementById("startScreen");
    const gameOverScreen = document.getElementById("gameOverScreen");
    const finalScreen = document.getElementById("finalScreen");
    const achievementLayer = document.getElementById("achievement-layer");
    const achievementGif = document.getElementById("achievement-gif");
    
    // Sonidos
    const jumpSnd = document.getElementById("jumpSound");
    const scoreSnd = document.getElementById("scoreSound");
    const winSnd = document.getElementById("winSound");

    // Variables de Juego
    let frames = 0;
    let score = 0;
    let gameLoopId;
    let gameState = 'START'; 
    const WIN_SCORE = 7; // Meta de puntos

    // --- 3. EL JUGADOR (MONKY) ---
    const monky = {
        x: 50, 
        y: canvas.height / 2, 
        width: 60, height: 60,
        speed: 0, 
        gravity: 0.18, // Gravedad suave
        jump: 4.0,     // Salto controlado
        
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
                
                // Techo y Suelo
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

    // --- 4. LOS OBSTÁCULOS (BARRAS ROSAS) ---
    const pipes = {
        items: [], 
        dx: 3,       // Velocidad normal
        gap: 220,    // 🟢 HUECO GIGANTE (Fácil de pasar)
        
        update: function() {
            if (gameState !== 'PLAYING') return;

            // Generar cada 140 frames (bastante espacio entre columnas)
            if(frames % 140 === 0) { 
                // Calculamos altura aleatoria
                // (El -200 asegura que no queden muy pegadas al borde)
                let maxPos = canvas.height - this.gap - 100;
                let minPos = 100;
                let yPos = Math.floor(Math.random() * (maxPos - minPos)) + minPos;
                
                // Guardamos la posición Y donde EMPIEZA el hueco
                this.items.push({ x: canvas.width, y: yPos });
            }

            for(let i = 0; i < this.items.length; i++) {
                let p = this.items[i];
                p.x -= this.dx;

                // 🟢 ANCHO: 65px (Gorditas y bonitas)
                let pipeW = 65; 
                
                // COLISIONES
                // Hitbox con margen de 10px (perdonador)
                let m = 10; 
                
                // Lógica: Si el monky está dentro del ancho de la tubería...
                if (monky.x + m < p.x + pipeW && monky.x + monky.width - m > p.x) {
                    // Y si está tocando la barra de arriba (0 a y) O la de abajo (y+gap a fin)
                    if (monky.y + m < p.y || monky.y + monky.height - m > p.y + this.gap) {
                        gameOver();
                    }
                }

                // PUNTOS
                if(p.x + pipeW <= 0) {
                    this.items.shift();
                    score++;
                    scoreSnd.currentTime = 0; 
                    scoreSnd.play().catch(()=>{});
                    
                    if(score >= WIN_SCORE) startCinematicEnding();
                }
            }
        },
        
        draw: function() {
            for(let i = 0; i < this.items.length; i++) {
                let p = this.items[i];
                let pipeW = 65;

                // Configuración de estilo "Barra Rosa"
                ctx.fillStyle = "#ffcdd2"; // Rosa pastel (Relleno)
                ctx.strokeStyle = "#880e4f"; // Borde oscuro
                ctx.lineWidth = 3;

                // 1. TUBO DE ARRIBA (Desde el cielo hasta p.y)
                ctx.fillRect(p.x, 0, pipeW, p.y);
                ctx.strokeRect(p.x, -5, pipeW, p.y + 5); // -5 para ocultar borde superior

                // 2. TUBO DE ABAJO (Desde p.y + gap hasta el suelo)
                let bottomY = p.y + this.gap;
                let bottomH = canvas.height - bottomY;
                
                ctx.fillRect(p.x, bottomY, pipeW, bottomH);
                ctx.strokeRect(p.x, bottomY, pipeW, bottomH + 5); // +5 para ocultar borde inferior
            }
        }
    },
    pipes.reset = function() { this.items = []; };

    // --- 5. BUCLE DEL JUEGO ---
    function loop() {
        // Limpiar pantalla
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
        ctx.lineWidth = 4; ctx.font = "bold 45px Fredoka";
        ctx.strokeText(score, canvas.width/2 - 15, 80);
        ctx.fillText(score, canvas.width/2 - 15, 80);
    }

    // --- 6. FUNCIONES DE CONTROL (Globales) ---
    
    // Iniciar
    window.iniciarJuego = function() {
        startScreen.classList.add("invisible");
        gameState = 'PLAYING';
        score = 0; frames = 0;
        monky.y = canvas.height / 2; monky.speed = 0;
        pipes.reset();
        
        // Hack audio iOS
        winSnd.volume = 0; 
        winSnd.play().then(()=>{ winSnd.pause(); winSnd.currentTime=0; }).catch(()=>{});
        
        loop();
    };

    // Reiniciar
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

    // --- 7. FINAL CINEMÁTICO ---
    let goalX = 0; let goalY = 0;
    
    function startCinematicEnding() {
        gameState = 'MOVING_TO_HUG';
        pipes.items = []; // Limpiar pantalla
        goalX = canvas.width * 0.8; // Meta a la derecha
        goalY = canvas.height / 2 - 35;
    }

    function animateEnding() {
        if(imgGoal.complete) ctx.drawImage(imgGoal, goalX, goalY, 70, 70);
        
        let dx = goalX - monky.x;
        let dy = goalY - monky.y;
        
        // Movimiento super lento y romántico (0.008)
        monky.x += dx * 0.008; 
        monky.y += dy * 0.008;
        
        monky.draw();

        if (Math.abs(dx) < 5 && Math.abs(dy) < 5) triggerFinalHug();
    }

    function triggerFinalHug() {
        gameState = 'END';
        cancelAnimationFrame(gameLoopId);

        // 1. Sonido
        winSnd.volume = 1.0; winSnd.play().catch(()=>{});

        // 2. Mostrar Pantallas (INSTANTÁNEO)
        finalScreen.classList.add("show-instant");
        achievementLayer.classList.add("show-instant");
        
        // Reiniciar GIF
        let src = achievementGif.src; 
        achievementGif.src = ''; achievementGif.src = src;

        // 3. Confeti
        confetti({ spread: 360, ticks: 150, gravity: 0, decay: 0.92, startVelocity: 45, particleCount: 150, scalar: 1.2, shapes: ['heart'] });

        setTimeout(() => { achievementLayer.classList.remove("show-instant"); }, 8000);
    }

    // --- 8. CONTROLES DE TOQUE ---
    const handleInput = (e) => {
        if(e.target.tagName !== 'BUTTON') {
            if(e.type === 'touchstart') e.preventDefault();
            monky.flap();
        }
    };
    window.addEventListener("touchstart", handleInput, {passive: false});
    window.addEventListener("mousedown", handleInput);
});
