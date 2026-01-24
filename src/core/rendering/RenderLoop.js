import { getScene, getRenderer, getCamera, getControls } from "./SceneAccess";

let animationId;

export function startRenderLoop() {
    function render() {
        animationId = requestAnimationFrame(render);
        getControls().update();
        getRenderer().render(getScene(), getCamera());
    }

    render();
}

export function stopRenderLoop() {
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
}