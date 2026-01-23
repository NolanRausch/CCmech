import { useEffect, useMemo, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import BoxViewLabor from "./BoxViewLabor"; // ✅ make this editor use /labor endpoints

export default function LaborViewer() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [selected, setSelected] = useState(null);

  const API_BASE =
    "https://ccmechconstruction-bjate8cvcha3ecgt.canadacentral-01.azurewebsites.net/api";

  // change this if you want the viewer locked to a code
  const CODE_NUMBER = "7000";

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

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, r) => {
        acc.laborHours += parseNum(r?.LaborHours);
        acc.laborCost += parseNum(r?.LaborCost);
        return acc;
      },
      { laborHours: 0, laborCost: 0 }
    );
  }, [rows]);

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
