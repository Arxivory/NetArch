const switches = {
  "1200": {
    modelId: "1200",
    displayName: "Cisco 1200 Switch",
    family: "switch",
    vendor: "cisco",
    portCount: 24,
    interfaceTemplate: "GigabitEthernet1/0/{n}",
    model3D: "/models/switch-1200.glb",
  },
  "1300": {
    modelId: "1300",
    displayName: "Cisco 1300 Switch",
    family: "switch",
    vendor: "cisco",
    portCount: 24,
    interfaceTemplate: "GigabitEthernet1/0/{n}",
    model3D: "/models/switch-1300.glb",
  },
  "2960": {
    modelId: "2960",
    displayName: "Cisco Catalyst 2960",
    family: "switch",
    vendor: "cisco",
    portCount: 24,
    interfaceTemplate: "FastEthernet0/{n}",
    model3D: "/models/switch-2960.glb",
  },
  "9200": {
    modelId: "9200",
    displayName: "Cisco Catalyst 9200",
    family: "switch",
    vendor: "cisco",
    portCount: 48,
    interfaceTemplate: "GigabitEthernet1/0/{n}",
    model3D: "/models/switch-9200.glb",
  },
  "9300": {
    modelId: "9300",
    displayName: "Cisco Catalyst 9300",
    family: "switch",
    vendor: "cisco",
    portCount: 48,
    interfaceTemplate: "GigabitEthernet1/0/{n}",
    model3D: "/models/switch-9300.glb",
  },
  "9400": {
    modelId: "9400",
    displayName: "Cisco Catalyst 9400",
    family: "switch",
    vendor: "cisco",
    portCount: 48,
    interfaceTemplate: "TenGigabitEthernet1/0/{n}",
    model3D: "/models/switch-9400.glb",
  },
  "9500": {
    modelId: "9500",
    displayName: "Cisco Catalyst 9500",
    family: "switch",
    vendor: "cisco",
    portCount: 48,
    interfaceTemplate: "TenGigabitEthernet1/0/{n}",
    model3D: "/models/switch-9500.glb",
  },
  "9600": {
    modelId: "9600",
    displayName: "Cisco Catalyst 9600",
    family: "switch",
    vendor: "cisco",
    portCount: 48,
    interfaceTemplate: "TenGigabitEthernet1/0/{n}",
    model3D: "/models/switch-9600.glb",
  },
  "110": {
    modelId: "110",
    displayName: "Cisco 110 Switch",
    family: "switch",
    vendor: "cisco",
    portCount: 8,
    interfaceTemplate: "GigabitEthernet0/{n}",
    model3D: "/models/switch-110.glb",
  },
  "220": {
    modelId: "220",
    displayName: "Cisco 220 Switch",
    family: "switch",
    vendor: "cisco",
    portCount: 24,
    interfaceTemplate: "GigabitEthernet0/{n}",
    model3D: "/models/switch-220.glb",
  },
  "350": {
    modelId: "350",
    displayName: "Cisco 350 Switch",
    family: "switch",
    vendor: "cisco",
    portCount: 48,
    interfaceTemplate: "GigabitEthernet0/{n}",
    model3D: "/models/switch-350.glb",
  }
};

const routers = {
  // Routers will be added later.
};

export function generateInterfaces(catalogEntry) {
  const ports = catalogEntry && catalogEntry.portCount ? catalogEntry.portCount : 0;
  const tmpl = catalogEntry && catalogEntry.interfaceTemplate ? catalogEntry.interfaceTemplate : "Eth{n}";
  return Array.from({ length: ports }, (_, i) => tmpl.replace(/{n}/g, i + 1));
}

export function createDeviceInstance(catalogId, position = { x: 0, y: 0, z: 0 }, opts = {}) {
  const catalogEntry = switches[catalogId] || routers[catalogId];
  if (!catalogEntry) {
    throw new Error(`Unknown catalogId: ${catalogId}`);
  }

  const id = `dev_${Date.now().toString(36)}_${Math.floor(Math.random() * 1000)}`;
  const name = opts.name || `${catalogEntry.displayName}-${id.slice(-4)}`;
  const interfaces = generateInterfaces(catalogEntry);

  return {
    id,
    catalogId: catalogEntry.modelId,
    type: catalogEntry.family,
    name,
    position,
    rotation: opts.rotation || 0,
    properties: Object.assign({}, catalogEntry.defaults || {}, opts.properties || {}),
    interfaces,
    modeCreatedIn: opts.modeCreatedIn || 'logical'
  };
}

const deviceCatalog = {
  switches,
  routers
};

export default deviceCatalog;
