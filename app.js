// Initialize Three.js Scene
let scene, camera, renderer, controls;
let components = {};
let isExploded = false;
let isRotating = false;
let flowParticles = [];
let waterFlowActive = false;
let animationId;

// Component information database
const componentData = {
    feedContainer: {
        title: "Feed Container",
        icon: "🫗",
        badge: "Stage 0",
        description: "Stores and allows sediment to settle. Removes large particles first through gravity settling. Water flows naturally from the highest point.",
        function: "Initial storage and gravity-based particle separation"
    },
    bananaFiber: {
        title: "Tube 1: Banana Fiber Filter",
        icon: "🌾",
        badge: "Stage 1",
        description: "First filtration stage that removes large particles like dirt, sand, and debris using natural banana fiber material.",
        function: "Physical filtration of visible contaminants"
    },
    uvChamber: {
        title: "Tube 2: UV Light Chamber",
        icon: "💡",
        badge: "Stage 2",
        description: "Uses UV light powered by solar panel to kill bacteria and harmful microorganisms in the water.",
        function: "Microbial sterilization using ultraviolet radiation"
    },
    carbonFilter: {
        title: "Tube 3: Activated Coconut Shell Carbon Filter",
        icon: "⚫",
        badge: "Stage 3",
        description: "Final stage that improves taste, removes odor, and purifies water using activated carbon from coconut shells.",
        function: "Chemical absorption and taste improvement"
    },
    solarPanel: {
        title: "Solar Panel",
        icon: "☀️",
        badge: "Power Source",
        description: "Powers the UV light system. Converts sunlight to electricity for the UV sterilization process.",
        function: "Renewable energy generation for UV system"
    },
    stand: {
        title: "Wooden Stand",
        icon: "🪵",
        badge: "Structure",
        description: "Supports the entire system at different elevations to enable gravity-based water flow.",
        function: "Multi-level support for gravity flow system"
    },
    faucet: {
        title: "Faucet",
        icon: "🚰",
        badge: "Output",
        description: "Dispenses the cleaned, purified water after all filtration stages.",
        function: "Clean water dispensing mechanism"
    }
};

// Initialize the scene
function init() {
    // Scene setup
    scene = new THREE.Scene();
    
    // Create beautiful gradient background
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext('2d');
    const gradient = context.createLinearGradient(0, 0, 0, 512);
    gradient.addColorStop(0, '#1e3c72');
    gradient.addColorStop(0.3, '#2a5298');
    gradient.addColorStop(0.7, '#7e22ce');
    gradient.addColorStop(1, '#c026d3');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 512, 512);
    
    const backgroundTexture = new THREE.CanvasTexture(canvas);
    scene.background = backgroundTexture;
    
    // Add atmospheric fog
    scene.fog = new THREE.Fog(0x2a5298, 8, 20);

    // Camera setup
    camera = new THREE.PerspectiveCamera(
        45,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.set(5, 2, 5);

    // Renderer setup
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setPixelRatio(window.devicePixelRatio);
    document.getElementById('canvas-container').appendChild(renderer.domElement);

    // Controls setup with smooth damping
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 2;
    controls.maxDistance = 10;
    controls.maxPolarAngle = Math.PI / 2;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x7e22ce, 0.5);
    scene.add(hemisphereLight);

    // Add accent lights for atmosphere
    const purpleLight = new THREE.PointLight(0x9370db, 0.5, 10);
    purpleLight.position.set(-3, 2, -3);
    scene.add(purpleLight);

    const blueLight = new THREE.PointLight(0x4fc3f7, 0.5, 10);
    blueLight.position.set(3, 2, 3);
    scene.add(blueLight);

    // Ground plane with better material
    const groundGeometry = new THREE.PlaneGeometry(30, 30);
    const groundMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x1e3c72,
        roughness: 0.8,
        metalness: 0.2,
        opacity: 0.5,
        transparent: true
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Create the filtration system
    createFiltrationSystem();

    // Event listeners
    setupEventListeners();

    // Start animation loop
    animate();
}

