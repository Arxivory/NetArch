
import { Rectangle } from './entities/Rectangle.js';
import { Circle } from './entities/Circle.js';
import { Polygon } from './entities/Polygon.js';
import { Freeform } from './entities/Freeform.js';
import { Device } from './entities/Device.js';

export class ShapeCreator {
  constructor(opts = {}) {
    this.onRectangleCreated = opts.onRectangleCreated || null;
    this.onCircleCreated = opts.onCircleCreated || null;
    this.onPolygonCreated = opts.onPolygonCreated || null;
    this.onFreeformCreated = opts.onFreeformCreated || null;
    this.onWallCreated = opts.onWallCreated || null;
    this.onCableCreated = opts.onCableCreated || null;
    this.system = opts.system || null;
  }

  _genId(prefix) {
    return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
  }

  createRectangle(startPoint, currentPoint, structureType = '') {
    const rectangle = new Rectangle(startPoint, currentPoint, structureType, this.system);
    if (rectangle.w <= 0 || rectangle.h <= 0) {
      this.system.remove(rectangle.body);
      return null;
    }
    rectangle.id = this._genId(`Rectangle ${structureType}`);
    return rectangle;
  }

  createCircle(startPoint, currentPoint, structureType = '') {
    const circle = new Circle(startPoint, currentPoint, structureType, this.system);
    if (circle.r <= 2) {
      this.system.remove(circle.body);
      return null;
    }
    circle.id = this._genId(`Circle ${structureType}`);
    return circle;
  }

  createPolygon(points, structureType = '') {
    if (!points || points.length < 3) {
      return null;
    }
    const polygon = new Polygon(points, structureType, this.system);
    polygon.id = this._genId(`Polygon ${structureType}`);
    return polygon;
  }

  createFreeform(points, structureType = '') {
    if (!points || points.length <= 1) {
      return null;
    }
    const freeform = new Freeform(points, structureType, this.system);
    freeform.id = this._genId(`Freeform ${structureType}`);
    return freeform;
  }

  createWall(startPoint, currentPoint) {
    const x1 = startPoint.x;
    const y1 = startPoint.y;
    const x2 = currentPoint.x;
    const y2 = currentPoint.y;
    const path = new Path2D();
    path.moveTo(x1, y1);
    path.lineTo(x2, y2);
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

  createDevice(deviceData, x, y, size) {
    const device = new Device(deviceData, x, y, size, this.system);
    device.id = this._genId(device.type + " ");
    return device;
  }

  canClosePolygon(firstPoint, currentPoint, snapTolerance) {
    const dist = Math.hypot(currentPoint.x - firstPoint.x, currentPoint.y - firstPoint.y);
    return dist <= snapTolerance * 1.5;
  }
}

export default ShapeCreator;
