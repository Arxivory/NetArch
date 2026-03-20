import * as THREE from 'three';

export default class FloorMesh {
    constructor(opts = {}, defaultScaler) {
        this.id = opts.id;
        this.type = opts.type;
        this.defaultHeight = 0.1; 

        this.x = opts.geometry.x;
        this.y = opts.altitude || 0;
        this.z = opts.geometry.y;
        this.scaler = defaultScaler;

        this.geometry = {
            rectangular: {
                width: opts.geometry.width,
                depth: opts.geometry.height
            },
            polygonal: {
                points: opts.geometry.points
            },
            circular: {
                radius: opts.geometry.radius
            }
        }
    }

    getRectangularForm() {
        if (!this.geometry.rectangular)
            throw Error("The Floor is not Rectangular. Try getting other forms.");

        const width = this.geometry.rectangular.width * this.scaler;
        const depth = this.geometry.rectangular.depth * this.scaler;

        const scaledX = this.x * this.scaler;
        const scaledZ = this.z * this.scaler;

        const x = scaledX + (width / 2);
        const z = scaledZ + (depth / 2);

        const floorGeometry = new THREE.BoxGeometry(
            width,
            this.defaultHeight, 
            depth
        );

        const floorMaterial = new THREE.MeshStandardMaterial({
            color: 0xd4a574,
            roughness: 0.7,
            metalness: 0.1
        });

        const floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
        floorMesh.position.set(x, this.y, z);
        floorMesh.userData = { type: 'floor', id: this.id };

        return floorMesh;
    }
}
