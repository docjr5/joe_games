const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const G = 0.05; // Gravitational constant
const star = {
    x: 0,
    y: 0,
    radius: 30,
    mass: 10000, // Increased mass for star
    color: '#FFD700',
    vx: 0,
    vy: 0,
    path: [],
    depth: 0
};

const planets = [
    { x: 100, y: 0, radius: 10, mass: 1, color: '#00FF00', vx: 0, vy: 2.5, path: [], depth: 0, moons: [] },
    { x: 200, y: 0, radius: 15, mass: 2, color: '#00BFFF', vx: 0, vy: 1.8, path: [], depth: 0, moons: [{ x: 20, y: 0, radius: 5, mass: 0.1, color: '#888888', vx: 0, vy: 0.5, path: [] }] },
    { x: 300, y: 0, radius: 20, mass: 3, color: '#FF4500', vx: 0, vy: 1.5, path: [], depth: 0, moons: [] }
];

const backgroundStars = generateBackgroundStars(200);

let isDragging = false;
let lastX, lastY;
let orbitAngleX = 0;
let orbitAngleY = 0;
let orbitVelocityX = 0;
let orbitVelocityY = 0;
let damping = 0.95; // Damping factor
let scale = 1.0; // Initial scale for zoom
let orbitCenter = { x: 0, y: 0, z: 0 }; // Initial orbit center
let followingObject = star; // Default follow object is the star

let targetOrbitAngleX = 0;
let targetOrbitAngleY = 0;

canvas.addEventListener('mousemove', (e) => {
    if (isDragging) {
        const deltaX = e.clientX - lastX;
        const deltaY = e.clientY - lastY;
        orbitVelocityY = deltaX * 0.002; // Adjust for horizontal rotation
        orbitVelocityX = deltaY * 0.002; // Adjust for vertical rotation (constrained)
        targetOrbitAngleY += orbitVelocityY;
        targetOrbitAngleX += orbitVelocityX;
        lastX = e.clientX;
        lastY = e.clientY;
    }
});

canvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    orbitVelocityX = 0;
    orbitVelocityY = 0;
});

canvas.addEventListener('mouseup', () => {
    isDragging = false;
});

canvas.addEventListener('wheel', (e) => {
    const delta = Math.sign(e.deltaY);
    scale += delta * 0.1; // Adjust zoom scale
    if (scale < 0.1) scale = 0.1; // Limit minimum zoom level
    if (scale > 3.0) scale = 3.0; // Limit maximum zoom level
});

canvas.addEventListener('click', (e) => {
    const mouseX = e.clientX - canvas.width / 2;
    const mouseY = e.clientY - canvas.height / 2;

    planets.concat([star]).forEach(obj => {
        const { x, y } = applyOrbitTransformation(obj.x, obj.y);
        const distance = Math.sqrt((x - mouseX) ** 2 + (y - mouseY) ** 2);
        if (distance < obj.radius * scale) {
            orbitCenter = { x: obj.x, y: obj.y, z: 0 };
            followingObject = obj;
        }
    });
});

function generateBackgroundStars(count) {
    const stars = [];
    const maxDistance = 2000; // Distance at which stars are generated
    for (let i = 0; i < count; i++) {
        // Generate stars at random positions within a spherical volume around the center
        const distance = Math.random() * maxDistance;
        const angle1 = Math.random() * Math.PI * 2; // Random angle in XY plane
        const angle2 = Math.random() * Math.PI * 2; // Random angle in ZX plane
        const x = distance * Math.cos(angle1) * Math.sin(angle2);
        const y = distance * Math.sin(angle1) * Math.sin(angle2);
        const z = distance * Math.cos(angle2);
        stars.push({
            x: x,
            y: y,
            z: z,
            size: Math.random() * 2,
            color: 'white'
        });
    }
    return stars;
}

