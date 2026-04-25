import { Trash2, BrushCleaning, FunnelPlus, X } from "lucide-react";
import { useState, useMemo, useEffect } from "react";

const EMPTY_FILTERS = {
  device: "",
  deviceName: "",
  location: "",
  date: "",
};

export default function ConsolePanel() {
  // logData starts empty to wait for system events or OSPF saves
  const [logData, setLogData] = useState([]);
  const [search, setSearch] = useState("");
  const [showClearModal, setShowClearModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [tempFilters, setTempFilters] = useState(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(EMPTY_FILTERS);

  // --- NEW: Custom Event Listener for OSPF and System Logs ---
  useEffect(() => {
    const handleNewLog = (event) => {
      const { device, deviceName, message, location } = event.detail;
      
      const newEntry = {
        id: Date.now(),
        device: device || "System",
        deviceName: deviceName || "Unknown",
        message: message || "No message provided",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: new Date().toLocaleDateString('en-GB'), // DD/MM/YYYY
        location: location || "Internal"
      };

      // Add new logs to the top of the array
      setLogData((prevLogs) => [newEntry, ...prevLogs]);
    };

    window.addEventListener("add-system-log", handleNewLog);
    return () => window.removeEventListener("add-system-log", handleNewLog);
  }, []);

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
  };
  const clearAllLogs = () => { setLogData([]); setShowClearModal(false); };
  const deleteLog = (id) => setLogData(prev => prev.filter(log => log.id !== id));

  const highlightText = (text, highlight) => {
    if (!highlight.trim()) return text;
    const parts = text.split(new RegExp(`(${highlight})`, "gi"));
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === highlight.toLowerCase() ? (
            <mark key={i} className="bg-blue-300 text-black rounded-sm px-0.5">{part}</mark>
          ) : ( part )
        )}
      </span>
    );
  };

  const isTableEmpty = logData.length === 0;
  const isFilterEmpty = logData.length > 0 && filteredLogs.length === 0;

  return (
    <div className="console-panel">
      {/* Header Controls */}
      <div className="console-panel-header">
        <h3 className="panel-header-title">Logs</h3>
        <div className="console-panel-controls">
          <input
            type="text" placeholder="Search message..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 h-5 text-[10px] w-40 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
          <button onClick={() => setShowClearModal(true)} className="console-panel-btn">
            <BrushCleaning size={12} className="console-panel-icon" />
            <span>Clear</span>
          </button>
          <button
            onClick={() => {
              setTempFilters(appliedFilters);
              setShowFilters(true);
            }}
            className="console-panel-btn"
          >
            <FunnelPlus size={12} className="console-panel-icon" />
            <span>Filter</span>
          </button>
        </div>
      </div>

      <div className="panel-content" style={{ overflow: 'hidden' }}>
        <div className="panel-table-wrapper" style={{ overflow: 'hidden' }}>
          
          {/* Static Header Table */}
          <table className="console-panel-table">
            <thead>
              <tr>
                <th className="col-device" style={{ width: '12%' }}>Device</th>
                <th className="col-name" style={{ width: '15%' }}>Name</th>
                <th className="col-msg" style={{ width: '33%' }}>Message</th>
                <th className="col-time" style={{ width: '10%' }}>Time</th>
                <th className="col-date" style={{ width: '10%' }}>Date</th>
                <th className="col-loc" style={{ width: '15%' }}>Location</th>
                <th className="col-action" style={{ width: '5%' }}></th>
              </tr>
            </thead>
          </table>

          {/* Scrollable Body Section */}
          <div style={{ overflowY: 'scroll', height: '400px', background: 'white' }}>
            {filteredLogs.length > 0 ? (
              <table className="console-panel-table">
                <tbody>
                  {filteredLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="col-device" style={{ width: '12%' }}>{log.device}</td>
                      <td className="col-name" style={{ width: '15%' }}>{log.deviceName}</td>
                      <td className="col-msg" style={{ width: '33%' }}>{highlightText(log.message, search)}</td>
                      <td className="col-time" style={{ width: '10%' }}>{log.time}</td>
                      <td className="col-date" style={{ width: '10%' }}>{log.date}</td>
                      <td className="col-loc" style={{ width: '15%' }}>{log.location}</td>
                      <td className="col-action" style={{ width: '5%' }}>
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
            ) : (
              <div className="empty-state-container" style={{ border: 'none', marginTop: '0', height: '100%' }}>
                {logData.length === 0 ? (
                  <div className="no-projects-message">
                    <p>No activity recorded — configure OSPF to see logs.</p>
                  </div>
                ) : (
                  <p className="no-results-message">No matches found for your search.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filter Modal */}
      {showFilters && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 backdrop-blur-[1px]">
          <div className="bg-white w-64 rounded-lg shadow-2xl border border-gray-200 p-4">
            <div className="flex justify-between items-center mb-3 text-[10px] font-bold text-gray-400 uppercase">
              <span>Filter Settings</span>
              <X className="cursor-pointer hover:text-black" size={16} onClick={() => setShowFilters(false)} />
            </div>
            <div className="modal-body">
              <input placeholder="Device" value={tempFilters.device} onChange={(e) => setTempFilters({ ...tempFilters, device: e.target.value })} />
              <input placeholder="Device Name" value={tempFilters.deviceName} onChange={(e) => setTempFilters({ ...tempFilters, deviceName: e.target.value })} />
              <input placeholder="Location" value={tempFilters.location} onChange={(e) => setTempFilters({ ...tempFilters, location: e.target.value })} />
              <input type="date" value={tempFilters.date} onChange={(e) => setTempFilters({ ...tempFilters, date: e.target.value })} />
            </div>
            <div className="modal-footer">
              <button className="btn-apply" onClick={handleApplyFilters}>Apply</button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Confirmation Modal */}
      {showClearModal && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-[100]">
          <div className="bg-white rounded-lg p-6 w-80 h-55 shadow-2xl border border-gray-200">
            <h4 className="font-bold text-gray-800 text-sm mb-1">Clear Logs</h4>
            <p className="text-gray-500 text-[11px] mb-5">This will delete all logs. Continue?</p>
            <div className="flex justify-end space-x-2">
              <button onClick={() => setShowClearModal(false)} className="px-4 py-1.5 border border-gray-200 rounded text-[11px] text-gray-600 hover:bg-gray-50 font-medium">Cancel</button>
              <button onClick={clearAllLogs} className="px-4 py-1.5 bg-gray-500 text-white rounded text-[11px] hover:bg-gray-500 font-medium transition-colors">Clear All</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}