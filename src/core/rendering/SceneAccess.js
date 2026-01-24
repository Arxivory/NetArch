import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/Addons.js';

let renderer, scene, camera, controls;

export function setRendererContext(ctx) {
    renderer = ctx.renderer;
    scene = ctx.scene;
    camera = ctx.camera;
    controls = ctx.controls;
}

export function getScene() {
    if (!scene) throw new Error("Scene not initialized");
    return scene;
}

export function getCamera() {
    if (!camera) throw new Error("Camera not initialized");
    return camera;
}

export function getRenderer() {
    if (!renderer) throw new Error("Renderer not initialized");
    return renderer;
}

export function getControls() {
    if (!controls) throw new Error("Controls not initialized");
    return controls;
}