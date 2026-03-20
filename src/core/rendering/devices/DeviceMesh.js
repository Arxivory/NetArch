
export default class DeviceMesh {
    constructor(opts={}, defaultScaler) {
        this.id = opts.id;
        this.catalogId = opts.catalogId || opts.hostname || opts.name;
        this.type = opts.type;
        this.scaler = defaultScaler;

        this.transform = {
            position: opts.transform.position || { x: 0, y: 0, z: 0 },
            rotation: opts.transform.rotation || { x: 0, y: 0, z: 0 },
            scale: opts.transform.scale || { x: 1, y: 1, z: 1 }
        }
    }

    getMesh(gltfLoader, deviceCatalog) {
        const { switches, routers, endDevices } = deviceCatalog;

        const cId = this.catalogId;
        const catalogEntry = switches[cId] || routers[cId] || endDevices[cId];

        if (!catalogEntry)
            throw Error("Device Type is not found");

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

                model.position.set(modX, 0, modZ);
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

                resolve(model);
            }, undefined, (err) => {
                console.error("GLB Load Error. Path tried:", modelPath, err);
                reject(err);
            })
        })
    }
}