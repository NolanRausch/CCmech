import React, { useCallback, useEffect, useMemo, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import BoxView5 from "./BoxView5"; // ✅ viewer/editor for Electrical

export default function DbTestViewer({ onTotalsChange }) {
  const [rows, setRows] = useState([]); // each row gets .Alternates: []
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [selected, setSelected] = useState(null);

  const API_BASE =
    "https://ccmechconstruction-bjate8cvcha3ecgt.canadacentral-01.azurewebsites.net/api";

  const parseCost = (val) => {
    const n = parseFloat(String(val ?? "").replace(/[^0-9.\-]/g, ""));
    return isNaN(n) ? 0 : n;
  };

  const fmtMoney = (n) => `$${parseCost(n).toFixed(2)}`;

  const pickUsedOrPrimary = (primary, alternates = []) => {
    const usedAlt = alternates.find((a) => Number(a?.IsUsed) === 1);
    return usedAlt || primary;
  };

  // ✅ Alternates for Electrical
  const fetchAlternates = useCallback(
    async (electricalId) => {
      try {
        const res = await fetch(
          `${API_BASE}/electrical/alternates/${encodeURIComponent(electricalId)}`
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
        console.warn("Alternates fetch failed for", electricalId, e);
        return [];
      }
    },
    [API_BASE]
  );

  const fetchRows = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // ✅ Get Electrical list
      const res = await fetch(`${API_BASE}/electrical`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json = await res.json();
      const list = Array.isArray(json)
        ? json
        : Array.isArray(json?.sample)
        ? json.sample
        : [];

      // Attach alternates
      const withAlternates = await Promise.all(
        list.map(async (r) => {
          const alts = await fetchAlternates(r.ElectricalId);
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

  // ✅ DELETE one row by ElectricalId (backend: DELETE /api/electrical/{id})
  const handleDelete = async (electricalId) => {
    try {
      setDeletingId(electricalId);

      const url = `${API_BASE}/electrical/${encodeURIComponent(electricalId)}`;
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

      setRows((prev) => prev.filter((r) => r.ElectricalId !== electricalId));
    } catch (e) {
      alert("Delete failed: " + (e.message || e));
      console.error(e);
    } finally {
      setDeletingId(null);
    }
  };

  const toggleExpand = (id) =>
    setRows((prev) =>
      prev.map((r) =>
        r.ElectricalId === id ? { ...r, _expand: !r._expand } : r
      )
    );

  // ✅ Total cost (alt-adjusted) + memoized
  const totalCost = useMemo(() => {
    return rows.reduce((sum, r) => {
      const chosen = pickUsedOrPrimary(r, r?.Alternates || []);
      return sum + parseCost(chosen?.Cost);
    }, 0);
  }, [rows]);

  // ✅ Report section total up to Home whenever total changes
  useEffect(() => {
    if (typeof onTotalsChange === "function") {
      onTotalsChange(totalCost); // send NUMBER
    }
  }, [totalCost, onTotalsChange]);

  if (loading) return <p className="p-3">Loading...</p>;
  if (error) return <p className="p-3 text-danger">Error: {error}</p>;

  // ✅ Swap to BoxView5 editor/viewer
  if (selected === 1000) {
    return (
      <BoxView5
        number={selected}
        onBack={() => {
          setSelected(null);
          fetchRows(); // refresh Electrical + alternates after returning
        }}
      />
    );
  }

  return (
    <div className="container py-4">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h5 className="mb-0">Control Wiring Power Wiring</h5>
        <button
          className="btn btn-outline-secondary btn-sm"
          onClick={() => setSelected(1000)}
        >
          Input
        </button>
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
        <table className="table table-striped table-hover table-sm mb-0">
          <thead
            className="table-dark"
            style={{ position: "sticky", top: 0, zIndex: 2 }}
          >
            <tr>
              <th style={{ width: "4rem" }}>#</th>
              <th>Description</th>
              <th>Supplier</th>
              <th style={{ width: "8rem" }}>Cost</th>
              <th>Notes</th>
              <th style={{ width: "10rem" }}>Alternates</th>
              <th style={{ width: "7rem" }}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-4">
                  No records found
                </td>
              </tr>
            ) : (
              rows.map((r, i) => {
                const hasUsedAlt = r?.Alternates?.some(
                  (a) => Number(a?.IsUsed) === 1
                );
                const chosen = pickUsedOrPrimary(r, r?.Alternates || []);

                return (
                  <React.Fragment key={r.ElectricalId || `rowwrap-${i}`}>
                    <tr>
                      <td>
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
                      <td>{chosen?.Description}</td>
                      <td>{chosen?.Supplier}</td>
                      <td>{fmtMoney(chosen?.Cost)}</td>
                      <td>{chosen?.Notes}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => toggleExpand(r.ElectricalId)}
                          title="Show/Hide alternates"
                        >
                          {r._expand
                            ? `Hide (${r.Alternates?.length || 0})`
                            : `Show (${r.Alternates?.length || 0})`}
                        </button>
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDelete(r.ElectricalId)}
                          disabled={deletingId === r.ElectricalId}
                          title="Delete this electrical item"
                        >
                          {deletingId === r.ElectricalId ? "Deleting…" : "Clear"}
                        </button>
                      </td>
                    </tr>

                    {r._expand &&
                      (r.Alternates?.length ? (
                        r.Alternates.map((a, ai) => (
                          <tr
                            key={`${r.ElectricalId}-alt-${a?.AlternateId || ai}`}
                            className="table-light"
                          >
                            <td></td>
                            <td className="ps-4">
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
                            <td>{a.Supplier}</td>
                            <td>{fmtMoney(a.Cost)}</td>
                            <td>{a.Notes}</td>
                            <td colSpan={2}></td>
                          </tr>
                        ))
                      ) : (
                        <tr className="table-light">
                          <td></td>
                          <td className="ps-4 text-muted" colSpan={6}>
                            No alternates
                          </td>
                        </tr>
                      ))}
                  </React.Fragment>
                );
              })
            )}
          </tbody>

          <tfoot
            className="table-secondary"
            style={{ position: "sticky", bottom: 0 }}
          >
            <tr>
              <th colSpan={3}>Total Cost (alt-adjusted)</th>
              <th>{fmtMoney(totalCost)}</th>
              <th colSpan={3}></th>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

