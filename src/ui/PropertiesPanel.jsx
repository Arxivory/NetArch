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
    // 1. Try to get selected IDs (from canvas clicks)
    let ids = appState.selection.getSelectedDeviceIds(); 
    
    // 2. If empty, try to get the Focused ID (from Hierarchy clicks)
    if (!ids || ids.length === 0) {
      const focused = appState.selection.getFocusedId();
      if (focused) ids = [focused];
    }

    if (ids && ids.length > 0) {
      const entityId = ids[0];
      const entity = findEntityById(entityId); // This uses your layout search
      
      if (entity) {
        setSelectedEntity(entity);
        
        // Logically map the entity data to the transform state
        // This ensures the input boxes show the correct numbers immediately
        setTransform({
          position: { 
            x: entity.x || 0, 
            y: entity.y || 0, 
            z: entity.transform?.position?.z || 0 
          },
          scale: entity.transform?.scale || 1,
          rotation: entity.transform?.rotation || { x: 0, y: 0, z: 0 }
        });
        return;
      }
    }
    
    // If nothing is found, reset the panel
    setSelectedEntity(null);
  });

  return () => unsubscribe && unsubscribe();
  }, [canvasController]);

  const findEntityById = (id) => {
    if (!canvasController || !canvasController.layout) return null;
    return canvasController.layout.findEntityById(id);
  };

  const getDeviceLabel = (id) => {
    if (!canvasController?.layout?.devices) return id;

    const d = canvasController.layout.devices.find(
      x => x.id === id
    );

    return d?.label || d?.name || id;
  };

  const isDevice =
    selectedEntity &&
    selectedEntity.interfaces !== undefined;

  const isCable =
    selectedEntity &&
    selectedEntity.sourceId !== undefined &&
    selectedEntity.targetId !== undefined;

  const isWall =
    selectedEntity &&
    selectedEntity.type === "wall";

  const isStructure =
    selectedEntity &&
    (
      selectedEntity.structureType === "Domain" ||
      selectedEntity.structureType === "Site" ||
      selectedEntity.structureType === "Floor" ||
      selectedEntity.structureType === "Space" ||
      selectedEntity.type === "space" ||
      selectedEntity.type === "site" ||
      selectedEntity.type === "domain" ||
      selectedEntity.type === "floor"
    );

  const isFurniture =
    selectedEntity &&
    !isDevice &&
    !isCable &&
    !isWall &&
    !isStructure;

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
        {isCable && (
        <div className="properties-group">

          <div>
            <label>Cable Type</label>
            <input
              className="field-input"
              value={selectedEntity.type || ""}
              readOnly
            />
          </div>

          <div>
            <label>Source Device</label>
            <input
              className="field-input"
              value={getDeviceLabel(selectedEntity.sourceId)}
              readOnly
            />
          </div>

          <div>
            <label>Source Port</label>
            <input
              className="field-input"
              value={selectedEntity.sourcePort || ""}
              readOnly
            />
          </div>

          <div>
            <label>Target Device</label>
            <input
              className="field-input"
              value={getDeviceLabel(selectedEntity.targetId)}
              readOnly
            />
          </div>

          <div>
            <label>Target Port</label>
            <input
              className="field-input"
              value={selectedEntity.targetPort || ""}
              readOnly
            />
          </div>

        </div>
      )}

      {isWall && (
        <div className="properties-group">

          <div>
            <label>Wall Name</label>
            <input
              className="field-input"
              value={selectedEntity.label || "Wall"}
              readOnly
            />
          </div>

          <div>
            <label>Material</label>
            <select className="field-input">
              <option>Concrete</option>
              <option>Wood</option>
              <option>Glass</option>
              <option>Metal</option>
            </select>
          </div>

        </div>
      )}
      <hr className="header-separator" />

  {isDevice && (
    <div className="properties-group">

      <div>
        <label>Device Name</label>
        <input
          className="field-input"
          value={selectedEntity?.label || ""}
          readOnly
        />
      </div>

      <div>
        <label>IP Address</label>
        <input
          className="field-input"
          value={
            selectedEntity?.interfaces?.[0]?.ipv4?.address || ""
          }
          readOnly
        />
      </div>

      <div>
        <label>Subnet Mask</label>
        <input
          className="field-input"
          value={
            selectedEntity?.interfaces?.[0]?.ipv4?.subnetMask || ""
          }
          readOnly
        />
      </div>

      <div>
        <label>Default Gateway</label>
        <input
          className="field-input"
          value={selectedEntity?.defaultGateway || ""}
          readOnly
        />
      </div>

      <button
        className="floor-specifier-btn"
        style={{ marginTop: "6px" }}
        onClick={() => {
          console.log("Advanced config", selectedEntity);
        }}
      >
        Advanced Configuration
      </button>

    </div>
  )} 

  {isFurniture && (
        <div className="properties-group">
          <div>
            <label>Furniture Name</label>
            <input 
              className="field-input" 
              value={selectedEntity.label || selectedEntity.name || "Generic Furniture"} 
              readOnly 
            />
          </div>
          <div>
            <label>Category</label>
            <input 
              className="field-input" 
              value={selectedEntity.type || "Furniture"} 
              style={{ textTransform: 'capitalize' }}
              readOnly 
            />
          </div>
        </div>
      )}

  {isStructure && (
    <div className="properties-group">

      <div>
        <label>Name</label>
        <input
          className="field-input"
          value={
            selectedEntity.label ||
            selectedEntity.name ||
            selectedEntity.structureType ||
            ""
          }
          readOnly
        />
      </div>

      <div>
        <label>Type</label>
        <input
          className="field-input"
          value={
            selectedEntity.structureType ||
            selectedEntity.type ||
            ""
          }
          readOnly
        />
      </div>

      <div>
        <label>Material</label>
        <select className="field-input">
          <option>Concrete</option>
          <option>Wood</option>
          <option>Tile</option>
          <option>Carpet</option>
        </select>
      </div>

    </div>
  )}

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
