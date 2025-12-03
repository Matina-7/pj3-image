// Game Constants
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const LEVEL_WIDTH = 3500;
const GAME_TIME = 90;
const REQUIRED_COINS = 7;
const PLAYER_DRAW_X = 200; // Fixed position where player is drawn

// Game State
let gameState = 'start'; // start, playing, paused, ended
let gameTime = GAME_TIME;
let collectedCoins = 0;
let lastTime = 0;
let cameraX = 0;

// Player
let player = {
    x: 100,
    y: 400,
    width: 50,
    height: 50,
    velocityX: 0,
    velocityY: 0,
    speed: 5,
    jumpPower: 18,
    gravity: 1.1,
    isGrounded: false,
    jumpsLeft: 2,
    canDash: false,
    isDashing: false
};

// Power-up effects
let activePowerUp = null;
let powerUpTimer = 0;

// Dialogue system
let dialoguePoints = [900, 1800, 2600];
let currentDialogueIndex = 0;

// Game objects
let platforms = [];
let monsters = [];
let coins = [];
let images = {};

// Input handling
let keys = {};

// DOM Elements
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('startScreen');
const gameContainer = document.getElementById('gameContainer');
const endingScreen = document.getElementById('endingScreen');
const dialogueBox = document.getElementById('dialogueBox');
const coinCountEl = document.getElementById('coinCount');
const timerEl = document.getElementById('timer');

// Load images
function loadImages() {
    const imagesList = [
        { name: 'player', src: 'assets/image1.png' },
        { name: 'monster', src: 'assets/image2.png' },
        { name: 'coin', src: 'assets/image3.png' },
        { name: 'bg', src: 'assets/image4.png' }
    ];

    let loadedCount = 0;

    imagesList.forEach(img => {
        const image = new Image();
        image.src = img.src;
        image.onload = () => {
            loadedCount++;
            if (loadedCount === imagesList.length) {
                console.log('All images loaded');
            }
        };
        image.onerror = () => {
            console.warn(`Image ${img.src} not found, using placeholder`);
            loadedCount++;
        };
        images[img.name] = image;
    });
}

// Initialize game objects
function initGameObjects() {
    // Create 8 platforms
    platforms = [
        { x: 0, y: 550, width: 300, height: 50 },
        { x: 400, y: 480, width: 200, height: 50 },
        { x: 700, y: 420, width: 180, height: 50 },
        { x: 1000, y: 500, width: 220, height: 50 },
        { x: 1350, y: 450, width: 200, height: 50 },
        { x: 1700, y: 380, width: 250, height: 50 },
        { x: 2100, y: 480, width: 200, height: 50 },
        { x: 2500, y: 420, width: 300, height: 50 },
        { x: 2900, y: 500, width: 600, height: 50 }
    ];

    // Create 7 monsters
    monsters = [
        { x: 500, y: 430, width: 40, height: 40 },
        { x: 850, y: 370, width: 40, height: 40 },
        { x: 1200, y: 450, width: 40, height: 40 },
        { x: 1550, y: 400, width: 40, height: 40 },
        { x: 1900, y: 330, width: 40, height: 40 },
        { x: 2300, y: 430, width: 40, height: 40 },
        { x: 2700, y: 370, width: 40, height: 40 }
    ];

    // Create 10 coins
    coins = [
        { x: 350, y: 450, width: 30, height: 30, collected: false },
        { x: 600, y: 380, width: 30, height: 30, collected: false },
        { x: 900, y: 320, width: 30, height: 30, collected: false },
        { x: 1150, y: 400, width: 30, height: 30, collected: false },
        { x: 1450, y: 350, width: 30, height: 30, collected: false },
        { x: 1800, y: 280, width: 30, height: 30, collected: false },
        { x: 2000, y: 380, width: 30, height: 30, collected: false },
        { x: 2400, y: 320, width: 30, height: 30, collected: false },
        { x: 2700, y: 420, width: 30, height: 30, collected: false },
        { x: 3100, y: 400, width: 30, height: 30, collected: false }
    ];
}

