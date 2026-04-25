import * as THREE from 'three';

export default class SpaceMesh {
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

    buildLocalPlanPoints(points) {
        return points.map((p) => new THREE.Vector2(
            (p.x - this.x) * this.scaler,
            -(p.y - this.z) * this.scaler
        ));
    }

    buildClosedPath(target, points) {
        target.moveTo(points[0].x, points[0].y);

        for (let i = 1; i < points.length; i++) {
            target.lineTo(points[i].x, points[i].y);
        }

        target.closePath();
    }

    buildInsetPoints(points, insetAmount) {
        const center = points.reduce(
            (acc, point) => acc.add(point),
            new THREE.Vector2(0, 0)
        ).multiplyScalar(1 / points.length);

        return points.map((point) => {
            const direction = new THREE.Vector2().subVectors(point, center);
            const length = direction.length();

            if (length <= insetAmount) {
                return point.clone();
            }

            return point.clone().sub(
                direction.normalize().multiplyScalar(insetAmount)
            );
        });
    }


    getRectangularForm() {
        if (!this.geometry.rectangular)
            throw Error("The Space is not Rectangular. Try getting other forms.");

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
        group.userData = { type: 'space', id: this.id };

        return group;
    }
    getPolygonalForm() {
        if (!this.geometry.polygonal || !this.geometry.polygonal.points?.length)
            throw Error("The Space is not Polygonal. Try getting other forms.");

        if (this.geometry.polygonal.points.length < 3)
            throw Error("A polygonal space needs at least 3 points.");

        const localPoints = this.buildLocalPlanPoints(this.geometry.polygonal.points);

        const outerShape = new THREE.Shape();
        this.buildClosedPath(outerShape, localPoints);

        const thickness = 0.7;
        const innerPoints = this.buildInsetPoints(localPoints, thickness);

        const holePath = new THREE.Path();
        this.buildClosedPath(holePath, innerPoints);
        outerShape.holes.push(holePath);

        const extrudeSettings = {
            depth: this.defaultHeight,
            bevelEnabled: true,
            bevelThickness: 0.05,
            bevelSize: 0.05,
            bevelSegments: 2
        };

        const wallSideMat = new THREE.MeshStandardMaterial({
            color: 0xcccccc,
            side: THREE.DoubleSide
        });

        const wallTopMat = new THREE.MeshStandardMaterial({
            color: 0x333333,
            side: THREE.DoubleSide
        });

        const ceilingMaterial = new THREE.MeshStandardMaterial({
            color: 0xf5f5f5,
            roughness: 0.8,
            metalness: 0.0,
            side: THREE.DoubleSide
        });

        const wallGeometry = new THREE.ExtrudeGeometry(outerShape, extrudeSettings);
        const wallMesh = new THREE.Mesh(wallGeometry, [wallTopMat, wallSideMat]);
        wallMesh.rotation.x = -Math.PI / 2;

        const ceilingShape = new THREE.Shape();
        this.buildClosedPath(ceilingShape, innerPoints);

        const ceilingGeometry = new THREE.ShapeGeometry(ceilingShape);
        const ceilingMesh = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
        ceilingMesh.rotation.x = -Math.PI / 2;
        ceilingMesh.position.y = this.defaultHeight;
        ceilingMesh.userData = { type: 'ceiling', id: this.id };

        const group = new THREE.Group();
        group.position.set(
            this.x * this.scaler,
            0,
            this.z * this.scaler
        );

        group.add(wallMesh);
        group.add(ceilingMesh);
        group.userData = { type: 'space', id: this.id, shape: 'polygon' }; // ADDED: mark this mesh as a polygonal space

        return group;
    }

    getCircularForm() {
        if (!this.geometry.circular)
            throw Error("The Space is not Circular. Try getting other forms.");

        const radius = this.geometry.circular.radius * this.scaler;
        const thickness = Math.min(0.7, radius * 0.35);
        const innerRadius = Math.max(radius - thickness, 0.01);
        const height = this.defaultHeight;

        const circleShape = new THREE.Shape();
        circleShape.absarc(0, 0, radius, 0, Math.PI * 2, false);

        const holePath = new THREE.Path();
        holePath.absarc(0, 0, innerRadius, 0, Math.PI * 2, true);
        circleShape.holes.push(holePath);

        const extrudeSettings = {
            depth: height,
            bevelEnabled: true,
            bevelThickness: 0.05,
            bevelSize: 0.05,
            bevelSegments: 2,
            curveSegments: 64
        };

        const wallSideMat = new THREE.MeshStandardMaterial({
            color: 0xf8f8f8,
            side: THREE.DoubleSide
        });

        const wallTopMat = new THREE.MeshStandardMaterial({
            color: 0x333333,
            side: THREE.DoubleSide
        });

        const wallGeometry = new THREE.ExtrudeGeometry(circleShape, extrudeSettings);
        const wallMesh = new THREE.Mesh(wallGeometry, [wallTopMat, wallSideMat]);
        wallMesh.rotation.x = -Math.PI / 2;

        const group = new THREE.Group();
        group.position.set(
            (this.x * this.scaler) + radius,
            0,
            (this.z * this.scaler) + radius
        );

        group.add(wallMesh);
        group.userData = { type: 'space', id: this.id, shape: 'circle' };

        return group;
    }

} 