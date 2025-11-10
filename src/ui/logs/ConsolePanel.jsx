export default function ConsolePanel() {
  return (
    <div className="console-panel">
  <div className="flex justify-between items-center mb-1 bg-white sticky top-0 z-10 p-2">
    <h3 className="panel-header text-sm font-semibold">Logs</h3>
    <div className="flex items-center space-x-2 text-xs text-gray-600">
      <input
        type="text"
        placeholder="Search keywords"
        className="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-gray-400 w-32"
      />
      <button className="flex items-center space-x-2 text-xs text-black-600">
        <span>X</span>
        <span>Clear</span>
      </button>
      <button className="flex items-center space-x-2 text-xs text-black-600">
        <span>F</span>
        <span>Filter</span>
      </button>
    </div>
  </div>

  <div className="max-h-40 overflow-y-auto">
    <table className="w-full text-left border-collapse text-xs">
      <thead className="sticky top-0 z-10">
        <tr className="text-gray-600 bg-white-10">
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
        <tr className="bg-white-50 hover:bg-gray-100">
          <td className="px-3 py-2 pl-2 border-b border-gray-200">Switch</td>
          <td className="px-3 py-2 pl-2 border-b border-gray-200">Sw-3</td>
          <td className="px-3 py-2 pl-2 border-b border-gray-200">Interface Vlan 1 state is set to up</td>
          <td className="px-3 py-2 pl-2 border-b border-gray-200">2:34PM</td>
          <td className="px-3 py-2 pl-2 border-b border-gray-200">9/20/25</td>
          <td className="px-3 py-2 pl-2 border-b border-gray-200">Room 101</td>
          <td className="px-3 py-2 pl-2 border-b border-gray-200 text-center text-red-400 hover:text-red-600 cursor-pointer">
            🗑️
          </td>
        </tr>

        <tr className="bg-white-50 hover:bg-gray-100">
          <td className="px-3 py-2 pl-2 border-b border-gray-200">Switch</td>
          <td className="px-3 py-2 pl-2 border-b border-gray-200">Sw-4</td>
          <td className="px-3 py-2 pl-2 border-b border-gray-200">Added password for line console 0</td>
          <td className="px-3 py-2 pl-2 border-b border-gray-200">2:40PM</td>
          <td className="px-3 py-2 pl-2 border-b border-gray-200">9/20/25</td>
          <td className="px-3 py-2 pl-2 border-b border-gray-200">Room 101</td>
          <td className="px-3 py-2 pl-2 border-b border-gray-200 text-center text-red-400 hover:text-red-600 cursor-pointer">
            🗑️
          </td>
        </tr>

        <tr className="bg-white-50 hover:bg-gray-100">
          <td className="px-3 py-2 pl-2 border-b border-gray-200">Switch</td>
          <td className="px-3 py-2 pl-2 border-b border-gray-200">Sw-5</td>
          <td className="px-3 py-2 pl-2 border-b border-gray-200">Line console 0 accessed by PC-3</td>
          <td className="px-3 py-2 pl-2 border-b border-gray-200">2:45PM</td>
          <td className="px-3 py-2 pl-2 border-b border-gray-200">9/20/25</td>
          <td className="px-3 py-2 pl-2 border-b border-gray-200">Room 101</td>
          <td className="px-3 py-2 pl-2 border-b border-gray-200 text-center text-red-400 hover:text-red-600 cursor-pointer">
            🗑️
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
  );
}
