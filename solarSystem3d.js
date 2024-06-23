let scene, camera, renderer, controls, labelRenderer;
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
    controls.enablePan = true;
    controls.enableZoom = true;

    // Add label renderer
    labelRenderer = new THREE.CSS2DRenderer();
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0px';
    document.body.appendChild(labelRenderer.domElement);

    // Add ambient light (very low intensity)
    const ambientLight = new THREE.AmbientLight(0x404040, 0.1); // Very soft white light
    scene.add(ambientLight);

    // Add point light for the sun
    const pointLight = new THREE.PointLight(0xffffff, 2, 100000);
    pointLight.position.set(0, 0, 0);
    scene.add(pointLight);

    // Create the Sun
    const sunGeometry = new THREE.SphereGeometry(30, 32, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    sun = new THREE.Mesh(sunGeometry, sunMaterial);
    scene.add(sun);

    // Create the planets with correct sizes and scaled distances
    addPlanet(57.9, 0xaaaaaa, 2.4, 'Mercury');    // Mercury
    addPlanet(108.2, 0xffd700, 6.1, 'Venus');     // Venus
    addPlanet(149.6, 0x0000ff, 6.4, 'Earth');     // Earth
    addPlanet(227.9, 0xff4500, 3.4, 'Mars');      // Mars
    addPlanet(778.3, 0xffa500, 69.9, 'Jupiter');  // Jupiter
    addPlanet(1427, 0xffff00, 58.2, 'Saturn');    // Saturn
    addPlanet(2871, 0x00bfff, 25.4, 'Uranus');    // Uranus
    addPlanet(4497, 0x0000ff, 24.6, 'Neptune');   // Neptune

    // Create full trails for the orbits
    planets.forEach(planet => {
        for (let i = 0; i < 360; i++) {
            const angle = (i * Math.PI) / 180;
            const x = planet.userData.distance * Math.cos(angle);
            const z = planet.userData.distance * Math.sin(angle);
            planet.userData.path.push(new THREE.Vector3(x, 0, z));
        }
        updateTrail(planet);
    });

    animate();
}

function addPlanet(distance, color, radius, name) {
    const geometry = new THREE.SphereGeometry(radius, 32, 32);
    const material = new THREE.MeshPhongMaterial({ color: color });
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
    labelRenderer.render(scene, camera);
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
    const pathGeometry = new THREE.BufferGeometry().setFromPoints(planet.userData.path);
    const pathMaterial = new THREE.LineBasicMaterial({ color: planet.material.color, opacity: 0.6, transparent: true });
    const pathLine = new THREE.Line(pathGeometry, pathMaterial);

    scene.remove(planet.userData.pathLine);
    planet.userData.pathLine = pathLine;
    scene.add(pathLine);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
});

function startSimulation() {
    document.getElementById('launchModal').style.display = 'none';
    init();
}