// Create the complete filtration system
function createFiltrationSystem() {
    const systemGroup = new THREE.Group();

    // Wooden stand
    const stand = createWoodenStand();
    systemGroup.add(stand);
    components.stand = stand;

    // Feed Container (top)
    const feedContainer = createFeedContainer();
    feedContainer.position.set(-1.5, 2, 0);
    systemGroup.add(feedContainer);
    components.feedContainer = feedContainer;

    // Solar Panel
    const solarPanel = createSolarPanel();
    solarPanel.position.set(-1.5, 1.2, -0.5);
    solarPanel.rotation.x = -Math.PI / 6;
    systemGroup.add(solarPanel);
    components.solarPanel = solarPanel;

    // Banana Fiber Filter (Tube 1)
    const bananaFiber = createFilterTube(0xd4a574, 0xe6d5b8);
    bananaFiber.position.set(-0.3, 0.8, 0);
    systemGroup.add(bananaFiber);
    components.bananaFiber = bananaFiber;

    // UV Light Chamber (Tube 2)
    const uvChamber = createUVChamber();
    uvChamber.position.set(0.5, 0.6, 0);
    systemGroup.add(uvChamber);
    components.uvChamber = uvChamber;

    // Carbon Filter (Tube 3)
    const carbonFilter = createFilterTube(0x333333, 0x666666);
    carbonFilter.position.set(1.3, 0.4, 0);
    systemGroup.add(carbonFilter);
    components.carbonFilter = carbonFilter;

    // Faucet and glass
    const faucet = createFaucet();
    faucet.position.set(2, 0.3, 0);
    systemGroup.add(faucet);
    components.faucet = faucet;

    // Connecting pipes
    createPipes(systemGroup);

    scene.add(systemGroup);
    components.system = systemGroup;
}

// Create wooden stand
function createWoodenStand() {
    const standGroup = new THREE.Group();
    const woodMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x8B4513,
        roughness: 0.8,
        metalness: 0.2
    });

    // Vertical legs
    const legGeometry = new THREE.BoxGeometry(0.08, 2.5, 0.08);
    const positions = [
        [-1.7, 1.25, -0.3], [-1.7, 1.25, 0.3],
        [-1.3, 1.25, -0.3], [-1.3, 1.25, 0.3]
    ];

    positions.forEach(pos => {
        const leg = new THREE.Mesh(legGeometry, woodMaterial);
        leg.position.set(...pos);
        leg.castShadow = true;
        standGroup.add(leg);
    });

    // Horizontal supports
    const shelfGeometry = new THREE.BoxGeometry(0.5, 0.05, 0.7);
    [2, 1.2, 0.6].forEach(height => {
        const shelf = new THREE.Mesh(shelfGeometry, woodMaterial);
        shelf.position.set(-1.5, height, 0);
        shelf.castShadow = true;
        standGroup.add(shelf);
    });

    return standGroup;
}

// Create feed container
function createFeedContainer() {
    const containerGroup = new THREE.Group();

    // Main cylinder body with enhanced glass material
    const bodyGeometry = new THREE.CylinderGeometry(0.25, 0.25, 0.6, 32);
    const bodyMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.5,
        roughness: 0.05,
        metalness: 0.1,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1,
        transmission: 0.9,
        thickness: 0.5
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.castShadow = true;
    body.receiveShadow = true;
    containerGroup.add(body);

    // Water inside with realistic appearance
    const waterGeometry = new THREE.CylinderGeometry(0.24, 0.24, 0.4, 32);
    const waterMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x87ceeb,
        transparent: true,
        opacity: 0.7,
        roughness: 0.1,
        metalness: 0.1
    });
    const water = new THREE.Mesh(waterGeometry, waterMaterial);
    water.position.y = -0.05;
    containerGroup.add(water);

    // Sediment layer with texture
    const sedimentGeometry = new THREE.CylinderGeometry(0.24, 0.24, 0.1, 32);
    const sedimentMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x8B7355,
        roughness: 0.95
    });
    const sediment = new THREE.Mesh(sedimentGeometry, sedimentMaterial);
    sediment.position.y = -0.25;
    containerGroup.add(sediment);

    // Add some sediment particles
    for (let i = 0; i < 50; i++) {
        const particleGeometry = new THREE.SphereGeometry(0.005, 6, 6);
        const particleMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x6B5345
        });
        const particle = new THREE.Mesh(particleGeometry, particleMaterial);
        particle.position.set(
            (Math.random() - 0.5) * 0.4,
            -0.22 - Math.random() * 0.06,
            (Math.random() - 0.5) * 0.4
        );
        containerGroup.add(particle);
    }

    // Glossy blue lid
    const lidGeometry = new THREE.CylinderGeometry(0.28, 0.28, 0.05, 32);
    const lidMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x1e3a8a,
        roughness: 0.3,
        metalness: 0.7
    });
    const lid = new THREE.Mesh(lidGeometry, lidMaterial);
    lid.position.y = 0.325;
    lid.castShadow = true;
    containerGroup.add(lid);

    return containerGroup;
}

