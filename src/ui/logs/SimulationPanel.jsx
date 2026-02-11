import { Trash2, BrushCleaning, FunnelPlus, X, SearchX } from "lucide-react";
import { useState, useMemo, useEffect } from "react";

export default function SimulationPanel() {
  const [logData, setLogData] = useState([]);
  const [search, setSearch] = useState("");
  const [showClearModal, setShowClearModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showNoMatchModal, setShowNoMatchModal] = useState(false);
  const [hasAppliedFilter, setHasAppliedFilter] = useState(false); 
  
  const [filters, setFilters] = useState({
    device: "",
    deviceName: "",
    location: "",
    date: "",
  });

  
  const visibleLogs = useMemo(() => {
    return logData.filter((log) => {
      const searchMatch = !search || [log.device, log.deviceName, log.message, log.time, log.date, log.location]
          .join(" ").toLowerCase().includes(search.toLowerCase());
      const deviceMatch = !filters.device || log.device.toLowerCase().includes(filters.device.toLowerCase());
      const deviceNameMatch = !filters.deviceName || log.deviceName.toLowerCase().includes(filters.deviceName.toLowerCase());
      const locationMatch = !filters.location || log.location.toLowerCase().includes(filters.location.toLowerCase());
      const dateMatch = !filters.date || log.date === filters.date;
      return searchMatch && deviceMatch && deviceNameMatch && locationMatch && dateMatch;
    });
  }, [logData, search, filters]);

  
  useEffect(() => {
    if (hasAppliedFilter) {
      if (visibleLogs.length === 0) {
        setShowNoMatchModal(true);
      }
      setHasAppliedFilter(false); 
    }
  }, [hasAppliedFilter, visibleLogs]);

  
  useEffect(() => {
    if (showNoMatchModal) {
      const timer = setTimeout(() => setShowNoMatchModal(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [showNoMatchModal]);

  const handleApplyFilters = () => {
    setShowFilters(false);
    setHasAppliedFilter(true); 
  };

  const clearAllLogs = () => {
    setLogData([]);
    setShowClearModal(false);
  };

  const deleteLog = (index) => {
    setLogData(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="simulation-panel flex flex-col h-full w-full overflow-hidden bg-white relative">
      
     
      <div className="panel-header flex justify-between items-center bg-gray-100 h-10 px-3 border-b border-gray-300 flex-shrink-0">
        <h3 className="panel-header-title font-bold text-gray-700">Logs</h3>

        <div className="flex items-center space-x-2 text-gray-600">
          
          <input
            type="text"
            placeholder="Search keyword"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-300 rounded px-3 h-7 text-xs w-36 bg-white placeholder-gray-400 shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-400 mx-2"
          />

          <button 
            onClick={() => setShowClearModal(true)}
            className="flex items-center space-x-1.5 text-black hover:opacity-70 transition-opacity"
          >
             <span><BrushCleaning className="brush-cleaning" size={14} /></span>
            <span>Clear</span>
          </button>

          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-1.5 text-black hover:opacity-70 transition-opacity"
          >
            <span><FunnelPlus className="funnel-plus" size={14} /></span>
            <span>Filter</span>
          </button>
        </div>
      </div>

      
      <div className="panel-table flex-1 overflow-auto">
        <table className="simulation-panel-table w-full border-collapse">
          <thead className="sticky top-0 z-10 bg-gray-100">
            <tr className="text-gray-600 border-b border-black-300">
              <th className="px-3 py-2 font-normal text-left">Device</th>
              <th className="px-3 py-2 font-normal text-left">Device Name</th>
              <th className="px-3 py-2 font-normal text-left">Message</th>
              <th className="px-3 py-2 font-normal text-left">Time</th>
              <th className="px-3 py-2 font-normal text-left">Date</th>
              <th className="px-3 py-2 font-normal text-left">Location</th>
              <th className="px-3 py-2 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {visibleLogs.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-3 py-10 text-center text-gray-500">
                  <p className="text-sm font-light">No logs yet — start the project to see activity here.</p>
                </td>
              </tr>
            ) : (
              visibleLogs.map((log, index) => (
                <tr key={index} className="bg-white hover:bg-gray-50 border-b border-gray-100 transition-colors">
                  <td className="px-3 py-2 text-xs">{log.device}</td>
                  <td className="px-3 py-2 text-xs">{log.deviceName}</td>
                  <td className="px-3 py-2 text-xs">{log.message}</td>
                  <td className="px-3 py-2 text-xs">{log.time}</td>
                  <td className="px-3 py-2 text-xs">{log.date}</td>
                  <td className="px-3 py-2 text-xs">{log.location}</td>
                  <td className="px-3 py-2 text-center">
                    <Trash2 className="text-red-400 hover:text-red-600 cursor-pointer" size={18} onClick={() => deleteLog(index)} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

     
      {showFilters && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/20">
          <div className="bg-white w-72 rounded-lg shadow-xl border border-gray-200 p-4 animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold text-gray-500 uppercase">Filter Logs</span>
              <X className="cursor-pointer text-gray-400" size={16} onClick={() => setShowFilters(false)} />
            </div>
            <div className="space-y-2">
              <input placeholder="Device" value={filters.device} onChange={(e) => setFilters({ ...filters, device: e.target.value })} className="w-full border border-gray-300 rounded px-2 py-1 text-xs outline-none" />
              <input placeholder="Device Name" value={filters.deviceName} onChange={(e) => setFilters({ ...filters, deviceName: e.target.value })} className="w-full border border-gray-300 rounded px-2 py-1 text-xs outline-none" />
              <input placeholder="Location" value={filters.location} onChange={(e) => setFilters({ ...filters, location: e.target.value })} className="w-full border border-gray-300 rounded px-2 py-1 text-xs outline-none" />
              <input type="date" value={filters.date} onChange={(e) => setFilters({ ...filters, date: e.target.value })} className="w-full border border-gray-300 rounded px-2 py-1 text-xs outline-none" />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setFilters({device: "", deviceName: "", location: "", date: ""})} className="text-[10px] text-gray-400 hover:text-gray-600 px-2">Reset</button>
              <button onClick={handleApplyFilters} className="bg-black text-white px-4 py-1 rounded text-xs hover:bg-gray-800 transition-colors">Apply</button>
            </div>
          </div>
        </div>
      )}

     
      {showNoMatchModal && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/10">
          <div className="bg-white w-64 rounded-lg shadow-2xl border border-gray-200 p-6 text-center animate-in zoom-in-95 duration-150">
            <div className="flex justify-center mb-3 text-gray-400"><SearchX size={32} /></div>
            <h4 className="text-sm font-bold text-gray-800 mb-1">No match found</h4>
          </div>
        </div>
      )}

     
      {showClearModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[120]">
          <div className="bg-white rounded p-5 w-80 shadow-2xl border border-gray-200">
            <h4 className="font-semibold text-gray-800 mb-4">Clear Logs</h4>
            <p className="text-gray-600 mb-6 text-sm">Are you sure you want to clear all simulation logs?</p>
            <div className="flex justify-end space-x-2">
              <button onClick={() => setShowClearModal(false)} className="px-3 py-1 border rounded text-xs">Cancel</button>
              <button onClick={clearAllLogs} className="px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600">Clear All</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}