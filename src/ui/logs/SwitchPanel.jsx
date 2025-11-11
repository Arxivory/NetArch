import React from "react";

const SwitchPanel = ({ activeTab, setActiveTab }) => {
  return (
    <div className="flex space-x-4 px-4 py-2">
      <button
     
        onClick={() => setActiveTab("console")}
        className={`px-3 py-2 rounded-t-md font-semibold transition-colors ${
      
          activeTab === "console"
            ? "bg-gray-200 text-black-600 border-b-2 border-gray-600"
            : "text-gray-600 hover:text-gray-500"
        }`}
      >
        Console 
      </button>
      <button
        onClick={() => setActiveTab("simulation")}
        className={`px-1 py-2 rounded-t-md font-semibold transition-colors ${
          activeTab === "simulation"
            ? "bg-gray-200 text-black-600 border-b-2 border-gray-600"
            : "text-gray-600 hover:text-gray-500"
        }`}
      >
        Simulation
      </button>
    </div>
  );
};

export default SwitchPanel;