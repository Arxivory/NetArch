import DeviceFactory from '../../../data/DeviceFactory.js';
import Link from '../Link.js';
import { createEthernetFrame } from '../Packet.js';

export default function testSwitchEngine() {
  console.log("🚀 --- STARTING LAYER 2 SIMULATION ---");

  // 1. Boot up the hardware
  const sw1 = DeviceFactory.create('2960', {x:0, y:0, z:0}, { hostname: "SW-Core" });
  const pc1 = DeviceFactory.create('desktop', {x:0, y:0, z:0}, { hostname: "PC-A" });
  const pc2 = DeviceFactory.create('desktop', {x:0, y:0, z:0}, { hostname: "PC-B" });

  // 2. Plug in the cables safely
  const pc1Eth = pc1.getPortByName('FastEthernet1');
  const sw1Eth = sw1.getPortByName('FastEthernet0/1');
  
  const link1 = new Link({
    sourcePort: pc1Eth,
    targetPort: sw1Eth
  });

  // 3. PC-A sends a Broadcast Frame using your official Packet.js builder!
  const pc1Mac = pc1.interfaces.find(i => i.name === 'FastEthernet1').macAddress;
  
  const broadcastFrame = createEthernetFrame({
    srcMAC: pc1Mac,
    dstMAC: "FF:FF:FF:FF:FF:FF", 
    payload: "ARP REQUEST: Who has IP 192.168.1.2?"
  });

  console.log(`📡 [PC-A] Transmitting broadcast frame...`);
  
  // Transmit specifically out of the Ethernet port we plugged in
  pc1Eth.link.transmitPacket(broadcastFrame, pc1Eth);

  setTimeout(() => {
    console.log("🧠 --- SWITCH CAM TABLE ---");
    console.table(sw1.showMacAddressTable());
  }, 50);
}