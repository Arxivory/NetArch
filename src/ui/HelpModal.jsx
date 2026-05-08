import React, { useState, useMemo, useEffect } from "react";
import ReactDOM from "react-dom";

const DEFAULT_KEYBINDINGS = [
  { action: "Save Project",       category: "File",     key: "Ctrl+S" },
  { action: "New Project",        category: "File",     key: "Ctrl+N" },
  { action: "Open Project",       category: "File",     key: "Ctrl+O" },
  { action: "Undo",               category: "Edit",     key: "Ctrl+Z" },
  { action: "Redo",               category: "Edit",     key: "Ctrl+Y" },
  { action: "Duplicate",          category: "Edit",     key: "Ctrl+D" },
  { action: "Delete Selected",    category: "Edit",     key: "Delete" },
  { action: "Select Tool",        category: "Tools",    key: "S" },
  { action: "Pan Tool",           category: "Tools",    key: "P" },
  { action: "Zoom In",            category: "View",     key: "=" },
  { action: "Zoom Out",           category: "View",     key: "-" },
  { action: "Open Help",          category: "Help",     key: "F1" },
];

const GETTING_STARTED = [
  {
    step: 1,
    title: "Create a Domain",
    desc: "Use the Domain tool in the toolbar to draw your top-level network boundary. Domains represent the broadest grouping of your network infrastructure."
  },
  {
    step: 2,
    title: "Add Sites & Spaces",
    desc: "Inside a Domain, use Site and Space tools to define physical locations. Sites represent buildings or campuses; Spaces represent rooms or areas."
  },
  {
    step: 3,
    title: "Place Network Devices",
    desc: "Drag routers, switches, and other devices from the Object Library on the left into your Spaces. Devices snap to the grid automatically."
  },
  {
    step: 4,
    title: "Connect Devices",
    desc: "Use the Pathway tools to draw conduits and cables between devices. Select a device and right-click to see connection options."
  },
  {
    step: 5,
    title: "Save Your Work",
    desc: "Use File > Save or Ctrl+S to save your project locally. Use File > Export to share your design in other formats."
  },
];

const ALL_TOOLS = [
  { name: "Select", category: "Controls", desc: "Select and move objects on the canvas." },
  { name: "Delete", category: "Controls", desc: "Delete selected objects, or toggle eraser mode." },
  { name: "Duplicate", category: "Controls", desc: "Duplicate the currently selected object." },
  { name: "Pan", category: "Controls", desc: "Click and drag to pan the canvas view." },
  { name: "Zoom In / Out", category: "Controls", desc: "Zoom the canvas in or out." },
  { name: "Domain", category: "Structure", desc: "Draw a Domain boundary on the canvas." },
  { name: "Site", category: "Structure", desc: "Draw a Site inside a Domain." },
  { name: "Space", category: "Structure", desc: "Draw a Space inside a Site." },
  { name: "Wall", category: "Fenestration", desc: "Draw walls inside a Space." },
  { name: "Door", category: "Fenestration", desc: "Place door openings on walls." },
  { name: "Window", category: "Fenestration", desc: "Place window openings on walls." },
  { name: "Conduit / Pathway", category: "Pathway", desc: "Draw conduit pathways between devices." },
  { name: "New Project", category: "File", desc: "Start a fresh empty project." },
  { name: "Open Project", category: "File", desc: "Load a saved project file." },
  { name: "Save Project", category: "File", desc: "Save the current project to disk." },
  { name: "Export", category: "File", desc: "Export your design to JSON or PNG." },
  { name: "Import", category: "File", desc: "Import an existing project or object file." },
  { name: "Simulate", category: "Network", desc: "Run a network simulation on placed devices." },
  { name: "Measure", category: "Tools", desc: "Measure distances on the canvas." },
  { name: "Calculate", category: "Tools", desc: "Run network calculations." },
  { name: "Settings", category: "Tools", desc: "Open application settings." },
];

const TABS = ["Getting Started", "Key Bindings", "Search Tools", "About"];

