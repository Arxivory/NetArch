export default function PropertiesPanel() {

  return (
    <div className="properties-panel">
      <h3 className="font-semibold mb-2">Properties</h3>
      <hr className="header-separator"/>
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

      <div>
        <hr className="my-3" />
        <h3 className="font-semibold mb-2">Transformations</h3>
        <hr className="header-separator"/>

        <div className="grid grid-cols-4 gap-2 text-sm font-medium text-gray-600 mb-1">
          <span></span>
          <span>X</span>
          <span>Y</span>
          <span>Z</span>
        </div>

        <div className="grid grid-cols-4 gap-2 mb-2">
          <label className="text-gray-600 font-medium text-sm self-center">
            Position
          </label>
          <input type="number" className="field-input" defaultValue="0" />
          <input type="number" className="field-input" defaultValue="0" />
          <input type="number" className="field-input" defaultValue="0" />
        </div>

        <div className="grid grid-cols-4 gap-2 mb-2">
          <label className="text-gray-600 font-medium text-sm self-center">
            Scale
          </label>
          <input type="number" className="field-input" defaultValue="0" />
          <input type="number" className="field-input" defaultValue="0" />
          <input type="number" className="field-input" defaultValue="0" />
        </div>

        <div className="grid grid-cols-4 gap-2">
          <label className="text-gray-600 font-medium text-sm self-center">
            Rotation
          </label>
          <input type="number" className="field-input" defaultValue="0" />
          <input type="number" className="field-input" defaultValue="0" />
          <input type="number" className="field-input" defaultValue="0" />
        </div>
      </div>
    </div>
  );
}
