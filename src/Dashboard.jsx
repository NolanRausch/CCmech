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

  const dashboardStats = useMemo(() => {
    const totalReports = reports.length;

    const bidCount = reports.filter((r) => Number(r?.Status ?? 0) === 0).length;
    const activeCount = reports.filter((r) => Number(r?.Status ?? 0) === 1).length;
    const lostCount = reports.filter((r) => Number(r?.Status ?? 0) === 2).length;
    const completeCount = reports.filter((r) => Number(r?.Status ?? 0) === 3).length;

    const projectNumbers = reports
      .map((r) => Number(r?.ProjectNumber))
      .filter((n) => Number.isFinite(n) && n > 0);

    const highestProjectNumber = projectNumbers.length
      ? Math.max(...projectNumbers)
      : "";

    const bidValues = reports
      .map((r) => readBid(r))
      .filter((n) => Number.isFinite(n));

    const totalBidAmount = bidValues.reduce((sum, n) => sum + n, 0);
    const reportsWithBidCount = bidValues.length;
    const reportsWithoutBidCount = reports.length - reportsWithBidCount;
    const averageBidAmount =
      reportsWithBidCount > 0 ? totalBidAmount / reportsWithBidCount : 0;

    return {
      totalReports,
      bidCount,
      activeCount,
      lostCount,
      completeCount,
      highestProjectNumber,
      totalBidAmount,
      reportsWithBidCount,
      reportsWithoutBidCount,
      averageBidAmount,
    };
  }, [reports, readBid]);

  const filteredReports = useMemo(() => {
    let rows = [...reports];

    if (statusFilter !== "all") {
      rows = rows.filter((r) => String(Number(r?.Status ?? 0)) === statusFilter);
    }

    rows.sort((a, b) => {
      const aName = String(a?.ReportName ?? "").toLowerCase();
      const bName = String(b?.ReportName ?? "").toLowerCase();

      const aCustomer = String(a?.CustomerName ?? "").toLowerCase();
      const bCustomer = String(b?.CustomerName ?? "").toLowerCase();

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
          return aCustomer.localeCompare(bCustomer) || aName.localeCompare(bName);

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
            Back to Inputs
          </button>
        </div>
      </div>

      {reportsError && (
        <div className="alert alert-danger py-2">{reportsError}</div>
      )}

      <div className="row g-3 mb-3">
        <div className="col-md-2">
          <div className="card">
            <div className="card-body">
              <div className="small text-muted">Total Reports</div>
              <h5 className="mb-0">{dashboardStats.totalReports}</h5>
            </div>
          </div>
        </div>

        <div className="col-md-2">
          <div className="card">
            <div className="card-body">
              <div className="small text-muted">Bid Status</div>
              <h5 className="mb-0">{dashboardStats.bidCount}</h5>
            </div>
          </div>
        </div>

        <div className="col-md-2">
          <div className="card">
            <div className="card-body">
              <div className="small text-muted">Active</div>
              <h5 className="mb-0">{dashboardStats.activeCount}</h5>
            </div>
          </div>
        </div>

        <div className="col-md-2">
          <div className="card">
            <div className="card-body">
              <div className="small text-muted">Lost</div>
              <h5 className="mb-0">{dashboardStats.lostCount}</h5>
            </div>
          </div>
        </div>

        <div className="col-md-2">
          <div className="card">
            <div className="card-body">
              <div className="small text-muted">Complete</div>
              <h5 className="mb-0">{dashboardStats.completeCount}</h5>
            </div>
          </div>
        </div>

        <div className="col-md-2">
          <div className="card">
            <div className="card-body">
              <div className="small text-muted">Highest Project #</div>
              <h5 className="mb-0">
                {dashboardStats.highestProjectNumber || "-"}
              </h5>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-3 mb-3">
        <div className="col-md-3">
          <div className="card">
            <div className="card-body">
              <div className="small text-muted">Total Bid Amount</div>
              <h5 className="mb-0">{money(dashboardStats.totalBidAmount)}</h5>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card">
            <div className="card-body">
              <div className="small text-muted">Average Bid Amount</div>
              <h5 className="mb-0">{money(dashboardStats.averageBidAmount)}</h5>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card">
            <div className="card-body">
              <div className="small text-muted">Reports With Bid</div>
              <h5 className="mb-0">{dashboardStats.reportsWithBidCount}</h5>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card">
            <div className="card-body">
              <div className="small text-muted">Reports Missing Bid</div>
              <h5 className="mb-0">{dashboardStats.reportsWithoutBidCount}</h5>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
            <h6 className="mb-0">All Reports</h6>

            <div className="d-flex gap-2">
              <select
                className="form-select form-select-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
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
                <option value="dateDesc">Sort: Date Newest</option>
                <option value="dateAsc">Sort: Date Oldest</option>
                <option value="nameAsc">Sort: Report Name A-Z</option>
                <option value="nameDesc">Sort: Report Name Z-A</option>
                <option value="customerAsc">Sort: Customer A-Z</option>
                <option value="projectDesc">Sort: Project # High-Low</option>
                <option value="projectAsc">Sort: Project # Low-High</option>
                <option value="bidDesc">Sort: Bid Amount High-Low</option>
                <option value="bidAsc">Sort: Bid Amount Low-High</option>
              </select>
            </div>
          </div>

          {reportsLoading ? (
            <div className="text-muted">Loading reports...</div>
          ) : filteredReports.length === 0 ? (
            <div className="text-muted">No reports found.</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-sm table-striped align-middle mb-0">
                <thead>
                  <tr>
                    <th>Report Name</th>
                    <th>Customer</th>
                    <th>Address</th>
                    <th style={{ width: 120 }}>Project #</th>
                    <th style={{ width: 130 }} className="text-end">
                      Bid Amount
                    </th>
                    <th style={{ width: 120 }}>Status</th>
                    <th style={{ width: 130 }}>Date</th>
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
                        <td>{report?.ReportName || ""}</td>
                        <td>{report?.CustomerName || ""}</td>
                        <td>{report?.Address || ""}</td>
                        <td>{report?.ProjectNumber || ""}</td>
                        <td className="text-end">
                          {bidAmount === null ? "-" : money(bidAmount)}
                        </td>
                        <td>{getStatusLabel(report?.Status)}</td>
                        <td>{formatDate(report?.Date ?? report?.date)}</td>
                        <td>{report?.CreatedBy || ""}</td>
                        <td>{report?.Notes || ""}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="small text-muted mt-2">
            This dashboard is using all rows returned by the reports route.
          </div>
        </div>
      </div>
    </>
  );
}

export default Dashboard;