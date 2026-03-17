import * as THREE from 'three';

export default class FurnitureMesh {
    constructor(opts={}, defaultScaler) {
        this.id = opts.id;
        this.type = opts.type;
        this.scaler = defaultScaler;

        this.transform = {
            position: opts.transform.position || { x: 0, y: 0, z: 0 },
            rotation: opts.transform.rotation || { x: 0, y: 0, z: 1 },
            scale: opts.transform.scale || { x: 1, y: 1, z: 1 }
        }

        console.log('Opts for FurnitureMesh:', opts);
    }

    getMesh(gltfLoader, furnitureCatalog) {
        const cId = this.type;
        const catalogEntry = furnitureCatalog[cId];

        if (!catalogEntry) throw Error("Furniture Type is not found.");

        let modelPath = catalogEntry.model3D;
        if (modelPath.endsWith('.obj')) {
            console.warn(`Redirecting ${modelPath} to .glb for GLTFLoader`);
            modelPath = modelPath.replace('.obj', '.glb');
        }

        return new Promise((resolve, reject) => {
            gltfLoader.load(modelPath, (gltf) => {
                const model = gltf.scene;

                const modX = this.transform.position.x * this.scaler;
                const modZ = this.transform.position.y * this.scaler;

                model.position.set(modX, 2.5, modZ);
                model.scale.set(7, 7, 7);

                model.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                        if (child.material) {
                            child.material.metalness = 0.5;
                        }
                    }
                });

                console.log(`Successfully loaded ${cId} from: ${modelPath}`);
                resolve(model);
            }, undefined, (err) => {
                console.error("GLB Load Error. Path tried:", modelPath, err);
                reject(err);
            });
        });
    }
}