
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
        const { switches, routers, endDevices, importedDevices } = deviceCatalog; //Added importedDevices to the destructuring assignment

        const cId = this.catalogId;
        const catalogEntry = switches[cId] || routers[cId] || endDevices[cId] || importedDevices[cId]; //Added importedDevices lookup

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

                // Position, Rotation, and Scale are now inherited directly from the Store's physical transform
                model.position.set(
                    this.transform.position.x, 
                    this.transform.position.y, 
                    this.transform.position.z
                );
                model.rotation.set(this.transform.rotation.x, this.transform.rotation.y, this.transform.rotation.z);
                model.scale.set(this.transform.scale.x, this.transform.scale.y, this.transform.scale.z);

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