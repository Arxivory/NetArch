import * as THREE from 'three';

export default class CableMesh {
    constructor(opts={}, defaultScaler, deviceMeshes) {
        console.log(opts);
        this.id = opts.id;
        this.cableType = opts.cableType;
        this.sourceDeviceId = opts.sourcePort.id.split("::")[0];
        this.targetDeviceId = opts.targetPort.id.split("::")[0];

        console.log('Source Id: ', this.sourceDeviceId);
        console.log('Target Id: ', this.targetDeviceId);

        this.sourceDeviceCoordinates = deviceMeshes
            .get(this.sourceDeviceId)
            .getWorldPosition(new THREE.Vector3());

        this.targetDeviceCoordinates = deviceMeshes
            .get(this.targetDeviceId)
            .getWorldPosition(new THREE.Vector3());
    }

    getMesh() {
        const midPoint = new THREE.Vector3().addVectors(
            this.sourceDeviceCoordinates,
            this.targetDeviceCoordinates
        ).multiplyScalar(0.5);

        midPoint.y -= 1.5;

        const curve = new THREE.QuadraticBezierCurve3(
            this.sourceDeviceCoordinates,
            midPoint,
            this.targetDeviceCoordinates
        );

        const tubeGeometry = new THREE.TubeGeometry(
            curve,
            50,
            0.1,
            8,
            false
        );

        const cableMaterial = new THREE.MeshBasicMaterial({ color: 0x333333 });
        const cableMesh = new THREE.Mesh(tubeGeometry, cableMaterial);

        return cableMesh;
    }
}