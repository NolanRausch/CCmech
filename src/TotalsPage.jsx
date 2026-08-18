import React, { useCallback, useMemo, useState } from "react";

const TOTALS_COLS = "360px 120px 180px";

const DEFAULT_BUILDOPS_PRODUCT_IDS_BY_COST_CODE = {
  1001: "8a9a1e58-c79a-41bc-938d-590513b7b9ff",
  1002: "472daf83-4b92-48ee-8a57-5ddda352785a",
  1003: "5c660736-8038-476f-a281-1ab9e5ae88dc",
  1004: "bc23f7df-aecb-4326-9930-3c9690a64c13",
  1005: "44a843bd-da99-4871-9e1e-5ce7facf6935",
  1006: "12e722d7-58da-48e7-9db2-dc8ade549c94",
  1007: "64afb821-7cab-4fcd-b280-5f11faa7ea84",
  1008: "58f5f9ba-5883-4609-8620-928adda95946",
  1009: "a3f23dda-9f86-404a-ba79-a69d782d79be",
  1010: "0c0e8d41-6c63-4137-8421-cee941de00df",

  2001: "70d78f15-1828-4d91-b434-3bce3066692b",
  2002: "12410e91-86fc-4282-9881-1565fd1f356e",
  2003: "5fe934e5-a082-442b-a56b-a92288b15b13",
  2004: "0063402a-515b-4306-9459-98135adfa6a4",
  2005: "969082e8-9b5a-4b93-937d-ce88f6160c14",
  2006: "2a143b02-2e7f-4add-b199-360dc23aec46",
  2007: "3cd9675b-cc75-4f97-a752-f2fdb21e9296",
  2008: "d8a1d23c-877b-4236-b131-827191024082",
  2009: "99aedfd9-bed1-4207-92a9-4776a3206546",
  2010: "1b95b0a7-87e9-47da-b654-61f1c6f49c2f",

  3001: "92764031-f58d-4588-a6aa-dd94947ba733",
  3002: "b65879df-3636-44f7-bdff-d9bb7be38140",
  3003: "e6093045-6ee2-4eda-bdef-09a705216169",
  3004: "2dd68f77-c18e-4c7e-83dd-bb8220b1fb9f",
  3005: "fa15cb76-8456-4faa-bc7c-6ec7399e3732",
  3006: "38832047-7845-4bca-a7d1-b5bba98582b3",
  3007: "9989ba8a-a6cf-4c3c-abfd-60a01e8b2c1e",
  3008: "f8d83700-2e21-41de-83f8-2e1a8c16df79",
  3009: "95a31f81-0a77-47af-87b1-627072c504a3",
  3010: "c580460c-6578-4c4b-8e6a-db9599da1dfa",

  4001: "4027203b-83ee-4c76-a670-f96a4c463883",
  4002: "48257c54-55af-48bb-83ab-9c1605113660",
  4003: "241e804f-db9d-47df-bf61-e221ae8521aa",
  4004: "5a2d6bda-86e3-409f-ae4d-35964865f7aa",
  4005: "7485d231-ce2e-44cb-a135-716f320aa868",
  4006: "69d4b212-51dc-4a50-8e48-7f7c28df85e0",
  4007: "06bf9255-b323-4990-b004-519b4b471561",
  4008: "f6773dc5-fd8e-4697-a2ab-a60cf129951a",
  4009: "c7b418a9-4f05-4ee9-8417-dc056edb6919",
  4010: "1eb0aee3-f019-4c8d-816a-06e82016fe59",

  5001: "9674d8af-01d1-48ab-bb5c-ea630a788c15",
  5002: "2db1f4e8-7c0c-4531-b9ff-0c2a6bc7d19a",
  5003: "a68840ea-df65-4847-84e4-016ff985d595",
  5004: "b2b92a39-916c-4f7f-887d-614879848dd7",
  5005: "7073f03f-743e-403f-9c54-971d18037fb7",
  5006: "b6180830-7227-4c1c-b6f4-9a2236183c5c",
  5007: "b3e9fdd1-4e23-4ad1-984f-d46453c99318",
  5008: "91a38c1e-f9c8-40e6-90f8-ee81595d7b87",
  5009: "085c5edb-94bc-4b39-95ed-e7ee8fa1f69d",
  5010: "f555233c-7671-421b-a563-34122ec67978",

  6001: "58f8d9e7-5f43-46bd-a2cd-8d32c8b586ed",
  6002: "9d484a96-186f-4185-9ba4-f75287728331",
  6003: "843edf34-7ed2-4fd0-aff1-978c6541b18e",
  6004: "8f4552e2-7a31-40c4-a238-998471010037",
  6005: "fc7f35e0-9f3b-4643-8c14-e796ea472691",
  6006: "6475fe39-46f1-45e6-99c2-6029ef5a6179",
  6007: "d23cc756-63f3-4aa6-81e5-a7bdf0b87162",
  6008: "14f6e27b-e1a6-467d-a8f8-fb884deb5dbf",
  6009: "c0fecb1e-3eff-467d-8889-f61942f79eb5",
  6010: "118a5b58-3869-4bfc-a361-f5b15c1b1219",

  7001: "196832e4-ae19-4423-8dc8-7ed1f7f0d0aa",
  7002: "323acc42-0cdb-4ae8-b554-b440f75e83d2",
  7003: "4fb880e7-14dc-4197-8233-80f20228f24f",
  7004: "3b5c265d-3e86-4998-95ea-9c40fdc09a82",
  7005: "95d129d6-a85e-4f53-b9a1-e4e01455ac5b",
  7006: "62afc8e9-a8cd-4ad9-a0e5-515512681d0a",
  7007: "5756deb2-8ed2-482b-9d97-70ff7406cd8d",
  7008: "4cbf9437-7459-4054-9bc9-1e550fe28e68",
  7009: "831d0715-ea14-436d-88b0-3c7ee4b9e8e4",
  7010: "429f7da9-39d6-44da-8a92-4f38194955f7",
};

