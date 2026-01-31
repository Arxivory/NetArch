export default function PropertiesPanel() {
  return (
    <div className="properties-panel">
      <h3>Properties</h3>
      <hr className="header-separator" />

      <div className="properties-group">
        <div>
          <label>Device Name</label>
          <input className="field-input" defaultValue="Sw1-Room-100" />
        </div>

        <div>
          <label>IP Address</label>
          <input className="field-input" defaultValue="192.168.1.2" />
        </div>

        <div>
          <label>Subnet Mask</label>
          <input className="field-input" defaultValue="255.255.255.0" />
        </div>

        <div>
          <label>Default Gateway</label>
          <input className="field-input" defaultValue="192.168.1.1" />
        </div>
      </div>

      <hr className="header-separator" />

      <h3>Transformations</h3>

      <div className="transform-header">
        <span></span>
        <span>X</span>
        <span>Y</span>
        <span>Z</span>
      </div>

      <div className="transform-grid">
        <label>Position</label>
        <input type="number" className="field-input" defaultValue="0" />
        <input type="number" className="field-input" defaultValue="0" />
        <input type="number" className="field-input" defaultValue="0" />
      </div>

      <div className="transform-grid">
        <label>Scale</label>
        <input type="number" className="field-input" defaultValue="0" />
        <input type="number" className="field-input" defaultValue="0" />
        <input type="number" className="field-input" defaultValue="0" />
      </div>

      <div className="transform-grid">
        <label>Rotation</label>
        <input type="number" className="field-input" defaultValue="0" />
        <input type="number" className="field-input" defaultValue="0" />
        <input type="number" className="field-input" defaultValue="0" />
      </div>
    </div>
  );
}
