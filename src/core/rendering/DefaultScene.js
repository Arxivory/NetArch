import * as THREE from 'three';
import { getRenderer, getScene } from './SceneAccess';
import { GroundedSkybox } from 'three/examples/jsm/Addons.js';
import { loadEnvironmentMap } from './loaders/TextureLoader';

export async function initWorld() {
    const scene = getScene();

    const planeGeometry = new THREE.PlaneGeometry(200, 200);
    const planeMaterial = new THREE.MeshStandardMaterial({
        color: 0x808080,
        side: THREE.DoubleSide
    });

    const ground = new THREE.Mesh(
        planeGeometry,
        planeMaterial
    );

    ground.rotation.x = -Math.PI / 2;

    const gridHelper = new THREE.GridHelper(200, 50);
    scene.add(gridHelper);

    setupLighting(scene);
    setupSkybox(scene);
    scene.add(ground);
}

function setupSkybox(scene) {
    const skyGeo = new THREE.SphereGeometry(1000, 32, 32);
    const skyMat = new THREE.ShaderMaterial({
        uniforms: {
            colorTop: { value: new THREE.Color(0x0077ff) }, 
            colorBottom: { value: new THREE.Color(0xffffff) }, 
        },
        vertexShader: `
            varying vec3 vWorldPosition;
            void main() {
            vWorldPosition = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform vec3 colorTop;
            uniform vec3 colorBottom;
            varying vec3 vWorldPosition;
            void main() {
            float h = normalize(vWorldPosition).y;
            gl_FragColor = vec4(mix(colorBottom, colorTop, max(h, 0.0)), 1.0);
            }
        `,
        side: THREE.BackSide 
    });

    const skybox = new THREE.Mesh(skyGeo, skyMat);
    scene.add(skybox);
}

function setupLighting(scene) {
    const ambientLight = new THREE.AmbientLight(0x2020ff, 0.2);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);

    directionalLight.position.set(20, 20, 20);
    
    scene.add(ambientLight);
    scene.add(directionalLight);
}