// src/core/network/Cable.js
import { cables } from './deviceCatalog'; // The catalog we defined earlier

export default class Link {
    constructor(data = {}) {
        // --- IDENTITY ---
        this.id = data.id || `link-${Math.random().toString(36).substr(2, 9)}`;
        this.label = data.label || 'Network Cable';

        // --- PHYSICAL CONNECTION ---
        this.sourceInterface = data.sourceInterface;
        this.targetInterface = data.targetInterface; 
        
        // --- CABLE SPECIFICATIONS ---
        this.type = data.type || "copper-straight"; 
        this.specs = cables[this.type]; 

        // --- SIMULATION STATE (From your Link class) ---
        this.bandwidth = this.specs?.speed || 1000; 
        this.latency = data.latency || 1; 
        this.packetLoss = data.packetLoss || 0; 
        this.status = "down"; 

        // --- GEOMETRY (For 3D Renderer) ---
        this.geometry = {
            points: data.points || [],
            length: this._calculateLength(data.points)
        };

        this._initConnection();
    }

    /**Checks compatibility before allowing the connection.*/
    _initConnection() {
        if (!this.sourceInterface || !this.targetInterface) return;

        if (this.geometry.length > (this.specs?.maxDistance || 100)) {
            console.warn(`Cable ${this.id} exceeds max length of ${this.specs.maxDistance}m`);
        }

        this.sourceInterface.connectLink(this);
        this.targetInterface.connectLink(this);
        this.bringUp();
    }

    /** SIMULATION: Sets the physical link state to "UP" */
    bringUp() {
        this.sourceInterface.status = "up";
        this.targetInterface.status = "up";
        this.status = "up";
        console.log(`Link ${this.id} is now UP.`);
    }

    /**SIMULATION: Sets the physical link state to "DOWN" */
    bringDown() {
        this.sourceInterface.status = "down";
        this.targetInterface.status = "down";
        this.status = "down";
    }

    /** LOGIC: Helper to find "the other end" of the cable */
    getOtherInterface(currentInterface) {
        if (currentInterface === this.sourceInterface) return this.targetInterface;
        if (currentInterface === this.targetInterface) return this.sourceInterface;
        return null;
    }

    /** Handles Packet Loss and Latency simulation. */
    transmitPacket(packet, fromInterface) {
        if (this.status !== "up") {
            return false;
        }

        const target = this.getOtherInterface(fromInterface);
        if (!target) return false;

        if (this.packetLoss > 0 && Math.random() * 100 < this.packetLoss) {
            console.debug(`Packet dropped due to noise on Link ${this.id}`);
            return false;
        }

        setTimeout(() => {
            if (target.receivePacket) {
                target.receivePacket(packet);
            }
        }, this.latency);

        return true;
    }

    /** Helper to calculate 3D length */
    _calculateLength(points) {
        if (!points || points.length < 2) return 0;
        const [p1, p2] = points;
        return Math.sqrt(
            Math.pow(p2.x - p1.x, 2) + 
            Math.pow(p2.y - p1.y, 2) + 
            Math.pow(p2.z - p1.z, 2)
        );
    }
}