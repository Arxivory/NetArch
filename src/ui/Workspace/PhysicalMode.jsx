import { useEffect, useRef } from "react";

export default function PhysicalMode() {
  const canvasRef = useRef(null);

  // useEffect(() => {
  //   if (canvasRef.current) {
  //     initRenderer(canvasRef.current);
  //   }

  // }, []);

  return <canvas ref={canvasRef} className="workspace-canvas" />;
}
