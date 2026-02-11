export default class Space {
    constructor(data = {}) {
        this.id = data.id || `space-${Math.random().toString(36).substr(2, 9)}`;
        this.label = data.label || 'Room';
        
    
        this.floorId = data.floorId || null;

        this.geometry = {
            type: data.points && data.points.length > 0 ? 'polygon' : 'rectangle',
            points: data.points || [], 
            height: data.height || 3.0 
        };

        this.deviceIds = data.deviceIds || [];

    }
}