import { Server, Import } from "lucide-react"; // <-- 1. Import the 'Import' icon

export default function ObjectLibrary() {
  const categories = ["Routers", "Switches", "Hubs", "Wireless"];
  return (
    <div className="object-library">
      
      {/* 2. Create a flex container to hold the title and button */}
      <div className="flex justify-between items-center">
        <h3 className="panel-header">Object Library</h3>

        {/* 3. Add the new Import button */}
        <button className="flex items-center px-2 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50">
          <Import size={16} className="mr-1.5" />
          <span>Import</span>
        </button>
      </div>

      <hr className="header-separator" />
      {categories.map((cat) => (
        <div key={cat} className="mb-3">
          <p className="text-gray-600 font-medium">{cat}</p>
          <div className="device-grid">
            {Array(6)
              .fill(null)
              .map((_, i) => (
                <div key={i} className="device-tile">
                  <div className="device-icon mb-1">
                    <Server size={32} />
                  </div>

                  <p className="device-type">Sample Device</p>
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}