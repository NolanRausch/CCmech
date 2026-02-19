import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import BoxView2 from "./BoxView2";

export default function DbTestViewer({ onTotalsChange }) {
  const [rows, setRows] = useState([]); // each row gets .Alternates: []
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [selected, setSelected] = useState(null);

  const API_BASE =
    "https://ccmechconstruction-bjate8cvcha3ecgt.canadacentral-01.azurewebsites.net/api";

  const BLUE = "#0b2a4a";

  const parseCost = useCallback((val) => {
    const n = parseFloat(String(val ?? "").replace(/[^0-9.\-]/g, ""));
    return isNaN(n) ? 0 : n;
  }, []);

  const fmtMoney = useCallback((n) => `$${parseCost(n).toFixed(2)}`, [parseCost]);

  const pickUsedOrPrimary = useCallback((primary, alternates = []) => {
    const usedAlt = alternates.find((a) => Number(a?.IsUsed) === 1);
    return usedAlt || primary;
  }, []);

  const fetchAlternates = useCallback(
    async (demoId) => {
      try {
        const res = await fetch(
          `${API_BASE}/demo/alternates/${encodeURIComponent(demoId)}`
        );
        if (!res.ok) throw new Error(`Alt HTTP ${res.status}`);

        const json = await res.json();
        const list = Array.isArray(json)
          ? json
          : Array.isArray(json?.sample)
          ? json.sample
          : [];

        return list;
      } catch (e) {
        console.warn("Alternates fetch failed for", demoId, e);
        return [];
      }
    },
    [API_BASE]
  );

  const fetchRows = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`${API_BASE}/demo`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json = await res.json();
      const list = Array.isArray(json)
        ? json
        : Array.isArray(json?.sample)
        ? json.sample
        : [];

      const withAlternates = await Promise.all(
        list.map(async (r) => {
          const alts = await fetchAlternates(r.DemoId);
          return { ...r, Alternates: alts, _expand: false };
        })
      );

      setRows(withAlternates);
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }, [API_BASE, fetchAlternates]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const handleDelete = async (demoId) => {
    try {
      setDeletingId(demoId);

      const url = `${API_BASE}/demo/${encodeURIComponent(demoId)}`;
      const res = await fetch(url, { method: "DELETE" });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }

      if (!res.ok) {
        throw new Error(
          typeof data === "string" ? data : data?.error || `HTTP ${res.status}`
        );
      }

      setRows((prev) => prev.filter((r) => r.DemoId !== demoId));
    } catch (e) {
      alert("Delete failed: " + (e.message || e));
      console.error(e);
    } finally {
      setDeletingId(null);
    }
  };

  const toggleExpand = useCallback((id) => {
    setRows((prev) =>
      prev.map((r) => (r.DemoId === id ? { ...r, _expand: !r._expand } : r))
    );
  }, []);

  const totalCost = useMemo(() => {
    return rows.reduce((sum, r) => {
      const chosen = pickUsedOrPrimary(r, r?.Alternates || []);
      return sum + parseCost(chosen?.Cost);
    }, 0);
  }, [rows, pickUsedOrPrimary, parseCost]);

  // ✅ Push totals up (dedupe + send object like your other viewers)
  const lastSentRef = useRef(null);
  useEffect(() => {
    if (typeof onTotalsChange !== "function") return;

    const payload = { cost: Number(totalCost) || 0, label: "Demo" };
    const sig = `${payload.label}:${payload.cost.toFixed(4)}`;

    if (lastSentRef.current === sig) return;
    lastSentRef.current = sig;

    onTotalsChange(payload);
  }, [totalCost, onTotalsChange]);

  if (loading) return <p className="p-3">Loading...</p>;
  if (error) return <p className="p-3 text-danger">Error: {error}</p>;

  if (selected === 1000) {
    return (
      <BoxView2
        number={selected}
        onBack={() => {
          setSelected(null);
          fetchRows();
        }}
      />
    );
  }

  // ✅ fixed widths so Notes gets remaining space
  const col = {
    idx: { width: "3.25rem", whiteSpace: "nowrap" },
    desc: { width: "16rem", maxWidth: "16rem" },
    supplier: { width: "12rem", maxWidth: "12rem" },
    cost: { width: "7.5rem", whiteSpace: "nowrap" },
    alternates: { width: "10rem", whiteSpace: "nowrap" },
    actions: { width: "7rem", whiteSpace: "nowrap" },
    clamp: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  };

  return (
    <div className="container py-4">
      {/* ✅ Input button LEFT + header ALL CAPS + blue (no size changes) */}
      <div className="d-flex align-items-center gap-3 mb-3">
        <button
          className="btn btn-outline-secondary btn-lg"
          onClick={() => setSelected(1000)}
        >
          Input
        </button>

        <h5 className="mb-0" style={{ color: BLUE, textTransform: "uppercase" }}>
          CODE 2000 - Prep: Demolition, Deliveries, Trucking, Fencing, Eng Fees, Refrigerant
          Recovery
        </h5>
      </div>

      <div
        className="table-responsive"
        style={{
          maxHeight: "500px",
          overflowY: "auto",
          border: "1px solid #ddd",
          borderRadius: "6px",
        }}
      >
        <table className="table table-striped table-hover table-sm mb-0 table-fixed">
          <thead
            className="table-dark"
            style={{
              position: "sticky",
              top: 0,
              zIndex: 2,
              backgroundColor: BLUE,
            }}
          >
            <tr>
              <th style={{ ...col.idx, backgroundColor: BLUE }}>#</th>
              <th style={{ ...col.desc, backgroundColor: BLUE }}>Description</th>
              <th style={{ ...col.supplier, backgroundColor: BLUE }}>Supplier</th>
              <th style={{ ...col.cost, backgroundColor: BLUE }}>Cost</th>

              {/* ✅ Notes flexible */}
              <th style={{ backgroundColor: BLUE }}>Notes</th>

              <th style={{ ...col.alternates, backgroundColor: BLUE }}>
                Alternates
              </th>
              <th style={{ ...col.actions, backgroundColor: BLUE }}>Actions</th>
            </tr>
          </thead>

          {/* ✅ No "No records found" row; table can be empty */}
          <tbody>
            {rows.map((r, i) => {
              const hasUsedAlt = r?.Alternates?.some(
                (a) => Number(a?.IsUsed) === 1
              );
              const chosen = pickUsedOrPrimary(r, r?.Alternates || []);

              return (
                <React.Fragment key={r.DemoId || `rowwrap-${i}`}>
                  <tr>
                    <td style={col.idx}>
                      {i + 1}
                      {hasUsedAlt && (
                        <span
                          className="ms-1 badge rounded-pill text-bg-success"
                          title="An alternate is selected for this item"
                        >
                          ALT
                        </span>
                      )}
                    </td>

                    <td style={{ ...col.desc, ...col.clamp }}>
                      {chosen?.Description}
                    </td>

                    <td style={{ ...col.supplier, ...col.clamp }}>
                      {chosen?.Supplier}
                    </td>

                    <td style={col.cost}>{fmtMoney(chosen?.Cost)}</td>

                    <td style={{ whiteSpace: "normal", wordBreak: "break-word" }}>
                      {chosen?.Notes}
                    </td>

                    <td style={col.alternates}>
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => toggleExpand(r.DemoId)}
                        title="Show/Hide alternates"
                      >
                        {r._expand
                          ? `Hide (${r.Alternates?.length || 0})`
                          : `Show (${r.Alternates?.length || 0})`}
                      </button>
                    </td>

                    <td style={col.actions}>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDelete(r.DemoId)}
                        disabled={deletingId === r.DemoId}
                        title="Delete this demo item"
                      >
                        {deletingId === r.DemoId ? "Deleting…" : "Clear"}
                      </button>
                    </td>
                  </tr>

                  {r._expand &&
                    (r.Alternates?.length ? (
                      r.Alternates.map((a, ai) => (
                        <tr
                          key={`${r.DemoId}-alt-${a?.AlternateId || ai}`}
                          className="table-light"
                        >
                          <td style={col.idx}></td>

                          <td className="ps-4" style={{ ...col.desc }}>
                            <span className="badge text-bg-secondary me-2">
                              ALT
                            </span>
                            {a.Description}
                            {Number(a?.IsUsed) === 1 && (
                              <span className="ms-2 badge text-bg-success">
                                USED
                              </span>
                            )}
                          </td>

                          <td style={{ ...col.supplier, ...col.clamp }}>
                            {a.Supplier}
                          </td>

                          <td style={col.cost}>{fmtMoney(a.Cost)}</td>

                          <td
                            style={{
                              whiteSpace: "normal",
                              wordBreak: "break-word",
                            }}
                          >
                            {a.Notes}
                          </td>

                          <td colSpan={2}></td>
                        </tr>
                      ))
                    ) : (
                      <tr className="table-light">
                        <td style={col.idx}></td>
                        <td className="ps-4 text-muted" colSpan={6}>
                          No alternates
                        </td>
                      </tr>
                    ))}
                </React.Fragment>
              );
            })}
          </tbody>

          <tfoot
            className="table-secondary"
            style={{ position: "sticky", bottom: 0 }}
          >
            <tr>
              <th colSpan={3}>Total Cost (alt-adjusted)</th>
              <th style={col.cost}>{fmtMoney(totalCost)}</th>
              <th colSpan={3}></th>
            </tr>
          </tfoot>
        </table>
      </div>

      <style>{`
        .table-fixed { table-layout: fixed; width: 100%; }
      `}</style>
    </div>
  );
}
