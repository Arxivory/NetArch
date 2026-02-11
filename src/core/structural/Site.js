export default class Site {
    constructor(data = {}) {
        this.id = data.id || `site-${Math.random().toString(36).substr(2, 9)}`;
        this.label = data.label || 'New Site';
        this.type = 'site';

        this.shapeType = data.shapeType || 'rectangle';

        this.geometry = {
            x: data.x || 0,
            y: data.y || 0,
            width: data.w || 0,
            height: data.h || 0,
            radius: data.r || 0,
            points: data.points ? [...data.points] : []
        };

        this.floorIds = data.floorIds || [];
    }
}