// Reset game
function resetGame() {
    player.x = 100;
    player.y = 400;
    player.velocityX = 0;
    player.velocityY = 0;
    player.speed = 5;
    player.jumpPower = 18;
    player.gravity = 1.1;
    player.canDash = false;
    player.isDashing = false;
    player.isGrounded = false;
    player.jumpsLeft = 2;

    gameTime = GAME_TIME;
    collectedCoins = 0;
    cameraX = 0;
    currentDialogueIndex = 0;
    activePowerUp = null;
    powerUpTimer = 0;

    initGameObjects();
    updateHUD();
}

// Start game
document.getElementById('startButton').addEventListener('click', () => {
    startScreen.style.display = 'none';
    gameContainer.style.display = 'block';
    gameState = 'playing';
    resetGame();
    requestAnimationFrame(gameLoop);
});

// Restart game
document.getElementById('restartButton').addEventListener('click', () => {
    location.reload();
});

// Dialogue selection
document.querySelectorAll('.option-button').forEach(button => {
    button.addEventListener('click', (e) => {
        const item = e.currentTarget.getAttribute('data-item');
        activatePowerUp(item);
        dialogueBox.style.display = 'none';
        gameState = 'playing';
    });
});

// Activate power-up
function activatePowerUp(item) {
    activePowerUp = item;
    powerUpTimer = 5000; // 5 seconds

    switch(item) {
        case 'spring':
            player.jumpPower = 28;
            break;
        case 'fish':
            player.speed = 9;
            player.canDash = true;
            break;
        case 'balloon':
            player.gravity = 0.3;
            break;
    }
}

// Update power-up
function updatePowerUp(deltaTime) {
    if (activePowerUp && powerUpTimer > 0) {
        powerUpTimer -= deltaTime;

        if (powerUpTimer <= 0) {
            // Reset to normal
            player.jumpPower = 18;
            player.speed = 5;
            player.gravity = 1.1;
            player.canDash = false;
            player.isDashing = false;
            activePowerUp = null;
        }
    }
}

