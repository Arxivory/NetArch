import { Trash2, BrushCleaning, FunnelPlus, X } from "lucide-react";
import { useState, useMemo } from "react";

const INITIAL_LOGS = [
  { id: 1, device: "End Device", deviceName: "PC-1", message: "ICMP Echo Request sent to 192.168.1.254", time: "10:00AM", date: "10-01-25", location: "Lab A" },
  { id: 2, device: "Switch", deviceName: "Sw-1", message: "ARP request broadcasted on all ports (Vlan 10)", time: "10:00AM", date: "10-01-25", location: "Lab A" },
  { id: 3, device: "Router", deviceName: "R-1", message: "Packet routed via Fa0/0 to Next Hop 10.0.0.2", time: "10:01AM", date: "10-01-25", location: "Data Center" },
  { id: 4, device: "Server", deviceName: "SRV-Web", message: "TCP Three-way handshake established with Client-7", time: "10:05AM", date: "10-01-25", location: "Server Room" },
  { id: 5, device: "Router", deviceName: "R-Core", message: "DHCP Discover received from MAC 00:0A:95:9D:68:16", time: "10:12AM", date: "10-01-25", location: "Server Room" },
  { id: 6, device: "End Device", deviceName: "Laptop-5", message: "DNS Query for 'google.com' resolved to 8.8.8.8", time: "10:15AM", date: "10-01-25", location: "Room 202" },
  { id: 7, device: "Switch", deviceName: "Sw-3", message: "STP: Blocking port Gi0/1 to prevent loop", time: "11:20AM", date: "10-01-25", location: "Room 405" },
  { id: 8, device: "Router", deviceName: "R-2", message: "NAT translation: 192.168.1.5 -> 203.0.113.10", time: "11:45AM", date: "110-01-25", location: "Room 305" },
  { id: 9, device: "End Device", deviceName: "PC-3", message: "Ping timeout: Destination Host Unreachable", time: "1:10PM", date: "10-01-25", location: "Lab B" },
  { id: 10, device: "Switch", deviceName: "Sw-Core", message: "VTP: Domain 'Office' revision updated to 5", time: "2:30PM", date: "10-01-255", location: "Server Room" },
  { id: 11, device: "Router", deviceName: "R-Edge", message: "ACL Deny: Traffic from 172.16.0.4 dropped on Serial 0/0", time: "3:15PM", date: "10-01-25", location: "Entrance" },
  { id: 12, device: "End Device", deviceName: "Tablet-2", message: "Authentication successful via WPA2-Enterprise", time: "4:00PM", date: "10-01-25", location: "Lobby" },
  { id: 13, device: "Router", deviceName: "R-3", message: "RIPv2 update sent to neighbors on Se0/1/0", time: "9:05AM", date: "10-01-25", location: "Room 305" },
  { id: 14, device: "End Device", deviceName: "Printer-1", message: "SNMP trap sent: Toner low level (10%)", time: "11:30AM", date: "10-01-25", location: "Office 1" },
  { id: 15, device: "Switch", deviceName: "Sw-Dist-1", message: "EtherChannel group 1 state changed to UP", time: "1:45PM", date: "10-01-25", location: "IDF-1" },
  { id: 16, device: "Server", deviceName: "SRV-DB", message: "High CPU usage detected: 95% utilization", time: "3:00PM", date: "10-01-25", location: "Data Center" },
  { id: 17, device: "Router", deviceName: "R-4", message: "OSPF adjacency established with R-5 on Fa0/1", time: "4:20PM", date: "10-01-25", location: "Room 305" },
];

const EMPTY_FILTERS = {
  device: "",
  deviceName: "",
  location: "",
  date: "",
};

