import DeviceFactory from '../../../data/DeviceFactory.js';
import Link from '../Link.js';
export default function testSwitchEngine() {
  console.log("--- STARTING LAYER 2 SIMULATION ---");

  // 1. Boot up the hardware
  const sw1 = DeviceFactory.create('2960', {x:0, y:0, z:0}, { hostname: "SW-Core" });
  const pc1 = DeviceFactory.create('desktop', {x:0, y:0, z:0}, { hostname: "PC-A" });
  const pc2 = DeviceFactory.create('desktop', {x:0, y:0, z:0}, { hostname: "PC-B" });

  // 2. Plug in the cables (This auto-negotiates and brings the links UP!)
  const link1 = new Link({
    sourcePort: pc1.getPortByName('FastEthernet1'),
    targetPort: sw1.getPortByName('FastEthernet0/1')
  });

  const link2 = new Link({
    sourcePort: pc2.getPortByName('FastEthernet1'),
    targetPort: sw1.getPortByName('FastEthernet0/2')
  });

  // 3. PC-A sends a Broadcast Frame (like an ARP Request)
  const pc1Mac = pc1.interfaces[0].macAddress;
  const broadcastFrame = {
    srcMac: pc1Mac,
    dstMac: "FF:FF:FF:FF:FF:FF", 
    vlanId: 1,
    payload: "Who has IP 192.168.1.2?"
  };

  console.log(`\n[PC-A] Transmitting broadcast frame...`);
  // PC transmits out its physical port
  pc1.ports[0].link.transmitPacket(broadcastFrame, pc1.ports[0]);

  // Wait a tiny bit for the simulated propagation latency (latencyMs in Link.js)
  setTimeout(() => {
    console.log("\n--- SWITCH CAM TABLE ---");
    // You should see PC-A's MAC dynamically learned on FastEthernet0/1!
    console.table(sw1.showMacAddressTable());
  }, 50);
}