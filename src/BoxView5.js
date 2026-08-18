import React, { useCallback, useEffect, useMemo, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";

const API_BASE =
  "https://ccmechconstruction-bjate8cvcha3ecgt.canadacentral-01.azurewebsites.net/api";

const blank = { description: "", supplier: "", cost: "", notes: "" };
const blankAlt = {
  ...blank,
  used: false,
  isExistingAlt: false,
  alternateId: undefined,
};

const DESCRIPTION_OPTIONS = [
  "Control Wiring",
  "Power Wiring",
  "Fire Alarm",
];

// ---------- Reusable row ----------
function GridRow({
  label,
  value,
  onChange,
  showUsed = false,
  onRemove,
  removable = false,
}) {
  const handle = (field) => (e) =>
    onChange({ ...value, [field]: e.target.value });

  const descriptionListId = useMemo(
    () =>
      `description-options-${String(label)
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-_]/g, "")}`,
    [label]
  );

  return (
    <div className="card mb-3">
      <div className="card-header d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center gap-3">
          <strong>{label}</strong>

          {showUsed && (
            <div className="form-check">
              <input
                className="form-check-input"
                id={`${label}-used`}
                type="checkbox"
                checked={!!value.used}
                onChange={(e) =>
                  onChange({ ...value, used: e.target.checked })
                }
              />
              <label className="form-check-label" htmlFor={`${label}-used`}>
                Use this option
              </label>
            </div>
          )}
        </div>

        {removable && (
          <button
            type="button"
            className="btn btn-sm btn-outline-danger"
            onClick={onRemove}
          >
            Remove
          </button>
        )}
      </div>

      <div className="card-body">
        <table className="table table-sm align-middle mb-0">
          <thead>
            <tr>
              <th style={{ width: "28%" }}>Description</th>
              <th style={{ width: "22%" }}>Supplier</th>
              <th style={{ width: "15%" }}>Cost</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <input
                  className="form-control"
                  type="text"
                  list={descriptionListId}
                  value={value.description}
                  onChange={handle("description")}
                  placeholder="Select or type description"
                />
                <datalist id={descriptionListId}>
                  {DESCRIPTION_OPTIONS.map((option) => (
                    <option key={option} value={option} />
                  ))}
                </datalist>
              </td>
              <td>
                <input
                  className="form-control"
                  type="text"
                  value={value.supplier}
                  onChange={handle("supplier")}
                  placeholder="e.g., ACME Supply"
                />
              </td>
              <td>
                <input
                  className="form-control"
                  type="number"
                  step="0.01"
                  min="0"
                  value={value.cost}
                  onChange={handle("cost")}
                  placeholder="0.00"
                />
              </td>
              <td>
                <input
                  className="form-control"
                  type="text"
                  value={value.notes}
                  onChange={handle("notes")}
                  placeholder="Optional notes…"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------- One section: [primary, ...alternates] ----------
function Section({ idx, options, onChange, onRemoveSection }) {
  const [expanded, setExpanded] = useState(false);
  const MAX_ALTS = 8;

  const updateOpt = (optIndex, next) => {
    const nextOptions = options.map((o, i) => (i === optIndex ? next : o));
    onChange(idx, nextOptions);
  };

  const addAlternate = () => {
    const alts = options.length - 1;
    if (alts >= MAX_ALTS) return;
    onChange(idx, [...options, { ...blankAlt }]);
  };

  const removeAlternate = (optIndex) => {
    const next = options.filter((_, i) => i !== optIndex);
    onChange(idx, next);
  };

  return (
    <div className="mb-4">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={() => setExpanded((v) => !v)}
            title={expanded ? "Hide alternates" : "Show alternates"}
            aria-expanded={expanded}
          >
            {expanded ? "▾" : "▸"}
          </button>

          <h6 className="mb-0">Item {idx + 1}</h6>

          <span className="text-muted small">
            {Math.max(0, options.length - 1)} alternate
            {options.length - 1 === 1 ? "" : "s"}
          </span>
        </div>

        {onRemoveSection && (
          <button
            type="button"
            className="btn btn-outline-danger btn-sm"
            onClick={() => onRemoveSection(idx)}
          >
            Remove Item
          </button>
        )}
      </div>

      {/* Primary */}
      <GridRow
        label="Primary"
        value={options[0]}
        onChange={(next) => updateOpt(0, next)}
        showUsed={false}
      />

      {/* Alternates */}
      {expanded && (
        <div className="ms-4">
          {options.slice(1).map((alt, i) => {
            const optIndex = i + 1;
            return (
              <GridRow
                key={optIndex}
                label={`Alternate ${optIndex}`}
                value={alt}
                onChange={(next) => updateOpt(optIndex, next)}
                showUsed
                removable
                onRemove={() => removeAlternate(optIndex)}
              />
            );
          })}

          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={addAlternate}
            disabled={options.length - 1 >= MAX_ALTS}
            title={
              options.length - 1 >= MAX_ALTS
                ? "Reached max alternates"
                : "Add alternate"
            }
          >
            + Add Alternate
          </button>
        </div>
      )}
    </div>
  );
}

// =====================================================
// ELECTRICAL EDITOR (Primary + AlternateElectrical)
// "like the other ones": Home button saves+back, no Submit button
// =====================================================
export default function BoxView4({ number, onBack, reportId: reportIdProp }) {
  const starter = useMemo(
    () => [
      { ...blank, isExisting: false, electricalId: undefined },
      { ...blankAlt },
      { ...blankAlt },
    ],
    []
  );

  // -------------------------
  // reportId helpers (match other viewers)
  // -------------------------
  const isGuid = useCallback((v) => {
    return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
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

  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const addSection = useCallback(() => {
    setSections((s) => [...s, starter.map((o) => ({ ...o }))]);
  }, [starter]);

  const updateSection = useCallback((sectionIndex, nextOptions) => {
    setSections((s) =>
      s.map((opts, i) => (i === sectionIndex ? nextOptions : opts))
    );
  }, []);

  const removeSection = useCallback((sectionIndex) => {
    setSections((s) => s.filter((_, i) => i !== sectionIndex));
  }, []);

  const isEmpty = useCallback((it) => {
    return (
      (!it?.description || !it.description.trim()) &&
      (!it?.supplier || !it.supplier.trim()) &&
      (!it?.cost && it?.cost !== 0) &&
      (!it?.notes || !it.notes.trim())
    );
  }, []);

  // -------------------------
  // LOAD primaries + alternates (report endpoints)
  // -------------------------
  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!reportId) {
        setSections([]);
        setError("Missing reportId (required).");
        return;
      }

      const { res, data } = await fetchJson(withReport(`${API_BASE}/electrical`), {
        method: "GET",
      });
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);

      const rows = Array.isArray(data) ? data : Array.isArray(data?.sample) ? data.sample : [];

      const formatted = await Promise.all(
        rows.map(async (r) => {
          const electricalId = r.ElectricalId;

          const primary = {
            description: r.Description ?? "",
            supplier: r.Supplier ?? "",
            cost: r.Cost ?? "",
            notes: r.Notes ?? "",
            isExisting: true,
            electricalId,
          };

          let alternates = [];
          try {
            const { res: altRes, data: altJson } = await fetchJson(
              withReport(
                `${API_BASE}/electrical/alternates/${encodeURIComponent(electricalId)}`
              ),
              { method: "GET" }
            );

            if (altRes.ok) {
              const altRows = Array.isArray(altJson)
                ? altJson
                : Array.isArray(altJson?.sample)
                ? altJson.sample
                : [];

              alternates = altRows.map((a) => ({
                description: a.Description ?? "",
                supplier: a.Supplier ?? "",
                cost: a.Cost ?? "",
                notes: a.Notes ?? "",
                used: Number(a.IsUsed) === 1 || a.IsUsed === true,
                isExistingAlt: true,
                alternateId: a.AlternateId,
              }));
            }
          } catch (err) {
            console.warn("Failed to load alternates for", electricalId, err);
          }

          alternates.push({ ...blankAlt });
          return [primary, ...alternates];
        })
      );

      setSections(formatted.length ? formatted : [starter.map((o) => ({ ...o }))]);
    } catch (e) {
      setError(e.message || String(e));
      setSections([starter.map((o) => ({ ...o }))]);
    } finally {
      setLoading(false);
    }
  }, [fetchJson, reportId, starter, withReport]);

  useEffect(() => {
    load();
  }, [load]);

  // -------------------------
  // SAVE helper (runs on Home)
  // -------------------------
  const submitAll = useCallback(async () => {
    if (!reportId) throw new Error("Missing reportId (required).");

    for (const [itemIndex, row] of sections.entries()) {
      const primary = row?.[0];
      if (!primary || isEmpty(primary)) continue;

      const costCode = String(5001 + itemIndex);

      // Existing Electrical
      if (primary.isExisting && primary.electricalId) {
        const electricalId = primary.electricalId;

        // UPDATE primary
        {
          const { res: updRes, data: updData } = await fetchJson(
            withReport(`${API_BASE}/electrical/${encodeURIComponent(electricalId)}`),
            {
              method: "PUT",
              body: JSON.stringify({
                reportId,
                Description: String(primary.description ?? ""),
                Supplier: String(primary.supplier ?? ""),
                Cost: String(primary.cost ?? ""),
                CostCodes: costCode,
                Notes: String(primary.notes ?? ""),
              }),
            }
          );

          if (!updRes.ok) {
            throw new Error(`Electrical UPDATE failed: ${JSON.stringify(updData)}`);
          }
        }

        // Alternates: update existing, post new
        for (const alt of row.slice(1)) {
          if (!alt || isEmpty(alt)) continue;

          // Existing alternate -> PUT
          if (alt.isExistingAlt && alt.alternateId) {
            const { res: altUpdRes, data: altUpdData } = await fetchJson(
              withReport(
                `${API_BASE}/electrical/alternates/${encodeURIComponent(alt.alternateId)}`
              ),
              {
                method: "PUT",
                body: JSON.stringify({
                  reportId,
                  Description: String(alt.description ?? ""),
                  Supplier: String(alt.supplier ?? ""),
                  Cost: String(alt.cost ?? ""),
                  CostCodes: costCode,
                  Notes: String(alt.notes ?? ""),
                  IsUsed: alt.used ? 1 : 0,
                }),
              }
            );

            if (!altUpdRes.ok) {
              throw new Error(
                `AlternateElectrical UPDATE failed: ${JSON.stringify(altUpdData)}`
              );
            }
            continue;
          }

          // New alt -> POST
          if (!alt.isExistingAlt) {
            const { res: altRes, data: altData } = await fetchJson(
              withReport(`${API_BASE}/electrical/alternates`),
              {
                method: "POST",
                body: JSON.stringify({
                  reportId,
                  ElectricalId: electricalId,
                  Description: String(alt.description ?? ""),
                  Supplier: String(alt.supplier ?? ""),
                  Cost: String(alt.cost ?? ""),
                  CostCodes: costCode,
                  Notes: String(alt.notes ?? ""),
                  IsUsed: alt.used ? 1 : 0,
                }),
              }
            );

            if (!altRes.ok) {
              throw new Error(`AlternateElectrical POST failed: ${JSON.stringify(altData)}`);
            }
          }
        }

        continue;
      }

      // New Electrical -> POST
      const { res: createRes, data: createData } = await fetchJson(
        withReport(`${API_BASE}/electrical`),
        {
          method: "POST",
          body: JSON.stringify({
            reportId,
            Description: String(primary.description ?? ""),
            Supplier: String(primary.supplier ?? ""),
            Cost: String(primary.cost ?? ""),
            CostCodes: costCode,
            Notes: String(primary.notes ?? ""),
          }),
        }
      );

      if (!createRes.ok) {
        throw new Error(`Electrical POST failed: ${JSON.stringify(createData)}`);
      }

      const electricalId =
        createData.ElectricalId || createData.electricalId || createData.id;

      if (!electricalId) throw new Error("ElectricalId missing from Electrical POST response");

      for (const alt of row.slice(1)) {
        if (!alt || isEmpty(alt)) continue;

        const { res: altRes, data: altData } = await fetchJson(
          withReport(`${API_BASE}/electrical/alternates`),
          {
            method: "POST",
            body: JSON.stringify({
              reportId,
              ElectricalId: electricalId,
              Description: String(alt.description ?? ""),
              Supplier: String(alt.supplier ?? ""),
              Cost: String(alt.cost ?? ""),
              CostCodes: costCode,
              Notes: String(alt.notes ?? ""),
              IsUsed: alt.used ? 1 : 0,
            }),
          }
        );

        if (!altRes.ok) {
          throw new Error(`AlternateElectrical POST failed: ${JSON.stringify(altData)}`);
        }
      }
    }
  }, [fetchJson, isEmpty, reportId, sections, withReport]);

  // ✅ Home button: save, refresh, then go back (no submit button)
  const onHomeClick = useCallback(async () => {
    if (saving) return;

    try {
      setSaving(true);
      setError(null);

      await submitAll();

      alert("✅ Saved!");
      await load();
      onBack?.();
    } catch (e) {
      console.error("❌ Save error:", e);
      setError(e.message || String(e));
      alert("❌ Save failed: " + (e.message || e));
    } finally {
      setSaving(false);
    }
  }, [load, onBack, saving, submitAll]);

  if (loading) return <p className="p-3">Loading…</p>;
  if (error) return <p className="p-3 text-danger">Error: {error}</p>;

  return (
    <div className="container py-4">
      {/* TOP BAR like the others: Home (save+back) + Add */}
      <div className="d-flex align-items-center justify-content-between mb-3">
        <button
          type="button"
          className="btn btn-dark"
          onClick={onHomeClick}
          disabled={saving || !reportId}
        >
          {saving ? "Saving..." : "Save"}
        </button>

        <div className="text-center">
          <div className="fw-semibold">Electrical Input</div>
          <div className="text-muted small">Code {number}</div>
        </div>

        <button
          type="button"
          className="btn btn-outline-primary"
          onClick={addSection}
          disabled={saving || !reportId}
          title={!reportId ? "Set reportId first" : "Add item"}
        >
          +
        </button>
      </div>

      {!reportId && (
        <div className="alert alert-danger">
          Missing <strong>reportId</strong>. Set it on Home first (this API is report-scoped).
        </div>
      )}

      {sections.map((opts, i) => (
        <Section
          key={i}
          idx={i}
          options={opts}
          onChange={updateSection}
          onRemoveSection={sections.length > 1 ? removeSection : undefined}
        />
      ))}

      <div className="text-muted mt-2 small">
        Note: Home saves everything and returns to the previous screen.
      </div>
    </div>
  );
}