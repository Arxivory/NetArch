import { Trash2, BrushCleaning, FunnelPlus } from "lucide-react";

export default function SimulationPanel() {
  return (
    
    
    <div className="simulation-panel">
      <div className="panel-header flex justify-between items-center bg-gray-100 sticky top-0 z-10 my-2 p-2 border-b border-gray-300">
        <h3 className="panel-header-title">Logs</h3>
        <div className="flex items-center space-x-2  text-gray-600">
          <input
            type="text"
            placeholder="Search keywords"
            className="border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-gray-400 w-32"
          />
          <button className="flex items-center space-x-2 py-2 text-black-600">
             <span><BrushCleaning className="brush-cleaning"/></span>
            <span>Clear</span>
          </button>
          <button className="flex items-center space-x-2  text-black-600">
            <span><FunnelPlus className="funnel-plus"/></span>
            <span>Filter</span>
          </button>
        </div>
      </div>

     
      <div className="panel-table">
        <table className="simulation-panel-table">
          <thead className="sticky top-0 z-10">
            <tr className="text-gray-600 bg-gray-100">
              <th className="px-3 py-2 font-normal">Device</th>
              <th className="px-3 py-2 font-normal">Device Name</th>
              <th className="px-3 py-2 font-normal">Message</th>
              <th className="px-3 py-2 font-normal">Time</th>
              <th className="px-3 py-2 font-normal">Date</th>
              <th className="px-3 py-2 font-normal">Location</th>
              <th className="px-3 py-2 font-normal"></th>
            </tr>
          </thead>
          <tbody>
            <tr className="bg-white hover:bg-gray-50">
              <td className="px-3 py-2 pl-2 border-b border-gray-200">Switch</td>
              <td className="px-3 py-2 pl-2 border-b border-gray-200">Sw-3</td>
              <td className="px-3 py-2 pl-2 border-b border-gray-200">Interface Vlan 1 state is set to up</td>
              <td className="px-3 py-2 pl-2 border-b border-gray-200">2:34PM</td>
              <td className="px-3 py-2 pl-2 border-b border-gray-200">9/20/25</td>
              <td className="px-3 py-2 pl-2 border-b border-gray-200">Room 102</td>
              <td className="px-3 py-2 pl-2 border-b border-gray-200 text-center text-red-400 hover:text-red-600 cursor-pointer">
                <Trash2 className="delete-log" />
              </td>
            </tr>

            <tr className="bg-white hover:bg-gray-50">
              <td className="px-3 py-2 pl-2 border-b border-gray-200">Switch</td>
              <td className="px-3 py-2 pl-2 border-b border-gray-200">Sw-4</td>
              <td className="px-3 py-2 pl-2 border-b border-gray-200">Added password for line console 0</td>
              <td className="px-3 py-2 pl-2 border-b border-gray-200">2:40PM</td>
              <td className="px-3 py-2 pl-2 border-b border-gray-200">9/20/25</td>
              <td className="px-3 py-2 pl-2 border-b border-gray-200">Room 101</td>
              <td className="px-3 py-2 pl-2 border-b border-gray-200 text-center text-red-400 hover:text-red-600 cursor-pointer">
                <Trash2 className="delete-log" />
              </td>
            </tr>

            <tr className="bg-white hover:bg-gray-50">
              <td className="px-3 py-2 pl-2 border-b border-gray-200">Switch</td>
              <td className="px-3 py-2 pl-2 border-b border-gray-200">Sw-4</td>
              <td className="px-3 py-2 pl-2 border-b border-gray-200">Added password for line console 0</td>
              <td className="px-3 py-2 pl-2 border-b border-gray-200">2:40PM</td>
              <td className="px-3 py-2 pl-2 border-b border-gray-200">9/20/25</td>
              <td className="px-3 py-2 pl-2 border-b border-gray-200">Room 101</td>
              <td className="px-3 py-2 pl-2 border-b border-gray-200 text-center text-red-400 hover:text-red-600 cursor-pointer">
                <Trash2 className="delete-log" />
              </td>
            </tr>
          
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