import * as THREE from 'three';
import appState from '../state/AppState.js';
import deviceCatalog from '../data/deviceCatalog.js';
import furnitureCatalog from '../data/furnitureCatalog.js';
import { GLTFLoader, MTLLoader, OBJLoader } from 'three/examples/jsm/Addons.js';
import DomainMesh from './rendering/structures/DomainMesh';
import SiteMesh from './rendering/structures/SiteMesh';
import SpaceMesh from './rendering/structures/SpaceMesh';
import FloorMesh from './rendering/structures/FloorMesh';
import FurnitureMesh from './rendering/furnitures/FurnitureMesh';
import DeviceMesh from './rendering/devices/DeviceMesh';
import { GizmoManager } from './rendering/GizmoManager.js';
import { getScene, getCamera, getRenderer } from './rendering/SceneAccess';

export class PhysicalController {
    constructor(scene) {
        this.scene = scene;
        this.store = appState.structural;
        this.networkStore = appState.network;
        this.furnitureStore = appState.furniture;
        this.meshes = new Map();
        this.defaultScaler = 0.7;
        this.defaultFloorHeight = 3.0; 

        this.objLoader = new OBJLoader();
        this.mtlLoader = new MTLLoader();
        this.gltfLoader = new GLTFLoader();

        this.domainMeshes = new Map();
        this.siteMeshes = new Map();
        this.floorMeshes = new Map(); 
        this.spaceMeshes = new Map();
        this.deviceMeshes =  new Map();
        this.furnitureMeshes = new Map();

        this.furnitureCatalog = furnitureCatalog.furnitures;

        this.unsubscribe = this.store.subscribe(() => this.syncWithState());
        this.unsubscribeNetwork = this.networkStore.subscribe(() => this.syncWithState());
        
        this.gizmoManager = new GizmoManager(getCamera(), getRenderer().domElement, getScene());
        
        appState.selection.subscribe((selectionStore) => {
            const focusedId = selectionStore.getFocusedId();
            console.log("Focused ID changed:", focusedId);
    
            if (focusedId) {
                const selectedMesh = this.getMeshById(focusedId);
                console.log("Selected mesh:", selectedMesh);
                if (selectedMesh && (selectedMesh.userData.type === 'device' || selectedMesh.userData.type === 'furniture')) {
                    this.gizmoManager.attach(selectedMesh);
                } else {
                    this.gizmoManager.detach();
                }
            } else {
                this.gizmoManager.detach();
            }
        });

        this.syncWithState();
    }

