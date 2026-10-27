import React, { useCallback, useEffect, useMemo, useState } from "react";

function Dashboard({ onBackToInputs }) {
  const REPORTS_API =
    "https://ccmechconstruction-bjate8cvcha3ecgt.canadacentral-01.azurewebsites.net/api/reports";

  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("dateDesc");

  const money = (val) => {
    const n = Number(String(val ?? "").replace(/[^0-9.\-]/g, ""));
    const safe = Number.isFinite(n) ? n : 0;

    return safe.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const readBid = useCallback((report) => {
    const raw = report?.Bid ?? report?.bid;

    if (raw === null || raw === undefined || raw === "") return null;

    const n = Number(String(raw).replace(/[^0-9.\-]/g, ""));

    return Number.isFinite(n) ? n : null;
  }, []);

  const getStatusLabel = useCallback((status) => {
    const s = Number(status ?? 0);

    if (s === 1) return "Active";
    if (s === 2) return "Lost";
    if (s === 3) return "Complete";

    return "Bid";
  }, []);

  const parseDateValue = useCallback((value) => {
    if (!value) return 0;

    const d = new Date(value);

    return Number.isNaN(d.getTime()) ? 0 : d.getTime();
  }, []);

  const formatDate = useCallback((value) => {
    if (!value) return "";

    return String(value).slice(0, 10);
  }, []);

  const loadReports = useCallback(async () => {
    setReportsLoading(true);
    setReportsError("");

    try {
      const res = await fetch(REPORTS_API);
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error || `HTTP ${res.status}`);
      }

      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.recordset)
        ? data.recordset
        : [];

      setReports(list);
    } catch (err) {
      console.error("❌ Dashboard loadReports:", err);
      setReports([]);
      setReportsError(err.message || String(err));
    } finally {
      setReportsLoading(false);
    }
  }, [REPORTS_API]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  // Calculate a separate set of statistics for each CreatedBy email.
  const statsByUser = useMemo(() => {
    const groups = new Map();

    for (const report of reports) {
      const email = String(
        report?.CreatedBy ?? report?.createdBy ?? ""
      ).trim();

      const key = email.toLowerCase() || "(No email assigned)";

      if (!groups.has(key)) {
        groups.set(key, {
          email: email || "(No email assigned)",
          rows: [],
        });
      }

      groups.get(key).rows.push(report);
    }

    return Array.from(groups.values())
      .map(({ email, rows }) => {
        const bidValues = rows
          .map(readBid)
          .filter((value) => value !== null);

        const totalBidAmount = bidValues.reduce(
          (sum, amount) => sum + amount,
          0
        );

        const projectNumbers = rows
          .map((report) => Number(report?.ProjectNumber))
          .filter(
            (number) => Number.isFinite(number) && number > 0
          );

        return {
          email,

          totalReports: rows.length,

          bidCount: rows.filter(
            (r) => Number(r?.Status ?? 0) === 0
          ).length,

          activeCount: rows.filter(
            (r) => Number(r?.Status ?? 0) === 1
          ).length,

          lostCount: rows.filter(
            (r) => Number(r?.Status ?? 0) === 2
          ).length,

          completeCount: rows.filter(
            (r) => Number(r?.Status ?? 0) === 3
          ).length,

          highestProjectNumber: projectNumbers.length
            ? Math.max(...projectNumbers)
            : "",

          totalBidAmount,

          reportsWithBidCount: bidValues.length,

          reportsWithoutBidCount: rows.length - bidValues.length,

          averageBidAmount: bidValues.length
            ? totalBidAmount / bidValues.length
            : 0,
        };
      })
      .sort((a, b) => a.email.localeCompare(b.email));
  }, [reports, readBid]);

  const filteredReports = useMemo(() => {
    let rows = [...reports];

    if (statusFilter !== "all") {
      rows = rows.filter(
        (r) => String(Number(r?.Status ?? 0)) === statusFilter
      );
    }

    rows.sort((a, b) => {
      const aName = String(a?.ReportName ?? "").toLowerCase();
      const bName = String(b?.ReportName ?? "").toLowerCase();

      const aCustomer = String(
        a?.CustomerName ?? ""
      ).toLowerCase();

      const bCustomer = String(
        b?.CustomerName ?? ""
      ).toLowerCase();

      const aDate = parseDateValue(a?.Date ?? a?.date);
      const bDate = parseDateValue(b?.Date ?? b?.date);

      const aProject = Number(a?.ProjectNumber) || 0;
      const bProject = Number(b?.ProjectNumber) || 0;

      const aBid = readBid(a) ?? -1;
      const bBid = readBid(b) ?? -1;

      switch (sortBy) {
        case "dateAsc":
          return aDate - bDate || aName.localeCompare(bName);

        case "nameAsc":
          return aName.localeCompare(bName) || bDate - aDate;

        case "nameDesc":
          return bName.localeCompare(aName) || bDate - aDate;

        case "customerAsc":
          return (
            aCustomer.localeCompare(bCustomer) ||
            aName.localeCompare(bName)
          );

        case "projectDesc":
          return bProject - aProject || bDate - aDate;

        case "projectAsc":
          return aProject - bProject || bDate - aDate;

        case "bidDesc":
          return bBid - aBid || bDate - aDate;

        case "bidAsc":
          return aBid - bBid || bDate - aDate;

        case "dateDesc":
        default:
          return bDate - aDate || aName.localeCompare(bName);
      }
    });

    return rows;
  }, [reports, statusFilter, sortBy, parseDateValue, readBid]);

  return (
    <>
      <h1>Capital City</h1>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">Dashboard</h5>

        <div className="d-flex gap-2">
          <button
            className="btn btn-sm btn-outline-primary"
            onClick={loadReports}
            disabled={reportsLoading}
          >
            {reportsLoading ? "Refreshing..." : "Refresh"}
          </button>

          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={onBackToInputs}
          >
            Back
          </button>
        </div>
      </div>

      {reportsError && (
        <div className="alert alert-danger py-2">
          {reportsError}
        </div>
      )}

      {statsByUser.length === 0 && !reportsLoading && (
        <div className="text-muted mb-3">
          No reports available for dashboard statistics.
        </div>
      )}

      {/* Separate dashboard statistics for each user */}

      {statsByUser.map((stats) => (
        <section key={stats.email} className="mb-4">
          <h6 className="mb-3">{stats.email}</h6>

          <div className="row g-3 mb-3">
            {[
              ["Total Reports", stats.totalReports],
              ["Bid Status", stats.bidCount],
              ["Active", stats.activeCount],
              ["Lost", stats.lostCount],
              ["Complete", stats.completeCount],
              [
                "Highest Project #",
                stats.highestProjectNumber || "-",
              ],
            ].map(([label, value]) => (
              <div className="col-md-2" key={label}>
                <div className="card h-100">
                  <div className="card-body">
                    <div className="small text-muted">
                      {label}
                    </div>

                    <h5 className="mb-0">
                      {value}
                    </h5>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="row g-3 mb-3">
            {[
              [
                "Total Bid Amount",
                money(stats.totalBidAmount),
              ],
              [
                "Average Bid Amount",
                money(stats.averageBidAmount),
              ],
              [
                "Reports With Bid",
                stats.reportsWithBidCount,
              ],
              [
                "Reports Missing Bid",
                stats.reportsWithoutBidCount,
              ],
            ].map(([label, value]) => (
              <div className="col-md-3" key={label}>
                <div className="card h-100">
                  <div className="card-body">
                    <div className="small text-muted">
                      {label}
                    </div>

                    <h5 className="mb-0">
                      {value}
                    </h5>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}

      {/* All Reports table */}

      <div className="card">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
            <h6 className="mb-0">All Reports</h6>

            <div className="d-flex gap-2">
              <select
                className="form-select form-select-sm"
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value)
                }
                style={{ width: 160 }}
              >
                <option value="all">Status: All</option>
                <option value="0">Status: Bid</option>
                <option value="1">Status: Active</option>
                <option value="2">Status: Lost</option>
                <option value="3">Status: Complete</option>
              </select>

              <select
                className="form-select form-select-sm"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{ width: 210 }}
              >
                <option value="dateDesc">
                  Sort: Date Newest
                </option>

                <option value="dateAsc">
                  Sort: Date Oldest
                </option>

                <option value="nameAsc">
                  Sort: Report Name A-Z
                </option>

                <option value="nameDesc">
                  Sort: Report Name Z-A
                </option>

                <option value="customerAsc">
                  Sort: Customer A-Z
                </option>

                <option value="projectDesc">
                  Sort: Project # High-Low
                </option>

                <option value="projectAsc">
                  Sort: Project # Low-High
                </option>

                <option value="bidDesc">
                  Sort: Bid Amount High-Low
                </option>

                <option value="bidAsc">
                  Sort: Bid Amount Low-High
                </option>
              </select>
            </div>
          </div>

          {reportsLoading ? (
            <div className="text-muted">
              Loading reports...
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="text-muted">
              No reports found.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-sm table-striped align-middle mb-0">
                <thead>
                  <tr>
                    <th>Report Name</th>
                    <th>Customer</th>
                    <th>Address</th>

                    <th style={{ width: 120 }}>
                      Project #
                    </th>

                    <th
                      style={{ width: 130 }}
                      className="text-end"
                    >
                      Bid Amount
                    </th>

                    <th style={{ width: 120 }}>
                      Status
                    </th>

                    <th style={{ width: 130 }}>
                      Date
                    </th>

                    <th>Created By</th>
                    <th>Notes</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredReports.map((report) => {
                    const id =
                      report?.ReportId ||
                      report?.reportId ||
                      report?.id ||
                      `${report?.ReportName}-${report?.ProjectNumber}`;

                    const bidAmount = readBid(report);

                    return (
                      <tr key={id}>
                        <td>
                          {report?.ReportName || ""}
                        </td>

                        <td>
                          {report?.CustomerName || ""}
                        </td>

                        <td>
                          {report?.Address || ""}
                        </td>

                        <td>
                          {report?.ProjectNumber || ""}
                        </td>

                        <td className="text-end">
                          {bidAmount === null
                            ? "-"
                            : money(bidAmount)}
                        </td>

                        <td>
                          {getStatusLabel(report?.Status)}
                        </td>

                        <td>
                          {formatDate(
                            report?.Date ?? report?.date
                          )}
                        </td>

                        <td>
                          {report?.CreatedBy || ""}
                        </td>

                        <td>
                          {report?.Notes || ""}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="small text-muted mt-2">
            Statistics are grouped by CreatedBy email.
            The table shows all reports returned by the API.
          </div>
        </div>
      </div>
    </>
  );
}

export default Dashboard;