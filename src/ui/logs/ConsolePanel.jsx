import { Trash2, BrushCleaning, FunnelPlus, X } from "lucide-react";
import { useState, useMemo } from "react";

export default function ConsolePanel() {
  const [logData, setLogData] = useState([
    { id: 1, device: "Switch", deviceName: "Sw-3", message: "Interface Vlan 1 state is set to up", time: "2:34PM", date: "9/20/25", location: "Room 102" },
    { id: 2, device: "Switch", deviceName: "Sw-4", message: "Added password for line console 0", time: "2:40PM", date: "9/20/25", location: "Room 801" },
    { id: 3, device: "Switch", deviceName: "Sw-Core-01", message: "%SYS-5-CONFIG_I: Configured from console by admin", time: "02:58AM", date: "9/20/25", location: "Server Room" },
    { id: 4, device: "Router", deviceName: "R-2", message: "Interface GigabitEthernet0/1, changed state to down", time: "3:15PM", date: "9/21/25", location: "Room 305" },
    { id: 5, device: "Router", deviceName: "R-5", message: "Interface GigabitEthernet0/2, changed state to up", time: "4:05PM", date: "9/21/25", location: "Room 305" },
    { id: 6, device: "End Device", deviceName: "Laptop-1", message: "Connected to WiFi 'OfficeNet'", time: "8:20AM", date: "9/22/25", location: "Room 102" },
    { id: 7, device: "End Device", deviceName: "Printer-3", message: "Paper jam detected in Tray 2", time: "11:45AM", date: "9/22/25", location: "Room 801" },
    { id: 8, device: "Switch", deviceName: "Sw-2", message: "Port 5 disabled due to security violation", time: "1:30PM", date: "9/23/25", location: "Room 102" },
    { id: 9, device: "Router", deviceName: "R-3", message: "OSPF adjacency with R-4 established", time: "9:10AM", date: "9/23/25", location: "Server Room" },
    { id: 10, device: "End Device", deviceName: "Desktop-7", message: "Disconnected from network", time: "5:50PM", date: "9/23/25", location: "Room 305" },
  ]);

  const [search, setSearch] = useState("");
  const [showClearModal, setShowClearModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [tempFilters, setTempFilters] = useState({ device: "", deviceName: "", location: "", date: "" });
  const [appliedFilters, setAppliedFilters] = useState({ device: "", deviceName: "", location: "", date: "" });

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

  const handleApplyFilters = () => { setAppliedFilters(tempFilters); setShowFilters(false); };
  const handleResetFilters = () => {
    const empty = { device: "", deviceName: "", location: "", date: "" };
    setTempFilters(empty);
    setAppliedFilters(empty);
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
    <div className="console-panel flex flex-col h-full w-full bg-white border border-gray-300">
      
      {/* Header */}
      <div className="panel-header flex justify-between items-center h-7 px-3 bg-gray-50 border-b border-gray-300 flex-shrink-0">
        <h3 className="font-bold text-gray-700 text-sm">Logs</h3>
        <div className="flex items-center space-x-2">
          <input
            type="text" placeholder="Search message..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 h-5 text-[10px] w-40 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
          <button onClick={() => setShowClearModal(true)} className="flex items-center space-x-1 p-1 text-black hover:bg-gray-200 rounded transition-colors">
            <BrushCleaning size={12} /> <span className="text-[11px] font-medium">Clear</span>
          </button>
          <button onClick={() => setShowFilters(true)} className="flex items-center space-x-1 p-1 text-black hover:bg-gray-200 rounded transition-colors">
            <FunnelPlus size={12} /> <span className="text-[11px] font-medium">Filter</span>
          </button>
        </div>
      </div>

      {/* Table Header */}
      <div className="bg-gray-50 border-b border-gray-300 flex-shrink-0">
        <table className="w-full table-fixed">
          <thead>
            <tr className="text-gray-600 h-7">
              <th className="px-3 py-1 font-bold text-left text-[10px] w-[12%]">Device</th>
              <th className="px-3 py-1 font-bold text-left text-[10px] w-[15%]">Name</th>
              <th className="px-2 py-1 font-bold text-left text-[10px] w-[33%]">Message</th>
              <th className="px-2 py-1 font-bold text-left text-[10px] w-[10%]">Time</th>
              <th className="px-2 py-1 font-bold text-left text-[10px] w-[10%]">Date</th>
              <th className="px-2 py-1 font-bold text-left text-[10px] w-[15%]">Location</th>
              <th className="w-10"></th>
            </tr>
          </thead>
        </table>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-white min-h-0 flex flex-col">
        {(isTableEmpty || isFilterEmpty) ? (
          <div className="flex-1 flex flex-col items-center justify-center p-10">
            <p className="text-gray-400 text-[12px] font-medium">
              {isTableEmpty ? "No logs yet — start the project to see activity here." : "No matches found"}
            </p>
          </div>
        ) : (
          <div className="flex-1">
            <table className="w-full border-collapse table-fixed bg-white">
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-blue-50/50 h-9 transition-colors group border-b border-gray-100">
                    <td className="px-3 py-1 text-[11px] text-gray-700 truncate w-[12%]">{log.device}</td>
                    <td className="px-3 py-1 text-[11px] text-gray-700 truncate font-medium w-[15%]">{log.deviceName}</td>
                    <td className="px-3 py-1 text-[11px] text-gray-700 truncate italic w-[33%]">{highlightText(log.message, search)}</td>
                    <td className="px-4 py-1 text-[11px] text-gray-500 truncate w-[10%]">{log.time}</td>
                    <td className="px-4 py-1 text-[11px] text-gray-500 truncate w-[10%]">{log.date}</td>
                    <td className="px-4 py-1 text-[11px] text-gray-500 truncate w-[15%]">{log.location}</td>
                    <td className="px-4 py-1 text-center w-10">
                      <Trash2 
                        className="text-gray-300 cursor-pointer inline-block transition-colors hover:text-red-500" 
                        size={14} 
                        onClick={() => deleteLog(log.id)} 
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Filter Modal */}
      {showFilters && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 backdrop-blur-[1px]">
          <div className="bg-white w-64 rounded-lg shadow-2xl border border-gray-200 p-4">
            <div className="flex justify-between items-center mb-3 text-[10px] font-bold text-gray-400 uppercase">
              <span>Filter Settings</span>
              <X className="cursor-pointer hover:text-black" size={16} onClick={() => setShowFilters(false)} />
            </div>
            <div className="space-y-2">
              <input placeholder="Device" value={tempFilters.device} onChange={(e) => setTempFilters({ ...tempFilters, device: e.target.value })} className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs outline-none focus:border-blue-400" />
              <input placeholder="Device Name" value={tempFilters.deviceName} onChange={(e) => setTempFilters({ ...tempFilters, deviceName: e.target.value })} className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs outline-none focus:border-blue-400" />
              <input placeholder="Location" value={tempFilters.location} onChange={(e) => setTempFilters({ ...tempFilters, location: e.target.value })} className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs outline-none focus:border-blue-400" />
              <input type="date" value={tempFilters.date} onChange={(e) => setTempFilters({ ...tempFilters, date: e.target.value })} className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs outline-none text-gray-500" />
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={handleResetFilters} className="text-[11px] text-gray-400 hover:text-gray-600">Reset</button>
              <button onClick={handleApplyFilters} className="bg-gray-600 text-white px-4 py-1.5 rounded text-[11px] hover:bg-gray-600 transition-all">Apply</button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Modal */}
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