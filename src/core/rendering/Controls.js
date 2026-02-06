import * as THREE from 'three';

let yaw = 0;
let pitch = 0;
const sensitivity = 0.002;
const keys = { w: false, a: false, s: false, d: false, q: false, e: false };

export function initEditorControls(camera, domElement) {
    domElement.addEventListener('mousemove', (e) => {
        if (e.buttons === 2) { 
            yaw -= e.movementX * sensitivity;
            pitch -= e.movementY * sensitivity;

            const limit = Math.PI / 2 - 0.01;
            pitch = Math.max(-limit, Math.min(limit, pitch));

            camera.quaternion.setFromEuler(new THREE.Euler(pitch, yaw, 0, 'YXZ'));
        }
    });

    domElement.addEventListener('wheel', (e) => {
        const zoomSpeed = 2.0;
        camera.fov = Math.max(1, Math.min(100, camera.fov + (e.deltaY * 0.05)));
        camera.updateProjectionMatrix();
    });

    domElement.addEventListener('contextmenu', e => e.preventDefault());

    window.addEventListener('keydown', (e) => {
        const k = e.code.replace('Key', '').toLowerCase();
        if (k in keys) keys[k] = true;
    });
    window.addEventListener('keyup', (e) => {
        const k = e.code.replace('Key', '').toLowerCase();
        if (k in keys) keys[k] = false;
    });
}

export function updateEditorControls(camera, delta) {
    const moveSpeed = 40 * delta;
    const zoomSpeed = 20 * delta; 

    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);

    if (keys.w) camera.position.addScaledVector(forward, moveSpeed);
    if (keys.s) camera.position.addScaledVector(forward, -moveSpeed);
    if (keys.a) camera.position.addScaledVector(right, -moveSpeed);
    if (keys.d) camera.position.addScaledVector(right, moveSpeed);

    if (keys.q) {
        camera.fov = Math.min(100, camera.fov + zoomSpeed);
        camera.updateProjectionMatrix();
    }
    if (keys.e) {
        camera.fov = Math.max(1, camera.fov - zoomSpeed);
        camera.updateProjectionMatrix();
    }
}