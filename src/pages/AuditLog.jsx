import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { TableSkeleton, EmptyState } from "@/components/common";
import { ShieldCheck } from "lucide-react";

export default function AuditLog() {
  const [logs, setLogs] = useState(null);

  useEffect(() => {
  api
    .get("/audit-logs")
    .then((response) => {
      console.log("AUDIT LOGS:", response.data);
      setLogs(response.data);
    })
    .catch((error) => {
      console.error("Failed to fetch audit logs:", error);
      setLogs([]);
    });
}, []);

const formatDetails = (details) => {
  if (
    details === null ||
    details === undefined ||
    details === ""
  ) {
    return "—";
  }

  // Convert field names into readable labels
  const formatFieldName = (key) => {
    return String(key)
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  // =====================================================
  // OBJECT
  // Example:
  // { is_active: true }
  // { is_active: false }
  // =====================================================

  if (
    typeof details === "object" &&
    !Array.isArray(details)
  ) {
    return Object.entries(details)
      .map(([key, value]) => {
        if (key === "is_active") {
          return value
            ? "Account activated"
            : "Account deactivated";
        }

        if (typeof value === "boolean") {
          return `${formatFieldName(key)}: ${
            value ? "Yes" : "No"
          }`;
        }

        return `${formatFieldName(key)}: ${value}`;
      })
      .join(", ");
  }

  // =====================================================
  // ARRAY
  // Example:
  // ["status"]
  // ["name"]
  // ["name", "email"]
  // =====================================================

  if (Array.isArray(details)) {
    if (details.length === 0) {
      return "—";
    }

    const fields = details.map(formatFieldName);

    if (fields.length === 1) {
      return `${fields[0]} updated`;
    }

    if (fields.length === 2) {
      return `${fields[0]} and ${fields[1]} updated`;
    }

    return `${fields
      .slice(0, -1)
      .join(", ")} and ${
      fields[fields.length - 1]
    } updated`;
  }

  // =====================================================
  // STRING
  // =====================================================

  if (typeof details === "string") {
    const text = details.trim();

    if (!text) {
      return "—";
    }

    // ---------------------------------------------------
    // Python-style object:
    // {'is_active': True}
    // {'is_active': False}
    // ---------------------------------------------------

    const activeMatch = text.match(
      /^\{\s*['"]is_active['"]\s*:\s*(True|False|true|false)\s*\}$/
    );

    if (activeMatch) {
      return activeMatch[1].toLowerCase() === "true"
        ? "Account activated"
        : "Account deactivated";
    }

    // ---------------------------------------------------
    // Python-style list:
    // ['status']
    // ['name']
    // ['name', 'email']
    // ---------------------------------------------------

    const listMatch = text.match(
      /^\[\s*(.*?)\s*\]$/
    );

    if (listMatch) {
      const content = listMatch[1];

      if (!content) {
        return "—";
      }

      const fields = content
        .split(",")
        .map((item) =>
          item
            .trim()
            .replace(/^['"]|['"]$/g, "")
        )
        .filter(Boolean)
        .map(formatFieldName);

      if (fields.length === 1) {
        return `${fields[0]} updated`;
      }

      if (fields.length === 2) {
        return `${fields[0]} and ${fields[1]} updated`;
      }

      return `${fields
        .slice(0, -1)
        .join(", ")} and ${
        fields[fields.length - 1]
      } updated`;
    }

    // ---------------------------------------------------
    // Already readable audit details:
    // Interview -> Interview
    // Selected -> Interview
    // shortlisted -> Interview
    // role=hr_admin
    // ---------------------------------------------------

    return text;
  }

  return String(details);
};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-extrabold text-3xl text-[#0a2540] flex items-center gap-2">
          <ShieldCheck className="h-7 w-7 text-[#1e5bff]" />
          Audit Log
        </h1>

        <p className="text-slate-500 mt-1">
          Security and activity events across your organization.
        </p>
      </div>

      <Card className="border-slate-200 shadow-sm overflow-hidden">
        {!logs ? (
          <TableSkeleton />
        ) : logs.length === 0 ? (
          <EmptyState
            icon={ShieldCheck}
            title="No audit events yet"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr className="text-left">
                  {[
                    "User",
                    "Action",
                    "Entity",
                    "Details",
                    "Date/Time",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 font-semibold text-xs uppercase"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {logs.map((l) => (
                  <tr
                    key={l.id}
                    className="border-t border-slate-100 hover:bg-slate-50"
                  >
                    <td className="px-4 py-3 font-medium text-[#0a2540]">
                      {l.user || "—"}
                    </td>

                    <td className="px-4 py-3">
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                        {l.action || "—"}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-slate-600">
                      {l.entity || "—"}
                    </td>
<td className="px-4 py-3 text-slate-500 text-xs">
  {formatDetails(l.details)}
</td>

                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {l.date_time
                        ? new Date(l.date_time).toLocaleString()
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}