function drawBackgroundStars() {
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    backgroundStars.forEach(star => {
        const { x, y, z } = applyOrbitTransformation(star.x, star.y, star.z);
        ctx.beginPath();
        ctx.arc(x, y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = star.color;
        ctx.fill();
        ctx.closePath();
    });
    ctx.restore();
}

function applyOrbitTransformation(x, y, z = 0) {
    x -= orbitCenter.x;
    y -= orbitCenter.y;
    z -= orbitCenter.z;

    const cosY = Math.cos(orbitAngleY);
    const sinY = Math.sin(orbitAngleY);
    const cosX = Math.cos(orbitAngleX);
    const sinX = Math.sin(orbitAngleX);

    // Apply Y-axis rotation
    let nx = cosY * x - sinY * z;
    let nz = sinY * x + cosY * z;

    // Apply X-axis rotation (constrained to prevent roll)
    let ny = cosX * y - sinX * nz;
    nz = sinX * y + cosX * nz;

    // Apply zoom scale
    nx *= scale;
    ny *= scale;

    return { x: nx, y: ny, z: nz };
}

function updateOrbitAngles() {
    if (!isDragging) {
        targetOrbitAngleX += orbitVelocityX;
        targetOrbitAngleY += orbitVelocityY;
    }

    // Interpolate angles towards target angles
    orbitAngleX += (targetOrbitAngleX - orbitAngleX) * 0.1;
    orbitAngleY += (targetOrbitAngleY - orbitAngleY) * 0.1;

    // Apply damping to the velocities
    orbitVelocityX *= damping;
    orbitVelocityY *= damping;
}



function drawStar() {
    const { x, y } = applyOrbitTransformation(star.x, star.y);

    // Draw glow effect around the star
    const gradient = ctx.createRadialGradient(x + canvas.width / 2, y + canvas.height / 2, 0, x + canvas.width / 2, y + canvas.height / 2, star.radius * 2 * scale);
    gradient.addColorStop(0, 'rgba(255, 255, 0, 0.8)');
    gradient.addColorStop(1, 'rgba(255, 255, 0, 0)');

    ctx.beginPath();
    ctx.arc(x + canvas.width / 2, y + canvas.height / 2, star.radius * 2 * scale, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.closePath();

    ctx.beginPath();
    ctx.arc(x + canvas.width / 2, y + canvas.height / 2, star.radius * scale, 0, Math.PI * 2);
    ctx.fillStyle = star.color;
    ctx.fill();
    ctx.closePath();
}

function drawPlanets() {
    const objects = [star, ...planets];
    
    // Update depths
    objects.forEach(obj => {
        const transformed = applyOrbitTransformation(obj.x, obj.y);
        obj.depth = transformed.z;
    });

    // Sort by depth (closest to furthest)
    objects.sort((a, b) => b.depth - a.depth);

    objects.forEach(obj => {
        const { x, y } = applyOrbitTransformation(obj.x, obj.y);
        if (obj === star) {
            drawStar();
        } else {
            const { x: starX, y: starY } = applyOrbitTransformation(star.x, star.y);
            drawPlanetWithLighting(x + canvas.width / 2, y + canvas.height / 2, obj.radius * scale, obj.color, starX, starY);
            drawMoons(obj);
        }
    });
}

function drawPlanetWithLighting(x, y, radius, color, lightX, lightY) {
    const angle = Math.atan2(y - lightY, x - lightX);
    const gradient = ctx.createLinearGradient(
        x - radius * Math.cos(angle), y - radius * Math.sin(angle),
        x + radius * Math.cos(angle), y + radius * Math.sin(angle)
    );
    gradient.addColorStop(0, 'black');
    gradient.addColorStop(1, color);

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.closePath();
}

function drawMoons(planet) {
    planet.moons.forEach(moon => {
        const { x, y } = applyOrbitTransformation(moon.x + planet.x, moon.y + planet.y);
        const { x: planetX, y: planetY } = applyOrbitTransformation(planet.x, planet.y);
        drawPlanetWithLighting(x + canvas.width / 2, y + canvas.height / 2, moon.radius * scale, moon.color, planetX, planetY);
    });
}

function drawPaths() {
    planets.concat([star]).forEach(body => {
        ctx.beginPath();
        ctx.strokeStyle = body.color;
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.5; // Start with lower opacity
        for (let i = 0; i < body.path.length - 1; i++) {
            const { x: x1, y: y1 } = applyOrbitTransformation(body.path[i].x, body.path[i].y);
            const { x: x2, y: y2 } = applyOrbitTransformation(body.path[i + 1].x, body.path[i + 1].y);
            ctx.moveTo(x1 + canvas.width / 2, y1 + canvas.height / 2);
            ctx.lineTo(x2 + canvas.width / 2, y2 + canvas.height / 2);
        }
        ctx.stroke();
        ctx.closePath();
        ctx.globalAlpha = 1.0; // Reset opacity for next drawing
    });
}

function drawForces() {
    planets.forEach(planet => {
        // Gravitational force from the star
        let dx = star.x - planet.x;
        let dy = star.y - planet.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        let force = (G * star.mass * planet.mass) / (distance * distance);
        let ax = force * (dx / distance);
        let ay = force * (dy / distance);

        drawForceVector(planet.x, planet.y, ax, ay);

        // Gravitational forces from other planets
        planets.forEach(otherPlanet => {
            if (planet !== otherPlanet) {
                dx = otherPlanet.x - planet.x;
                dy = otherPlanet.y - planet.y;
                distance = Math.sqrt(dx * dx + dy * dy);
                force = (G * otherPlanet.mass * planet.mass) / (distance * distance);
                let ax = force * (dx / distance);
                let ay = force * (dy / distance);

                drawForceVector(planet.x, planet.y, ax, ay);
            }
        });
    });
}

function drawForceVector(x, y, ax, ay) {
    const start = applyOrbitTransformation(x, y);
    const end = applyOrbitTransformation(x + ax * 1000, y + ay * 1000); // Scale for visualization

    ctx.beginPath();
    ctx.moveTo(start.x + canvas.width / 2, start.y + canvas.height / 2);
    ctx.lineTo(end.x + canvas.width / 2, end.y + canvas.height / 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.closePath();
}

function updateBodies() {
    // Update the planets
    planets.forEach(planet => {
        let ax = 0;
        let ay = 0;
        planet.path.push({ x: planet.x, y: planet.y });
        if (planet.path.length > 500) {
            planet.path.shift();
        }

        // Gravitational force from the star
        let dx = star.x - planet.x;
        let dy = star.y - planet.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        let force = (G * star.mass * planet.mass) / (distance * distance);
        ax = force * (dx / distance);
        ay = force * (dy / distance);

        // Gravitational forces from other planets
        planets.forEach(otherPlanet => {
            if (planet !== otherPlanet) {
                dx = otherPlanet.x - planet.x;
                dy = otherPlanet.y - planet.y;
                distance = Math.sqrt(dx * dx + dy * dy);
                force = (G * otherPlanet.mass * planet.mass) / (distance * distance);
                ax += force * (dx / distance);
                ay += force * (dy / distance);
            }
        });

        planet.vx += ax / planet.mass;
        planet.vy += ay / planet.mass;

        planet.x += planet.vx;
        planet.y += planet.vy;

        // Update moons
        planet.moons.forEach(moon => {
            moon.path.push({ x: moon.x, y: moon.y });
            if (moon.path.length > 500) {
                moon.path.shift();
            }

            // Gravitational force from the planet
            let mdx = planet.x - moon.x;
            let mdy = planet.y - moon.y;
            let mdistance = Math.sqrt(mdx * mdx + mdy * mdy);
            let mforce = (G * planet.mass * moon.mass) / (mdistance * mdistance);
            let max = mforce * (mdx / mdistance);
            let may = mforce * (mdy / mdistance);

            moon.vx += max / moon.mass;
            moon.vy += may / moon.mass;

            moon.x += moon.vx;
            moon.y += moon.vy;
        });
    });

    // Update the star based on gravitational forces from the planets
    let ax = 0;
    let ay = 0;
    planets.forEach(planet => {
        let dx = planet.x - star.x;
        let dy = planet.y - star.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        let force = (G * planet.mass * star.mass) / (distance * distance);
        ax += force * (dx / distance);
        ay += force * (dy / distance);
    });

    star.vx += ax / star.mass;
    star.vy += ay / star.mass;

    star.x += star.vx;
    star.y += star.vy;

    star.path.push({ x: star.x, y: star.y });
    if (star.path.length > 500) {
        star.path.shift();
    }

    // Follow the selected object
    orbitCenter.x = followingObject.x;
    orbitCenter.y = followingObject.y;
    orbitCenter.z = 0;
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackgroundStars();
    drawPaths();
    drawPlanets();
    drawForces();
    updateBodies();
    updateOrbitAngles(); // Update the orbit angles with velocity and damping
    requestAnimationFrame(animate);
}



// Initial animation start
animate();
