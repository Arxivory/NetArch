export default class Space {
    constructor(data = {}) {
        this.id = data.id || `space-${Math.random().toString(36).substr(2, 9)}`;
        this.floorId = data.floorId || null;
        this.siteId = data.siteId || null;
        this.label = data.label || 'Space';
        this.shapeType = data.type;
        this.type = 'space';

        this.geometry = {
            x: data.x || 0,
            y: data.y || 0,
            // maxX: data.maxX || 0,
            // maxY: data.maxY || 0,
            w: data.w || 0,
            h: data.h || 0,
            radius: data.r || 0,
            points: data.points ? [...data.points] : []
        };
    }
}