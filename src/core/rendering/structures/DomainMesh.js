import * as THREE from 'three';

export default class DomainMesh {
    constructor(opts = {}, defaultScaler) {
        this.id = opts.id;
        this.type = opts.type;
        this.defaultHeight = 1.0;

        this.x = opts.geometry.x;
        this.y = 0.1;
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
            throw Error("The Domain is not Rectangular. Try getting other forms.");

        const width = this.rectangular.width * this.scaler;
        const depth = this.rectangular.depth * this.scaler;

        const scaledX = this.x * this.scaler;
        const scaledZ = this.z * this.scaler;

        const x = scaledX * (width / 2);
        const z = scaledZ * (depth / 2);

        const rectangularGeometry = new THREE.BoxGeometry(
            width,
            this.defaultHeight, 
            depth
        );

        const rectangularMaterial = new THREE.MeshStandardMaterial({
            color: 0xfffff,
            roughness: 0.9,
            metalness: 0.3
        });

        const rectangularMesh = new THREE.Mesh(rectangularGeometry, rectangularMaterial);

        return rectangularMesh;
    }

    getCircularForm() {
        if (!this.geometry.circular)
            throw Error("The Domain is not Circular. Try getting other forms.");
    }

    getPolygonalForm() {
        if (!this.geometry.polygonal)
            throw Error("The Domain is not Polygonal. Try getting other forms.");
    }

    // will do the polygonal and circular later
}