    syncWithState() {
        const domains = this.store.domains;
        const sites = this.store.sites;
        const floors = this.store.floors;
        const spaces = this.store.spaces;
        const devices = this.networkStore.devices;
        const furnitures = this.furnitureStore.furnitures;

        console.log(`[PhysicalController.syncWithState] Domains: ${domains.length}, Sites: ${sites.length}, Floors: ${floors.length}, Spaces: ${spaces.length}`);

        const activeDomainIds = new Set();
        const activeSiteIds = new Set();
        const activeFloorIds = new Set();
        const activeSpaceIds = new Set();
        const activeDeviceIds = new Set();
        const activeFurnitureIds = new Set();

        for (const domain of domains) {
            activeDomainIds.add(domain.id);

            if (this.domainMeshes.has(domain.id)) {
                continue;
            } 

            this.createDomainMesh(domain);
        }

        for (const site of sites) {
            activeSiteIds.add(site.id);

            if (this.siteMeshes.has(site.id))
                continue;

            this.createSiteMesh(site);
        }

        for (const floor of floors) {
            activeFloorIds.add(floor.id);

            if (this.floorMeshes.has(floor.id)) {
                console.log(`Floor ${floor.id} already rendered, skipping`);
                continue;
            }

            console.log(`Processing new floor ${floor.id} with altitude ${floor.altitude}`);
            this.createFloorMesh(floor);
        }

        for (const space of spaces) {
            activeSpaceIds.add(space.id);

            if (this.spaceMeshes.has(space.id))
                continue;

            this.createSpaceMesh(space);
        }

        for (const device of devices) {
            console.log('Processing device for rendering: ', device);
            activeDeviceIds.add(device.id);

            if (this.deviceMeshes.has(device.id)) {
                const deviceMesh = this.deviceMeshes.get(device.id);
                console.log('Device Mesh: ', device, ' is updating');
                if (device.transform) {
                    deviceMesh.position.set(device.transform.position.x, device.transform.position.y, device.transform.position.z);
                    deviceMesh.rotation.set(device.transform.rotation.x, device.transform.rotation.y, device.transform.rotation.z);
                    deviceMesh.scale.set(device.transform.scale.x, device.transform.scale.y, device.transform.scale.z);
                }
            } else {
                this.createDeviceGLTFMesh(device);
            }
        }

        for ( const furniture of furnitures) {
            console.log('Processing furniture for rendering:', furniture);
            activeFurnitureIds.add(furniture.id);

            if (this.furnitureMeshes.has(furniture.id)) {
                const furnitureMesh = this.furnitureMeshes.get(furniture.id);
                if (furniture.transform) {
                    furnitureMesh.position.set(furniture.transform.position.x, furniture.transform.position.y, furniture.transform.position.z);
                    furnitureMesh.rotation.set(furniture.transform.rotation.x, furniture.transform.rotation.y, furniture.transform.rotation.z);
                    furnitureMesh.scale.set(furniture.transform.scale.x, furniture.transform.scale.y, furniture.transform.scale.z);
                }
            } else {
                this.createFurnitureGLTFMesh(furniture).catch(err => 
                    console.error(`Failed to load furniture ${furniture.id}:`, err)
                );
            }
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

        for (const [id, mesh] of this.floorMeshes) {
            if (!activeFloorIds.has(id)) {
                this.scene.remove(mesh);
                this.floorMeshes.delete(id);
            }
        }

        for (const [id, mesh] of this.spaceMeshes) {
            if (!activeSpaceIds.has(id)) {
                this.scene.remove(mesh);
                this.spaceMeshes.delete(id);
            }
        }

        for (const [id, mesh] of this.deviceMeshes) {
            if (!activeDeviceIds.has(id)) {
                this.scene.remove(mesh);
                this.deviceMeshes.delete(id);
            }
        }

        for (const [id, mesh] of this.furnitureMeshes) {
            if (!activeFurnitureIds.has(id)) {
                this.scene.remove(mesh);
                this.furnitureMeshes.delete(id);
            }
        }
    }

    createDomainMesh(domain) {
        const newDomain = new DomainMesh(domain, this.defaultScaler);
        switch (domain.shapeType) {
            case 'rectangle':
                const rectangularMesh = newDomain.getRectangularForm();
                this.scene.add(rectangularMesh);
                this.domainMeshes.set(domain.id, rectangularMesh);
                break;
            case 'polygon':
                const polygonalMesh = newDomain.getPolygonalForm();
                this.scene.add(polygonalMesh);
                this.domainMeshes.set(domain.id, polygonalMesh);
                break;
            case 'circle':
                const circularMesh = newDomain.getCircularForm();
                this.scene.add(circularMesh);
                this.domainMeshes.set(domain.id, circularMesh);
                break;
            default:
                console.warn(`Unknown domain shape type: ${domain.shapeType}`);
                break;
        }
    }

    createSiteMesh(site) {
        const newSite = new SiteMesh(site, this.defaultScaler);
        switch (site.shapeType) {
            case 'rectangle':
                const rectangularMesh = newSite.getRectangularForm();
                this.scene.add(rectangularMesh);
                this.siteMeshes.set(site.id, rectangularMesh);
                break;
            case 'polygon':
                const polygonalMesh = newSite.getPolygonalForm();
                this.scene.add(polygonalMesh);
                this.siteMeshes.set(site.id, polygonalMesh);
                break;
            case 'circle':
                const circularMesh = newSite.getCircularForm();
                this.scene.add(circularMesh);
                this.siteMeshes.set(site.id, circularMesh);
                break;
            default:
                console.warn(`Unknown site shape type: ${site.shapeType}`);
                break;
        }
    }

    createSpaceMesh(space) {
        const floor = this.store.floors.find(f => f.id === space.floorId);
        const altitude = floor ? floor.altitude || 0 : 0;

        const newSpace = new SpaceMesh(space, this.defaultScaler);
        let mesh;

        switch (space.shapeType) {
            case 'rectangle':
                mesh = newSpace.getRectangularForm();
                break;
            case 'polygon':
                mesh = newSpace.getPolygonalForm();
                break;
            case 'circle':
                mesh = newSpace.getCircularForm();
                break;
            default:
                console.warn(`Unknown space shape type: ${space.shapeType}`);
                return;
        }

        mesh.position.y = altitude;

        this.scene.add(mesh);
        this.spaceMeshes.set(space.id, mesh);
    }

    createFloorMesh(floor) {
        const site = this.store.sites.find(s => s.id === floor.siteId);
        if (!site) {
            console.warn(`Site not found for floor ${floor.id}`);
            return;
        }

        console.log(`Creating floor ${floor.id} with altitude ${floor.altitude}`);

        const floorMesh = new FloorMesh(site, this.defaultScaler);
        const mesh = floorMesh.getRectangularForm();

        mesh.position.y = floor.altitude || 0;

        console.log(`Floor mesh positioned at Y=${mesh.position.y}`);

        this.scene.add(mesh);
        this.floorMeshes.set(floor.id, mesh);
    }

    async createDeviceGLTFMesh(device) {
        const newDevice = new DeviceMesh(device, this.defaultScaler);
        const deviceMesh = await newDevice.getMesh(this.gltfLoader, deviceCatalog);

        deviceMesh.userData = { id: device.id, type: 'device' };

        this.scene.add(deviceMesh);
        this.deviceMeshes.set(device.id, deviceMesh);
    }

    async createFurnitureGLTFMesh(furniture) {
        const newFurniture = new FurnitureMesh(furniture, this.defaultScaler);
        const furnitureMesh = await newFurniture.getMesh(this.gltfLoader, this.furnitureCatalog);

        furnitureMesh.userData = { id: furniture.id, type: 'furniture' };

        this.scene.add(furnitureMesh);
        this.furnitureMeshes.set(furniture.id, furnitureMesh);
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

    getMeshById(id) {
        if (this.domainMeshes.has(id)) return this.domainMeshes.get(id);
        if (this.siteMeshes.has(id)) return this.siteMeshes.get(id);
        if (this.floorMeshes.has(id)) return this.floorMeshes.get(id);
        if (this.spaceMeshes.has(id)) return this.spaceMeshes.get(id);
        if (this.deviceMeshes.has(id)) return this.deviceMeshes.get(id);
        if (this.furnitureMeshes.has(id)) return this.furnitureMeshes.get(id);
        return null;
    }
}
