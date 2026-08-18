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
import TotalsPage from "./TotalsPage";

// Labor components
import Labor from "./Labor";
import Labor2 from "./Labor2";
import Labor3 from "./Labor3";
import Labor4 from "./Labor4";
import Labor5 from "./Labor5";
import Labor6 from "./Labor6";
import Labor7 from "./Labor7";

function Home() {
  const [showHomeScreen, setShowHomeScreen] = useState(true);
  const [taxRate, setTaxRate] = useState(0.07);

  const [sellMargins, setSellMargins] = useState({
    margin1: 0.25,
    margin2: 0.3,
    margin3: 0.35,
  });

  const DEFAULT_REPORT_ID = "82e93dd1-7891-4f78-b06d-c5ba14c93c9d";

  const [reportId, setReportId] = useState("");
  const [reportIdDraft, setReportIdDraft] = useState("");
  const [selected, setSelected] = useState(null);
  const [viewMode, setViewMode] = useState("input");

  const [totalsBySection, setTotalsBySection] = useState({
    equipment: 0,
    demo: 0,
    rough: 0,
    air: 0,
    electrical: 0,
    piping: 0,
    completion: 0,
  });

  const [laborSections, setLaborSections] = useState({
    labor1: { cost: 0, hours: 0, byType: [] },
    labor2: { cost: 0, hours: 0, byType: [] },
    labor3: { cost: 0, hours: 0, byType: [] },
    labor4: { cost: 0, hours: 0, byType: [] },
    labor5: { cost: 0, hours: 0, byType: [] },
    labor6: { cost: 0, hours: 0, byType: [] },
    labor7: { cost: 0, hours: 0, byType: [] },
  });

  const [lineItemsBySection, setLineItemsBySection] = useState({
    equipment: [],
    demo: [],
    rough: [],
    air: [],
    electrical: [],
    piping: [],
    completion: [],
  });

  const [laborLineItemsBySection, setLaborLineItemsBySection] = useState({
    labor1: [],
    labor2: [],
    labor3: [],
    labor4: [],
    labor5: [],
    labor6: [],
    labor7: [],
  });

  const [enabledAdders, setEnabledAdders] = useState({
    perDiem: true,
    driveTime: false,
  });

  const [driveTime, setDriveTime] = useState("");
  const [premiumBaseInput, setPremiumBaseInput] = useState("");

  const [jobProgressRows, setJobProgressRows] = useState([
    { key: "equipment", code: "1000", label: "Equipment", percent: "", notes: "" },
    { key: "demo", code: "2000", label: "Demo", percent: "", notes: "" },
    { key: "rough", code: "3000", label: "Rough", percent: "", notes: "" },
    { key: "air", code: "4000", label: "Air Distribution", percent: "", notes: "" },
    { key: "electrical", code: "5000", label: "Electrical", percent: "", notes: "" },
    { key: "piping", code: "6000", label: "Piping", percent: "", notes: "" },
    { key: "completion", code: "7000", label: "Completion", percent: "", notes: "" },
  ]);

  const STATUS_OPTIONS = useMemo(
    () => [
      { label: "Bid", value: 0 },
      { label: "Active", value: 1 },
      { label: "Lost", value: 2 },
      { label: "Complete", value: 3 },
    ],
    []
  );

  const [reportGroupFilter, setReportGroupFilter] = useState("all");
  const [azureUser, setAzureUser] = useState(null);
  const [azureUserLoading, setAzureUserLoading] = useState(false);

  const [sharedReports, setSharedReports] = useState([]);
  const [sharedReportsLoading, setSharedReportsLoading] = useState(false);
  const [sharedReportsError, setSharedReportsError] = useState("");

  const REPORT_USERNAMES_API =
    "https://ccmechconstruction-bjate8cvcha3ecgt.canadacentral-01.azurewebsites.net/api/report-usernames";

  const [shareUsernames, setShareUsernames] = useState([]);
  const [shareUsernamesLoading, setShareUsernamesLoading] = useState(false);
  const [shareOpenForId, setShareOpenForId] = useState("");
  const [shareSelectedUsername, setShareSelectedUsername] = useState("");

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

  useEffect(() => {
    const saved = localStorage.getItem("ccms_report_id") || "";
    const normSaved = normalizeGuid(saved);
    const normDefault = normalizeGuid(DEFAULT_REPORT_ID);
    const initial = normSaved || normDefault || "";

    setReportId(initial);
    setReportIdDraft(initial);
  }, [normalizeGuid]);

  useEffect(() => {
    if (reportId) localStorage.setItem("ccms_report_id", reportId);
    else localStorage.removeItem("ccms_report_id");
    window.__REPORT_ID__ = reportId || "";
  }, [reportId]);

  const setSectionCost = useCallback((key, cost) => {
    const next = Number(cost) || 0;

    setTotalsBySection((prev) => {
      if ((prev[key] ?? 0) === next) return prev;
      return { ...prev, [key]: next };
    });
  }, []);

  const readCost = useCallback((t) => {
    if (typeof t === "number") return t;
    if (typeof t === "string") return Number(t);

    if (t && typeof t === "object") {
      return Number(t.cost ?? t.total ?? t.totalCost ?? t.subTotal) || 0;
    }

    return 0;
  }, []);

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

  const setLaborSection = useCallback(
    (key, payload) => {
      const parsed = readLaborPayload(payload);

      setLaborSections((prev) => {
        const curr = prev[key];

        const same =
          (curr?.cost ?? 0) === parsed.cost &&
          (curr?.hours ?? 0) === parsed.hours &&
          JSON.stringify(curr?.byType ?? []) === JSON.stringify(parsed.byType ?? []);

        if (same) return prev;
        return { ...prev, [key]: parsed };
      });
    },
    [readLaborPayload]
  );

  const readLineItemsPayload = useCallback((payload) => {
    if (Array.isArray(payload)) return payload;

    if (payload && typeof payload === "object") {
      if (Array.isArray(payload.rows)) return payload.rows;
      if (Array.isArray(payload.items)) return payload.items;
      if (Array.isArray(payload.lineItems)) return payload.lineItems;
      if (Array.isArray(payload.data)) return payload.data;
      if (Array.isArray(payload.recordset)) return payload.recordset;
    }

    return [];
  }, []);

  const setSectionLineItems = useCallback(
    (key, payload) => {
      const rows = readLineItemsPayload(payload);

      setLineItemsBySection((prev) => {
        const same =
          JSON.stringify(prev?.[key] ?? []) === JSON.stringify(rows ?? []);

        if (same) return prev;

        return {
          ...prev,
          [key]: rows,
        };
      });
    },
    [readLineItemsPayload]
  );

  const setLaborLineItems = useCallback(
    (key, payload) => {
      const rows = readLineItemsPayload(payload);

      setLaborLineItemsBySection((prev) => {
        const same =
          JSON.stringify(prev?.[key] ?? []) === JSON.stringify(rows ?? []);

        if (same) return prev;

        return {
          ...prev,
          [key]: rows,
        };
      });
    },
    [readLineItemsPayload]
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

  const updateJobProgressRow = useCallback((key, field, value) => {
    setJobProgressRows((prev) =>
      prev.map((row) =>
        row.key === key
          ? {
              ...row,
              [field]:
                field === "percent"
                  ? String(value || "").replace(/[^0-9.]/g, "")
                  : value,
            }
          : row
      )
    );
  }, []);

  const loadAzureUser = useCallback(async () => {
    setAzureUserLoading(true);

    try {
      const res = await fetch("/.auth/me", { credentials: "include" });
      const data = await res.json().catch(() => null);
      setAzureUser(data?.clientPrincipal || null);
    } catch (e) {
      console.error("❌ loadAzureUser:", e);
      setAzureUser(null);
    } finally {
      setAzureUserLoading(false);
    }
  }, []);

  const currentUserName = useMemo(
    () => String(azureUser?.userDetails || "").trim(),
    [azureUser]
  );

  const REPORTS_API =
    "https://ccmechconstruction-bjate8cvcha3ecgt.canadacentral-01.azurewebsites.net/api/reports";

  const SHARED_REPORTS_API =
    "https://ccmechconstruction-bjate8cvcha3ecgt.canadacentral-01.azurewebsites.net/api/reports/shared";

  const EXCEL_EXPORT_API =
    "https://ccmechconstruction-bjate8cvcha3ecgt.canadacentral-01.azurewebsites.net/api/export-excel";

  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState("");
  const [reportSortBy, setReportSortBy] = useState("dateDesc");
  const [excelExportLoading, setExcelExportLoading] = useState(false);

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

  const loadSharedReports = useCallback(async () => {
    if (!currentUserName) {
      setSharedReports([]);
      setSharedReportsError("");
      return;
    }

    setSharedReportsLoading(true);
    setSharedReportsError("");

    try {
      const res = await fetch(
        `${SHARED_REPORTS_API}/${encodeURIComponent(currentUserName)}`
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);

      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.recordset)
        ? data.recordset
        : [];

      setSharedReports(list);
    } catch (e) {
      console.error("❌ loadSharedReports:", e);
      setSharedReports([]);
      setSharedReportsError(e.message || String(e));
    } finally {
      setSharedReportsLoading(false);
    }
  }, [currentUserName, SHARED_REPORTS_API]);

  const loadShareUsernames = useCallback(async () => {
    setShareUsernamesLoading(true);

    try {
      const res = await fetch(REPORT_USERNAMES_API);
      const data = await res.json().catch(() => []);

      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);

      const list = Array.isArray(data) ? data : [];

      setShareUsernames(
        list.map((x) => String(x?.Username || "").trim()).filter(Boolean)
      );
    } catch (e) {
      console.error("❌ loadShareUsernames:", e);
      setShareUsernames([]);
    } finally {
      setShareUsernamesLoading(false);
    }
  }, [REPORT_USERNAMES_API]);

  useEffect(() => {
    if (showHomeScreen) {
      loadReports();
      loadAzureUser();
      loadShareUsernames();
    }
  }, [showHomeScreen, loadReports, loadAzureUser, loadShareUsernames]);

  useEffect(() => {
    if (showHomeScreen) {
      loadSharedReports();
    }
  }, [showHomeScreen, loadSharedReports]);

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

      if (!isEdit && !currentUserName) {
        alert("No logged in user found.");
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
        ...(isEdit ? {} : { CreatedBy: currentUserName }),
      };

      const url = isEdit
        ? `${REPORTS_API}/${encodeURIComponent(editingId)}`
        : REPORTS_API;

      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);

      await loadReports();
      await loadSharedReports();
      startNewReport();

      alert("✅ Report saved");
    } catch (e) {
      console.error("❌ saveReport:", e);
      alert("❌ Save failed: " + (e.message || e));
    }
  }, [
    editingId,
    reportDraft,
    currentUserName,
    REPORTS_API,
    loadReports,
    loadSharedReports,
    startNewReport,
  ]);

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
        await loadSharedReports();

        if (editingId === rid) startNewReport();
      } catch (e) {
        console.error("❌ deleteReport:", e);
        alert("❌ Delete failed: " + (e.message || e));
      }
    },
    [editingId, REPORTS_API, loadReports, loadSharedReports, startNewReport]
  );

  const shareReport = useCallback((id) => {
    const rid = String(id || "").trim();

    if (!rid) return;

    setShareOpenForId(rid);
    setShareSelectedUsername("");
  }, []);

  const confirmShareReport = useCallback(
    async (rid) => {
      const clean = String(shareSelectedUsername || "").trim();

      if (!rid || !clean) return;

      try {
        const res = await fetch(SHARED_REPORTS_API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ReportId: rid,
            Username: clean,
          }),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);

        alert("✅ Report shared");

        setShareOpenForId("");
        setShareSelectedUsername("");

        await loadSharedReports();
      } catch (e) {
        console.error("❌ shareReport:", e);
        alert("❌ Share failed: " + (e.message || e));
      }
    },
    [shareSelectedUsername, SHARED_REPORTS_API, loadSharedReports]
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
    if (s === 3) return "Complete";

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

  const visibleReports = useMemo(() => {
    if (!currentUserName) return reports;

    return reports.filter(
      (r) =>
        String(r?.CreatedBy || "").trim().toLowerCase() ===
        currentUserName.toLowerCase()
    );
  }, [reports, currentUserName]);

  const groupedReports = useMemo(() => {
    const bids = [];
    const active = [];
    const lost = [];
    const complete = [];

    for (const r of visibleReports) {
      const status = Number(r?.Status ?? 0);

      if (status === 1) active.push(r);
      else if (status === 2) lost.push(r);
      else if (status === 3) complete.push(r);
      else bids.push(r);
    }

    return {
      bids: sortReports(bids),
      active: sortReports(active),
      lost: sortReports(lost),
      complete: sortReports(complete),
    };
  }, [visibleReports, sortReports]);

  const sharedReportsSorted = useMemo(
    () => sortReports(sharedReports),
    [sharedReports, sortReports]
  );

  const currentReportGroup = useMemo(() => {
    if (reportGroupFilter === "active") {
      return {
        title: "Active Jobs",
        rows: groupedReports.active,
        isShared: false,
      };
    }

    if (reportGroupFilter === "lost") {
      return {
        title: "Lost Jobs",
        rows: groupedReports.lost,
        isShared: false,
      };
    }

    if (reportGroupFilter === "complete") {
      return {
        title: "Complete Jobs",
        rows: groupedReports.complete,
        isShared: false,
      };
    }

    if (reportGroupFilter === "bids") {
      return {
        title: "Bid Jobs",
        rows: groupedReports.bids,
        isShared: false,
      };
    }

    if (reportGroupFilter === "shared") {
      return {
        title: "Shared With Me",
        rows: sharedReportsSorted,
        isShared: true,
      };
    }

    return {
      title: "All Reports",
      rows: sortReports([
        ...groupedReports.bids,
        ...groupedReports.active,
        ...groupedReports.lost,
        ...groupedReports.complete,
      ]),
      isShared: false,
    };
  }, [groupedReports, reportGroupFilter, sharedReportsSorted, sortReports]);

  const currentReport = useMemo(() => {
    const cleanReportId = normalizeGuid(reportId);

    if (!cleanReportId) return null;

    const allKnownReports = [...reports, ...sharedReports];

    return (
      allKnownReports.find(
        (r) => normalizeGuid(r?.ReportId || r?.reportId || r?.id) === cleanReportId
      ) || null
    );
  }, [reportId, reports, sharedReports, normalizeGuid]);

  const downloadBidExcel = useCallback(async () => {
    if (!reportId) {
      alert("Set Report ID first.");
      return;
    }

    setExcelExportLoading(true);

    try {
      const reportName = currentReport?.ReportName || "Bid Export";
      const safeProjectNumber = currentReport?.ProjectNumber || "";

      const safeFileName = `${
        String(reportName || "Bid")
          .replace(/[^a-z0-9-_ ]/gi, "")
          .trim() || "Bid"
      }_BidTemplate.xlsx`;

      const lineItemCells = {};

      jobProgressRows.forEach((row, index) => {
        const excelRow = 13 + index;
        lineItemCells[`A${excelRow}`] = row.code;
        lineItemCells[`B${excelRow}`] = row.label;
        lineItemCells[`C${excelRow}`] = `${row.percent || 0}% Complete`;
        lineItemCells[`F${excelRow}`] = row.notes || "";
      });

      const payload = {
        templateName: "Project_Import_Template.xlsx",
        fileName: safeFileName,
        sheetName: "Project Details",
        cells: {
          A2: safeProjectNumber,
          B2: reportName,
          C2: getStatusLabel(currentReport?.Status),
          F2: currentReport?.CustomerName || "",
          Z2: currentReport?.Address || "",
        },
      };

      const res = await fetch(EXCEL_EXPORT_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || `HTTP ${res.status}`);
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = safeFileName;

      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error("❌ downloadBidExcel:", e);
      alert("❌ Excel export failed: " + (e.message || e));
    } finally {
      setExcelExportLoading(false);
    }
  }, [reportId, currentReport, jobProgressRows, getStatusLabel, EXCEL_EXPORT_API]);

  if (selected === 1000) {
    return (
      <BoxView1
        number={selected}
        reportId={reportId}
        onBack={() => setSelected(null)}
      />
    );
  }

  const ReportsTable = ({ title, rows, isShared = false }) => {
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
                <th style={{ width: isShared ? 180 : 360 }} className="text-end">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {rows.map((r) => {
                const rid = String(r?.ReportId || r?.reportId || r?.id || "");
                const isShareOpen = shareOpenForId === rid;

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
                        >
                          Open
                        </button>

                        {!isShared && (
                          <>
                            <button
                              className="btn btn-sm btn-outline-secondary"
                              onClick={() => startEditReport(r)}
                            >
                              Edit
                            </button>

                            <button
                              className="btn btn-sm btn-outline-info"
                              onClick={() => shareReport(rid)}
                            >
                              Share
                            </button>

                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => deleteReport(rid)}
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>

                      {!isShared && isShareOpen && (
                        <div className="mt-2 d-flex justify-content-end">
                          <div
                            className="border rounded p-2 bg-white"
                            style={{ minWidth: 260 }}
                          >
                            <input
                              className="form-control form-control-sm"
                              list={`share-usernames-${rid}`}
                              value={shareSelectedUsername}
                              onChange={(e) => setShareSelectedUsername(e.target.value)}
                              placeholder={
                                shareUsernamesLoading
                                  ? "Loading usernames..."
                                  : "Select or type username"
                              }
                              disabled={shareUsernamesLoading}
                            />

                            <datalist id={`share-usernames-${rid}`}>
                              {shareUsernames.map((u) => (
                                <option key={u} value={u} />
                              ))}
                            </datalist>

                            <div className="d-flex justify-content-end gap-2 mt-2">
                              <button
                                className="btn btn-sm btn-outline-secondary"
                                onClick={() => {
                                  setShareOpenForId("");
                                  setShareSelectedUsername("");
                                }}
                              >
                                Cancel
                              </button>

                              <button
                                className="btn btn-sm btn-success"
                                disabled={!shareSelectedUsername}
                                onClick={() => confirmShareReport(rid)}
                              >
                                Share
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
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

        <button
          className="btn btn-primary btn-sm"
          onClick={downloadBidExcel}
          disabled={!reportId || excelExportLoading}
          title={!reportId ? "Set Report ID first" : ""}
        >
          {excelExportLoading ? "Exporting..." : "Export Excel"}
        </button>

        <button
          className="btn btn-primary btn-sm"
          onClick={() => setViewMode("progress")}
          disabled={!reportId}
          title={!reportId ? "Set Report ID first" : ""}
        >
          Job Progress
        </button>
      </div>
    </div>
  );

  const JobProgressOnly = () => (
    <>
      <h1>Capital City</h1>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">Job Progress</h5>

        <div className="d-flex gap-2">
          <button
            className="btn btn-sm btn-success"
            onClick={downloadBidExcel}
            disabled={!reportId || excelExportLoading}
          >
            {excelExportLoading ? "Exporting..." : "Export Excel"}
          </button>

          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={() => setViewMode("input")}
          >
            Back to Inputs
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-sm table-striped align-middle">
              <thead>
                <tr>
                  <th style={{ width: 90 }}>Code</th>
                  <th>Section</th>
                  <th style={{ width: 180 }}>% Complete</th>
                  <th>Notes</th>
                </tr>
              </thead>

              <tbody>
                {jobProgressRows.map((row) => (
                  <tr key={row.key}>
                    <td>{row.code}</td>
                    <td>{row.label}</td>

                    <td>
                      <div className="input-group input-group-sm">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="1"
                          className="form-control"
                          value={row.percent}
                          onChange={(e) =>
                            updateJobProgressRow(row.key, "percent", e.target.value)
                          }
                          placeholder="0"
                        />
                        <span className="input-group-text">%</span>
                      </div>
                    </td>

                    <td>
                      <input
                        className="form-control form-control-sm"
                        value={row.notes}
                        onChange={(e) =>
                          updateJobProgressRow(row.key, "notes", e.target.value)
                        }
                        placeholder="Progress notes"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="small text-muted">
            This section is frontend-only right now. To save this to SQL, add backend
            fields/endpoints for these progress values.
          </div>
        </div>
      </div>
    </>
  );

  if (showHomeScreen) {
    return (
      <div className="home-container">
        <h1 className="text-center">Capital City</h1>

        <div className="card mt-3">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
              <div>
                <h5 className="mb-0">Reports</h5>

                <div className="small text-muted mt-1">
                  {azureUserLoading
                    ? "User: loading..."
                    : azureUser
                    ? `User: ${azureUser.userDetails || "Signed in"}${
                        azureUser.identityProvider
                          ? ` (${azureUser.identityProvider})`
                          : ""
                      }`
                    : "User: not signed in"}
                </div>
              </div>

              <div className="d-flex gap-2 align-items-center flex-wrap">
                <select
                  className="form-select form-select-sm"
                  style={{ width: 180 }}
                  value={reportGroupFilter}
                  onChange={(e) => setReportGroupFilter(e.target.value)}
                >
                  <option value="all">Show: All</option>
                  <option value="bids">Show: Bid</option>
                  <option value="active">Show: Active</option>
                  <option value="lost">Show: Lost</option>
                  <option value="complete">Show: Complete</option>
                  <option value="shared">Show: Shared With Me</option>
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
                  onClick={() => {
                    loadReports();
                    loadAzureUser();
                    loadSharedReports();
                    loadShareUsernames();
                  }}
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

            {sharedReportsError && (
              <div className="alert alert-danger mt-3 mb-0">{sharedReportsError}</div>
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
                      setReportDraft((p) => ({ ...p, CustomerName: e.target.value }))
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
                        setReportDraft((p) => ({ ...p, Notes: e.target.value }))
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
              {reportsLoading || azureUserLoading || sharedReportsLoading ? (
                <div className="text-muted">Loading reports…</div>
              ) : currentReportGroup.rows.length === 0 ? (
                <div className="text-muted">
                  {reportGroupFilter === "shared"
                    ? "No shared reports found."
                    : currentUserName
                    ? "No reports found for this user."
                    : "No reports found."}
                </div>
              ) : (
                <ReportsTable
                  title={currentReportGroup.title}
                  rows={currentReportGroup.rows}
                  isShared={currentReportGroup.isShared}
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
        <TotalsPage
          taxRate={taxRate}
          setTaxRate={setTaxRate}
          totalsBySection={totalsBySection}
          laborSections={laborSections}
          lineItemsBySection={lineItemsBySection}
          laborLineItemsBySection={laborLineItemsBySection}
          enabledAdders={enabledAdders}
          toggleAdder={toggleAdder}
          driveTime={driveTime}
          setDriveTime={setDriveTime}
          premiumBaseInput={premiumBaseInput}
          setPremiumBaseInput={setPremiumBaseInput}
          sellMargins={sellMargins}
          setSellMargin={setSellMargin}
          reportId={reportId}
          excelExportLoading={excelExportLoading}
          downloadBidExcel={downloadBidExcel}
          onBackToInputs={() => setViewMode("input")}
        />
      ) : viewMode === "progress" ? (
        <JobProgressOnly />
      ) : (
        <>
          <InputsOnly />

          <div>
            <DbTestViewer
              reportId={reportId}
              onTotalsChange={(t) => setSectionCost("equipment", readCost(t))}
              onLineItemsChange={(rows) => setSectionLineItems("equipment", rows)}
            />
          </div>

          <div>
            <Labor
              reportId={reportId}
              onTotalsChange={(t) => setLaborSection("labor1", t)}
              onLineItemsChange={(rows) => setLaborLineItems("labor1", rows)}
            />
          </div>

          <div>
            <Demo
              reportId={reportId}
              onTotalsChange={(t) => setSectionCost("demo", readCost(t))}
              onLineItemsChange={(rows) => setSectionLineItems("demo", rows)}
            />
          </div>

          <div>
            <Labor2
              reportId={reportId}
              onTotalsChange={(t) => setLaborSection("labor2", t)}
              onLineItemsChange={(rows) => setLaborLineItems("labor2", rows)}
            />
          </div>

          <div>
            <Rough
              reportId={reportId}
              onTotalsChange={(t) => setSectionCost("rough", readCost(t))}
              onLineItemsChange={(rows) => setSectionLineItems("rough", rows)}
            />
          </div>

          <div>
            <Labor3
              reportId={reportId}
              onTotalsChange={(t) => setLaborSection("labor3", t)}
              onLineItemsChange={(rows) => setLaborLineItems("labor3", rows)}
            />
          </div>

          <div>
            <AirDistribution
              reportId={reportId}
              onTotalsChange={(t) => setSectionCost("air", readCost(t))}
              onLineItemsChange={(rows) => setSectionLineItems("air", rows)}
            />
          </div>

          <div>
            <Labor4
              reportId={reportId}
              onTotalsChange={(t) => setLaborSection("labor4", t)}
              onLineItemsChange={(rows) => setLaborLineItems("labor4", rows)}
            />
          </div>

          <div>
            <Electrical
              reportId={reportId}
              onTotalsChange={(t) => setSectionCost("electrical", readCost(t))}
              onLineItemsChange={(rows) => setSectionLineItems("electrical", rows)}
            />
          </div>

          <div>
            <Labor5
              reportId={reportId}
              onTotalsChange={(t) => setLaborSection("labor5", t)}
              onLineItemsChange={(rows) => setLaborLineItems("labor5", rows)}
            />
          </div>

          <div>
            <Piping
              reportId={reportId}
              onTotalsChange={(t) => setSectionCost("piping", readCost(t))}
              onLineItemsChange={(rows) => setSectionLineItems("piping", rows)}
            />
          </div>

          <div>
            <Labor6
              reportId={reportId}
              onTotalsChange={(t) => setLaborSection("labor6", t)}
              onLineItemsChange={(rows) => setLaborLineItems("labor6", rows)}
            />
          </div>

          <div>
            <Completion
              reportId={reportId}
              onTotalsChange={(t) => setSectionCost("completion", readCost(t))}
              onLineItemsChange={(rows) => setSectionLineItems("completion", rows)}
            />
          </div>

          <div>
            <Labor7
              reportId={reportId}
              onTotalsChange={(t) => setLaborSection("labor7", t)}
              onLineItemsChange={(rows) => setLaborLineItems("labor7", rows)}
            />
          </div>
        </>
      )}
    </div>
  );
}

export default Home;