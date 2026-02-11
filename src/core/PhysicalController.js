import * as THREE from 'three';
import appState from '../state/AppState';

export class PhysicalController {
    constructor(scene) {
        this.scene = scene;
        this.store = appState.structural;
        this.meshes = new Map();
        this.defaultScaler = 0.7;

        this.domainMeshes = new Map();

        this.unsubscribe = this.store.subscribe(() => this.syncWithState());

        this.syncWithState();
    }

    syncWithState() {
        const domains = this.store.domains;
        const activeIds = new Set();

        for (const domain of domains) {
            activeIds.add(domain.id);

            if (this.domainMeshes.has(domain.id)) {
                continue;
            } 

            switch (domain.shapeType) {
                case 'rectangle':
                    this.createDomainMesh(domain);
                    break;
                case 'polygon':
                    this.createPolygonalDomainMesh(domain);
                    break;
            }
        }

        for (const [id, mesh] of this.domainMeshes) {
            if (!activeIds.has(id)) {
                this.scene.remove(mesh);
                this.domainMeshes.delete(id);
            }
        }
    }

    createDomainMesh(domain) {
        const { x, y, width, height } = domain.geometry;

        const modifiedX = x * this.defaultScaler;
        const modifiedY = y * this.defaultScaler;
        const modifiedWidth = width * this.defaultScaler;
        const modifiedHeight = height * this.defaultScaler;

        const geometry = new THREE.BoxGeometry(modifiedWidth, 1, modifiedHeight);
        const material = new THREE.MeshBasicMaterial({ color: 0x858585 });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(modifiedX, 0.1, modifiedY);

        this.scene.add(mesh);
        this.domainMeshes.set(domain.id, mesh);
    }

    createPolygonalDomainMesh(domain) {
        const { x, y } = domain.geometry;
        const modifiedX = x * this.defaultScaler;
        const modifiedY = y * this.defaultScaler;

        const shape = new THREE.Shape();
        const points = domain.geometry.points;

        shape.moveTo((points[0].x - x) * this.defaultScaler, (points[0].y - y) * this.defaultScaler);

        for (let i = 1; i < points.length; i++) {
            shape.lineTo((points[i].x - x) * this.defaultScaler, (points[i].y - y) * this.defaultScaler);
        }
        shape.closePath();

        const geometry = new THREE.ExtrudeGeometry(shape, {
            depth: 1,
            bevelEnabled: false
        });

        geometry.rotateX(-Math.PI / 2);

        const material = new THREE.MeshBasicMaterial({ 
            color: 0x858585,
            side: THREE.DoubleSide
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(modifiedX, 0.1, modifiedY);
        this.scene.add(mesh);
        this.domainMeshes.set(domain.id, mesh);
    }

    updateDomainMesh(domain) {
        const { x, y, width, height } = domain.geometry;

        const modifiedX = x * this.defaultScaler;
        const modifiedY = y * this.defaultScaler;
        const modifiedWidth = width * this.defaultScaler;
        const modifiedHeight = height * this.defaultScaler;

        const mesh = this.domainMeshes.get(domain.id);
        mesh.scale.set(modifiedWidth, 1, modifiedHeight);
        mesh.position.set(modifiedX, 0.1, modifiedY);
    }
}