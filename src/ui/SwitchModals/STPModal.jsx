import { useState } from "react";
import { createPortal } from "react-dom";
import { GitBranch, Network, Layers, ShieldCheck, Activity } from "lucide-react";

export default function STPModal({ onClose, deviceName = "Switch", deviceLocation = "Network" }) {
  const [activeSTPTab, setActiveSTPTab] = useState("global");

  const now = () => new Date().toISOString().replace("T", " ").slice(0, 19);

  const handleApply = () => {
    const ts = now();
    const dispatch = (message) =>
      window.dispatchEvent(new CustomEvent("add-system-log", { detail: { device: "Switch", deviceName, message, location: deviceLocation, italic: true } }));

    dispatch(`%STP-5-MODE_SET: [${ts}] ${deviceName} @ ${deviceLocation} — Spanning Tree Protocol configuration committed. Active STP mode applied to all participating VLANs.`);
    dispatch(`%STP-6-BRIDGE_PRIORITY: [${ts}] ${deviceName} — Bridge priority values updated. Root bridge election will be triggered on next BPDU exchange.`);
    dispatch(`%STP-6-PORTFAST: [${ts}] ${deviceName} — PortFast / Edge port settings applied. Designated access ports will bypass listening and learning states on link-up.`);
    dispatch(`%STP-5-GUARD_SET: [${ts}] ${deviceName} — BPDU Guard, Root Guard, and Loop Guard protection policies updated. Violations will trigger err-disabled state on affected ports.`);
    onClose();
  };

  return createPortal(
    <div className="config-modal-overlay stp-modal-layer">
      <div className="config-modal-content nat-sidebar-layout">

        <div className="nat-sidebar">
          <div className="sidebar-header">
            <GitBranch size={18} />
            <span>Spanning Tree</span>
          </div>
          <div className="nav-list">
            {[
              { key: "global",     icon: <Network size={16} />,     label: "Global STP",      desc: "Mode & timers" },
              { key: "priority",   icon: <Layers size={16} />,      label: "Bridge Priority",  desc: "Root bridge election" },
              { key: "portfast",   icon: <GitBranch size={16} />,   label: "PortFast / Edge",  desc: "Access port optimization" },
              { key: "protection", icon: <ShieldCheck size={16} />, label: "Protection",       desc: "BPDU, Root & Loop Guard" },
              { key: "monitor",    icon: <Activity size={16} />,    label: "STP Topology",     desc: "Port roles & state" },
            ].map(({ key, icon, label, desc }) => (
              <button key={key} className={`nav-item ${activeSTPTab === key ? "active" : ""}`} onClick={() => setActiveSTPTab(key)}>
                <div className="nav-icon">{icon}</div>
                <div className="nav-text"><strong>{label}</strong><p>{desc}</p></div>
              </button>
            ))}
          </div>
        </div>

        <div className="nat-main-content">
          <div className="modal-header-clean">
            <h3>Advanced Spanning Tree Configuration</h3>
            <button className="close-btn-mono" onClick={onClose}>×</button>
          </div>

          <div className="config-body">

            {/* ── GLOBAL STP ── */}
            {activeSTPTab === "global" && (
              <div className="config-group-mono">
                <label>STP Global Settings</label>
                <div className="inline-fields">
                  <div className="input-wrap">
                    <span>STP Mode</span>
                    <select>
                      <option>Rapid PVST+</option><option>PVST+</option><option>MST (802.1s)</option>
                    </select>
                  </div>
                  <div className="input-wrap">
                    <span>Hello Time (sec)</span>
                    <input defaultValue="2" />
                  </div>
                  <div className="input-wrap">
                    <span>Forward Delay (sec)</span>
                    <input defaultValue="15" />
                  </div>
                  <div className="input-wrap">
                    <span>Max Age (sec)</span>
                    <input defaultValue="20" />
                  </div>
                  <div className="input-wrap">
                    <span>Transmit Hold Count</span>
                    <input defaultValue="6" />
                  </div>
                </div>
                <label style={{marginTop:"14px"}}>MST Instance Config (if MST mode)</label>
                <table className="acl-table">
                  <thead>
                    <tr><th>Instance</th><th>VLANs Mapped</th><th>Priority</th><th>Revision</th></tr>
                  </thead>
                  <tbody>
                    {[
                      { inst:"0", vlans:"1-9,11-19,21-29,31-98,100-4094", pri:"32768", rev:"1" },
                      { inst:"1", vlans:"10,20",                           pri:"4096",  rev:"1" },
                      { inst:"2", vlans:"30,99",                           pri:"8192",  rev:"1" },
                    ].map((row, i) => (
                      <tr key={i}>
                        <td>{row.inst}</td>
                        <td><input defaultValue={row.vlans} style={{width:"100%"}} /></td>
                        <td><input defaultValue={row.pri} /></td>
                        <td><input defaultValue={row.rev} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ── BRIDGE PRIORITY ── */}
            {activeSTPTab === "priority" && (
              <div className="config-group-mono">
                <label>Per-VLAN Bridge Priority & Root Election</label>
                <table className="acl-table">
                  <thead>
                    <tr>
                      <th>VLAN</th>
                      <th>Bridge Priority</th>
                      <th>Role</th>
                      <th>Root Bridge MAC</th>
                      <th>Root Cost</th>
                      <th>Root Port</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { vlan:"10", pri:"4096",  role:"Root Primary",   mac:"00:1A:2B:3C:4D:01", cost:"0",  port:"—" },
                      { vlan:"20", pri:"8192",  role:"Root Secondary",  mac:"00:1A:2B:3C:4D:02", cost:"4",  port:"Gi0/1" },
                      { vlan:"30", pri:"32768", role:"Normal",          mac:"00:1A:2B:3C:4D:03", cost:"19", port:"Gi0/2" },
                      { vlan:"99", pri:"4096",  role:"Root Primary",   mac:"00:1A:2B:3C:4D:01", cost:"0",  port:"—" },
                    ].map((row, i) => (
                      <tr key={i}>
                        <td><strong>VLAN {row.vlan}</strong></td>
                        <td>
                          <select defaultValue={row.pri}>
                            {["4096","8192","16384","24576","28672","32768"].map(p => <option key={p}>{p}</option>)}
                          </select>
                        </td>
                        <td>
                          <select defaultValue={row.role}>
                            <option>Root Primary</option><option>Root Secondary</option><option>Normal</option>
                          </select>
                        </td>
                        <td style={{fontSize:"11px",fontFamily:"monospace"}}>{row.mac}</td>
                        <td>{row.cost}</td>
                        <td>{row.port}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="inline-fields" style={{marginTop:"12px"}}>
                  <div className="input-wrap">
                    <span>Diameter (hops)</span>
                    <input defaultValue="7" />
                  </div>
                  <div className="input-wrap">
                    <span>Path Cost Method</span>
                    <select><option>Long (Gi=4)</option><option>Short (Legacy)</option></select>
                  </div>
                </div>
              </div>
            )}

            {/* ── PORTFAST / EDGE ── */}
            {activeSTPTab === "portfast" && (
              <div className="config-group-mono">
                <label>PortFast & Edge Port Configuration</label>
                <div className="checkbox-wrap">
                  <input type="checkbox" defaultChecked />
                  <span>Enable PortFast by default on all access ports</span>
                </div>
                <div className="checkbox-wrap">
                  <input type="checkbox" defaultChecked />
                  <span>Enable PortFast on trunk ports (edge trunks)</span>
                </div>
                <table className="acl-table" style={{marginTop:"10px"}}>
                  <thead>
                    <tr>
                      <th>Interface</th>
                      <th>PortFast</th>
                      <th>Link Type</th>
                      <th>Edge Port</th>
                      <th>Auto-Edge</th>
                      <th>Err-Disabled Recovery</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { port:"Fa0/1", pf:true,  link:"Point-to-Point", edge:true,  auto:true  },
                      { port:"Fa0/2", pf:true,  link:"Point-to-Point", edge:true,  auto:true  },
                      { port:"Fa0/3", pf:false, link:"Shared",         edge:false, auto:false },
                      { port:"Gi0/1", pf:false, link:"Point-to-Point", edge:false, auto:true  },
                      { port:"Gi0/2", pf:false, link:"Point-to-Point", edge:false, auto:true  },
                    ].map((row, i) => (
                      <tr key={i}>
                        <td>{row.port}</td>
                        <td style={{textAlign:"center"}}><input type="checkbox" defaultChecked={row.pf} /></td>
                        <td>
                          <select defaultValue={row.link}>
                            <option>Point-to-Point</option><option>Shared</option>
                          </select>
                        </td>
                        <td style={{textAlign:"center"}}><input type="checkbox" defaultChecked={row.edge} /></td>
                        <td style={{textAlign:"center"}}><input type="checkbox" defaultChecked={row.auto} /></td>
                        <td>
                          <select>
                            <option>300 sec</option><option>60 sec</option><option>Manual</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ── PROTECTION ── */}
            {activeSTPTab === "protection" && (
              <div className="config-group-mono">
                <label>Loop & Topology Protection Features</label>
                <table className="acl-table">
                  <thead>
                    <tr>
                      <th>Interface</th>
                      <th>BPDU Guard</th>
                      <th>BPDU Filter</th>
                      <th>Root Guard</th>
                      <th>Loop Guard</th>
                      <th>TC Guard</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { port:"Fa0/1 (access)", bg:true,  bf:false, rg:false, lg:false, tc:true  },
                      { port:"Fa0/2 (access)", bg:true,  bf:false, rg:false, lg:false, tc:true  },
                      { port:"Fa0/3 (access)", bg:true,  bf:false, rg:false, lg:false, tc:true  },
                      { port:"Gi0/1 (uplink)", bg:false, bf:false, rg:true,  lg:true,  tc:false },
                      { port:"Gi0/2 (uplink)", bg:false, bf:false, rg:true,  lg:true,  tc:false },
                    ].map((row, i) => (
                      <tr key={i}>
                        <td style={{fontSize:"12px"}}>{row.port}</td>
                        <td style={{textAlign:"center"}}><input type="checkbox" defaultChecked={row.bg} /></td>
                        <td style={{textAlign:"center"}}><input type="checkbox" defaultChecked={row.bf} /></td>
                        <td style={{textAlign:"center"}}><input type="checkbox" defaultChecked={row.rg} /></td>
                        <td style={{textAlign:"center"}}><input type="checkbox" defaultChecked={row.lg} /></td>
                        <td style={{textAlign:"center"}}><input type="checkbox" defaultChecked={row.tc} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="inline-fields" style={{marginTop:"12px"}}>
                  <div className="input-wrap">
                    <span>BPDU Guard Recovery (sec)</span>
                    <input defaultValue="300" />
                  </div>
                  <div className="input-wrap">
                    <span>TC Guard Rate Limit</span>
                    <input defaultValue="5 per 4 sec" />
                  </div>
                </div>
              </div>
            )}

            {/* ── STP TOPOLOGY MONITOR ── */}
            {activeSTPTab === "monitor" && (
              <div className="config-group-mono">
                <label>STP Port Roles & Current Topology State</label>
                <table className="acl-table">
                  <thead>
                    <tr>
                      <th>Interface</th>
                      <th>VLAN</th>
                      <th>Role</th>
                      <th>State</th>
                      <th>Cost</th>
                      <th>Priority.Port</th>
                      <th>Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { iface:"Gi0/1", vlan:"10", role:"Root",       state:"FWD", cost:"4",  prio:"128.1", type:"P2p" },
                      { iface:"Gi0/2", vlan:"10", role:"Alternate",  state:"BLK", cost:"4",  prio:"128.2", type:"P2p" },
                      { iface:"Fa0/1", vlan:"10", role:"Designated", state:"FWD", cost:"19", prio:"128.3", type:"P2p Edge" },
                      { iface:"Fa0/2", vlan:"20", role:"Designated", state:"FWD", cost:"19", prio:"128.4", type:"P2p Edge" },
                      { iface:"Gi0/1", vlan:"20", role:"Root",       state:"FWD", cost:"4",  prio:"128.1", type:"P2p" },
                    ].map((row, i) => (
                      <tr key={i}>
                        <td>{row.iface}</td>
                        <td>VLAN{row.vlan}</td>
                        <td>{row.role}</td>
                        <td style={{color: row.state==="FWD" ? "var(--color-text-success)" : row.state==="BLK" ? "var(--color-text-danger)" : "var(--color-text-warning)", fontWeight:600}}>{row.state}</td>
                        <td>{row.cost}</td>
                        <td style={{fontFamily:"monospace",fontSize:"12px"}}>{row.prio}</td>
                        <td style={{fontSize:"12px"}}>{row.type}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="inline-fields" style={{marginTop:"12px"}}>
                  <div className="input-wrap">
                    <span>TC Count (topology changes)</span>
                    <input readOnly defaultValue="12" />
                  </div>
                  <div className="input-wrap">
                    <span>Last TC From</span>
                    <input readOnly defaultValue="Gi0/1" />
                  </div>
                </div>
              </div>
            )}

          </div>

          <div className="modal-footer-clean">
            <button className="btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn-primary" onClick={handleApply}>Apply STP Config</button>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
}