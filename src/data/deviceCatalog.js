const switches = {
  "1200": {
    modelId: "1200",
    displayName: "1200",
    family: "switch",
    vendor: "cisco",
    portCount: 24,
    portGroups: [
      {
        template: "Console",
        count: 1,
        startIndex: 0
      },
      {
        template: "GigabitEthernet1/0/{n}",
        count: 24,
        startIndex: 1 
      }
    ],
    model3D: "/models/switch-1200.glb",
  },
  "1300": {
    modelId: "1300",
    displayName: "1300",
    family: "switch",
    vendor: "cisco",
    portCount: 24,
    portGroups: [
      {
        template: "Console",
        count: 1,
        startIndex: 0
      },
      {
        template: "GigabitEthernet1/0/{n}",
        count: 24,
        startIndex: 1 
      }
    ],
    model3D: "/models/switch-1300.glb",
  },
"2960": {
    modelId: "2960",
    displayName: "2960",
    family: "switch",
    vendor: "cisco",
    portGroups: [
      {
        template: "Console",
        count: 1,
        startIndex: 0
      },
      {
        template: "FastEthernet0/{n}",
        count: 24,
        startIndex: 1 
      },
      {
        template: "GigabitEthernet0/{n}",
        count: 2,
        startIndex: 1 
      }
    ],
    model3D: "/objects/devices/switches/2960.glb",
  },
  "9200": {
    modelId: "9200",
    displayName: "9200",
    family: "switch",
    vendor: "cisco",
    portCount: 48,
    portGroups: [
      {
        template: "Console",
        count: 1,
        startIndex: 0
      },
      {
        template: "GigabitEthernet1/0/{n}",
        count: 48,
        startIndex: 1 
      }
    ],
    model3D: "/models/switch-9200.glb",
  },
  "9300": {
    modelId: "9300",
    displayName: "9300",
    family: "switch",
    vendor: "cisco",
    portCount: 48,
    portGroups: [
      {
        template: "Console",
        count: 1,
        startIndex: 0
      },
      {
        template: "GigabitEthernet1/0/{n}",
        count: 48,
        startIndex: 1 
      }
    ],
    model3D: "/models/switch-9300.glb",
  },
  "9400": {
    modelId: "9400",
    displayName: "9400",
    family: "switch",
    vendor: "cisco",
    portCount: 48,
    portGroups: [
      {
        template: "Console",
        count: 1,
        startIndex: 0
      },
      {
        template: "GigabitEthernet1/0/{n}",
        count: 48,
        startIndex: 1 
      }
    ],
    model3D: "/models/switch-9400.glb",
  },
  "9500": {
    modelId: "9500",
    displayName: "9500",
    family: "switch",
    vendor: "cisco",
    portCount: 48,
    portGroups: [
      {
        template: "Console",
        count: 1,
        startIndex: 0
      },
      {
        template: "TenGigabitEthernet1/0/{n}",
        count: 48,
        startIndex: 1 
      }
    ],
    model3D: "/models/switch-9500.glb",
  },
  "9600": {
    modelId: "9600",
    displayName: "9600",
    family: "switch",
    vendor: "cisco",
    portCount: 48,
    portGroups: [
      {
        template: "Console",
        count: 1,
        startIndex: 0
      },
      {
        template: "TenGigabitEthernet1/0/{n}",
        count: 48,
        startIndex: 1 
      }
    ],
    model3D: "/models/switch-9600.glb",
  },
  "110": {
    modelId: "110",
    displayName: "110",
    family: "switch",
    vendor: "cisco",
    portCount: 8,
    portGroups: [
      {
        template: "Console",
        count: 1,
        startIndex: 0
      },
      {
        template: "FastEthernet0/{n}",
        count: 8,
        startIndex: 1 
      }
    ],
    model3D: "/models/switch-110.glb",
  },
  "220": {
    modelId: "220",
    displayName: "220",
    family: "switch",
    vendor: "cisco",
    portCount: 24,
    portGroups: [
      {
        template: "Console",
        count: 1,
        startIndex: 0
      },
      {
        template: "FastEthernet0/{n}",
        count: 24,
        startIndex: 1 
      }
    ],
    model3D: "/objects/devices/switches/220.glb",
  },
  "350": {
    modelId: "350",
    displayName: "350",
    family: "switch",
    vendor: "cisco",
    portCount: 48,
    portGroups: [
      {
        template: "Console",
        count: 1,
        startIndex: 0
      },
      {
        template: "FastEthernet0/{n}",
        count: 48,
        startIndex: 1 
      }
    ],
    model3D: "/models/switch-350.glb",
  }
};

