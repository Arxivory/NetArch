import * as THREE from 'three';

export default class SiteMesh {
    constructor(opts = {}, defaultScaler) {
        this.id = opts.id;
        this.type = opts.type;
        this.defaultHeight = 50.0;

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
            throw Error("The Site is not Rectangular. Try getting other forms.");

        const width = this.geometry.rectangular.width * this.scaler;
        const depth = this.geometry.rectangular.depth * this.scaler;

        const points = [
            { x: -width / 2, z: -depth / 2 },
            { x:  width / 2, z: -depth / 2 },
            { x:  width / 2, z:  depth / 2 },
            { x: -width / 2, z:  depth / 2 }
        ];

        const rectShape = new THREE.Shape();
        rectShape.moveTo(points[0].x, points[0].z);
        for (let i = 1; i < points.length; i++)
            rectShape.lineTo(points[i].x, points[i].z);
        rectShape.closePath();

        const thickness = 0.7;
        const holePath = new THREE.Path();
        holePath.moveTo(points[0].x + thickness, points[0].z + thickness);
        holePath.lineTo(points[1].x - thickness, points[1].z + thickness);
        holePath.lineTo(points[2].x - thickness, points[2].z - thickness);
        holePath.lineTo(points[3].x + thickness, points[3].z - thickness);
        holePath.closePath();
        rectShape.holes.push(holePath);

        const extrudeSettings = {
            depth: this.defaultHeight,
            bevelEnabled: true,
            bevelThickness: 0.05,
            bevelSize: 0.05,
            bevelSegments: 2
        };

        const rectGeometry = new THREE.ExtrudeGeometry(rectShape, extrudeSettings);
        const wallSideMat = new THREE.MeshStandardMaterial({ color: 0xcccccc });
        const wallTopMat = new THREE.MeshStandardMaterial({ color: 0x333333 });

        const rectMesh = new THREE.Mesh(rectGeometry, [wallTopMat, wallSideMat]);
        rectMesh.rotation.x = -Math.PI / 2;

        rectMesh.position.set((this.x * this.scaler) + (width / 2), 0, ((this.z * this.scaler) + (depth / 2)));

        const ceilingGeometry = new THREE.PlaneGeometry(width - (thickness * 2), depth - (thickness * 2));
        const ceilingMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xf5f5f5,
            roughness: 0.8,
            metalness: 0.0
        });
        
        const ceilingMesh = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
        ceilingMesh.rotation.x = Math.PI / 2;
        ceilingMesh.position.set(
            (this.x * this.scaler) + (width / 2),
            this.defaultHeight,
            (this.z * this.scaler) + (depth / 2)
        );
        ceilingMesh.userData = { type: 'ceiling', id: this.id };

        const group = new THREE.Group();
        group.add(rectMesh);
        group.add(ceilingMesh);
        group.userData = { type: 'site', id: this.id };

        return group;
    }

    getCircularForm() {
        if (!this.geometry.circular)
            throw Error("The Site is not Circular. Try getting other forms.");
    }

    getPolygonalForm() {
        if (!this.geometry.polygonal)
            throw Error("The Site is not Polygonal. Try getting other forms.");
    }

    // will do the polygonal and circular later
}