// src/core/structural/Site.js
import Floor from './Floor';

export default class Site {
    constructor(data = {}) {
        this.id = data.id || `site-${Math.random().toString(36).substr(2, 9)}`;
        this.name = data.name || 'New Site';
        this.type = 'site';

        this.position = {
            x: data.x || 0, 
            y: data.y || 0,
            rotation: data.rotation || 0 
        };
        
        this.geometry = {
            width: data.width || 20, 
            depth: data.depth || 20,
            height: 0, 
            points: data.points ? [...data.points] : [] 
        };
        this.floors = data.floors ? data.floors.map(f => new Floor(f)) : [];
        
        this.updateHeight();
    }

    updateHeight() {
        this.geometry.height = this.floors.reduce((sum, f) => sum + (f.height || 3.0), 0);
    }

    addFloor(floor) {
        floor.altitude = this.geometry.height;
        this.floors.push(floor);
        this.updateHeight();
    }
}