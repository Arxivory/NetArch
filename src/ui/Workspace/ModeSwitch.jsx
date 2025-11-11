//this section lets users switch modes from logical to physical mode development.
//This is a module with small panel with two buttons to switch modes.
import React from "react";
import { LogicalMode } from "./LogicalMode";

export default function ModeSwitch({ currentMode, onModeChange }) {
    return (
        <div className="mode-switch-panel">
            <button
                className={
                    "mode-switch-button px-3 py-1 mr-2 rounded " +
                    (currentMode === "logical"
                        ? "mode-switch-button-active"
                        : "mode-switch-button")
                }
                //onClick={() => onModeChange("logical")}
            >
                Logical Mode
            </button>
            <button
                className={
                    "mode-switch-button px-3 py-1 rounded " +
                    (currentMode === "physical"
                        ? "mode-switch-button-active"
                        : "mode-switch-button")
                }
                //onClick={() => onModeChange("physical")}
            >
                Physical Mode
            </button>
        </div>
    );
}

export { ModeSwitch };