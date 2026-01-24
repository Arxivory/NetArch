import * as THREE from 'three';
import { getScene } from './SceneAccess';
import { GroundedSkybox } from 'three/examples/jsm/Addons.js';

export function initWorld() {
    const scene = getScene();

    const planeGeometry = new THREE.PlaneGeometry(200, 200);
    const planeMaterial = new THREE.MeshStandardMaterial({
        color: 0x808080,
        side: THREE.DoubleSide
    });

    const ground = new THREE.Mesh({
        planeGeometry,
        planeMaterial
    });

    ground.rotation.x = -Math.PI / 2;

    setupLighting(scene);

    scene.add(ground);
}

function setupSkybox(scene, envMap) {
    const height = 15;
    const radius = 100;

    const skybox = new GroundedSkybox(envMap, radius, height);

    scene.add(skybox);

}

function setupLighting(scene) {
    const ambientLight = new THREE.AmbientLight(0x2020ff, 0.2);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);

    directionalLight.position.set(20, 20, 20);
    
    scene.add(ambientLight);
    scene.add(directionalLight);
}