export class ShapeCreator {
  constructor(opts = {}) {
    this.onRectangleCreated = opts.onRectangleCreated || null;
    this.onCircleCreated = opts.onCircleCreated || null;
    this.onPolygonCreated = opts.onPolygonCreated || null;
    this.onWallCreated = opts.onWallCreated || null;
    this.onCableCreated = opts.onCableCreated || null;
  }

  _genId(prefix) {
    return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
  }

  createRectangle(startPoint, currentPoint, structureType = '') {
    const x1 = startPoint.x;
    const y1 = startPoint.y;
    const x2 = currentPoint.x;
    const y2 = currentPoint.y;
    const rx = Math.min(x1, x2);
    const ry = Math.min(y1, y2);
    const rw = Math.abs(x2 - x1);
    const rh = Math.abs(y2 - y1);
    const path = new Path2D();
    path.rect(rx, ry, rw, rh);
    if (rw > 2 && rh > 2) {
      const rectangle = {
        id: this._genId(`Rectangle ${structureType}`),
        x: rx,
        y: ry,
        w: rw,
        h: rh,
        structureType,
        type: 'rectangle',
        transform: {
          position: { x: rx, y: ry, z: 0 },
          scale: 1,
          rotation: { x: 0, y: 0, z: 0 }
        },
        path,
        hitTestMode: 'path'
      };

      if (this.onRectangleCreated) {
        this.onRectangleCreated(rectangle);
      }

      return rectangle;
    }

    return null;
  }

  createCircle(startPoint, currentPoint, structureType = '') {
    const cx = startPoint.x;
    const cy = startPoint.y;
    const dx = currentPoint.x - cx;
    const dy = currentPoint.y - cy;
    const r = Math.hypot(dx, dy);
    const path = new Path2D();
    path.arc(cx, cy, r, 0, Math.PI * 2);
    if (r > 2) {
      const circle = {
        id: this._genId(`Circle ${structureType}`),
        x: cx,
        y: cy,
        r,
        structureType,
        type: 'circle',
        transform: {
          position: { x: cx, y: cy, z: 0 },
          scale: 1,
          rotation: { x: 0, y: 0, z: 0 }
        },
        path,
        hitTestMode: 'path'
      };

      if (this.onCircleCreated) {
        this.onCircleCreated(circle);
      }

      return circle;
    }

    return null;
  }

  createPolygon(points, structureType = '') {
    if (!points || points.length < 3) {
      return null;
    }

    const path = new Path2D();
    path.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      path.lineTo(points[i].x, points[i].y);
    }
    path.closePath();

    const polygon = {
      id: this._genId('polygon'),
      points: [...points],
      structureType,
      type: 'polygon',
      transform: {
        position: { x: points[0].x, y: points[0].y, z: 0 },
        scale: 1,
        rotation: { x: 0, y: 0, z: 0 }
      },
      path,
      hitTestMode: 'path'
    };

    if (this.onPolygonCreated) {
      this.onPolygonCreated(polygon);
    }

    return polygon;
  }

  createWall(startPoint, currentPoint) {
    const x1 = startPoint.x;
    const y1 = startPoint.y;
    const x2 = currentPoint.x;
    const y2 = currentPoint.y;
    const path = new Path2D();
    path.moveTo(x1, y1);
    path.lineTo(x2, y2);
    console.log(x1, y1);
    console.log(y1, y2);
    if (Math.hypot(x2 - x1, y2 - y1) > 2) {
      const wall = {
        id: this._genId('wall'),
        x1,
        y1,
        x2,
        y2,
        type: 'wall',
        transform: {
          position: { x: x1, y: y1, z: 0 },
          scale: 1,
          rotation: { x: 0, y: 0, z: 0 }
        },
        path,
        hitTestMode: 'stroke'
      };

      if (this.onWallCreated) {
        this.onWallCreated(wall);
      }

      return wall;
    }

    return null;
  }

  createCable(startPoint, currentPoint) {
    const x1 = startPoint.x;
    const y1 = startPoint.y;
    const x2 = currentPoint.x;
    const y2 = currentPoint.y;
    const path = new Path2D();
    path.moveTo(x1, y1);
    path.lineTo(x2, y2);
    if (Math.hypot(x2 - x1, y2 - y1) > 2) {
      const cable = {
        id: this._genId('cable'),
        x1,
        y1,
        x2,
        y2,
        type: 'cable',
        transform: {
          position: { x: x1, y: y1, z: 0 },
          scale: 1,
          rotation: { x: 0, y: 0, z: 0 }
        },
        path,
        hitTestMode: 'stroke'
      };

      if (this.onCableCreated) {
        this.onCableCreated(cable);
      }

      return cable;
    }

    return null;
  }

  canClosePolygon(firstPoint, currentPoint, snapTolerance) {
    const dist = Math.hypot(currentPoint.x - firstPoint.x, currentPoint.y - firstPoint.y);
    return dist <= snapTolerance * 1.5;
  }
}

export default ShapeCreator;
