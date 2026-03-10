import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import BoxView1 from "./BoxView1";

export default function DbTestViewer({ onTotalsChange, reportId: reportIdProp }) {
  // 🔧 All hooks at the top
  const [rows, setRows] = useState([]); // each row gets .Alternates: []
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [selected, setSelected] = useState(null);

  const API_BASE =
    "https://ccmechconstruction-bjate8cvcha3ecgt.canadacentral-01.azurewebsites.net/api";

  const BLUE = "#0b2a4a"; // ✅ same blue as header bar

  // -------------------------
  // reportId helpers
  // -------------------------
  const isGuid = useCallback((v) => {
    return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(
      String(v || "").trim().replace(/[{}]/g, "")
    );
  }, []);

  const normalizeGuid = useCallback(
    (v) => {
      const s = String(v || "").trim().replace(/[{}]/g, "");
      return isGuid(s) ? s.toLowerCase() : "";
    },
    [isGuid]
  );

  // ✅ FIXED: prefer prop -> window.__REPORT_ID__ -> localStorage("ccms_report_id")
  const reportId = useMemo(() => {
    const fromProp = normalizeGuid(reportIdProp);
    if (fromProp) return fromProp;

    const fromGlobal = normalizeGuid(window.__REPORT_ID__);
    if (fromGlobal) return fromGlobal;

    const fromLS = normalizeGuid(localStorage.getItem("ccms_report_id"));
    if (fromLS) return fromLS;

    return "";
  }, [reportIdProp, normalizeGuid]);

  const withReport = useCallback(
    (url) => {
      if (!reportId) return url;
      const hasQ = url.includes("?");
      return `${url}${hasQ ? "&" : "?"}reportId=${encodeURIComponent(reportId)}`;
    },
    [reportId]
  );

  const fetchJson = useCallback(
    async (url, opts = {}) => {
      const headers = {
        ...(opts.headers || {}),
        "Content-Type": "application/json",
        ...(reportId ? { "x-report-id": reportId } : {}),
      };

      const res = await fetch(url, { ...opts, headers });
      const data = await res.json().catch(() => ({}));
      return { res, data };
    },
    [reportId]
  );

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
    const usedAlt = alternates.find(
      (a) => Number(a?.IsUsed) === 1 || a?.IsUsed === true
    );
    return usedAlt || primary;
  }, []);

  // ✅ IMPORTANT: normalize equipment id from any casing the API returns
  const getEquipmentId = useCallback((r) => {
    return (
      r?.EquipmentId ??
      r?.equipmentId ??
      r?.EQUIPMENTID ??
      r?.id ??
      r?.Id ??
      r?.ID ??
      ""
    );
  }, []);

