import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import BoxView4 from "./BoxView4"; // ✅ editor/viewer screen for AirDistribution

export default function DbTestViewer({
  onTotalsChange,
  onLineItemsChange,
  reportId: reportIdProp,
}) {
  const [rows, setRows] = useState([]); // each row gets .Alternates: []
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [selected, setSelected] = useState(null);

  const API_BASE =
    "https://ccmechconstruction-bjate8cvcha3ecgt.canadacentral-01.azurewebsites.net/api";

  const BLUE = "#646e07ff";

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
      return `${url}${hasQ ? "&" : "?"}reportId=${encodeURIComponent(
        reportId
      )}`;
    },
    [reportId]
  );

  const parseCost = useCallback((val) => {
    const n = parseFloat(String(val ?? "").replace(/[^0-9.\-]/g, ""));
    return isNaN(n) ? 0 : n;
  }, []);

  const fmtMoney = useCallback(
    (n) => {
      const safe = parseCost(n);

      return safe.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    },
    [parseCost]
  );

  const pickUsedOrPrimary = useCallback((primary, alternates = []) => {
    const usedAlt = alternates.find(
      (a) => Number(a?.IsUsed) === 1 || a?.IsUsed === true
    );
    return usedAlt || primary;
  }, []);

  const getAirDistributionId = useCallback((r) => {
    return (
      r?.AirDistributionId ??
      r?.airDistributionId ??
      r?.AIRDistributionId ??
      r?.AIRDISTRIBUTIONID ??
      r?.id ??
      r?.Id ??
      r?.ID ??
      ""
    );
  }, []);

  // ✅ Cost code can come back as CostCode or CostCodes depending on endpoint/table
  const getCostCode = useCallback((r) => {
    return (
      r?.CostCode ??
      r?.CostCodes ??
      r?.costCode ??
      r?.costCodes ??
      r?.COSTCODE ??
      r?.COSTCODES ??
      ""
    );
  }, []);

  // ✅ AirDistribution alternates (report-scoped)
  const fetchAlternates = useCallback(
    async (airDistributionId) => {
      try {
        if (!reportId) return [];
        if (!airDistributionId) return [];

        const res = await fetch(
          withReport(
            `${API_BASE}/airdistribution/alternates/${encodeURIComponent(
              airDistributionId
            )}`
          ),
          {
            method: "GET",
            headers: reportId ? { "x-report-id": reportId } : undefined,
          }
        );

        if (!res.ok) throw new Error(`Alt HTTP ${res.status}`);

        const json = await res.json();
        const list = Array.isArray(json)
          ? json
          : Array.isArray(json?.sample)
          ? json.sample
          : [];

        return list;
      } catch (e) {
        console.warn("Alternates fetch failed for", airDistributionId, e);
        return [];
      }
    },
    [API_BASE, reportId, withReport]
  );

  const fetchRows = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!reportId) {
        setRows([]);
        setError("Missing reportId (required).");
        return;
      }

      // ✅ AirDistribution primary rows (report-scoped)
      const res = await fetch(withReport(`${API_BASE}/airdistribution`), {
        method: "GET",
        headers: reportId ? { "x-report-id": reportId } : undefined,
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json = await res.json();
      const list = Array.isArray(json)
        ? json
        : Array.isArray(json?.sample)
        ? json.sample
        : [];

      // Attach alternates
      const withAlternates = await Promise.all(
        list.map(async (r) => {
          const airDistributionId = getAirDistributionId(r);
          const alts = await fetchAlternates(airDistributionId);

          return {
            ...r,
            _adid: airDistributionId,
            Alternates: alts,
            _expand: false,
          };
        })
      );

      setRows(withAlternates);
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }, [
    API_BASE,
    fetchAlternates,
    reportId,
    withReport,
    getAirDistributionId,
  ]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  // ✅ DELETE /api/airdistribution/{id} (report-scoped)
  const handleDelete = async (airDistributionId) => {
    try {
      if (!reportId) {
        alert("Delete failed: missing reportId");
        return;
      }

      if (!airDistributionId) {
        alert("Delete failed: missing AirDistributionId");
        return;
      }

      setDeletingId(airDistributionId);

      const url = withReport(
        `${API_BASE}/airdistribution/${encodeURIComponent(airDistributionId)}`
      );

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

      setRows((prev) => prev.filter((r) => r._adid !== airDistributionId));
    } catch (e) {
      alert("Delete failed: " + (e.message || e));
      console.error(e);
    } finally {
      setDeletingId(null);
    }
  };

  const toggleExpand = useCallback((id) => {
    if (!id) return;

    setRows((prev) =>
      prev.map((r) => (r._adid === id ? { ...r, _expand: !r._expand } : r))
    );
  }, []);

  // ✅ Total cost (alt-adjusted) + memoized
  const totalCost = useMemo(() => {
    return rows.reduce((sum, r) => {
      const chosen = pickUsedOrPrimary(r, r?.Alternates || []);
      return sum + parseCost(chosen?.Cost);
    }, 0);
  }, [rows, pickUsedOrPrimary, parseCost]);

  // ✅ Report section total up to Home whenever total changes (deduped + object)
  const lastSentRef = useRef(null);

  useEffect(() => {
    if (typeof onTotalsChange !== "function") return;

    const payload = { cost: Number(totalCost) || 0, label: "AirDistribution" };
    const sig = `${payload.label}:${payload.cost.toFixed(4)}`;

    if (lastSentRef.current === sig) return;
    lastSentRef.current = sig;

    onTotalsChange(payload);
  }, [totalCost, onTotalsChange]);

  // ✅ Push individual Air Distribution line items up to Home.js for TotalsPage display
  const lastLineItemsSentRef = useRef(null);

  useEffect(() => {
    if (typeof onLineItemsChange !== "function") return;

    const lineItems = rows.map((r, index) => {
      const chosen = pickUsedOrPrimary(r, r?.Alternates || []);
      const costCode = getCostCode(chosen) || getCostCode(r);

      const hasUsedAlt = r?.Alternates?.some(
        (a) => Number(a?.IsUsed) === 1 || a?.IsUsed === true
      );

      return {
        ...chosen,
        AirDistributionId: r?._adid || getAirDistributionId(r),
        CostCode: costCode,
        CostCodes: costCode,
        Section: "Air Distribution",
        SectionKey: "air",
        LineNumber: index + 1,
        IsAlternateUsed: hasUsedAlt,
        PrimaryDescription: r?.Description || "",
        PrimarySupplier: r?.Supplier || "",
        PrimaryCost: r?.Cost || "",
        PrimaryCostCode: getCostCode(r),
        PrimaryCostCodes: getCostCode(r),
        PrimaryNotes: r?.Notes || "",
      };
    });

    const sig = JSON.stringify(
      lineItems.map((item) => ({
        AirDistributionId: item.AirDistributionId,
        CostCode: item.CostCode,
        Description: item.Description,
        Supplier: item.Supplier,
        Cost: item.Cost,
        Notes: item.Notes,
        IsAlternateUsed: item.IsAlternateUsed,
      }))
    );

    if (lastLineItemsSentRef.current === sig) return;
    lastLineItemsSentRef.current = sig;

    onLineItemsChange(lineItems);
  }, [
    rows,
    onLineItemsChange,
    pickUsedOrPrimary,
    getAirDistributionId,
    getCostCode,
  ]);

  if (loading) return <p className="p-3">Loading...</p>;
  if (error) return <p className="p-3 text-danger">Error: {error}</p>;

  // ✅ Switch to BoxView4 editor/viewer screen
  if (selected === 1000) {
    return (
      <BoxView4
        number={selected}
        reportId={reportId}
        onBack={() => {
          setSelected(null);
          fetchRows(); // refresh after returning
        }}
      />
    );
  }

  // ✅ fixed widths so Notes gets remaining space
  const col = {
    idx: { width: "6rem", whiteSpace: "nowrap" },
    desc: { width: "16rem", maxWidth: "16rem" },
    supplier: { width: "12rem", maxWidth: "12rem" },
    cost: { width: "7.5rem", whiteSpace: "nowrap" },
    alternates: { width: "10rem", whiteSpace: "nowrap" },
    actions: { width: "7rem", whiteSpace: "nowrap" },
    clamp: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  };

  return (
    <div className="container py-4">
      {/* ✅ Input LEFT + header ALL CAPS + BLUE (no size changes) */}
      <div className="d-flex align-items-center gap-3 mb-3">
        <button
          className="btn btn-outline-secondary btn-lg"
          onClick={() => setSelected(1000)}
        >
          Input
        </button>

        <h5 className="mb-0" style={{ color: BLUE, textTransform: "uppercase" }}>
          CODE 4000 - Air Distribution, Sheet Metal, Hinges, Flue Piping, Flex
          Grills, Diffusers, Insulation, Snap Lock
        </h5>
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
              <th style={{ ...col.idx, backgroundColor: BLUE }}>Cost Code</th>
              <th style={{ ...col.desc, backgroundColor: BLUE }}>Description</th>
              <th style={{ ...col.supplier, backgroundColor: BLUE }}>Supplier</th>
              <th style={{ ...col.cost, backgroundColor: BLUE }}>Cost</th>
              <th style={{ backgroundColor: BLUE }}>Notes</th>

              <th style={{ ...col.alternates, backgroundColor: BLUE }}>
                Alternates
              </th>

              <th style={{ ...col.actions, backgroundColor: BLUE }}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((r, i) => {
              const airDistributionId = r._adid || getAirDistributionId(r);

              const hasUsedAlt = r?.Alternates?.some(
                (a) => Number(a?.IsUsed) === 1 || a?.IsUsed === true
              );

              const chosen = pickUsedOrPrimary(r, r?.Alternates || []);
              const costCode = getCostCode(chosen) || getCostCode(r);

              return (
                <React.Fragment key={airDistributionId || `rowwrap-${i}`}>
                  <tr>
                    <td style={col.idx}>
                      {costCode}
                      {hasUsedAlt && (
                        <span
                          className="ms-1 badge rounded-pill text-bg-success"
                          title="An alternate is selected for this item"
                        >
                          ALT
                        </span>
                      )}
                    </td>

                    <td style={{ ...col.desc, ...col.clamp }}>
                      {chosen?.Description}
                    </td>

                    <td style={{ ...col.supplier, ...col.clamp }}>
                      {chosen?.Supplier}
                    </td>

                    <td style={col.cost}>{fmtMoney(chosen?.Cost)}</td>

                    <td style={{ whiteSpace: "normal", wordBreak: "break-word" }}>
                      {chosen?.Notes}
                    </td>

                    <td style={col.alternates}>
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => toggleExpand(airDistributionId)}
                        title="Show/Hide alternates"
                        disabled={!airDistributionId}
                      >
                        {r._expand
                          ? `Hide (${r.Alternates?.length || 0})`
                          : `Show (${r.Alternates?.length || 0})`}
                      </button>
                    </td>

                    <td style={col.actions}>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDelete(airDistributionId)}
                        disabled={deletingId === airDistributionId || !airDistributionId}
                        title="Delete this AirDistribution item"
                      >
                        {deletingId === airDistributionId ? "Deleting…" : "Clear"}
                      </button>
                    </td>
                  </tr>

                  {r._expand &&
                    (r.Alternates?.length ? (
                      r.Alternates.map((a, ai) => {
                        const altCostCode = getCostCode(a);

                        return (
                          <tr
                            key={`${airDistributionId}-alt-${
                              a?.AlternateId || a?.alternateId || ai
                            }`}
                            className="table-light"
                          >
                            <td style={col.idx}>{altCostCode}</td>

                            <td className="ps-4" style={{ ...col.desc }}>
                              <span className="badge text-bg-secondary me-2">
                                ALT
                              </span>

                              {a.Description}

                              {(Number(a?.IsUsed) === 1 || a?.IsUsed === true) && (
                                <span className="ms-2 badge text-bg-success">
                                  USED
                                </span>
                              )}
                            </td>

                            <td style={{ ...col.supplier, ...col.clamp }}>
                              {a.Supplier}
                            </td>

                            <td style={col.cost}>{fmtMoney(a.Cost)}</td>

                            <td
                              style={{
                                whiteSpace: "normal",
                                wordBreak: "break-word",
                              }}
                            >
                              {a.Notes}
                            </td>

                            <td colSpan={2}></td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr className="table-light">
                        <td style={col.idx}></td>

                        <td className="ps-4 text-muted" colSpan={6}>
                          No alternates
                        </td>
                      </tr>
                    ))}
                </React.Fragment>
              );
            })}
          </tbody>

          <tfoot className="table-secondary" style={{ position: "sticky", bottom: 0 }}>
            <tr>
              <th></th>
              <th>Total</th>
              <th></th>
              <th style={col.cost}>{fmtMoney(totalCost)}</th>
              <th colSpan={3}></th>
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