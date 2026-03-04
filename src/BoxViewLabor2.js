import React, { useCallback, useEffect, useMemo, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";

const API_BASE =
  "https://ccmechconstruction-bjate8cvcha3ecgt.canadacentral-01.azurewebsites.net/api";

// ✅ Rates (per hour) for hourly types
const HOURLY_RATES = {
  Welding: 70,
  Mech: 75,
  Service: 75,
};

// ✅ All dropdown options (stored in LaborType)
const LABOR_TYPES = ["Welding", "Mech", "Service", "Subcontractor", "Engineering"];

// -------------------------
// reportId helpers (match other viewers)
// -------------------------
const isGuid = (v) =>
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(
    String(v || "").trim().replace(/[{}]/g, "")
  );

const normalizeGuid = (v) => {
  const s = String(v || "").trim().replace(/[{}]/g, "");
  return isGuid(s) ? s.toLowerCase() : "";
};

export default function BoxViewLabor({
  codeNumber = "2000",
  onBack,
  reportId: reportIdProp,
}) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [deletedIds, setDeletedIds] = useState([]);

  // ✅ reportId resolution: prop -> window.__REPORT_ID__ -> localStorage("ccms_report_id")
  const reportId = useMemo(() => {
    const fromProp = normalizeGuid(reportIdProp);
    if (fromProp) return fromProp;

    const fromGlobal = normalizeGuid(window.__REPORT_ID__);
    if (fromGlobal) return fromGlobal;

    const fromLS = normalizeGuid(localStorage.getItem("ccms_report_id"));
    if (fromLS) return fromLS;

    return "";
  }, [reportIdProp]);

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

  const blank = useMemo(
    () => ({
      laborId: undefined,
      codeNumber: String(codeNumber ?? ""),
      laborType: "", // one of LABOR_TYPES
      laborHours: "",
      laborCost: "",
      notes: "",
      isExisting: false,
    }),
    [codeNumber]
  );

  const parseNum = useCallback((val) => {
    const n = parseFloat(String(val ?? "").replace(/[^0-9.\-]/g, ""));
    return isNaN(n) ? 0 : n;
  }, []);

  const fmtMoney = useCallback((n) => `$${parseNum(n).toFixed(2)}`, [parseNum]);
  const fmtHours = useCallback((n) => parseNum(n).toFixed(2), [parseNum]);

  const isHourlyType = useCallback(
    (t) => Object.prototype.hasOwnProperty.call(HOURLY_RATES, String(t || "")),
    []
  );

  const isManualCostType = useCallback(
    (t) => String(t) === "Subcontractor" || String(t) === "Engineering",
    []
  );

  const computeCostForRow = useCallback(
    (r) => {
      const t = String(r?.laborType ?? "");
      if (!isHourlyType(t)) return r?.laborCost ?? "";
      const rate = HOURLY_RATES[t];
      const hours = parseNum(r?.laborHours);
      return (hours * rate).toFixed(2);
    },
    [isHourlyType, parseNum]
  );

  const normalizeRowAfterTypeChange = useCallback(
    (r, nextType) => {
      const t = String(nextType || "");

      // Manual-cost types: hours should display as NA and payload hours should be null
      if (isManualCostType(t)) {
        return { ...r, laborType: t, laborHours: "NA" };
      }

      // Hourly types: hours should be editable; if it was NA, clear it
      if (isHourlyType(t)) {
        const next = {
          ...r,
          laborType: t,
          laborHours: r.laborHours === "NA" ? "" : r.laborHours,
        };
        return { ...next, laborCost: computeCostForRow(next) };
      }

      return { ...r, laborType: t };
    },
    [computeCostForRow, isHourlyType, isManualCostType]
  );

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!reportId) {
        setRows([{ ...blank }]);
        setDeletedIds([]);
        setError("Missing reportId (required).");
        return;
      }

      const { res, data } = await fetchJson(
        withReport(`${API_BASE}/labor/code/${encodeURIComponent(String(codeNumber))}`),
        { method: "GET" }
      );
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);

      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.sample)
        ? data.sample
        : [];

      const mapped = list.map((r) => {
        const laborType = String(r.LaborType ?? "");
        const base = {
          laborId: r.LaborId,
          codeNumber: r.CodeNumber ?? String(codeNumber ?? ""),
          laborType,
          laborHours: r.LaborHours ?? "",
          laborCost: r.LaborCost ?? "",
          notes: r.Notes ?? "",
          isExisting: true,
        };

        // Enforce UI rules on load
        if (isManualCostType(base.laborType)) {
          return { ...base, laborHours: "NA" };
        }
        if (isHourlyType(base.laborType)) {
          return { ...base, laborCost: computeCostForRow(base) };
        }
        return base;
      });

      mapped.push({ ...blank });

      setRows(mapped);
      setDeletedIds([]);
    } catch (e) {
      setError(e.message || String(e));
      setRows([{ ...blank }]);
      setDeletedIds([]);
    } finally {
      setLoading(false);
    }
  }, [
    API_BASE,
    blank,
    codeNumber,
    computeCostForRow,
    fetchJson,
    isHourlyType,
    isManualCostType,
    reportId,
    withReport,
  ]);

  // ✅ IMPORTANT: reload when reportId changes (this is why code1000 updates but code2000 didn't)
  useEffect(() => {
    load();
  }, [load]);

  const updateRow = (idx, patch) =>
    setRows((prev) =>
      prev.map((r, i) => {
        if (i !== idx) return r;
        const next = { ...r, ...patch };
        const t = String(next.laborType ?? "");

        // Hours changed on hourly types => recompute cost
        if ("laborHours" in patch && isHourlyType(t)) next.laborCost = computeCostForRow(next);

        // Cost edits on hourly types => ignore (computed)
        if ("laborCost" in patch && isHourlyType(t)) next.laborCost = computeCostForRow(next);

        // Prevent editing hours for manual-cost types (keep NA)
        if ("laborHours" in patch && isManualCostType(t)) next.laborHours = "NA";

        return next;
      })
    );

  const setLaborType = (idx, nextType) =>
    setRows((prev) =>
      prev.map((r, i) => (i === idx ? normalizeRowAfterTypeChange(r, nextType) : r))
    );

  const addRow = () => setRows((prev) => [...prev, { ...blank }]);

  const removeRow = (idx) => {
    setRows((prev) => {
      const row = prev[idx];
      if (row?.isExisting && row?.laborId) {
        setDeletedIds((d) => Array.from(new Set([...d, row.laborId])));
      }
      return prev.filter((_, i) => i !== idx);
    });
  };

  const isEmpty = useCallback(
    (r) => {
      const t = String(r?.laborType ?? "");
      const hasType = LABOR_TYPES.includes(t);

      if (!hasType) return !(r?.notes && r.notes.trim());

      if (isHourlyType(t)) {
        const hasHours =
          r?.laborHours !== "" && r?.laborHours != null && r?.laborHours !== "NA";
        const hasNotes = r?.notes && r.notes.trim();
        return !(hasHours || hasNotes);
      }

      // Manual-cost types
      const hasCost = r?.laborCost !== "" && r?.laborCost != null;
      const hasNotes = r?.notes && r.notes.trim();
      return !(hasCost || hasNotes);
    },
    [isHourlyType]
  );

  const toPayload = useCallback(
    (r) => {
      const laborType = r?.laborType ? String(r.laborType) : null;
      const t = String(laborType ?? "");

      let laborHours =
        r.laborHours === "NA" || r.laborHours === "" || r.laborHours == null
          ? null
          : Number(r.laborHours);

      let laborCost = r.laborCost === "" || r.laborCost == null ? null : Number(r.laborCost);

      if (isHourlyType(t)) {
        laborCost = Number(computeCostForRow(r));
      } else if (isManualCostType(t)) {
        laborHours = null;
      }

      return {
        reportId, // ✅ required for POST/PUT per your backend rules
        CodeNumber: String(codeNumber ?? ""),
        LaborType: laborType,
        LaborHours: laborHours,
        LaborCost: laborCost,
        Notes: r.notes ? String(r.notes) : null,
      };
    },
    [codeNumber, computeCostForRow, isHourlyType, isManualCostType, reportId]
  );

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, r) => {
        if (isEmpty(r)) return acc;
        const t = String(r?.laborType ?? "");

        if (isHourlyType(t)) {
          if (r.laborHours !== "NA") acc.hours += parseNum(r.laborHours);
          acc.cost += parseNum(computeCostForRow(r));
        } else if (isManualCostType(t)) {
          acc.cost += parseNum(r.laborCost);
        }
        return acc;
      },
      { hours: 0, cost: 0 }
    );
  }, [rows, computeCostForRow, isEmpty, isHourlyType, isManualCostType, parseNum]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError(null);

      if (!reportId) {
        alert("❌ Missing reportId (required).");
        return;
      }

      // 1) Delete removed existing rows (DELETE uses query/header)
      for (const id of deletedIds) {
        const { res, data } = await fetchJson(
          withReport(`${API_BASE}/labor/${encodeURIComponent(id)}`),
          { method: "DELETE" }
        );
        if (!res.ok) {
          throw new Error(data?.error || `DELETE failed for ${id} (HTTP ${res.status})`);
        }
      }

      // 2) Upsert remaining rows
      for (const r of rows) {
        if (!r || isEmpty(r)) continue;

        // Existing -> PUT
        if (r.isExisting && r.laborId) {
          const { res, data } = await fetchJson(
            withReport(`${API_BASE}/labor/${encodeURIComponent(r.laborId)}`),
            { method: "PUT", body: JSON.stringify(toPayload(r)) }
          );
          if (!res.ok) throw new Error(data?.error || `PUT failed (HTTP ${res.status})`);
          continue;
        }

        // New -> POST
        const { res, data } = await fetchJson(withReport(`${API_BASE}/labor`), {
          method: "POST",
          body: JSON.stringify(toPayload(r)),
        });
        if (!res.ok) throw new Error(data?.error || `POST failed (HTTP ${res.status})`);
      }

      alert("✅ Labor saved!");
      await load();
    } catch (e2) {
      console.error("❌ Labor submit error:", e2);
      setError(e2.message || String(e2));
      alert("❌ Save failed: " + (e2.message || e2));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="p-3">Loading…</p>;
  if (error) return <p className="p-3 text-danger">Error: {error}</p>;

  return (
    <div className="container py-4">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div>
          <div className="text-muted">Labor Input</div>
          <div className="small text-muted">
            Report:{" "}
            {reportId ? (
              <span className="font-monospace">{reportId}</span>
            ) : (
              <span className="text-danger">missing reportId</span>
            )}
          </div>
        </div>

        <div className="d-flex gap-2">
          <button type="button" className="btn btn-outline-primary" onClick={addRow}>
            + Add Labor Row
          </button>
          <button type="button" className="btn btn-dark" onClick={onBack}>
            Back
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="table-responsive">
          <table className="table table-striped table-hover table-sm align-middle">
            <thead className="table-dark">
              <tr>
                <th style={{ width: "4rem" }}>#</th>
                <th style={{ width: "12rem" }}>Labor Type</th>
                <th style={{ width: "8rem" }}>Hours</th>
                <th style={{ width: "9rem" }}>Labor Cost</th>
                <th>Notes</th>
                <th style={{ width: "7rem" }}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((r, i) => {
                const t = String(r?.laborType ?? "");
                const hourly = isHourlyType(t);
                const manual = isManualCostType(t);

                const costValue = hourly ? computeCostForRow(r) : r.laborCost;

                return (
                  <tr key={r.laborId || `new-${i}`}>
                    <td>{i + 1}</td>

                    <td>
                      <select
                        className="form-select form-select-sm"
                        value={t}
                        onChange={(e) => setLaborType(i, e.target.value)}
                      >
                        <option value="">Select…</option>
                        {LABOR_TYPES.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>

                      <div className="text-muted small mt-1">
                        {hourly
                          ? `Rate: $${HOURLY_RATES[t]}/hr (Cost auto)`
                          : manual
                          ? "Manual cost"
                          : ""}
                      </div>
                    </td>

                    <td>
                      {hourly ? (
                        <input
                          className="form-control form-control-sm"
                          type="number"
                          step="0.25"
                          min="0"
                          value={r.laborHours === "NA" ? "" : r.laborHours}
                          onChange={(e) => updateRow(i, { laborHours: e.target.value })}
                          placeholder="0.00"
                        />
                      ) : (
                        <span className="text-muted small">NA</span>
                      )}
                    </td>

                    <td>
                      <input
                        className="form-control form-control-sm"
                        type="number"
                        step="0.01"
                        min="0"
                        value={costValue}
                        onChange={(e) => updateRow(i, { laborCost: e.target.value })}
                        placeholder="0.00"
                        readOnly={hourly} // ✅ computed for Welding/Mech/Service
                      />
                    </td>

                    <td>
                      <input
                        className="form-control form-control-sm"
                        value={r.notes}
                        onChange={(e) => updateRow(i, { notes: e.target.value })}
                        placeholder="Optional notes…"
                      />
                    </td>

                    <td>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => removeRow(i)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>

            <tfoot className="table-secondary">
              <tr>
                <th colSpan={2}>Totals</th>
                <th>{fmtHours(totals.hours)}</th>
                <th>{fmtMoney(totals.cost)}</th>
                <th colSpan={2}></th>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="d-flex gap-2 mt-3">
          <button type="submit" className="btn btn-secondary" disabled={saving || !reportId}>
            {saving ? "Saving…" : "Submit changes"}
          </button>
        </div>

        <div className="text-muted mt-2 small">
          Note: Removing an existing row will delete it on submit.
        </div>
      </form>
    </div>
  );
}