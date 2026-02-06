
export class StructuralStore {
    constructor() {
        this.domains = [];
        this.sites = [];
        this.floors = [];
        this.spaces = [];
        this.listeners = [];
    }

    addDomain(domain) {
        if (!domain.id || this.domains.find(d => d.id === domain.id)) {
            console.warn(`Domain already exists or invalid: ${domain.id}`);
            return null;
        }

        this.domains.push(domain);
        this.notify();
        return domain;
    }

    removeDomain(domainId) {
        if (!this.domains.find(d => d.id === domainId)) {
            console.warn(`Domain not found: ${domainId}`);
            return false;
        }

        const index = this.domains.findIndex(d => d.id === domainId);
        this.domains.splice(index, 1);
        this.notify();
        return true;
    }

    addSite(site) {
        if (!site.id || this.sites.find(s => s.id === site.id)) {
            console.warn(`Site already exists or invalid: ${site.id}`);
            return null;
        }

        this.sites.push(site);
        this.notify();
        return site;
    }

    removeSite(siteId) {
        if (!this.sites.find(s => s.id === siteId)) {
            console.warn(`Site not found: ${siteId}`);
            return false;
        }

        const index = this.sites.findIndex(s => s.id === siteId);
        this.sites.splice(index, 1);
        this.notify();
        return true;
    }

    addFloor(floor) {
        if (!floor.id || this.floors.find(f => f.id === floor.id)) {
            console.warn(`Floor already exists or invalid: ${floor.id}`);
            return null;
        }

        this.floors.push(floor);
        this.notify();
        return floor;
    }

    removeFloor(floorId) {
        if (!this.floors.find(f => f.id)) {
            console.warn(`Floor not found: ${floorId}`);
            return false;
        }

        const index = this.floors.findIndex(f => f.id === floorId);
        this.floors.splice(index, 1);
        this.notify();
        return true;
    }

    addSpace(space) {
        if (!space.id || this.spaces.find(s => s.id === space.id)) {
            console.warn(`Space already exists or invalid: ${space.id}`);
            return null;
        }

        this.spaces.push(space);
        this.notify();
        return space;
    }

    removeSpace(spaceId) {
        if (!this.spaces.find(s => s.id === spaceId)) {
            console.warn(`Space not found: ${spaceId}`);
            return false;
        }

        const index = this.spaces.findIndex(s => s.id === spaceId);
        this.spaces.splice(index, 1);
        this.notify();
        return true;
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