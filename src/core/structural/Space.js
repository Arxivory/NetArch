export default class Space {
    constructor(data = {}) {
        // this.id = data.id || `space-${Math.random().toString(36).substr(2, 9)}`;
        // this.label = data.label || 'Room';
        
    
        // this.floorId = data.floorId || null;

        // this.geometry = {
        //     type: data.points && data.points.length > 0 ? 'polygon' : 'rectangle',
        //     points: data.points || [], 
        //     height: data.height || 3.0 
        // };

        // this.deviceIds = data.deviceIds || [];
        // these are for future implementations

        this.id = data.id || `site-${Math.random().toString(36).substr(2, 9)}`;
        this.siteId = data.siteId;
        this.label = data.label || 'New Site';
        this.shapeType = data.shapeType;
        this.type = 'site';

        this.geometry = {
            x: data.x || 0,
            y: data.y || 0,
            width: data.w || 0,
            height: data.h || 0,
            radius: data.r || 0,
            points: data.points ? [...data.points]: []
        };

    }
}