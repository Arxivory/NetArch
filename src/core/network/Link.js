export default class Link {
    constructor({
        id,
        interfaceA, interfaceB,
        type = "ethernet",
        bandwidth = 1000,
        latency = 1,
        packetLoss = 0
    }) {
        this.id = id;
        this.type = type;

        this.interfaceA = interfaceA;
        this.interfaceB = interfaceB;

        this.bandwidth = bandwidth;
        this.latency = latency;
        this.packetLoss = packetLoss;

        interfaceA.connectLink(this);
        interfaceB.connectLink(this);
    }

    bringUp() {
        this.interfaceA.status = "up";
        this.interfaceB.status = "up";
        this.status = "up";
    }

    bringDown() {
        this.interfaceA.status = "down";
        this.interfaceB.status = "down";
        this.status = "down";
    }

    getOtherInterface(intf) {
        if (intf === this.interfaceA) return this.interfaceB;
        if (intf === this.interfaceB) return this.interfaceA;
        return null;
    }

    transmitPacket(packet, fromInterface) {
        if (this.status !== "up") return false;

        const target = this.getOtherInterface(fromInterface);
        if (!target) return false;

        if (Math.random() * 100 < this.packetLoss) {
            return false;
        }

        setTimeout(() => {
            target.receivePacket?.(packet);
        }, this.latency);

        return true;
    }
}