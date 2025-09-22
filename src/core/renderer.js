import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";
import { OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';

export function initRenderer(canvas) {
    wifiSimulation(canvas);
}

function simple3D(canvas) {
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

function wifiSimulation(canvas) {
    // ---------------- CONFIG (tuneable) ----------------
    let NX = 128; // x
    let NY = 64;  // y
    let NZ = 32;  // z (depth)
    const CFL = 0.5; // stability
    const dx = 1.0;
    const dy = 1.0;
    const dz = 1.0;
    let c = 1.0; // wave speed in normalized units
    let dt = CFL * Math.min(dx,Math.min(dy,dz)) / Math.sqrt(3.0); // approximate

    // choose packed texture: width = NX, height = NY * NZ
    const TEX_W = () => NX;
    const TEX_H = () => NY * NZ;

    // ---------------- Three.js setup ----------------
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio ? Math.min(window.devicePixelRatio, 2) : 1);
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
    camera.position.set(0, 0, 5);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0,0,0);
    controls.update();

    // fullscreen quad for compute and for raymarch visualize
    const quad = new THREE.PlaneGeometry(2,2);

    function createRenderTarget(w,h){
    return new THREE.WebGLRenderTarget(w,h,{
        wrapS: THREE.ClampToEdgeWrapping,
        wrapT: THREE.ClampToEdgeWrapping,
        minFilter: THREE.NearestFilter,
        magFilter: THREE.NearestFilter,
        format: THREE.RGBAFormat,
        type: THREE.FloatType,
        depthBuffer: false,
        stencilBuffer: false,
    });
    }

    let rtA = createRenderTarget(TEX_W(), TEX_H());
    let rtB = createRenderTarget(TEX_W(), TEX_H());

    // compute shader: single-pass leapfrog-ish update for scalar wave
    const computeFrag = `
    precision highp float;
    precision highp sampler2D;

    in vec2 vUv;
    out vec4 outColor;
    uniform sampler2D prevTex; // r = u, g = v
    uniform ivec3 grid; // nx, ny, nz
    uniform vec2 texSize; // width, height(total = ny*nz)
    uniform float dt;
    uniform float c2; // c^2
    uniform float dx; uniform float dy; uniform float dz;
    uniform float wallDamp; // attenuation inside walls/obstacles
    uniform vec3 srcPos; // normalized [0..1] in x,y,z
    uniform float srcAmp;
    uniform float srcOmega;
    uniform float time;
    uniform int srcType; // 0=pulse,1=cw

    // helper to convert 3D i,j,k to uv
    vec2 uvFor(int i, int j, int k){
    // i in [0..nx-1], j in [0..ny-1], k in [0..nz-1]
    float u = (float(i) + 0.5) / float(grid.x);
    float row = float(k * grid.y + j);
    float v = (row + 0.5) / float(grid.y * grid.z);
    return vec2(u, v);
    }

    // sample u at neighbor with bounds clamped
    float sampleU(int i,int j,int k){
    i = clamp(i, 0, grid.x-1);
    j = clamp(j, 0, grid.y-1);
    k = clamp(k, 0, grid.z-1);
    vec2 uv = uvFor(i,j,k);
    return texture(prevTex, uv).r;
    }

    bool isObstacle(int i,int j,int k){
    // simple room walls: bounding box walls 1 voxel thick
    if (i<=1 || i>=grid.x-2) return true;
    if (j<=1 || j>=grid.y-2) return true;
    if (k<=0 || k>=grid.z-1) return true;
    // place a table (box) in middle
    int cx = grid.x/2;
    int cz = grid.z/2;
    if (k < int(float(grid.z)*0.4) && k > int(float(grid.z)*0.2)){
        if (i > cx-10 && i < cx+10 && j > int(float(grid.y)*0.1) && j < int(float(grid.y)*0.18)) return true;
    }
    return false;
    }

    void main(){
    // get integer pixel coordinate for this RT
    ivec2 coord = ivec2(gl_FragCoord.xy);

    int ix = coord.x; // [0..nx-1]
    int flatY = coord.y; // [0..ny*nz-1]
    int kz = flatY / grid.y; // slice index
    int jy = flatY - kz * grid.y; // y index

    int i = ix;
    int j = jy;
    int k = kz;

    // read previous state
    vec2 prev = texture(prevTex, vec2((float(i)+0.5)/float(grid.x), (float(k*grid.y + j)+0.5)/float(grid.y*grid.z))).rg;
    float u = prev.r;
    float v = prev.g;

    // discrete Laplacian (6-neighbor)
    float u_xp = sampleU(i+1,j,k);
    float u_xm = sampleU(i-1,j,k);
    float u_yp = sampleU(i,j+1,k);
    float u_ym = sampleU(i,j-1,k);
    float u_zp = sampleU(i,j,k+1);
    float u_zm = sampleU(i,j,k-1);

    float lap = (u_xp + u_xm - 2.0*u) / (dx*dx)
                + (u_yp + u_ym - 2.0*u) / (dy*dy)
                + (u_zp + u_zm - 2.0*u) / (dz*dz);

    float newV = v + dt * c2 * lap;
    // local damping in obstacles/walls
    float damping = 0.0;
    if (isObstacle(i,j,k)) damping = wallDamp;
    newV *= exp(-damping * dt);
    float newU = u + dt * newV;

    // source injection: add to newU if near source
    // compute normalized voxel coords
    vec3 pos = vec3((float(i)+0.5)/float(grid.x), (float(j)+0.5)/float(grid.y), (float(k)+0.5)/float(grid.z));
    float dist = distance(pos, srcPos);
    if (srcType == 0) {
        // gaussian pulse in time
        float pulse = srcAmp * exp(-pow((time - 1.5), 2.0) * 8.0) * exp(-pow(dist*float(grid.x),2.0)/16.0);
        newU += pulse;
    } else {
        float cw = srcAmp * sin(srcOmega * time) * exp(-pow(dist*float(grid.x),2.0)/64.0);
        newU += cw;
    }

    outColor = vec4(newU, newV, 0.0, 0.0);
    }
    `;


    const computeVert = `
    precision highp float;
    in vec3 position;
    in vec2 uv;
    out vec2 vUv;
    void main(){ vUv = uv; gl_Position = vec4(position,1.0); }
    `;

    function makeComputeMaterial(frag){
    return new THREE.RawShaderMaterial({
        vertexShader: computeVert,
        fragmentShader: frag,
        uniforms: {
        prevTex: { value: null },
        grid: { value: [NX, NY, NZ] },
        texSize: { value: new THREE.Vector2(TEX_W(), TEX_H()) },
        dt: { value: dt },
        c2: { value: c*c },
        dx: { value: dx }, dy: { value: dy }, dz: { value: dz },
        wallDamp: { value: 1.6 },
        srcPos: { value: new THREE.Vector3(0.12, 0.8, 0.7) },
        srcAmp: { value: 0.8 },
        srcOmega: { value: 2.0 * Math.PI * 2.0 },
        time: { value: 0.0 },
        srcType: { value: 1 }
        },
        glslVersion: THREE.GLSL3
    });
    }

    const matCompute = makeComputeMaterial(computeFrag);
    const passCompute = (function(){ const m = new THREE.Mesh(quad, matCompute); const s = new THREE.Scene(); s.add(m); return {mesh:m, scene:s}; })();

    // Visualization: raymarch the packed 3D texture
    const visFrag = `
    precision highp float;
    precision highp sampler2D;
    in vec2 vUv;
    out vec4 outColor;
    uniform sampler2D volumeTex; // packed
    uniform ivec3 grid; // nx,ny,nz
    uniform vec2 texSize; // width, height
    uniform mat4 invViewProj;
    uniform vec3 camPos;
    uniform int steps;
    uniform float vmin; uniform float vmax;

    // convert 3D voxel index to uv
    vec2 uvFor(int i,int j,int k){
    float u = (float(i)+0.5)/float(grid.x);
    float row = float(k*grid.y + j);
    float v = (row + 0.5)/float(grid.y*grid.z);
    return vec2(u,v);
    }

    float sampleUatVec3(vec3 p){
    // p in [0..1]
    // convert to voxel indices
    float fx = p.x * float(grid.x) - 0.5;
    float fy = p.y * float(grid.y) - 0.5;
    float fz = p.z * float(grid.z) - 0.5;
    int ix = int(floor(fx+0.5));
    int iy = int(floor(fy+0.5));
    int iz = int(floor(fz+0.5));
    ix = clamp(ix,0,grid.x-1);
    iy = clamp(iy,0,grid.y-1);
    iz = clamp(iz,0,grid.z-1);
    vec2 uv = uvFor(ix,iy,iz);
    return texture(volumeTex, uv).r;
    }

    void main(){
    // build ray in view space
    vec2 ndc = vUv * 2.0 - 1.0;
    vec4 p0 = invViewProj * vec4(ndc, -1.0, 1.0);
    p0 /= p0.w;
    vec4 p1 = invViewProj * vec4(ndc, 1.0, 1.0);
    p1 /= p1.w;
    vec3 ro = camPos;
    vec3 rd = normalize(p1.xyz - p0.xyz);

    // intersect with unit cube centered at origin (room occupies [-sx..sx])
    // we will map world coordinates to [0..1] across grid
    // here assume room size scaled so cube [-1..1]
    float tmin = 0.0;
    float tmax = 1000.0;
    // slab method for cube [-1,1]
    vec3 invD = 1.0 / rd;
    vec3 t0s = (-1.0 - ro) * invD;
    vec3 t1s = ( 1.0 - ro) * invD;
    vec3 ta = min(t0s, t1s);
    vec3 tb = max(t0s, t1s);
    tmin = max(tmin, max(max(ta.x, ta.y), ta.z));
    tmax = min(tmax, min(min(tb.x, tb.y), tb.z));
    if (tmax < tmin) { outColor = vec4(0.0); return; }

    float t = max(tmin, 0.0);
    float dtStep = (tmax - t) / float(steps);
    vec3 accumColor = vec3(0.0);
    float accumAlpha = 0.0;
    for (int i=0;i<1024;i++){
        if (i>=steps) break;
        vec3 p = ro + (t + (float(i)+0.5)*dtStep) * rd; // world pos
        // map world pos [-1..1] -> [0..1]
        vec3 local = (p + 1.0) * 0.5;
        if (any(lessThan(local, vec3(0.0))) || any(greaterThan(local, vec3(1.0)))) continue;
        float s = sampleUatVec3(local);
        // map s to color
        float tval = clamp((s - vmin)/(vmax - vmin), 0.0, 1.0);
        vec3 col = vec3(tval, 1.0 - tval, 0.3 + 0.7*tval);
        float alpha = smoothstep(0.01, 0.6, abs(s));
        // front-to-back compositing
        accumColor = accumColor + (1.0 - accumAlpha) * alpha * col;
        accumAlpha = accumAlpha + (1.0 - accumAlpha) * alpha;
        if (accumAlpha > 0.99) break;
    }
    outColor = vec4(accumColor, accumAlpha);
    }
    `;

    const visMaterial = new THREE.RawShaderMaterial({
    vertexShader: computeVert,
    fragmentShader: visFrag,
    uniforms: {
        volumeTex: { value: null },
        grid: { value: [NX, NY, NZ] },
        texSize: { value: new THREE.Vector2(TEX_W(), TEX_H()) },
        invViewProj: { value: new THREE.Matrix4() },
        camPos: { value: new THREE.Vector3() },
        steps: { value: 80 },
        vmin: { value: -0.5 }, vmax: { value: 0.5 }
    },
    transparent: true,
    depthTest: false,
    glslVersion: THREE.GLSL3
    });
    const visMesh = new THREE.Mesh(quad, visMaterial);
    const visScene = new THREE.Scene(); visScene.add(visMesh);

    // helpers to clear RT
    function clearRenderTarget(rt){ const old = renderer.getRenderTarget(); renderer.setRenderTarget(rt); renderer.setClearColor(0x000000,0); renderer.clear(true,true,true); renderer.setRenderTarget(old); }
    clearRenderTarget(rtA); clearRenderTarget(rtB);

    // initialize prev textures to zero
    matCompute.uniforms.prevTex.value = rtA.texture;

    // ping-pong
    let ping = rtA, pong = rtB;

    // UI
    const freqEl = document.getElementById('freq'); const freqVal = document.getElementById('freqVal');
    const ampEl = document.getElementById('amp'); const ampVal = document.getElementById('ampVal');
    const wallDampEl = document.getElementById('wallDamp'); const wallDampVal = document.getElementById('wallDampVal');
    const stepsEl = document.getElementById('steps'); const stepsVal = document.getElementById('stepsVal');
    const sTypeEl = document.getElementById('sType');

    // main step: run compute shader once (one dt) and swap
    let time = 0.0;
    function stepGPU(){
    matCompute.uniforms.prevTex.value = ping.texture;
    matCompute.uniforms.grid.value = [NX, NY, NZ];
    matCompute.uniforms.texSize.value.set(TEX_W(), TEX_H());
    matCompute.uniforms.dt.value = dt;
    matCompute.uniforms.c2.value = c*c;
    matCompute.uniforms.dx.value = dx; matCompute.uniforms.dy.value = dy; matCompute.uniforms.dz.value = dz;
    matCompute.uniforms.wallDamp.value = 1.60;
    matCompute.uniforms.srcPos.value.set(0.12, 0.8, 0.7);
    matCompute.uniforms.srcAmp.value = 0.80;
    matCompute.uniforms.srcOmega.value = 2.0 * Math.PI * 2.80 * 0.01; // scaled
    matCompute.uniforms.time.value = time;
    matCompute.uniforms.srcType.value = 1;

    renderer.setRenderTarget(pong);
    renderer.render(passCompute.scene, new THREE.OrthographicCamera(-1,1,1,-1,0,1));
    renderer.setRenderTarget(null);
    // swap
    let t = ping; ping = pong; pong = t;
    }

    function renderVis(){
    visMaterial.uniforms.volumeTex.value = ping.texture;
    visMaterial.uniforms.grid.value = [NX, NY, NZ];
    visMaterial.uniforms.texSize.value.set(TEX_W(), TEX_H());
    visMaterial.uniforms.steps.value = 16;
    visMaterial.uniforms.vmin.value = -0.8; visMaterial.uniforms.vmax.value = 0.8;
    // compute inverse view-proj
    camera.updateMatrixWorld(); camera.updateProjectionMatrix();
    const viewMat = camera.matrixWorldInverse;
    const proj = camera.projectionMatrix;
    const viewProj = new THREE.Matrix4().multiplyMatrices(proj, viewMat);
    const inv = new THREE.Matrix4().copy(viewProj).invert();
    visMaterial.uniforms.invViewProj.value.copy(inv);
    visMaterial.uniforms.camPos.value.copy(camera.position);
    renderer.render(visScene, camera);
    }

    // animation loop
    let lastT = performance.now();
    function animate(){
    requestAnimationFrame(animate);
    const now = performance.now();
    const dtMs = now - lastT; lastT = now;
    // run some compute steps per frame
    const elapsed = dtMs/1000;
    let stepsToRun = Math.min(8, Math.max(1, Math.ceil(elapsed / dt)));
    for (let i=0;i<stepsToRun;i++){
        time += dt;
        stepGPU();
    }
    renderVis();
    }
    animate();

    window.addEventListener('resize', ()=>{ renderer.setSize(window.innerWidth, window.innerHeight); camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); });

    // expose helper to change resolution from console
    window.setResolution = function(nx,ny,nz){
    NX = nx; NY = ny; NZ = nz;
    dt = CFL * Math.min(dx,Math.min(dy,dz)) / Math.sqrt(3.0);
    rtA.dispose(); rtB.dispose(); rtA = createRenderTarget(TEX_W(), TEX_H()); rtB = createRenderTarget(TEX_W(), TEX_H()); ping = rtA; pong = rtB;
    matCompute.uniforms.grid.value.set(NX,NY,NZ);
    visMaterial.uniforms.grid.value.set(NX,NY,NZ);
    clearRenderTarget(rtA); clearRenderTarget(rtB);
    }
}
