import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import BoxViewLabor from "./BoxViewLabor";

export default function LaborViewer({ onTotalsChange, reportId: reportIdProp }) {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [selected, setSelected] = useState(null);

  const API_BASE =
    "https://ccmechconstruction-bjate8cvcha3ecgt.canadacentral-01.azurewebsites.net/api";

  const BLUE = "#0b2a4a";

  // ✅ This viewer is for code 1000 only
  const CODE_NUMBER = "1000";

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

  // ✅ read reportId live (so it updates when Home changes it)
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

  const isSub = (t) => String(t || "").trim().toLowerCase() === "subcontractor";

  const parseNum = useCallback((val) => {
    const n = parseFloat(String(val ?? "").replace(/[^0-9.\-]/g, ""));
    return isNaN(n) ? 0 : n;
  }, []);

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

  const fmtHours = useCallback((val) => parseNum(val).toFixed(2), [parseNum]);

  const fetchRows = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!reportId) {
        setRows([]);
        setError("Missing reportId (required).");
        return;
      }

      // ✅ FIX: only get code 1000 rows
      const url = withReport(
        `${API_BASE}/labor/code/${encodeURIComponent(CODE_NUMBER)}`
      );

      const res = await fetch(url, {
        method: "GET",
        headers: { "x-report-id": reportId },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || `HTTP ${res.status}`);
      }

      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.sample)
        ? data.sample
        : [];

      setRows(list);
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }, [API_BASE, CODE_NUMBER, reportId, withReport]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const handleDelete = async (laborId) => {
    try {
      if (!reportId) {
        alert("Delete failed: missing reportId");
        return;
      }

      setDeletingId(laborId);

      const url = withReport(`${API_BASE}/labor/${encodeURIComponent(laborId)}`);
      const res = await fetch(url, {
        method: "DELETE",
        headers: { "x-report-id": reportId },
      });

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

  // ✅ totals ONLY for code 1000 rows (because rows is already filtered)
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
  }, [rows, parseNum]);

  const lastSentRef = useRef(null);

  useEffect(() => {
    if (typeof onTotalsChange !== "function") return;

    const payload = {
      cost: Number(totals.laborCost) || 0,
      hours: Number(totals.laborHours) || 0,
      byType: totals.byType,
      label: `Labor ${CODE_NUMBER}`,
    };

    const sig = `${payload.label}:${payload.cost.toFixed(4)}:${payload.hours.toFixed(
      4
    )}:${payload.byType?.length || 0}`;

    if (lastSentRef.current === sig) return;
    lastSentRef.current = sig;

    onTotalsChange(payload);
  }, [CODE_NUMBER, totals.laborCost, totals.laborHours, totals.byType, onTotalsChange]);

  if (loading) return <p className="p-3">Loading...</p>;
  if (error) return <p className="p-3 text-danger">Error: {error}</p>;

  // ✅ open the editor for code 1000
  if (selected === 7000) {
    return (
      <BoxViewLabor
        codeNumber={CODE_NUMBER}
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
    type: { width: "12rem", maxWidth: "12rem" },
    subName: { width: "14rem", maxWidth: "14rem" },
    hours: { width: "6.5rem", whiteSpace: "nowrap" },
    cost: { width: "9rem", whiteSpace: "nowrap" },
    actions: { width: "7rem", whiteSpace: "nowrap" },
    clamp: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  };

  return (
    <div className="container py-4">
      <div className="d-flex align-items-center gap-3 mb-3">
        <button
          className="btn btn-outline-secondary btn-lg"
          onClick={() => setSelected(7000)}
        >
          Input
        </button>

        <h5 className="mb-0" style={{ color: BLUE, textTransform: "uppercase" }}>
         Labor
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
              <th style={{ ...col.type, backgroundColor: BLUE }}>Labor Type</th>
              <th style={{ ...col.subName, backgroundColor: BLUE }}>
                Subcontractor Name
              </th>
              <th style={{ ...col.hours, backgroundColor: BLUE }}>Hours</th>
              <th style={{ ...col.cost, backgroundColor: BLUE }}>Labor Cost</th>
              <th style={{ backgroundColor: BLUE }}>Notes</th>
              <th style={{ ...col.actions, backgroundColor: BLUE }}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((r, i) => (
              <tr key={r.LaborId || `row-${i}`}>
                <td style={col.idx}>{i + 1}</td>

                <td style={{ ...col.type, ...col.clamp }}>{r.LaborType || ""}</td>

                <td style={{ ...col.subName, ...col.clamp }}>
                  {isSub(r.LaborType) ? (r.LaborName || "") : ""}
                </td>

                <td style={col.hours}>{fmtHours(r.LaborHours)}</td>
                <td style={col.cost}>{fmtMoney(r.LaborCost)}</td>

                <td style={{ whiteSpace: "normal", wordBreak: "break-word" }}>
                  {r.Notes}
                </td>

                <td style={col.actions}>
                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => handleDelete(r.LaborId)}
                    disabled={deletingId === r.LaborId}
                  >
                    {deletingId === r.LaborId ? "Deleting…" : "Clear"}
                  </button>
                </td>
              </tr>
            ))}
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

      <style>{`
        .table-fixed { table-layout: fixed; width: 100%; }
      `}</style>
    </div>
  );
}