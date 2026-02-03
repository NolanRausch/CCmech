


import { useEffect, useMemo, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import BoxViewLabor from "./BoxViewLabor"; // ✅ make this editor use /labor endpoints

export default function LaborViewer({ onTotalsChange }) {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [selected, setSelected] = useState(null);

  const API_BASE =
    "https://ccmechconstruction-bjate8cvcha3ecgt.canadacentral-01.azurewebsites.net/api";

  // change this if you want the viewer locked to a code
  const CODE_NUMBER = "1000";

  const parseNum = (val) => {
    const n = parseFloat(String(val ?? "").replace(/[^0-9.\-]/g, ""));
    return isNaN(n) ? 0 : n;
  };

  const fmtMoney = (n) => `$${parseNum(n).toFixed(2)}`;
  const fmtHours = (n) => parseNum(n).toFixed(2);

  async function fetchRows() {
    try {
      setLoading(true);
      setError(null);

      // ✅ GET labor rows for a code number
      const res = await fetch(
        `${API_BASE}/labor/code/${encodeURIComponent(CODE_NUMBER)}`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json = await res.json();
      const list = Array.isArray(json)
        ? json
        : Array.isArray(json?.sample)
        ? json.sample
        : [];

      setRows(list);
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRows();
  }, []);

  // ✅ DELETE one row by LaborId
  // Backend route should be: DELETE /api/labor/{id}
  const handleDelete = async (laborId) => {
    try {
      setDeletingId(laborId);

      const url = `${API_BASE}/labor/${encodeURIComponent(laborId)}`;
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

      setRows((prev) => prev.filter((r) => r.LaborId !== laborId));
    } catch (e) {
      alert("Delete failed: " + (e.message || e));
      console.error(e);
    } finally {
      setDeletingId(null);
    }
  };

  /**
   * ✅ totals + grouped by LaborType
   * Produces:
   *   totals.laborCost
   *   totals.laborHours
   *   totals.byType = [{ type, cost, hours }]
   */
  const totals = useMemo(() => {
    const acc = {
      laborHours: 0,
      laborCost: 0,
      byType: [],
    };

    const map = new Map();

    for (const r of rows) {
      const hours = parseNum(r?.LaborHours);
      const cost = parseNum(r?.LaborCost);
      const type = String(r?.LaborType ?? "").trim() || "Unspecified";

      acc.laborHours += hours;
      acc.laborCost += cost;

      const prev = map.get(type) || { type, cost: 0, hours: 0 };
      prev.cost += cost;
      prev.hours += hours;
      map.set(type, prev);
    }

    acc.byType = Array.from(map.values()).sort((a, b) => b.cost - a.cost);
    return acc;
  }, [rows]);

  // ✅ Report grouped totals up to Home whenever totals change
  useEffect(() => {
    if (typeof onTotalsChange === "function") {
      onTotalsChange({
        cost: totals.laborCost,
        hours: totals.laborHours,
        byType: totals.byType,
      });
    }
  }, [totals.laborCost, totals.laborHours, totals.byType, onTotalsChange]);

  if (loading) return <p className="p-3">Loading...</p>;
  if (error) return <p className="p-3 text-danger">Error: {error}</p>;

  // Editor screen
  if (selected === 7000) {
    return (
      <BoxViewLabor
        codeNumber={CODE_NUMBER}
        onBack={() => {
          setSelected(null);
          fetchRows(); // ✅ refresh after returning
        }}
      />
    );
  }

  return (
    <div className="container py-4">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h5 className="mb-0">Labor</h5>
        <button
          className="btn btn-outline-secondary btn-sm"
          onClick={() => setSelected(7000)}
        >
          Input
        </button>
      </div>

      {/* Optional: show grouped summary on the labor page too */}
      {totals.byType.length > 0 && (
        <div className="mb-3">
          <div className="fw-semibold mb-1">Totals by Labor Type</div>
          <div className="d-flex flex-column gap-1">
            {totals.byType.map((t) => (
              <div
                key={t.type}
                className="d-flex justify-content-between align-items-center"
              >
                <div>{t.type}</div>
                <div className="text-end">
                  <span className="text-muted small me-3">
                    {t.hours.toFixed(2)} hrs
                  </span>
                  <strong>{fmtMoney(t.cost)}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
              <th style={{ width: "10rem" }}>Code</th>
              <th>Labor Type</th>
              <th style={{ width: "7rem" }}>Hours</th>
              <th style={{ width: "8rem" }}>Labor Cost</th>
              <th>Notes</th>
              <th style={{ width: "7rem" }}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-4">
                  No labor records found
                </td>
              </tr>
            ) : (
              rows.map((r, i) => (
                <tr key={r.LaborId || `row-${i}`}>
                  <td>{i + 1}</td>
                  <td>{r.CodeNumber}</td>
                  <td>{r.LaborType || ""}</td>
                  <td>{fmtHours(r.LaborHours)}</td>
                  <td>{fmtMoney(r.LaborCost)}</td>
                  <td>{r.Notes}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleDelete(r.LaborId)}
                      disabled={deletingId === r.LaborId}
                      title="Delete this labor item"
                    >
                      {deletingId === r.LaborId ? "Deleting…" : "Clear"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>

          <tfoot
            className="table-secondary"
            style={{ position: "sticky", bottom: 0 }}
          >
            <tr>
              <th colSpan={3}>Totals</th>
              <th>{fmtHours(totals.laborHours)}</th>
              <th>{fmtMoney(totals.laborCost)}</th>
              <th colSpan={2}></th>
            </tr>
          </tfoot>
        </table>
      </div>

      <h5 className="mt-3">Code Number {CODE_NUMBER}</h5>
    </div>
  );
}