function TotalsRow({
  label,
  hours = "",
  total = "",
  strong = false,
  muted = false,
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: TOTALS_COLS,
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
}

function TotalsAdderRow({
  checked,
  onChange,
  label,
  hours = "",
  total = "",
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: TOTALS_COLS,
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
}

function TotalsDriveTimeRow({
  checked,
  onChange,
  value,
  onValueChange,
  total = "",
  formulaHours = 0,
  laborHoursTotal = 0,
  hoursInWorkWeek = 40,
}) {
  const distanceValue = Number(value) || 0;
  const denominator = Number(hoursInWorkWeek) - distanceValue;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: TOTALS_COLS,
        columnGap: 14,
        alignItems: "start",
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
          paddingTop: 6,
        }}
      >
        <input type="checkbox" checked={checked} onChange={onChange} />
        <span>Drive Time</span>
      </label>

      <div style={{ textAlign: "right" }}>
        <input
          type="number"
          step="0.01"
          min="0"
          value={value}
          onChange={onValueChange}
          style={{ width: 100, textAlign: "right" }}
        />

        <div
          style={{
            marginTop: 4,
            fontSize: 11,
            color: "#666",
            whiteSpace: "normal",
          }}
        >
          {denominator > 0
            ? `(${Number(laborHoursTotal || 0).toFixed(2)} / (${Number(
                hoursInWorkWeek || 0
              ).toFixed(2)} - ${distanceValue.toFixed(
                2
              )})) × ${distanceValue.toFixed(2)} = ${Number(
                formulaHours || 0
              ).toFixed(2)} hrs`
            : "Hours in work week must be greater than drive time."}
        </div>
      </div>

      <div
        style={{
          textAlign: "right",
          fontWeight: 600,
          fontVariantNumeric: "tabular-nums",
          whiteSpace: "nowrap",
          opacity: checked ? 1 : 0.45,
          paddingTop: 6,
        }}
      >
        {total}
      </div>
    </div>
  );
}

function TotalsSellRow({
  value,
  onChange,
  total = "",
  romh = "",
  laborHoursTotal,
  pct,
}) {
  return (
    <>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: TOTALS_COLS,
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

      <TotalsRow
        label="Return on Man Hours"
        hours={
          laborHoursTotal ? `${laborHoursTotal.toFixed(2)} hrs` : "0.00 hrs"
        }
        total={romh}
        muted
      />
    </>
  );
}

function TotalsSectionTitle({ children }) {
  return (
    <div
      style={{
        marginTop: 12,
        marginBottom: 6,
        fontSize: 12,
        fontWeight: 800,
      }}
    >
      {children}
    </div>
  );
}

