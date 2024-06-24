const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
resizeCanvas();

let score = 0;
let highScore = localStorage.getItem('highScore') || 0;
let basketX = canvas.width / 2;
let lastBasketX = basketX;
let basketVelocity = 0;
let currentPaddle = 0;
const paddles = [
    { width: 115, height: 8, color: 'magenta' },
    { width: 105, height: 8, color: 'lime' },
    { width: 90, height: 8, color: 'blue' }
];
const basketBottomMargin = 80; // Margin from the bottom

const initialBallRadius = 7.5; // Reduced size by about 10%
const initialSpeed = 4; // Fixed initial speed
const maxIncrementSpeed = 6; // Maximum speed due to increments
const speedIncrement = 0.1; // Speed increment per score point
let balls = [];
let gameActive = false;
let powerUps = [];
let powerUpActive = false;
let powerUpType = '';
let powerUpTimeout;


function resizeCanvas() {
    const gameContainer = document.getElementById('gameContainer');
    canvas.width = gameContainer.clientWidth;
    canvas.height = gameContainer.clientHeight;
}

function drawBall(ball) {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = ball.color;
    ctx.shadowColor = ball.color;
    ctx.shadowBlur = 8 + ball.glowPulse; // Reduced glow size with pulse effect
    ctx.fill();
    ctx.closePath();
    ctx.shadowBlur = 0; // Reset shadowBlur after drawing
    ball.glowPulse = Math.max(0, ball.glowPulse - 1); // Decay glow pulse

    // Draw the spin indicator (3 smaller balls)
    drawSpinIndicator(ball);
}

function drawSpinIndicator(ball) {
    const spinMagnitude = Math.sqrt(ball.spinX * ball.spinX + ball.spinY * ball.spinY);
    const distance = Math.min(spinMagnitude * 5, ball.radius * 2); // Adjust the factor as needed
    const baseAngle = (Date.now() / 100) % (2 * Math.PI); // Adjust speed of rotation as needed

    for (let i = 0; i < 3; i++) {
        const angle = baseAngle + (i * 2 * Math.PI) / 3; // 120 degrees apart
        const indicatorX = ball.x + distance * Math.cos(angle);
        const indicatorY = ball.y + distance * Math.sin(angle);

        ctx.beginPath();
        ctx.arc(indicatorX, indicatorY, ball.radius / 3, 0, Math.PI * 2); // Smaller ball
        ctx.fillStyle = ball.color; // Same color as the main ball
        ctx.fill();
        ctx.closePath();

        // Draw the trail
        ctx.beginPath();
        ctx.moveTo(ball.x, ball.y);
        ctx.lineTo(indicatorX, indicatorY);
        ctx.strokeStyle = ball.color; // Trail color same as the ball color
        ctx.stroke();
        ctx.closePath();
    }
}

function drawBasket() {
    const paddle = paddles[currentPaddle];
    ctx.beginPath();
    ctx.rect(basketX, canvas.height - paddle.height - basketBottomMargin, paddle.width, paddle.height);
    ctx.fillStyle = paddle.color;
    ctx.fill();
    ctx.closePath();
}

function updateScore() {
    let displayScore = score;
    if (powerUpType === '2XScore') {
        displayScore = score * 2;
    }
    document.getElementById('score').innerText = 'Score: ' + displayScore;
    document.getElementById('highScore').innerText = 'High Score: ' + highScore;
}


function showGameOverModal() {
    const modal = document.getElementById('gameOverModal');
    document.getElementById('finalScore').innerText = score;
    modal.style.display = 'block';
}

function hideGameOverModal() {
    const modal = document.getElementById('gameOverModal');
    modal.style.display = 'none';
}

function resetGame() {
    score = 0;
    currentPaddle = 0; // Reset paddle to the first one
    balls = [
        createBall('cyan', initialSpeed)
    ];
    powerUps = [];
    powerUpActive = false;
    powerUpType = '';
    clearTimeout(powerUpTimeout);
    updateScore();
    gameActive = false;
    hideGameOverModal();
    hidePowerUpDisplay(); // Clear power-up display
    startCountdown();
}

