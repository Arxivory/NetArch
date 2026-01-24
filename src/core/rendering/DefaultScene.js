import * as THREE from 'three';
import { getRenderer, getScene } from './SceneAccess';
import { GroundedSkybox } from 'three/examples/jsm/Addons.js';
import { loadEnvironmentMap } from './loaders/TextureLoader';
import { initSkybox } from './world/Skybox';

let skybox;

export async function initWorld() {
    const scene = getScene();
    scene.fog = new THREE.Fog( 0xcccccc, 0.1, 400 );

    const planeGeometry = new THREE.PlaneGeometry(500, 500);
    const planeMaterial = new THREE.MeshStandardMaterial({
        color: 0x808080,
        side: THREE.DoubleSide
    });

    const ground = new THREE.Mesh(
        planeGeometry,
        planeMaterial
    );

    ground.rotation.x = -Math.PI / 2;

    const gridHelper = new THREE.GridHelper(500, 50);
    scene.add(gridHelper);

    setupLighting(scene);
    setupSkybox(scene);
    scene.add(ground);
}

function setupSkybox(scene) {
    skybox = initSkybox();
    scene.add(skybox);
}

export function moveSkyboxToCamera(cameraPosition) {
    if (!skybox) return;
    skybox.position.copy(cameraPosition);
}

function setupLighting(scene) {
    const ambientLight = new THREE.AmbientLight(0x2020ff, 0.2);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);

    directionalLight.position.set(20, 20, 20);
    
    scene.add(ambientLight);
    scene.add(directionalLight);
}