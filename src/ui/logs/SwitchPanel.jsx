import React from "react";

const SwitchPanel = ({ activeTab, setActiveTab }) => {
  return (
    <div className="flex space-x-4 px-4 py-2">
      <button
        onClick={() => setActiveTab("devices")}
        className={`px-4 py-2 rounded-t-md font-semibold transition-colors ${
          activeTab === "devices"
            ? "bg-gray-200 text-blue-600 border-b-2 border-blue-600"
            : "text-gray-600 hover:text-blue-500"
        }`}
      >
        Devices
      </button>
      <button
        onClick={() => setActiveTab("simulation")}
        className={`px-4 py-2 rounded-t-md font-semibold transition-colors ${
          activeTab === "simulation"
            ? "bg-gray-200 text-blue-600 border-b-2 border-blue-600"
            : "text-gray-600 hover:text-blue-500"
        }`}
      >
        Simulation
      </button>
    </div>
  );
};

export default SwitchPanel;
