export class ShapeRenderer {
  constructor(opts = {}) {
    this.gridSize = opts.gridSize || 32;
  }

  renderRectangles(ctx, rectangles) {
    for (const rect of rectangles) {
      ctx.fillStyle = 'rgba(174, 174, 174, 0.5)';
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
      ctx.strokeStyle = '#000000ff';
      ctx.lineWidth = 4;
      ctx.strokeRect(rect.x + 0.5, rect.y + 0.5, rect.w, rect.h);
    }
  }

  renderCircles(ctx, circles) {
    ctx.strokeStyle = '#000000ff';
    ctx.lineWidth = 4;
    for (const circle of circles) {
      ctx.beginPath();
      ctx.fillStyle = 'rgba(174, 174, 174, 0.5)';
      ctx.arc(circle.x + 0.5, circle.y + 0.5, circle.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.closePath();
    }
  }

  renderPolygons(ctx, polygons) {
    ctx.strokeStyle = '#000000ff';
    ctx.fillStyle = 'rgba(150,150,150,0.4)';
    ctx.lineWidth = 4;
    for (const poly of polygons) {
      ctx.beginPath();
      const pts = poly.points;
      ctx.moveTo(pts[0].x + 0.5, pts[0].y + 0.5);
      for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(pts[i].x + 0.5, pts[i].y + 0.5);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  }

  renderWalls(ctx, walls) {
    ctx.strokeStyle = '#000000ff';
    ctx.lineWidth = 4;
    for (const wall of walls) {
      ctx.beginPath();
      ctx.moveTo(wall.x1 + 0.5, wall.y1 + 0.5);
      ctx.lineTo(wall.x2 + 0.5, wall.y2 + 0.5);
      ctx.stroke();
    }
  }

  renderCables(ctx, cables) {
    ctx.strokeStyle = '#292929ff';
    ctx.lineWidth = 1.5;
    for (const cable of cables) {
      ctx.beginPath();
      ctx.moveTo(cable.x1 + 0.5, cable.y1 + 0.5);
      ctx.lineTo(cable.x2 + 0.5, cable.y2 + 0.5);
      ctx.stroke();
    }
  }

  renderDevices(ctx, devices) {
    ctx.save();
    ctx.strokeStyle = '#000000ff';
    ctx.fillStyle = 'rgba(0, 0, 0, 1)';
    ctx.lineWidth = 1;

    for (const dev of devices) {
      const size = this.gridSize * 1.3;
      const halfSize = size / 2;
      const x = dev.x - halfSize;
      const y = dev.y - halfSize;

      ctx.fillRect(x, y, size, size);
      ctx.strokeRect(x, y, size, size);

      ctx.font = '12px sans-serif';
      ctx.fillStyle = '#000000';
      ctx.textAlign = 'center';
      ctx.fillText(dev.label, dev.x, dev.y + halfSize + 14);
    }
    ctx.restore();
  }

  outlineRectangle(ctx, startPoint, currentPoint) {
    const x = Math.min(startPoint.x, currentPoint.x);
    const y = Math.min(startPoint.y, currentPoint.y);
    const width = Math.abs(currentPoint.x - startPoint.x);
    const height = Math.abs(currentPoint.y - startPoint.y);
    ctx.fillRect(x, y, width, height);
    ctx.strokeRect(x + 0.5, y + 0.5, width, height);
  }

  outlineCircle(ctx, startPoint, currentPoint) {
    const cx = startPoint.x;
    const cy = startPoint.y;
    const dx = currentPoint.x - cx;
    const dy = currentPoint.y - cy;
    const r = Math.hypot(dx, dy);
    ctx.beginPath();
    ctx.arc(cx + 0.5, cy + 0.5, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  outlineWall(ctx, startPoint, currentPoint) {
    ctx.beginPath();
    ctx.moveTo(startPoint.x + 0.5, startPoint.y + 0.5);
    ctx.lineTo(currentPoint.x + 0.5, currentPoint.y + 0.5);
    ctx.stroke();
  }

  outlineCable(ctx, startPoint, currentPoint) {
    ctx.beginPath();
    ctx.moveTo(startPoint.x + 0.5, startPoint.y + 0.5);
    ctx.lineTo(currentPoint.x + 0.5, currentPoint.y + 0.5);
    ctx.stroke();
  }

  outlinePolygonInProgress(ctx, polygonPoints, currentPoint, snapTolerance) {
    if (polygonPoints.length > 0) {
      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = 1.5;

      const pts = polygonPoints;

      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);

      for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(pts[i].x, pts[i].y);
      }

      ctx.lineTo(currentPoint.x, currentPoint.y);
      ctx.stroke();

      const first = pts[0];
      const dist = Math.hypot(
        currentPoint.x - first.x,
        currentPoint.y - first.y
      );

      if (dist < snapTolerance * 1.5) {
        ctx.beginPath();
        ctx.arc(first.x, first.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,255,0,0.3)';
        ctx.fill();
      }
    }
  }
}

export default ShapeRenderer;
