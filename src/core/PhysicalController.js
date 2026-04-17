import * as THREE from 'three';
import appState from '../state/AppState.js';
import deviceCatalog from '../data/deviceCatalog.js';
import furnitureCatalog from '../data/furnitureCatalog.js';
import { GLTFLoader, MTLLoader, OBJLoader } from 'three/examples/jsm/Addons.js';
import DomainMesh from './rendering/structures/DomainMesh.js';
import SiteMesh from './rendering/structures/SiteMesh.js';
import SpaceMesh from './rendering/structures/SpaceMesh.js';
import FloorMesh from './rendering/structures/FloorMesh.js';
import FurnitureMesh from './rendering/furnitures/FurnitureMesh.js';
import DeviceMesh from './rendering/devices/DeviceMesh.js';

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

            switch (domain.shapeType) {
                case 'rectangle':
                    this.createRectangularDomainMesh(domain);
                    break;
                case 'polygon':
                    this.createPolygonalDomainMesh(domain);
                    break;
                case 'freeform':
                    this.createPolygonalDomainMesh(domain);
                    break;
                case 'circle':
                    this.createCircularDomainMesh(domain);
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
                case 'polygon':
                    this.createPolygonalSiteMesh(site);
                    break;
                case 'freeform':
                    this.createFreeformSiteMesh(site);
                    break;
                case 'circle':
                    this.createCircularSiteMesh(site);
                    break;
                default:
                    break;
            }
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

            switch (space.shapeType) {
                case 'rectangle':
                    this.createRectangleSpaceMesh(space);
                    break;
                case 'polygon':
                    this.createPolygonalSpaceMesh(space); // CHANGED: polygon spaces must use SpaceMesh, not DomainMesh
                    break;
                case 'freeform':
                    this.createPolygonalSpaceMesh(space); // CHANGED: freeform space temporarily reuses the polygonal space mesh logic
                    break;
                    case 'circle':
                    this.createCircularSpaceMesh(space);
                    break;
                default:
                    break;
            }
        }


        for (const device of devices) {
            console.log('Processing device for rendering: ', device);
            activeDeviceIds.add(device.id);
            if (this.deviceMeshes.has(device.id))
                continue; // ADDED: avoid reloading the same device mesh every sync
        
            this.createDeviceGLTFMesh(device);
        }

        for ( const furniture of furnitures) {
            console.log('Processing furniture for rendering:', furniture);
            activeFurnitureIds.add(furniture.id);
            if (this.furnitureMeshes.has(furniture.id))
                continue; // ADDED: avoid reloading the same furniture mesh every sync
            this.createFurnitureGLTFMesh(furniture).catch(err => 
                console.error(`Failed to load furniture ${furniture.id}:`, err)
            );
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
    }

    createRectangularDomainMesh(domain) {
        const rectDomain = new DomainMesh(domain, this.defaultScaler);
        const mesh = rectDomain.getRectangularForm();

        this.scene.add(mesh);
        this.domainMeshes.set(domain.id, mesh);
    }

    createPolygonalDomainMesh(domain) {
    const { x, y, points } = domain.geometry; // CHANGED: use the stored anchor and absolute polygon points

    if (!points?.length) { // ADDED: avoid building an empty polygon mesh
        console.warn("Polygonal domain has no points:", domain.id);
        return;
    }

    const shape = new THREE.Shape();

    points.forEach((p, i) => {
        const localX = (p.x - x) * this.defaultScaler;   // CHANGED: convert absolute X into local coordinates
        const localY = -(p.y - y) * this.defaultScaler;  // CHANGED: flip Y so it maps correctly to Three.js Z

        if (i === 0) shape.moveTo(localX, localY);       // CHANGED: use corrected local polygon coordinates
        else shape.lineTo(localX, localY);               // CHANGED: use corrected local polygon coordinates
    });

    shape.closePath();

    const geometry = new THREE.ExtrudeGeometry(shape, {
        depth: 1,
        bevelEnabled: false
    });

    geometry.rotateX(-Math.PI / 2);

    const material = new THREE.MeshStandardMaterial({
        color: 0xcccccc,
        roughness: 0.9,
        metalness: 0.3
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(
        x * this.defaultScaler,   // CHANGED: place the whole polygon mesh at the stored anchor
        0.1,
        y * this.defaultScaler    // CHANGED: place the whole polygon mesh at the stored anchor
    );

    this.scene.add(mesh);
    this.domainMeshes.set(domain.id, mesh);
}



    createCircularDomainMesh(domain) {
        const domainMesh = new DomainMesh(domain, this.defaultScaler);
        const mesh = domainMesh.getCircularForm();

        this.scene.add(mesh);
        this.domainMeshes.set(domain.id, mesh);
    }

    createRectangleSiteMesh(site) {
        const rectSite = new SiteMesh(site, this.defaultScaler);
        const mesh = rectSite.getRectangularForm();

        this.scene.add(mesh);
        this.siteMeshes.set(site.id, mesh);
    }

    createCircularSiteMesh(site) {
        const siteMesh = new SiteMesh(site, this.defaultScaler);
        const mesh = siteMesh.getCircularForm();

        this.scene.add(mesh);
        this.siteMeshes.set(site.id, mesh);
    }

    createPolygonalSiteMesh(site) {
        const siteMesh = new SiteMesh(site, this.defaultScaler);
        const mesh = siteMesh.getPolygonalForm();

        this.scene.add(mesh);
        this.siteMeshes.set(site.id, mesh);
    }

    createFreeformSiteMesh(site) {
        const siteMesh = new SiteMesh(site, this.defaultScaler);
        const mesh = siteMesh.getFreeformForm();

        this.scene.add(mesh);
        this.siteMeshes.set(site.id, mesh);
    }

    createRectangleSpaceMesh(space) {
        const floor = this.store.floors.find(f => f.id === space.floorId);
        const altitude = floor ? floor.altitude || 0 : 0;

        console.log(`Creating space ${space.id} on floor ${space.floorId} at altitude ${altitude}`);

        const rectSpace = new SpaceMesh(space, this.defaultScaler);
        const mesh = rectSpace.getRectangularForm();

        mesh.position.y = altitude;

        console.log(`Space mesh positioned at Y=${mesh.position.y}`);

        this.scene.add(mesh);
        this.spaceMeshes.set(space.id, mesh);
    }
    createPolygonalSpaceMesh(space) {
    const floor = this.store.floors.find(f => f.id === space.floorId);
    const altitude = floor ? floor.altitude || 0 : 0; // ADDED: polygonal spaces still need to sit on the correct floor

    console.log(`Creating polygonal space ${space.id} on floor ${space.floorId} at altitude ${altitude}`); // ADDED: debug log for polygon space creation

    const polygonalSpace = new SpaceMesh(space, this.defaultScaler);
    const mesh = polygonalSpace.getPolygonalForm(); // ADDED: use the dedicated polygonal space mesh builder

    mesh.position.y = altitude; // ADDED: stack the whole space group on its floor altitude

    console.log(`Polygonal space mesh positioned at Y=${mesh.position.y}`); // ADDED: confirm final vertical placement

    this.scene.add(mesh);
    this.spaceMeshes.set(space.id, mesh);
}
    createCircularSpaceMesh(space) {
    const floor = this.store.floors.find(f => f.id === space.floorId);
    const altitude = floor ? floor.altitude || 0 : 0; // ADDED: circular spaces still need to sit on the correct floor

    console.log(`Creating circular space ${space.id} on floor ${space.floorId} at altitude ${altitude}`); // ADDED: debug log for circular space creation

    const circularSpace = new SpaceMesh(space, this.defaultScaler);
    const mesh = circularSpace.getCircularForm(); // ADDED: use the dedicated circular space mesh builder

    mesh.position.y = altitude; // ADDED: stack the whole space group on its floor altitude

    console.log(`Circular space mesh positioned at Y=${mesh.position.y}`); // ADDED: confirm final vertical placement

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
        const floor = this.store.floors.find(f => f.id === device.floorId);
        const floorAltitude = floor ? floor.altitude : 0;

        const newDevice = new DeviceMesh(device, this.defaultScaler);
        const deviceMesh = await newDevice.getMesh(this.gltfLoader, deviceCatalog);

        deviceMesh.position.y = floorAltitude;

        this.scene.add(deviceMesh);
        this.deviceMeshes.set(device.id, deviceMesh);
    }

    async createFurnitureGLTFMesh(furniture) {
        const floor = this.store.floors.find(f => f.id === furniture.floorId);
        const floorAltitude = floor ? floor.altitude : 0;

        const newFurniture = new FurnitureMesh(furniture, this.defaultScaler);
        const furnitureMesh = await newFurniture.getMesh(this.gltfLoader, this.furnitureCatalog);

        furnitureMesh.position.y = floorAltitude;

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
}
