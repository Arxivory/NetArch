export default class Interface {
    constructor({
        id,
        name,
        type,
        macAddress,
        bandwidth = 1000,
        duplex = 'full'
    }) {
        this.id = id;
        this.name = name;
        this.type = type;

        this.macAddress = macAddress;
        this.bandwidth = bandwidth;
        this.duplex = duplex;

        this.status = 'down';
        this.link = null;

        this.ipv4 = null;
        this.ipv6 = null;
        this.vlan = null;
    }

    connectLink(link) {
        this.link = link;
        this.status = 'up';
    }

    configureIPv4({ address, subnetMask }) {
        this.ipv4 = { address, subnetMask };
    }

    configureIPv6({ address, prefixLength }) {
        this.ipv6 = { address, prefixLength };
    }
}