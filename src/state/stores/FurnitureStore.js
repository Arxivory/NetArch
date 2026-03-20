import Furniture from "../../core/furniture/Furniture"

export class FurnitureStore {
    constructor() {
        this.furnitures = [];
    };

    addFurniture(furniture) {
        if (!furniture.id) {
            throw new Error("Furniture must have an ID");
        }
        if (this.furnitures.find(f => f.id === furniture.id)) {
            console.warn(`Furniture with ID ${furniture.id} already exists. Skipping add.`);
            return null;
        }
    
        const newFurnitureData = {
            id: furniture.id,
            type: furniture.catalogId,
            floorId: furniture.floorId || null,
            spaceId: furniture.spaceId || null,
            transform: {
                position: { x: furniture.position.x, y: 0, z: furniture.position.y },
                rotation: { x: 0, y: 0, z: 1 },
                scale: { x: 1, y: 1, z: 1 }
            }
        }

        const newFurniture = new Furniture(newFurnitureData);
        newFurniture.type = furniture.catalogId;
        newFurniture.floorId = furniture.floorId || null;
        newFurniture.spaceId = furniture.spaceId || null;

        this.furnitures.push(newFurniture);
        return newFurniture;
    };

    removeFurniture(furnitureId) {
        const index = this.furnitures.findIndex(f => f.id === furnitureId);
        if (index === -1) {
            console.warn(`Furniture with ID ${furnitureId} not found. Cannot remove.`);
            return false;
        }
        this.furnitures.splice(index, 1);
        return true;
    }

    getFurniture(furnitureId) {
        return this.furnitures.find(f => f.id === furnitureId) || null;
    }
};
