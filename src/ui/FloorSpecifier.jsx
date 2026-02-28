
import { useState } from "react";
import { useHierarchy } from "./HierarchyContext";

export default function FloorSpecifier({ parentId, onCloseModal, floorCount }) {
    const [count, setCount] = useState(1);
    const { addNode } = useHierarchy();

    const handleAdd = () => {
        const n = parseInt(count, 10);
        if (isNaN(n) || n <= 0) return;
        let lastId = null;
        for (let i = 0; i < n; i++) {
            const id = Date.now() + i;
            addNode(parentId, "floor", `Floor ${floorCount}`);
            lastId = id;
        }
        if (lastId) {
            // after adding, activate the last floor (HierarchyContext already sets ui)
        }
        setCount(1);
    };

    return (
        <div className="floor-specifier-container">
            <h2 className="floor-specifier-label">Add Floors</h2>
            <hr className="horizontal-separator" />
            <div className="floor-specifier-input-wrapper">
                <p className="floor-specifier-number-label">Number of Floors:</p>
                <input
                    className="floor-specifier-input"
                    type="number"
                    value={count}
                    min={1}
                    onChange={(e) => setCount(e.target.value)}
                />
            </div>
            <button className="floor-specifier-btn" onClick={() => {handleAdd(); onCloseModal();}}>
                Add
            </button>
        </div>
    );
}