import { Server } from "lucide-react";

export default function ObjectLibrary() {
  const categories = ["Routers", "Switches", "Hubs", "Wireless"];
  return (
    <div className="object-library">
      <h3 className="panel-header">Object Library</h3>
      <hr className="header-separator"/>
      {categories.map((cat) => (
        <div key={cat} className="mb-3">
          <p className="text-gray-600 font-medium">{cat}</p>
          <div className="device-grid">
            {Array(4)
              .fill(null)
              .map((_, i) => (
                <div
                  key={i}
                  className="device-tile"
                >
                  <div 
                  className="device-icon mb-1"
                  >
                    <Server size={32}/>
                  </div>
                    

                  <p 
                  className="device-type"
                  >
                    Sample Device
                  </p>
                  
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}