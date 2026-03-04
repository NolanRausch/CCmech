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

// ---------- Reusable row ----------
function GridRow({
  label,
  value,
  onChange,
  showUsed = false,
  onRemove,
  removable = false,
}) {
  const handle = (field) => (e) => onChange({ ...value, [field]: e.target.value });

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
                onChange={(e) => onChange({ ...value, used: e.target.checked })}
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
                  value={value.description}
                  onChange={handle("description")}
                  placeholder="e.g., 20x20 air filter"
                />
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
// COMPLETION EDITOR (Primary + AlternateCompletion)
// - NO SUBMIT BUTTON
// - "Home" button saves, then immediately onBack()
// - reportId-scoped via query + x-report-id header
// =====================================================
export default function BoxView7({ number, onBack, reportId: reportIdProp }) {
  const starter = [
    { ...blank, isExisting: false, completionId: undefined },
    { ...blankAlt },
    { ...blankAlt },
  ];

  const [sections, setSections] = useState([]);
  const [saving, setSaving] = useState(false);

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

  // ✅ reportId for endpoints ONLY (prop > global > localStorage)
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

  const apiHeaders = useMemo(() => {
    const h = { "Content-Type": "application/json" };
    if (reportId) h["x-report-id"] = reportId;
    return h;
  }, [reportId]);

  useEffect(() => {
    async function loadPrimariesAndAlternates() {
      try {
        // ✅ Completion primaries (report-scoped)
        const res = await fetch(withReport(`${API_BASE}/completion`), {
          headers: reportId ? { "x-report-id": reportId } : undefined,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json = await res.json();
        const rows = Array.isArray(json)
          ? json
          : Array.isArray(json?.sample)
          ? json.sample
          : [];

        const formatted = await Promise.all(
          rows.map(async (r) => {
            const completionId = r.CompletionId;

            const primary = {
              description: r.Description ?? "",
              supplier: r.Supplier ?? "",
              cost: r.Cost ?? "",
              notes: r.Notes ?? "",
              isExisting: true,
              completionId,
            };

            // ✅ AlternateCompletion rows for this CompletionId (report-scoped)
            let alternates = [];
            try {
              const altRes = await fetch(
                withReport(
                  `${API_BASE}/completion/alternates/${encodeURIComponent(completionId)}`
                ),
                { headers: reportId ? { "x-report-id": reportId } : undefined }
              );

              if (altRes.ok) {
                const altJson = await altRes.json();
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
                  used: Number(a.IsUsed) === 1,
                  isExistingAlt: true,
                  alternateId: a.AlternateId,
                }));
              }
            } catch (err) {
              console.warn("Failed to load alternates for", completionId, err);
            }

            // Always add a blank “new alt” slot at end
            alternates.push({ ...blankAlt });

            return [primary, ...alternates];
          })
        );

        setSections(formatted);
      } catch (err) {
        console.error("Failed to load completion:", err);
        setSections([]);
      }
    }

    loadPrimariesAndAlternates();
  }, [reportId, withReport]);

  const addSection = () =>
    setSections((s) => [...s, starter.map((o) => ({ ...o }))]);

  const updateSection = (sectionIndex, nextOptions) =>
    setSections((s) => s.map((opts, i) => (i === sectionIndex ? nextOptions : opts)));

  const removeSection = (sectionIndex) =>
    setSections((s) => s.filter((_, i) => i !== sectionIndex));

  const isEmpty = (it) =>
    (!it?.description || !it.description.trim()) &&
    (!it?.supplier || !it.supplier.trim()) &&
    (!it?.cost && it?.cost !== 0) &&
    (!it?.notes || !it.notes.trim());

  // ✅ Save everything (used by Home button)
  const saveAll = useCallback(async () => {
    for (const row of sections) {
      const primary = row?.[0];
      if (!primary || isEmpty(primary)) continue;

      // ==========================
      // CASE 1: Existing Completion
      // ==========================
      if (primary.isExisting && primary.completionId) {
        const completionId = primary.completionId;

        // 1) UPDATE primary
        const updRes = await fetch(
          withReport(`${API_BASE}/completion/${encodeURIComponent(completionId)}`),
          {
            method: "PUT",
            headers: apiHeaders,
            body: JSON.stringify({
              Description: String(primary.description ?? ""),
              Supplier: String(primary.supplier ?? ""),
              Cost: String(primary.cost ?? ""),
              Notes: String(primary.notes ?? ""),
            }),
          }
        );

        const updText = await updRes.text();
        let updData;
        try {
          updData = JSON.parse(updText);
        } catch {
          updData = updText;
        }
        if (!updRes.ok) {
          throw new Error(
            `Completion UPDATE failed: ${
              typeof updData === "string" ? updData : JSON.stringify(updData)
            }`
          );
        }

        // 2) Alternates: update existing, post new
        for (const alt of row.slice(1)) {
          if (!alt || isEmpty(alt)) continue;

          // Existing alternate -> PUT
          if (alt.isExistingAlt && alt.alternateId) {
            const altUpdRes = await fetch(
              withReport(
                `${API_BASE}/completion/alternates/${encodeURIComponent(alt.alternateId)}`
              ),
              {
                method: "PUT",
                headers: apiHeaders,
                body: JSON.stringify({
                  Description: String(alt.description ?? ""),
                  Supplier: String(alt.supplier ?? ""),
                  Cost: String(alt.cost ?? ""),
                  Notes: String(alt.notes ?? ""),
                  IsUsed: alt.used ? 1 : 0,
                }),
              }
            );

            const altUpdText = await altUpdRes.text();
            let altUpdData;
            try {
              altUpdData = JSON.parse(altUpdText);
            } catch {
              altUpdData = altUpdText;
            }

            if (!altUpdRes.ok) {
              throw new Error(
                `AlternateCompletion UPDATE failed: ${
                  typeof altUpdData === "string" ? altUpdData : JSON.stringify(altUpdData)
                }`
              );
            }
            continue;
          }

          // New alternate -> POST
          if (!alt.isExistingAlt) {
            const altRes = await fetch(withReport(`${API_BASE}/completion/alternates`), {
              method: "POST",
              headers: apiHeaders,
              body: JSON.stringify({
                CompletionId: completionId,
                Description: String(alt.description ?? ""),
                Supplier: String(alt.supplier ?? ""),
                Cost: String(alt.cost ?? ""),
                Notes: String(alt.notes ?? ""),
                IsUsed: alt.used ? 1 : 0,
              }),
            });

            const altText = await altRes.text();
            let altData;
            try {
              altData = JSON.parse(altText);
            } catch {
              altData = altText;
            }

            if (!altRes.ok) {
              throw new Error(
                `AlternateCompletion POST failed: ${
                  typeof altData === "string" ? altData : JSON.stringify(altData)
                }`
              );
            }
          }
        }

        continue;
      }

      // ======================
      // CASE 2: New Completion
      // ======================
      const createRes = await fetch(withReport(`${API_BASE}/completion`), {
        method: "POST",
        headers: apiHeaders,
        body: JSON.stringify({
          Description: String(primary.description ?? ""),
          Supplier: String(primary.supplier ?? ""),
          Cost: String(primary.cost ?? ""),
          Notes: String(primary.notes ?? ""),
        }),
      });

      const createText = await createRes.text();
      let createData;
      try {
        createData = JSON.parse(createText);
      } catch {
        createData = createText;
      }

      if (!createRes.ok) {
        throw new Error(
          `Completion POST failed: ${
            typeof createData === "string" ? createData : JSON.stringify(createData)
          }`
        );
      }

      const completionId =
        createData.CompletionId || createData.completionId || createData.id;

      if (!completionId) {
        throw new Error("CompletionId missing from Completion POST response");
      }

      for (const alt of row.slice(1)) {
        if (!alt || isEmpty(alt)) continue;

        const altRes = await fetch(withReport(`${API_BASE}/completion/alternates`), {
          method: "POST",
          headers: apiHeaders,
          body: JSON.stringify({
            CompletionId: completionId,
            Description: String(alt.description ?? ""),
            Supplier: String(alt.supplier ?? ""),
            Cost: String(alt.cost ?? ""),
            Notes: String(alt.notes ?? ""),
            IsUsed: alt.used ? 1 : 0,
          }),
        });

        const altText = await altRes.text();
        let altData;
        try {
          altData = JSON.parse(altText);
        } catch {
          altData = altText;
        }

        if (!altRes.ok) {
          throw new Error(
            `AlternateCompletion POST failed: ${
              typeof altData === "string" ? altData : JSON.stringify(altData)
            }`
          );
        }
      }
    }
  }, [sections, apiHeaders, reportId, withReport]);

  // ✅ Home button: save then immediately go back (no Submit button)
  const handleHome = useCallback(async () => {
    if (saving) return;
    try {
      setSaving(true);
      await saveAll();
      onBack && onBack();
    } catch (err) {
      console.error("❌ Save error:", err);
      alert("❌ Save failed: " + (err.message || err));
    } finally {
      setSaving(false);
    }
  }, [saving, saveAll, onBack]);

  return (
    <div className="container py-4">
      <h2>Code {number}</h2>
      <p>Completion</p>

      {sections.map((opts, i) => (
        <Section
          key={i}
          idx={i}
          options={opts}
          onChange={updateSection}
          onRemoveSection={sections.length > 1 ? removeSection : undefined}
        />
      ))}

      <div className="d-flex flex-wrap gap-2 mb-4">
        <button
          type="button"
          className="btn btn-outline-primary"
          onClick={addSection}
          disabled={saving}
        >
          + Add Item (starts with 2 alts)
        </button>

        <button
          type="button"
          className="btn btn-dark"
          onClick={handleHome}
          disabled={saving}
          title={saving ? "Saving..." : "Save and return to Home"}
        >
          {saving ? "Saving..." : "Home"}
        </button>
      </div>
    </div>
  );
}