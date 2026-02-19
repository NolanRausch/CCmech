import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import BoxView1 from "./BoxView1";

export default function DbTestViewer({ onTotalsChange }) {
  // 🔧 All hooks at the top
  const [rows, setRows] = useState([]); // each row gets .Alternates: []
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [selected, setSelected] = useState(null);

  const API_BASE =
    "https://ccmechconstruction-bjate8cvcha3ecgt.canadacentral-01.azurewebsites.net/api";

  const BLUE = "#0b2a4a"; // ✅ same blue as header bar

  // Safe number parser for strings like "250.00", "$250", etc.
  const parseNum = useCallback((val) => {
    const n = parseFloat(String(val ?? "").replace(/[^0-9.\-]/g, ""));
    return isNaN(n) ? 0 : n;
  }, []);

  // ✅ Correct money formatting: 30000 -> $30,000.00
  const fmtMoney = useCallback(
    (val) => {
      const n = parseNum(val);
      return n.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    },
    [parseNum]
  );

  const pickUsedOrPrimary = useCallback((primary, alternates = []) => {
    const usedAlt = alternates.find((a) => Number(a?.IsUsed) === 1);
    return usedAlt || primary;
  }, []);

  const fetchAlternates = useCallback(
    async (equipmentId) => {
      try {
        const res = await fetch(
          `${API_BASE}/db-test-alternate/${encodeURIComponent(equipmentId)}`
        );
        if (!res.ok) throw new Error(`Alt HTTP ${res.status}`);
        const json = await res.json();
        const list = Array.isArray(json?.sample) ? json.sample : [];
        return list;
      } catch (e) {
        console.warn("Alternates fetch failed for", equipmentId, e);
        return [];
      }
    },
    [API_BASE]
  );

  const fetchRows = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 1) Get equipment list
      const res = await fetch(`${API_BASE}/db-test`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const list = Array.isArray(json?.sample) ? json.sample : [];

      // 2) For each equipment, fetch alternates and attach as .Alternates
      const withAlternates = await Promise.all(
        list.map(async (r) => {
          const alts = await fetchAlternates(r.EquipmentId);
          return { ...r, Alternates: alts, _expand: false }; // _expand for UI toggle
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

  // Toggle expand
  const toggleExpand = useCallback((id) => {
    setRows((prev) =>
      prev.map((r) => (r.EquipmentId === id ? { ...r, _expand: !r._expand } : r))
    );
  }, []);

  // DELETE one row by EquipmentId (backend: DELETE /api/equipment/{id})
  const handleDelete = async (equipmentId) => {
    try {
      setDeletingId(equipmentId);
      const url = `${API_BASE}/equipment/${encodeURIComponent(equipmentId)}`;
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

      // Optimistically remove from UI
      setRows((prev) => prev.filter((r) => r.EquipmentId !== equipmentId));
    } catch (e) {
      alert("Delete failed: " + (e.message || e));
      console.error(e);
    } finally {
      setDeletingId(null);
    }
  };

  // Totals: material cost only (labor fields removed)
  const totals = useMemo(() => {
    return rows.reduce(
      (acc, r) => {
        const chosen = pickUsedOrPrimary(r, r?.Alternates || []);
        acc.materialCost += parseNum(chosen?.Cost);
        return acc;
      },
      { materialCost: 0 }
    );
  }, [rows, pickUsedOrPrimary, parseNum]);

  // ✅ Define totalCost (the thing your parent expects)
  const totalCost = totals.materialCost;

  // ✅ Push totals up to Home (deduped to prevent render loops)
  const lastSentRef = useRef(null);

  useEffect(() => {
    if (typeof onTotalsChange !== "function") return;

    const payload = { cost: Number(totalCost) || 0, label: "Equipment" };
    const sig = `${payload.label}:${payload.cost.toFixed(4)}`;

    if (lastSentRef.current === sig) return;
    lastSentRef.current = sig;

    onTotalsChange(payload);
  }, [totalCost, onTotalsChange]);

  // Early returns AFTER hooks
  if (loading) return <p className="p-3">Loading...</p>;
  if (error) return <p className="p-3 text-danger">Error: {error}</p>;

  // Swap to BoxView1 and refresh on back
  if (selected === 1000) {
    return (
      <BoxView1
        number={selected}
        onBack={() => {
          setSelected(null);
          fetchRows(); // ✅ refresh equipment (and alternates) after returning
        }}
      />
    );
  }

  // ✅ fixed widths for small columns so Notes gets the remaining space
  const col = {
    idx: { width: "3.25rem", whiteSpace: "nowrap" },
    desc: { width: "16rem", maxWidth: "16rem" },
    supplier: { width: "12rem", maxWidth: "12rem" },
    cost: { width: "7.5rem", whiteSpace: "nowrap" },
    // Notes gets the free space: no width set
    alternates: { width: "10rem", whiteSpace: "nowrap" },
    actions: { width: "7rem", whiteSpace: "nowrap" },
    clamp: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  };

  return (
    <div className="container py-4">
      {/* ✅ ONLY CHANGE: make header ALL CAPS + BLUE (keep same size/structure) */}
      <div className="d-flex align-items-center gap-3 mb-3">
        <button
          className="btn btn-outline-secondary btn-lg"
          onClick={() => setSelected(1000)}
        >
          Input
        </button>

        <h5 className="mb-0" style={{ color: BLUE, textTransform: "uppercase" }}>
          Code 1000 - Equipment: RTU&apos;s, Chillers, Boilers, Pumps, Towers,
          VRF, Splits
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
              backgroundColor: BLUE, // ✅ dark blue bar
            }}
          >
            <tr>
              <th style={{ ...col.idx, backgroundColor: BLUE }}>#</th>
              <th style={{ ...col.desc, backgroundColor: BLUE }}>Description</th>
              <th style={{ ...col.supplier, backgroundColor: BLUE }}>Supplier</th>
              <th style={{ ...col.cost, backgroundColor: BLUE }}>Cost</th>
              <th style={{ backgroundColor: BLUE }}>Notes</th>
              <th style={{ ...col.alternates, backgroundColor: BLUE }}>Alternates</th>
              <th style={{ ...col.actions, backgroundColor: BLUE }}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((r, i) => {
              const hasUsedAlt = r?.Alternates?.some((a) => Number(a?.IsUsed) === 1);
              const chosen = pickUsedOrPrimary(r, r?.Alternates || []);

              return (
                <React.Fragment key={r.EquipmentId || `rowwrap-${i}`}>
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

                    <td style={{ ...col.desc, ...col.clamp }}>{chosen?.Description}</td>
                    <td style={{ ...col.supplier, ...col.clamp }}>{chosen?.Supplier}</td>
                    <td style={col.cost}>{fmtMoney(chosen?.Cost)}</td>

                    <td style={{ whiteSpace: "normal", wordBreak: "break-word" }}>
                      {chosen?.Notes}
                    </td>

                    <td style={col.alternates}>
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => toggleExpand(r.EquipmentId)}
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
                        onClick={() => handleDelete(r.EquipmentId)}
                        disabled={deletingId === r.EquipmentId}
                        title="Delete this equipment"
                      >
                        {deletingId === r.EquipmentId ? "Deleting…" : "Clear"}
                      </button>
                    </td>
                  </tr>

                  {r._expand &&
                    (r.Alternates?.length ? (
                      r.Alternates.map((a, ai) => (
                        <tr
                          key={`${r.EquipmentId}-alt-${a?.AlternateId || ai}`}
                          className="table-light"
                        >
                          <td style={col.idx}></td>

                          <td className="ps-4" style={{ ...col.desc }}>
                            <span className="badge text-bg-secondary me-2">ALT</span>
                            {a.Description}
                            {Number(a?.IsUsed) === 1 && (
                              <span className="ms-2 badge text-bg-success">USED</span>
                            )}
                          </td>

                          <td style={{ ...col.supplier, ...col.clamp }}>{a.Supplier}</td>
                          <td style={col.cost}>{fmtMoney(a.Cost)}</td>

                          <td style={{ whiteSpace: "normal", wordBreak: "break-word" }}>
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

          <tfoot className="table-secondary" style={{ position: "sticky", bottom: 0 }}>
            <tr>
              <th colSpan={3}>Total</th>
              <th style={col.cost}>{fmtMoney(totals.materialCost)}</th>
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




