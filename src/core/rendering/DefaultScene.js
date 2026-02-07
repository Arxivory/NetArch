import * as THREE from 'three';
import { getRenderer, getScene } from './SceneAccess';
import { GroundedSkybox } from 'three/examples/jsm/Addons.js';
import { loadEnvironmentMap } from './loaders/TextureLoader';
import { initSkybox } from './world/Skybox';

let skybox, grid, ground, ambientLight, directionalLight;

export async function initWorld() {
    const scene = getScene();
    scene.fog = new THREE.Fog( 0xcccccc, 0.1, 400 );

    const planeGeometry = new THREE.PlaneGeometry(500, 500);
    const planeMaterial = new THREE.MeshStandardMaterial({
        color: 0x808080,
        side: THREE.DoubleSide
    });

    ground = new THREE.Mesh(
        planeGeometry,
        planeMaterial
    );

    ground.rotation.x = -Math.PI / 2;

    grid = new THREE.GridHelper(500, 50);
    scene.add(grid);

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

export function moveGridandGroundToCamera(cameraPosition) {
    if (!grid || !ground) return;

    ground.position.x = cameraPosition.x;
    ground.position.z = cameraPosition.z;

    grid.position.x = Math.round(cameraPosition.x / 10) * 10;
    grid.position.z = Math.round(cameraPosition.z / 10) * 10;
}

function setupLighting(scene) {
    ambientLight = new THREE.AmbientLight(0x2020ff, 0.2);
    directionalLight = new THREE.DirectionalLight(0xffffff, 1);

    directionalLight.position.set(20, 20, 20);
    
    scene.add(ambientLight);
    scene.add(directionalLight);
}

export function cleanupWorld() {
    try {
        const scene = getScene();
        
        if (grid) {
            scene.remove(grid);
            grid.geometry?.dispose();
            grid.material?.dispose();
            grid = null;
        }

        if (ground) {
            scene.remove(ground);
            ground.geometry?.dispose();
            ground.material?.dispose();
            ground = null;
        }

        if (skybox) {
            scene.remove(skybox);
            skybox.geometry?.dispose();
            skybox.material?.dispose();
            skybox = null;
        }

        if (ambientLight) {
            scene.remove(ambientLight);
            ambientLight = null;
        }
        if (directionalLight) {
            scene.remove(directionalLight);
            directionalLight = null;
        }

        scene.fog = null;
    } catch (e) {
        console.warn('Error during world cleanup:', e);
    }
}