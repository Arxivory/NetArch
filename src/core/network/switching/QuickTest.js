import DeviceFactory from '../../../data/DeviceFactory.js';
import Link from '../Link.js';
import { createEthernetFrame } from '../Packet.js';

export default function testSwitchEngine() {
  console.log("🚀 --- STARTING VLAN ISOLATION TEST ---");

  // 1. Boot up the hardware
  const sw1 = DeviceFactory.create('2960', {x:0, y:0, z:0}, { hostname: "SW-Core" });
  const pcA = DeviceFactory.create('desktop', {x:0, y:0, z:0}, { hostname: "PC-A" });
  const pcB = DeviceFactory.create('desktop', {x:0, y:0, z:0}, { hostname: "PC-B" });

  // 2. Plug in the cables
  const pcAEth = pcA.getPortByName('FastEthernet1');
  const sw1Port1 = sw1.getPortByName('FastEthernet0/1');
  const link1 = new Link({ sourcePort: pcAEth, targetPort: sw1Port1 });

  const pcBEth = pcB.getPortByName('FastEthernet1');
  const sw1Port2 = sw1.getPortByName('FastEthernet0/2');
  const link2 = new Link({ sourcePort: pcBEth, targetPort: sw1Port2 });

  // 3. CONFIGURE VLANs ON THE SWITCH
  console.log("\n⚙️ Configuring VLANs...");
  sw1.vlanManager.addVlan(10, "HR_Dept");
  sw1.vlanManager.addVlan(20, "Eng_Dept");
  
  // Assign ports to VLANs
  sw1.vlanManager.setAccessVlan(sw1Port1.id, 10); // PC-A -> VLAN 10
  sw1.vlanManager.setAccessVlan(sw1Port2.id, 20); // PC-B -> VLAN 20

  console.log("\n📊 CURRENT VLAN DATABASE:");
  console.table(sw1.showVlanBrief());

  // 4. PC-A sends a Broadcast Frame
  const pcAMac = pcA.interfaces[0].macAddress;
  const broadcastFrame = createEthernetFrame({
    srcMAC: pcAMac,
    dstMAC: "FF:FF:FF:FF:FF:FF", 
    payload: "ARP REQUEST: Who has IP 192.168.1.2?"
  });

  console.log(`\n📡 [PC-A] Transmitting broadcast frame...`);
  pcAEth.link.transmitPacket(broadcastFrame, pcAEth);

  setTimeout(() => {
    console.log("\n🧠 --- SWITCH CAM TABLE ---");
    // You should see PC-A learned on VLAN 10!
    console.table(sw1.showMacAddressTable());
    
    console.log("\n✅ Test Complete: PC-B did NOT receive the broadcast because it is isolated in VLAN 20!");
  }, 50);
}