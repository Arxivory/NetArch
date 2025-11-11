import React, { useState, useRef, useEffect } from "react";

import {
  Square,
  Triangle,
  LineSquiggle,
  Circle,
} from "lucide-react";

export default function StructuralOption({ label, icon: Icon, onSelectShape }) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  const shapes = [
    { name: "Rectangle", icon: Square },
    { name: "Polygon", icon: Triangle },
    { name: "Freeform", icon: LineSquiggle },
    { name: "Circular", icon: Circle },
  ];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        className="px-2 py-1 hover:bg-gray-100 rounded flex items-center gap-1 structural-btn"
        onClick={() => setOpen(!open)}
      >
        {Icon && <Icon size={16} />}
        {label}
      </button>

      {open && (
        <div className="structural-panel absolute z-100 mt-1 w-44 bg-white border border-gray-200 rounded shadow-lg">
          <div className="px-3 py-2 border-b text-xs font-semibold text-gray-600">
            Structure
          </div>
          {shapes.map(({ name, icon: ShapeIcon }) => (
            <button
              key={name}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 text-sm text-gray-700"
              onClick={() => {
                onSelectShape(name);
                setOpen(false);
              }}
            >
              <ShapeIcon size={16} strokeWidth={1.5} />
              {name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
