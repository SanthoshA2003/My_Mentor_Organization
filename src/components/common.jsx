import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function scoreColor(score) {
  if (score >= 90) return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (score >= 80) return "bg-green-50 text-green-700 border-green-200";
  if (score >= 70) return "bg-teal-50 text-teal-700 border-teal-200";
  if (score >= 60) return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-red-50 text-red-700 border-red-200";
}

export function scoreLabel(score) {
  if (score >= 90) return "Excellent Match";
  if (score >= 80) return "Strong Match";
  if (score >= 70) return "Good Match";
  if (score >= 60) return "Moderate Match";
  return "Low Match";
}

export function ScoreBadge({ score, label = "ATS", testId }) {
  return (
    <span data-testid={testId} className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold", scoreColor(score))}>
      <span className="font-bold">{score}</span>
      <span className="opacity-60">/ 100 · {label}</span>
    </span>
  );
}

const STATUS_STYLES = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  draft: "bg-slate-100 text-slate-600 border-slate-200",
  paused: "bg-amber-50 text-amber-700 border-amber-200",
  closed: "bg-slate-200 text-slate-700 border-slate-300",
  filled: "bg-blue-50 text-blue-700 border-blue-200",
  Healthy: "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Needs Attention": "bg-amber-50 text-amber-700 border-amber-200",
  "At Risk": "bg-red-50 text-red-700 border-red-200",
};

export function StatusBadge({ status, testId }) {
  const cls = STATUS_STYLES[status] || "bg-slate-100 text-slate-600 border-slate-200";
  return (
    <span data-testid={testId} className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize", cls)}>
      {status}
    </span>
  );
}

export function KPICard({ label, value, sub, icon: Icon, accent = "text-[#1e5bff]", testId, onClick }) {
  return (
    <Card
      data-testid={testId}
      onClick={onClick}
      className={cn("border border-slate-200 shadow-sm p-5 flex flex-col justify-between h-[112px] bg-white transition-colors duration-200", onClick && "cursor-pointer hover:border-[#1e5bff]/40 hover:bg-slate-50")}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</span>
        {Icon && <Icon className={cn("h-4 w-4", accent)} />}
      </div>
      <div>
        <div className="text-2xl font-bold font-display text-[#0a2540]">{value}</div>
        {sub && <div className="text-xs text-slate-500 mt-0.5">{sub}</div>}
      </div>
    </Card>
  );
}

export function EmptyState({ icon: Icon, title, description, action, testId }) {
  return (
    <div data-testid={testId} className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {Icon && <div className="h-14 w-14 rounded-2xl brand-gradient flex items-center justify-center mb-4"><Icon className="h-7 w-7 text-white" /></div>}
      <h3 className="text-lg font-semibold text-[#0a2540]">{title}</h3>
      {description && <p className="text-sm text-slate-500 mt-1 max-w-md">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function TableSkeleton({ rows = 6 }) {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 flex-1" />
          <Skeleton className="h-8 w-24" />
        </div>
      ))}
    </div>
  );
}

export function CardsSkeleton({ count = 4 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => <Skeleton key={i} className="h-[112px] rounded-lg" />)}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <p className="text-sm text-slate-600">{message || "We couldn't load this information. Please try again."}</p>
      {onRetry && (
        <button data-testid="error-retry-btn" onClick={onRetry} className="mt-4 rounded-lg bg-[#1e5bff] px-4 py-2 text-sm font-medium text-white hover:bg-[#154cdb] transition-colors duration-200">
          Retry
        </button>
      )}
    </div>
  );
}
