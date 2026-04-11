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

        const width = this.geometry.rectangular.width * this.scaler;
        const depth = this.geometry.rectangular.depth * this.scaler;

        const scaledX = this.x * this.scaler;
        const scaledZ = this.z * this.scaler;

        const x = scaledX + (width / 2);
        const z = scaledZ + (depth / 2);

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
        rectangularMesh.position.set(
            x,
            0.1,
            z
        )

        return rectangularMesh;
    }

 getCircularForm() {
    const { radius: r } = this.geometry.circular;
    
    // Apply scaler consistent with rectangular
    const scaledR = r * this.scaler;
    const height = 0.5; 
    
    // Create Three.js Geometry
    // Note: No rotation needed, Cylinder defaults to standing upright on the Y-axis
    const geometry = new THREE.CylinderGeometry(scaledR, scaledR, height, 64);
    
    // Set Material (Transparent light blue)
    const material = new THREE.MeshStandardMaterial({
        color: 0x3498db,
        transparent: false,
        opacity: 0.3,
        depthWrite: false,
        roughness: 0.9,
        metalness: 0.3
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    
    // Position: Use scaled center coordinates. 
    // Assuming this.x and this.z represent the center of the logical circle.
    mesh.position.set(
        this.x * this.scaler, 
        height / 2, 
        this.z * this.scaler
    );
    
    // Attach metadata
    mesh.userData = { id: this.id, type: 'domain', shape: 'circle' };
    
    return mesh;
}

    getPolygonalForm() {
        if (!this.geometry.polygonal)
            throw Error("The Domain is not Polygonal. Try getting other forms.");
    }

    // will do the polygonal and circular later
}