// Create filter tube (for banana fiber and carbon)
function createFilterTube(filterColor, particleColor) {
    const tubeGroup = new THREE.Group();

    // Transparent cylinder with better material
    const cylinderGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.6, 32);
    const cylinderMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.4,
        roughness: 0.05,
        metalness: 0.1,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1,
        transmission: 0.9,
        thickness: 0.5
    });
    const cylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
    cylinder.castShadow = true;
    cylinder.receiveShadow = true;
    tubeGroup.add(cylinder);

    // Filter material inside with better texture
    const filterGeometry = new THREE.CylinderGeometry(0.14, 0.14, 0.5, 32);
    const filterMaterial = new THREE.MeshStandardMaterial({ 
        color: filterColor,
        roughness: 0.9,
        metalness: 0.1
    });
    const filter = new THREE.Mesh(filterGeometry, filterMaterial);
    tubeGroup.add(filter);

    // Enhanced particles with varying sizes
    for (let i = 0; i < 150; i++) {
        const size = 0.005 + Math.random() * 0.01;
        const particleGeometry = new THREE.SphereGeometry(size, 6, 6);
        const particleMaterial = new THREE.MeshStandardMaterial({ 
            color: particleColor,
            roughness: 0.8,
            metalness: 0.2
        });
        const particle = new THREE.Mesh(particleGeometry, particleMaterial);
        particle.position.set(
            (Math.random() - 0.5) * 0.26,
            (Math.random() - 0.5) * 0.5,
            (Math.random() - 0.5) * 0.26
        );
        particle.castShadow = true;
        tubeGroup.add(particle);
    }

    // Glossy blue base with better material
    const baseGeometry = new THREE.CylinderGeometry(0.18, 0.18, 0.08, 32);
    const baseMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x1e3a8a,
        roughness: 0.3,
        metalness: 0.7
    });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = -0.34;
    base.castShadow = true;
    tubeGroup.add(base);

    // Glossy blue top
    const top = new THREE.Mesh(baseGeometry, baseMaterial);
    top.position.y = 0.34;
    top.castShadow = true;
    tubeGroup.add(top);

    return tubeGroup;
}

// Create UV Chamber
function createUVChamber() {
    const uvGroup = new THREE.Group();

    // Transparent cylinder with enhanced glass effect
    const cylinderGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.6, 32);
    const cylinderMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xe8e8ff,
        transparent: true,
        opacity: 0.4,
        roughness: 0.05,
        metalness: 0.1,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1,
        transmission: 0.9,
        thickness: 0.5
    });
    const cylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
    cylinder.castShadow = true;
    cylinder.receiveShadow = true;
    uvGroup.add(cylinder);

    // UV light tube with stronger glow
    const uvLightGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.5, 16);
    const uvLightMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xa855f7,
        emissive: 0xa855f7,
        emissiveIntensity: 1.2,
        roughness: 0.2,
        metalness: 0.8
    });
    const uvLight = new THREE.Mesh(uvLightGeometry, uvLightMaterial);
    uvGroup.add(uvLight);

    // Enhanced glow effect
    const glowGeometry = new THREE.CylinderGeometry(0.12, 0.12, 0.55, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0xa855f7,
        transparent: true,
        opacity: 0.4
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    uvGroup.add(glow);

    // Stronger point light for UV effect
    const uvPointLight = new THREE.PointLight(0xa855f7, 1.5, 2);
    uvPointLight.position.set(0, 0, 0);
    uvGroup.add(uvPointLight);

    // Blue base and top with metallic finish
    const baseGeometry = new THREE.CylinderGeometry(0.18, 0.18, 0.08, 32);
    const baseMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x1e3a8a,
        roughness: 0.3,
        metalness: 0.7
    });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = -0.34;
    base.castShadow = true;
    uvGroup.add(base);

    const top = new THREE.Mesh(baseGeometry, baseMaterial);
    top.position.y = 0.34;
    top.castShadow = true;
    uvGroup.add(top);

    return uvGroup;
}

