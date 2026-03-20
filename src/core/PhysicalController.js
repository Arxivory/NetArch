import * as THREE from 'three';
import appState from '../state/AppState';
import deviceCatalog from '../data/deviceCatalog';
import furnitureCatalog from '../data/furnitureCatalog';
import { GLTFLoader, MTLLoader, OBJLoader } from 'three/examples/jsm/Addons.js';
import DomainMesh from './rendering/structures/DomainMesh';
import SiteMesh from './rendering/structures/SiteMesh';
import SpaceMesh from './rendering/structures/SpaceMesh';
import FloorMesh from './rendering/structures/FloorMesh';
import FurnitureMesh from './rendering/furnitures/FurnitureMesh';
import DeviceMesh from './rendering/devices/DeviceMesh';

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
                default:
                    break;
            }
        }


        for (const device of devices) {
            console.log('Processing device for rendering: ', device);
            activeDeviceIds.add(device.id);
            this.createDeviceGLTFMesh(device);
        }

        for ( const furniture of furnitures) {
            console.log('Processing furniture for rendering:', furniture);
            activeFurnitureIds.add(furniture.id);
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
        const rectSite = new SiteMesh(site, this.defaultScaler);
        const mesh = rectSite.getRectangularForm();

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

        this.scene.add(deviceMesh);
        this.deviceMeshes.set(device.id, deviceMesh);
    }

    async createFurnitureGLTFMesh(furniture) {
        const newFurniture = new FurnitureMesh(furniture, this.defaultScaler);
        const furnitureMesh = await newFurniture.getMesh(this.gltfLoader, this.furnitureCatalog);

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