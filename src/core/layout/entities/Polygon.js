export class Polygon {
    constructor(points, structureType) {
        this.x = Math.min(...points.map(p => p.x));
        this.y = Math.min(...points.map(p => p.y));
        this.maxX = Math.max(...points.map(p => p.x));
        this.maxY = Math.max(...points.map(p => p.y));
        this.w = this.maxX - this.x;
        this.h = this.maxY - this.y;
        this.points = [...points];
        this.type = 'polygon';
        this.structureType = structureType;
        this.hitTestMode = 'path';
        this.initPath(points);
        this.initTransform();
    }


    initPath(points) {
        const path = new Path2D();
        path.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            path.lineTo(points[i].x, points[i].y);
        }
        path.closePath();
        this.path = path;
    }

    initTransform() {
        this.transform = {
            position: { x: this.points[0].x, y: this.points[0].y, z: 0 },
            scale: { factor: 1 },
            rotation: { x: 0, y: 0, z: 0 }
        }
    }

    updatePath() {
        const {ax, ay} = this.getCenter();
        const scaled = this.points.map(p => ({
            x: ax + (p.x - ax) * this.transform.scale.factor,
            y: ay + (p.y - ay) * this.transform.scale.factor
        }));

        const path = new Path2D();
        path.moveTo(scaled[0].x + 0.5, scaled[0].y + 0.5);
        for (let i = 1; i < scaled.length; i++) {
            path.lineTo(scaled[i].x + 0.5, scaled[i].y + 0.5);
        }
        path.closePath();
        this.path = path;
    }

    getCenter() {
        let ax = 0, ay = 0;
        for (let p of this.points) {
            ax += p.x;
            ay += p.y;
        }
        ax /= this.points.length;
        ay /= this.points.length;

        return { ax, ay};
    }

    setScale(newScale) {
        this.transform.scale.factor = newScale.factor;
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
                return this.overlapsWithRectangle(otherEn);
            case 'circle':
                return this.overlapsWithCircle(otherEn);
            case 'polygon':
                return this.overlapsWithOtherPolygon(otherEn);
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

    }
    overlapsWithCircle(circle) {
        return false;
    }

    overlapsWithOtherPolygon() {
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

export default Polygon;