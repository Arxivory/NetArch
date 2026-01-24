import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import { setRendererContext } from './SceneAccess';

let renderer, scene, camera, controls;
let width, height;
let fov, aspect;

export function initRenderer(canvas) {
    width = canvas.clientWidth;
    height = canvas.clientHeight;

    fov = 40;
    aspect = width / height;

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(fov, aspect, 0.1, 1000);
    camera.position.set(0, 20, 50);

    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    const ctx = {
        renderer,
        scene,
        camera,
        controls
    }

    setRendererContext(ctx);
}
