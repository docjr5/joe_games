let scene, camera, renderer, controls;
let sun, planets = [];

function init() {
    // Create a scene
    scene = new THREE.Scene();

    // Create a camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 300;

    // Create a renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Add orbit controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0x404040); // Soft white light
    scene.add(ambientLight);

    // Add point light
    const pointLight = new THREE.PointLight(0xffffff, 1, 1000);
    pointLight.position.set(0, 0, 0);
    scene.add(pointLight);

    // Create the Sun
    const sunGeometry = new THREE.SphereGeometry(30, 32, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xFFD700 });
    sun = new THREE.Mesh(sunGeometry, sunMaterial);
    scene.add(sun);

    // Create the planets
    addPlanet(50, 0x00FF00, 5);
    addPlanet(100, 0x00BFFF, 7);
    addPlanet(150, 0xFF4500, 10);

    animate();
}

function addPlanet(distance, color, radius) {
    const geometry = new THREE.SphereGeometry(radius, 32, 32);
    const material = new THREE.MeshPhongMaterial({ color: color });
    const planet = new THREE.Mesh(geometry, material);
    planet.position.set(distance, 0, 0);
    planet.userData = { distance, angle: 0 };
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
        planet.userData.angle += 0.01;
        planet.position.x = planet.userData.distance * Math.cos(planet.userData.angle);
        planet.position.z = planet.userData.distance * Math.sin(planet.userData.angle);
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
