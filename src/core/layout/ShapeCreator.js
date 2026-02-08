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

    if (rw > 2 && rh > 2) {
      const rectangle = {
        id: this._genId(`Rectangle ${structureType}`),
        x: rx,
        y: ry,
        w: rw,
        h: rh,
        structureType
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

    if (r > 2) {
      const circle = {
        id: this._genId(`Circle ${structureType}`),
        x: cx,
        y: cy,
        r,
        structureType
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

    const polygon = {
      id: this._genId('polygon'),
      points: [...points],
      structureType
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

    if (Math.hypot(x2 - x1, y2 - y1) > 2) {
      const wall = {
        id: this._genId('wall'),
        x1,
        y1,
        x2,
        y2
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

    if (Math.hypot(x2 - x1, y2 - y1) > 2) {
      const cable = {
        id: this._genId('cable'),
        x1,
        y1,
        x2,
        y2
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
