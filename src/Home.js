// Home.js
import React, { useCallback, useMemo, useState, useEffect } from "react";
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
  // ✅ NEW: simple home screen toggle (smallest change)
  const [showHomeScreen, setShowHomeScreen] = useState(true);

  // ✅ Editable tax rate (default 7%)
  const [taxRate, setTaxRate] = useState(0.07);

  // ✅ DEFAULT GUID (put a real one here if you want a fixed default)
  // Best practice: set this to a "Test Report" row you inserted in dbo.Reports.
  const DEFAULT_REPORT_ID = "82e93dd1-7891-4f78-b06d-c5ba14c93c9d";

  // ✅ Report Id (persisted)
  const [reportId, setReportId] = useState("");
  const [reportIdDraft, setReportIdDraft] = useState("");

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

  // ✅ ReportId helpers (strict GUID v4-ish pattern not required; just standard GUID format)
  const isGuid = useCallback((s) => {
    return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
      String(s || "").trim().replace(/[{}]/g, "")
    );
  }, []);

  const normalizeGuid = useCallback(
    (s) => {
      const t = String(s || "").trim().replace(/[{}]/g, "");
      return isGuid(t) ? t.toLowerCase() : "";
    },
    [isGuid]
  );

  // ✅ load persisted reportId on first render (fallback to DEFAULT_REPORT_ID)
  useEffect(() => {
    const saved = localStorage.getItem("ccms_report_id") || "";
    const normSaved = normalizeGuid(saved);

    // Use saved if valid; else use default if valid; else blank
    const normDefault = normalizeGuid(DEFAULT_REPORT_ID);
    const initial = normSaved || normDefault || "";

    setReportId(initial);
    setReportIdDraft(initial);
  }, [normalizeGuid]);

  // ✅ expose globally so every component/fetch can read it easily
  useEffect(() => {
    if (reportId) localStorage.setItem("ccms_report_id", reportId);
    else localStorage.removeItem("ccms_report_id");
    window.__REPORT_ID__ = reportId || "";
  }, [reportId]);

  const applyReportId = useCallback(() => {
    const norm = normalizeGuid(reportIdDraft);
    if (!norm) {
      alert("Report ID must be a valid GUID.");
      return;
    }
    setReportId(norm);
  }, [reportIdDraft, normalizeGuid]);

  const clearReportId = useCallback(() => {
    // Clear means go back to default (if valid), otherwise blank
    const normDefault = normalizeGuid(DEFAULT_REPORT_ID);
    setReportId(normDefault || "");
    setReportIdDraft(normDefault || "");
  }, [normalizeGuid]);

  // ✅ FIX #1: make section setter idempotent (prevents render loops)
  const setSectionCost = useCallback((key, cost) => {
    const next = Number(cost) || 0;

    setTotalsBySection((prev) => {
      if ((prev[key] ?? 0) === next) return prev; // ✅ no-op if unchanged
      return { ...prev, [key]: next };
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

        const same =
          (curr?.cost ?? 0) === parsed.cost &&
          (curr?.hours ?? 0) === parsed.hours &&
          JSON.stringify(curr?.byType ?? []) ===
            JSON.stringify(parsed.byType ?? []);

        if (same) return prev; // ✅ no-op if unchanged

        return { ...prev, [key]: parsed };
      });
    },
    [readLaborPayload]
  );

  // ✅ Better money formatting ($30,000.00)
  const money = useCallback((val) => {
    const n = Number(String(val ?? "").replace(/[^0-9.\-]/g, ""));
    const safe = isNaN(n) ? 0 : n;
    return safe.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }, []);

  // ✅ helper: convert pre-tax -> with-tax using editable taxRate
  const withTax = useCallback(
    (n) => Number(n || 0) * (1 + (Number(taxRate) || 0)),
    [taxRate]
  );

  const labelForSection = useCallback((k) => {
    if (k === "air") return "Air Distribution";
    return k.charAt(0).toUpperCase() + k.slice(1);
  }, []);

  const pct = useCallback((n) => `${(Number(n || 0) * 100).toFixed(2)}%`, []);

  // ✅ Pre-tax subtotal across non-labor sections
  const subTotal = useMemo(() => {
    return Object.values(totalsBySection).reduce(
      (sum, v) => sum + (Number(v) || 0),
      0
    );
  }, [totalsBySection]);

  // ✅ Non-labor totals (with tax)
  const subTotalWithTax = useMemo(() => withTax(subTotal), [subTotal, withTax]);
  const grandTotalWithTax = subTotalWithTax;

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

    return Array.from(map.values()).sort((a, b) => b.cost - a.cost);
  }, [laborSections]);

  // ✅ Labor totals (with tax)
  const laborSubTotalWithTax = useMemo(
    () => withTax(laborSubTotal),
    [laborSubTotal, withTax]
  );
  const laborGrandTotalWithTax = laborSubTotalWithTax;

  // ✅ Combined totals (used for combinedWithAdders only)
  const combinedGrandTotalWithTax = useMemo(
    () => grandTotalWithTax + laborGrandTotalWithTax,
    [grandTotalWithTax, laborGrandTotalWithTax]
  );

  // ===== Adders / Allowances =====
  const contingencyRate = 0.02;
  const warrantyRate = 0.03;
  const consumablesRate = 0.025;
  const perDiemDaily = 25;
  const perDiemMult = 1.1;

  const contingency = useMemo(
    () => grandTotalWithTax * contingencyRate,
    [grandTotalWithTax]
  );

  const perDiem = useMemo(
    () => perDiemDaily * laborHoursTotal * perDiemMult,
    [laborHoursTotal]
  );

  const warranty = useMemo(() => grandTotalWithTax * warrantyRate, [grandTotalWithTax]);

  const consumables = useMemo(() => subTotal * consumablesRate, [subTotal]);

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
    () => nonLaborWithAdders * (1 / (1 - 0.3)),
    [nonLaborWithAdders]
  );
  const margin35 = useMemo(
    () => nonLaborWithAdders * (1 / (1 - 0.35)),
    [nonLaborWithAdders]
  );

  if (selected === 1000) {
    return (
      <BoxView1
        number={selected}
        reportId={reportId}
        onBack={() => setSelected(null)}
      />
    );
  }

  // ✅ UPDATED: clear endpoint should use your deployed API + reportId
  const handleClearAll = async () => {
    if (!reportId) {
      alert("Set a Report ID first.");
      return;
    }
    if (!window.confirm("Are you sure you want to delete ALL equipment for this report?"))
      return;

    try {
      const res = await fetch(
        `https://ccmechconstruction-bjate8cvcha3ecgt.canadacentral-01.azurewebsites.net/api/equipment/clear?reportId=${encodeURIComponent(
          reportId
        )}`,
        { method: "DELETE", headers: { "x-report-id": reportId } }
      );

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Failed to clear table (HTTP ${res.status})`);

      console.log("✅ Cleared:", data);
      alert("✅ All equipment deleted for this report");
    } catch (err) {
      console.error("❌ Clear failed:", err);
      alert("❌ Error clearing table: " + (err.message || err));
    }
  };

  // ✅ Totals page: LEFT aligned + evenly spaced 3 columns (Label | Hours/% | Total-with-tax)
  const TotalsOnly = () => {
    const COLS = "360px 120px 180px"; // label | hours | total (consistent widths)

    const Row = ({ label, hours = "", total = "", strong = false, muted = false }) => (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: COLS,
          columnGap: 14,
          alignItems: "baseline",
          padding: "3px 0",
          fontSize: 12,
          lineHeight: 1.35,
          opacity: muted ? 0.75 : 1,
        }}
      >
        <div style={{ fontWeight: strong ? 700 : 400 }}>{label}</div>

        <div
          style={{
            textAlign: "right",
            fontVariantNumeric: "tabular-nums",
            whiteSpace: "nowrap",
            opacity: hours ? 0.9 : 0.4,
          }}
        >
          {hours}
        </div>

        <div
          style={{
            textAlign: "right",
            fontWeight: strong ? 800 : 600,
            fontVariantNumeric: "tabular-nums",
            whiteSpace: "nowrap",
          }}
        >
          {total}
        </div>
      </div>
    );

    const SectionTitle = ({ children }) => (
      <div style={{ marginTop: 12, marginBottom: 6, fontSize: 12, fontWeight: 800 }}>
        {children}
      </div>
    );

    return (
      <div style={{ width: "100%", display: "block", textAlign: "left" }}>
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
              title="Deletes equipment for this report"
              disabled={!reportId}
            >
              Clear ALL Equipment (report)
            </button>
          </div>
        </div>

        {/* ✅ tax rate control */}
        <div
          style={{
            marginTop: 10,
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontSize: 12,
          }}
        >
          <span style={{ fontWeight: 700 }}>Tax %:</span>
          <input
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={Number((taxRate * 100).toFixed(2))}
            onChange={(e) => {
              const pctNum = Number(e.target.value);
              const next = Number.isFinite(pctNum) ? Math.max(0, pctNum) / 100 : 0;
              setTaxRate(next);
            }}
            style={{ width: 90 }}
          />
          <span className="text-muted">(currently {pct(taxRate)})</span>
        </div>

        {/* ✅ Left-aligned “table” block with fixed width */}
        <div style={{ marginTop: 12, width: "fit-content" }}>
          {/* column headers */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: COLS,
              columnGap: 14,
              fontSize: 12,
              fontWeight: 700,
              opacity: 0.75,
              paddingBottom: 6,
            }}
          >
            <div>Label</div>
            <div style={{ textAlign: "right" }}>Hours / %</div>
            <div style={{ textAlign: "right" }}>Total (w/ tax)</div>
          </div>

          {/* ===== Non-Labor ===== */}
          <SectionTitle>Non-Labor</SectionTitle>

          {Object.entries(totalsBySection).map(([k, v]) => (
            <Row key={k} label={labelForSection(k)} hours={pct(taxRate)} total={money(withTax(v))} />
          ))}

          <Row
            label="Non-Labor Subtotal"
            hours={pct(taxRate)}
            total={money(subTotalWithTax)}
            strong
          />

          {/* ===== Labor ===== */}
          <SectionTitle>Labor (Grouped by Type)</SectionTitle>

          {laborByType.length === 0 ? (
            <Row label="No labor totals yet." hours="" total="" muted />
          ) : (
            laborByType.map((t) => (
              <Row
                key={t.type}
                label={t.type}
                hours={`${Number(t.hours || 0).toFixed(2)} hrs`}
                total={money(withTax(t.cost))}
              />
            ))
          )}

          <Row
            label="Labor Subtotal"
            hours={`${laborHoursTotal.toFixed(2)} hrs`}
            total={money(laborSubTotalWithTax)}
            strong
          />

          {/* ===== Adders ===== */}
          <SectionTitle>Adders</SectionTitle>

          <Row label="Contingency" hours={pct(contingencyRate)} total={money(contingency)} />
          <Row label="Per Diem" hours={`${laborHoursTotal.toFixed(2)} hrs`} total={money(perDiem)} />
          <Row label="Warranty" hours={pct(warrantyRate)} total={money(warranty)} />
          <Row label="Consumables" hours={pct(consumablesRate)} total={money(consumables)} />

          <Row label="Adders Total" hours="" total={money(addersTotal)} strong />
          <Row
            label="Non-Labor Grand Total + Adders"
            hours=""
            total={money(nonLaborWithAdders)}
            strong
          />

          {/* ===== Sell Price Targets ===== */}
          <SectionTitle>Sell Price Targets</SectionTitle>

          <Row label="25% Margin" hours={pct(0.25)} total={money(margin25)} />
          <Row label="30% Margin" hours={pct(0.3)} total={money(margin30)} />
          <Row label="35% Margin" hours={pct(0.35)} total={money(margin35)} />

          {/* ===== Final ===== */}
          <SectionTitle>Final</SectionTitle>
          <Row
            label="Combined Grand Total + Adders"
            hours=""
            total={money(combinedWithAdders)}
            strong
          />
        </div>
      </div>
    );
  };

  const InputsOnly = () => (
    <div className="card mb-3">
      <div className="card-body d-flex justify-content-between align-items-center">
        <div>
          
          <div style={{ fontSize: 12, opacity: 0.75 }}>
            Report ID:{" "}
            <span style={{ fontFamily: "monospace" }}>
              {reportId ? reportId : "Not set"}
            </span>
          </div>
        </div>

        <button
          className="btn btn-sm btn-primary"
          onClick={() => setViewMode("totals")}
          disabled={!reportId}
          title={!reportId ? "Set Report ID first" : ""}
        >
          View Totals
        </button>
      </div>

      {/* ✅ Report ID control */}
   
    </div>
  );

  // ✅ NEW: Home screen (ONLY CHANGE: replace Open Report with 6 buttons)
  if (showHomeScreen) {
    // 🔧 Put your real 6 ReportIds here
    const REPORT_BUTTONS = [
      { label: "Report 1", reportId: DEFAULT_REPORT_ID },
      { label: "Report 2", reportId: "" },
      { label: "Report 3", reportId: "" },
      { label: "Report 4", reportId: "" },
      { label: "Report 5", reportId: "" },
      { label: "Report 6", reportId: "" },
    ];

    const openReport = (rid) => {
      const norm = normalizeGuid(rid);
      if (!norm) {
        alert("This button is missing a valid Report ID.");
        return;
      }

      // ✅ same behavior as Save button, but automatic
      setReportId(norm);
      setReportIdDraft(norm);

      // ✅ then go to the next page
      setShowHomeScreen(false);
    };

    return (
      <div className="home-container">
        <h1 className="text-center">Capital City</h1>

        <div className="card mt-3">
          <div className="card-body text-center">
            <div className="d-grid gap-2" style={{ maxWidth: 420, margin: "0 auto" }}>
              {REPORT_BUTTONS.map((b, i) => (
                <button
                  key={i}
                  className="btn btn-primary btn-lg"
                  onClick={() => openReport(b.reportId)}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="home-container">
      <h1>Capital City</h1>

      <button className="btn btn-primary btn-lg" onClick={() => setShowHomeScreen(true)}>
        HOME
      </button>

      {/* ✅ Either totals OR inputs */}
      {viewMode === "totals" ? (
        <TotalsOnly />
      ) : (
        <>
          <InputsOnly />

          {/* ✅ pass reportId to children that support it */}
          <div>
            <DbTestViewer
              reportId={reportId}
              onTotalsChange={(t) => setSectionCost("equipment", readCost(t))}
            />
          </div>

          {/* Labor sections */}
          <div>
            <Labor reportId={reportId} onTotalsChange={(t) => setLaborSection("labor1", readCost(t))} />
          </div>

          <div>
            <Demo reportId={reportId} onTotalsChange={(t) => setSectionCost("demo", readCost(t))} />
          </div>

          <div>
            <Labor2 reportId={reportId} onTotalsChange={(t) => setLaborSection("labor2", readCost(t))} />
          </div>

          <div>
            <Rough reportId={reportId} onTotalsChange={(t) => setSectionCost("rough", readCost(t))} />
          </div>

          <div>
            <Labor3 reportId={reportId} onTotalsChange={(t) => setLaborSection("labor3", t)} />
          </div>

          <div>
            <AirDistribution reportId={reportId} onTotalsChange={(t) => setSectionCost("air", readCost(t))} />
          </div>

          <div>
            <Labor4 reportId={reportId} onTotalsChange={(t) => setLaborSection("labor4", readCost(t))} />
          </div>

          <div>
            <Electrical reportId={reportId} onTotalsChange={(t) => setSectionCost("electrical", readCost(t))} />
          </div>

          <div>
            <Labor5 reportId={reportId} onTotalsChange={(t) => setLaborSection("labor5", t)} />
          </div>

          <div>
            <Piping reportId={reportId} onTotalsChange={(t) => setSectionCost("piping", readCost(t))} />
          </div>

          <div>
            <Labor6 reportId={reportId} onTotalsChange={(t) => setLaborSection("labor6", t)} />
          </div>

          <div>
            <Completion reportId={reportId} onTotalsChange={(t) => setSectionCost("completion", readCost(t))} />
          </div>

          <div>
            <Labor7 reportId={reportId} onTotalsChange={(t) => setLaborSection("labor7", t)} />
          </div>
        </>
      )}
    </div>
  );
}

export default Home;