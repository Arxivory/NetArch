import * as THREE from 'three';
import appState from '../state/AppState';

export class PhysicalController {
    constructor(scene) {
        this.scene = scene;
        this.defaultScaler = 0.7;
    }

    destroy() {
        this.scene = null;
    }

    addDomainsFromState() {
        for (const domain of appState.structural.domains) {
            console.log('Adding domain to physical controller: ', domain);
            const { x, y, width, height } = domain.geometry;

            const geometry = new THREE.BoxGeometry(width * this.defaultScaler, 1, height * this.defaultScaler);
            const material = new THREE.MeshBasicMaterial({ color: 0x909090 });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(x * this.defaultScaler, 0.1, y * this.defaultScaler); 
            this.scene.add(mesh);
        }
    }
}