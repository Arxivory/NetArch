export default function ModeSwitch({ currentMode, onModeChange, style = {} }) {
    return (
        <div className="mode-switch-panel" style={style}>
            <button
                className={
                    "mode-switch-button px-3 py-1 mr-2 rounded " +
                    (currentMode === "logical"
                        ? "mode-switch-button-active"
                        : "mode-switch-button")
                }
                onClick={() => onModeChange && onModeChange("logical")}
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
                onClick={() => onModeChange && onModeChange("physical")}
            >
                Physical Mode
            </button>
        </div>
    );
}

export { ModeSwitch };