export default function HelpModal({ onClose }) {
  const [activeTab, setActiveTab] = useState("Getting Started");

  // Lock body scroll and prevent layout shift when modal is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingKey, setEditingKey] = useState(null);
  const [keybindings, setKeybindings] = useState(DEFAULT_KEYBINDINGS);
  const [pendingKey, setPendingKey] = useState("");
  const [duplicateWarning, setDuplicateWarning] = useState("");

  // Search
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return ALL_TOOLS.filter(
      t => t.name.toLowerCase().includes(q) || t.category.toLowerCase().includes(q) || t.desc.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Key binding capture
  const handleKeyCapture = (e) => {
    e.preventDefault();
    const parts = [];
    if (e.ctrlKey || e.metaKey) parts.push("Ctrl");
    if (e.shiftKey) parts.push("Shift");
    if (e.altKey) parts.push("Alt");
    const key = e.key === " " ? "Space" : e.key.length === 1 ? e.key.toUpperCase() : e.key;
    if (!["Control", "Shift", "Alt", "Meta"].includes(e.key)) parts.push(key);
    setPendingKey(parts.join("+"));
  };

  const confirmKeybinding = (index) => {
    if (!pendingKey) return;
    const duplicate = keybindings.find((kb, i) => kb.key === pendingKey && i !== index);
    if (duplicate) {
      setDuplicateWarning(`"${pendingKey}" is already used by "${duplicate.action}". Overwrite?`);
      return;
    }
    applyKeybinding(index);
  };

  const applyKeybinding = (index) => {
    const updated = keybindings.map((kb, i) => i === index ? { ...kb, key: pendingKey } : kb);
    setKeybindings(updated);
    setEditingKey(null);
    setPendingKey("");
    setDuplicateWarning("");
  };

  return ReactDOM.createPortal(
    <div className="help-modal-overlay" onClick={onClose}>
      <div className="help-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="help-modal-header">
          <h2>Help &amp; Documentation</h2>
          <button className="help-modal-close" onClick={onClose} title="Close">✕</button>
        </div>

        {/* Tabs */}
        <div className="help-modal-tabs">
          {TABS.map(tab => (
            <button
              key={tab}
              className={`help-tab-btn ${activeTab === tab ? "active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="help-modal-body">

          {/* ── Getting Started ── */}
          {activeTab === "Getting Started" && (
            <div className="help-section">
              <p className="help-intro">Welcome to <strong>NetArch 3D</strong> — a 3D network architecture design tool. Follow the steps below to get up and running.</p>
              <div className="help-steps">
                {GETTING_STARTED.map(({ step, title, desc }) => (
                  <div key={step} className="help-step">
                    <div className="help-step-num">{step}</div>
                    <div>
                      <div className="help-step-title">{title}</div>
                      <div className="help-step-desc">{desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Key Bindings ── */}
          {activeTab === "Key Bindings" && (
            <div className="help-section">
              <p className="help-intro">View and customize keyboard shortcuts. Click a binding to edit it.</p>
              <table className="keybinding-table">
                <thead>
                  <tr><th>Action</th><th>Category</th><th>Shortcut</th><th></th></tr>
                </thead>
                <tbody>
                  {keybindings.map((kb, i) => (
                    <tr key={i} className={editingKey === i ? "editing-row" : ""}>
                      <td>{kb.action}</td>
                      <td><span className="kb-category">{kb.category}</span></td>
                      <td>
                        {editingKey === i ? (
                          <input
                            className="kb-capture-input"
                            placeholder="Press a key..."
                            value={pendingKey}
                            onKeyDown={handleKeyCapture}
                            onChange={() => {}}
                            autoFocus
                          />
                        ) : (
                          <kbd className="kb-badge">{kb.key}</kbd>
                        )}
                      </td>
                      <td>
                        {editingKey === i ? (
                          <div className="kb-actions">
                            <button className="kb-btn confirm" onClick={() => confirmKeybinding(i)}>Save</button>
                            <button className="kb-btn cancel" onClick={() => { setEditingKey(null); setPendingKey(""); setDuplicateWarning(""); }}>Cancel</button>
                          </div>
                        ) : (
                          <button className="kb-btn edit" onClick={() => { setEditingKey(i); setPendingKey(kb.key); setDuplicateWarning(""); }}>Edit</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {duplicateWarning && (
                <div className="kb-duplicate-warning">
                  ⚠️ {duplicateWarning}
                  <button className="kb-btn confirm" style={{ marginLeft: 8 }} onClick={() => applyKeybinding(editingKey)}>Overwrite</button>
                  <button className="kb-btn cancel" style={{ marginLeft: 4 }} onClick={() => setDuplicateWarning("")}>Keep</button>
                </div>
              )}
              <button className="kb-reset-btn" onClick={() => { setKeybindings(DEFAULT_KEYBINDINGS); setEditingKey(null); }}>Reset to Defaults</button>
            </div>
          )}

          {/* ── Search Tools ── */}
          {activeTab === "Search Tools" && (
            <div className="help-section">
              <p className="help-intro">Quickly find any tool or feature by name.</p>
              <input
                className="help-search-input"
                placeholder="Search tools and features..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                autoFocus
              />
              {searchQuery && searchResults.length === 0 && (
                <div className="help-no-results">No tools found for &quot;{searchQuery}&quot;</div>
              )}
              <div className="help-search-results">
                {(searchQuery ? searchResults : ALL_TOOLS).map((tool, i) => (
                  <div key={i} className="help-search-item">
                    <div className="help-search-name">{tool.name}</div>
                    <span className="kb-category">{tool.category}</span>
                    <div className="help-search-desc">{tool.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── About ── */}
          {activeTab === "About" && (
            <div className="help-section help-about">
              <div className="help-about-logo">🏗️</div>
              <h3>NetArch 3D</h3>
              <p className="help-version">Version 1.0.0</p>
              <p>A 3D network architecture design and simulation tool. Design, visualize, and simulate network topologies in an intuitive 3D environment.</p>
              <div className="help-about-grid">
                <div className="help-about-card">
                  <div className="help-about-icon">📐</div>
                  <div className="help-about-label">Design</div>
                  <div className="help-about-subdesc">Draw domains, sites, spaces, and infrastructure.</div>
                </div>
                <div className="help-about-card">
                  <div className="help-about-icon">🌐</div>
                  <div className="help-about-label">Network</div>
                  <div className="help-about-subdesc">Place and connect routers, switches, and devices.</div>
                </div>
                <div className="help-about-card">
                  <div className="help-about-icon">▶️</div>
                  <div className="help-about-label">Simulate</div>
                  <div className="help-about-subdesc">Run live network simulations and view logs.</div>
                </div>
              </div>
              <p className="help-about-footer">Built with React · Three.js · Webpack</p>
            </div>
          )}

        </div>
      </div>
    </div>,
    document.body
  );
}
