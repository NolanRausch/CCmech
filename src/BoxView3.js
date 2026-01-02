import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

const API_BASE = "https://ccmechconstruction-bjate8cvcha3ecgt.canadacentral-01.azurewebsites.net/api";

const blank = { description: '', supplier: '', cost: '', notes: '' };
const blankAlt = { ...blank, used: false, isExistingAlt: false, alternateId: undefined };

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
          <button type="button" className="btn btn-sm btn-outline-danger" onClick={onRemove}>
            Remove
          </button>
        )}
      </div>

      <div className="card-body">
        <table className="table table-sm align-middle mb-0">
          <thead>
            <tr>
              <th style={{ width: '28%' }}>Description</th>
              <th style={{ width: '22%' }}>Supplier</th>
              <th style={{ width: '15%' }}>Cost</th>
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
                  onChange={handle('description')}
                  placeholder="e.g., 20x20 air filter"
                />
              </td>
              <td>
                <input
                  className="form-control"
                  type="text"
                  value={value.supplier}
                  onChange={handle('supplier')}
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
                  onChange={handle('cost')}
                  placeholder="0.00"
                />
              </td>
              <td>
                <input
                  className="form-control"
                  type="text"
                  value={value.notes}
                  onChange={handle('notes')}
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
            title={expanded ? 'Hide alternates' : 'Show alternates'}
            aria-expanded={expanded}
          >
            {expanded ? '▾' : '▸'}
          </button>
          <h6 className="mb-0">Item {idx + 1}</h6>
          <span className="text-muted small">
            {Math.max(0, options.length - 1)} alternate{options.length - 1 === 1 ? '' : 's'}
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

      <GridRow
        label="Primary"
        value={options[0]}
        onChange={(next) => updateOpt(0, next)}
        showUsed={false}
      />

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
            title={options.length - 1 >= MAX_ALTS ? 'Reached max alternates' : 'Add alternate'}
          >
            + Add Alternate
          </button>
        </div>
      )}
    </div>
  );
}

