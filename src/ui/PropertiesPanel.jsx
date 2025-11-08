export default function PropertiesPanel() {
  return (
    <div className="properties-panel">
      <h3 className="font-semibold mb-2">Properties</h3>
      <div className="space-y-2">
        <div>
          <label className="block text-gray-600">Device Name</label>
          <input
            className="field-input"
            defaultValue="Sw1-Room-100"
          />
        </div>
        <div>
          <label className="block text-gray-600">IP Address</label>
          <input
            className="field-input"
            defaultValue="192.168.1.2"
          />
        </div>
        <div>
          <label className="block text-gray-600">Subnet Mask</label>
          <input
            className="field-input"
            defaultValue="255.255.255.0"
          />
        </div>
        <div>
          <label className="block text-gray-600">Default Gateway</label>
          <input
            className="field-input"
            defaultValue="192.168.1.1"
          />
        </div>
      </div>
    </div>
  );
}
