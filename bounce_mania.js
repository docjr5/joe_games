const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let score = 0;
let highScore = localStorage.getItem('highScore') || 0;
let basketX = canvas.width / 2;
let currentPaddle = 0;
const paddles = [
    { width: 100, height: 16, color: 'magenta' },
    { width: 95, height: 16, color: 'lime' },
    { width: 90, height: 16, color: 'blue' }
];
const basketBottomMargin = 50; // Margin from the bottom

const initialBallRadius = 7.65; // Reduced size by about 10%
let balls = [
    {
        x: canvas.width / 2,
        y: 50,
        radius: initialBallRadius,
        speedX: 1.5,
        speedY: 1.5,
        color: 'cyan'
    }
];
const speedIncrement = 0.05; // Slower rate of increase
let gameActive = false;

function drawBall(ball) {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = ball.color;
    ctx.shadowColor = ball.color;
    ctx.shadowBlur = 15; // Reduced glow size
    ctx.fill();
    ctx.closePath();
    ctx.shadowBlur = 0; // Reset shadowBlur after drawing
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
            speedX: (Math.random() < 0.5 ? -1.5 : 1.5),
            speedY: 1.5,
            color: 'cyan'
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
    balls.push({
        x: canvas.width / 2,
        y: 50,
        radius: initialBallRadius,
        speedX: (Math.random() < 0.5 ? -balls[0].speedX : balls[0].speedX),
        speedY: balls[0].speedY,
        color: color
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
        ball.x += ball.speedX;
        ball.y += ball.speedY;

        // Ball bounces off the walls
        if (ball.x + ball.radius > canvas.width || ball.x - ball.radius < 0) {
            ball.speedX = -ball.speedX;
        }
        if (ball.y - ball.radius < 0) {
            ball.speedY = -ball.speedY;
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
            ball.speedY = -ball.speedY;
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
                    // Simple elastic collision
                    ball.speedX = -ball.speedX;
                    ball.speedY = -ball.speedY;
                    otherBall.speedX = -otherBall.speedX;
                    otherBall.speedY = -otherBall.speedY;
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

canvas.addEventListener('mousemove', movePaddle);
canvas.addEventListener('touchmove', movePaddle);

function movePaddle(e) {
    const clientX = e.clientX || e.touches[0].clientX;
    basketX = clientX - paddles[currentPaddle].width / 2;
    if (basketX < 0) basketX = 0;
    if (basketX + paddles[currentPaddle].width > canvas.width) basketX = canvas.width - paddles[currentPaddle].width;
}

init();