function createBall(color, speed) {
    const angle = (30 + Math.random() * 15) * (Math.PI / 180); // Angle between 30-45 degrees
    const speedX = Math.cos(angle) * speed * (Math.random() < 0.5 ? -1 : 1);
    const speedY = Math.sin(angle) * speed;
    
    return {
        x: canvas.width / 2,
        y: 50,
        radius: initialBallRadius,
        speedX: speedX,
        speedY: speedY,
        color: color,
        spinX: 0,
        spinY: 0,
        speedBoost: 0,
        glowPulse: 0
    };
}


function addNewBall(color, speed) {
    balls.push(createBall(color, speed));
}

function createPowerUp() {
    const x = Math.random() * canvas.width;
    const y = 0;
    const type = Math.random() > 0.5 ? 'increasePaddle' : '2XScore';
    powerUps.push({ x, y, type });
}
function drawPowerUps() {
    powerUps.forEach(powerUp => {
        if (powerUp.type === 'increasePaddle') {
            ctx.font = "40px Arial"; // Adjust the font size as needed
            ctx.fillStyle = 'megenta';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText("±", powerUp.x, powerUp.y);
        }
        if (powerUp.type === '2XScore') {
            ctx.font = "30px Arial"; // Adjust the font size as needed
            ctx.fillStyle = 'lime';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText("2X", powerUp.x, powerUp.y);
        }
    });
}


function checkPowerUpCollision() {
    powerUps = powerUps.filter(powerUp => {
        const paddle = paddles[currentPaddle];
        if (powerUp.y + 10 > canvas.height - paddle.height - basketBottomMargin &&
            powerUp.y < canvas.height - paddle.height - basketBottomMargin + 10 &&
            powerUp.x > basketX && powerUp.x < basketX + paddle.width) {
            activatePowerUp(powerUp.type);
            return false;
        }
        return true;
    });
}

let powerUpTimerInterval;

function activatePowerUp(type) {
    if (powerUpActive) return; // Do not activate if another power-up is active

    powerUpActive = true;
    powerUpType = type;

    if (type === 'increasePaddle') {
        paddles[currentPaddle].width *= 1.75;
    }
    if (type === '2XScore') {
        score *= 2;
        updateScore();
    }

    showPowerUpDisplay(type, 15);
    powerUpTimeout = setTimeout(deactivatePowerUp, 15000);
}

function deactivatePowerUp() {
    if (powerUpType === 'increasePaddle') {
        paddles[currentPaddle].width /= 1.75; // Reset to the original width
    }

    powerUpActive = false;
    powerUpType = '';
    hidePowerUpDisplay();
    clearInterval(powerUpTimerInterval);
}


function showPowerUpDisplay(type, duration) {
    const powerUpDisplay = document.getElementById('powerUpDisplay');
    const powerUpTypeElement = document.getElementById('powerUpType');
    const powerUpTimerElement = document.getElementById('powerUpTimer');

    powerUpTypeElement.innerText = type === 'increasePaddle' ? 'Paddle Size Increase' : '2X Score';
    powerUpTimerElement.innerText = `${duration}s`;
    powerUpDisplay.classList.remove('hidden');

    let remainingTime = duration;
    powerUpTimerInterval = setInterval(() => {
        remainingTime--;
        powerUpTimerElement.innerText = `${remainingTime}s`;

        if (remainingTime <= 0) {
            clearInterval(powerUpTimerInterval);
        }
    }, 1000);
}

function hidePowerUpDisplay() {
    const powerUpDisplay = document.getElementById('powerUpDisplay');
    powerUpDisplay.classList.add('hidden');
}

function startCountdown() {
    const countdownElement = document.getElementById('countdown');
    let countdown = 3;
    countdownElement.innerText = countdown;

    const countdownInterval = setInterval(() => {
        countdown--;
        if (countdown > 0) {
            countdownElement.innerText = countdown;
        } else {
            clearInterval(countdownInterval);
            countdownElement.innerText = '';
            gameActive = true;
            animate();
            spawnInitialPowerUp();
        }
    }, 1000);
}

function spawnInitialPowerUp() {
    setInterval(createPowerUp, 45000);
}


