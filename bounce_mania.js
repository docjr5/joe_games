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
    { width: 105, height: 8, color: 'magenta' },
    { width: 95, height: 8, color: 'lime' },
    { width: 85, height: 8, color: 'blue' }
];
const basketBottomMargin = 50; // Margin from the bottom

const initialBallRadius = 7.5; // Reduced size by about 10%
const initialSpeed = 4; // Fixed initial speed
const maxIncrementSpeed = 6; // Maximum speed due to increments
const speedIncrement = 0.1; // Speed increment per score point
let balls = [];
let gameActive = false;

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
    document.getElementById('score').innerText = 'Score: ' + score;
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
    updateScore();
    gameActive = false;
    hideGameOverModal();
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
        }
    }, 1000);
}

function addNewBall(color, speed) {
    balls.push(createBall(color, speed));
}

function animate() {
    if (!gameActive) return;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'; // Create trail effect for the ball
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawBasket(); // Draw the paddle with reduced trail effect

    balls.forEach((ball, index) => {
        drawBall(ball);

        // Move the ball
        ball.x += ball.speedX + ball.spinX - ball.speedBoost;
        ball.y += ball.speedY + ball.spinY - ball.speedBoost;

        // Apply spin decay
        ball.spinX *= 0.97; // Slower decay
        ball.spinY *= 0.97; // Slower decay

        // Apply speed boost decay
        ball.speedBoost *= 0.99; // Slower decay

        // Ball bounces off the walls
        if (ball.x + ball.radius > canvas.width) {
            ball.x = canvas.width - ball.radius;
            ball.speedX = -ball.speedX;
            ball.glowPulse = 10; // Trigger glow pulse on collision
        } else if (ball.x - ball.radius < 0) {
            ball.x = ball.radius;
            ball.speedX = -ball.speedX;
            ball.glowPulse = 10; // Trigger glow pulse on collision
        }
        if (ball.y - ball.radius < 0) {
            ball.y = ball.radius;
            ball.speedY = -ball.speedY;
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
            ball.spinX = impactPoint * 0.2; // More pronounced spin effect
            ball.speedBoost = -Math.abs(basketVelocity) * 0.1; // Slow down based on paddle velocity

            ball.glowPulse = 30; // Trigger glow pulse on collision
            score++;
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

                    // Collision reaction: swap the velocities
                    const vxTotal = vel1.x - vel2.x;
                    vel1.x = ((ball.radius - otherBall.radius) * vel1.x + 2 * otherBall.radius * vel2.x) / (ball.radius + otherBall.radius);
                    vel2.x = vxTotal + vel1.x;

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
    if (score === 30) {
        currentPaddle = 1;
    }
    if (score === 40) {
        currentPaddle = 2;
    }

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