const routers = {
  "1941": {
    modelId: "1941",
    displayName: "1941",
    family: "router",
    vendor: "cisco",
    portCount: 2,
    interfaceTemplate: "GigabitEthernet0/{n}",
    model3D: "/objects/devices/routers/1941.glb"
  },
  
  "2901": {
    modelId: "2901",
    displayName: "2901",
    family: "router",
    vendor: "cisco",
    portCount: 2,
    interfaceTemplate: "GigabitEthernet0/{n}",
    model3D: "/models/router-2901.glb"
  },

  "2911": {
    modelId: "2911",
    displayName: "2911",
    family: "router",
    vendor: "cisco",
    portCount: 2,
    interfaceTemplate: "GigabitEthernet0/{n}",
    model3D: "/models/router-2911.glb"
  },

  "4321": {
    modelId: "4321",
    displayName: "4321",
    family: "router",
    vendor: "cisco",
    portCount: 2,
    interfaceTemplate: "GigabitEthernet0/{n}",
    model3D: "/models/router-4321.glb"
  },

  "4331": {
    modelId: "4331",
    displayName: "4331",
    family: "router",
    vendor: "cisco",
    portCount: 2,
    interfaceTemplate: "GigabitEthernet0/{n}",
    model3D: "/models/router-4331.glb"
  },

  "1240": {
    modelId: "1240",
    displayName: "1240",
    family: "router",
    vendor: "cisco",
    portCount: 2,
    interfaceTemplate: "GigabitEthernet0/{n}",
    model3D: "/models/router-1941.glb"
  }

};

const endDevices = {
  "desktop": {
    modelId: "desktop",
    displayName: "Desktop",
    family: "end-device",
    vendor: "generic",
    portCount: 1,
    interfaceTemplate: "FastEthernet0",
    model3D: "/models/pc-desktop.glb",
  },
  "laptop": {
    modelId: "laptop",
    displayName: "Laptop",
    family: "end-device",
    vendor: "generic",
    portCount: 1,
    interfaceTemplate: "FastEthernet0",
    model3D: "/models/laptop.glb",
  },
  "smartphone": {
    modelId: "smartphone",
    displayName: "Smart Phone",
    family: "end-device",
    vendor: "generic",
    portCount: 1,
    interfaceTemplate: "Wireless0",
    model3D: "/models/smartphone.glb",
  }
};

export const cables = {
  "console": {
    id: "console",
    label: "Console",
    description: "Rollover cable for device management",
    type: "serial", 
    speed: 0.0096,       
    maxDistance: 15,    
    fullDuplex: true,
    connectorType: "db9_rj45",
    visual: {
      color: "#60A5FA",
      thickness: 0.02,
      dashArray: [0.1, 0.1],
      opacity: 1.0
    }
  },

  "copper-straight": {
    id: "copper-straight",
    label: "Straight-Through",
    type: "ethernet",
    category: "cat6",
    speed: 1000,    
    maxDistance: 100,
    fullDuplex: true,
    connectorType: "rj45",
    visual: {
      color: "#000", 
      thickness: 0.03,
      opacity: 1.0
    }
  },

  "copper-crossover": {
    id: "copper-crossover",
    label: "Cross-Over",
    type: "ethernet",
    category: "cat6",
    speed: 1000,
    maxDistance: 100,
    fullDuplex: true,
    connectorType: "rj45",
    visual: {
      color: "#000",
      thickness: 0.03,
      dashArray: [0.2, 0.2],
      opacity: 1.0
    }
  },
};

export function generateInterfaces(catalogEntry) {
  const interfaces = [];

  if (!catalogEntry) return interfaces;
  if (catalogEntry.portGroups) {
    catalogEntry.portGroups.forEach(group => {
      const start = group.startIndex || 1;
      const end = start + group.count - 1;
      
      for (let i = start; i <= end; i++) {
        interfaces.push(group.template.replace(/{n}/g, i));
      }
    });
  } 
  else if (catalogEntry.portCount) {
    const tmpl = catalogEntry.interfaceTemplate || "Eth{n}";
    for (let i = 1; i <= catalogEntry.portCount; i++) {
      interfaces.push(tmpl.replace(/{n}/g, i));
    }
  }

  return interfaces;
}

export function createDeviceInstance(catalogId, position = { x: 0, y: 0, z: 0 }, opts = {}) {
  const catalogEntry = switches[catalogId] || routers[catalogId] || endDevices[catalogId] ;
  if (!catalogEntry) {
    throw new Error(`Unknown catalogId: ${catalogId}`);
  }

  const id = `dev_${Date.now().toString(36)}_${Math.floor(Math.random() * 1000)}`;
  const name = opts.name || catalogEntry.displayName;
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
  routers,
  endDevices,
  cables,
};

export default deviceCatalog;
