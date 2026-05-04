import { useState } from "react";
import { createPortal } from "react-dom";
import { Network, Layers, Cable, ArrowLeftRight, GitBranch, Activity, ShieldCheck } from "lucide-react";

export default function VLANModal({ onClose, deviceName = "Switch", deviceLocation = "Network" }) {
  const [activeVLANTab, setActiveVLANTab] = useState("vlans");

  const [vlans, setVlans] = useState([
    { id: "10", name: "SALES_VLAN",  type: "Data",       pvlan: "None",       status: "Active",    mtu: "1500", subnet: "10.10.10.0/24" },
    { id: "20", name: "VOICE_VLAN",  type: "Voice",      pvlan: "None",       status: "Active",    mtu: "1500", subnet: "10.10.20.0/24" },
    { id: "30", name: "MGMT_VLAN",   type: "Management", pvlan: "None",       status: "Active",    mtu: "1500", subnet: "10.10.30.0/24" },
    { id: "99", name: "NATIVE_VLAN", type: "Native",     pvlan: "Promiscuous", status: "Active",   mtu: "9000", subnet: "10.10.99.0/24" },
  ]);

  const updateVlan = (index, field, value) => {
    setVlans(prev => prev.map((v, i) => i === index ? { ...v, [field]: value } : v));
  };

  const addVlan = () => setVlans(prev => [...prev, { id: "", name: "", type: "Data", pvlan: "None", status: "Active", mtu: "1500", subnet: "" }]);
  const removeVlan = (i) => setVlans(prev => prev.filter((_, idx) => idx !== i));

  const [pruning, setPruning] = useState(true);
  const [macAging, setMacAging] = useState("300");
  const [spanSource, setSpanSource] = useState("Fa0/1");
  const [spanDest, setSpanDest] = useState("Fa0/24");

  const handleApply = () => {
    const logs = [];
    vlans.forEach(v => {
      if (v.id) logs.push(`[VLAN] ID ${v.id} (${v.name}) — Type: ${v.type}, Status: ${v.status}, MTU: ${v.mtu}, Subnet: ${v.subnet || "unset"}`);
    });
    if (pruning) logs.push(`[VLAN] Pruning: Enabled`);
    if (macAging) logs.push(`[VLAN] MAC Aging Timer: ${macAging}s`);
    if (logs.length === 0) logs.push(`[VLAN] Config applied — no parameters set`);
    logs.forEach(message =>
      window.dispatchEvent(new CustomEvent("add-system-log", { detail: { device: "Switch", deviceName, message, location: deviceLocation } }))
    );
    onClose();
  };

  return createPortal(
    <div className="config-modal-overlay vlan-modal-layer">
      <div className="nat-sidebar-layout">

        <div className="nat-sidebar">
          <div className="sidebar-header">
            <Network size={18} />
            <span>VLAN Manager</span>
          </div>
          <div className="nav-list">
            {[
              { key: "vlans",   icon: <Layers size={16} />,      label: "VLAN Database",   desc: "Create & manage VLANs" },
              { key: "ports",   icon: <Cable size={16} />,        label: "Port Assignment",  desc: "Access & trunk ports" },
              { key: "trunk",   icon: <ArrowLeftRight size={16} />,label: "Inter-VLAN Routing", desc: "SVI & L3 gateway" },
              { key: "stp",     icon: <GitBranch size={16} />,    label: "DHCP Snooping",   desc: "Binding & trusted ports" },
              { key: "security",icon: <ShieldCheck size={16} />,  label: "DAI / IP Source",  desc: "ARP inspection & IPSG" },
              { key: "monitor", icon: <Activity size={16} />,     label: "Monitoring",       desc: "Traffic & VLAN health" },
            ].map(({ key, icon, label, desc }) => (
              <button key={key} className={`nav-item ${activeVLANTab === key ? "active" : ""}`} onClick={() => setActiveVLANTab(key)}>
                <div className="nav-icon">{icon}</div>
                <div className="nav-text"><strong>{label}</strong><p>{desc}</p></div>
              </button>
            ))}
          </div>
        </div>

        <div className="nat-main-content">
          <div className="modal-header-clean">
            <h3>Advanced VLAN Switch Configuration</h3>
            <button className="close-btn-mono" onClick={onClose}>×</button>
          </div>

          <div className="config-body">

            {/* ── VLAN DATABASE ── */}
            {activeVLANTab === "vlans" && (
              <div className="config-group-mono">
                <label>VLAN Database</label>
                <table className="acl-table">
                  <thead>
                    <tr>
                      <th>VLAN ID</th>
                      <th>Name</th>
                      <th>Type</th>
                      <th>Private VLAN Mode</th>
                      <th>MTU</th>
                      <th>Status</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {vlans.map((v, i) => (
                      <tr key={i}>
                        <td><input value={v.id} onChange={e => updateVlan(i, "id", e.target.value)} placeholder="10" /></td>
                        <td><input value={v.name} onChange={e => updateVlan(i, "name", e.target.value)} placeholder="SALES_VLAN" /></td>
                        <td>
                          <select value={v.type} onChange={e => updateVlan(i, "type", e.target.value)}>
                            <option>Data</option><option>Voice</option><option>Management</option><option>Native</option>
                          </select>
                        </td>
                        <td>
                          <select value={v.pvlan} onChange={e => updateVlan(i, "pvlan", e.target.value)}>
                            <option>None</option><option>Promiscuous</option><option>Community</option><option>Isolated</option>
                          </select>
                        </td>
                        <td>
                          <select value={v.mtu} onChange={e => updateVlan(i, "mtu", e.target.value)}>
                            <option>1500</option><option>4500</option><option>9000</option><option>9216</option>
                          </select>
                        </td>
                        <td>
                          <select value={v.status} onChange={e => updateVlan(i, "status", e.target.value)}>
                            <option>Active</option><option>Suspended</option>
                          </select>
                        </td>
                        <td><button className="btn-secondary" style={{padding:"2px 8px",fontSize:"12px"}} onClick={() => removeVlan(i)}>✕</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button className="btn-secondary" style={{marginTop:"8px",fontSize:"12px"}} onClick={addVlan}>+ Add VLAN</button>
                <div className="checkbox-wrap" style={{marginTop:"10px"}}>
                  <input type="checkbox" checked={pruning} onChange={e => setPruning(e.target.checked)} />
                  <span>Enable VLAN pruning</span>
                </div>
              </div>
            )}

            {/* ── PORT ASSIGNMENT ── */}
            {activeVLANTab === "ports" && (
              <div className="config-group-mono">
                <label>Switch Port Assignment</label>
                <table className="acl-table">
                  <thead>
                    <tr>
                      <th>Interface</th>
                      <th>Mode</th>
                      <th>Access VLAN</th>
                      <th>Voice VLAN</th>
                      <th>802.1X Auth</th>
                      <th>Sticky MAC</th>
                    </tr>
                  </thead>
                  <tbody>
                    {["Fa0/1", "Fa0/2", "Fa0/3", "Gi0/1", "Gi0/2"].map((port, i) => (
                      <tr key={i}>
                        <td><strong>{port}</strong></td>
                        <td>
                          <select>
                            <option>Access</option><option>Trunk</option><option>Dynamic Auto</option><option>Dynamic Desirable</option>
                          </select>
                        </td>
                        <td><input placeholder="10" /></td>
                        <td><input placeholder="20" /></td>
                        <td>
                          <select>
                            <option>Disabled</option><option>Open</option><option>Closed</option><option>Monitor</option>
                          </select>
                        </td>
                        <td style={{textAlign:"center"}}>
                          <input type="checkbox" defaultChecked={i === 0} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="inline-fields" style={{marginTop:"12px"}}>
                  <div className="input-wrap">
                    <span>MAC Aging Timer (sec)</span>
                    <input value={macAging} onChange={e => setMacAging(e.target.value)} placeholder="300" />
                  </div>
                  <div className="input-wrap">
                    <span>Default Access VLAN</span>
                    <input placeholder="1" />
                  </div>
                </div>
              </div>
            )}

            {/* ── INTER-VLAN ROUTING (SVI) ── */}
            {activeVLANTab === "trunk" && (
              <div className="config-group-mono">
                <label>Inter-VLAN Routing — SVI (Layer 3 Interfaces)</label>
                <table className="acl-table">
                  <thead>
                    <tr>
                      <th>VLAN</th>
                      <th>SVI IP Address</th>
                      <th>Subnet Mask</th>
                      <th>DHCP Relay (Helper)</th>
                      <th>VRF Instance</th>
                      <th>Admin State</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { vlan: "10", ip: "10.10.10.1",  mask: "255.255.255.0", helper: "10.10.30.100", vrf: "default" },
                      { vlan: "20", ip: "10.10.20.1",  mask: "255.255.255.0", helper: "10.10.30.100", vrf: "default" },
                      { vlan: "30", ip: "10.10.30.1",  mask: "255.255.255.0", helper: "",             vrf: "MGMT" },
                      { vlan: "99", ip: "10.10.99.1",  mask: "255.255.255.0", helper: "",             vrf: "default" },
                    ].map((row, i) => (
                      <tr key={i}>
                        <td><strong>Vlan{row.vlan}</strong></td>
                        <td><input defaultValue={row.ip} /></td>
                        <td><input defaultValue={row.mask} /></td>
                        <td><input defaultValue={row.helper} placeholder="none" /></td>
                        <td><input defaultValue={row.vrf} /></td>
                        <td>
                          <select>
                            <option>Up</option><option>Down</option><option>Shutdown</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="checkbox-wrap" style={{marginTop:"10px"}}>
                  <input type="checkbox" defaultChecked />
                  <span>Enable IP routing between VLANs (ip routing)</span>
                </div>
                <div className="checkbox-wrap">
                  <input type="checkbox" />
                  <span>Enable IPv6 inter-VLAN routing</span>
                </div>
              </div>
            )}

            {/* ── DHCP SNOOPING ── */}
            {activeVLANTab === "stp" && (
              <div className="config-group-mono">
                <label>DHCP Snooping Configuration</label>
                <div className="inline-fields">
                  <div className="input-wrap">
                    <span>DHCP Snooping VLANs</span>
                    <input defaultValue="10,20,30" placeholder="10,20,30" />
                  </div>
                  <div className="input-wrap">
                    <span>Binding Database</span>
                    <input defaultValue="flash:dhcp-snooping.db" />
                  </div>
                  <div className="input-wrap">
                    <span>Rate Limit (pps)</span>
                    <input defaultValue="100" placeholder="100" />
                  </div>
                </div>
                <table className="acl-table" style={{marginTop:"10px"}}>
                  <thead>
                    <tr>
                      <th>Interface</th>
                      <th>Trust State</th>
                      <th>Rate Limit (pps)</th>
                      <th>Burst Interval</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { port: "Gi0/1 (Uplink)", trust: "Trusted",   rate: "unlimited" },
                      { port: "Gi0/2 (Uplink)", trust: "Trusted",   rate: "unlimited" },
                      { port: "Fa0/1",          trust: "Untrusted", rate: "100" },
                      { port: "Fa0/2",          trust: "Untrusted", rate: "100" },
                      { port: "Fa0/3",          trust: "Untrusted", rate: "100" },
                    ].map((row, i) => (
                      <tr key={i}>
                        <td>{row.port}</td>
                        <td>
                          <select defaultValue={row.trust}>
                            <option>Trusted</option><option>Untrusted</option>
                          </select>
                        </td>
                        <td><input defaultValue={row.rate} /></td>
                        <td>
                          <select>
                            <option>1 sec</option><option>5 sec</option><option>10 sec</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="checkbox-wrap" style={{marginTop:"10px"}}>
                  <input type="checkbox" defaultChecked />
                  <span>Enable DHCP snooping globally</span>
                </div>
                <div className="checkbox-wrap">
                  <input type="checkbox" defaultChecked />
                  <span>Enable Option 82 insertion</span>
                </div>
                <div className="checkbox-wrap">
                  <input type="checkbox" />
                  <span>Verify MAC address in DHCP packets</span>
                </div>
              </div>
            )}

            {/* ── DAI / IP SOURCE GUARD ── */}
            {activeVLANTab === "security" && (
              <div className="config-group-mono">
                <label>Dynamic ARP Inspection (DAI)</label>
                <div className="inline-fields">
                  <div className="input-wrap">
                    <span>DAI VLANs</span>
                    <input defaultValue="10,20,30" />
                  </div>
                  <div className="input-wrap">
                    <span>ARP Rate Limit (pps)</span>
                    <input defaultValue="100" />
                  </div>
                  <div className="input-wrap">
                    <span>ARP Burst Interval</span>
                    <select><option>1 sec</option><option>5 sec</option><option>10 sec</option></select>
                  </div>
                </div>
                <table className="acl-table" style={{marginTop:"10px"}}>
                  <thead>
                    <tr>
                      <th>Interface</th>
                      <th>DAI Trust</th>
                      <th>IP Source Guard</th>
                      <th>Filter Mode</th>
                      <th>ARP ACL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { port: "Gi0/1", dai: "Trusted",   ipsg: "Disabled", filter: "—" },
                      { port: "Gi0/2", dai: "Trusted",   ipsg: "Disabled", filter: "—" },
                      { port: "Fa0/1", dai: "Untrusted", ipsg: "IP+MAC",   filter: "ip-mac" },
                      { port: "Fa0/2", dai: "Untrusted", ipsg: "IP Only",  filter: "ip" },
                      { port: "Fa0/3", dai: "Untrusted", ipsg: "IP Only",  filter: "ip" },
                    ].map((row, i) => (
                      <tr key={i}>
                        <td>{row.port}</td>
                        <td>
                          <select defaultValue={row.dai}>
                            <option>Trusted</option><option>Untrusted</option>
                          </select>
                        </td>
                        <td>
                          <select defaultValue={row.ipsg}>
                            <option>Disabled</option><option>IP Only</option><option>IP+MAC</option>
                          </select>
                        </td>
                        <td><input defaultValue={row.filter} /></td>
                        <td><input placeholder="ARP_ACL_NAME" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="checkbox-wrap" style={{marginTop:"10px"}}>
                  <input type="checkbox" defaultChecked />
                  <span>Log DAI violations to syslog</span>
                </div>
                <div className="checkbox-wrap">
                  <input type="checkbox" defaultChecked />
                  <span>Validate ARP source MAC, destination MAC, and IP</span>
                </div>
              </div>
            )}

            {/* ── MONITORING ── */}
            {activeVLANTab === "monitor" && (
              <div className="config-group-mono">
                <label>VLAN Monitoring & Statistics</label>
                <table className="acl-table">
                  <thead>
                    <tr>
                      <th>VLAN</th>
                      <th>Name</th>
                      <th>Active Ports</th>
                      <th>Traffic Load</th>
                      <th>MAC Count</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { id:"10", name:"SALES",  ports:"Fa0/1, Fa0/2", load:"42%", macs:"18", status:"ACTIVE",  color:"var(--color-text-success)" },
                      { id:"20", name:"VOICE",  ports:"Fa0/3",        load:"67%", macs:"6",  status:"ACTIVE",  color:"var(--color-text-success)" },
                      { id:"30", name:"MGMT",   ports:"Gi0/1",        load:"8%",  macs:"3",  status:"ACTIVE",  color:"var(--color-text-success)" },
                      { id:"99", name:"NATIVE", ports:"Gi0/1, Gi0/2", load:"12%", macs:"2",  status:"NATIVE",  color:"var(--color-text-warning)" },
                    ].map((row, i) => (
                      <tr key={i}>
                        <td><strong>{row.id}</strong></td>
                        <td>{row.name}</td>
                        <td style={{fontSize:"12px"}}>{row.ports}</td>
                        <td>{row.load}</td>
                        <td>{row.macs}</td>
                        <td style={{color:row.color, fontWeight:600}}>{row.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <label style={{marginTop:"16px"}}>SPAN / RSPAN Session</label>
                <div className="inline-fields">
                  <div className="input-wrap">
                    <span>SPAN Source Port</span>
                    <input value={spanSource} onChange={e => setSpanSource(e.target.value)} placeholder="Fa0/1" />
                  </div>
                  <div className="input-wrap">
                    <span>SPAN Destination Port</span>
                    <input value={spanDest} onChange={e => setSpanDest(e.target.value)} placeholder="Fa0/24" />
                  </div>
                  <div className="input-wrap">
                    <span>Direction</span>
                    <select><option>Both</option><option>Rx Only</option><option>Tx Only</option></select>
                  </div>
                </div>
                <div className="checkbox-wrap" style={{marginTop:"8px"}}>
                  <input type="checkbox" defaultChecked />
                  <span>Enable SPAN session</span>
                </div>
              </div>
            )}

          </div>

          <div className="modal-footer-clean">
            <button className="btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn-primary" onClick={handleApply}>Apply VLAN Config</button>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
}