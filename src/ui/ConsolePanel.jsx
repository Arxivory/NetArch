export default function ConsolePanel() {
  return (
    <div className="console-panel">
      <h3 className="font-semibold p-2 border-b border-gray-300">Console</h3>
      <table className="w-full text-left border-collapse text-[11px]">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-2 py-1 border-b">Device</th>
            <th className="px-2 py-1 border-b">Message</th>
            <th className="px-2 py-1 border-b">Time</th>
            <th className="px-2 py-1 border-b">Date</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="px-2 py-1 border-b">Switch</td>
            <td className="px-2 py-1 border-b">Interface Vlan1 is up</td>
            <td className="px-2 py-1 border-b">2:34PM</td>
            <td className="px-2 py-1 border-b">9/20/25</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
