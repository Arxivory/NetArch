import { updateEditorControls } from "./Controls";
import { moveGridandGroundToCamera, moveSkyboxToCamera } from "./DefaultScene";
import { getScene, getRenderer, getCamera } from "./SceneAccess";
import * as THREE from 'three';

let animationId;

const clock = new THREE.Clock();

export function startRenderLoop() {
    function render() {
        const delta = clock.getDelta();
        animationId = requestAnimationFrame(render);
        updateEditorControls(getCamera(), delta);
        getRenderer().render(getScene(), getCamera());
        moveSkyboxToCamera(getCamera().position);
        moveGridandGroundToCamera(getCamera().position);
    }

    render();
}

export function stopRenderLoop() {
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
}