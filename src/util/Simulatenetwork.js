/**
 * simulateNetwork.js
 * 
 * Call this utility wherever your Simulate button's onClick lives.
 * It fires two events:
 *
 *   1. "simulate-network"
 *      → ConsoleSimulationLogs listens: snapshots console logs
 *        into simulation panel AND auto-switches the tab.
 *
 *   2. Per-device "packetTransmissionScheduled" events
 *      → SimulationPanel listens: creates mail cards for each
 *        live packet/frame transmission.
 *
 * Usage (in your toolbar / header component):
 *
 *   import { triggerSimulation } from "./simulateNetwork";
 *   
 *   <button onClick={() => triggerSimulation(networkManager)}>
 *     Simulate
 *   </button>
 *
 * If you already have a networkManager / appState.network reference,
 * pass it in. Otherwise call triggerSimulation() with no arguments
 * and only the console-snapshot + tab-switch will fire.
 */

/**
 * @param {object|null} networkManager  - Optional. Your NetworkStore or
 *   NetworkIntegrationEngine instance. Used to emit per-device events.
 */
export function triggerSimulation(networkManager = null) {
  // 1. Tell ConsoleSimulationLogs to snapshot + switch tab
  window.dispatchEvent(new CustomEvent("simulate-network"));

  // 2. If a network manager is provided, walk its devices and links
  //    and emit a packetTransmissionScheduled event for each active link,
  //    so SimulationPanel gets live mail cards for real traffic.
  if (!networkManager) return;

  const devices = networkManager.getAllDevices?.() ?? networkManager.devices ?? [];
  const links   = networkManager.getAllLinks?.()  ?? networkManager.links   ?? [];

  links.forEach((link) => {
    if (link.status !== "up") return;

    const srcDevice = devices.find(
      (d) => d.id === link.sourcePort?.id?.split("::")?.[0] || d.id === link.sourceId
    );
    const dstDevice = devices.find(
      (d) => d.id === link.targetPort?.id?.split("::")?.[0] || d.id === link.targetId
    );

    if (!srcDevice || !dstDevice) return;

    window.dispatchEvent(
      new CustomEvent("packetTransmissionScheduled", {
        detail: {
          packetId:  `sim-${link.id}-${Date.now()}`,
          srcDevice,
          dstDevice,
          nextDevice: dstDevice,
          viaLink:   link,
          packet: {
            srcMAC:   link.sourcePort?.interface?.macAddress || "",
            dstMAC:   link.targetPort?.interface?.macAddress || "",
            etherType: 0x0800,
            payload: {
              protocol: "ip",
              srcIP: link.sourcePort?.interface?.ipv4?.address || "",
              dstIP: link.targetPort?.interface?.ipv4?.address || "",
            },
          },
        },
      })
    );
  });
}