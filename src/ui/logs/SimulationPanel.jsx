import { Trash2, BrushCleaning, FunnelPlus, Mail } from "lucide-react";
import { useState, useMemo, useEffect, useRef } from "react";

// ── Columns: Device | Name | Message | Time | Source | Status | (mail+trash)
const COL_WIDTHS = {
  device:  "11%",
  name:    "14%",
  message: "30%",
  time:    "10%",
  source:  "15%",
  status:  "11%",
  actions: "9%",
};

const cellStyle = {
  paddingLeft:  8,
  paddingRight: 4,
  overflow:     "hidden",
  textOverflow: "ellipsis",
  whiteSpace:   "nowrap",
  verticalAlign:"middle",
  textAlign:    "left",
  boxSizing:    "border-box",
};

function Colgroup() {
  return (
    <colgroup>
      <col style={{ width: COL_WIDTHS.device  }} />
      <col style={{ width: COL_WIDTHS.name    }} />
      <col style={{ width: COL_WIDTHS.message }} />
      <col style={{ width: COL_WIDTHS.time    }} />
      <col style={{ width: COL_WIDTHS.source  }} />
      <col style={{ width: COL_WIDTHS.status  }} />
      <col style={{ width: COL_WIDTHS.actions }} />
    </colgroup>
  );
}

// ── Status badge colour ───────────────────────────────────────────────────────
function statusStyle(status = "") {
  const s = (status || "").toLowerCase();
  if (s === "up"   || s === "active" || s === "sent")
    return { bg: "#d4edda", text: "#155724" };
  if (s === "down" || s === "error"  || s === "failed")
    return { bg: "#f8d7da", text: "#721c24" };
  if (s === "pending" || s === "waiting")
    return { bg: "#fff3cd", text: "#856404" };
  return { bg: "#e9ecef", text: "#495057" };
}

// ── Search highlight ──────────────────────────────────────────────────────────
function hl(text = "", search = "") {
  if (!search.trim() || typeof text !== "string") return text;
  const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts   = text.split(new RegExp(`(${escaped})`, "gi"));
  return (
    <span>
      {parts.map((p, i) =>
        p.toLowerCase() === search.toLowerCase()
          ? <mark key={i} style={{ background: "#ffe08a", color: "inherit", padding: "0 1px", borderRadius: 2 }}>{p}</mark>
          : p
      )}
    </span>
  );
}

