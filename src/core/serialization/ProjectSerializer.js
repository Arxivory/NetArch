import appState from "../../state/AppState";

export class ProjectSerializer {
  static export() {
    return {
      version: "1.0",
      metadata: {
        name: appState.network.metadata?.name || "Untitled Network",
        created: appState.network.metadata?.created || new Date(),
        modified: new Date()
      },
      state: {
        network: {
          devices: appState.network.devices,
          links: appState.network.links,
          metadata: appState.network.metadata
        },
        structural: {
          domains: appState.structural.domains,
          sites: appState.structural.sites,
          floors: appState.structural.floors,
          spaces: appState.structural.spaces,
          walls: appState.structural.walls,
          doors: appState.structural.doors,
          windows: appState.structural.windows
        },
        ui: {
          zoom: appState.ui.zoomLevel,
          pan: appState.ui.panOffset,
          activeFloor: appState.ui.activeFloorId
        }
      }
    };
  }

  static import(data) {
    if (!data || !data.state) {
      throw new Error("Invalid project file");
    }

    appState.network.devices = [];
    appState.network.links = [];
    appState.structural.domains = [];
    appState.structural.sites = [];
    appState.structural.floors = [];
    appState.structural.spaces = [];
    appState.structural.walls = [];

    appState.network.devices = data.state.network.devices || [];
    appState.network.links = data.state.network.links || [];
    appState.network.metadata = data.state.network.metadata || {};

    Object.assign(appState.structural, data.state.structural);

    appState.ui.setZoom(data.state.ui?.zoom || 1);
    appState.ui.setPanOffset(data.state.ui?.pan || { x: 0, y: 0 });
    appState.ui.setActiveFloor(data.state.ui?.activeFloor || null);

    appState.network.notify();
    appState.structural.notify();
    appState.ui.notify();
  }
}