import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";
import { OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import { MTLLoader } from "three/examples/jsm/loaders/MTLLoader";

export function initRenderer(canvas) {
    simple3D(canvas);
}

//Test workspace, will replace soon based sa mga requirements na kailangan ipasa

function simple3D(canvas) {
    // ---------------------------
  // Basic scene + renderer init
  // ---------------------------
  let textureLoader;
  let scene, camera, renderer, controls;
  let width, height;

  function init() {
    scene = new THREE.Scene();
    textureLoader = new THREE.TextureLoader();
    const rect = canvas.getBoundingClientRect();
    width = rect.width || window.innerWidth;
    height = rect.height || window.innerHeight;

    camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 2000);
    camera.position.set(0, 2, 8);

    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height, false);
    renderer.setClearColor(0x2a2a2a);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;

    // Lights
    const dir = new THREE.DirectionalLight(0xffffff, 0.9);
    dir.castShadow = true;
    dir.position.set(5, 6, 5);
    scene.add(dir);
    scene.add(new THREE.AmbientLight(0x616161));

    const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x222222);
    scene.add(gridHelper);
  }

  function roomSetup() {
    const texturePath = getAssetPath('textures/Dune-Wood-Tile.jpg');
    console.log('Loading texture from:', texturePath);
    const texture = textureLoader.load(
      texturePath,
      tex => console.log('Texture loaded successfully'),
      undefined,
      err => console.error('Error loading texture:', err)
    );
    texture.wrapS = THREE.MirroredRepeatWrapping;
    texture.wrapT = THREE.MirroredRepeatWrapping;
    texture.repeat.set( 15, 10 );
    const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(20, 20),
        new THREE.MeshStandardMaterial({ map: texture, metalness: 0.2, roughness: 0.7, reflectivity: 0.5 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const wallMat = new THREE.MeshLambertMaterial({ color: 0xffffff, metalness: 0.1, roughness: 0.9 });
    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(20, 10), wallMat);
    backWall.position.set(0, 5, -10);
    backWall.receiveShadow = true;
    scene.add(backWall);
    const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(20, 10), wallMat);
    leftWall.position.set(-10, 5, 0);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.receiveShadow = true;
    scene.add(leftWall);
    const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(20, 10), wallMat);
    rightWall.position.set(10, 5, 0);
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.receiveShadow = true;
    scene.add(rightWall);
    const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), wallMat);
    ceiling.position.set(0, 10, 0);
    ceiling.rotation.x = Math.PI / 2;
    scene.add(ceiling);
  }

  // ---------------------------
  // Create gizmo (arrows)
  // ---------------------------
  function createArrow(color, axis) {
    const group = new THREE.Group();

    const shaft = new THREE.CylinderGeometry(0.02, 0.02, 1, 12);
    const head = new THREE.ConeGeometry(0.05, 0.2, 12);
    const mat = new THREE.MeshBasicMaterial({ color });

    const shaftMesh = new THREE.Mesh(shaft, mat);
    const headMesh = new THREE.Mesh(head, mat);

    // Arrows point up along +Y by default, position them
    shaftMesh.position.y = 0.5;
    headMesh.position.y = 1.1;

    group.add(shaftMesh);
    group.add(headMesh);

    // rotate to match axis
    if (axis === 'x') group.rotation.z = -Math.PI / 2;
    if (axis === 'z') group.rotation.x = Math.PI / 2;

    // mark axis on the group so we can find it by climbing parents on intersect
    group.userData.axis = axis;

    return group;
  }

  // We'll create the gizmo but do NOT add it to scene yet.
  const gizmo = new THREE.Group();
  gizmo.name = 'Gizmo';
  gizmo.add(createArrow(0xff0000, 'x'));
  gizmo.add(createArrow(0x00ff00, 'y'));
  gizmo.add(createArrow(0x0000ff, 'z'));

  // Optionally make gizmo slightly larger for easier picking
  gizmo.scale.set(1.2, 1.2, 1.2);

  // ---------------------------
  // Loaders & helpers
  // ---------------------------
  const mtlLoader = new MTLLoader();
  const objLoader = new OBJLoader();

  function getAssetPath(path) {
    // Check if we're running in Electron
    if (window.electron) {
      console.log('Running in Electron, converting path:', path);
      const electronPath = window.electron.getAssetPath(path);
      console.log('Converted to:', electronPath);
      return electronPath;
    }
    // In web environment, return the path as is
    console.log('Running in web, using path:', path);
    return path;
  }

  function loadMaterial(mtlPath, objPath, objectName) {
    console.log(`Loading ${objectName}...`);
    const localMtlLoader = new MTLLoader();
    const localObjLoader = new OBJLoader();

    // Convert paths for the current environment
    const resolvedMtlPath = getAssetPath(mtlPath);
    const resolvedObjPath = getAssetPath(objPath);
    
    console.log('Resolved paths:', {
      mtl: resolvedMtlPath,
      obj: resolvedObjPath
    });

    return new Promise((resolve, reject) => {
        localMtlLoader.load(
            resolvedMtlPath,
            materials => {
                console.log(`Materials loaded for ${objectName}`);
                materials.preload();
                localObjLoader.setMaterials(materials);
                localObjLoader.load(
                    resolvedObjPath,
                    obj => {
                        console.log(`Object loaded for ${objectName}`);
                        obj.traverse(function(child) {
                            if (child.isMesh) {
                                child.castShadow = true;
                                child.receiveShadow = true;
                            }
                        });
                        obj.name = objectName || 'Unnamed';
                        scene.add(obj);
                        selectableObjects.push(obj);
                        console.log('Successfully added', objectName, 'to scene');
                        resolve(obj);
                    },
                    progress => {
                        console.log(`Loading progress for ${objectName}:`, progress);
                    },
                    error => {
                        console.error(`Error loading model ${resolvedObjPath}:`, error);
                        reject(error);
                    }
                );
            },
            progress => {
                console.log(`Loading material progress for ${objectName}:`, progress);
            },
            error => {
                console.error(`Error loading material ${resolvedMtlPath}:`, error);
                reject(error);
            }
        );
    });
    }

  // ---------------------------
  // Resize
  // ---------------------------
  function onResize() {
    const rect = canvas.getBoundingClientRect();
    width = rect.width || window.innerWidth;
    height = rect.height || window.innerHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  }
  window.addEventListener('resize', onResize);

  // ---------------------------
  // Raycast + drag logic
  // ---------------------------

  

  let isDragging = false;
  let activeAxis = null;
  let dragPlane = new THREE.Plane();
  let dragStartWorld = new THREE.Vector3();
  let dragStartValue = 0;
  let axisDirWorld = new THREE.Vector3();
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  const selectableObjects = [];

  // helper: climb parent chain to find userData.axis
  function findAxisAncestor(obj) {
    let o = obj;
    while (o) {
      if (o.userData && o.userData.axis) return o;
      o = o.parent;
    }
    return null;
  }

  function getMouseNDC(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * 2 - 1,
      y: -((event.clientY - rect.top) / rect.height) * 2 + 1
    };
  }

  function onPointerDown(event) {
    const ndc = getMouseNDC(event);
    mouse.set(ndc.x, ndc.y);
    raycaster.setFromCamera(mouse, camera);

    // find intersected arrow
    const intersects = raycaster.intersectObjects([gizmo], true);
    if (intersects.length === 0) return;

    const obj = intersects[0].object;
    const axisGroup = findAxisAncestor(obj);
    if (!axisGroup) return;

    activeAxis = axisGroup.userData.axis;
    isDragging = true;
    controls.enabled = false;

    const activeObject = gizmo.parent || gizmo;

    activeObject.getWorldPosition(dragStartWorld);

    // world axis direction
    axisDirWorld.set(
      activeAxis === 'x' ? 1 : 0,
      activeAxis === 'y' ? 1 : 0,
      activeAxis === 'z' ? 1 : 0
    );
    axisDirWorld.applyQuaternion(activeObject.getWorldQuaternion(new THREE.Quaternion())).normalize();

    // build a plane that contains the axis and faces the camera (so mouse movement is always valid)
    const camDir = new THREE.Vector3();
    camera.getWorldDirection(camDir);
    const planeNormal = new THREE.Vector3().crossVectors(axisDirWorld, camDir).cross(axisDirWorld).normalize();
    dragPlane.setFromNormalAndCoplanarPoint(planeNormal, dragStartWorld);

    // compute start value (scalar position along axis)
    const startIntersect = new THREE.Vector3();
    raycaster.ray.intersectPlane(dragPlane, startIntersect);
    dragStartValue = startIntersect.clone().sub(dragStartWorld).dot(axisDirWorld);
  }

  function onPointerMove(event) {
    if (!isDragging || !activeAxis) return;

    const ndc = getMouseNDC(event);
    mouse.set(ndc.x, ndc.y);
    raycaster.setFromCamera(mouse, camera);

    const hit = new THREE.Vector3();
    if (!raycaster.ray.intersectPlane(dragPlane, hit)) return;

    const currentValue = hit.clone().sub(dragStartWorld).dot(axisDirWorld);
    const deltaValue = currentValue - dragStartValue;

    const moveVec = axisDirWorld.clone().multiplyScalar(deltaValue);

    const activeObject = gizmo.parent || gizmo;

    activeObject.position.add(moveVec);

    dragStartWorld.add(moveVec);
  }

  function onPointerUp() {
    isDragging = false;
    activeAxis = null;
    controls.enabled = true;
  }

  function onSelectObject(event) {
    const ndc = getMouseNDC(event);
    mouse.set(ndc.x, ndc.y);
    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(selectableObjects, true);
    if (intersects.length === 0) return;

    const picked = intersects[0].object;
    const root = getRootObject(picked); // climb up to top-level OBJ group
    attachGizmo(root);
    }

    function getRootObject(obj) {
    let root = obj;
    while (root.parent && !selectableObjects.includes(root)) {
        root = root.parent;
    }
    return root;
    }

    function attachGizmo(target) {
    // detach from old parent
    if (gizmo.parent) gizmo.parent.remove(gizmo);

    target.add(gizmo);
    gizmo.position.set(0, 0, 0);
    console.log('Gizmo attached to:', target.name);
    }



  // Use pointer events on the canvas for better coordinate behavior
  canvas.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('dblclick', onSelectObject); // double-click to select (you can use click instead)

  init();

  roomSetup();

  // Load objects with proper path resolution
  loadMaterial('materials/Switch.mtl', 'objects/Switch.obj', 'Switch');
  
  // Add slight position offsets for multiple instances
  loadMaterial('materials/Switch.mtl', 'objects/Switch.obj', 'Switch1').then(obj => {
    if (obj) obj.position.set(2, 0, 0);
  });
  
  loadMaterial('materials/Switch.mtl', 'objects/Switch.obj', 'Switch2').then(obj => {
    if (obj) obj.position.set(-2, 0, 0);
  });

  loadMaterial('materials/Rack.mtl', 'objects/Rack.obj', 'Rack');

  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }
  animate();
}