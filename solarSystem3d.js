let scene, camera, renderer, controls;
let sun, planets = [];
const G = 0.05; // Gravitational constant

function init() {
    // Create a scene
    scene = new THREE.Scene();

    // Create a camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 5000);
    camera.position.z = 1000;

    // Create a renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Add orbit controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; // Enable damping for smooth movement
    controls.dampingFactor = 0.05; // Set damping factor
    controls.rotateSpeed = 0.1; // Set rotation speed
    controls.touches = {
        ONE: THREE.TOUCH.ROTATE, // Single touch rotates the camera
        TWO: THREE.TOUCH.DOLLY_PAN // Two touches dolly and pan the camera
    };

    // Add event listener to select a planet
    window.addEventListener('click', (event) => {
        const mouse = new THREE.Vector2();
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(planets);
        if (intersects.length > 0) {
            const selectedPlanet = intersects[0].object;
            followPlanet(selectedPlanet);
        }
    });

    // Add event listener to break lock on pan
    controls.addEventListener('start', () => {
        stopFollowingPlanet();
    });

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0x000000); // Near black light
    scene.add(ambientLight);

    // Add point light for the sun
    const pointLight = new THREE.PointLight(0xffffff, 5, 5000); // Increased intensity and distance
    pointLight.position.set(0, 0, 0);
    scene.add(pointLight);

    // Create the Sun
    const sunGeometry = new THREE.SphereGeometry(30, 32, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    sun = new THREE.Mesh(sunGeometry, sunMaterial);
    scene.add(sun);

    // Create the planets with correct sizes and distances
    addPlanet(57.9, 0xaaaaaa, 2.4, 'Mercury');
    addPlanet(108.2, 0xffd700, 6.1, 'Venus');
    addPlanet(149.6, 0x0000ff, 6.4, 'Earth');
    addPlanet(227.9, 0xff4500, 3.4, 'Mars');
    addPlanet(778.3, 0xffa500, 69.9, 'Jupiter');
    addPlanet(1427, 0xffff00, 58.2, 'Saturn');
    addPlanet(2871, 0x00bfff, 25.4, 'Uranus');
    addPlanet(4497, 0x0000ff, 24.6, 'Neptune');

    // Add background stars
    addStars();

    animate();
}

function addPlanet(distance, color, radius, name) {
    const geometry = new THREE.SphereGeometry(radius, 32, 32);
    const material = new THREE.MeshPhongMaterial({ color: color });
    const planet = new THREE.Mesh(geometry, material);
    planet.position.set(distance, 0, 0);
    planet.userData = { distance, angle: 0, name, path: [] };
    scene.add(planet);
    planets.push(planet);

    // Initialize the trail
    initializeTrail(planet);
}

function initializeTrail(planet) {
    const maxPathLength = Math.ceil(2 * Math.PI * planet.userData.distance); // Set path length to the circumference of the orbit
    for (let i = 0; i < maxPathLength; i++) {
        const angle = (i / maxPathLength) * 2 * Math.PI;
        const position = new THREE.Vector3(
            planet.userData.distance * Math.cos(angle),
            0,
            planet.userData.distance * Math.sin(angle)
        );
        planet.userData.path.push(position);
    }
}

function animate() {
    requestAnimationFrame(animate);
    updatePlanets();
    updateCamera(); // Add this line to update camera position if following a planet
    controls.update();
    renderer.render(scene, camera);
}

function updatePlanets() {
    planets.forEach(planet => {
        planet.userData.angle += 0.03 / Math.sqrt(planet.userData.distance); // Adjust speed based on distance
        planet.position.x = planet.userData.distance * Math.cos(planet.userData.angle);
        planet.position.z = planet.userData.distance * Math.sin(planet.userData.angle);
        updateTrail(planet);
    });
}

function updateTrail(planet) {
    const maxPathLength = Math.ceil(2 * Math.PI * planet.userData.distance); // Set path length to the circumference of the orbit
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

let followPlanetEnabled = false;
let followedPlanet = null;

function followPlanet(planet) {
    followPlanetEnabled = true;
    followedPlanet = planet;
}

function stopFollowingPlanet() {
    followPlanetEnabled = false;
    followedPlanet = null;
}

function updateCamera() {
    if (followPlanetEnabled && followedPlanet) {
        camera.position.x = followedPlanet.position.x + 100;
        camera.position.y = followedPlanet.position.y + 100;
        camera.position.z = followedPlanet.position.z + 100;
        controls.target.copy(followedPlanet.position);
    }
}

function addStars() {
    const starCount = 10000;
    const starsGeometry = new THREE.BufferGeometry();
    const starPositions = [];

    for (let i = 0; i < starCount; i++) {
        const x = (Math.random() - 0.5) * 5000;
        const y = (Math.random() - 0.5) * 5000;
        const z = (Math.random() - 0.5) * 5000;
        starPositions.push(x, y, z);
    }

    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
    const starsMaterial = new THREE.PointsMaterial({ color: 0xffffff });
    const starField = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(starField);
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