// Create solar panel
function createSolarPanel() {
    const panelGroup = new THREE.Group();

    // Panel surface
    const panelGeometry = new THREE.BoxGeometry(0.4, 0.3, 0.02);
    const panelMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x1a1a2e,
        metalness: 0.6,
        roughness: 0.4
    });
    const panel = new THREE.Mesh(panelGeometry, panelMaterial);
    panel.castShadow = true;
    panelGroup.add(panel);

    // Solar cells grid
    const cellGeometry = new THREE.BoxGeometry(0.08, 0.06, 0.01);
    const cellMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x0f3460,
        metalness: 0.8,
        roughness: 0.2
    });

    for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
            const cell = new THREE.Mesh(cellGeometry, cellMaterial);
            cell.position.set(i * 0.12, j * 0.09, 0.015);
            panelGroup.add(cell);
        }
    }

    // Frame
    const frameGeometry = new THREE.BoxGeometry(0.42, 0.32, 0.01);
    const frameMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const frame = new THREE.Mesh(frameGeometry, frameMaterial);
    frame.position.z = -0.015;
    panelGroup.add(frame);

    return panelGroup;
}

// Create faucet
function createFaucet() {
    const faucetGroup = new THREE.Group();

    // Faucet body
    const bodyGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.15, 16);
    const faucetMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xcccccc,
        metalness: 0.9,
        roughness: 0.1
    });
    const body = new THREE.Mesh(bodyGeometry, faucetMaterial);
    body.rotation.z = Math.PI / 2;
    body.position.x = 0.075;
    faucetGroup.add(body);

    // Spout
    const spoutGeometry = new THREE.CylinderGeometry(0.02, 0.025, 0.1, 16);
    const spout = new THREE.Mesh(spoutGeometry, faucetMaterial);
    spout.position.set(0.15, -0.05, 0);
    faucetGroup.add(spout);

    // Glass
    const glassGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.2, 32);
    const glassMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.3,
        roughness: 0.1,
        clearcoat: 1.0
    });
    const glass = new THREE.Mesh(glassGeometry, glassMaterial);
    glass.position.set(0.15, -0.2, 0);
    glass.castShadow = true;
    faucetGroup.add(glass);

    // Water in glass
    const waterInGlassGeometry = new THREE.CylinderGeometry(0.075, 0.075, 0.15, 32);
    const waterInGlassMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x87ceeb,
        transparent: true,
        opacity: 0.5,
        roughness: 0.1
    });
    const waterInGlass = new THREE.Mesh(waterInGlassGeometry, waterInGlassMaterial);
    waterInGlass.position.set(0.15, -0.225, 0);
    faucetGroup.add(waterInGlass);

    return faucetGroup;
}

// Create connecting pipes
function createPipes(systemGroup) {
    const pipeMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x4fc3f7,
        metalness: 0.7,
        roughness: 0.3
    });

    // Pipe from feed to banana fiber
    const pipe1 = createCurvedPipe(
        new THREE.Vector3(-1.5, 1.7, 0),
        new THREE.Vector3(-0.3, 1.1, 0),
        pipeMaterial
    );
    systemGroup.add(pipe1);

    // Pipe from banana fiber to UV chamber
    const pipe2 = createCurvedPipe(
        new THREE.Vector3(-0.3, 0.5, 0),
        new THREE.Vector3(0.5, 0.9, 0),
        pipeMaterial
    );
    systemGroup.add(pipe2);

    // Pipe from UV chamber to carbon filter
    const pipe3 = createCurvedPipe(
        new THREE.Vector3(0.5, 0.3, 0),
        new THREE.Vector3(1.3, 0.7, 0),
        pipeMaterial
    );
    systemGroup.add(pipe3);

    // Pipe from carbon filter to faucet
    const pipe4 = createCurvedPipe(
        new THREE.Vector3(1.3, 0.1, 0),
        new THREE.Vector3(2, 0.3, 0),
        pipeMaterial
    );
    systemGroup.add(pipe4);
}

