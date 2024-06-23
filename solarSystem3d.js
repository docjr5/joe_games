let scene, camera, renderer, controls;
let sun, planets = [];
const G = 0.05; // Gravitational constant
const objects = [];

function init() {
    // Create a scene
    scene = new THREE.Scene();

    // Create a camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 500;

    // Create a renderer
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Create the Sun
    const sunGeometry = new THREE.SphereGeometry(30, 32, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xFFD700 });
    sun = new THREE.Mesh(sunGeometry, sunMaterial);
    sun.mass = 10000;
    sun.position.set(0, 0, 0);
    objects.push(sun);
    scene.add(sun);

    // Create the planets
    addPlanet(100, 0x00FF00, 10, 1, 2.5);
    addPlanet(200, 0x00BFFF, 15, 2, 1.8);
    addPlanet(300, 0xFF4500, 20, 3, 1.5);

    // Add lights
    const ambientLight = new THREE.AmbientLight(0x404040); // soft white light
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 1, 0);
    pointLight.position.set(0, 0, 0);
    scene.add(pointLight);

    // Add orbit controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);

    animate();
}

function addPlanet(distance, color, radius, mass, speed) {
    const geometry = new THREE.SphereGeometry(radius, 32, 32);
    const material = new THREE.MeshBasicMaterial({ color: color });
    const planet = new THREE.Mesh(geometry, material);
    planet.mass = mass;
    planet.position.set(distance, 0, 0);
    planet.vx = 0;
    planet.vy = speed;
    objects.push(planet);
    scene.add(planet);
    planets.push(planet);
}

function animate() {
    requestAnimationFrame(animate);
    updateBodies();
    renderer.render(scene, camera);
}

function updateBodies() {
    // Update the planets' positions based on gravitational forces
    planets.forEach(planet => {
        let ax = 0, ay = 0;

        // Gravitational force from the sun
        let dx = sun.position.x - planet.position.x;
        let dy = sun.position.y - planet.position.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        let force = (G * sun.mass * planet.mass) / (distance * distance);
        ax = force * (dx / distance);
        ay = force * (dy / distance);

        // Update velocity
        planet.vx += ax / planet.mass;
        planet.vy += ay / planet.mass;

        // Update position
        planet.position.x += planet.vx;
        planet.position.y += planet.vy;
    });
}

function startSimulation() {
    document.getElementById('launchModal').style.display = 'none';
    init();
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
