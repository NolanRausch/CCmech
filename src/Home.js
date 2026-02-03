// Home.js
import React, { useCallback, useMemo, useState } from "react";
import "./Home.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

import BoxView1 from "./BoxView1";
import DbTestViewer from "./DbTestViewer";
import Demo from "./Demo";
import Rough from "./Rough";
import AirDistribution from "./AIrDistribution";
import Electrical from "./Electrical";
import Piping from "./Piping";
import Completion from "./Completion";

// Labor components
import Labor from "./Labor";
import Labor2 from "./Labor2";
import Labor3 from "./Labor3";
import Labor4 from "./Labor4";
import Labor5 from "./Labor5";
import Labor6 from "./Labor6";
import Labor7 from "./Labor7";

function Home() {
  const TAX_RATE = 0.07;

  const [selected, setSelected] = useState(null);



  // ✅ Toggle: "input" shows components, "totals" shows totals only
  const [viewMode, setViewMode] = useState("input"); // "input" | "totals"

  // ✅ Non-labor totals tracked here (store PRE-TAX subtotals)
  const [totalsBySection, setTotalsBySection] = useState({
    equipment: 0,
    demo: 0,
    rough: 0,
    air: 0,
    electrical: 0,
    piping: 0,
    completion: 0,
  });

  /**
   * ✅ Labor totals:
   * Each labor section payload should look like:
   *   { cost: number, hours: number, byType: [{type, cost, hours}] }
   */
  const [laborSections, setLaborSections] = useState({
    labor1: { cost: 0, hours: 0, byType: [] },
    labor2: { cost: 0, hours: 0, byType: [] },
    labor3: { cost: 0, hours: 0, byType: [] },
    labor4: { cost: 0, hours: 0, byType: [] },
    labor5: { cost: 0, hours: 0, byType: [] },
    labor6: { cost: 0, hours: 0, byType: [] },
    labor7: { cost: 0, hours: 0, byType: [] },
  });

  // ✅ FIX #1: make section setter idempotent (prevents render loops)
  const setSectionCost = useCallback((key, cost) => {
    const next = Number(cost) || 0;

    setTotalsBySection((prev) => {
      if ((prev[key] ?? 0) === next) return prev; // ✅ no-op if unchanged
      return {
        ...prev,
        [key]: next,
      };
    });
  }, []);

  // ✅ accept either onTotalsChange(123) OR onTotalsChange({cost:123})
  const readCost = useCallback((t) => {
    if (typeof t === "number") return t;
    if (typeof t === "string") return Number(t);
    if (t && typeof t === "object") {
      return Number(t.cost ?? t.total ?? t.totalCost ?? t.subTotal) || 0;
    }
    return 0;
  }, []);

  // ✅ read labor payload coming from LaborViewer
  const readLaborPayload = useCallback((t) => {
    // allow old style where someone passes just a number
    if (typeof t === "number" || typeof t === "string") {
      const cost = Number(t) || 0;
      return { cost, hours: 0, byType: [] };
    }

    if (t && typeof t === "object") {
      return {
        cost: Number(t.cost ?? t.total ?? t.totalCost ?? t.subTotal) || 0,
        hours: Number(t.hours ?? t.laborHours) || 0,
        byType: Array.isArray(t.byType) ? t.byType : [],
      };
    }

    return { cost: 0, hours: 0, byType: [] };
  }, []);

  // ✅ FIX #2: make labor setter idempotent (prevents render loops)
  const setLaborSection = useCallback(
    (key, payload) => {
      const parsed = readLaborPayload(payload);

      setLaborSections((prev) => {
        const curr = prev[key];

        // IMPORTANT: keep this exactly about "no change => no state update"
        const same =
          (curr?.cost ?? 0) === parsed.cost &&
          (curr?.hours ?? 0) === parsed.hours &&
          JSON.stringify(curr?.byType ?? []) === JSON.stringify(parsed.byType ?? []);

        if (same) return prev; // ✅ no-op if unchanged

        return {
          ...prev,
          [key]: parsed,
        };
      });
    },
    [readLaborPayload]
  );

  const money = (n) => `$${Number(n || 0).toFixed(2)}`;

  // helper: convert pre-tax -> with-tax
  const withTax = useCallback(
    (n) => Number(n || 0) * (1 + TAX_RATE),
    [TAX_RATE]
  );

  // ✅ Pre-tax subtotal across non-labor sections
  const subTotal = useMemo(() => {
    return Object.values(totalsBySection).reduce(
      (sum, v) => sum + (Number(v) || 0),
      0
    );
  }, [totalsBySection]);

  // ✅ Non-labor tax + grand total (with tax)
  const taxAmount = useMemo(() => subTotal * TAX_RATE, [subTotal, TAX_RATE]);
  const grandTotalWithTax = useMemo(
    () => subTotal + taxAmount,
    [subTotal, taxAmount]
  );
  const subTotalWithTax = useMemo(() => withTax(subTotal), [subTotal, withTax]);

  // ✅ Labor subtotal across all labor sections
  const laborSubTotal = useMemo(() => {
    return Object.values(laborSections).reduce(
      (sum, v) => sum + (Number(v?.cost) || 0),
      0
    );
  }, [laborSections]);

  const laborHoursTotal = useMemo(() => {
    return Object.values(laborSections).reduce(
      (sum, v) => sum + (Number(v?.hours) || 0),
      0
    );
  }, [laborSections]);

  // ✅ Combine labor by LaborType across all 7 labor sections
  const laborByType = useMemo(() => {
    const map = new Map();

    for (const section of Object.values(laborSections)) {
      const list = Array.isArray(section?.byType) ? section.byType : [];
      for (const row of list) {
        const type = String(row?.type ?? "").trim() || "Unspecified";
        const cost = Number(row?.cost) || 0;
        const hours = Number(row?.hours) || 0;

        const prev = map.get(type) || { type, cost: 0, hours: 0 };
        prev.cost += cost;
        prev.hours += hours;
        map.set(type, prev);
      }
    }

    // sort by cost desc
    return Array.from(map.values()).sort((a, b) => b.cost - a.cost);
  }, [laborSections]);

  // ✅ Labor tax + grand total (with tax)
  const laborTaxAmount = useMemo(
    () => laborSubTotal * TAX_RATE,
    [laborSubTotal, TAX_RATE]
  );
  const laborSubTotalWithTax = useMemo(
    () => withTax(laborSubTotal),
    [laborSubTotal, withTax]
  );
  const laborGrandTotalWithTax = useMemo(
    () => laborSubTotal + laborTaxAmount,
    [laborSubTotal, laborTaxAmount]
  );

  // ✅ Combined totals
  const combinedSubTotal = useMemo(
    () => subTotal + laborSubTotal,
    [subTotal, laborSubTotal]
  );
  const combinedTax = useMemo(
    () => taxAmount + laborTaxAmount,
    [taxAmount, laborTaxAmount]
  );
  const combinedGrandTotalWithTax = useMemo(
    () => combinedSubTotal + combinedTax,
    [combinedSubTotal, combinedTax]
  );

  // ===== Adders / Allowances =====
  // Contingency = 2% of total NON-labor with tax
  const contingency = useMemo(
    () => grandTotalWithTax * 0.02,
    [grandTotalWithTax]
  );

  // Per Diem = 25 * (total mechanic labor + other total labors) * 1.1
  // Interpreting as HOURS-based: mechanic + others = total labor hours
  const perDiem = useMemo(() => 25 * laborHoursTotal * 1.1, [laborHoursTotal]);

  // Warranty = 3% of grand total NON-labor with tax
  const warranty = useMemo(() => grandTotalWithTax * 0.03, [grandTotalWithTax]);

  // Consumables = 2.5% of grand total NON-labor (pre-tax)
  const consumables = useMemo(() => subTotal * 0.025, [subTotal]);

  const addersTotal = useMemo(
    () => contingency + perDiem + warranty + consumables,
    [contingency, perDiem, warranty, consumables]
  );

  const combinedWithAdders = useMemo(
    () => combinedGrandTotalWithTax + addersTotal,
    [combinedGrandTotalWithTax, addersTotal]
  );
  const nonLaborWithAdders = useMemo(
  () => grandTotalWithTax + addersTotal,
  [grandTotalWithTax, addersTotal]
);
const margin25 = useMemo(
  () => nonLaborWithAdders * (1 / (1 - 0.25)),
  [nonLaborWithAdders]
);

const margin30 = useMemo(
  () => nonLaborWithAdders * (1 / (1 - 0.30)),
  [nonLaborWithAdders]
);

const margin35 = useMemo(
  () => nonLaborWithAdders * (1 / (1 - 0.35)),
  [nonLaborWithAdders]
);

  // If you still use this screen, keep it
  if (selected === 1000) {
    return <BoxView1 number={selected} onBack={() => setSelected(null)} />;
  }

  const handleClearAll = async () => {
    if (!window.confirm("Are you sure you want to delete ALL equipment?")) return;

    try {
      const res = await fetch("http://localhost:7071/api/equipment/clear", {
        method: "DELETE",
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to clear table");

      console.log("✅ Cleared:", data);
      alert("✅ All equipment deleted");
    } catch (err) {
      console.error("❌ Clear failed:", err);
      alert("❌ Error clearing table: " + (err.message || err));
    }
  };

  const TotalsOnly = () => (
    <div className="card mb-3">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Totals</h5>

          <div className="d-flex gap-2">
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={() => setViewMode("input")}
              title="Go back to inputs"
            >
              Back to Inputs
            </button>

            <button
              className="btn btn-sm btn-outline-danger"
              onClick={handleClearAll}
              title="Local only"
            >
              Clear ALL Equipment (local)
            </button>
          </div>
        </div>

        <hr className="my-3" />

        {/* ===== Non-Labor ===== */}
        <div className="d-flex flex-column gap-1">
          <div className="fw-semibold">Non-Labor</div>

          {Object.entries(totalsBySection).map(([k, v]) => (
            <div key={k}>
              {k === "air"
                ? "Air Distribution"
                : k.charAt(0).toUpperCase() + k.slice(1)}
              :{" "}
              <strong>
                {money(v)}{" "}
                <span className="text-muted small">
                  (w/ tax {money(withTax(v))})
                </span>
              </strong>
            </div>
          ))}
        </div>

        <hr className="my-3" />

        <div className="d-flex flex-column gap-1">
          <div className="fs-6">
            Subtotal (Non-Labor): <strong>{money(subTotal)}</strong>
          </div>
          <div className="fs-6">
            Subtotal (Non-Labor, w/ Tax):{" "}
            <strong>{money(subTotalWithTax)}</strong>
          </div>
          <div className="fs-6">
            Tax (Non-Labor, 7%): <strong>{money(taxAmount)}</strong>
          </div>
          <div className="fs-5">
            <strong>
              Grand Total (Non-Labor, w/ Tax): {money(grandTotalWithTax)}
            </strong>
          </div>
        </div>

        {/* ===== Labor ===== */}
        <hr className="my-3" />

        <div className="d-flex flex-column gap-1">
          <div className="fw-semibold">Labor (Grouped by Type)</div>

          {laborByType.length === 0 ? (
            <div className="text-muted small">No labor totals yet.</div>
          ) : (
            laborByType.map((t) => (
              <div
                key={t.type}
                className="d-flex justify-content-between align-items-center"
              >
                <div>{t.type}</div>
                <div className="text-end">
                  <span className="text-muted small me-3">
                    {Number(t.hours || 0).toFixed(2)} hrs
                  </span>
                  <strong>
                    {money(t.cost)}{" "}
                    <span className="text-muted small">
                      (w/ tax {money(withTax(t.cost))})
                    </span>
                  </strong>
                </div>
              </div>
            ))
          )}

          <div className="fs-6 mt-2">
            Labor Subtotal: <strong>{money(laborSubTotal)}</strong>{" "}
            <span className="text-muted small">
              ({laborHoursTotal.toFixed(2)} hrs)
            </span>
          </div>
          <div className="fs-6">
            Labor Subtotal (w/ Tax): <strong>{money(laborSubTotalWithTax)}</strong>
          </div>
          <div className="fs-6">
            Tax (Labor, 7%): <strong>{money(laborTaxAmount)}</strong>
          </div>
          <div className="fs-5">
            <strong>
              Grand Total (Labor, w/ Tax): {money(laborGrandTotalWithTax)}
            </strong>
          </div>
        </div>

        {/* ===== Combined ===== */}
        <hr className="my-3" />
        <div className="d-flex flex-column gap-1">
          <div className="fw-semibold">Combined</div>
          <div className="fs-6">
            Combined Subtotal (Pre-Tax): <strong>{money(combinedSubTotal)}</strong>
          </div>
          <div className="fs-6">
            Combined Tax (7%): <strong>{money(combinedTax)}</strong>
          </div>
          <div className="fs-5">
            <strong>
              Combined Grand Total (w/ Tax): {money(combinedGrandTotalWithTax)}
            </strong>
          </div>
        </div>

        {/* ===== Adders ===== */}
        <hr className="my-3" />
        <div className="d-flex flex-column gap-1">
          <div className="fw-semibold">Adders</div>
          <div className="fs-6">
            Contingency (2% of Non-Labor w/ Tax):{" "}
            <strong>{money(contingency)}</strong>
          </div>
          <div className="fs-6">
            Per Diem (25 × labor hrs × 1.1): <strong>{money(perDiem)}</strong>
          </div>
          <div className="fs-6">
            Warranty (3% of Non-Labor w/ Tax): <strong>{money(warranty)}</strong>
          </div>
          <div className="fs-6">
            Consumables (2.5% of Non-Labor pre-tax):{" "}
            <strong>{money(consumables)}</strong>
          </div>
          <div className="fs-6 mt-2">
            Adders Total: <strong>{money(addersTotal)}</strong>
          </div>
          <div className="fs-5">
  <strong>
    Non-Labor Grand Total + Adders: {money(nonLaborWithAdders)}
  </strong>
</div>
<hr className="my-3" />
<div className="d-flex flex-column gap-1">
  <div className="fw-semibold">Sell Price Targets (based on Non-Labor + Adders)</div>

  <div className="fs-6">
    25% Margin: <strong>{money(margin25)}</strong>
    <span className="text-muted small ms-2">
      (× {(1 / (1 - 0.25)).toFixed(4)})
    </span>
  </div>

  <div className="fs-6">
    30% Margin: <strong>{money(margin30)}</strong>
    <span className="text-muted small ms-2">
      (× {(1 / (1 - 0.30)).toFixed(4)})
    </span>
  </div>

  <div className="fs-6">
    35% Margin: <strong>{money(margin35)}</strong>
    <span className="text-muted small ms-2">
      (× {(1 / (1 - 0.35)).toFixed(4)})
    </span>
  </div>
</div>


          <div className="fs-5">
            <strong>
              Combined Grand Total + Adders: {money(combinedWithAdders)}
            </strong>
          </div>
        </div>
      </div>
    </div>
  );

  const InputsOnly = () => (
    <div className="card mb-3">
      <div className="card-body d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Inputs</h5>
        <button
          className="btn btn-sm btn-primary"
          onClick={() => setViewMode("totals")}
        >
          View Totals
        </button>
      </div>
    </div>
  );

  return (
    <div className="home-container">
      <h1>Capital City</h1>

      {/* ✅ Either totals OR inputs */}
      {viewMode === "totals" ? (
        <TotalsOnly />
      ) : (
        <>
          <InputsOnly />

          {/* ====== SECTIONS ====== */}
          <div>
            <DbTestViewer
              onTotalsChange={(t) => setSectionCost("equipment", readCost(t))}
            />
          </div>

          {/* Labor sections */}
          <div>
            <Labor onTotalsChange={(t) => setLaborSection("labor1", t)} />
          </div>

          <div>
            <Demo onTotalsChange={(t) => setSectionCost("demo", readCost(t))} />
          </div>

          <div>
            <Labor2 onTotalsChange={(t) => setLaborSection("labor2", t)} />
          </div>

          <div>
            <Rough onTotalsChange={(t) => setSectionCost("rough", readCost(t))} />
          </div>

          <div>
            <Labor3 onTotalsChange={(t) => setLaborSection("labor3", t)} />
          </div>

          <div>
            <AirDistribution
              onTotalsChange={(t) => setSectionCost("air", readCost(t))}
            />
          </div>

          <div>
            <Labor4 onTotalsChange={(t) => setLaborSection("labor4", t)} />
          </div>

          <div>
            <Electrical
              onTotalsChange={(t) =>
                setSectionCost("electrical", readCost(t))
              }
            />
          </div>

          <div>
            <Labor5 onTotalsChange={(t) => setLaborSection("labor5", t)} />
          </div>

          <div>
            <Piping
              onTotalsChange={(t) => setSectionCost("piping", readCost(t))}
            />
          </div>

          <div>
            <Labor6 onTotalsChange={(t) => setLaborSection("labor6", t)} />
          </div>

          <div>
            <Completion
              onTotalsChange={(t) =>
                setSectionCost("completion", readCost(t))
              }
            />
          </div>

          <div>
            <Labor7 onTotalsChange={(t) => setLaborSection("labor7", t)} />
          </div>
        </>
      )}
    </div>
  );
}

export default Home;

