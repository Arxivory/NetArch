import Domain from "../../core/structural/Domain";
import Site from "../../core/structural/Site";
import Floor from "../../core/structural/Floor";
import Space from "../../core/structural/Space";

export class StructuralStore {
    constructor() {
        this.domains = [];
        this.sites = [];
        this.floors = [];
        this.spaces = [];
        this.listeners = [];
    }

    // ============= Domain Methods =============
    addDomain(domain) {
        if (!domain.id) {
            throw new Error('Domain must have an id');
        }

        if (this.domains.find(d => d.id === domain.id)) {
            console.warn(`Domain already exists: ${domain.id}`);
            return null;
        }

        const newDomain = new Domain(domain);

        console.log('Adding domain: ', newDomain);

        this.domains.push(newDomain);
        this.notify();
        return newDomain;
    }

    removeDomain(domainId) {
        const index = this.domains.findIndex(d => d.id === domainId);
        if (index === -1) {
            console.warn(`Domain not found: ${domainId}`);
            return false;
        }

        // Cascade delete: remove all sites under this domain
        this.sites = this.sites.filter(s => s.domainId !== domainId);
        // Remove all floors under those sites
        const siteIds = this.sites.map(s => s.id);
        this.floors = this.floors.filter(f => !siteIds.includes(f.siteId));
        // Remove all spaces under those floors
        const floorIds = this.floors.map(f => f.id);
        this.spaces = this.spaces.filter(sp => !floorIds.includes(sp.floorId));

        this.domains.splice(index, 1);
        this.notify();
        return true;
    }

    getDomain(domainId) {
        return this.domains.find(d => d.id === domainId);
    }

    // ============= Site Methods =============
    addSite(site) {
        if (!site.id) {
            throw new Error('Site must have an id');
        }

        if (!site.domainId) {
            throw new Error('Site must have a domainId');
        }

        if (this.sites.find(s => s.id === site.id)) {
            console.warn(`Site already exists: ${site.id}`);
            return null;
        }

        const newSite = new Site(site);

        console.log('Adding new Site: ', newSite, ' with domain of: ', site.domainId);

        this.sites.push(newSite);
        this.notify();
        return site;
    }

    removeSite(siteId) {
        const index = this.sites.findIndex(s => s.id === siteId);
        if (index === -1) {
            console.warn(`Site not found: ${siteId}`);
            return false;
        }

        // Cascade delete: remove all floors under this site
        const floorIds = this.floors.filter(f => f.siteId === siteId).map(f => f.id);
        this.floors = this.floors.filter(f => f.siteId !== siteId);
        // Remove all spaces under those floors
        this.spaces = this.spaces.filter(sp => !floorIds.includes(sp.floorId));

        this.sites.splice(index, 1);
        this.notify();
        return true;
    }

    getSitesByDomain(domainId) {
        return this.sites.filter(s => s.domainId === domainId);
    }

    // ============= Floor Methods =============
    addFloor(floor) {
        if (!floor.id) {
            floor.id = Date.now();
        }
        if (!floor.siteId) {
            console.warn('Floor must have a siteId');
            return null;
        }
        if (this.floors.find(f => f.id === floor.id)) {
            console.warn(`Floor already exists: ${floor.id}`);
            return null;
        }

        // convert to Floor instance for consistency with Domain/Site
        const newFloor = new Floor(floor);
        this.floors.push(newFloor);
        this.notify();
        return newFloor;
    }

    removeFloor(floorId) {
        const index = this.floors.findIndex(f => f.id === floorId);
        if (index === -1) {
            console.warn(`Floor not found: ${floorId}`);
            return false;
        }

        // Cascade delete: remove all spaces under this floor
        this.spaces = this.spaces.filter(sp => sp.floorId !== floorId);

        this.floors.splice(index, 1);
        this.notify();
        return true;
    }

    getFloorsBySite(siteId) {
        return this.floors.filter(f => f.siteId === siteId);
    }

    // ============= Space Methods =============
    addSpace(space) {
        if (!space.id) {
            space.id = Date.now();
        }
        if (!space.floorId) {
            console.warn('Space must have a floorId');
            return null;
        }
        if (this.spaces.find(s => s.id === space.id)) {
            console.warn(`Space already exists: ${space.id}`);
            return null;
        }

        // optional: propagate siteId from floor for convenience
        const floor = this.getFloor(space.floorId);
        if (floor) {
            space.siteId = floor.siteId;
        }

        const newSpace = new Space(space);

        console.log(`Adding Space: `, newSpace, 'With a Floor ID: ', newSpace.floorId);

        this.spaces.push(newSpace);
        this.notify();
        return newSpace;
    }

    removeSpace(spaceId) {
        const index = this.spaces.findIndex(s => s.id === spaceId);
        if (index === -1) {
            console.warn(`Space not found: ${spaceId}`);
            return false;
        }

        this.spaces.splice(index, 1);
        this.notify();
        return true;
    }

    getSpacesByFloor(floorId) {
        return this.spaces.filter(s => s.floorId === floorId);
    }

    getFloor(floorId) {
        return this.floors.find(f => f.id === floorId);
    }

    addFenestration(floorId, fenestration) {
        const floor = this.getFloor(floorId);
        if (!floor) {
            console.warn(`Floor not found for fenestration: ${floorId}`);
            return null;
        }
        const added = floor.addFenestration(fenestration);
        this.notify();
        return added;
    }

    // ============= Hierarchy Tree Builder =============
    getHierarchyTree() {
        return this.domains.map(domain => ({
            id: domain.id,
            label: domain.label || `Domain ${domain.id}`,
            type: 'domain',
            children: this._buildSiteChildren(domain.id)
        }));
    }

    _buildSiteChildren(domainId) {
        const sites = this.sites.filter(s => String(s.domainId) === String(domainId));
        return sites.map(site => ({
            id: site.id,
            label: site.label || `Site ${site.id}`,
            type: 'site',
            domainId: site.domainId,
            children: this._buildFloorChildren(site.id)
        }));
    }

    _buildFloorChildren(siteId) {
        const floors = this.floors.filter(f => String(f.siteId) === String(siteId));
        return floors.map(floor => ({
            id: floor.id,
            label: floor.label || `Floor ${floor.id}`,
            type: 'floor',
            siteId: floor.siteId,
            children: this._buildSpaceChildren(floor.id)
        }));
    }

    _buildSpaceChildren(floorId) {
        const spaces = this.spaces.filter(s => String(s.floorId) === String(floorId));
        return spaces.map(space => ({
            id: space.id,
            label: space.label || `Space ${space.id}`,
            type: 'space',
            floorId: space.floorId,
            children: []
        }));
    }

    // legacy helper used elsewhere in some older logic (not needed for tree)
    _buildSpaceChildrenLegacy(siteId) {
        const spaces = this.spaces.filter(s => String(s.siteId) === String(siteId));
        return spaces.map(space => ({
            id: space.id,
            label: space.label || `Space ${space.id}`,
            type: 'space',
            siteId: space.siteId,
            children: []
        }));
    }

    subscribe(callback) {
        if (typeof callback !== 'function') {
            console.error('Listener must be a function');
            return () => {};
        }

        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(l => l !== callback);
        };
    }

    notify() {
        this.listeners.forEach(listener => {
            try {
                listener(this);
            } catch (error) {
                console.warn('Error in StructuralStore listener:', error);
            }
        })
    }
}