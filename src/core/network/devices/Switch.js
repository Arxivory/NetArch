import Device from '../Device.js';

export class Frame {
    constructor({ src_mac, dst_mac, vlan_id, payload = null }) {
        this.src_mac = src_mac;
        this.dst_mac = dst_mac;
        this.vlan_id = vlan_id;
        this.payload = payload;
    }
}

export class Port {
    constructor({
        port_id,
        status = 'up',
        mode = 'access',
        allowed_vlans = [],
    }) {
        this.port_id = port_id;
        this.status = status;
        this.mode = mode;
        this.allowed_vlans = allowed_vlans;
    }
}

export default class Switch extends Device {
    constructor(props = {}) {
        super({
            id: props.id ?? 'switch-1',
            hostname: props.hostname ?? 'Switch',
            ...props,
            type: 'switch',
        });

        this.vlans = new Map();
        this.defaultGateway = null;

        this.layer2_ports = new Map();
        this.mac_table = {};
        this.macTable = this.mac_table;
    }

    initializeDefaultPorts() {
        this.layer2_ports.clear();

        for (let portNumber = 1; portNumber <= 6; portNumber += 1) {
            this.addLayer2Port(new Port({
                port_id: portNumber,
                status: 'up',
                mode: 'access',
                allowed_vlans: [10],
            }));
        }

        for (let portNumber = 7; portNumber <= 8; portNumber += 1) {
            this.addLayer2Port(new Port({
                port_id: portNumber,
                status: 'up',
                mode: 'trunk',
                allowed_vlans: [10, 20],
            }));
        }

        return this.layer2_ports;
    }

    addLayer2Port(port) {
        this.layer2_ports.set(port.port_id, port);
        return port;
    }

    getLayer2Port(portId) {
        return this.layer2_ports.get(portId);
    }

    addVlan(vlanId, config = {}) {
        this.vlans.set(vlanId, {
            id: vlanId,
            name: config.name ?? `VLAN ${vlanId}`,
            ipv4: config.ipv4 || null,
            ipv6: config.ipv6 || null,
            status: 'active',
        });
    }
}
