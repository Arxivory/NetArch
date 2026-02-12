import Fenestration from './Fenestration'; 

export default class Floor {
    constructor(data = {}) {
        this.id = data.id || `floor-${Math.random().toString(36).substr(2, 9)}`;
        this.label = data.label || 'Floor';
        this.altitude = data.altitude || 0; 
        
        this.spaces = data.spaces ? data.spaces.map(s => new Space(s)) : [];

        this.fenestrations = data.fenestrations 
            ? data.fenestrations.map(f => new Fenestration(f)) 
            : [];
    }
    addFenestration(fenestration) {
        fenestration.parentId = this.id;
        this.fenestrations.push(fenestration);
        return fenestration;
    }
    getWalls() {
        return this.fenestrations.filter(f => f.type === 'wall');
    }
}