function TotalsPage({
  taxRate,
  setTaxRate,
  totalsBySection,
  laborSections,
  lineItemsBySection = {},
  laborLineItemsBySection = {},
  enabledAdders,
  toggleAdder,
  driveTime,
  setDriveTime,
  premiumBaseInput,
  setPremiumBaseInput,
  sellMargins,
  setSellMargin,
  reportId,
  excelExportLoading,
  downloadBidExcel,
  onBackToInputs,
}) {
  const BUILDOPS_CREATE_QUOTE_API =
    "https://ccmechconstruction-bjate8cvcha3ecgt.canadacentral-01.azurewebsites.net/api/buildops/quotes";

  const BUILDOPS_TEST_PROPERTY_ID = "5542d55a-4a49-4c33-8db3-1de0afcde274";
  const BUILDOPS_TEST_DEPARTMENT_ID = "1f9ec39e-0e6b-409f-bdf5-cd47e732e729";

  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [buildOpsQuoteLoading, setBuildOpsQuoteLoading] = useState(false);
  const [buildOpsQuoteResult, setBuildOpsQuoteResult] = useState("");

  const [quoteForm, setQuoteForm] = useState({
    name: "Capital City Test Quote",
    issueDescription: "Test quote created from Capital City estimating app.",
    description: "Frontend test sent to Azure Function /api/buildops/quotes.",
    scopeOfWork: "Test scope of work from Capital City estimating app.",
    versionLabel: "Initial",
    expirationLength: "30",
  });

  const [productIdsByLineItemId, setProductIdsByLineItemId] = useState({});

  const updateQuoteForm = useCallback((field, value) => {
    setQuoteForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const openCreateQuoteForm = useCallback(() => {
    setShowQuoteForm((prev) => !prev);
    setBuildOpsQuoteResult("");
  }, []);

  const allEstimateLineItems = useMemo(() => {
    const sectionLabels = {
      equipment: "Equipment",
      demo: "Demo",
      rough: "Rough",
      air: "Air Distribution",
      electrical: "Electrical",
      piping: "Piping",
      completion: "Completion",
    };

    const laborLabels = {
      labor1: "Labor 1",
      labor2: "Labor 2",
      labor3: "Labor 3",
      labor4: "Labor 4",
      labor5: "Labor 5",
      labor6: "Labor 6",
      labor7: "Labor 7",
    };

    const parseMoneyNumber = (value) => {
      const n = Number(
        String(value ?? "")
          .replace(/,/g, "")
          .replace(/\$/g, "")
          .trim()
      );

      return Number.isFinite(n) ? Number(n.toFixed(2)) : 0;
    };

    const getCostCode = (row) => {
      return (
        row?.CostCode ??
        row?.CostCodes ??
        row?.costCode ??
        row?.costCodes ??
        row?.CodeNumber ??
        row?.codeNumber ??
        row?.LaborCode ??
        row?.laborCode ??
        row?.COSTCODE ??
        row?.COSTCODES ??
        ""
      );
    };

    const cleanCostCodeValue = (value) => {
      return String(value || "")
        .replace(/[^0-9]/g, "")
        .trim();
    };

    const nonLaborRows = Object.entries(lineItemsBySection || {}).flatMap(
      ([sectionKey, rows]) =>
        (Array.isArray(rows) ? rows : []).map((row, index) => {
          const id =
            row?.EquipmentId ||
            row?.DemoId ||
            row?.RoughId ||
            row?.ERoughId ||
            row?.AirDistributionId ||
            row?.ElectricalId ||
            row?.PipingId ||
            row?.CompletionId ||
            row?.id ||
            `${sectionKey}-${index}`;

          return {
            id,
            quoteLineKey: `nonlabor-${sectionKey}-${id}-${index}`,
            section: sectionLabels[sectionKey] || sectionKey,
            costCode: getCostCode(row),
            description: row?.Description || row?.description || "",
            supplier: row?.Supplier || row?.supplier || "",
            cost: parseMoneyNumber(row?.Cost ?? row?.cost ?? 0),
            hours: "",
            notes: row?.Notes || row?.notes || "",
          };
        })
    );

    const laborRows = Object.entries(laborLineItemsBySection || {}).flatMap(
      ([sectionKey, rows]) =>
        (Array.isArray(rows) ? rows : []).map((row, index) => {
          const id = row?.LaborId || row?.id || `${sectionKey}-${index}`;

          return {
            id,
            quoteLineKey: `labor-${sectionKey}-${id}-${index}`,
            section: laborLabels[sectionKey] || sectionKey,
            costCode: getCostCode(row),
            description:
              row?.LaborName ||
              row?.LaborType ||
              row?.Description ||
              row?.description ||
              "",
            supplier: row?.LaborType || "",
            cost: parseMoneyNumber(row?.LaborCost ?? row?.Cost ?? row?.cost ?? 0),
            hours: Number(row?.LaborHours ?? row?.hours ?? 0) || 0,
            notes: row?.Notes || row?.notes || "",
          };
        })
    );

    const combinedRows = [...nonLaborRows, ...laborRows];

    return combinedRows.map((item, index) => {
      const cleanCostCode = cleanCostCodeValue(item.costCode);

      return {
        ...item,
        productNumber: cleanCostCode || index + 1,
        defaultProductId:
          DEFAULT_BUILDOPS_PRODUCT_IDS_BY_COST_CODE[cleanCostCode] || "",
      };
    });
  }, [lineItemsBySection, laborLineItemsBySection]);

  const updateLineItemProductId = useCallback((quoteLineKey, productId) => {
    setProductIdsByLineItemId((prev) => ({
      ...prev,
      [quoteLineKey]: productId,
    }));
  }, []);

  const quoteItems = useMemo(() => {
    return allEstimateLineItems.map((item) => {
      const parsedCost = Number(
        String(item.cost ?? "")
          .replace(/,/g, "")
          .replace(/\$/g, "")
          .trim()
      );

      const safeCost = Number.isFinite(parsedCost)
        ? Number(parsedCost.toFixed(2))
        : 0;

      const productId = String(
        productIdsByLineItemId[item.quoteLineKey] || item.defaultProductId || ""
      ).trim();

      return {
        productId,
        quantity: 1,
        unitCost: safeCost,
        unitPrice: safeCost,
        description: String(item.description || "").trim(),
      };
    });
  }, [allEstimateLineItems, productIdsByLineItemId]);

  const missingProductIdLineItems = useMemo(() => {
    return allEstimateLineItems.filter((item) => {
      const productId = String(
        productIdsByLineItemId[item.quoteLineKey] || item.defaultProductId || ""
      ).trim();

      return !productId;
    });
  }, [allEstimateLineItems, productIdsByLineItemId]);

  const submitBuildOpsQuote = useCallback(
    async (e) => {
      e.preventDefault();

      setBuildOpsQuoteLoading(true);
      setBuildOpsQuoteResult("");

      try {
        if (!BUILDOPS_TEST_PROPERTY_ID) {
          throw new Error("BuildOps propertyId is missing.");
        }

        if (!BUILDOPS_TEST_DEPARTMENT_ID) {
          throw new Error("BuildOps departmentId is missing.");
        }

        if (!String(quoteForm.name || "").trim()) {
          throw new Error("Quote Name is required.");
        }

        if (!String(quoteForm.issueDescription || "").trim()) {
          throw new Error("Issue Description is required.");
        }

        if (allEstimateLineItems.length === 0) {
          throw new Error("There are no estimate line items to send.");
        }

        if (missingProductIdLineItems.length > 0) {
          throw new Error(
            `Product ID is required for every line item before creating the quote. Missing: ${missingProductIdLineItems
              .map(
                (item) =>
                  item.costCode ||
                  item.description ||
                  item.section ||
                  item.id
              )
              .slice(0, 10)
              .join(", ")}${
              missingProductIdLineItems.length > 10
                ? `, and ${missingProductIdLineItems.length - 10} more`
                : ""
            }`
          );
        }

        const payload = {
          propertyId: BUILDOPS_TEST_PROPERTY_ID,
          departmentId: BUILDOPS_TEST_DEPARTMENT_ID,
          name: String(quoteForm.name || "").trim(),
          issueDescription: String(quoteForm.issueDescription || "").trim(),
          description: String(quoteForm.description || "").trim(),
          scopeOfWork: String(quoteForm.scopeOfWork || "").trim(),
          versionLabel: String(quoteForm.versionLabel || "").trim() || "Initial",
          expirationLength: Number(quoteForm.expirationLength) || 30,
          items: quoteItems,
        };

        const res = await fetch(BUILDOPS_CREATE_QUOTE_API, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok || !data?.ok) {
          throw new Error(
            JSON.stringify(
              {
                status: res.status,
                error: data?.error || `HTTP ${res.status}`,
                details: data?.details || null,
                fullResponse: data,
              },
              null,
              2
            )
          );
        }

        setBuildOpsQuoteResult(
          `✅ BuildOps quote created.

Sent ${quoteItems.length} quote items.

Sent payload:
${JSON.stringify(payload, null, 2)}

Response:
${JSON.stringify(data, null, 2)}`
        );
      } catch (err) {
        console.error("❌ BuildOps quote failed:", err);

        setBuildOpsQuoteResult(
          `❌ BuildOps quote failed:\n\n${err.message || String(err)}`
        );
      } finally {
        setBuildOpsQuoteLoading(false);
      }
    },
    [
      quoteForm,
      allEstimateLineItems,
      missingProductIdLineItems,
      quoteItems,
    ]
  );

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

  const withTax = useCallback(
    (n) => Number(n || 0) * (1 + (Number(taxRate) || 0)),
    [taxRate]
  );

  const labelForSection = useCallback((k) => {
    if (k === "air") return "Air Distribution";
    return k.charAt(0).toUpperCase() + k.slice(1);
  }, []);

  const pct = useCallback((n) => `${(Number(n || 0) * 100).toFixed(2)}%`, []);

  const subTotal = useMemo(
    () =>
      Object.values(totalsBySection || {}).reduce(
        (sum, v) => sum + (Number(v) || 0),
        0
      ),
    [totalsBySection]
  );

  const subTotalWithTax = useMemo(() => withTax(subTotal), [subTotal, withTax]);
  const grandTotalWithTax = subTotalWithTax;

  const laborSubTotal = useMemo(
    () =>
      Object.values(laborSections || {}).reduce(
        (sum, v) => sum + (Number(v?.cost) || 0),
        0
      ),
    [laborSections]
  );

  const laborHoursTotal = useMemo(
    () =>
      Object.values(laborSections || {}).reduce(
        (sum, v) => sum + (Number(v?.hours) || 0),
        0
      ),
    [laborSections]
  );

  const laborByType = useMemo(() => {
    const map = new Map();

    for (const section of Object.values(laborSections || {})) {
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
        const v = laborSections?.[key] || {};

        return {
          key,
          label,
          cost: Number(v.cost) || 0,
          hours: Number(v.hours) || 0,
        };
      })
      .filter((x) => x.cost !== 0 || x.hours !== 0);
  }, [laborSections]);

  const laborSubTotalWithTax = useMemo(
    () => withTax(laborSubTotal),
    [laborSubTotal, withTax]
  );

  const laborGrandTotalWithTax = laborSubTotalWithTax;

  const combinedGrandTotalWithTax = useMemo(
    () => grandTotalWithTax + laborGrandTotalWithTax,
    [grandTotalWithTax, laborGrandTotalWithTax]
  );

  const contingencyRate = 0.02;
  const warrantyRate = 0.03;
  const consumablesRate = 0.025;
  const perDiemDaily = 25;
  const perDiemMult = 1.1;
  const hoursInWorkWeek = 40;

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

  const driveTimeFormulaHours = useMemo(() => {
    const distanceBothWays = Number(driveTime) || 0;
    const denominator = hoursInWorkWeek - distanceBothWays;

    if (distanceBothWays <= 0) return 0;
    if (laborHoursTotal <= 0) return 0;
    if (denominator <= 0) return 0;

    return (laborHoursTotal / denominator) * distanceBothWays;
  }, [driveTime, laborHoursTotal]);

  const driveTimeIncluded = useMemo(
    () => (enabledAdders?.driveTime ? driveTimeFormulaHours : 0),
    [enabledAdders?.driveTime, driveTimeFormulaHours]
  );

  const perDiemIncluded = useMemo(
    () => (enabledAdders?.perDiem ? perDiem : 0),
    [enabledAdders?.perDiem, perDiem]
  );

  const addersTotal = useMemo(
    () =>
      contingency + perDiemIncluded + warranty + consumables + driveTimeIncluded,
    [contingency, perDiemIncluded, warranty, consumables, driveTimeIncluded]
  );

  const combinedWithAdders = useMemo(
    () => combinedGrandTotalWithTax + addersTotal,
    [combinedGrandTotalWithTax, addersTotal]
  );

  const nonLaborWithAdders = useMemo(
    () => grandTotalWithTax + addersTotal,
    [grandTotalWithTax, addersTotal]
  );

  const premiumBaseAmount = useMemo(() => {
    if (String(premiumBaseInput).trim() === "") return combinedWithAdders;
    return Number(premiumBaseInput) || 0;
  }, [premiumBaseInput, combinedWithAdders]);

  const premiumTier1 = useMemo(() => {
    if (premiumBaseAmount < 100000) {
      return Math.round(premiumBaseAmount * 12.96) / 1000;
    }

    return 1296;
  }, [premiumBaseAmount]);

  const premiumTier2 = useMemo(() => {
    if (premiumBaseAmount <= 100000) return 0;

    if (premiumBaseAmount < 500000) {
      return Math.round((premiumBaseAmount - 100000) * 12.96) / 1000;
    }

    return 5184;
  }, [premiumBaseAmount]);

  const premiumTier3 = useMemo(() => {
    if (premiumBaseAmount <= 500000) return 0;

    if (premiumBaseAmount < 2500000) {
      return Math.round((premiumBaseAmount - 500000) * 7.83) / 1000;
    }

    return 15660;
  }, [premiumBaseAmount]);

  const premiumTier4 = useMemo(() => {
    if (premiumBaseAmount <= 2500000) return 0;

    if (premiumBaseAmount < 5000000) {
      return Math.round((premiumBaseAmount - 2500000) * 6.21) / 1000;
    }

    return Math.round(2500000 * 6.21) / 1000;
  }, [premiumBaseAmount]);

  const premiumTier5 = useMemo(() => {
    if (premiumBaseAmount <= 5000000) return 0;

    if (premiumBaseAmount < 7500000) {
      return Math.round((premiumBaseAmount - 5000000) * 5.67) / 1000;
    }

    return Math.round(2500000 * 5.67) / 1000;
  }, [premiumBaseAmount]);

  const premiumTier6 = useMemo(() => {
    if (premiumBaseAmount <= 7500000) return 0;

    return Math.round((premiumBaseAmount - 7500000) * 5.8) / 1000;
  }, [premiumBaseAmount]);

  const totalPremium = useMemo(() => {
    if (premiumBaseAmount < 100000) return premiumTier1;

    if (premiumBaseAmount < 500000) {
      return premiumTier1 + premiumTier2;
    }

    if (premiumBaseAmount < 2500000) {
      return premiumTier1 + premiumTier2 + premiumTier3;
    }

    if (premiumBaseAmount < 5000000) {
      return premiumTier1 + premiumTier2 + premiumTier3 + premiumTier4;
    }

    if (premiumBaseAmount < 7500000) {
      return (
        premiumTier1 +
        premiumTier2 +
        premiumTier3 +
        premiumTier4 +
        premiumTier5
      );
    }

    return (
      premiumTier1 +
      premiumTier2 +
      premiumTier3 +
      premiumTier4 +
      premiumTier5 +
      premiumTier6
    );
  }, [
    premiumBaseAmount,
    premiumTier1,
    premiumTier2,
    premiumTier3,
    premiumTier4,
    premiumTier5,
    premiumTier6,
  ]);

  const margin1Value = useMemo(() => {
    const m = Number(sellMargins?.margin1) || 0;
    return m >= 1 ? 0 : combinedWithAdders / (1 - m);
  }, [combinedWithAdders, sellMargins?.margin1]);

  const margin2Value = useMemo(() => {
    const m = Number(sellMargins?.margin2) || 0;
    return m >= 1 ? 0 : combinedWithAdders / (1 - m);
  }, [combinedWithAdders, sellMargins?.margin2]);

  const margin3Value = useMemo(() => {
    const m = Number(sellMargins?.margin3) || 0;
    return m >= 1 ? 0 : combinedWithAdders / (1 - m);
  }, [combinedWithAdders, sellMargins?.margin3]);

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

  return (
    <>
      <h1>Capital City</h1>

      <div style={{ width: "100%", display: "block", textAlign: "left" }}>
        <div className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Totals</h5>

          <div className="d-flex gap-2">
            <button
              className="btn btn-sm btn-success"
              onClick={downloadBidExcel}
              disabled={!reportId || excelExportLoading}
            >
              {excelExportLoading ? "Exporting..." : "Export Excel"}
            </button>

            <button
              className="btn btn-sm btn-outline-primary"
              onClick={openCreateQuoteForm}
              disabled={buildOpsQuoteLoading}
            >
              Create Quote
            </button>

            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={onBackToInputs}
              title="Go back to inputs"
            >
              Back to Inputs Page
            </button>
          </div>
        </div>

        {showQuoteForm && (
          <>
            <form
              onSubmit={submitBuildOpsQuote}
              className="border rounded p-3 mt-3"
              style={{
                maxWidth: 780,
                background: "#f8f9fa",
              }}
            >
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h6 className="mb-0">Create BuildOps Quote</h6>

                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => setShowQuoteForm(false)}
                  disabled={buildOpsQuoteLoading}
                >
                  Close
                </button>
              </div>

              <div className="alert alert-info py-2" style={{ fontSize: 12 }}>
                Product IDs below are filled automatically by matching the line
                item's Cost Code to the matching BuildOps product. You can still
                manually overwrite any Product ID before submitting.
              </div>

              <div className="row g-2">
                <div className="col-md-6">
                  <label className="form-label mb-1" style={{ fontSize: 12 }}>
                    Property ID
                  </label>
                  <input
                    className="form-control form-control-sm"
                    value={BUILDOPS_TEST_PROPERTY_ID}
                    readOnly
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label mb-1" style={{ fontSize: 12 }}>
                    Department ID
                  </label>
                  <input
                    className="form-control form-control-sm"
                    value={BUILDOPS_TEST_DEPARTMENT_ID}
                    readOnly
                  />
                </div>

                <div className="col-md-12">
                  <label className="form-label mb-1" style={{ fontSize: 12 }}>
                    Quote Name
                  </label>
                  <input
                    className="form-control form-control-sm"
                    value={quoteForm.name}
                    onChange={(e) => updateQuoteForm("name", e.target.value)}
                    required
                  />
                </div>

                <div className="col-md-12">
                  <label className="form-label mb-1" style={{ fontSize: 12 }}>
                    Issue Description
                  </label>
                  <textarea
                    className="form-control form-control-sm"
                    rows={2}
                    value={quoteForm.issueDescription}
                    onChange={(e) =>
                      updateQuoteForm("issueDescription", e.target.value)
                    }
                    required
                  />
                </div>

                <div className="col-md-12">
                  <label className="form-label mb-1" style={{ fontSize: 12 }}>
                    Description
                  </label>
                  <textarea
                    className="form-control form-control-sm"
                    rows={2}
                    value={quoteForm.description}
                    onChange={(e) =>
                      updateQuoteForm("description", e.target.value)
                    }
                  />
                </div>

                <div className="col-md-12">
                  <label className="form-label mb-1" style={{ fontSize: 12 }}>
                    Scope of Work
                  </label>
                  <textarea
                    className="form-control form-control-sm"
                    rows={3}
                    value={quoteForm.scopeOfWork}
                    onChange={(e) =>
                      updateQuoteForm("scopeOfWork", e.target.value)
                    }
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label mb-1" style={{ fontSize: 12 }}>
                    Version Label
                  </label>
                  <input
                    className="form-control form-control-sm"
                    value={quoteForm.versionLabel}
                    onChange={(e) =>
                      updateQuoteForm("versionLabel", e.target.value)
                    }
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label mb-1" style={{ fontSize: 12 }}>
                    Expiration Length
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    className="form-control form-control-sm"
                    value={quoteForm.expirationLength}
                    onChange={(e) =>
                      updateQuoteForm("expirationLength", e.target.value)
                    }
                  />
                </div>
              </div>

              <div className="d-flex gap-2 mt-3">
                <button
                  type="submit"
                  className="btn btn-sm btn-primary"
                  disabled={buildOpsQuoteLoading}
                >
                  {buildOpsQuoteLoading
                    ? "Submitting..."
                    : `Submit Quote (${quoteItems.length} items)`}
                </button>

                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => setShowQuoteForm(false)}
                  disabled={buildOpsQuoteLoading}
                >
                  Cancel
                </button>
              </div>
            </form>

            <div className="card mt-3" style={{ maxWidth: 1300 }}>
              <div className="card-body py-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6 className="mb-0">Estimate Line Items</h6>

                  <span className="badge bg-secondary">
                    {allEstimateLineItems.length} items
                  </span>
                </div>

                {allEstimateLineItems.length === 0 ? (
                  <div className="text-muted" style={{ fontSize: 12 }}>
                    No individual line items have been received by the totals page yet.
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-sm table-striped align-middle mb-0">
                      <thead>
                        <tr>
                          <th style={{ width: 150 }}>Section</th>
                          <th style={{ width: 100 }}>Cost Code</th>
                          <th style={{ width: 300 }}>Product ID</th>
                          <th>Description</th>
                          <th style={{ width: 150 }}>Type / Supplier</th>
                          <th style={{ width: 70 }} className="text-end">
                            Qty
                          </th>
                          <th style={{ width: 90 }} className="text-end">
                            Hours
                          </th>
                          <th style={{ width: 130 }} className="text-end">
                            Unit Cost
                          </th>
                          <th>Notes</th>
                        </tr>
                      </thead>

                      <tbody>
                        {allEstimateLineItems.map((item) => {
                          const productIdValue =
                            productIdsByLineItemId[item.quoteLineKey] ||
                            item.defaultProductId ||
                            "";

                          const hasMatchedProduct = !!item.defaultProductId;

                          return (
                            <tr key={item.quoteLineKey}>
                              <td>{item.section}</td>

                              <td
                                style={{
                                  fontVariantNumeric: "tabular-nums",
                                  whiteSpace: "nowrap",
                                  fontWeight: 700,
                                  color: hasMatchedProduct ? "green" : "#dc3545",
                                }}
                                title={
                                  hasMatchedProduct
                                    ? "Cost code matched to default BuildOps product ID"
                                    : "No default BuildOps product ID found for this cost code"
                                }
                              >
                                {item.costCode || "Missing"}
                              </td>

                              <td>
                                <input
                                  className="form-control form-control-sm"
                                  value={productIdValue}
                                  onChange={(e) =>
                                    updateLineItemProductId(
                                      item.quoteLineKey,
                                      e.target.value
                                    )
                                  }
                                  placeholder="Paste BuildOps productId GUID"
                                  style={{
                                    fontSize: 11,
                                    fontFamily: "monospace",
                                  }}
                                />
                              </td>

                              <td>{item.description}</td>

                              <td>{item.supplier}</td>

                              <td className="text-end">1</td>

                              <td className="text-end">
                                {item.hours ? Number(item.hours).toFixed(2) : ""}
                              </td>

                              <td className="text-end">{money(item.cost)}</td>

                              <td>{item.notes}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {buildOpsQuoteResult && (
          <div
            className={
              buildOpsQuoteResult.startsWith("✅")
                ? "alert alert-success py-2 mt-2 mb-0"
                : "alert alert-danger py-2 mt-2 mb-0"
            }
            style={{
              fontSize: 12,
              whiteSpace: "pre-wrap",
              fontFamily: "monospace",
            }}
          >
            {buildOpsQuoteResult}
          </div>
        )}

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
              gridTemplateColumns: TOTALS_COLS,
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

          <TotalsSectionTitle>Non-Labor</TotalsSectionTitle>

          {Object.entries(totalsBySection || {}).map(([k, v]) => (
            <TotalsRow
              key={k}
              label={labelForSection(k)}
              hours={pct(taxRate)}
              total={money(withTax(v))}
            />
          ))}

          <TotalsRow
            label="Non-Labor Subtotal"
            hours={pct(taxRate)}
            total={money(subTotalWithTax)}
            strong
          />

          <TotalsSectionTitle>Labor</TotalsSectionTitle>

          {laborByType.length > 0 ? (
            laborByType.map((t) => (
              <TotalsRow
                key={t.type}
                label={t.type}
                hours={`${Number(t.hours || 0).toFixed(2)} hrs`}
                total={money(withTax(t.cost))}
              />
            ))
          ) : laborSectionRows.length > 0 ? (
            laborSectionRows.map((x) => (
              <TotalsRow
                key={x.key}
                label={x.label}
                hours={x.hours ? `${x.hours.toFixed(2)} hrs` : ""}
                total={money(withTax(x.cost))}
              />
            ))
          ) : (
            <TotalsRow label="No labor totals yet." hours="" total="" muted />
          )}

          <TotalsRow
            label="Labor Subtotal"
            hours={`${laborHoursTotal.toFixed(2)} hrs`}
            total={money(laborSubTotalWithTax)}
            strong
          />

          <TotalsSectionTitle>Adders</TotalsSectionTitle>

          <TotalsRow
            label="Contingency"
            hours={pct(contingencyRate)}
            total={money(contingency)}
          />

          <TotalsAdderRow
            checked={!!enabledAdders?.perDiem}
            onChange={() => toggleAdder("perDiem")}
            label="Per Diem"
            hours={`${laborHoursTotal.toFixed(2)} hrs`}
            total={money(perDiemIncluded)}
          />

          <TotalsRow
            label="Warranty"
            hours={pct(warrantyRate)}
            total={money(warranty)}
          />

          <TotalsRow
            label="Consumables"
            hours={pct(consumablesRate)}
            total={money(consumables)}
          />

          <TotalsDriveTimeRow
            checked={!!enabledAdders?.driveTime}
            onChange={() => toggleAdder("driveTime")}
            value={driveTime}
            onValueChange={(e) => setDriveTime(e.target.value)}
            formulaHours={driveTimeFormulaHours}
            laborHoursTotal={laborHoursTotal}
            hoursInWorkWeek={hoursInWorkWeek}
            total={money(driveTimeIncluded)}
          />

          <TotalsRow
            label="Adders Total"
            hours=""
            total={money(addersTotal)}
            strong
          />

          <TotalsRow
            label="Non-Labor Grand Total + Adders"
            hours=""
            total={money(nonLaborWithAdders)}
            strong
          />

          <TotalsRow
            label="Combined Grand Total + Adders"
            hours=""
            total={money(combinedWithAdders)}
            strong
          />

          <TotalsSectionTitle>Sell Price Targets</TotalsSectionTitle>

          <TotalsSellRow
            value={sellMargins?.margin1}
            onChange={(e) => setSellMargin("margin1", e.target.value)}
            total={money(margin1Value)}
            romh={money(romh1)}
            laborHoursTotal={laborHoursTotal}
            pct={pct}
          />

          <TotalsSellRow
            value={sellMargins?.margin2}
            onChange={(e) => setSellMargin("margin2", e.target.value)}
            total={money(margin2Value)}
            romh={money(romh2)}
            laborHoursTotal={laborHoursTotal}
            pct={pct}
          />

          <TotalsSellRow
            value={sellMargins?.margin3}
            onChange={(e) => setSellMargin("margin3", e.target.value)}
            total={money(margin3Value)}
            romh={money(romh3)}
            laborHoursTotal={laborHoursTotal}
            pct={pct}
          />

          <TotalsSectionTitle>Premium</TotalsSectionTitle>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: TOTALS_COLS,
              columnGap: 14,
              alignItems: "center",
              padding: "3px 0",
              fontSize: 12,
              lineHeight: 1.35,
            }}
          >
            <div style={{ fontWeight: 700 }}>Premium Starting Amount</div>

            <div style={{ textAlign: "right" }}>
              <input
                type="number"
                step="0.01"
                min="0"
                value={premiumBaseInput}
                onChange={(e) => setPremiumBaseInput(e.target.value)}
                placeholder={String(combinedWithAdders.toFixed(2))}
                style={{ width: 120, textAlign: "right" }}
              />
            </div>

            <div
              style={{
                textAlign: "right",
                fontWeight: 800,
                fontVariantNumeric: "tabular-nums",
                whiteSpace: "nowrap",
              }}
            >
              {money(premiumBaseAmount)}
            </div>
          </div>

          <TotalsRow label="Tier 1 Premium" total={money(premiumTier1)} />

          {premiumTier2 > 0 && (
            <TotalsRow label="Tier 2 Premium" total={money(premiumTier2)} />
          )}

          {premiumTier3 > 0 && (
            <TotalsRow label="Tier 3 Premium" total={money(premiumTier3)} />
          )}

          {premiumTier4 > 0 && (
            <TotalsRow label="Tier 4 Premium" total={money(premiumTier4)} />
          )}

          {premiumTier5 > 0 && (
            <TotalsRow label="Tier 5 Premium" total={money(premiumTier5)} />
          )}

          {premiumTier6 > 0 && (
            <TotalsRow label="Tier 6 Premium" total={money(premiumTier6)} />
          )}

          <TotalsRow
            label="Total Premium"
            hours=""
            total={money(totalPremium)}
            strong
          />
        </div>
      </div>
    </>
  );
}

export default TotalsPage;