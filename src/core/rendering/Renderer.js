import * as THREE from 'three';
import { setRendererContext } from './SceneAccess.js';
import { initWorld } from './DefaultScene.js';
import { startRenderLoop } from './RenderLoop';
import { initEditorControls } from './Controls.js';

let renderer, scene, camera;
let width, height;
let fov, aspect;

export function initRenderer(canvas) {
    width = canvas.clientWidth;
    height = canvas.clientHeight;

    fov = 65;
    aspect = width / height;

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(fov, aspect, 0.1, 5000);
    camera.position.set(0, 20, 50);

    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    initEditorControls(camera, renderer.domElement);

    const ctx = {
        renderer: renderer,
        scene: scene,
        camera: camera,
    }

    setRendererContext(ctx);

    initWorld();

    startRenderLoop();

    return ctx;
}
