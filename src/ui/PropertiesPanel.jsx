export default function PropertiesPanel() {
  return (
    <div className="p-2 text-xs border-t border-gray-300">
      <h3 className="font-semibold mb-2">Properties</h3>
      <div className="space-y-2">
        <div>
          <label className="block text-gray-600">Device Name</label>
          <input
            className="border border-gray-300 px-1 py-0.5 w-full text-sm"
            defaultValue="Sw1-Room-100"
          />
        </div>
        <div>
          <label className="block text-gray-600">IP Address</label>
          <input
            className="border border-gray-300 px-1 py-0.5 w-full text-sm"
            defaultValue="192.168.1.2"
          />
        </div>
        <div>
          <label className="block text-gray-600">Subnet Mask</label>
          <input
            className="border border-gray-300 px-1 py-0.5 w-full text-sm"
            defaultValue="255.255.255.0"
          />
        </div>
        <div>
          <label className="block text-gray-600">Default Gateway</label>
          <input
            className="border border-gray-300 px-1 py-0.5 w-full text-sm"
            defaultValue="192.168.1.1"
          />
        </div>
      </div>
    </div>
  );
}
