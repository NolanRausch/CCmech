import { useEffect, useMemo, useState, useCallback } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import BoxView1 from "./BoxView1";

export default function DbTestViewer() {
  // 🔧 All hooks at the top
  const [rows, setRows] = useState([]); // each row gets .Alternates: []
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [selected, setSelected] = useState(null);

  const API_BASE =
    "https://ccmechconstruction-bjate8cvcha3ecgt.canadacentral-01.azurewebsites.net/api";

  // Safe number parser for strings like "250.00", "$250", etc.
  const parseNum = (val) => {
    const n = parseFloat(String(val ?? "").replace(/[^0-9.\-]/g, ""));
    return isNaN(n) ? 0 : n;
  };

  const fmtMoney = (n) => `$${parseNum(n).toFixed(2)}`;
  const fmtHours = (n) => parseNum(n).toFixed(2);

  const pickUsedOrPrimary = (primary, alternates = []) => {
    const usedAlt = alternates.find((a) => Number(a?.IsUsed) === 1);
    return usedAlt || primary;
  };

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

      if (!res.ok)
        throw new Error(
          typeof data === "string" ? data : data?.error || `HTTP ${res.status}`
        );

      // Optimistically remove from UI
      setRows((prev) => prev.filter((r) => r.EquipmentId !== equipmentId));
    } catch (e) {
      alert("Delete failed: " + (e.message || e));
      console.error(e);
    } finally {
      setDeletingId(null);
    }
  };

  // Toggle expand
  const toggleExpand = (id) =>
    setRows((prev) =>
      prev.map((r) => (r.EquipmentId === id ? { ...r, _expand: !r._expand } : r))
    );

  // Totals: use alternate values when IsUsed === 1
  const totals = useMemo(() => {
    return rows.reduce(
      (acc, r) => {
        const chosen = pickUsedOrPrimary(r, r?.Alternates || []);

        acc.materialCost += parseNum(chosen?.Cost);
        acc.laborHours += parseNum(chosen?.LaborHours);
        acc.laborCost += parseNum(chosen?.LaborCost);

        return acc;
      },
      { materialCost: 0, laborHours: 0, laborCost: 0 }
    );
  }, [rows]);

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

  return (
    <div className="container py-4">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h2 className="mb-0">Equipment</h2>
        <button
          className="btn btn-outline-secondary btn-sm"
          onClick={() => setSelected(1000)}
        >
          Edit
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
          <thead className="table-dark" style={{ position: "sticky", top: 0, zIndex: 2 }}>
            <tr>
              <th style={{ width: "4rem" }}>#</th>
              <th>Description</th>
              <th>Supplier</th>
              <th style={{ width: "8rem" }}>Cost</th>
              <th>Notes</th>
              <th style={{ width: "9rem" }}>Labor Type</th>
              <th style={{ width: "7rem" }}>Hours</th>
              <th style={{ width: "8rem" }}>Labor Cost</th>
              <th style={{ width: "10rem" }}>Alternates</th>
              <th style={{ width: "7rem" }}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={10} className="text-center py-4">
                  No records found
                </td>
              </tr>
            ) : (
              rows.map((r, i) => {
                const hasUsedAlt = r?.Alternates?.some((a) => Number(a?.IsUsed) === 1);
                const chosen = pickUsedOrPrimary(r, r?.Alternates || []);

                return (
                  <>
                    <tr key={r.EquipmentId || `row-${i}`}>
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
                      <td>{chosen?.LaborType || ""}</td>
                      <td>{fmtHours(chosen?.LaborHours)}</td>
                      <td>{fmtMoney(chosen?.LaborCost)}</td>

                      <td>
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

                      <td>
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
                          <tr key={`${r.EquipmentId}-alt-${ai}`} className="table-light">
                            <td></td>
                            <td className="ps-4">
                              <span className="badge text-bg-secondary me-2">ALT</span>
                              {a.Description}
                              {Number(a?.IsUsed) === 1 && (
                                <span className="ms-2 badge text-bg-success">USED</span>
                              )}
                            </td>
                            <td>{a.Supplier}</td>
                            <td>{fmtMoney(a.Cost)}</td>
                            <td>{a.Notes}</td>
                            <td>{a.LaborType || ""}</td>
                            <td>{fmtHours(a.LaborHours)}</td>
                            <td>{fmtMoney(a.LaborCost)}</td>
                            <td colSpan={2}></td>
                          </tr>
                        ))
                      ) : (
                        <tr key={`${r.EquipmentId}-noalts`} className="table-light">
                          <td></td>
                          <td className="ps-4 text-muted" colSpan={9}>
                            No alternates
                          </td>
                        </tr>
                      ))}
                  </>
                );
              })
            )}
          </tbody>

          <tfoot className="table-secondary" style={{ position: "sticky", bottom: 0 }}>
            <tr>
              <th colSpan={3}>Totals (alt-adjusted)</th>
              <th>{fmtMoney(totals.materialCost)}</th>
              <th></th>
              <th></th>
              <th>{fmtHours(totals.laborHours)}</th>
              <th>{fmtMoney(totals.laborCost)}</th>
              <th colSpan={2}></th>
            </tr>
          </tfoot>
        </table>
      </div>

      

      <h5 className="mt-3">Code Number 1000</h5>
    </div>
  );
}
