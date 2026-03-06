export class Circle {
    constructor(startPoint, currentPoint, structureType) {
        this.x = startPoint.x;
        this.y = startPoint.y;
        this.initRadius(currentPoint);
        this.type = 'circle';
        this.structureType = structureType;
        this.hitTestMode = 'path';
        this.initTransform();
        this.initPath();
    }

    initRadius(currentPoint) {
        const dx = currentPoint.x - this.x;
        const dy = currentPoint.y - this.y;
        this.r = Math.hypot(dx, dy);
    }

    initTransform() {
        this.transform = {
            position: { x: this.x, y: this.y, z: 0 },
            scale: { factor: 1, r: this.r },
            rotation: { x: 0, y: 0, z: 0 }
        }
    }

    initPath() {
        this.path = new Path2D();
        this.path.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    }

    updatePath() {
        const path = new Path2D();
        path.arc(this.x, this.y, this.transform.scale.r, 0, Math.PI * 2);
        this.path = path;
    }

    setScale(newScale) {
        this.transform.scale.factor = newScale.factor;
        this.transform.scale.r = this.r * newScale.factor;
    }

    setPreviousScale() {
        this.previousScale = JSON.parse(JSON.stringify(this.transform.scale));
    }

    saveCurrentPosition() {
        this.savedPosition = {
            x: this.x,
            y: this.y,
            r: this.r
        };
    }

    restoreToSavedPosition() {
        this.x = this.savedPosition.x;
        this.y = this.savedPosition.y;
        this.r = this.savedPosition.r;
        this.transform.position.x = this.x;
        this.transform.position.y = this.y;
    }

    checkIfOverlapping(otherEn) {
        switch (otherEn.type) {
            case 'rectangle':
                return this.overlapsWithRectangle(otherEn);
            case 'circle':
                return this.overlapsWithOtherCircle(otherEn);
            case 'polygon':
                return this.overlapsWithPolygon(otherEn);
            case 'freeform':
                return this.overlapsWithFreeform(otherEn);
            case 'device':
                return this.overlapsWithDevice(otherEn);
            case 'cable':
                return this.overlapsWithCable(otherEn);
            case 'wall':
                return this.overlapsWithWall(otherEn);
            default:
                return false;
        }
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