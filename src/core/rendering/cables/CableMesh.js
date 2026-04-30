import * as THREE from 'three';

export default class CableMesh {
    constructor(opts = {}, defaultScaler, deviceMeshes) {
        this.id = opts.id;
        this.cableType = opts.cableType;
        this.sourceDeviceId = opts.sourcePort.id.split("::")[0];
        this.targetDeviceId = opts.targetPort.id.split("::")[0];

        this.sourceDeviceMesh = deviceMeshes.get(this.sourceDeviceId);
        this.targetDeviceMesh = deviceMeshes.get(this.targetDeviceId);

        this.mesh = this._buildMesh();
    }

    _getPositions() {
        return {
            source: this.sourceDeviceMesh.getWorldPosition(new THREE.Vector3()),
            target: this.targetDeviceMesh.getWorldPosition(new THREE.Vector3()),
        };
    }

    _buildMesh() {
        const { source, target } = this._getPositions();

        const midPoint = new THREE.Vector3()
            .addVectors(source, target)
            .multiplyScalar(0.5);
        midPoint.y -= 1.5;

        const curve = new THREE.QuadraticBezierCurve3(source, midPoint, target);

        const geometry = new THREE.TubeGeometry(curve, 50, 0.1, 8, false);
        const material = new THREE.MeshBasicMaterial({ color: 0x333333 });

        return new THREE.Mesh(geometry, material);
    }

    update() {
        const { source, target } = this._getPositions();

        const midPoint = new THREE.Vector3()
            .addVectors(source, target)
            .multiplyScalar(0.5);
        midPoint.y -= 1.5;

        const curve = new THREE.QuadraticBezierCurve3(source, midPoint, target);

        this.mesh.geometry.dispose();
        this.mesh.geometry = new THREE.TubeGeometry(curve, 50, 0.1, 8, false);
    }

    getMesh() {
        return this.mesh;
    }
}