export default function BoxView1({ number, onBack }) {
  const starter = [
    { ...blank, isExisting: false, eRoughId: undefined },
    { ...blankAlt },
    { ...blankAlt }
  ];

  const [sections, setSections] = React.useState([]);

  React.useEffect(() => {
    async function loadPrimariesAndAlternates() {
      try {
        // ✅ ERough primaries
        const res = await fetch(`${API_BASE}/erough`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const rows = await res.json(); // expected: array of { ERoughId, Description, ... }

        const formatted = await Promise.all(
          (Array.isArray(rows) ? rows : []).map(async (r) => {
            const eRoughId = r.ERoughId;

            const primary = {
              description: r.Description ?? "",
              supplier:    r.Supplier ?? "",
              cost:        r.Cost ?? "",
              notes:       r.Notes ?? "",
              isExisting:  true,
              eRoughId
            };

            // ✅ ERough alternates
            let alternates = [];
            try {
              const altRes = await fetch(
                `${API_BASE}/erough/alternates/${encodeURIComponent(eRoughId)}`
              );
              if (altRes.ok) {
                const altJson = await altRes.json();
                const altRows = Array.isArray(altJson) ? altJson : (altJson?.sample || []);

                alternates = altRows.map((a) => ({
                  description:   a.Description ?? "",
                  supplier:      a.Supplier ?? "",
                  cost:          a.Cost ?? "",
                  notes:         a.Notes ?? "",
                  used:          Number(a.IsUsed) === 1,
                  isExistingAlt: true,
                  alternateId:   a.AlternateId
                }));
              }
            } catch (err) {
              console.warn("Failed to load alternates for", eRoughId, err);
            }

            alternates.push({ ...blankAlt });
            return [primary, ...alternates];
          })
        );

        setSections(formatted);
      } catch (err) {
        console.error("Failed to load erough:", err);
        setSections([]);
      }
    }

    loadPrimariesAndAlternates();
  }, []);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Code', number, '-> payload:', sections);

    try {
      for (const row of sections) {
        const primary = row?.[0];
        if (!primary || isEmpty(primary)) continue;

        // ======================
        // CASE 1: Existing ERough
        // ======================
        if (primary.isExisting && primary.eRoughId) {
          const eRoughId = primary.eRoughId;

          // 1) UPDATE primary ERough
          const updRes = await fetch(
            `${API_BASE}/erough/${encodeURIComponent(eRoughId)}`,
            {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                Description: String(primary.description ?? ''),
                Supplier:    String(primary.supplier ?? ''),
                Cost:        String(primary.cost ?? ''),
                Notes:       String(primary.notes ?? '')
              })
            }
          );
          const updData = await updRes.json().catch(() => ({}));
          if (!updRes.ok) {
            throw new Error(`ERough UPDATE failed: ${JSON.stringify(updData)}`);
          }

          // 2) Alternates: update existing, post new
          for (const alt of row.slice(1)) {
            if (!alt || isEmpty(alt)) continue;

            // Existing alternate -> PUT
            if (alt.isExistingAlt && alt.alternateId) {
              const altUpdRes = await fetch(
                `${API_BASE}/erough/alternates/${encodeURIComponent(alt.alternateId)}`,
                {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    Description: String(alt.description ?? ''),
                    Supplier:    String(alt.supplier ?? ''),
                    Cost:        String(alt.cost ?? ''),
                    Notes:       String(alt.notes ?? ''),
                    IsUsed:      alt.used ? 1 : 0
                  })
                }
              );
              const altUpdData = await altUpdRes.json().catch(() => ({}));
              if (!altUpdRes.ok) {
                throw new Error(`AlternateERough UPDATE failed: ${JSON.stringify(altUpdData)}`);
              }
              continue;
            }

            // New alternate -> POST
            if (!alt.isExistingAlt) {
              const altRes = await fetch(`${API_BASE}/erough/alternates`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  ERoughId:     eRoughId,
                  Description:  String(alt.description ?? ''),
                  Supplier:     String(alt.supplier ?? ''),
                  Cost:         String(alt.cost ?? ''),
                  Notes:        String(alt.notes ?? ''),
                  IsUsed:       alt.used ? 1 : 0
                })
              });
              const altData = await altRes.json().catch(() => ({}));
              if (!altRes.ok) throw new Error(`AlternateERough POST failed: ${JSON.stringify(altData)}`);
            }
          }

          continue;
        }

        // ======================
        // CASE 2: New ERough
        // ======================
        const createRes = await fetch(`${API_BASE}/erough`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            Description: String(primary.description ?? ''),
            Supplier:    String(primary.supplier ?? ''),
            Cost:        String(primary.cost ?? ''),
            Notes:       String(primary.notes ?? '')
          })
        });
        const createData = await createRes.json().catch(() => ({}));
        if (!createRes.ok) throw new Error(`ERough POST failed: ${JSON.stringify(createData)}`);

        const eRoughId = createData.ERoughId || createData.eroughId || createData.id;
        if (!eRoughId) throw new Error('ERoughId missing from ERough POST response');

        for (const alt of row.slice(1)) {
          if (!alt || isEmpty(alt)) continue;

          const altRes = await fetch(`${API_BASE}/erough/alternates`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ERoughId:     eRoughId,
              Description:  String(alt.description ?? ''),
              Supplier:     String(alt.supplier ?? ''),
              Cost:         String(alt.cost ?? ''),
              Notes:        String(alt.notes ?? ''),
              IsUsed:       alt.used ? 1 : 0
            })
          });
          const altData = await altRes.json().catch(() => ({}));
          if (!altRes.ok) throw new Error(`AlternateERough POST failed: ${JSON.stringify(altData)}`);
        }
      }

      alert('✅ Submitted changes to ERough (updated existing + created new items)!');
    } catch (err) {
      console.error('❌ Submit error:', err);
      alert('❌ Submit failed: ' + (err.message || err));
    }
  };

  return (
    <div className="container py-4">
      <h2>Code {number}</h2>
      <p>ERough</p>

      <form onSubmit={handleSubmit}>
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
          <button type="button" className="btn btn-outline-primary" onClick={addSection}>
            + Add Item (starts with 2 alts)
          </button>
          <button type="submit" className="btn btn-secondary">
            Submit changes
          </button>
        </div>
      </form>

      <button className="btn btn-dark" onClick={onBack}>
        Back to Home
      </button>
    </div>
  );
}
