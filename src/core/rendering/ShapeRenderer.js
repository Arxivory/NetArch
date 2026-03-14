export class ShapeRenderer {
  constructor(opts = {}) {
    this.gridSize = opts.gridSize || 32;
  }

  renderRectangles(ctx, rectangles) {
    for (const rect of rectangles) {
      const displayedWidth = rect.w * rect.transform.scale;
      const displayedHeigth = rect.h * rect.transform.scale;
      const path = new Path2D();
      path.rect(rect.x, rect.y, displayedWidth, displayedHeigth);
      rect.path = path;
      ctx.fillStyle = 'rgba(174, 174, 174, 0.5)';
      ctx.fillRect(rect.x, rect.y, displayedWidth, displayedHeigth);
      ctx.strokeStyle = '#000000ff';
      ctx.lineWidth = 4;
      ctx.strokeRect(rect.x + 0.5, rect.y + 0.5, displayedWidth, displayedHeigth);
    }
  }

  renderCircles(ctx, circles) {
    ctx.strokeStyle = '#000000ff';
    ctx.lineWidth = 4;
    for (const circle of circles) {
      const displayedRadius = circle.r * circle.transform.scale;
      const path = new Path2D();
      path.arc(circle.x + 0.5, circle.y + 0.5, displayedRadius, 0, Math.PI * 2);
      circle.path = path;
      ctx.beginPath();
      ctx.fillStyle = 'rgba(174, 174, 174, 0.5)';
      ctx.arc(circle.x + 0.5, circle.y + 0.5, displayedRadius, 0, Math.PI * 2);
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
      const s = typeof poly.transform?.scale === 'number' ? poly.transform.scale : (poly.transform?.scale?.x ?? 1);
      const pts = poly.points || [];
      if (pts.length === 0) continue;

      // compute centroid as anchor
      let ax = 0, ay = 0;
      for (let p of pts) { 
        ax += p.x; 
        ay += p.y; 
      }
      ax /= pts.length; ay /= pts.length;

      const scaled = pts.map(p => ({ 
        x: ax + (p.x - ax) * s, 
        y: ay + (p.y - ay) * s 
      }));

      const path = new Path2D();
      path.moveTo(scaled[0].x + 0.5, scaled[0].y + 0.5);
      for (let i = 1; i < scaled.length; i++) {
        path.lineTo(scaled[i].x + 0.5, scaled[i].y + 0.5);
      }
      path.closePath();
      poly.path = path;

      ctx.fill(path);
      ctx.stroke(path);
    }
  }

  renderWalls(ctx, walls) {
    ctx.strokeStyle = '#000000ff';
    ctx.lineWidth = 4;
    for (const wall of walls) {
      const s = typeof wall.transform?.scale === 'number' ? wall.transform.scale : (wall.transform?.scale?.x ?? 1);
      const x1 = wall.x1;
      const y1 = wall.y1;
      const x2 = wall.x2;
      const y2 = wall.y2;
      const ax = (x1 + x2) / 2;
      const ay = (y1 + y2) / 2;
      const sx1 = ax + (x1 - ax) * s;
      const sy1 = ay + (y1 - ay) * s;
      const sx2 = ax + (x2 - ax) * s;
      const sy2 = ay + (y2 - ay) * s;

      const path = new Path2D();
      path.moveTo(sx1 + 0.5, sy1 + 0.5);
      path.lineTo(sx2 + 0.5, sy2 + 0.5);

      wall.path = path;
      ctx.stroke(path);
    }
  }

  renderCables(ctx, cables) {
    ctx.strokeStyle = '#292929ff';
    ctx.lineWidth = 1.5;
    for (const cable of cables) {
      const s = typeof cable.transform?.scale === 'number' ? cable.transform.scale : (cable.transform?.scale?.x ?? 1);
      const x1 = cable.x1, y1 = cable.y1, x2 = cable.x2, y2 = cable.y2;
      const ax = (x1 + x2) / 2, ay = (y1 + y2) / 2;
      const sx1 = ax + (x1 - ax) * s, sy1 = ay + (y1 - ay) * s;
      const sx2 = ax + (x2 - ax) * s, sy2 = ay + (y2 - ay) * s;

      const path = new Path2D();
      path.moveTo(sx1 + 0.5, sy1 + 0.5);
      path.lineTo(sx2 + 0.5, sy2 + 0.5);

      cable.path = path;
      ctx.stroke(path);
    }
  }


renderDevices(ctx, devices) {
    ctx.save();
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.lineWidth = 1;

    for (const dev of devices) {
      // 1. Calculate Size & Position
      // Check for scale (handling both simple numbers and vector objects)
      const s = typeof dev.transform?.scale === 'number' 
                ? dev.transform.scale 
                : (dev.transform?.scale?.x ?? 1);
      
      const baseSize = this.gridSize * 1.5; // Made slightly larger for icons
      const size = baseSize * s;
      const halfSize = size / 2;
      
      const x = dev.x - halfSize;
      const y = dev.y - halfSize;

      // 2. Create Hit Path (Invisible, used for clicking the device)
      const path = new Path2D();
      path.rect(x, y, size, size);
      dev.path = path;

      // 3. Draw: Icon OR Fallback Square
      if (dev.icon && dev.icon.complete && dev.icon.naturalWidth !== 0) {
        // --- DRAW IMAGE ---
        try {
          ctx.drawImage(dev.icon, x, y, size, size);
        } catch (e) {
          console.warn("Error drawing device icon:", e);
          // Fallback if image fails
          this._drawFallbackDevice(ctx, x, y, size);
        }
      } else {
        // --- DRAW FALLBACK SQUARE ---
        this._drawFallbackDevice(ctx, x, y, size);
      }

      // 4. Draw Label (Below the device)
      ctx.fillStyle = '#000000';
      // Adjust text position based on size
      ctx.fillText(dev.label || 'Device', dev.x, dev.y + halfSize + 14);
    }
    ctx.restore();
  }

  renderFurnitures(ctx, furnitures) {
    ctx.save();
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.lineWidth = 1;

    for (const dev of furnitures) {
      // 1. Calculate Size & Position
      // Check for scale (handling both simple numbers and vector objects)
      const s = typeof dev.transform?.scale === 'number' 
                ? dev.transform.scale 
                : (dev.transform?.scale?.x ?? 1);
      
      const baseSize = this.gridSize * 1.5; // Made slightly larger for icons
      const size = baseSize * s;
      const halfSize = size / 2;
      
      const x = dev.x - halfSize;
      const y = dev.y - halfSize;

      // 2. Create Hit Path (Invisible, used for clicking the device)
      const path = new Path2D();
      path.rect(x, y, size, size);
      dev.path = path;

      // 3. Draw: Icon OR Fallback Square
      if (dev.icon && dev.icon.complete && dev.icon.naturalWidth !== 0) {
        // --- DRAW IMAGE ---
        try {
          ctx.drawImage(dev.icon, x, y, size, size);
        } catch (e) {
          console.warn("Error drawing device icon:", e);
          // Fallback if image fails
          this._drawFallbackDevice(ctx, x, y, size);
        }
      } else {
        // --- DRAW FALLBACK SQUARE ---
        this._drawFallbackDevice(ctx, x, y, size);
      }

      // 4. Draw Label (Below the device)
      ctx.fillStyle = '#000000';
      // Adjust text position based on size
      ctx.fillText(dev.label || 'Device', dev.x, dev.y + halfSize + 14);
    }
    ctx.restore();
  }

  // Helper for drawing the box when no image is found
  _drawFallbackDevice(ctx, x, y, size) {
    ctx.fillStyle = 'rgba(255, 255, 255, 1)'; // White background
    ctx.fillRect(x, y, size, size);
    ctx.strokeStyle = '#000000';
    ctx.strokeRect(x, y, size, size);
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
