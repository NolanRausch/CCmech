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
  // ✅ simple home screen toggle
  const [showHomeScreen, setShowHomeScreen] = useState(true);

  // ✅ Editable tax rate (default 7%)
  const [taxRate, setTaxRate] = useState(0.07);

  // ✅ Editable sell margin targets (defaults 25 / 30 / 35)
  const [sellMargins, setSellMargins] = useState({
    margin1: 0.25,
    margin2: 0.3,
    margin3: 0.35,
  });

  // ✅ DEFAULT GUID
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

  // ✅ Adders can be turned on/off
  const [enabledAdders, setEnabledAdders] = useState({
    contingency: true,
    perDiem: true,
    warranty: true,
    consumables: true,
  });

  // ✅ Status helpers (frontend text ↔ backend number)
  const STATUS_OPTIONS = useMemo(
    () => [
      { label: "Bid", value: 0 },
      { label: "Active", value: 1 },
      { label: "Lost", value: 2 },
    ],
    []
  );

  // ✅ which report group to show on home screen
  const [reportGroupFilter, setReportGroupFilter] = useState("bids"); // bids | active | lost

  // ✅ ReportId helpers
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

  // ✅ load persisted reportId on first render
  useEffect(() => {
    const saved = localStorage.getItem("ccms_report_id") || "";
    const normSaved = normalizeGuid(saved);
    const normDefault = normalizeGuid(DEFAULT_REPORT_ID);
    const initial = normSaved || normDefault || "";

    setReportId(initial);
    setReportIdDraft(initial);
  }, [normalizeGuid]);

  // ✅ expose globally
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
    const normDefault = normalizeGuid(DEFAULT_REPORT_ID);
    setReportId(normDefault || "");
    setReportIdDraft(normDefault || "");
  }, [normalizeGuid]);

  // ✅ make section setter idempotent
  const setSectionCost = useCallback((key, cost) => {
    const next = Number(cost) || 0;

    setTotalsBySection((prev) => {
      if ((prev[key] ?? 0) === next) return prev;
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

  // ✅ make labor setter idempotent
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

        if (same) return prev;

        return { ...prev, [key]: parsed };
      });
    },
    [readLaborPayload]
  );

  const toggleAdder = useCallback((key) => {
    setEnabledAdders((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }, []);

  const setSellMargin = useCallback((key, pctValue) => {
    const raw = Number(pctValue);
    const safe = Number.isFinite(raw) ? Math.max(0, raw) / 100 : 0;

    setSellMargins((prev) => {
      if ((prev[key] ?? 0) === safe) return prev;
      return { ...prev, [key]: safe };
    });
  }, []);

  // ✅ Better money formatting
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

  // ✅ Combined totals
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

  const warranty = useMemo(
    () => grandTotalWithTax * warrantyRate,
    [grandTotalWithTax]
  );

  const consumables = useMemo(() => subTotal * consumablesRate, [subTotal]);

  const contingencyIncluded = useMemo(
    () => (enabledAdders.contingency ? contingency : 0),
    [enabledAdders.contingency, contingency]
  );

  const perDiemIncluded = useMemo(
    () => (enabledAdders.perDiem ? perDiem : 0),
    [enabledAdders.perDiem, perDiem]
  );

  const warrantyIncluded = useMemo(
    () => (enabledAdders.warranty ? warranty : 0),
    [enabledAdders.warranty, warranty]
  );

  const consumablesIncluded = useMemo(
    () => (enabledAdders.consumables ? consumables : 0),
    [enabledAdders.consumables, consumables]
  );

  const addersTotal = useMemo(
    () =>
      contingencyIncluded +
      perDiemIncluded +
      warrantyIncluded +
      consumablesIncluded,
    [
      contingencyIncluded,
      perDiemIncluded,
      warrantyIncluded,
      consumablesIncluded,
    ]
  );

  const combinedWithAdders = useMemo(
    () => combinedGrandTotalWithTax + addersTotal,
    [combinedGrandTotalWithTax, addersTotal]
  );

  const nonLaborWithAdders = useMemo(
    () => grandTotalWithTax + addersTotal,
    [grandTotalWithTax, addersTotal]
  );

  const margin1Value = useMemo(() => {
    const m = Number(sellMargins.margin1) || 0;
    return m >= 1 ? 0 : combinedWithAdders / (1 - m);
  }, [combinedWithAdders, sellMargins.margin1]);

  const margin2Value = useMemo(() => {
    const m = Number(sellMargins.margin2) || 0;
    return m >= 1 ? 0 : combinedWithAdders / (1 - m);
  }, [combinedWithAdders, sellMargins.margin2]);

  const margin3Value = useMemo(() => {
    const m = Number(sellMargins.margin3) || 0;
    return m >= 1 ? 0 : combinedWithAdders / (1 - m);
  }, [combinedWithAdders, sellMargins.margin3]);

  // ✅ Return on man hours = (sales price target - combined total value) / hours
  const romh1 = useMemo(() => {
    if (!laborHoursTotal) return 0;
    return (margin1Value - combinedWithAdders) / laborHoursTotal;
  }, [margin1Value, combinedWithAdders, laborHoursTotal]);

  const romh2 = useMemo(() => {
    if (!laborHoursTotal) return 0;
    return (margin2Value - combinedWithAdders) / laborHoursTotal;
  }, [margin2Value, combinedWithAdders, laborHoursTotal]);

  const romh3 = useMemo(() => {
    if (!laborHoursTotal) return 0;
    return (margin3Value - combinedWithAdders) / laborHoursTotal;
  }, [margin3Value, combinedWithAdders, laborHoursTotal]);

  // ============================================================
  // ✅ HOME REPORTS CRUD
  // ============================================================
  const REPORTS_API =
    "https://ccmechconstruction-bjate8cvcha3ecgt.canadacentral-01.azurewebsites.net/api/reports";

  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState("");
  const [reportSortBy, setReportSortBy] = useState("dateDesc"); // dateDesc | dateAsc | nameAsc | nameDesc

  const blankReport = useMemo(
    () => ({
      ReportId: "",
      ReportName: "",
      CustomerName: "",
      Address: "",
      Status: 0,
      Date: "",
      ProjectNumber: "",
      Notes: "",
    }),
    []
  );

  const [reportDraft, setReportDraft] = useState(blankReport);
  const [editingId, setEditingId] = useState("");

  const loadReports = useCallback(async () => {
    setReportsLoading(true);
    setReportsError("");
    try {
      const res = await fetch(REPORTS_API);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);

      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.recordset)
        ? data.recordset
        : [];
      setReports(list);
    } catch (e) {
      console.error("❌ loadReports:", e);
      setReports([]);
      setReportsError(e.message || String(e));
    } finally {
      setReportsLoading(false);
    }
  }, [REPORTS_API]);

  useEffect(() => {
    if (showHomeScreen) loadReports();
  }, [showHomeScreen, loadReports]);

  const startNewReport = useCallback(() => {
    setEditingId("");
    setReportDraft(blankReport);
  }, [blankReport]);

  const startEditReport = useCallback((r) => {
    const id = String(r?.ReportId || r?.reportId || r?.id || "").trim();

    setEditingId(id);

    const isoDate = (() => {
      const v = r?.Date ?? r?.date ?? "";
      if (!v) return "";
      if (/^\d{4}-\d{2}-\d{2}$/.test(String(v))) return String(v);
      const d = new window.Date(v);
      if (Number.isNaN(d.getTime())) return "";
      return d.toISOString().slice(0, 10);
    })();

    setReportDraft({
      ReportId: id,
      ReportName: r?.ReportName ?? "",
      CustomerName: r?.CustomerName ?? "",
      Address: r?.Address ?? "",
      Status: Number(r?.Status ?? 0) || 0,
      Date: isoDate,
      ProjectNumber: r?.ProjectNumber ?? "",
      Notes: r?.Notes ?? "",
    });
  }, []);

  const saveReport = useCallback(async () => {
    setReportsError("");
    try {
      const isEdit = !!editingId;

      if (!String(reportDraft.ReportName || "").trim()) {
        alert("ReportName is required.");
        return;
      }

      const payload = {
        ReportName: String(reportDraft.ReportName ?? ""),
        CustomerName: String(reportDraft.CustomerName ?? ""),
        Address: String(reportDraft.Address ?? ""),
        Status: Number(reportDraft.Status ?? 0) || 0,
        Date: reportDraft.Date ? String(reportDraft.Date) : null,
        ProjectNumber:
          reportDraft.ProjectNumber === "" || reportDraft.ProjectNumber == null
            ? null
            : Number(reportDraft.ProjectNumber),
        Notes:
          Number(reportDraft.Status ?? 0) === 2
            ? String(reportDraft.Notes ?? "")
            : null,
      };

      const url = isEdit
        ? `${REPORTS_API}/${encodeURIComponent(editingId)}`
        : REPORTS_API;
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);

      await loadReports();
      startNewReport();
      alert("✅ Report saved");
    } catch (e) {
      console.error("❌ saveReport:", e);
      alert("❌ Save failed: " + (e.message || e));
    }
  }, [REPORTS_API, editingId, reportDraft, loadReports, startNewReport]);

  const deleteReport = useCallback(
    async (id) => {
      const rid = String(id || "").trim();
      if (!rid) return;

      if (!window.confirm("Delete this report?")) return;

      try {
        const res = await fetch(`${REPORTS_API}/${encodeURIComponent(rid)}`, {
          method: "DELETE",
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);

        await loadReports();
        if (editingId === rid) startNewReport();
      } catch (e) {
        console.error("❌ deleteReport:", e);
        alert("❌ Delete failed: " + (e.message || e));
      }
    },
    [REPORTS_API, loadReports, editingId, startNewReport]
  );

  const openReportFromRow = useCallback(
    (rid) => {
      const norm = normalizeGuid(rid);
      if (!norm) {
        alert("This report row is missing a valid ReportId (GUID).");
        return;
      }
      setReportId(norm);
      setReportIdDraft(norm);
      setShowHomeScreen(false);
    },
    [normalizeGuid]
  );

  const getStatusLabel = useCallback((status) => {
    const s = Number(status ?? 0);
    if (s === 1) return "Active";
    if (s === 2) return "Lost";
    return "Bid";
  }, []);

  const parseDateValue = useCallback((v) => {
    if (!v) return 0;
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? 0 : d.getTime();
  }, []);

  const sortReports = useCallback(
    (list) => {
      const copy = [...list];

      copy.sort((a, b) => {
        const aName = String(a?.ReportName ?? "").toLowerCase();
        const bName = String(b?.ReportName ?? "").toLowerCase();
        const aDate = parseDateValue(a?.Date ?? a?.date);
        const bDate = parseDateValue(b?.Date ?? b?.date);

        switch (reportSortBy) {
          case "dateAsc":
            return aDate - bDate || aName.localeCompare(bName);
          case "nameAsc":
            return aName.localeCompare(bName) || bDate - aDate;
          case "nameDesc":
            return bName.localeCompare(aName) || bDate - aDate;
          case "dateDesc":
          default:
            return bDate - aDate || aName.localeCompare(bName);
        }
      });

      return copy;
    },
    [parseDateValue, reportSortBy]
  );

  const groupedReports = useMemo(() => {
    const bids = [];
    const active = [];
    const lost = [];

    for (const r of reports) {
      const status = Number(r?.Status ?? 0);
      if (status === 1) active.push(r);
      else if (status === 2) lost.push(r);
      else bids.push(r);
    }

    return {
      bids: sortReports(bids),
      active: sortReports(active),
      lost: sortReports(lost),
    };
  }, [reports, sortReports]);

  const currentReportGroup = useMemo(() => {
    if (reportGroupFilter === "active") {
      return { title: "Active Jobs", rows: groupedReports.active };
    }
    if (reportGroupFilter === "lost") {
      return { title: "Lost Jobs", rows: groupedReports.lost };
    }
    return { title: "Bid Jobs", rows: groupedReports.bids };
  }, [groupedReports, reportGroupFilter]);

  if (selected === 1000) {
    return (
      <BoxView1
        number={selected}
        reportId={reportId}
        onBack={() => setSelected(null)}
      />
    );
  }

  const handleClearAll = async () => {
    if (!reportId) {
      alert("Set a Report ID first.");
      return;
    }
    if (
      !window.confirm(
        "Are you sure you want to delete ALL equipment for this report?"
      )
    )
      return;

    try {
      const res = await fetch(
        `https://ccmechconstruction-bjate8cvcha3ecgt.canadacentral-01.azurewebsites.net/api/equipment/clear?reportId=${encodeURIComponent(
          reportId
        )}`,
        { method: "DELETE", headers: { "x-report-id": reportId } }
      );

      const data = await res.json().catch(() => ({}));
      if (!res.ok)
        throw new Error(
          data.error || `Failed to clear table (HTTP ${res.status})`
        );

      console.log("✅ Cleared:", data);
      alert("✅ All equipment deleted for this report");
    } catch (err) {
      console.error("❌ Clear failed:", err);
      alert("❌ Error clearing table: " + (err.message || err));
    }
  };

  const TotalsOnly = () => {
    const COLS = "360px 120px 180px";

    const Row = ({
      label,
      hours = "",
      total = "",
      strong = false,
      muted = false,
    }) => (
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

    const AdderRow = ({
      checked,
      onChange,
      label,
      hours = "",
      total = "",
    }) => (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: COLS,
          columnGap: 14,
          alignItems: "center",
          padding: "3px 0",
          fontSize: 12,
          lineHeight: 1.35,
        }}
      >
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            margin: 0,
            cursor: "pointer",
          }}
        >
          <input type="checkbox" checked={checked} onChange={onChange} />
          <span>{label}</span>
        </label>

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
            fontWeight: 600,
            fontVariantNumeric: "tabular-nums",
            whiteSpace: "nowrap",
            opacity: checked ? 1 : 0.45,
          }}
        >
          {total}
        </div>
      </div>
    );

    const SellRow = ({ value, onChange, total = "", romh = "" }) => (
      <>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: COLS,
            columnGap: 14,
            alignItems: "center",
            padding: "3px 0",
            fontSize: 12,
            lineHeight: 1.35,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="number"
              step="0.01"
              min="0"
              max="99.99"
              value={Number((Number(value || 0) * 100).toFixed(2))}
              onChange={onChange}
              style={{ width: 90 }}
            />
            <span>Margin</span>
          </div>

          <div
            style={{
              textAlign: "right",
              fontVariantNumeric: "tabular-nums",
              whiteSpace: "nowrap",
            }}
          >
            {pct(value)}
          </div>

          <div
            style={{
              textAlign: "right",
              fontWeight: 600,
              fontVariantNumeric: "tabular-nums",
              whiteSpace: "nowrap",
            }}
          >
            {total}
          </div>
        </div>

        <Row
          label="Return on Man Hours"
          hours={laborHoursTotal ? `${laborHoursTotal.toFixed(2)} hrs` : "0.00 hrs"}
          total={romh}
          muted
        />
      </>
    );

    const SectionTitle = ({ children }) => (
      <div
        style={{ marginTop: 12, marginBottom: 6, fontSize: 12, fontWeight: 800 }}
      >
        {children}
      </div>
    );

    const laborSectionRows = useMemo(() => {
      const order = [
        ["labor1", "Labor 1"],
        ["labor2", "Labor 2"],
        ["labor3", "Labor 3"],
        ["labor4", "Labor 4"],
        ["labor5", "Labor 5"],
        ["labor6", "Labor 6"],
        ["labor7", "Labor 7"],
      ];

      return order
        .map(([key, label]) => {
          const v = laborSections[key] || {};
          const cost = Number(v.cost) || 0;
          const hours = Number(v.hours) || 0;
          return { key, label, cost, hours };
        })
        .filter((x) => x.cost !== 0 || x.hours !== 0);
    }, [laborSections]);

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
          </div>
        </div>

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
              const next = Number.isFinite(pctNum)
                ? Math.max(0, pctNum) / 100
                : 0;
              setTaxRate(next);
            }}
            style={{ width: 90 }}
          />
          <span className="text-muted">(currently {pct(taxRate)})</span>
        </div>

        <div style={{ marginTop: 12, width: "fit-content" }}>
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
            <div style={{ textAlign: "right" }}>Total (included)</div>
          </div>

          <SectionTitle>Non-Labor</SectionTitle>

          {Object.entries(totalsBySection).map(([k, v]) => (
            <Row
              key={k}
              label={labelForSection(k)}
              hours={pct(taxRate)}
              total={money(withTax(v))}
            />
          ))}

          <Row
            label="Non-Labor Subtotal"
            hours={pct(taxRate)}
            total={money(subTotalWithTax)}
            strong
          />

          <SectionTitle>Labor </SectionTitle>

          {laborByType.length > 0 ? (
            laborByType.map((t) => (
              <Row
                key={t.type}
                label={t.type}
                hours={`${Number(t.hours || 0).toFixed(2)} hrs`}
                total={money(withTax(t.cost))}
              />
            ))
          ) : laborSectionRows.length > 0 ? (
            laborSectionRows.map((x) => (
              <Row
                key={x.key}
                label={x.label}
                hours={x.hours ? `${x.hours.toFixed(2)} hrs` : ""}
                total={money(withTax(x.cost))}
              />
            ))
          ) : (
            <Row label="No labor totals yet." hours="" total="" muted />
          )}

          <Row
            label="Labor Subtotal"
            hours={`${laborHoursTotal.toFixed(2)} hrs`}
            total={money(laborSubTotalWithTax)}
            strong
          />

          <SectionTitle>Adders</SectionTitle>

          <AdderRow
            checked={enabledAdders.contingency}
            onChange={() => toggleAdder("contingency")}
            label="Contingency"
            hours={pct(contingencyRate)}
            total={money(contingencyIncluded)}
          />

          <AdderRow
            checked={enabledAdders.perDiem}
            onChange={() => toggleAdder("perDiem")}
            label="Per Diem"
            hours={`${laborHoursTotal.toFixed(2)} hrs`}
            total={money(perDiemIncluded)}
          />

          <AdderRow
            checked={enabledAdders.warranty}
            onChange={() => toggleAdder("warranty")}
            label="Warranty"
            hours={pct(warrantyRate)}
            total={money(warrantyIncluded)}
          />

          <AdderRow
            checked={enabledAdders.consumables}
            onChange={() => toggleAdder("consumables")}
            label="Consumables"
            hours={pct(consumablesRate)}
            total={money(consumablesIncluded)}
          />

          <Row label="Adders Total" hours="" total={money(addersTotal)} strong />

          <Row
            label="Non-Labor Grand Total + Adders"
            hours=""
            total={money(nonLaborWithAdders)}
            strong
          />

          <Row
            label="Combined Grand Total + Adders"
            hours=""
            total={money(combinedWithAdders)}
            strong
          />

          <SectionTitle>Sell Price Targets</SectionTitle>

          <SellRow
            value={sellMargins.margin1}
            onChange={(e) => setSellMargin("margin1", e.target.value)}
            total={money(margin1Value)}
            romh={money(romh1)}
          />
          <SellRow
            value={sellMargins.margin2}
            onChange={(e) => setSellMargin("margin2", e.target.value)}
            total={money(margin2Value)}
            romh={money(romh2)}
          />
          <SellRow
            value={sellMargins.margin3}
            onChange={(e) => setSellMargin("margin3", e.target.value)}
            total={money(margin3Value)}
            romh={money(romh3)}
          />
        </div>
      </div>
    );
  };

  const InputsOnly = () => (
    <div className="mb-3">
      <div className="text-center mb-2">
        <h1 className="m-0">Capital City</h1>
      </div>

      <div className="d-flex justify-content-center gap-2">
        <button
          className="btn btn-primary btn-sm"
          onClick={() => setShowHomeScreen(true)}
        >
          Back To Reports
        </button>

        <button
          className="btn btn-primary btn-sm"
          onClick={() => setViewMode("totals")}
          disabled={!reportId}
          title={!reportId ? "Set Report ID first" : ""}
        >
          View Totals
        </button>
      </div>
    </div>
  );

  const ReportsTable = ({ title, rows }) => {
    if (!rows.length) return null;

    const showNotes = title === "Lost Jobs";

    return (
      <div className="mt-4">
        <h6 className="mb-2">{title}</h6>
        <div className="table-responsive">
          <table className="table table-sm table-striped align-middle">
            <thead>
              <tr>
                <th>Report Name</th>
                <th>Customer</th>
                <th>Project #</th>
                <th>Status</th>
                <th>Date</th>
                {showNotes && <th>Notes</th>}
                <th style={{ width: 260 }} className="text-end">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const rid = String(r?.ReportId || r?.reportId || r?.id || "");
                return (
                  <tr key={rid || Math.random()}>
                    <td>{r?.ReportName ?? ""}</td>
                    <td>{r?.CustomerName ?? ""}</td>
                    <td>{r?.ProjectNumber ?? ""}</td>
                    <td>{getStatusLabel(r?.Status)}</td>
                    <td>{String(r?.Date ?? "").slice(0, 10)}</td>
                    {showNotes && <td>{r?.Notes ?? ""}</td>}
                    <td className="text-end">
                      <div className="btn-group">
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => openReportFromRow(rid)}
                          title="Set ReportId and open inputs"
                        >
                          Open
                        </button>
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => startEditReport(r)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => deleteReport(rid)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  if (showHomeScreen) {
    return (
      <div className="home-container">
        <h1 className="text-center">Capital City</h1>

        <div className="card mt-3">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
              <h5 className="mb-0">Reports</h5>

              <div className="d-flex gap-2 align-items-center flex-wrap">
                <select
                  className="form-select form-select-sm"
                  style={{ width: 180 }}
                  value={reportGroupFilter}
                  onChange={(e) => setReportGroupFilter(e.target.value)}
                >
                  <option value="bids">Show: Bid</option>
                  <option value="active">Show: Active</option>
                  <option value="lost">Show: Lost</option>
                </select>

                <select
                  className="form-select form-select-sm"
                  style={{ width: 180 }}
                  value={reportSortBy}
                  onChange={(e) => setReportSortBy(e.target.value)}
                >
                  <option value="dateDesc">Sort: Date (Newest)</option>
                  <option value="dateAsc">Sort: Date (Oldest)</option>
                  <option value="nameAsc">Sort: Project Name (A-Z)</option>
                  <option value="nameDesc">Sort: Project Name (Z-A)</option>
                </select>

                <button
                  className="btn btn-outline-secondary btn-sm"
                  onClick={loadReports}
                >
                  Refresh
                </button>
                <button className="btn btn-primary btn-sm" onClick={startNewReport}>
                  + New
                </button>
              </div>
            </div>

            {reportsError && (
              <div className="alert alert-danger mt-3 mb-0">{reportsError}</div>
            )}

            <div className="mt-3">
              <div className="row g-2">
                <div className="col-md-4">
                  <label className="form-label small mb-1">Report Name</label>
                  <input
                    className="form-control"
                    value={reportDraft.ReportName}
                    onChange={(e) =>
                      setReportDraft((p) => ({ ...p, ReportName: e.target.value }))
                    }
                    placeholder="e.g., Bid - Norcross"
                  />
                </div>

                <div className="col-md-3">
                  <label className="form-label small mb-1">Customer Name</label>
                  <input
                    className="form-control"
                    value={reportDraft.CustomerName}
                    onChange={(e) =>
                      setReportDraft((p) => ({
                        ...p,
                        CustomerName: e.target.value,
                      }))
                    }
                    placeholder="Customer"
                  />
                </div>

                <div className="col-md-5">
                  <label className="form-label small mb-1">Address</label>
                  <input
                    className="form-control"
                    value={reportDraft.Address}
                    onChange={(e) =>
                      setReportDraft((p) => ({ ...p, Address: e.target.value }))
                    }
                    placeholder="Address"
                  />
                </div>

                <div className="col-md-2">
                  <label className="form-label small mb-1">Status</label>
                  <select
                    className="form-select"
                    value={Number(reportDraft.Status ?? 0)}
                    onChange={(e) =>
                      setReportDraft((p) => ({
                        ...p,
                        Status: Number(e.target.value) || 0,
                      }))
                    }
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-md-3">
                  <label className="form-label small mb-1">Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={reportDraft.Date}
                    onChange={(e) =>
                      setReportDraft((p) => ({ ...p, Date: e.target.value }))
                    }
                  />
                </div>

                <div className="col-md-3">
                  <label className="form-label small mb-1">Project # (4-digit)</label>
                  <input
                    className="form-control"
                    value={reportDraft.ProjectNumber}
                    onChange={(e) =>
                      setReportDraft((p) => ({
                        ...p,
                        ProjectNumber: e.target.value,
                      }))
                    }
                    placeholder="auto"
                  />
                </div>

                {Number(reportDraft.Status ?? 0) === 2 && (
                  <div className="col-md-12">
                    <label className="form-label small mb-1">Notes</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={reportDraft.Notes}
                      onChange={(e) =>
                        setReportDraft((p) => ({
                          ...p,
                          Notes: e.target.value,
                        }))
                      }
                      placeholder="Notes for lost job"
                    />
                  </div>
                )}

                <div className="col-md-4 d-flex align-items-end gap-2">
                  <button className="btn btn-success" onClick={saveReport}>
                    {editingId ? "Save Changes" : "Create Report"}
                  </button>
                  <button className="btn btn-outline-secondary" onClick={startNewReport}>
                    Clear
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-4">
              {reportsLoading ? (
                <div className="text-muted">Loading reports…</div>
              ) : reports.length === 0 ? (
                <div className="text-muted">No reports found.</div>
              ) : (
                <ReportsTable
                  title={currentReportGroup.title}
                  rows={currentReportGroup.rows}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="home-container">
      {viewMode === "totals" ? (
        <>
          <h1>Capital City</h1>
          <TotalsOnly />
        </>
      ) : (
        <>
          <InputsOnly />

          <div>
            <DbTestViewer
              reportId={reportId}
              onTotalsChange={(t) => setSectionCost("equipment", readCost(t))}
            />
          </div>

          <div>
            <Labor
              reportId={reportId}
              onTotalsChange={(t) => setLaborSection("labor1", t)}
            />
          </div>

          <div>
            <Demo
              reportId={reportId}
              onTotalsChange={(t) => setSectionCost("demo", readCost(t))}
            />
          </div>

          <div>
            <Labor2
              reportId={reportId}
              onTotalsChange={(t) => setLaborSection("labor2", t)}
            />
          </div>

          <div>
            <Rough
              reportId={reportId}
              onTotalsChange={(t) => setSectionCost("rough", readCost(t))}
            />
          </div>

          <div>
            <Labor3
              reportId={reportId}
              onTotalsChange={(t) => setLaborSection("labor3", t)}
            />
          </div>

          <div>
            <AirDistribution
              reportId={reportId}
              onTotalsChange={(t) => setSectionCost("air", readCost(t))}
            />
          </div>

          <div>
            <Labor4
              reportId={reportId}
              onTotalsChange={(t) => setLaborSection("labor4", t)}
            />
          </div>

          <div>
            <Electrical
              reportId={reportId}
              onTotalsChange={(t) => setSectionCost("electrical", readCost(t))}
            />
          </div>

          <div>
            <Labor5
              reportId={reportId}
              onTotalsChange={(t) => setLaborSection("labor5", t)}
            />
          </div>

          <div>
            <Piping
              reportId={reportId}
              onTotalsChange={(t) => setSectionCost("piping", readCost(t))}
            />
          </div>

          <div>
            <Labor6
              reportId={reportId}
              onTotalsChange={(t) => setLaborSection("labor6", t)}
            />
          </div>

          <div>
            <Completion
              reportId={reportId}
              onTotalsChange={(t) => setSectionCost("completion", readCost(t))}
            />
          </div>

          <div>
            <Labor7
              reportId={reportId}
              onTotalsChange={(t) => setLaborSection("labor7", t)}
            />
          </div>
        </>
      )}
    </div>
  );
}

export default Home;