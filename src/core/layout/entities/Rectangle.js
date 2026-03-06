export class Rectangle {
    constructor(startPoint, currentPoint, structureType) {
        this.id = null;
        this.x = Math.min(startPoint.x, currentPoint.x);
        this.y = Math.min(startPoint.y, currentPoint.y);
        this.maxX = Math.max(startPoint.x, currentPoint.x);
        this.maxY = Math.max(startPoint.y, currentPoint.y);
        this.w = this.maxX - this.x;
        this.h = this.maxY - this.y;
        this.type = 'rectangle';
        this.structureType = structureType;
        this.hitTestMode = 'path';
        this.initPath();
        this.initTransform();
    }

    initPath() {
        this.path = new Path2D();
        this.path.rect(this.x, this.y, this.w, this.h);
    }

    initTransform() {
        this.transform = {
            position: { x: this.x, y: this.y, z: 0 },
            scale: { factor: 1, w: this.w, h: this.h },
            rotation: { x: 0, y: 0, z: 0 }
        }
    }


    updatePath() {
        const path = new Path2D();
        path.rect(this.x, this.y, this.transform.scale.w, this.transform.scale.h);
        this.path = path;
    }

    setScale(newScale) {
        this.transform.scale.factor = newScale.factor;
        this.transform.scale.w = this.w * newScale.factor;
        this.transform.scale.h = this.h * newScale.factor;
    }

    setPreviousScale() {
        this.previousScale = JSON.parse(JSON.stringify(this.transform.scale));
    }

    saveCurrentPosition() {
        this.savedPosition = {
            x: this.x,
            y: this.y,
            maxX: this.maxX,
            maxY: this.maxY
        }
    }

    restoreToSavedPosition() {
        this.x = this.savedPosition.x;
        this.y = this.savedPosition.y;
        this.maxX = this.savedPosition.maxX;
        this.maxY = this.savedPosition.maxY;
        this.transform.position.x = this.x;
        this.transform.position.y = this.y;
    }

    getCurrentBounds() {
        return {
            minX: this.x,
            maxX: this.x + this.transform.scale.w,
            minY: this.y,
            maxY: this.y + this.transform.scale.h
        }
    }

    checkIfOverlapping(otherEn) {
        switch (otherEn.type) {
            case 'rectangle':
                return this.overlapsWithOtherRectangle(otherEn);
            case 'circle':
                return this.overlapsWithCircle(otherEn);
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

    overlapsWithOtherRectangle(rect) {
        const thisLeft = this.x;
        const thisRight = this.x + this.transform.scale.w;
        const thisTop = this.y;
        const thisBottom = this.y + this.transform.scale.h;

        const otherLeft = rect.x;
        const otherRight = rect.x + rect.transform.scale.w;
        const otherTop = rect.y;
        const otherBottom = rect.y + rect.transform.scale.h;

        return !(
            thisRight <= otherLeft ||
            thisLeft >= otherRight ||
            thisBottom <= otherTop ||
            thisTop >= otherBottom
        );
    }
    overlapsWithCircle(circle) {
        const { minX, maxX, minY, maxY } = this.getCurrentBounds();

        // Clamp circle center to rectangle bounds
        const closestX = Math.max(minX, Math.min(circle.x, maxX));
        const closestY = Math.max(minY, Math.min(circle.y, maxY));

        // Distance from circle center to closest point
        const dx = circle.x - closestX;
        const dy = circle.y - closestY;

        return (dx * dx + dy * dy) <= (circle.r * circle.r);
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

export default Rectangle;