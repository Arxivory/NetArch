import React from "react";

const SwitchPanel = ({ activeTab, setActiveTab }) => {
  return (
    <div className="switch-panel">
      <button
     
        onClick={() => setActiveTab("console")}
        className={`log-button ${
      
          activeTab === "console"
            ? "active"
            : "log-button"
        }`}
      >
        Console 
      </button>
      <button
        onClick={() => setActiveTab("simulation")}
        className={`log-button ${
          activeTab === "simulation"
            ? "active"
            : "log-button"
        }`}
      >
        Simulation
      </button>
    </div>
  );
};

export default SwitchPanel;