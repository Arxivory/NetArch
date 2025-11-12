import { Server, Network, Router, Database, Cable, Wifi, Armchair, Import } from "lucide-react";


const categoryDetails = {
  Routers: {
    name: "Router",
    icon: Router, // lucide Router icon
  },
  Switches: {
    name: "Switch",
    icon: Server, // Network works well for switches
  },
  Hubs: {
    name: "Hub",
    icon: Database, // Database can represent hub/server rack
  },
  Cables: {
    name: "Cable",
    icon: Cable
    ,},

  Wireless: {
    name: "Wireless",
    icon: Wifi,
  },
  Furniture: {
    name: "Furniture",
    icon: Armchair, // use Armchair (exists) instead of Chair
  },
};

const categories = Object.keys(categoryDetails);

// export default function ObjectLibrary() {
//   return (
//     <div className="object-library">
//       <div className="flex justify-between items-center">
//         <h3 className="panel-header">Object Library</h3>

//         {/* Using the custom class from our previous step */}
//         <button className="import-btn">
//           <Import size={16} />
//           <span>Import</span>
//         </button>
//       </div>

//       <hr className="header-separator" />
//       {categories.map((cat) => (
//         <div key={cat} className="mb-3">
//           <p className="text-gray-600 font-medium">{cat}</p>
//           <div className="device-grid">
//             {Array(6)
//               .fill(null)
//               .map((_, i) => (
//                 <div key={i} className="device-tile">
//                   <div className="device-icon mb-1">
//                     <Server size={32} />
//                   </div>

//                   {/* 3. LOGIC FIX: 
//                     This now uses your `categoryDetails` object 
//                     to show the correct name. 
//                   */}
//                   <p className="device-type">{categoryDetails[cat].name}</p>
//                 </div>
//               ))}
//           </div>
//         </div>
//         // 2. FIXED: Removed the semicolon (`;`) that was here.
//       ))}
//     </div>
//   );
// } 

export default function ObjectLibrary() {
  return (
    <div className="object-library">
      <div className="flex justify-between items-center">
        <h3 className="panel-header">Object Library</h3>

        {/* Using the custom class from our previous step */}
        <button className="import-btn">
          <Import size={16} />
          <span>Import</span>
        </button>
      </div>

      <hr className="header-separator" />

      {categories.map((cat) => {
        const { name, icon: Icon } = categoryDetails[cat];

        return (
          <div key={cat} className="mb-3">
            <p className="text-gray-600 font-medium">{cat}</p>
            <div className="device-grid">
              {Array(6)
                .fill(null)
                .map((_, i) => (
                  <div key={i} className="device-tile">
                    <div className="device-icon mb-1">
                      <Icon size={32} />
                    </div>
                    <p className="device-type">{name}</p>
                  </div>
                ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}