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
    { width: 100, height: 16, color: 'magenta' },
    { width: 95, height: 16, color: 'lime' },
    { width: 90, height: 16, color: 'blue' }
];
const basketBottomMargin = 50; // Margin from the bottom

const initialBallRadius = 7.65; // Reduced size by about 10%
const maxSpeed = 5;
let balls = [
    {
        x: canvas.width / 2,
        y: 50,
        radius: initialBallRadius,
        speedX: (Math.random() * 2 - 1) * maxSpeed,
        speedY: (Math.random() * 2 - 1) * maxSpeed,
        color: 'cyan',
        spinX: 0,
        spinY: 0,
        speedBoost: 0,
        glowPulse: 0
    }
];
const speedIncrement = 0.05; // Slower rate of increase
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
    ctx.shadowBlur = 10 + ball.glowPulse; // Reduced glow size with pulse effect
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
        {
            x: canvas.width / 2,
            y: 50,
            radius: initialBallRadius,
            speedX: (Math.random() * 2 - 1) * maxSpeed,
            speedY: (Math.random() * 2 - 1) * maxSpeed,
            color: 'cyan',
            spinX: 0,
            spinY: 0,
            speedBoost: 0,
            glowPulse: 0
        }
    ];
    updateScore();
    gameActive = false;
    hideGameOverModal();
    startCountdown();
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

function addNewBall(color) {
    const angle = Math.PI / 6 + Math.random() * (Math.PI / 12); // Angle between 30-45 degrees
    const speedX = Math.cos(angle) * maxSpeed * (Math.random() < 0.5 ? -1 : 1);
    const speedY = Math.sin(angle) * maxSpeed;

    balls.push({
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
    });
}

function animate() {
    if (!gameActive) return;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'; // Create trail effect
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawBasket();

    balls.forEach((ball, index) => {
        drawBall(ball);

        // Move the ball
        ball.x += ball.speedX + ball.spinX + ball.speedBoost;
        ball.y += ball.speedY + ball.spinY + ball.speedBoost;

        // Apply spin decay
        ball.spinX *= 0.95; // Slower decay
        ball.spinY *= 0.95; // Slower decay

        // Apply speed boost decay
        ball.speedBoost *= 0.95; // Slower decay

        // Ball bounces off the walls
        if (ball.x + ball.radius > canvas.width || ball.x - ball.radius < 0) {
            ball.speedX = -ball.speedX;
            ball.glowPulse = 20; // Trigger glow pulse on collision
        }
        if (ball.y - ball.radius < 0) {
            ball.speedY = -ball.speedY;
            ball.glowPulse = 20; // Trigger glow pulse on collision
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
            ball.x > basketX && ball.x < basketX + paddle.width &&
            ball.y + ball.radius <= canvas.height - paddle.height - basketBottomMargin + ball.speedY) {
            ball.speedY = -Math.abs(ball.speedY); // Ensure the ball goes upwards

            const impactPoint = ball.x - (basketX + paddle.width / 2);
            ball.spinX = impactPoint * 0.2; // More pronounced spin effect
            ball.speedBoost = Math.abs(basketVelocity) * 0.1; // Speed boost based on paddle velocity

            ball.glowPulse = 20; // Trigger glow pulse on collision
            score++;
            if (score < 30) {
                ball.speedX += (ball.speedX > 0 ? speedIncrement : -speedIncrement);
                ball.speedY += (ball.speedY > 0 ? speedIncrement : -speedIncrement);
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
                    // Handle ball collision
                    const angle = Math.atan2(dy, dx);
                    const sin = Math.sin(angle);
                    const cos = Math.cos(angle);

                    // Rotate ball's position
                    const x1 = 0;
                    const y1 = 0;

                    // Rotate otherBall's position
                    const x2 = dx * cos + dy * sin;
                    const y2 = dy * cos - dx * sin;

                    // Rotate ball's velocity
                    const vx1 = ball.speedX * cos + ball.speedY * sin;
                    const vy1 = ball.speedY * cos - ball.speedX * sin;

                    // Rotate otherBall's velocity
                    const vx2 = otherBall.speedX * cos + otherBall.speedY * sin;
                    const vy2 = otherBall.speedY * cos - otherBall.speedX * sin;

                    // Collision reaction
                    const vxTotal = vx1 - vx2;
                    vx1 = ((ball.radius - otherBall.radius) * vx1 + 2 * otherBall.radius * vx2) / (ball.radius + otherBall.radius);
                    vx2 = vxTotal + vx1;

                    // Update ball's position
                    ball.x += vx1 * cos - vy1 * sin;
                    ball.y += vy1 * cos + vx1 * sin;

                    // Update otherBall's position
                    otherBall.x += vx2 * cos - vy2 * sin;
                    otherBall.y += vy2 * cos + vx2 * sin;

                    // Update velocities
                    ball.speedX = vx1 * cos - vy1 * sin;
                    ball.speedY = vy1 * cos + vx1 * sin;
                    otherBall.speedX = vx2 * cos - vy2 * sin;
                    otherBall.speedY = vy2 * cos + vx2 * sin;

                    // Trigger glow pulse on collision
                    ball.glowPulse = 20;
                    otherBall.glowPulse = 20;
                }
            }
        }
    });

    // Add new balls at specific scores
    if (score === 10 && balls.length < 2) {
        addNewBall('lime');
    }
    if (score === 20 && balls.length < 3) {
        addNewBall('yellow');
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

function init() {
    updateScore();
    resetGame();
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
