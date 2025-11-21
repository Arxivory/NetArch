import { useState } from "react";
import { CheckSquare, Square } from "lucide-react";

export default function Topbar({ panels = {}, togglePanel = () => {} }) {
  const [open, setOpen] = useState(null);

  const menuData = {
    File: ["New", "Open", "Save", "Import", "Export"],

    Edit: ["Undo", "Redo"],

    Options: ["Customize Keybindings", "Preferences", "Settings"],

    View: [
      {
        label: "Zoom",
        children: ["Zoom In", "Zoom Out", "Reset Zoom"]
      },
      {
        label: "Show Toolbar and Panels",
        children: [
          { key: "fullScreen", label: "Full Screen", checkbox: true },
          { key: "toolbar", label: "Toolbar", checkbox: true },
          { key: "ObjectLibrary", label: "Object Library", checkbox: true },
          { key: "ConsoleSimulationLogs", label: "Console & Simulation Logs", checkbox: true },
          { key: "SidePanel", label: "Hierarchy and Properties Panel", checkbox: true }
        ]
      },
      "Simulation Mode",
      "Logical View",
      "Physical View"
    ],

    Help: [
      { type: "input", placeholder: "Search tools" },
      "Documentation",
      "Tutorials",
      "About NetArch"
    ]
  };

  const renderDropdown = (menuName) => {
    const items = menuData[menuName];

    return (
      <div
        className="absolute left-0 top-full mt-1 bg-white border border-gray-200 shadow-md rounded-sm 
                   z-[9999] min-w-[220px]"
        onMouseEnter={() => setOpen(menuName)}
        onMouseLeave={() => setOpen(null)}
      >
        {items.map((it, i) => {

          if (it.type === "input") {
            return (
              <div key={i} className="px-3 py-2">
                <input
                  type="text"
                  placeholder={it.placeholder}
                  className="border border-gray-300 rounded px-2 py-1 w-full
                             focus:outline-none focus:ring-1 focus:ring-gray-400"
                />
              </div>
            );
          }

          if (typeof it === "object" && it.children) {
            return (
              <div key={i} className="group relative">
                <div className="px-3 py-2 hover:bg-gray-100 flex justify-between items-center cursor-pointer">
                  <span>{it.label}</span>
                  <span className="text-sm">›</span>
                </div>

                <div className="absolute left-full top-0 hidden group-hover:block bg-white 
                                border border-gray-200 rounded-sm shadow-sm min-w-[200px] z-[9999]">
                  {it.children.map((sub, j) => {
                    if (sub.checkbox) {
                      const checked = !!panels[sub.key];
                      return (
                        <div
                          key={j}
                          className="px-3 py-2 hover:bg-gray-100 flex items-center gap-2 cursor-pointer"
                          onClick={() => togglePanel(sub.key)}
                        >
                          {checked ? <CheckSquare size={16} /> : <Square size={16} />}
                          {sub.label}
                        </div>
                      );
                    }

                    return (
                      <div key={j} className="px-3 py-2 hover:bg-gray-100 cursor-pointer">
                        {sub}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          }

          return (
            <div
              key={i}
              className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
              onClick={() => setOpen(null)}
            >
              {it}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="topbar relative bg-white border-b border-gray-200 select-none z-[50]">
      <div className="flex items-center h-12 px-3 gap-2">

        {Object.keys(menuData).map((m) => (
          <div key={m} className="relative">
            <button
              className="px-3 py-1 text-sm hover:bg-gray-100 rounded-sm"
              onMouseEnter={() => setOpen(m)}
            >
              {m}
            </button>

            {open === m && renderDropdown(m)}
          </div>
        ))}

      </div>
    </div>
  );
}
