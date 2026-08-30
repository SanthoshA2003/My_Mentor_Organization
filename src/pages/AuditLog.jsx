import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { TableSkeleton, EmptyState } from "@/components/common";
import { ShieldCheck } from "lucide-react";

export default function AuditLog() {
  const [logs, setLogs] = useState(null);
  useEffect(() => { api.get("/audit-logs").then((r) => setLogs(r.data)).catch(() => setLogs([])); }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-extrabold text-3xl text-[#0a2540] flex items-center gap-2"><ShieldCheck className="h-7 w-7 text-[#1e5bff]" /> Audit Log</h1>
        <p className="text-slate-500 mt-1">Security and activity events across your organization.</p>
      </div>
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        {!logs ? <TableSkeleton /> : logs.length === 0 ? <EmptyState icon={ShieldCheck} title="No audit events yet" /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500"><tr className="text-left">{["User", "Action", "Entity", "Details", "Date/Time"].map((h) => <th key={h} className="px-4 py-3 font-semibold text-xs uppercase">{h}</th>)}</tr></thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-[#0a2540]">{l.user}</td>
                    <td className="px-4 py-3"><span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">{l.action}</span></td>
                    <td className="px-4 py-3 text-slate-600">{l.entity}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{l.info || "—"}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{new Date(l.created_at).toLocaleString()}</td>
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