// Keyboard input
window.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;

    // Jump (W key)
    if (e.key.toLowerCase() === 'w' && gameState === 'playing') {
        if (player.jumpsLeft > 0) {
            player.velocityY = -player.jumpPower;
            player.jumpsLeft--;
            player.isGrounded = false;
        }
    }

    // Dash (Shift key)
    if (e.key === 'Shift' && gameState === 'playing' && player.canDash && !player.isDashing) {
        player.isDashing = true;
        player.velocityX = 15;
        setTimeout(() => {
            player.isDashing = false;
        }, 200);
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

// Update player
function updatePlayer(deltaTime) {
    // Horizontal movement
    if (keys['a']) {
        player.velocityX = -player.speed;
    } else if (keys['d']) {
        player.velocityX = player.speed;
    } else if (!player.isDashing) {
        player.velocityX *= 0.8;
    }

    // Apply gravity
    player.velocityY += player.gravity;

    // Update position
    player.x += player.velocityX;
    player.y += player.velocityY;

    // Prevent going backwards
    if (player.x < cameraX) {
        player.x = cameraX;
    }

    // Ground collision
    let wasGrounded = player.isGrounded;
    player.isGrounded = false;

    // Platform collision
    platforms.forEach(platform => {
        if (checkCollision(player, platform)) {
            if (player.velocityY > 0 && player.y + player.height - player.velocityY <= platform.y) {
                player.y = platform.y - player.height;
                player.velocityY = 0;
                player.isGrounded = true;
                player.jumpsLeft = 2;
            }
        }
    });

    // Bottom boundary
    if (player.y + player.height >= CANVAS_HEIGHT) {
        player.y = CANVAS_HEIGHT - player.height;
        player.velocityY = 0;
        player.isGrounded = true;
        player.jumpsLeft = 2;
    }

    // Update camera to follow player (but keep player drawn at fixed x position)
    cameraX = player.x - PLAYER_DRAW_X;
    if (cameraX < 0) cameraX = 0;
    if (cameraX > LEVEL_WIDTH - CANVAS_WIDTH) cameraX = LEVEL_WIDTH - CANVAS_WIDTH;
}

// Check collision
function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

// Check monster collision
function checkMonsterCollision() {
    monsters.forEach(monster => {
        if (checkCollision(player, monster)) {
            // Reset game
            resetGame();
        }
    });
}

// Check coin collection
function checkCoinCollection() {
    coins.forEach(coin => {
        if (!coin.collected && checkCollision(player, coin)) {
            coin.collected = true;
            collectedCoins++;
            updateHUD();
        }
    });
}

// Check dialogue trigger
function checkDialogueTrigger() {
    if (currentDialogueIndex < dialoguePoints.length) {
        if (player.x >= dialoguePoints[currentDialogueIndex]) {
            gameState = 'paused';
            dialogueBox.style.display = 'block';
            currentDialogueIndex++;
        }
    }
}

// Check win condition
function checkWinCondition() {
    if (player.x >= LEVEL_WIDTH - 100 && collectedCoins >= REQUIRED_COINS) {
        endGame(true);
    }
}

// Update timer
function updateTimer(deltaTime) {
    gameTime -= deltaTime / 1000;
    if (gameTime <= 0) {
        gameTime = 0;
        endGame(false);
    }
    updateHUD();
}

// Update HUD
function updateHUD() {
    coinCountEl.textContent = `${collectedCoins} / 10`;
    timerEl.textContent = `${Math.ceil(gameTime)}s`;
}

// End game
function endGame(isWin) {
    gameState = 'ended';
    gameContainer.style.display = 'none';
    endingScreen.style.display = 'flex';

    const endingTitle = document.getElementById('endingTitle');
    const endingMessage = document.getElementById('endingMessage');
    const endingStats = document.getElementById('endingStats');

    if (isWin) {
        endingTitle.textContent = '🎉 Victory! 🎉';
        endingTitle.style.color = '#4CAF50';
        endingMessage.textContent = 'The Siamese cat made it home safely! You are a true hero!';
        endingStats.innerHTML = `
            <p>⭐ Coins Collected: ${collectedCoins} / 10</p>
            <p>⏱️ Time Remaining: ${Math.ceil(gameTime)}s</p>
            <p>🏆 Status: Mission Complete!</p>
        `;
    } else {
        endingTitle.textContent = '⏰ Time\'s Up! ⏰';
        endingTitle.style.color = '#ff6b9d';
        endingMessage.textContent = 'The Siamese cat ran out of time... Try again!';
        endingStats.innerHTML = `
            <p>⭐ Coins Collected: ${collectedCoins} / 10</p>
            <p>⏱️ Time Used: ${GAME_TIME}s</p>
            <p>💭 Tip: Move faster and collect more coins!</p>
        `;
    }
}

// Draw background
function drawBackground() {
    // Draw repeating background
    if (images.bg && images.bg.complete) {
        const bgWidth = images.bg.width || 256;
        const bgHeight = images.bg.height || 256;
        const startX = Math.floor(cameraX / bgWidth) * bgWidth - cameraX;

        for (let x = startX; x < CANVAS_WIDTH; x += bgWidth) {
            for (let y = 0; y < CANVAS_HEIGHT; y += bgHeight) {
                ctx.drawImage(images.bg, x, y, bgWidth, bgHeight);
            }
        }
    } else {
        // Fallback sky gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
        gradient.addColorStop(0, '#87ceeb');
        gradient.addColorStop(1, '#e0f6ff');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }
}

// Draw platforms
function drawPlatforms() {
    ctx.fillStyle = '#8b4513';
    platforms.forEach(platform => {
        const drawX = platform.x - cameraX;
        if (drawX + platform.width > 0 && drawX < CANVAS_WIDTH) {
            ctx.fillRect(drawX, platform.y, platform.width, platform.height);

            // Add some detail
            ctx.strokeStyle = '#654321';
            ctx.lineWidth = 2;
            ctx.strokeRect(drawX, platform.y, platform.width, platform.height);
        }
    });
}

// Draw monsters
function drawMonsters() {
    monsters.forEach(monster => {
        const drawX = monster.x - cameraX;
        if (drawX + monster.width > 0 && drawX < CANVAS_WIDTH) {
            if (images.monster && images.monster.complete) {
                ctx.drawImage(images.monster, drawX, monster.y, monster.width, monster.height);
            } else {
                // Fallback
                ctx.fillStyle = '#ff0000';
                ctx.fillRect(drawX, monster.y, monster.width, monster.height);
                ctx.fillStyle = '#fff';
                ctx.font = '20px Arial';
                ctx.fillText('👹', drawX + 10, monster.y + 30);
            }
        }
    });
}

// Draw coins
function drawCoins() {
    coins.forEach(coin => {
        if (!coin.collected) {
            const drawX = coin.x - cameraX;
            if (drawX + coin.width > 0 && drawX < CANVAS_WIDTH) {
                if (images.coin && images.coin.complete) {
                    ctx.drawImage(images.coin, drawX, coin.y, coin.width, coin.height);
                } else {
                    // Fallback
                    ctx.fillStyle = '#FFD700';
                    ctx.beginPath();
                    ctx.arc(drawX + coin.width/2, coin.y + coin.height/2, coin.width/2, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }
    });
}

// Draw player
function drawPlayer() {
    // Player is always drawn at PLAYER_DRAW_X position
    if (images.player && images.player.complete) {
        ctx.drawImage(images.player, PLAYER_DRAW_X, player.y, player.width, player.height);
    } else {
        // Fallback
        ctx.fillStyle = '#ff6b9d';
        ctx.fillRect(PLAYER_DRAW_X, player.y, player.width, player.height);
        ctx.fillStyle = '#fff';
        ctx.font = '30px Arial';
        ctx.fillText('🐱', PLAYER_DRAW_X + 10, player.y + 35);
    }

    // Draw power-up indicator
    if (activePowerUp && powerUpTimer > 0) {
        ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
        ctx.fillRect(PLAYER_DRAW_X - 5, player.y - 5, player.width + 10, player.height + 10);

        // Draw power-up icon
        ctx.font = '20px Arial';
        let icon = '';
        switch(activePowerUp) {
            case 'spring': icon = '🦘'; break;
            case 'fish': icon = '🐟'; break;
            case 'balloon': icon = '🎈'; break;
        }
        ctx.fillText(icon, PLAYER_DRAW_X + player.width + 10, player.y + 20);
    }
}

// Draw progress indicator
function drawProgress() {
    const progress = player.x / LEVEL_WIDTH;
    const barWidth = 200;
    const barHeight = 10;
    const barX = CANVAS_WIDTH - barWidth - 20;
    const barY = 20;

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    // Progress
    ctx.fillStyle = '#4CAF50';
    ctx.fillRect(barX, barY, barWidth * progress, barHeight);

    // Border
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(barX, barY, barWidth, barHeight);

    // Text
    ctx.fillStyle = '#fff';
    ctx.font = '12px Arial';
    ctx.fillText('Progress', barX, barY - 5);
}

// Game loop
function gameLoop(timestamp) {
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw background
    drawBackground();

    // Draw game objects
    drawPlatforms();
    drawMonsters();
    drawCoins();
    drawPlayer();
    drawProgress();

    // Update game logic only when playing
    if (gameState === 'playing') {
        updatePlayer(deltaTime);
        updatePowerUp(deltaTime);
        checkMonsterCollision();
        checkCoinCollection();
        checkDialogueTrigger();
        checkWinCondition();
        updateTimer(deltaTime);
    }

    // Continue loop if not ended
    if (gameState !== 'ended') {
        requestAnimationFrame(gameLoop);
    }
}

// Initialize
loadImages();
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;
