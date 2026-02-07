import { useEffect, useRef } from "react";
import { initRenderer } from "../../core/rendering/Renderer";
import { stopRenderLoop } from "../../core/rendering/RenderLoop";

export default function PhysicalMode() {
  const canvasRef = useRef(null);
  const rendererCtxRef = useRef(null);

  useEffect(() => {
    if (canvasRef.current) {
      rendererCtxRef.current = initRenderer(canvasRef.current);
    }

    return () => {
      if (rendererCtxRef.current) {
        stopRenderLoop();
        rendererCtxRef.current = null;
      }
    };
  }, []);

  return <canvas ref={canvasRef} className="workspace-canvas" />;
}