const fetchAlternates = useCallback(
  async (equipmentId) => {
    console.log("🔥 fetchAlternates called", { equipmentId, reportId });

    if (!reportId) return [];
    if (!equipmentId) return [];

    try {
      const rawUrl = `${API_BASE}/equipment/alternates/${encodeURIComponent(equipmentId)}`;
      const finalUrl = withReport(rawUrl);

      // ✅ THESE ARE THE IMPORTANT LOGS
      console.log("RAW URL:", rawUrl);
      console.log("FINAL URL:", finalUrl);
      console.log("REPORT ID:", reportId);

      const { res, data } = await fetchJson(finalUrl, { method: "GET" });

      if (!res.ok) {
        console.warn("Alternates GET not ok:", res.status, data);
        return [];
      }

      return Array.isArray(data) ? data : [];
    } catch (e) {
      console.warn("Alternates fetch failed for", equipmentId, e);
      return [];
    }
  },
  [API_BASE, fetchJson, reportId, withReport]
);

  const fetchRows = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!reportId) {
        setRows([]);
        setError("Missing reportId (required).");
        return;
      }

      const { res, data } = await fetchJson(withReport(`${API_BASE}/equipment`), {
        method: "GET",
      });

      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);

      const list = Array.isArray(data) ? data : [];

      const withAlternates = await Promise.all(
        list.map(async (r) => {
          const eid = getEquipmentId(r);
          const alts = await fetchAlternates(eid);
          return { ...r, _eid: eid, Alternates: alts, _expand: false };
        })
      );

      setRows(withAlternates);
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }, [API_BASE, fetchAlternates, fetchJson, reportId, withReport, getEquipmentId]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const toggleExpand = useCallback((eid) => {
    setRows((prev) =>
      prev.map((r) => (r._eid === eid ? { ...r, _expand: !r._expand } : r))
    );
  }, []);

  const handleDelete = async (equipmentId) => {
    try {
      if (!reportId) {
        alert("Delete failed: missing reportId");
        return;
      }
      if (!equipmentId) {
        alert("Delete failed: missing equipmentId");
        return;
      }

      setDeletingId(equipmentId);

      const url = withReport(
        `${API_BASE}/equipment/${encodeURIComponent(equipmentId)}`
      );
      const { res, data } = await fetchJson(url, { method: "DELETE" });

      if (!res.ok) {
        throw new Error(
          typeof data === "string" ? data : data?.error || `HTTP ${res.status}`
        );
      }

      setRows((prev) => prev.filter((r) => r._eid !== equipmentId));
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
        const chosen = pickUsedOrPrimary(r, r?.Alternates || []);
        acc.materialCost += parseNum(chosen?.Cost);
        return acc;
      },
      { materialCost: 0 }
    );
  }, [rows, pickUsedOrPrimary, parseNum]);

  const totalCost = totals.materialCost;

  const lastSentRef = useRef(null);

  useEffect(() => {
    if (typeof onTotalsChange !== "function") return;

    const payload = { cost: Number(totalCost) || 0, label: "Equipment" };
    const sig = `${payload.label}:${payload.cost.toFixed(4)}`;

    if (lastSentRef.current === sig) return;
    lastSentRef.current = sig;

    onTotalsChange(payload);
  }, [totalCost, onTotalsChange]);

  if (loading) return <p className="p-3">Loading...</p>;
  if (error) return <p className="p-3 text-danger">Error: {error}</p>;

  if (selected === 1000) {
    return (
      <BoxView1
        number={selected}
        reportId={reportId}
        onBack={() => {
          setSelected(null);
          fetchRows();
        }}
      />
    );
  }

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
      <div className="d-flex align-items-center gap-3 mb-3">
        <button
          className="btn btn-outline-secondary btn-lg"
          onClick={() => setSelected(1000)}
        >
          Input
        </button>

        <div>
          <h5 className="mb-0" style={{ color: BLUE, textTransform: "uppercase" }}>
            Code 1000 - Equipment: RTU&apos;s, Chillers, Boilers, Pumps, Towers,
            VRF, Splits
          </h5>
        </div>
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
              <th style={{ backgroundColor: BLUE }}>Notes</th>
              <th style={{ ...col.alternates, backgroundColor: BLUE }}>Alternates</th>
              <th style={{ ...col.actions, backgroundColor: BLUE }}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((r, i) => {
              const eid = r._eid || getEquipmentId(r);
              const hasUsedAlt = r?.Alternates?.some(
                (a) => Number(a?.IsUsed) === 1 || a?.IsUsed === true
              );
              const chosen = pickUsedOrPrimary(r, r?.Alternates || []);

              return (
                <React.Fragment key={eid || `rowwrap-${i}`}>
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
                        onClick={() => toggleExpand(eid)}
                        title="Show/Hide alternates"
                        disabled={!eid}
                      >
                        {r._expand
                          ? `Hide (${r.Alternates?.length || 0})`
                          : `Show (${r.Alternates?.length || 0})`}
                      </button>
                    </td>

                    <td style={col.actions}>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDelete(eid)}
                        disabled={deletingId === eid || !eid}
                        title="Delete this equipment"
                      >
                        {deletingId === eid ? "Deleting…" : "Clear"}
                      </button>
                    </td>
                  </tr>

                  {r._expand &&
                    (r.Alternates?.length ? (
                      r.Alternates.map((a, ai) => (
                        <tr
                          key={`${eid}-alt-${a?.AlternateId || a?.alternateId || ai}`}
                          className="table-light"
                        >
                          <td style={col.idx}></td>

                          <td className="ps-4" style={{ ...col.desc }}>
                            <span className="badge text-bg-secondary me-2">ALT</span>
                            {a.Description}
                            {(Number(a?.IsUsed) === 1 || a?.IsUsed === true) && (
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
    <th></th>
    <th>Total</th>
    <th></th>
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