import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";

export function initRenderer(canvas) {
  // Wait for Three.js to load
    function waitForThree() {
        initApp();
    }

    // Global variables
    let scene, camera, renderer;
    let room, serverRack, volumeMesh, heatmapGroup;
    let uniforms = {};
    let routers = [];
    let obstacles = [];
    let isAnimating = true;
    let lastTime = performance.now();
    let frameCounter = 0;
    let showHeatmapFlag = true;
    
    // Camera controls
    let isMouseDown = false;
    let mouseX = 0, mouseY = 0;
    let targetX = 0.8, targetY = 0.3;
    let cameraDistance = 12;
    let cameraAngleX = 0.8;
    let cameraAngleY = 0.3;
    
    // Initialize data
    routers = [
        { x: -8, y: 8, z: -8, strength: 1.2, frequency: 5.0 },
        { x: 8, y: 8, z: -8, strength: 1.2, frequency: 5.0 },
        { x: 0, y: 6, z: 0, strength: 1.0, frequency: 2.4 }
    ];
    
    obstacles = [
        { x: 0, y: 6, z: -10, width: 20, height: 12, depth: 0.2, absorption: 0.8 },
        { x: -10, y: 6, z: 0, width: 0.2, height: 12, depth: 20, absorption: 0.8 },
        { x: 10, y: 6, z: 0, width: 0.2, height: 12, depth: 20, absorption: 0.8 },
        { x: 0, y: 12, z: 0, width: 20, height: 0.2, depth: 20, absorption: 0.3 },
        { x: 0, y: 0, z: 0, width: 20, height: 0.2, depth: 20, absorption: 0.1 },
        { x: 0, y: 2, z: 0, width: 0.8, height: 4, depth: 1.2, absorption: 0.9 }
    ];

    // Shader code
    const vertexShader = `
        varying vec3 vWorldPosition;
        void main() {
            vec4 worldPosition = modelMatrix * vec4(position, 1.0);
            vWorldPosition = worldPosition.xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `;

    const fragmentShader = `
        precision mediump float;
        uniform float uTime;
        uniform float uIntensity;
        uniform vec3 uCameraPosition;
        uniform vec3 uRouterPositions[6];
        uniform float uRouterStrengths[6];
        uniform int uNumRouters;
        varying vec3 vWorldPosition;
        
        float calculateSignal(vec3 pos) {
            float totalSignal = 0.0;
            for(int i = 0; i < 6; i++) {
                if(i >= uNumRouters) break;
                vec3 routerPos = uRouterPositions[i];
                float strength = uRouterStrengths[i];
                float dist = distance(pos, routerPos);
                float signal = strength / (1.0 + dist * 0.3);
                totalSignal += signal;
            }
            return clamp(totalSignal, 0.0, 1.0);
        }
        
        vec3 signalToColor(float signal) {
            if(signal < 0.2) {
                return mix(vec3(0.1, 0.0, 0.2), vec3(0.8, 0.0, 0.0), signal * 5.0);
            } else if(signal < 0.5) {
                return mix(vec3(0.8, 0.0, 0.0), vec3(1.0, 0.5, 0.0), (signal - 0.2) * 3.33);
            } else if(signal < 0.8) {
                return mix(vec3(1.0, 0.5, 0.0), vec3(0.0, 1.0, 0.0), (signal - 0.5) * 3.33);
            }
            return mix(vec3(0.0, 1.0, 0.0), vec3(0.0, 0.5, 1.0), (signal - 0.8) * 5.0);
        }
        
        void main() {
            float signal = calculateSignal(vWorldPosition) * uIntensity;
            vec3 color = signalToColor(signal);
            float alpha = signal * 0.4;
            gl_FragColor = vec4(color, alpha);
        }
    `;

    function loadObject() {
        // instantiate a loader
        const loader = new OBJLoader();

        // load a resource
        loader.load(
            // resource URL
            'objects/ServerRackFinal.obj',
            // called when resource is loaded
            function ( object ) {

                object.traverse( function ( child ) {
                    if ( child instanceof THREE.Mesh ) {
                        child.material = new THREE.MeshStandardMaterial({ 
                            color: 0x212121,    
                            metalness: 0.5,
                            roughness: 0.5,
                            reflectivity: 0.5
                        });
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                } );
                scene.add( object );

            },
            // called when loading is in progress
            function ( xhr ) {

                console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );

            },
            // called when loading has errors
            function ( error ) {

                console.log( 'An error happened' );

            }
        );
    }

    function initApp() {
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x2a3441);

        camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(5, 8, 12);

        renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
        renderer.setSize(canvas.clientWidth, canvas.clientHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        loadObject();
        //createHeatmap();
        createScene();
        setupEventListeners();
        animate();
         
    }

    function createScene() {
        // Lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 10, 5);
        directionalLight.castShadow = true;
        scene.add(directionalLight);

        // Room
        const floorGeometry = new THREE.PlaneGeometry(20, 20);
        const floorMaterial = new THREE.MeshLambertMaterial({ color: 0x808080 });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        scene.add(floor);

        // Walls
        const wallMaterial = new THREE.MeshLambertMaterial({ color: 0xa0a0a0 });
        
        const backWall = new THREE.Mesh(new THREE.PlaneGeometry(20, 12), wallMaterial);
        backWall.position.set(0, 6, -10);
        scene.add(backWall);
        
        const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(20, 12), wallMaterial);
        leftWall.rotation.y = Math.PI / 2;
        leftWall.position.set(-10, 6, 0);
        scene.add(leftWall);
        
        const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(20, 12), wallMaterial);
        rightWall.rotation.y = -Math.PI / 2;
        rightWall.position.set(10, 6, 0);
        scene.add(rightWall);

        // Server rack
        const rackGeometry = new THREE.BoxGeometry(0.8, 4, 1.2);
        const rackMaterial = new THREE.MeshStandardMaterial({ color: 0x202020 });
        serverRack = new THREE.Mesh(rackGeometry, rackMaterial);
        serverRack.position.set(0, 2, 0);
        serverRack.castShadow = true;
        //scene.add(serverRack);

        // Add servers to rack
        for (let i = 0; i < 10; i++) {
            const serverGeometry = new THREE.BoxGeometry(0.75, 0.15, 1.0);
            const serverMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x404040,
                metalness: 0.5,
                roughness: 0.5
            });
            const server = new THREE.Mesh(serverGeometry, serverMaterial);
            server.position.set(0, -1.5 + (i * 0.3), 0);
            serverRack.add(server);
        }

        // Add routers
        routers.forEach((router, index) => {
            const routerGeometry = new THREE.BoxGeometry(0.3, 0.1, 0.3);
            const routerMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
            const routerMesh = new THREE.Mesh(routerGeometry, routerMaterial);
            routerMesh.position.set(router.x, router.y, router.z);
            scene.add(routerMesh);

            // LED indicator
            const ledGeometry = new THREE.SphereGeometry(0.02);
            const ledMaterial = new THREE.MeshBasicMaterial({ 
                color: 0x00ff00,
                emissive: 0x003300 
            });
            const led = new THREE.Mesh(ledGeometry, ledMaterial);
            led.position.set(0.1, 0.06, 0.1);
            routerMesh.add(led);
        });
    }

    function createHeatmap() {
        try {
            // Initialize uniforms safely
            uniforms = {
                uTime: { value: 0.0 },
                uIntensity: { value: 2.0 },
                uCameraPosition: { value: new THREE.Vector3() },
                uRouterPositions: { value: [] },
                uRouterStrengths: { value: [] },
                uNumRouters: { value: routers.length }
            };

            updateUniforms();

            const geometry = new THREE.BoxGeometry(20, 12, 20);
            const material = new THREE.ShaderMaterial({
                vertexShader: vertexShader,
                fragmentShader: fragmentShader,
                uniforms: uniforms,
                transparent: true,
                side: THREE.DoubleSide,
                depthWrite: false
            });

            volumeMesh = new THREE.Mesh(geometry, material);
            volumeMesh.position.set(0, 6, 0);
            scene.add(volumeMesh);
            
        } catch (error) {
            console.error('Heatmap creation error:', error);
        }
    }

    function updateUniforms() {
        if (!uniforms || !uniforms.uRouterPositions) return;

        const positions = [];
        const strengths = [];

        routers.forEach(router => {
            positions.push(router.x, router.y, router.z);
            strengths.push(router.strength);
        });

        // Pad arrays to expected size
        while (positions.length < 18) positions.push(0);
        while (strengths.length < 6) strengths.push(0);

        uniforms.uRouterPositions.value = positions;
        uniforms.uRouterStrengths.value = strengths;
        uniforms.uNumRouters.value = routers.length;
    }

    

    function setupEventListeners() {
        renderer.domElement.addEventListener('mousedown', onMouseDown);
        renderer.domElement.addEventListener('mousemove', onMouseMove);
        renderer.domElement.addEventListener('mouseup', onMouseUp);
        renderer.domElement.addEventListener('wheel', onMouseWheel);
        
        window.addEventListener('resize', onWindowResize);
    }

    function onMouseDown(event) {
        isMouseDown = true;
        mouseX = event.clientX;
        mouseY = event.clientY;
    }

    function onMouseMove(event) {
        if (isMouseDown) {
            const deltaX = event.clientX - mouseX;
            const deltaY = event.clientY - mouseY;
            
            targetY += deltaX * 0.01;
            targetX += deltaY * 0.01;
            targetX = Math.max(-Math.PI/2, Math.min(Math.PI/2, targetX));
            
            mouseX = event.clientX;
            mouseY = event.clientY;
        }
    }

    function onMouseUp() {
        isMouseDown = false;
    }

    function onMouseWheel(event) {
        cameraDistance += event.deltaY * 0.01;
        cameraDistance = Math.max(5, Math.min(30, cameraDistance));
    }

    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function addRouter() {
        const newRouter = {
            x: (Math.random() - 0.5) * 16,
            y: 4 + Math.random() * 4,
            z: (Math.random() - 0.5) * 16,
            strength: 1.0 + Math.random() * 0.5,
            frequency: 5.0
        };
        
        routers.push(newRouter);
        updateUniforms();
        
        // Add visual router
        const routerGeometry = new THREE.BoxGeometry(0.3, 0.1, 0.3);
        const routerMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
        const routerMesh = new THREE.Mesh(routerGeometry, routerMaterial);
        routerMesh.position.set(newRouter.x, newRouter.y, newRouter.z);
        scene.add(routerMesh);
    }

    function resetScene() {
        routers = [
            { x: -8, y: 8, z: -8, strength: 1.2, frequency: 5.0 },
            { x: 8, y: 8, z: -8, strength: 1.2, frequency: 5.0 },
            { x: 0, y: 6, z: 0, strength: 1.0, frequency: 2.4 }
        ];
        
        if (uniforms && uniforms.uIntensity) {
            uniforms.uIntensity.value = 2.0;
        }
        
        document.getElementById('intensity').value = 2.0;
        updateUniforms();
    }

    function toggleAnimation() {
        isAnimating = !isAnimating;
    }

    function updateCamera() {
        cameraAngleX += (targetX - cameraAngleX) * 0.05;
        cameraAngleY += (targetY - cameraAngleY) * 0.05;
        
        const x = Math.cos(cameraAngleY) * Math.cos(cameraAngleX) * cameraDistance;
        const y = Math.sin(cameraAngleX) * cameraDistance + 6;
        const z = Math.sin(cameraAngleY) * Math.cos(cameraAngleX) * cameraDistance;
        
        camera.position.set(x, y, z);
        camera.lookAt(0, 4, 0);
    }

    function animate() {
        requestAnimationFrame(animate);
        
        if (isAnimating) {
            const currentTime = performance.now();
            const deltaTime = currentTime - lastTime;
            
            updateCamera();
            
            if (uniforms && uniforms.uTime && uniforms.uCameraPosition) {
                uniforms.uTime.value = currentTime * 0.001;
                uniforms.uCameraPosition.value.copy(camera.position);
            }
            
            renderer.render(scene, camera);
            lastTime = currentTime;
        }
    }

    // Start the application
    waitForThree();
}
