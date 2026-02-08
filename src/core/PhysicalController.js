import * as THREE from 'three';
import appState from '../state/AppState';

export class PhysicalController {
    constructor(scene) {
        this.scene = scene;
    }

    destroy() {
        this.scene = null;
    }

    addDomainsFromState() {
        for (const domain of appState.structural.domains) {
            console.log('Adding domain to physical controller: ', domain);
            const { x, y, width, height } = domain.geometry;

            const geometry = new THREE.BoxGeometry(width, 1, height);
            const material = new THREE.MeshBasicMaterial({ color: 0x909090 });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(0, 0.2, 0); //test
            this.scene.add(mesh);
        }
    }
}