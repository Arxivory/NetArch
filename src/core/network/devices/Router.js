import Device from "../Device.js";
import StaticRouting from '../routing/protocols/StaticRouting.js';

export default class Router extends Device {
    constructor(props) {
        super({ ...props, type: 'router'});

        this.nvram = {};
        this.runningConfig = {};
        this.startupConfig = {};
        this.staticRouting = new StaticRouting({ owner: this });
    }

    addStaticRoute(routeConfig) {
        return this.staticRouting.addRoute(routeConfig);
    }

    removeStaticRoute(routeId) {
        return this.staticRouting.removeRoute(routeId);
    }

    getStaticRoutes() {
        return this.staticRouting.getRoutes();
    }

    resolveStaticRoute(destinationIp) {
        return this.staticRouting.resolve(destinationIp);
    }
}