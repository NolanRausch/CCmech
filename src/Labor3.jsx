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

  const CODE_NUMBER = "3000";
  const BLUE = "#0b2a4a";

  // -------------------------
  // reportId helpers (TEMPLATE)
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

      const url = withReport(`${API_BASE}/labor/code/3000`);
      // Helpful debug line when backend is picky:
      console.log("LaborViewer fetchRows:", { url, reportId, CODE_NUMBER });

      const res = await fetch(url, {
        method: "GET",
        headers: reportId ? { "x-report-id": reportId } : undefined,
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `HTTP ${res.status}`);
      }

      const json = await res.json().catch(() => null);
      const list = Array.isArray(json)
        ? json
        : Array.isArray(json?.sample)
        ? json.sample
        : [];

      setRows(list);
    } catch (e) {
      setError(e.message || String(e));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [API_BASE, CODE_NUMBER, reportId, withReport]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const handleDelete = async (laborId) => {
    try {
      setDeletingId(laborId);

      const url = withReport(`${API_BASE}/labor/${encodeURIComponent(laborId)}`);
      console.log("LaborViewer delete:", { url, laborId, reportId });

      const res = await fetch(url, {
        method: "DELETE",
        headers: reportId ? { "x-report-id": reportId } : undefined,
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

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, r) => {
        acc.laborHours += parseNum(r?.LaborHours);
        acc.laborCost += parseNum(r?.LaborCost);
        return acc;
      },
      { laborHours: 0, laborCost: 0 }
    );
  }, [rows, parseNum]);

  const lastSentRef = useRef(null);

  useEffect(() => {
    if (typeof onTotalsChange !== "function") return;

    const payload = {
      cost: Number(totals.laborCost) || 0,
      hours: Number(totals.laborHours) || 0,
      label: "Labor",
    };

    const sig = `${payload.label}:${payload.cost.toFixed(
      4
    )}:${payload.hours.toFixed(4)}`;

    if (lastSentRef.current === sig) return;
    lastSentRef.current = sig;

    onTotalsChange(payload);
  }, [totals.laborCost, totals.laborHours, onTotalsChange]);

  if (loading) return <p className="p-3">Loading...</p>;
  if (error) return <p className="p-3 text-danger">Error: {error}</p>;

  if (selected === 7000) {
    return (
      <BoxViewLabor
        codeNumber={CODE_NUMBER}
        onBack={() => {
          setSelected(null);
          fetchRows();
        }}
      />
    );
  }

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

        {/* Optional: quick visibility when reportId is missing */}
        {!reportId && (
          <span className="badge text-bg-warning ms-auto">
            Missing valid reportId
          </span>
        )}
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
              <th style={{ width: "4rem", backgroundColor: BLUE }}>#</th>
              <th style={{ width: "12rem", backgroundColor: BLUE }}>
                Labor Type
              </th>
              <th style={{ width: "14rem", backgroundColor: BLUE }}>
                Subcontractor Name
              </th>
              <th style={{ width: "7rem", backgroundColor: BLUE }}>Hours</th>
              <th style={{ width: "9rem", backgroundColor: BLUE }}>
                Labor Cost
              </th>
              <th style={{ backgroundColor: BLUE }}>Notes</th>
              <th style={{ width: "7rem", backgroundColor: BLUE }}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((r, i) => (
              <tr key={r.LaborId || `row-${i}`}>
                <td style={{ whiteSpace: "nowrap" }}>{i + 1}</td>

                <td style={{ whiteSpace: "nowrap" }}>{r.LaborType || ""}</td>

                <td style={{ whiteSpace: "nowrap" }}>
                  {isSub(r.LaborType) ? (r.LaborName || "") : ""}
                </td>

                <td style={{ whiteSpace: "nowrap" }}>
                  {fmtHours(r.LaborHours)}
                </td>
                <td style={{ whiteSpace: "nowrap" }}>
                  {fmtMoney(r.LaborCost)}
                </td>

                <td style={{ whiteSpace: "normal", wordBreak: "break-word" }}>
                  {r.Notes}
                </td>

                <td style={{ whiteSpace: "nowrap" }}>
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
              <th colSpan={2}>Totals</th>
              <th></th>
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

