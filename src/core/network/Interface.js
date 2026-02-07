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

        this.device = null;

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

    receivePacket(packet) {
        if (this.status !== 'up') return false;
        if (!this.device) return false;

        if (typeof this.device.onPacketReceived === 'function') {
            this.device.onPacketReceived(packet, this);
        }

        return true;
    }

    onPacketReceived(packet, ingressInterface) {
        /*
            Default behavior: Devices will override this 
            method to implement specific packet handling logic
        */
    }
}