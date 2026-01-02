import { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import BoxView3 from "./BoxView3"; // ✅ editor for Piping

export default function DbTestViewer() {
  const [rows, setRows] = useState([]); // each row gets .Alternates: []
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [selected, setSelected] = useState(null);

  const API_BASE = "https://ccmechconstruction-bjate8cvcha3ecgt.canadacentral-01.azurewebsites.net/api";

  const parseCost = (val) => {
    const n = parseFloat(String(val ?? "").replace(/[^0-9.\-]/g, ""));
    return isNaN(n) ? 0 : n;
  };

  async function fetchAlternates(pipingId) {
    try {
      const res = await fetch(
        `${API_BASE}/piping/alternates/${encodeURIComponent(pipingId)}`
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
      console.warn("Alternates fetch failed for", pipingId, e);
      return [];
    }
  }

  async function fetchRows() {
    try {
      setLoading(true);
      setError(null);

      // 1) Get Piping list
      const res = await fetch(`${API_BASE}/piping`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json = await res.json();
      const list = Array.isArray(json)
        ? json
        : Array.isArray(json?.sample)
        ? json.sample
        : [];

      // 2) For each Piping row, fetch alternates and attach as .Alternates
      const withAlternates = await Promise.all(
        list.map(async (r) => {
          const alts = await fetchAlternates(r.PipingId);
          return { ...r, Alternates: alts, _expand: false };
        })
      );

      setRows(withAlternates);
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRows();
  }, []);

  // DELETE one row by PipingId (backend: DELETE /api/piping/{id})
  const handleDelete = async (pipingId) => {
    try {
      setDeletingId(pipingId);

      const url = `${API_BASE}/piping/${encodeURIComponent(pipingId)}`;
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

      setRows((prev) => prev.filter((r) => r.PipingId !== pipingId));
    } catch (e) {
      alert("Delete failed: " + (e.message || e));
      console.error(e);
    } finally {
      setDeletingId(null);
    }
  };

  const toggleExpand = (id) =>
    setRows((prev) =>
      prev.map((r) => (r.PipingId === id ? { ...r, _expand: !r._expand } : r))
    );

  const totalCost = rows.reduce((sum, r) => {
    const primaryCost = parseCost(r?.Cost);
    const usedAlt = r?.Alternates?.find((a) => Number(a?.IsUsed) === 1);
    const costToUse = usedAlt ? parseCost(usedAlt.Cost) : primaryCost;
    return sum + costToUse;
  }, 0);

  if (loading) return <p className="p-3">Loading...</p>;
  if (error) return <p className="p-3 text-danger">Error: {error}</p>;

  // Editor screen (BoxView3 should also use /piping endpoints)
  if (selected === 1000) {
    return (
      <BoxView3
        number={selected}
        onBack={() => {
          setSelected(null);
          fetchRows(); // ✅ refresh Piping (and alternates) after returning
        }}
      />
    );
  }

  return (
    <div className="container py-4">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h2 className="mb-0">Piping</h2>
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

                return (
                  <>
                    <tr key={r.PipingId || `row-${i}`}>
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
                      <td>{r.Description}</td>
                      <td>{r.Supplier}</td>
                      <td>${parseCost(r.Cost).toFixed(2)}</td>
                      <td>{r.Notes}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => toggleExpand(r.PipingId)}
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
                          onClick={() => handleDelete(r.PipingId)}
                          disabled={deletingId === r.PipingId}
                          title="Delete this Piping item"
                        >
                          {deletingId === r.PipingId ? "Deleting…" : "Clear"}
                        </button>
                      </td>
                    </tr>

                    {r._expand &&
                      (r.Alternates?.length ? (
                        r.Alternates.map((a, ai) => (
                          <tr
                            key={`${r.PipingId}-alt-${ai}`}
                            className="table-light"
                          >
                            <td></td>
                            <td className="ps-4">
                              <span className="badge text-bg-secondary me-2">
                                ALT
                              </span>
                              {a.Description}
                            </td>
                            <td>{a.Supplier}</td>
                            <td>${parseCost(a.Cost).toFixed(2)}</td>
                            <td>{a.Notes}</td>
                            <td colSpan={2}></td>
                          </tr>
                        ))
                      ) : (
                        <tr
                          key={`${r.PipingId}-noalts`}
                          className="table-light"
                        >
                          <td></td>
                          <td className="ps-4 text-muted" colSpan={6}>
                            No alternates
                          </td>
                        </tr>
                      ))}
                  </>
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
              <th>${totalCost.toFixed(2)}</th>
              <th colSpan={3}></th>
            </tr>
          </tfoot>
        </table>
      </div>

      <h5 className="mt-3">Code Number 6000</h5>
    </div>
  );
}
