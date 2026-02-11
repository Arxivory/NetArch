export default class Floor {
    constructor(data = {}) {
        this.id = data.id || `floor-${Math.random().toString(36).substr(2, 9)}`;
        this.label = data.label || 'Floor';
        this.type = 'floor';

        this.spaceIds = data.spaceIds || [];
    }
}