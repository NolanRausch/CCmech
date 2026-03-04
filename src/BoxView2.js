import React, { useEffect, useMemo, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";

const API_BASE =
  "https://ccmechconstruction-bjate8cvcha3ecgt.canadacentral-01.azurewebsites.net/api";

// ✅ non-labor fields
const blank = {
  description: "",
  supplier: "",
  cost: "",
  notes: "",
};

const blankAlt = {
  ...blank,
  used: false,
  isExistingAlt: false,
  alternateId: undefined,
};

// -------------------------
// reportId helpers
// -------------------------
const isGuid = (v) =>
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(
    String(v || "").trim().replace(/[{}]/g, "")
  );

const normalizeGuid = (v) => {
  const s = String(v || "").trim().replace(/[{}]/g, "");
  return isGuid(s) ? s.toLowerCase() : "";
};

// Reusable row (Primary or Alternate)
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
              <th style={{ width: "20%" }}>Supplier</th>
              <th style={{ width: "12%" }}>Cost</th>
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

// One section: [primary, ...alternates]
function Section({ idx, options, onChange, onRemoveSection }) {
  const [expanded, setExpanded] = useState(false); // default collapsed
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

      {/* Primary (always visible) */}
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

export default function BoxView2({ number, reportId: reportIdProp, onBack }) {
  // If you pass reportId as a prop, we use it.
  // If you didn’t, but `number` is actually a GUID, we’ll treat that as reportId.
  // You can also store reportId in localStorage("reportId") and it’ll be used.
  const reportId = useMemo(() => {
    const fromProp = normalizeGuid(reportIdProp);
    if (fromProp) return fromProp;

    const fromNumber = normalizeGuid(number);
    if (fromNumber) return fromNumber;

    const fromLS = normalizeGuid(localStorage.getItem("ccms_report_id"));
    if (fromLS) return fromLS;

    return "";
  }, [number, reportIdProp]);

  // Start with primary + 2 alternates for brand-new sections
  const starter = useMemo(
    () => [
      { ...blank, isExisting: false, demoId: undefined },
      { ...blankAlt },
      { ...blankAlt },
    ],
    []
  );

  const [sections, setSections] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const isEmpty = (it) =>
    (!it?.description || !it.description.trim()) &&
    (!it?.supplier || !it.supplier.trim()) &&
    (!it?.cost && it?.cost !== 0) &&
    (!it?.notes || !it.notes.trim());

  const toPayload = (x) => ({
    Description: String(x.description ?? ""),
    Supplier: String(x.supplier ?? ""),
    Cost: String(x.cost ?? ""),
    Notes: String(x.notes ?? ""),
  });

  const withReport = (url) => {
    if (!reportId) return url;
    const hasQ = url.includes("?");
    return `${url}${hasQ ? "&" : "?"}reportId=${encodeURIComponent(reportId)}`;
  };

  const fetchJson = async (url, opts = {}) => {
    const headers = {
      ...(opts.headers || {}),
      "Content-Type": "application/json",
      ...(reportId ? { "x-report-id": reportId } : {}),
    };
    const res = await fetch(url, { ...opts, headers });
    const data = await res.json().catch(() => ({}));
    return { res, data };
  };

  useEffect(() => {
    async function loadPrimariesAndAlternates() {
      setLoading(true);

      if (!reportId) {
        console.error(
          "Missing reportId. Pass <BoxView2000 reportId='...' /> or store localStorage.reportId"
        );
        setSections([]);
        setLoading(false);
        return;
      }

      try {
        // ✅ NEW: load demo scoped by reportId
        const { res, data } = await fetchJson(withReport(`${API_BASE}/demo`), {
          method: "GET",
        });
        if (!res.ok) throw new Error(`Demo GET failed: ${JSON.stringify(data)}`);

        const rows = Array.isArray(data) ? data : [];

        // This UI will call: GET /demo/alternates/{DemoId}?reportId=...
        // Make sure your backend has that route (it matches your generator pattern).
        const formatted = await Promise.all(
          rows.map(async (r) => {
            const demoId = r.DemoId;

            const primary = {
              description: r.Description ?? "",
              supplier: r.Supplier ?? "",
              cost: r.Cost ?? "",
              notes: r.Notes ?? "",
              isExisting: true,
              demoId,
            };

            let alternates = [];
            try {
              const altUrl = withReport(
                `${API_BASE}/demo/alternates/${encodeURIComponent(demoId)}`
              );
              const alt = await fetchJson(altUrl, { method: "GET" });

              if (alt.res.ok) {
                const altRows = Array.isArray(alt.data) ? alt.data : [];

                alternates = altRows.map((a) => ({
                  description: a.Description ?? "",
                  supplier: a.Supplier ?? "",
                  cost: a.Cost ?? "",
                  notes: a.Notes ?? "",
                  used: a.IsUsed === true || Number(a.IsUsed) === 1,
                  isExistingAlt: true,
                  alternateId: a.AlternateId,
                }));
              } else {
                // If the endpoint doesn’t exist yet, keep going without alternates.
                console.warn("Alt GET not ok for demo:", demoId, alt.data);
              }
            } catch (err) {
              console.warn("Failed to load alternates for", demoId, err);
            }

            // Always add one blank "new alternate" slot at the end
            alternates.push({ ...blankAlt });

            return [primary, ...alternates];
          })
        );

        setSections(formatted);
        console.log("Loaded demo sections:", formatted);
      } catch (err) {
        console.error("Failed to load demo:", err);
        setSections([]);
      } finally {
        setLoading(false);
      }
    }

    loadPrimariesAndAlternates();
  }, [reportId]);

  const addSection = () =>
    setSections((s) => [...s, starter.map((o) => ({ ...o }))]);

  const updateSection = (sectionIndex, nextOptions) =>
    setSections((s) =>
      s.map((opts, i) => (i === sectionIndex ? nextOptions : opts))
    );

  const removeSection = (sectionIndex) =>
    setSections((s) => s.filter((_, i) => i !== sectionIndex));

  const handleSubmit = async () => {
    console.log("reportId", reportId, "-> payload:", sections);

    if (!reportId) {
      alert("❌ Missing reportId (required).");
      return false;
    }

    try {
      for (const row of sections) {
        const primary = row?.[0];
        if (!primary || isEmpty(primary)) {
          console.warn("Skipping empty primary row");
          continue;
        }

        // 🔹 CASE 1: Existing demo (update it + its alternates)
        if (primary.isExisting && primary.demoId) {
          const demoId = primary.demoId;

          // 1) UPDATE the primary demo (report scoped)
          const { res: demoUpdateRes, data: demoUpdateData } = await fetchJson(
            withReport(`${API_BASE}/demo/${encodeURIComponent(demoId)}`),
            {
              method: "PUT",
              body: JSON.stringify({
                reportId,
                ...toPayload(primary),
              }),
            }
          );

          if (!demoUpdateRes.ok) {
            throw new Error(
              `Demo UPDATE failed: ${JSON.stringify(demoUpdateData)}`
            );
          }

          // 2) Handle alternates
          const alts = row.slice(1);

          for (const alt of alts) {
            if (!alt || isEmpty(alt)) continue;

            // Existing alternate → UPDATE
            if (alt.isExistingAlt && alt.alternateId) {
              const { res: altUpdateRes, data: altUpdateData } = await fetchJson(
                withReport(
                  `${API_BASE}/demo/alternates/${encodeURIComponent(
                    alt.alternateId
                  )}`
                ),
                {
                  method: "PUT",
                  body: JSON.stringify({
                    reportId,
                    ...toPayload(alt),
                    IsUsed: alt.used ? 1 : 0,
                  }),
                }
              );

              if (!altUpdateRes.ok) {
                throw new Error(
                  `Alternate UPDATE failed: ${JSON.stringify(altUpdateData)}`
                );
              }
              continue;
            }

            // New alternate → POST
            if (!alt.isExistingAlt) {
              const { res: altRes, data: altData } = await fetchJson(
                withReport(`${API_BASE}/demo/alternates`),
                {
                  method: "POST",
                  body: JSON.stringify({
                    reportId,
                    DemoId: demoId,
                    ...toPayload(alt),
                    IsUsed: alt.used ? 1 : 0,
                  }),
                }
              );

              if (!altRes.ok) {
                throw new Error(
                  `Alternate POST failed: ${JSON.stringify(altData)}`
                );
              }
            }
          }

          continue;
        }

        // 🔹 CASE 2: Brand-new demo (create + its alternates)
        const { res: demoRes, data: demoData } = await fetchJson(
          withReport(`${API_BASE}/demo`),
          {
            method: "POST",
            body: JSON.stringify({
              reportId,
              ...toPayload(primary),
            }),
          }
        );

        if (!demoRes.ok) {
          throw new Error(`Demo POST failed: ${JSON.stringify(demoData)}`);
        }

        const demoId = demoData.DemoId || demoData.demoId || demoData.id;

        if (!demoId) {
          throw new Error("DemoId missing from demo POST response");
        }

        const alts = row.slice(1);
        for (const alt of alts) {
          if (!alt || isEmpty(alt)) continue;

          const { res: altRes, data: altData } = await fetchJson(
            withReport(`${API_BASE}/demo/alternates`),
            {
              method: "POST",
              body: JSON.stringify({
                reportId,
                DemoId: demoId,
                ...toPayload(alt),
                IsUsed: alt.used ? 1 : 0,
              }),
            }
          );

          if (!altRes.ok) {
            throw new Error(`Alternate POST failed: ${JSON.stringify(altData)}`);
          }
        }
      }

      return true;
    } catch (err) {
      console.error("❌ Submit error:", err);
      alert("❌ Submit failed: " + (err.message || err));
      return false;
    }
  };

  // ✅ Home button now submits every time, then goes home
  const handleHomeClick = async () => {
    if (submitting) return;

    try {
      setSubmitting(true);
      const ok = await handleSubmit();
      if (ok) {
        alert("✅ Submitted changes!");
        onBack?.();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container py-4">
      {/* ✅ HOME BUTTON ON TOP */}
      <div className="d-flex align-items-center justify-content-between mb-3">
        <button
          type="button"
          className="btn btn-dark"
          onClick={handleHomeClick}
          disabled={submitting}
        >
          {submitting ? "Submitting..." : "Home"}
        </button>

        <div className="text-center">
          <h2 className="mb-0">Code {number}</h2>
          <p className="mb-0 text-muted">Demo</p>
          <p className="mb-0 small text-muted">
            Report:{" "}
            {reportId ? (
              <span className="font-monospace">{reportId}</span>
            ) : (
              <span className="text-danger">missing reportId</span>
            )}
          </p>
        </div>

        <div style={{ width: "90px" }} />
      </div>

      {loading ? (
        <div className="alert alert-secondary">Loading…</div>
      ) : (
        <form>
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
            >
              + Add Item
            </button>
          </div>
        </form>
      )}
    </div>
  );
}