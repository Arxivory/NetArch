import { Trash2, BrushCleaning, FunnelPlus, X } from "lucide-react";
import { useState, useMemo } from "react";

export default function SimulationPanel() {
  const [logData, setLogData] = useState([
    { device: "Switch", deviceName: "Sw-3", message: "Interface Vlan 1 state is set to up", time: "2:34PM", date: "9/20/25", location: "Room 102" },
    { device: "Switch", deviceName: "Sw-4", message: "Added password for line console 0", time: "2:40PM", date: "9/20/25", location: "Room 801" },
    { device: "Switch", deviceName: "Sw-Core-01", message: "%SYS-5-CONFIG_I: Configured from console by admin", time: "02:58AM", date: "9/20/25", location: "Server Room" },
    { device: "Router", deviceName: "R-2", message: "Interface GigabitEthernet0/1, changed state to down", time: "3:15PM", date: "9/21/25", location: "Room 305" },
    { device: "Router", deviceName: "R-5", message: "Interface GigabitEthernet0/2, changed state to up", time: "4:05PM", date: "9/21/25", location: "Room 305" },
    { device: "End Device", deviceName: "Laptop-1", message: "Connected to WiFi 'OfficeNet'", time: "8:20AM", date: "9/22/25", location: "Room 102" },
    { device: "End Device", deviceName: "Printer-3", message: "Paper jam detected in Tray 2", time: "11:45AM", date: "9/22/25", location: "Room 801" },
    { device: "Switch", deviceName: "Sw-2", message: "Port 5 disabled due to security violation", time: "1:30PM", date: "9/23/25", location: "Room 102" },
    { device: "Router", deviceName: "R-3", message: "OSPF adjacency with R-4 established", time: "9:10AM", date: "9/23/25", location: "Server Room" },
    { device: "End Device", deviceName: "Desktop-7", message: "Disconnected from network", time: "5:50PM", date: "9/23/25", location: "Room 305" },
    { device: "Switch", deviceName: "Sw-5", message: "Firmware updated to version 2.1.0", time: "3:25PM", date: "9/24/25", location: "Room 801" },
    { device: "Router", deviceName: "R-1", message: "CPU utilization exceeded 90%", time: "10:15AM", date: "9/24/25", location: "Server Room" },
    { device: "End Device", deviceName: "Tablet-4", message: "Battery low warning", time: "2:40PM", date: "9/24/25", location: "Room 102" },
    { device: "Switch", deviceName: "Sw-1", message: "Spanning tree topology change detected", time: "4:55PM", date: "9/25/25", location: "Room 305" },
    { device: "Router", deviceName: "R-4", message: "BGP session with ISP established", time: "11:30AM", date: "9/25/25", location: "Server Room" },
    { device: "End Device", deviceName: "Phone-2", message: "VoIP call dropped unexpectedly", time: "6:20PM", date: "9/25/25", location: "Room 801" },
    { device: "Switch", deviceName: "Sw-3", message: "Interface Vlan 1 state is set to down", time: "9:00AM", date: "9/26/25", location: "Room 102" },
    { device: "Router", deviceName: "R-2", message: "Interface GigabitEthernet0/1, changed state to up", time: "9:15AM", date: "9/26/25", location: "Room 305" },
    { device: "Router", deviceName: "R-2", message: "Interface GigabitEthernet0/1, changed state to up", time: "9:15AM", date: "9/26/25", location: "Room 305" },
    { device: "Router", deviceName: "R-2", message: "Interface GigabitEthernet0/1, changed state to up", time: "9:15AM", date: "9/26/25", location: "Room 305" },
    { device: "Router", deviceName: "R-2", message: "Interface GigabitEthernet0/1, changed state to up", time: "9:15AM", date: "9/26/25", location: "Room 305" },
    { device: "Router", deviceName: "R-2", message: "Interface GigabitEthernet0/1, changed state to up", time: "9:15AM", date: "9/26/25", location: "Room 305" },
    { device: "Router", deviceName: "R-2", message: "Interface GigabitEthernet0/1, changed state to up", time: "9:15AM", date: "9/26/25", location: "Room 305" },
    { device: "End Device", deviceName: "Laptop-1", message: "Disconnected from WiFi 'OfficeNet'", time: "5:00PM", date: "9/26/25", location: "Room 102" },
    { device: "Switch", deviceName: "Sw-Core-01", message: "%SYS-5-CONFIG_I: Configured from console by admin", time: "12:00PM", date: "9/26/25", location: "Server Room" },
    { device: "Router", deviceName: "R-5", message: "Interface GigabitEthernet0/2, changed state to down", time: "3:45PM", date: "9/26/25", location: "Room 305" },
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
  const deleteLog = (index) => setLogData(prev => prev.filter((_, i) => i !== index));

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
    <div className="console-panel flex flex-col h-full w-full overflow-hidden bg-white border border-gray-300">
      
      
      <div className="panel-header flex justify-between items-center h-7 px-3 bg-gray-50 border-b border-gray-300 flex-shrink-0 z-50">
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

      <div className="h-7 bg-gray-50 border-b border-gray-300 flex-shrink-0 z-30">
        <table className="w-full table-fixed">
          <thead>
            <tr className="text-gray-600">
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

      <div className="flex-1 bg-white overflow-y-auto">
        {(isTableEmpty || isFilterEmpty) ? (
          <div className="h-full flex flex-col items-center justify-center p-10">
            {isTableEmpty ? (
              <p className="text-gray-400 text-[13px] italic">No logs yet — start the project to see activity here.</p>
            ) : (
              <p className="text-gray-400 text-[12px] font-medium">No matches found</p>
            )}
          </div>
        ) : (
          <>
            <table className="w-full border-collapse table-fixed bg-white flex-shrink-0">
              <tbody>
                {filteredLogs.map((log, index) => (
                  <tr key={index} className="hover:bg-blue-50/50 h-9 transition-colors group border-top border-gray-100">
                    <td className="px-3 py-1 text-[11px] text-gray-700 truncate w-[12%]">{log.device}</td>
                    <td className="px-3 py-1 text-[11px] text-gray-700 truncate font-medium w-[15%]">{log.deviceName}</td>
                    <td className="px-3 py-1 text-[11px] text-gray-700 truncate italic w-[33%]">{highlightText(log.message, search)}</td>
                    <td className="px-4 py-1 text-[11px] text-gray-500 truncate w-[10%]">{log.time}</td>
                    <td className="px-4 py-1 text-[11px] text-gray-500 truncate w-[10%]">{log.date}</td>
                    <td className="px-4 py-1 text-[11px] text-gray-500 truncate w-[15%]">{log.location}</td>
                    <td className="px-4 py-1 text-center w-10">
                      <Trash2 className="text-gray-800 cursor-pointer inline-block transition-colors hover:text-gray-800" size={15} onClick={() => deleteLog(index)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex-1 bg-white"></div>
          </>
        )}
      </div>

    
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

      {showClearModal && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-[100]">
          <div className="bg-white rounded-lg p-5 w-80 shadow-2xl border border-gray-200">
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