// Create curved pipe between two points
function createCurvedPipe(start, end, material) {
    const pipeGroup = new THREE.Group();
    
    const midPoint = new THREE.Vector3(
        (start.x + end.x) / 2,
        (start.y + end.y) / 2 + 0.1,
        (start.z + end.z) / 2
    );

    const curve = new THREE.QuadraticBezierCurve3(start, midPoint, end);
    const tubeGeometry = new THREE.TubeGeometry(curve, 20, 0.015, 8, false);
    const tube = new THREE.Mesh(tubeGeometry, material);
    tube.castShadow = true;
    pipeGroup.add(tube);

    return pipeGroup;
}

// Explode view animation
function toggleExplode() {
    isExploded = !isExploded;
    const button = document.getElementById('btn-explode');
    const explodedInfo = document.getElementById('exploded-info');
    const closeBtn = document.getElementById('close-exploded');
    
    if (isExploded) {
        button.classList.add('active');
        button.textContent = 'Collapse View';
        animateExplode(true);
        showAllComponentInfo();
        explodedInfo.classList.add('visible');
        closeBtn.classList.add('visible');
    } else {
        button.classList.remove('active');
        button.textContent = 'Explode View';
        animateExplode(false);
        explodedInfo.classList.remove('visible');
        closeBtn.classList.remove('visible');
    }
}

function showAllComponentInfo() {
    const explodedInfo = document.getElementById('exploded-info');
    explodedInfo.innerHTML = '';

    const componentOrder = ['feedContainer', 'solarPanel', 'bananaFiber', 'uvChamber', 'carbonFilter', 'faucet', 'stand'];

    componentOrder.forEach((key, index) => {
        const data = componentData[key];
        if (!data) return;

        const card = document.createElement('div');
        card.className = 'component-card';
        card.style.animationDelay = `${index * 0.1}s`;
        
        card.innerHTML = `
            <span class="icon">${data.icon}</span>
            <h3>${data.title}</h3>
            <span class="badge">${data.badge}</span>
            <p style="margin-top: 12px;">${data.description}</p>
            <p style="font-weight: 600; color: #667eea; font-size: 12px;">
                <strong>Function:</strong> ${data.function}
            </p>
        `;

        card.addEventListener('click', () => {
            focusOnComponent(key);
        });

        explodedInfo.appendChild(card);
    });
}

function animateExplode(explode) {
    const duration = 1000;
    const startTime = Date.now();

    function animate() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = easeInOutCubic(progress);

        if (explode) {
            components.feedContainer.position.y = 2 + easeProgress * 1.5;
            components.solarPanel.position.y = 1.2 + easeProgress * 1.3;
            components.bananaFiber.position.y = 0.8 + easeProgress * 0.5;
            components.bananaFiber.position.x = -0.3 - easeProgress * 0.3;
            components.uvChamber.position.y = 0.6;
            components.carbonFilter.position.y = 0.4 - easeProgress * 0.3;
            components.carbonFilter.position.x = 1.3 + easeProgress * 0.3;
            components.faucet.position.y = 0.3 - easeProgress * 0.5;
            components.faucet.position.x = 2 + easeProgress * 0.5;
        } else {
            components.feedContainer.position.y = 3.5 - easeProgress * 1.5;
            components.solarPanel.position.y = 2.5 - easeProgress * 1.3;
            components.bananaFiber.position.y = 1.3 - easeProgress * 0.5;
            components.bananaFiber.position.x = -0.6 + easeProgress * 0.3;
            components.uvChamber.position.y = 0.6;
            components.carbonFilter.position.y = 0.1 + easeProgress * 0.3;
            components.carbonFilter.position.x = 1.6 - easeProgress * 0.3;
            components.faucet.position.y = -0.2 + easeProgress * 0.5;
            components.faucet.position.x = 2.5 - easeProgress * 0.5;
        }

        if (progress < 1) {
            requestAnimationFrame(animate);
        }
    }

    animate();
}

