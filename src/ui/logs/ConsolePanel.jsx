import { Trash2, BrushCleaning, FunnelPlus } from "lucide-react";
import '../../index.css'; 

export default function ConsolePanel() {
 
  const logs = [
    {
      device: "Switch",
      name: "Sw-3",
      message: "Interface Vlan 1 state is set to up",
      time: "2:34PM",
      date: "9/20/25",
      location: "Room 102",
    },
    {
      device: "Switch",
      name: "Sw-4",
      message: "Added password for line console 0",
      time: "2:40PM",
      date: "9/20/25",
      location: "Room 801",
    },
    {
      device: "Switch",
      name: "Sw-4",
      message: "Added password for line console 0",
      time: "2:40PM",
      date: "9/20/25",
      location: "Room 801",
    },
  ];

  return (
    <div className="console-panel">
      {}
      <div className="console-panel-header">
        <h3 className="panel-header-title">Logs</h3>
        <div className="console-panel-controls">
          <input
            type="text"
            placeholder="Search keywords"
            className="console-panel-input"
          />
          <button className="console-panel-btn">
            <BrushCleaning className="console-panel-icon" />
            <span>Clear</span>
          </button>
          <button className="console-panel-btn">
            <FunnelPlus className="console-panel-icon" />
            <span>Filter</span>
          </button>
        </div>
      </div>

      {}
      <div className="panel-table">
        <table className="console-panel-table">
          <thead>
            <tr>
              <th>Device</th>
              <th>Device Name</th>
              <th>Message</th>
              <th>Time</th>
              <th>Date</th>
              <th>Location</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log, i) => (
              <tr key={i}>
                <td>{log.device}</td>
                <td>{log.name}</td>
                <td>{log.message}</td>
                <td>{log.time}</td>
                <td>{log.date}</td>
                <td>{log.location}</td>
                <td className="console-panel-delete">
                  <Trash2 />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
