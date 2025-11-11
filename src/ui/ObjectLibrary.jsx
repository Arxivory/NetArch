import { Server } from "lucide-react"; 


const categoryDetails = {
  Routers: {
    name: "Router", 
  },
  Switches: {
    name: "Switch", 
  },
  Hubs: {
    name: "Hub", 
  }, 
  Wireless: {
    name: "Wireless",
  },
  "End Devices": {
    name : "End Device",
  },
  Furniture: {
    name: "Furniture",
  }
}


const categories = Object.keys(categoryDetails);

export default function ObjectLibrary() {
  return (
    <div className="object-library">
      <h3 className="panel-header">Object Library</h3>
      <hr className="header-separator"/>

      {}
      {categories.map((cat) => { 

        const { name } = categoryDetails[cat];

        return (
          <div key={cat} className="mb-3">
            <p className="text-gray-600 font-medium">{cat}</p>
            <div className="device-grid">
              {Array(6)
                .fill(null)
                .map((_, i) => (
                  <div key={i} className="device-tile">
                    <div className="device-icon mb-1">
                      <Server size={32}/>
                    </div>

                  
                    <p className="device-type">

                      {name}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}