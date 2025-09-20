export function initRenderer(canvas) {
  const gl = canvas.getContext("webgl2");
  if (!gl) {
    alert("WebGL2 not supported");
    return;
  }

  gl.clearColor(0.2, 0.2, 0.25, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);
}