export default function ConsolePanel() {
  const [logData, setLogData] = useState(INITIAL_LOGS);
  const [search, setSearch] = useState("");
  const [showClearModal, setShowClearModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [tempFilters, setTempFilters] = useState(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(EMPTY_FILTERS);

  const filteredLogs = useMemo(() => {
    return logData.filter((log) => {
      const searchMatch = !search || log.message.toLowerCase().includes(search.toLowerCase());
      const deviceMatch = !appliedFilters.device || log.device.toLowerCase().includes(appliedFilters.device.toLowerCase());
      const deviceNameMatch = !appliedFilters.deviceName || log.deviceName.toLowerCase().includes(appliedFilters.deviceName.toLowerCase());
      const locationMatch = !appliedFilters.location || log.location.toLowerCase().includes(appliedFilters.location.toLowerCase());
      const dateMatch = !appliedFilters.date || log.date === appliedFilters.date;

      return searchMatch && deviceMatch && deviceNameMatch && locationMatch && dateMatch;
    });
  }, [logData, search, appliedFilters]);

  const handleApplyFilters = () => {
    setAppliedFilters(tempFilters);
    setShowFilters(false);
    setTempFilters(EMPTY_FILTERS);
  };

  const clearAllLogs = () => {
    setLogData([]);
    setShowClearModal(false);
  };

  const deleteLog = (id) => {
    setLogData((prev) => prev.filter((log) => log.id !== id));
  };

  const highlightText = (text, highlight) => {
    if (!highlight.trim()) return text;

    const parts = text.split(new RegExp(`(${highlight})`, "gi"));

    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === highlight.toLowerCase() ? (
            <mark key={i} className="highlight">{part}</mark>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  return (
    <div className="console-panel">
      <div className="console-panel-header">
        <h3 className="panel-header-title">Logs</h3>
        <div className="console-panel-controls">
          <input
            type="text"
            placeholder="Search message..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="console-panel-input"
          />

          <button onClick={() => setShowClearModal(true)} className="console-panel-btn">
            <BrushCleaning size={12} className="console-panel-icon" />
            <span>Clear</span>
          </button>

          <button
            onClick={() => {
              setTempFilters(EMPTY_FILTERS);
              setShowFilters(true);
            }}
            className="console-panel-btn"
          >
            <FunnelPlus size={12} className="console-panel-icon" />
            <span>Filter</span>
          </button>
        </div>
      </div>

      <div className="panel-content">
        <div className="panel-table-wrapper">
          <table className="console-panel-table">
            <thead>
              <tr>
                <th className="col-device">Device</th>
                <th className="col-name">Name</th>
                <th className="col-msg">Message</th>
                <th className="col-time">Time</th>
                <th className="col-date">Date</th>
                <th className="col-loc">Location</th>
                <th className="col-action"></th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id}>
                  <td className="col-device">{log.device}</td>
                  <td className="col-name">{log.deviceName}</td>
                  <td className="col-msg">{highlightText(log.message, search)}</td>
                  <td className="col-time">{log.time}</td>
                  <td className="col-date">{log.date}</td>
                  <td className="col-loc">{log.location}</td>
                  <td className="col-action">
                    <Trash2
                      className="console-panel-delete"
                      size={15}
                      onClick={() => deleteLog(log.id)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {(logData.length === 0 || (logData.length > 0 && filteredLogs.length === 0)) && (
          <div className="empty-state">
            {logData.length === 0
              ? "No logs yet — start the project to see activity here."
              : "No matches found"}
          </div>
        )}
      </div>

      {showFilters && (
        <div className="modal-overlay">
          <div className="modal-container filter-modal">
            <div className="modal-header">
              <span>Filter Settings</span>
              <X className="modal-close" size={16} onClick={() => setShowFilters(false)} />
            </div>

            <div className="modal-body">
              <input
                placeholder="Device"
                value={tempFilters.device}
                onChange={(e) => setTempFilters({ ...tempFilters, device: e.target.value })}
              />
              <input
                placeholder="Device Name"
                value={tempFilters.deviceName}
                onChange={(e) => setTempFilters({ ...tempFilters, deviceName: e.target.value })}
              />
              <input
                placeholder="Location"
                value={tempFilters.location}
                onChange={(e) => setTempFilters({ ...tempFilters, location: e.target.value })}
              />
              <input
                type="date"
                value={tempFilters.date}
                onChange={(e) => setTempFilters({ ...tempFilters, date: e.target.value })}
              />
            </div>

            <div className="modal-footer">
              <button className="btn-apply" onClick={handleApplyFilters}>Apply</button>
            </div>
          </div>
        </div>
      )}

      {showClearModal && (
        <div className="modal-overlay">
          <div className="modal-container clear-modal">
            <h4 className="modal-title">Clear Logs</h4>
            <p className="modal-text">This will delete all logs. Continue?</p>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowClearModal(false)}>Cancel</button>
              <button className="btn-confirm" onClick={clearAllLogs}>Clear All</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}