function animate() {
    if (!gameActive) return;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'; // Create trail effect for the ball
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawBasket(); // Draw the paddle with reduced trail effect
    drawPowerUps(); // Draw power-ups

    balls.forEach((ball, index) => {
        drawBall(ball);

        // Move the ball
        ball.x += ball.speedX + ball.spinX + ball.speedBoost;
        ball.y += ball.speedY + ball.spinY + ball.speedBoost;

        // Apply spin decay
        ball.spinX *= 0.98; // Slower decay
        ball.spinY *= 0.98; // Slower decay

        // Apply speed boost decay
        ball.speedBoost *= 0.99; // Slower decay

        // Ball bounces off the walls
        if (ball.x + ball.radius > canvas.width) {
            ball.x = canvas.width - ball.radius;
            ball.speedX = -ball.speedX; // Invert speed without adding spin effect
            ball.spinX = -ball.spinX; // Reverse spin direction on collision
            ball.glowPulse = 10; // Trigger glow pulse on collision
        } else if (ball.x - ball.radius < 0) {
            ball.x = ball.radius;
            ball.speedX = -ball.speedX; // Invert speed without adding spin effect
            ball.spinX = -ball.spinX; // Reverse spin direction on collision
            ball.glowPulse = 10; // Trigger glow pulse on collision
        }
        if (ball.y - ball.radius < 0) {
            ball.y = ball.radius;
            ball.speedY = -ball.speedY; // Invert speed without adding spin effect
            ball.spinY = -ball.spinY; // Reverse spin direction on collision
            ball.glowPulse = 10; // Trigger glow pulse on collision
        }        

        // Ball hits the bottom
        if (ball.y + ball.radius > canvas.height) {
            gameActive = false;
            if (score > highScore) {
                highScore = score;
                localStorage.setItem('highScore', highScore);
            }
            showGameOverModal();
        }

        // Ball bounces off the paddle
        const paddle = paddles[currentPaddle];
        if (ball.y + ball.radius > canvas.height - paddle.height - basketBottomMargin &&
            ball.y - ball.radius < canvas.height - paddle.height - basketBottomMargin + ball.speedY &&
            ball.x > basketX && ball.x < basketX + paddle.width) {
            ball.speedY = -Math.abs(ball.speedY); // Ensure the ball goes upwards
        
            const impactPoint = ball.x - (basketX + paddle.width / 2);
            const impactAngle = (impactPoint / (paddle.width / 2)) * (Math.PI / 4); // Max angle of 45 degrees
        
            const speed = Math.sqrt(ball.speedX * ball.speedX + ball.speedY * ball.speedY);
            ball.speedX = speed * Math.sin(impactAngle); // New speedX based on impact angle
            ball.speedY = -speed * Math.cos(impactAngle); // New speedY based on impact angle
        
            ball.spinX = impactPoint * 0.2; // More pronounced spin effect
            ball.speedBoost = Math.abs(basketVelocity) * 0.1; // Speed boost based on paddle velocity
        
            ball.glowPulse = 30; // Trigger glow pulse on collision
            
            // Apply 2XScore multiplier
            score += (powerUpType === '2XScore') ? 2 : 1;
            
            let newSpeedX = ball.speedX + (ball.speedX > 0 ? speedIncrement : -speedIncrement);
            let newSpeedY = ball.speedY + (ball.speedY > 0 ? speedIncrement : -speedIncrement);
            let currentSpeed = Math.sqrt(newSpeedX * newSpeedX + newSpeedY * newSpeedY);
        
            if (currentSpeed <= maxIncrementSpeed) {
                ball.speedX = newSpeedX;
                ball.speedY = newSpeedY;
            }
            updateScore();
        }
        

        // Ball collision with other balls
        for (let i = 0; i < balls.length; i++) {
            if (i !== index) {
                const otherBall = balls[i];
                const dx = otherBall.x - ball.x;
                const dy = otherBall.y - ball.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < ball.radius + otherBall.radius) {
                    // Calculate angle of collision
                    const angle = Math.atan2(dy, dx);
                    const sin = Math.sin(angle);
                    const cos = Math.cos(angle);

                    // Rotate ball's position
                    const pos1 = { x: 0, y: 0 }; // ball is at (0, 0) after rotation
                    const pos2 = rotate(dx, dy, sin, cos, true);

                    // Rotate ball's velocity
                    const vel1 = rotate(ball.speedX, ball.speedY, sin, cos, true);
                    const vel2 = rotate(otherBall.speedX, otherBall.speedY, sin, cos, true);

                    // Collision reaction: swap the velocities and consider spin
                    const vxTotal = vel1.x - vel2.x;
                    vel1.x = ((ball.radius - otherBall.radius) * vel1.x + 2 * otherBall.radius * vel2.x) / (ball.radius + otherBall.radius);
                    vel2.x = vxTotal + vel1.x;

                    // Add spin effect to velocities
                    vel1.x += ball.spinX;
                    vel1.y += ball.spinY;
                    vel2.x += otherBall.spinX;
                    vel2.y += otherBall.spinY;

                    // Update position to avoid sticking together
                    pos1.x += vel1.x;
                    pos2.x += vel2.x;

                    // Rotate positions back
                    const pos1F = rotate(pos1.x, pos1.y, sin, cos, false);
                    const pos2F = rotate(pos2.x, pos2.y, sin, cos, false);

                    // Adjust positions to the actual screen position
                    otherBall.x = ball.x + pos2F.x;
                    otherBall.y = ball.y + pos2F.y;
                    ball.x = ball.x + pos1F.x;
                    ball.y = ball.y + pos1F.y;

                    // Rotate velocities back
                    const vel1F = rotate(vel1.x, vel1.y, sin, cos, false);
                    const vel2F = rotate(vel2.x, vel2.y, sin, cos, false);

                    // Update velocities
                    ball.speedX = vel1F.x;
                    ball.speedY = vel1F.y;
                    otherBall.speedX = vel2F.x;
                    otherBall.speedY = vel2F.y;

                    // Reverse spin direction on collision
                    ball.spinX = -ball.spinX;
                    ball.spinY = -ball.spinY;
                    otherBall.spinX = -otherBall.spinX;
                    otherBall.spinY = -otherBall.spinY;

                    // Trigger glow pulse on collision
                    ball.glowPulse = 20;
                    otherBall.glowPulse = 20;
                }
            }
        }

    });
    

    // Add new balls at specific scores
    if (score === 10 && balls.length < 2) {
        let currentSpeed = initialSpeed + (speedIncrement * 10);
        addNewBall('lime', currentSpeed);
    }
    if (score === 20 && balls.length < 3) {
        let currentSpeed = initialSpeed + (speedIncrement * 20);
        addNewBall('yellow', currentSpeed);
    }

    // Switch paddle at specific scores
    if (score === 50) {
        currentPaddle = 1;
    }
    if (score === 70) {
        currentPaddle = 2;
    }

    powerUps.forEach(powerUp => {
        powerUp.y += initialSpeed; // Move power-ups down at initial ball speed
    });

    checkPowerUpCollision(); // Check for power-up collisions

    requestAnimationFrame(animate);
}

function rotate(x, y, sin, cos, reverse) {
    return {
        x: (reverse ? (x * cos + y * sin) : (x * cos - y * sin)),
        y: (reverse ? (y * cos - x * sin) : (y * cos + x * sin))
    };
}

function startGame() {
    document.getElementById('launchModal').style.display = 'none';
    resetGame();
}

function init() {
    updateScore();
    document.getElementById('launchModal').style.display = 'block';
}

window.addEventListener('resize', resizeCanvas);

canvas.addEventListener('mousemove', movePaddle);
canvas.addEventListener('touchmove', movePaddle);

function movePaddle(e) {
    const clientX = e.clientX || e.touches[0].clientX;
    lastBasketX = basketX;
    basketX = clientX - paddles[currentPaddle].width / 2;
    if (basketX < 0) basketX = 0;
    if (basketX + paddles[currentPaddle].width > canvas.width) basketX = canvas.width - paddles[currentPaddle].width;
    basketVelocity = basketX - lastBasketX;
}

init();
