import { useEffect, useRef } from "react";
import { initRenderer } from "../../core/rendering/Renderer";
import { stopRenderLoop } from "../../core/rendering/RenderLoop";
import { PhysicalController } from "../../core/PhysicalController";

export default function PhysicalMode() {
  const canvasRef = useRef(null);
  const rendererCtxRef = useRef(null);

  useEffect(() => {
    if (canvasRef.current) {
      rendererCtxRef.current = initRenderer(canvasRef.current);
    }

    const physicalController = new PhysicalController(rendererCtxRef.current.scene);
    physicalController.addDomainsFromState();

    return () => {
      if (rendererCtxRef.current) {
        stopRenderLoop();
        rendererCtxRef.current = null;
      }
    };
  }, []);

  return <canvas ref={canvasRef} className="workspace-canvas" />;
}
