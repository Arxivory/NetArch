import * as THREE from 'three';
import appState from '../state/AppState';
import deviceCatalog from '../data/deviceCatalog';
import { GLTFLoader, MTLLoader, OBJLoader } from 'three/examples/jsm/Addons.js';

export class PhysicalController {
    constructor(scene) {
        this.scene = scene;
        this.store = appState.structural;
        this.networkStore = appState.network;
        this.meshes = new Map();
        this.defaultScaler = 0.7;

        this.objLoader = new OBJLoader();
        this.mtlLoader = new MTLLoader();
        this.gltfLoader = new GLTFLoader();

        this.domainMeshes = new Map();
        this.siteMeshes = new Map();
        this.spaceMeshes = new Map();
        this.deviceMeshes =  new Map();

        this.unsubscribe = this.store.subscribe(() => this.syncWithState());
        this.unsubscribeNetwork = this.networkStore.subscribe(() => this.syncWithState());

        this.syncWithState();
    }

    syncWithState() {
        const domains = this.store.domains;
        const sites = this.store.sites;
        const spaces = this.store.spaces;
        const devices = this.networkStore.devices;

        const activeDomainIds = new Set();
        const activeSiteIds = new Set();
        const activeSpaceIds = new Set();
        const activeDeviceIds = new Set();

        for (const domain of domains) {
            activeDomainIds.add(domain.id);

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

        for (const site of sites) {
            activeSiteIds.add(site.id);

            if (this.siteMeshes.has(site.id))
                continue;

            switch (site.shapeType) {
                case 'rectangle':
                    this.createRectangleSiteMesh(site);
                    break;
                default:
                    break;
            }
        }

        for (const space of spaces) {
            activeSpaceIds.add(space.id);

            if (this.spaceMeshes.has(space.id))
                continue;

            switch (space.shapeType) {
                case 'rectangle':
                    this.createRectangleSpaceMesh(space);
                    break;
                default:
                    break;
            }
        }

        for (const device of devices) {
            activeDeviceIds.add(device.id);
            this.createDeviceGLTFMesh(device);
        }

        for (const [id, mesh] of this.domainMeshes) {
            if (!activeDomainIds.has(id)) {
                this.scene.remove(mesh);
                this.domainMeshes.delete(id);
            }
        }

        for (const [id, mesh] of this.siteMeshes) {
            if (!activeSiteIds.has(id)) {
                this.scene.remove(mesh);
                this.siteMeshes.delete(id);
            }
        }

        for (const [id, mesh] of this.spaceMeshes) {
            if (!activeSiteIds.has(id)) {
                this.spaceMeshes.delete(id);
            }
        }

        for (const [id, mesh] of this.deviceMeshes) {
            if (!activeDeviceIds.has(id)) {
                this.scene.remove(mesh);
                this.siteMeshes.delete(id);
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
        mesh.position.set(
            modifiedX + (modifiedWidth / 2),
            0.1,
            modifiedY + (modifiedHeight / 2)
        )

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

    createRectangleSiteMesh(site) {
        const { x, y, width, height } = site.geometry;

        const modifiedX = x * this.defaultScaler;
        const modifiedY = y * this.defaultScaler;
        const modifiedWidth = width * this.defaultScaler;
        const modifiedHeight = height * this.defaultScaler;

        const tallness = 50;

        const modTallness = tallness * this.defaultScaler;

        const geometry = new THREE.BoxGeometry(modifiedWidth, modTallness, modifiedHeight);
        const material = new THREE.MeshBasicMaterial({ 
            color: 0x909090,
            side: THREE.DoubleSide
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(
            modifiedX + (modifiedWidth / 2),
            0.1 + (modTallness / 2),
            modifiedY + (modifiedHeight / 2)
        )

        this.scene.add(mesh);
        this.siteMeshes.set(site.id, mesh);
    }

    createRectangleSpaceMesh(space) {
        const { x, y, width, height } = space.geometry;

        const modifiedX = x * this.defaultScaler;
        const modifiedY = y * this.defaultScaler;
        const modifiedWidth = width * this.defaultScaler;
        const modifiedHeight = height * this.defaultScaler;

        const tallness = 50;

        const modTallness = tallness * this.defaultScaler;

        const geometry = new THREE.BoxGeometry(modifiedWidth, modTallness, modifiedHeight);
        const material = new THREE.MeshBasicMaterial({ 
            color: 0x909090,
            side: THREE.DoubleSide
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(
            modifiedX + (modifiedWidth / 2),
            (modTallness / 2),
            modifiedY + (modifiedHeight / 2)
        )

        this.scene.add(mesh);
        this.spaceMeshes.set(space.id, mesh);
    }

    createDeviceGLTFMesh(device) {
        const { switches, routers, endDevices } = deviceCatalog;
        
        const cId = device.catalogId || device.hostname || device.name; 
        
        const catalogEntry = switches[cId] || routers[cId] || endDevices[cId];

        if (!catalogEntry) {
            console.warn(`Lookup failed for ID: ${cId}. Falling back to default.`);
        }

        let modelPath = (catalogEntry && catalogEntry.model3D) 
            ? catalogEntry.model3D 
            : 'objects/devices/routers/1941.glb';

        if (modelPath.endsWith('.obj')) {
            console.warn(`Redirecting ${modelPath} to .glb for GLTFLoader`);
            modelPath = modelPath.replace('.obj', '.glb'); 
        }

        this.gltfLoader.load(modelPath, (gltf) => {
            const model = gltf.scene;

            const modX = device.transform.position.x * this.defaultScaler;
            const modZ = device.transform.position.y * this.defaultScaler;
            
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

            this.scene.add(model);
            this.deviceMeshes.set(device.id, model);
            
            console.log(`Successfully loaded ${cId} from: ${modelPath}`);
        }, 
        undefined, 
        (err) => console.error("GLB Load Error. Path tried:", modelPath, err));
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