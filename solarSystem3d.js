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
    controls.enablePan = true;
    controls.touches = {
        ONE: THREE.TOUCH.ROTATE, // Single touch rotates the camera
        TWO: THREE.TOUCH.DOLLY_PAN // Two touches dolly and pan the camera
    };

    // Add event listener to select a planet or the sun
    window.addEventListener('click', (event) => {
        const mouse = new THREE.Vector2();
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects([sun, ...planets]);
        if (intersects.length > 0) {
            const selectedObject = intersects[0].object;
            followObject(selectedObject);
        }
    });

    // Add event listener to break lock on pan
    controls.addEventListener('start', () => {
        stopFollowingObject();
    });

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0x404040); // Soft white light
    scene.add(ambientLight);

    // Add point light for the sun
    const pointLight = new THREE.PointLight(0xffffff, 2, 5000); // Increased intensity and distance
    pointLight.position.set(0, 0, 0);
    scene.add(pointLight);

    // Create the Sun
    const sunGeometry = new THREE.SphereGeometry(30, 32, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    sun = new THREE.Mesh(sunGeometry, sunMaterial);
    sun.userData = { name: 'Sun' };
    scene.add(sun);

    // Create the planets with correct sizes and distances
    addPlanet(57.9, 0xaaaaaa, 0.383, 'Mercury', 0.2, 0.3);
    addPlanet(108.2, 0xffd700, 0.949, 'Venus', 0.1, 0.1);
    addPlanet(149.6, 0x0000ff, 1, 'Earth', 0, 0);
    addPlanet(227.9, 0xff4500, 0.532, 'Mars', 0.1, -0.1);
    addPlanet(778.3, 0xffa500, 11.2, 'Jupiter', 0.05, -0.3);
    addPlanet(1427, 0xffff00, 9.45, 'Saturn', -0.05, 0.3);
    addPlanet(2871, 0x00bfff, 4.01, 'Uranus', -0.1, -0.2);
    addPlanet(4497, 0x0000ff, 3.88, 'Neptune', 0.1, 0.2);

    // Add background stars
    addStars();

    animate();
}

function addPlanet(distance, color, radius, name, ellipseFactor, orbitInclination) {
    const geometry = new THREE.SphereGeometry(radius, 32, 32);
    const material = new THREE.MeshPhongMaterial({ color: color });
    const planet = new THREE.Mesh(geometry, material);
    planet.userData = { distance, angle: 0, name, path: [], ellipseFactor, orbitInclination };
    planet.position.set(distance, 0, 0);
    scene.add(planet);
    planets.push(planet);

    // Initialize the trail
    initializeTrail(planet);
}

function initializeTrail(planet) {
    const maxPathLength = Math.ceil(2 * Math.PI * planet.userData.distance); // Set path length to the circumference of the orbit
    for (let i = 0; i < maxPathLength; i++) {
        const angle = (i / maxPathLength) * 2 * Math.PI;
        const x = planet.userData.distance * Math.cos(angle) * (1 + planet.userData.ellipseFactor);
        const z = planet.userData.distance * Math.sin(angle);
        const y = Math.sin(angle * planet.userData.orbitInclination) * planet.userData.distance * 0.1;
        const position = new THREE.Vector3(x, y, z);
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
        const x = planet.userData.distance * Math.cos(planet.userData.angle) * (1 + planet.userData.ellipseFactor);
        const z = planet.userData.distance * Math.sin(planet.userData.angle);
        const y = Math.sin(planet.userData.angle * planet.userData.orbitInclination) * planet.userData.distance * 0.1;
        planet.position.set(x, y, z);
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

let followObjectEnabled = false;
let followedObject = null;

function followObject(object) {
    followObjectEnabled = true;
    followedObject = object;
    controls.enablePan = true; // Allow panning, orbiting, and zooming
}

function stopFollowingObject() {
    followObjectEnabled = false;
    followedObject = null;
}

function updateCamera() {
    if (followObjectEnabled && followedObject) {
        const offset = 100;
        camera.position.set(
            followedObject.position.x + offset,
            followedObject.position.y + offset,
            followedObject.position.z + offset
        );
        controls.target.copy(followedObject.position);
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
