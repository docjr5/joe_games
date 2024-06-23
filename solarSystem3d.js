let scene, camera, renderer, controls;
let sun, planets = [];
let selectedPlanet = null;
const G = 0.05; // Gravitational constant

const textureLoader = new THREE.TextureLoader();

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

    // Add ambient light (very low intensity)
    const ambientLight = new THREE.AmbientLight(0x404040, 0.1); // Very soft white light
    scene.add(ambientLight);

    // Add point light for the sun
    const pointLight = new THREE.PointLight(0xffffff, 2, 100000);
    pointLight.position.set(0, 0, 0);
    scene.add(pointLight);

    // Create the Sun
    const sunTexture = textureLoader.load('https://www.solarsystemscope.com/textures/download/2k_sun.jpg');
    const sunGeometry = new THREE.SphereGeometry(30, 32, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({ map: sunTexture });
    sun = new THREE.Mesh(sunGeometry, sunMaterial);

    // Create a glow effect around the sun
    const sunGlowMaterial = new THREE.SpriteMaterial({
        map: textureLoader.load('https://threejs.org/examples/textures/sprites/glow.png'),
        color: 0xFFD700,
        transparent: true,
        blending: THREE.AdditiveBlending
    });
    const sunGlow = new THREE.Sprite(sunGlowMaterial);
    sunGlow.scale.set(200, 200, 1.0); // Increased the glow size
    sun.add(sunGlow);

    scene.add(sun);

    // Create the planets with correct sizes and scaled distances
    addPlanet(57.9, 'https://www.solarsystemscope.com/textures/download/2k_mercury.jpg', 2.4, 'Mercury');    // Mercury
    addPlanet(108.2, 'https://www.solarsystemscope.com/textures/download/2k_venus_surface.jpg', 6.1, 'Venus');     // Venus
    addPlanet(149.6, 'https://www.solarsystemscope.com/textures/download/2k_earth_daymap.jpg', 6.4, 'Earth');     // Earth
    addPlanet(227.9, 'https://www.solarsystemscope.com/textures/download/2k_mars.jpg', 3.4, 'Mars');      // Mars
    addPlanet(778.3, 'https://www.solarsystemscope.com/textures/download/2k_jupiter.jpg', 69.9, 'Jupiter');  // Jupiter
    addPlanet(1427, 'https://www.solarsystemscope.com/textures/download/2k_saturn.jpg', 58.2, 'Saturn');    // Saturn
    addPlanet(2871, 'https://www.solarsystemscope.com/textures/download/2k_uranus.jpg', 25.4, 'Uranus');    // Uranus
    addPlanet(4497, 'https://www.solarsystemscope.com/textures/download/2k_neptune.jpg', 24.6, 'Neptune');   // Neptune

    animate();
}

function addPlanet(distance, textureURL, radius, name) {
    const texture = textureLoader.load(textureURL);
    const geometry = new THREE.SphereGeometry(radius, 32, 32);
    const material = new THREE.MeshPhongMaterial({ map: texture });
    const planet = new THREE.Mesh(geometry, material);
    planet.position.set(distance, 0, 0); // Scaled down distances for visualization
    planet.userData = { distance, angle: 0, name, path: [] };
    scene.add(planet);
    planets.push(planet);

    // Create label
    const labelDiv = document.createElement('div');
    labelDiv.className = 'label';
    labelDiv.textContent = name;
    labelDiv.style.color = `#${material.color.getHexString()}`;
    const label = new THREE.CSS2DObject(labelDiv);
    label.position.set(0, radius + 4, 0);
    planet.add(label);

    // Add outline
    const outlineMaterial = new THREE.MeshBasicMaterial({ color: material.color, side: THREE.BackSide });
    const outlineMesh = new THREE.Mesh(geometry, outlineMaterial);
    outlineMesh.scale.set(1.1, 1.1, 1.1);
    planet.add(outlineMesh);
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

    if (selectedPlanet) {
        controls.target.copy(selectedPlanet.position);
        camera.position.lerp(selectedPlanet.position.clone().add(new THREE.Vector3(50, 50, 100)), 0.1);
    }
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

function onPlanetClick(event) {
    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(planets);

    if (intersects.length > 0) {
        selectedPlanet = intersects[0].object;
        controls.target.copy(selectedPlanet.position);
    }
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

window.addEventListener('click', onPlanetClick);

function startSimulation() {
    document.getElementById('launchModal').style.display = 'none';
    init();
}