// Easing function
function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// Focus on specific component
function focusOnComponent(componentName) {
    const component = components[componentName];
    if (!component) return;

    const box = new THREE.Box3().setFromObject(component);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = camera.fov * (Math.PI / 180);
    let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
    cameraZ *= 2.5;

    const duration = 1000;
    const startPos = camera.position.clone();
    const startTarget = controls.target.clone();
    const startTime = Date.now();

    function animate() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = easeInOutCubic(progress);

        camera.position.lerpVectors(
            startPos,
            new THREE.Vector3(center.x + cameraZ * 0.5, center.y + cameraZ * 0.3, center.z + cameraZ * 0.5),
            easeProgress
        );

        controls.target.lerpVectors(startTarget, center, easeProgress);
        controls.update();

        if (progress < 1) {
            requestAnimationFrame(animate);
        }
    }

    animate();
    showComponentInfo(componentName);
}

// Show component information
function showComponentInfo(componentName) {
    const info = componentData[componentName];
    if (!info) return;

    const infoPanel = document.getElementById('component-info');
    const title = document.getElementById('component-title');
    const description = document.getElementById('component-description');

    title.textContent = info.title;
    description.textContent = info.description;
    infoPanel.classList.add('visible');

    setTimeout(() => {
        infoPanel.classList.remove('visible');
    }, 5000);
}

// Water flow animation
function toggleWaterFlow() {
    waterFlowActive = !waterFlowActive;
    const button = document.getElementById('btn-flow');

    if (waterFlowActive) {
        button.classList.add('active');
        button.textContent = 'Stop Water Flow';
        startWaterFlow();
    } else {
        button.classList.remove('active');
        button.textContent = 'Start Water Flow';
        stopWaterFlow();
    }
}

function startWaterFlow() {
    createWaterParticles();
}

function stopWaterFlow() {
    flowParticles.forEach(particle => {
        scene.remove(particle);
    });
    flowParticles = [];
}

function createWaterParticles() {
    const particleGeometry = new THREE.SphereGeometry(0.02, 8, 8);
    const particleMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x4fc3f7,
        transparent: true,
        opacity: 0.8
    });

    // Flow path coordinates
    const flowPath = [
        { x: -1.5, y: 1.7, z: 0 },  // From feed container
        { x: -0.3, y: 1.1, z: 0 },  // To banana fiber
        { x: -0.3, y: 0.5, z: 0 },  // Through banana fiber
        { x: 0.5, y: 0.9, z: 0 },   // To UV chamber
        { x: 0.5, y: 0.3, z: 0 },   // Through UV chamber
        { x: 1.3, y: 0.7, z: 0 },   // To carbon filter
        { x: 1.3, y: 0.1, z: 0 },   // Through carbon filter
        { x: 2, y: 0.3, z: 0 },     // To faucet
        { x: 2.15, y: -0.1, z: 0 }  // Into glass
    ];

    for (let i = 0; i < 5; i++) {
        setTimeout(() => {
            const particle = new THREE.Mesh(particleGeometry, particleMaterial.clone());
            particle.userData.pathIndex = 0;
            particle.userData.progress = 0;
            particle.position.copy(flowPath[0]);
            scene.add(particle);
            flowParticles.push(particle);

            particle.userData.animate = function() {
                if (!waterFlowActive) return;

                this.progress += 0.02;

                if (this.progress >= 1) {
                    this.progress = 0;
                    this.pathIndex++;
                    
                    if (this.pathIndex >= flowPath.length - 1) {
                        scene.remove(particle);
                        const index = flowParticles.indexOf(particle);
                        if (index > -1) flowParticles.splice(index, 1);
                        return;
                    }
                }

                const start = flowPath[this.pathIndex];
                const end = flowPath[this.pathIndex + 1];
                
                particle.position.lerpVectors(
                    new THREE.Vector3(start.x, start.y, start.z),
                    new THREE.Vector3(end.x, end.y, end.z),
                    this.progress
                );
            };
        }, i * 400);
    }
}

// Toggle auto rotation
function toggleRotation() {
    isRotating = !isRotating;
    const button = document.getElementById('btn-rotate');
    
    if (isRotating) {
        button.classList.add('active');
        button.textContent = 'Stop Rotation';
    } else {
        button.classList.remove('active');
        button.textContent = 'Auto Rotate';
    }
}