// ── Mail envelope modal ───────────────────────────────────────────────────────
function MailModal({ entry, onClose }) {
  if (!entry) return null;
  const sc = statusStyle(entry.status);

  return (
    <div
      style={{
        position:       "fixed",
        inset:          0,
        background:     "rgba(0,0,0,0.38)",
        zIndex:         9999,
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background:   "#fff",
          borderRadius: 10,
          width:        460,
          maxWidth:     "93vw",
          boxShadow:    "0 8px 36px rgba(0,0,0,0.20)",
          overflow:     "hidden",
          fontSize:     13,
          fontFamily:   "inherit",
        }}
      >
        {/* ── Envelope flap ── */}
        <div style={{
          background: "linear-gradient(135deg, #2c6e8a 0%, #1a4a60 100%)",
          padding:    "18px 20px 16px",
          position:   "relative",
        }}>
          {/* Decorative flap crease */}
          <div style={{
            position:    "absolute",
            top:         0,
            left:        "50%",
            transform:   "translateX(-50%)",
            width:       0,
            height:      0,
            borderLeft:  "70px solid transparent",
            borderRight: "70px solid transparent",
            borderTop:   "30px solid rgba(255,255,255,0.12)",
          }} />

          <div style={{ display: "flex", alignItems: "center", gap: 10, position: "relative" }}>
            <Mail size={18} color="#fff" />
            <span style={{ color: "#fff", fontWeight: 700, fontSize: 13, letterSpacing: "0.3px" }}>
              Simulation Packet Details
            </span>
            <button
              onClick={onClose}
              style={{
                marginLeft:   "auto",
                background:   "rgba(255,255,255,0.15)",
                border:       "none",
                borderRadius: 4,
                color:        "#fff",
                cursor:       "pointer",
                padding:      "2px 9px",
                fontSize:     16,
                lineHeight:   1.4,
              }}
            >×</button>
          </div>

          {/* Src → Dst */}
          <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10, position: "relative" }}>
            <div style={{
              background: "rgba(255,255,255,0.13)", borderRadius: 5,
              padding: "5px 12px", color: "#e0f0f8", fontSize: 12, fontWeight: 600,
            }}>
              {entry.device || "—"}
            </div>
            <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 20, lineHeight: 1 }}>→</span>
            <div style={{
              background: "rgba(255,255,255,0.13)", borderRadius: 5,
              padding: "5px 12px", color: "#e0f0f8", fontSize: 12, fontWeight: 600,
            }}>
              {entry.source || "—"}
            </div>
          </div>
        </div>

        {/* ── Body ── */}
        <div style={{ padding: "16px 20px 22px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 24px", marginBottom: 14 }}>
            <ModalField label="Device"      value={entry.device}     />
            <ModalField label="Device Name" value={entry.deviceName} />
            <ModalField label="Source"      value={entry.source}     />
            <ModalField label="Time"        value={entry.time}       />
            <ModalField label="Date"        value={entry.date}       />
            <ModalField label="Status">
              <span style={{
                fontSize: 11, fontWeight: 700,
                padding: "2px 8px", borderRadius: 4,
                background: sc.bg, color: sc.text,
              }}>
                {entry.status || "—"}
              </span>
            </ModalField>
          </div>

          {/* Message */}
          <div>
            <div style={{
              fontSize: 10, fontWeight: 700, color: "#888",
              textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 5,
            }}>
              Message
            </div>
            <div style={{
              background: "#f5f8fb", border: "1px solid #dde8f0",
              borderRadius: 5, padding: "9px 12px",
              fontSize: 12, color: "#333", wordBreak: "break-word",
              fontStyle: "italic", lineHeight: 1.55,
            }}>
              {entry.message || <span style={{ color: "#bbb" }}>No message</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ModalField({ label, value, children }) {
  return (
    <div>
      <div style={{
        fontSize: 10, fontWeight: 700, color: "#888",
        textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 2,
      }}>
        {label}
      </div>
      <div style={{ fontSize: 12, color: "#333" }}>
        {children || (value ? String(value) : <span style={{ color: "#ccc" }}>—</span>)}
      </div>
    </div>
  );
}

// ── Filter defaults ───────────────────────────────────────────────────────────
const EMPTY_FILTERS = {
  device:     "",
  deviceName: "",
  status:     "",
  date:       "",
};

// ── Main component ────────────────────────────────────────────────────────────
export default function SimulationPanel({ simLogData = [], setSimLogData }) {
  const [search,         setSearch]         = useState("");
  const [showClearModal, setShowClearModal] = useState(false);
  const [showFilters,    setShowFilters]    = useState(false);
  const [tempFilters,    setTempFilters]    = useState(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(EMPTY_FILTERS);
  const [mailEntry,      setMailEntry]      = useState(null);

  const scrollRef = useRef(null);
  const tbodyWrap = useRef(null);
  const MIN_SCROLL = 40;
  const MAX_SCROLL = 350;
  const [scrollH, setScrollH] = useState(MIN_SCROLL);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [simLogData.length]);

  useEffect(() => {
    const el = tbodyWrap.current;
    if (!el) return;
    const observer = new ResizeObserver(([e]) => {
      const hasData = simLogData.filter(x => !x.isSeparator).length > 0;
      setScrollH(hasData ? Math.min(MAX_SCROLL, Math.max(MIN_SCROLL, e.contentRect.height)) : MIN_SCROLL);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [simLogData.length]);

  const filteredLogs = useMemo(() => {
    return simLogData.filter((log) => {
      if (log.isSeparator) return true;
      const s = search.toLowerCase();
      const searchMatch =
        !search ||
        (log.device     || "").toLowerCase().includes(s) ||
        (log.deviceName || "").toLowerCase().includes(s) ||
        (log.message    || "").toLowerCase().includes(s) ||
        (log.source     || "").toLowerCase().includes(s) ||
        (log.status     || "").toLowerCase().includes(s);
      const deviceMatch = !appliedFilters.device     || (log.device     || "").toLowerCase().includes(appliedFilters.device.toLowerCase());
      const nameMatch   = !appliedFilters.deviceName || (log.deviceName || "").toLowerCase().includes(appliedFilters.deviceName.toLowerCase());
      const statusMatch = !appliedFilters.status     || (log.status     || "").toLowerCase().includes(appliedFilters.status.toLowerCase());
      const dateMatch   = !appliedFilters.date       || log.date === appliedFilters.date;
      return searchMatch && deviceMatch && nameMatch && statusMatch && dateMatch;
    });
  }, [simLogData, search, appliedFilters]);

  const hlText      = (t = "") => hl(t, search);
  const openFilter  = () => { setTempFilters(EMPTY_FILTERS); setShowFilters(true); };
  const handleApply = () => { setAppliedFilters(tempFilters); setShowFilters(false); };
  const handleReset = () => { setTempFilters(EMPTY_FILTERS); setAppliedFilters(EMPTY_FILTERS); setShowFilters(false); };
  const clearAll    = () => { setSimLogData([]); setShowClearModal(false); };
  const deleteEntry = (id) => setSimLogData((prev) => prev.filter((e) => e.id !== id));

  const hasLogs     = simLogData.filter(e => !e.isSeparator).length > 0;
  const showEmpty   = !hasLogs;
  const showNoMatch = hasLogs && filteredLogs.filter(e => !e.isSeparator).length === 0;

  return (
    <div className="console-panel">

      {/* Header */}
      <div className="console-panel-header">
        <h3 className="panel-header-title">Simulation Logs</h3>
        <div className="console-panel-controls">
          <input
            type="text"
            placeholder="Search device, message, status…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="console-panel-input"
          />
          <button onClick={() => setShowClearModal(true)} className="console-panel-btn">
            <BrushCleaning size={12} className="console-panel-icon" />
            <span>Clear</span>
          </button>
          <button onClick={openFilter} className="console-panel-btn">
            <FunnelPlus size={12} className="console-panel-icon" />
            <span>Filter</span>
          </button>
        </div>
      </div>

      {/* Table area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Fixed thead */}
        <table
          className="console-panel-table"
          style={{ tableLayout: "fixed", width: "100%", borderCollapse: "collapse" }}
        >
          <Colgroup />
          <thead>
            <tr>
              <th style={cellStyle}>Device</th>
              <th style={cellStyle}>Name</th>
              <th style={cellStyle}>Message</th>
              <th style={cellStyle}>Time</th>
              <th style={cellStyle}>Source</th>
              <th style={cellStyle}>Status</th>
              <th style={{ width: COL_WIDTHS.actions }} />
            </tr>
          </thead>
        </table>

        {/* Scrollable tbody */}
        <div
          ref={scrollRef}
          style={{ overflowY: "auto", height: `${scrollH}px`, transition: "height 0.2s ease", background: "#fff" }}
        >
          <div ref={tbodyWrap}>

            {showEmpty && (
              <div className="empty-state-container" style={{ minHeight: `${MIN_SCROLL}px`, border: "none" }}>
                <p style={{ margin: 0, color: "#999", fontSize: 11 }}>
                  No simulation data — click <strong>Simulate</strong> to capture activity.
                </p>
              </div>
            )}

            {showNoMatch && (
              <div className="empty-state-container" style={{ minHeight: `${MIN_SCROLL}px`, border: "none" }}>
                <p className="no-results-message">
                  No match found{search.trim() ? ` for "${search}"` : ""}.
                </p>
              </div>
            )}

            {!showEmpty && !showNoMatch && (
              <table
                className="console-panel-table"
                style={{ tableLayout: "fixed", width: "100%", borderCollapse: "collapse" }}
              >
                <Colgroup />
                <tbody>
                  {filteredLogs.map((entry) => {

                    /* ── separator row ── */
                    if (entry.isSeparator) {
                      return (
                        <tr key={entry.id}>
                          <td
                            colSpan={7}
                            style={{
                              padding:      "4px 10px",
                              fontSize:     10,
                              color:        "#aaa",
                              textAlign:    "center",
                              background:   "#fafafa",
                              borderTop:    "1px solid #f0f0f0",
                              borderBottom: "1px solid #f0f0f0",
                            }}
                          >
                            ── Simulation run &nbsp;{entry.time}&nbsp; {entry.date} ──
                          </td>
                        </tr>
                      );
                    }

                    /* ── data row ── */
                    const sc = statusStyle(entry.status);
                    return (
                      <tr key={entry.id}>
                        <td style={cellStyle}>{hlText(entry.device     || "")}</td>
                        <td style={cellStyle}>{hlText(entry.deviceName || "")}</td>
                        <td style={{
                          ...cellStyle,
                          fontStyle:    "italic",
                          whiteSpace:   "normal",
                          wordBreak:    "break-word",
                          overflowWrap: "break-word",
                          overflow:     "visible",
                        }}>
                          {hlText(entry.message || "")}
                        </td>
                        <td style={cellStyle}>{entry.time}</td>
                        <td style={cellStyle}>{hlText(entry.source || "")}</td>
                        <td style={cellStyle}>
                          <span style={{
                            fontSize:      10,
                            fontWeight:    700,
                            padding:       "1px 6px",
                            borderRadius:  3,
                            background:    sc.bg,
                            color:         sc.text,
                            letterSpacing: "0.4px",
                          }}>
                            {hlText(entry.status || "—")}
                          </span>
                        </td>
                        <td style={{ textAlign: "center", verticalAlign: "middle" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                            <Mail
                              size={13}
                              style={{ color: "#2c6e8a", cursor: "pointer", flexShrink: 0 }}
                              onClick={() => setMailEntry(entry)}
                              title="View packet details"
                            />
                            <Trash2
                              className="console-panel-delete"
                              size={13}
                              onClick={() => deleteEntry(entry.id)}
                              title="Delete entry"
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Mail modal */}
      {mailEntry && <MailModal entry={mailEntry} onClose={() => setMailEntry(null)} />}

      {/* Filter modal */}
      {showFilters && (
        <div className="modal-overlay">
          <div className="modal-container filter-modal">
            <h4 className="modal-title">Filter Simulation Logs</h4>
            <div className="modal-body">
              <input
                placeholder="Device (e.g. Router)"
                value={tempFilters.device}
                onChange={(e) => setTempFilters({ ...tempFilters, device: e.target.value })}
              />
              <input
                placeholder="Device Name (e.g. Router-01)"
                value={tempFilters.deviceName}
                onChange={(e) => setTempFilters({ ...tempFilters, deviceName: e.target.value })}
              />
              <input
                placeholder="Status (e.g. Sent, Up, Down)"
                value={tempFilters.status}
                onChange={(e) => setTempFilters({ ...tempFilters, status: e.target.value })}
              />
              <input
                type="date"
                value={tempFilters.date}
                onChange={(e) => setTempFilters({ ...tempFilters, date: e.target.value })}
              />
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={handleReset}>Reset</button>
              <button className="btn-cancel" onClick={() => setShowFilters(false)}>Cancel</button>
              <button className="btn-apply"  onClick={handleApply}>Apply</button>
            </div>
          </div>
        </div>
      )}

      {/* Clear modal */}
      {showClearModal && (
        <div className="modal-overlay">
          <div className="modal-container clear-modal">
            <h4 className="modal-title">Clear Simulation Logs</h4>
            <p className="modal-text">This will permanently delete all simulation logs. Continue?</p>
            <div className="modal-footer">
              <button className="btn-cancel"  onClick={() => setShowClearModal(false)}>Cancel</button>
              <button className="btn-confirm" onClick={clearAll}>Clear All</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}