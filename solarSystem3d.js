let scene, camera, renderer, controls;
let sun, planets = [];
const G = 0.05; // Gravitational constant

function init() {
    // Create a scene
    scene = new THREE.Scene();

    // Create a camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100000);
    camera.position.z = 5000;

    // Create a renderer with antialiasing
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000); // Set background color to black
    document.body.appendChild(renderer.domElement);

    // Add orbit controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0x404040); // Soft white light
    scene.add(ambientLight);

    // Add point light for the sun
    const pointLight = new THREE.PointLight(0xffffff, 2, 100000);
    pointLight.position.set(0, 0, 0);
    scene.add(pointLight);

    // Create the Sun
    const sunGeometry = new THREE.SphereGeometry(30, 32, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    sun = new THREE.Mesh(sunGeometry, sunMaterial);

    // Create a glow effect around the sun
    const sunGlowMaterial = new THREE.SpriteMaterial({
        map: new THREE.TextureLoader().load('https://threejs.org/examples/textures/sprites/glow.png'),
        color: 0xFFD700,
        transparent: true,
        blending: THREE.AdditiveBlending
    });
    const sunGlow = new THREE.Sprite(sunGlowMaterial);
    sunGlow.scale.set(200, 200, 1.0); // Increased the glow size
    sun.add(sunGlow);

    scene.add(sun);

    // Create the planets with correct sizes and distances
    addPlanet(57900000, 0xaaaaaa, 2.4, 'Mercury');
    addPlanet(108200000, 0xffd700, 6.1, 'Venus');
    addPlanet(149600000, 0x0000ff, 6.4, 'Earth');
    addPlanet(227900000, 0xff4500, 3.4, 'Mars');
    addPlanet(778300000, 0xffa500, 69.9, 'Jupiter');
    addPlanet(1427000000, 0xffff00, 58.2, 'Saturn');
    addPlanet(2871000000, 0x00bfff, 25.4, 'Uranus');
    addPlanet(4497000000, 0x0000ff, 24.6, 'Neptune');

    animate();
}

function addPlanet(distance, color, radius, name) {
    const geometry = new THREE.SphereGeometry(radius, 32, 32);
    const material = new THREE.MeshPhongMaterial({ color: color });
    const planet = new THREE.Mesh(geometry, material);
    planet.position.set(distance / 1000000, 0, 0); // Scale down distances for visualization
    planet.userData = { distance: distance / 1000000, angle: 0, name, path: [] };
    scene.add(planet);
    planets.push(planet);
}

function animate() {
    requestAnimationFrame(animate);
    updatePlanets();
    controls.update();
    renderer.render(scene, camera);
}

function updatePlanets() {
    planets.forEach(planet => {
        planet.userData.angle += 0.01 / Math.sqrt(planet.userData.distance); // Adjust speed based on distance
        planet.position.x = planet.userData.distance * Math.cos(planet.userData.angle);
        planet.position.z = planet.userData.distance * Math.sin(planet.userData.angle);
        updateTrail(planet);
    });
}

function updateTrail(planet) {
    const maxPathLength = 1000;
    const position = planet.position.clone();
    planet.userData.path.push(position);

    if (planet.userData.path.length > maxPathLength) {
        planet.userData.path.shift();
    }

    const pathGeometry = new THREE.BufferGeometry().setFromPoints(planet.userData.path);
    const pathMaterial = new THREE.LineBasicMaterial({ color: planet.material.color, opacity: 0.6, transparent: true });
    const pathLine = new THREE.Line(pathGeometry, pathMaterial);

    scene.remove(planet.userData.pathLine);
    planet.userData.pathLine = pathLine;
    scene.add(pathLine);
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
