import { useEffect, useState } from "react";
import appState from "../state/AppState";
import { UpdateEntityTransformCommand } from "../core/editor/DrawingCommands";

export default function PropertiesPanel({ canvasController }) {
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [transform, setTransform] = useState({
    position: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    rotation: { x: 0, y: 0, z: 0 }
  });


  useEffect(() => {
    const unsubscribe = appState.selection.subscribe(() => {
      const ids = appState.selection.getSelectedDeviceIds();
      if (ids && ids.length > 0) {
        const entityId = ids[0];
        const entity = findEntityById(entityId);
        if (entity) {
          setSelectedEntity(entity);
          setTransform(entity.transform || {
            position: { x: entity.x || 0, y: entity.y || 0, z: 0 },
            scale: { x: 1, y: 1, z: 1 },
            rotation: { x: 0, y: 0, z: 0 }
          });
          return;
        }
      }
      setSelectedEntity(null);
    });

    return () => unsubscribe && unsubscribe();
  }, [canvasController]);

  const findEntityById = (id) => {
    if (!canvasController || !canvasController.layout) return null;
    return canvasController.layout.findEntityById(id);
  };

  const handleTransformChange = (type, axis, value) => {
    if (!selectedEntity || !canvasController) return;

    const newTransform = JSON.parse(JSON.stringify(transform));
    if (type === 'scale') {
      newTransform.scale = parseFloat(value);
    }
    else {
      newTransform[type][axis] = parseFloat(value);
    }
    setTransform(newTransform);


    const updates = {};
    updates[type] = newTransform[type];
    const cmd = new UpdateEntityTransformCommand(canvasController, appState, selectedEntity.id, updates);
    cmd.execute();
  };

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

      {selectedEntity ? (
        <>
          <div className="transform-header">
            <span></span>
            <span>X</span>
            <span>Y</span>
            <span>Z</span>
          </div>

          <div className="transform-grid">
            <label>Position</label>
            <input
              type="number"
              className="field-input"
              value={transform.position.x}
              onChange={(e) => handleTransformChange('position', 'x', e.target.value)}
            />
            <input
              type="number"
              className="field-input"
              value={transform.position.y}
              onChange={(e) => handleTransformChange('position', 'y', e.target.value)}
            />
            <input
              type="number"
              className="field-input"
              value={transform.position.z}
              onChange={(e) => handleTransformChange('position', 'z', e.target.value)}
            />
          </div>

          <div className="transform-grid">
            <label>Scale</label>
            <input
              type="number"
              className="field-input"
              value={transform.scale}
              onChange={(e) => handleTransformChange('scale', null, e.target.value)}
            />
            <input
              type="number"
              className="field-input"
              defaultValue={0}
              disabled
            />
            <input
              type="number"
              className="field-input"
              defaultValue={0}
              disabled
            />
          </div>

          <div className="transform-grid">
            <label>Rotation</label>
            <input
              type="number"
              className="field-input"
              value={transform.rotation.x}
              onChange={(e) => handleTransformChange('rotation', 'x', e.target.value)}
            />
            <input
              type="number"
              className="field-input"
              value={transform.rotation.y}
              onChange={(e) => handleTransformChange('rotation', 'y', e.target.value)}
            />
            <input
              type="number"
              className="field-input"
              value={transform.rotation.z}
              onChange={(e) => handleTransformChange('rotation', 'z', e.target.value)}
            />
          </div>
        </>
      ) : (
        <p style={{ padding: '1rem', color: '#999' }}>Select an entity to see transform properties</p>
      )}
    </div>
  );
}
