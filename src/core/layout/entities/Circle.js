import { Circle as SystemCircle } from "check2d";

export class Circle {
    constructor(startPoint, currentPoint, structureType, system) {
        this.id = null;
        this.x = startPoint.x;
        this.y = startPoint.y;
        this.initRadius(currentPoint);
        this.system = system;
        this.type = 'circle';
        this.structureType = structureType;
        this.hitTestMode = 'path';
        this.initPath();
        this.initBody();
        this.initTransform();

    }

    initRadius(currentPoint) {
        const dx = currentPoint.x - this.x;
        const dy = currentPoint.y - this.y;
        this.r = Math.hypot(dx, dy);
    }

    initPath() {
        this.path = new Path2D();
        this.path.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    }

    initBody() {
        const margin = 0.001;
        this.body = new SystemCircle({ x: this.x, y: this.y }, this.r - margin);
        this.system.insert(this.body);
    }

    initTransform() {
        this.transform = {
            position: { x: this.x, y: this.y, z: 0 },
            scale: { factor: 1, r: this.r },
            rotation: { x: 0, y: 0, z: 0 }
        }
    }

    updatePath() {
        const path = new Path2D();
        path.arc(this.x, this.y, this.transform.scale.r, 0, Math.PI * 2);
        this.path = path;
    }

    setScale(newScale) {
        this.transform.scale.factor = newScale.factor;
        this.transform.scale.r = this.r * newScale.factor;
        this.body.setScale(newScale.factor);
    }

    saveCurrentScale() {
        this.savedScale = JSON.parse(JSON.stringify(this.transform.scale));
    }

    restoreToSavedScale() {
        this.transform.scale = this.savedScale;
        this.body.setScale(this.transform.scale.factor);
    }

    saveCurrentPosition() {
        this.savedPosition = {
            x: this.x,
            y: this.y,
        };
    }

    restoreToSavedPosition() {
        this.x = this.savedPosition.x;
        this.y = this.savedPosition.y;
        this.transform.position.x = this.x;
        this.transform.position.y = this.y;
        this.body.setPosition(this.x, this.y, true);
    }

    move(dx, dy) {
        this.x += dx;
        this.y += dy;
        this.transform.position.x += dx;
        this.transform.position.y += dy;
        this.body.setPosition(this.x, this.y, true);
    }

    checkIfOverlapping() {
        let overlapping = false;
        this.system.checkOne(this.body, (other) => {
            if (other !== this.body) {
                overlapping = true;
            }
        });
        return overlapping;
    }

    overlapsWithRectangle(rect) {
        console.log("In Here");
        const { minX, maxX, minY, maxY } = rect.getCurrentBounds();

        // Clamp circle center to rectangle bounds
        const closestX = Math.max(minX, Math.min(this.x, maxX));
        const closestY = Math.max(minY, Math.min(this.y, maxY));

        // Distance from circle center to closest point
        const dx = this.x - closestX;
        const dy = this.y - closestY;

        return (dx * dx + dy * dy) <= (this.r * this.r);
    }

    overlapsWithOtherCircle(circle) {
        const x1 = this.x;
        const y1 = this.y;
        const r1 = this.transform.scale.r;

        const x2 = circle.x;
        const y2 = circle.y;
        const r2 = circle.transform.scale.r;

        const dx = x2 - x1;
        const dy = y2 - y1;

        const distanceSquared = dx * dx + dy * dy;
        const radiusSum = r1 + r2;

        return distanceSquared <= radiusSum * radiusSum;
    }

    overlapsWithPolygon() {
        return false;
    }

    overlapsWithFreeform() {
        return false;
    }

    overlapsWithDevice() {
        return false;
    }

    overlapsWithWall() {
        return false;
    }

    overlapsWithCable() {
        return false;
    }
}

export default Circle;