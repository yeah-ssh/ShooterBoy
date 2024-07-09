let tileSize = 32;
let rows = 20;
let columns = 20;

let board;
let boardWidth = tileSize * columns;
let boardHeight = tileSize * rows;
let context;

let shipWidth = tileSize * 6;
let shipHeight = tileSize * 3;
let shipX = tileSize * columns / 2 - tileSize;
let shipY = tileSize * (rows - 3);

let bulletArray = [];
let bulletVelocityY = -10;

let ship = {
    x: shipX,
    y: shipY,
    width: shipWidth,
    height: shipHeight
};

let shipImg;
let shipVelocityX = tileSize;

let alienArray = [];
let alienWidth = tileSize * 2;
let alienHeight = tileSize * 2;
let alienX = tileSize;
let alienY = tileSize;
let alienImg;

let alienRows = 2;
let alienColumns = 3;
let alienCount = 0;

let alienVelocityX = 1;

let bossAlien;
let bossAlienImg;
let bossAlienWidth = tileSize * 4;
let bossAlienHeight = tileSize * 4;
let bossAlienHealth = 100;
let bossAlienVisible = false;

let bossMoveInterval;

let gameOver = false;
let score = 0;

window.onload = function () {
    const playButton = document.getElementById("play_button");
    playButton.addEventListener("click", startGame);
};

function startGame() {
    const playButton = document.getElementById("play_button");
    playButton.style.display = "none";

    board = document.getElementById("play_area");
    board.style.display = "block";
    board.width = boardWidth;
    board.height = boardHeight;
    context = board.getContext("2d");

    shipImg = new Image();
    shipImg.src = "./logo.png";
    shipImg.onload = function () {
        context.drawImage(shipImg, ship.x, ship.y, ship.width, ship.height);
    };

    alienImg = new Image();
    alienImg.src = "./ufo.png";

    bossAlienImg = new Image();
    bossAlienImg.src = "./boss1.png"; // Replace with the path to your boss alien image

    createAliens();
    requestAnimationFrame(update);
    document.addEventListener("keydown", moveShip);
    document.addEventListener("keyup", shoot);
}

function update() {
    if (gameOver) {
        showGameOver();
        return;
    }

    requestAnimationFrame(update);

    context.clearRect(0, 0, board.width, board.height);

    context.drawImage(shipImg, ship.x, ship.y, ship.width, ship.height);

    if (bossAlienVisible) {
        updateBossAlien();
    } else {
        updateAliens();
        checkForBossAlien();
    }

    updateBullets();
    checkCollisions();

    // Display score
    context.fillStyle = "white";
    context.font = "24px Arial";
    context.fillText("Score: " + score, 10, 30);
}

function updateAliens() {
    for (let i = 0; i < alienArray.length; i++) {
        let alien = alienArray[i];
        if (alien.alive) {
            alien.x += alienVelocityX;

            if (alien.x + alien.width >= boardWidth || alien.x <= 0) {
                alienVelocityX *= -1;
                alien.x += alienVelocityX * 10;

                for (let j = 0; j < alienArray.length; j++) {
                    alienArray[j].y += alienHeight;
                }
            }

            context.drawImage(alien.img, alien.x, alien.y, alien.width, alien.height);
        }
    }
}

function checkForBossAlien() {
    if (alienCount === 0 && alienRows === 2 && alienColumns === Math.floor(columns / 2) - 2) {
        bossAlienVisible = true;
        bossAlien = {
            x: boardWidth / 2 - bossAlienWidth / 2,
            y: tileSize,
            width: bossAlienWidth,
            height: bossAlienHeight,
            health: bossAlienHealth
        };
        bossMoveInterval = setInterval(moveBossAlienRandomly, 1000);
    } else if (alienCount === 0) {
        alienColumns = Math.min(alienColumns + 1, columns / 2 - 2);
        alienVelocityX += 0.2;
        alienArray = [];
        bulletArray = [];
        createAliens();
    }
}

function updateBossAlien() {
    context.drawImage(bossAlienImg, bossAlien.x, bossAlien.y, bossAlien.width, bossAlien.height);

    // Draw health bar
    context.fillStyle = "red";
    context.fillRect(bossAlien.x, bossAlien.y - 20, bossAlien.width, 10);
    context.fillStyle = "green";
    context.fillRect(bossAlien.x, bossAlien.y - 20, bossAlien.width * (bossAlien.health / bossAlienHealth), 10);

    for (let i = 0; i < bulletArray.length; i++) {
        let bullet = bulletArray[i];
        if (!bullet.used && detectCollision(bullet, bossAlien)) {
            bullet.used = true;
            bossAlien.health -= 5;
            if (bossAlien.health <= 0) {
                bossAlienVisible = false;
                clearInterval(bossMoveInterval);
                score += 100; // Add score for killing the boss
                resetGame();
            }
        }
    }
}

function moveBossAlienRandomly() {
    let newX = Math.random() * (boardWidth - bossAlienWidth);
    let newY = Math.random() * (boardHeight - bossAlienHeight);
    bossAlien.x = newX;
    bossAlien.y = newY;
}

function updateBullets() {
    for (let i = 0; i < bulletArray.length; i++) {
        let bullet = bulletArray[i];
        bullet.y += bulletVelocityY;
        context.fillStyle = "white";
        context.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        for (let j = 0; j < alienArray.length; j++) {
            let alien = alienArray[j];
            if (!bullet.used && alien.alive && detectCollision(bullet, alien)) {
                bullet.used = true;
                alien.alive = false;
                alienCount--;
                score += 10; // Add score for killing an alien
            }
        }
    }

    while (bulletArray.length > 0 && (bulletArray[0].used || bulletArray[0].y < 0)) {
        bulletArray.shift();
    }
}

function moveShip(e) {
    if (e.code == "ArrowLeft" && ship.x - shipVelocityX >= 0) {
        ship.x -= shipVelocityX;
    } else if (e.code == "ArrowRight" && ship.x + shipVelocityX + ship.width <= board.width) {
        ship.x += shipVelocityX;
    }
}

function createAliens() {
    for (let c = 0; c < alienColumns; c++) {
        for (let r = 0; r < alienRows; r++) {
            let alien = {
                img: alienImg,
                x: alienX + c * alienWidth,
                y: alienY + r * alienHeight,
                width: alienWidth,
                height: alienHeight,
                alive: true
            };
            alienArray.push(alien);
        }
    }

    alienCount = alienArray.length;
}

function shoot(e) {
    if (e.code == "Space") {
        let bullet = {
            x: ship.x + shipWidth * 15 / 32,
            y: ship.y,
            width: tileSize / 8,
            height: tileSize / 2,
            used: false
        };
        bulletArray.push(bullet);
    }
}

function detectCollision(a, b) {
    return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

function checkCollisions() {
    for (let i = 0; i < alienArray.length; i++) {
        let alien = alienArray[i];
        if (alien.alive && detectCollision(alien, ship)) {
            gameOver = true;
        }
    }

    if (bossAlienVisible && detectCollision(bossAlien, ship)) {
        gameOver = true;
    }
}

function showGameOver() {
    context.fillStyle = "red";
    context.font = "48px Arial";
    context.textAlign = "center";
    context.fillText("Game Over", boardWidth / 2, boardHeight / 2);
}

function resetGame() {
    alienRows = 2;
    alienColumns = 3;
    alienVelocityX = 1;
    alienArray = [];
    bulletArray = [];
    bossAlienVisible = false;
    bossAlienHealth = 100;
    gameOver = false;
    createAliens();
}