// Reset camera view
function resetView() {
    const duration = 1000;
    const startPos = camera.position.clone();
    const startTarget = controls.target.clone();
    const startTime = Date.now();

    const targetPos = new THREE.Vector3(5, 2, 5);
    const targetLookAt = new THREE.Vector3(0, 1, 0);

    function animate() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = easeInOutCubic(progress);

        camera.position.lerpVectors(startPos, targetPos, easeProgress);
        controls.target.lerpVectors(startTarget, targetLookAt, easeProgress);
        controls.update();

        if (progress < 1) {
            requestAnimationFrame(animate);
        }
    }

    animate();

    document.getElementById('component-info').classList.remove('visible');
}

// Setup event listeners
function setupEventListeners() {
    // Button controls
    document.getElementById('btn-explode').addEventListener('click', toggleExplode);
    document.getElementById('btn-reset').addEventListener('click', resetView);
    document.getElementById('btn-rotate').addEventListener('click', toggleRotation);
    document.getElementById('btn-flow').addEventListener('click', toggleWaterFlow);
    document.getElementById('close-exploded').addEventListener('click', () => {
        if (isExploded) toggleExplode();
    });

    // Component focus buttons
    document.getElementById('btn-feed').addEventListener('click', () => focusOnComponent('feedContainer'));
    document.getElementById('btn-filter1').addEventListener('click', () => focusOnComponent('bananaFiber'));
    document.getElementById('btn-uv').addEventListener('click', () => focusOnComponent('uvChamber'));
    document.getElementById('btn-carbon').addEventListener('click', () => focusOnComponent('carbonFilter'));
    document.getElementById('btn-solar').addEventListener('click', () => focusOnComponent('solarPanel'));

    // Zoom slider
    const zoomSlider = document.getElementById('zoom-slider');
    const zoomValue = document.getElementById('zoom-value');
    zoomSlider.addEventListener('input', (e) => {
        const distance = parseFloat(e.target.value);
        zoomValue.textContent = distance.toFixed(1);
        
        const direction = camera.position.clone().sub(controls.target).normalize();
        camera.position.copy(controls.target).add(direction.multiplyScalar(distance));
    });

    // Height slider
    const heightSlider = document.getElementById('height-slider');
    const heightValue = document.getElementById('height-value');
    heightSlider.addEventListener('input', (e) => {
        const height = parseFloat(e.target.value);
        heightValue.textContent = height.toFixed(1);
        camera.position.y = height;
    });

    // Window resize
    window.addEventListener('resize', onWindowResize, false);

    // Click on 3D objects
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    renderer.domElement.addEventListener('click', (event) => {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);

        const allObjects = [];
        Object.keys(components).forEach(key => {
            if (key !== 'system') {
                components[key].traverse((child) => {
                    if (child.isMesh) {
                        child.userData.componentName = key;
                        allObjects.push(child);
                    }
                });
            }
        });

        const intersects = raycaster.intersectObjects(allObjects);
        
        if (intersects.length > 0) {
            const componentName = intersects[0].object.userData.componentName;
            if (componentName) {
                focusOnComponent(componentName);
            }
        }
    });
}

// Window resize handler
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Animation loop
function animate() {
    animationId = requestAnimationFrame(animate);

    // Auto rotation
    if (isRotating && !isExploded) {
        components.system.rotation.y += 0.005;
    }

    // Update water particles
    if (waterFlowActive) {
        flowParticles.forEach(particle => {
            if (particle.userData.animate) {
                particle.userData.animate();
            }
        });
    }

    // Update controls
    controls.update();

    // Render scene
    renderer.render(scene, camera);
}

// Start the application
window.addEventListener('DOMContentLoaded', () => {
    try {
        init();
        console.log('✓ 3D Water Filtration System loaded successfully');
        console.log('✓ All components initialized');
        console.log('✓ Controls ready');
        console.log('✓ No errors detected');
    } catch (error) {
        console.error('Error initializing application:', error);
        alert('Error loading 3D model. Please refresh the page.');
    }
});

// Error handling
window.addEventListener('error', (e) => {
    console.error('Runtime error:', e.error);
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
    
    if (renderer) {
        renderer.dispose();
    }
    
    // Cleanup geometries and materials
    scene.traverse((object) => {
        if (object.geometry) {
            object.geometry.dispose();
        }
        if (object.material) {
            if (Array.isArray(object.material)) {
                object.material.forEach(material => material.dispose());
            } else {
                object.material.dispose();
            }
        }
    });
});
