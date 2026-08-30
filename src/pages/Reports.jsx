import { useEffect, useState } from "react";
import { api, getToken, API } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { KPICard, StatusBadge, CardsSkeleton, scoreColor } from "@/components/common";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { cn } from "@/lib/utils";

const funnelColors = ["#1e5bff", "#2b6bff", "#17a2c7", "#17b6c7", "#14b8a6", "#22c55e", "#16a34a"];

export default function Reports() {
  const { can } = useAuth();
  const [d, setD] = useState(null);
  useEffect(() => { api.get("/reports").then((r) => setD(r.data)).catch(() => setD(false)); }, []);

  const exportCsv = (kind) => {
    const url = `${API}/reports/export?kind=${kind}&auth=${getToken()}`;
    window.open(url.replace("&auth=", `&_t=${Date.now()}&auth=`), "_blank");
    // fetch with auth header for reliability
    api.get(`/reports/export?kind=${kind}`, { responseType: "blob" }).then((res) => {
      const blob = new Blob([res.data], { type: "text/csv" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${kind}_report.csv`;
      link.click();
    });
  };

  if (d === false) return <div className="text-sm text-slate-500">Recruitment analytics will appear once your organization has hiring activity.</div>;
  if (!d) return <div className="space-y-4"><div className="h-8 w-48 bg-slate-200 rounded animate-pulse" /><CardsSkeleton /></div>;

  const o = d.overview;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display font-extrabold text-3xl text-[#0a2540]">Recruitment Intelligence</h1>
          <p className="text-slate-500 mt-1">Insights across jobs, candidates, funnel and hiring performance.</p>
        </div>
        {can("export_reports") && (
          <div className="flex gap-2">
            <Button variant="outline" data-testid="export-overview-btn" onClick={() => exportCsv("overview")}><Download className="h-4 w-4 mr-2" /> Export Overview</Button>
            <Button variant="outline" data-testid="export-jobperf-btn" onClick={() => exportCsv("job_performance")}><Download className="h-4 w-4 mr-2" /> Export Job Performance</Button>
          </div>
        )}
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="bg-white border border-slate-200 flex-wrap h-auto">
          {[["overview", "Overview"], ["jobs", "Job Performance"], ["funnel", "Funnel"], ["quality", "Candidate Quality"], ["sources", "Sources"], ["time", "Time to Hire"], ["recruiters", "Recruiters"], ["skills", "Skill Gap"], ["health", "Job Health"]].map(([v, l]) => (
            <TabsTrigger key={v} value={v} data-testid={`rtab-${v}`} className="data-[state=active]:bg-[#1e5bff] data-[state=active]:text-white text-xs">{l}</TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <KPICard label="Total Jobs" value={o.total_jobs} /><KPICard label="Active Jobs" value={o.active_jobs} accent="text-emerald-500" />
            <KPICard label="Applications" value={o.applications} /><KPICard label="Matched" value={o.matched} accent="text-teal-500" />
            <KPICard label="Shortlisted" value={o.shortlisted} /><KPICard label="Interviews" value={o.interviews} accent="text-amber-500" />
            <KPICard label="Finalists" value={o.finalists} /><KPICard label="Selected" value={o.selected} accent="text-emerald-500" />
            <KPICard label="Rejected" value={o.rejected} accent="text-red-500" /><KPICard label="Conversion" value={`${o.conversion_rate}%`} accent="text-[#1e5bff]" />
            <KPICard label="Avg ATS" value={o.avg_ats} /><KPICard label="Time to Hire" value={`${o.avg_time_to_hire}d`} />
          </div>
        </TabsContent>

        <TabsContent value="jobs" className="mt-4">
          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto"><table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500"><tr className="text-left">{["Job", "Dept", "Apps", "Matched", "Match Rate", "Shortlist", "Interviews", "Selected", "Avg ATS", "Days Open", "Conversion"].map((h) => <th key={h} className="px-3 py-3 font-semibold text-xs uppercase whitespace-nowrap">{h}</th>)}</tr></thead>
              <tbody>{d.job_performance.map((j) => (<tr key={j.id} className="border-t border-slate-100 hover:bg-slate-50"><td className="px-3 py-3 font-medium text-[#0a2540]">{j.title}</td><td className="px-3 py-3 text-slate-600">{j.department}</td><td className="px-3 py-3">{j.applications}</td><td className="px-3 py-3">{j.matched}</td><td className="px-3 py-3">{j.match_rate}%</td><td className="px-3 py-3">{j.shortlisted}</td><td className="px-3 py-3">{j.interviews}</td><td className="px-3 py-3">{j.selected}</td><td className="px-3 py-3">{j.avg_ats}</td><td className="px-3 py-3">{j.days_open}</td><td className="px-3 py-3">{j.conversion}%</td></tr>))}</tbody>
            </table></div>
          </Card>
        </TabsContent>

        <TabsContent value="funnel" className="mt-4">
          <Card className="border-slate-200 shadow-sm p-6 space-y-2">
            {d.funnel.map((f, i) => { const max = d.funnel[0].count || 1; const w = Math.max(6, (f.count / max) * 100); return (
              <div key={f.stage} className="flex items-center gap-3"><div className="w-24 text-sm font-medium text-slate-600">{f.stage}</div><div className="flex-1 h-9 bg-slate-100 rounded-md overflow-hidden"><div className="h-full flex items-center px-3 text-white text-sm font-semibold" style={{ width: `${w}%`, background: funnelColors[i] }}>{f.count}</div></div><div className="w-28 text-right text-xs"><span className="text-emerald-600 font-semibold">{f.conversion}%</span><span className="text-slate-400 ml-2 inline-flex items-center gap-0.5"><TrendingDown className="h-3 w-3" />{f.dropoff}%</span></div></div>
            ); })}
          </Card>
        </TabsContent>

        <TabsContent value="quality" className="mt-4 grid md:grid-cols-2 gap-4">
          <Card className="border-slate-200 shadow-sm p-6">
            <h3 className="font-display font-bold text-lg text-[#0a2540] mb-3">Score Distribution</h3>
            <ResponsiveContainer width="100%" height={220}><BarChart data={d.quality.distribution}><XAxis dataKey="band" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip cursor={{ fill: "#f1f5f9" }} /><Bar dataKey="count" radius={[4, 4, 0, 0]}>{d.quality.distribution.map((_, i) => <Cell key={i} fill={["#22c55e", "#16a34a", "#17b6c7", "#f59e0b", "#ef4444"][i]} />)}</Bar></BarChart></ResponsiveContainer>
          </Card>
          <Card className="border-slate-200 shadow-sm p-6 grid grid-cols-2 gap-3 content-start">
            <div className="rounded-lg bg-slate-50 p-4"><div className="text-xs text-slate-500">Avg ATS</div><div className="text-2xl font-bold text-[#0a2540]">{d.quality.avg_ats}</div></div>
            <div className="rounded-lg bg-slate-50 p-4"><div className="text-xs text-slate-500">Avg Match</div><div className="text-2xl font-bold text-emerald-600">{d.quality.avg_match}</div></div>
            <div className="rounded-lg bg-emerald-50 p-4"><div className="text-xs text-emerald-600">Above 90</div><div className="text-2xl font-bold text-emerald-700">{d.quality.above_90}</div></div>
            <div className="rounded-lg bg-red-50 p-4"><div className="text-xs text-red-600">Below 60</div><div className="text-2xl font-bold text-red-700">{d.quality.below_60}</div></div>
          </Card>
        </TabsContent>

        <TabsContent value="sources" className="mt-4">
          <Card className="border-slate-200 shadow-sm overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500"><tr className="text-left">{["Source", "Applications", "Shortlisted", "Interviews", "Hires", "Conversion"].map((h) => <th key={h} className="px-4 py-3 font-semibold text-xs uppercase">{h}</th>)}</tr></thead>
            <tbody>{d.sources.map((s) => (<tr key={s.source} className="border-t border-slate-100 hover:bg-slate-50"><td className="px-4 py-3 font-medium text-[#0a2540]">{s.source}</td><td className="px-4 py-3">{s.applications}</td><td className="px-4 py-3">{s.shortlisted}</td><td className="px-4 py-3">{s.interviews}</td><td className="px-4 py-3">{s.hires}</td><td className="px-4 py-3">{s.conversion}%</td></tr>))}</tbody>
          </table></div></Card>
        </TabsContent>

        <TabsContent value="time" className="mt-4">
          <Card className="border-slate-200 shadow-sm p-6">
            <div className="mb-4"><span className="text-xs font-bold uppercase text-slate-500">Average Time to Hire</span><div className="text-3xl font-bold text-[#0a2540]">{d.time_to_hire.avg_time_to_hire} days</div></div>
            <div className="space-y-2">{d.time_to_hire.stages.map((s) => (<div key={s.stage} className="flex items-center gap-3"><div className="w-56 text-sm text-slate-600">{s.stage}</div><div className="flex-1 h-6 bg-slate-100 rounded"><div className="h-full bg-[#17b6c7] rounded flex items-center px-2 text-white text-xs" style={{ width: `${s.days * 8}%` }}>{s.days}d</div></div></div>))}</div>
          </Card>
        </TabsContent>

        <TabsContent value="recruiters" className="mt-4">
          <Card className="border-slate-200 shadow-sm overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500"><tr className="text-left">{["Recruiter", "Jobs", "Applications", "Shortlisted", "Interviews", "Selected", "Avg Days", "Conversion"].map((h) => <th key={h} className="px-4 py-3 font-semibold text-xs uppercase">{h}</th>)}</tr></thead>
            <tbody>{d.recruiters.map((r) => (<tr key={r.recruiter} className="border-t border-slate-100 hover:bg-slate-50"><td className="px-4 py-3 font-medium text-[#0a2540]">{r.recruiter}</td><td className="px-4 py-3">{r.jobs_managed}</td><td className="px-4 py-3">{r.applications}</td><td className="px-4 py-3">{r.shortlisted}</td><td className="px-4 py-3">{r.interviews}</td><td className="px-4 py-3">{r.selected}</td><td className="px-4 py-3">{r.avg_processing_days}</td><td className="px-4 py-3">{r.conversion}%</td></tr>))}</tbody>
          </table></div></Card>
        </TabsContent>

        <TabsContent value="skills" className="mt-4 grid md:grid-cols-2 gap-4">
          <Card className="border-slate-200 shadow-sm p-6"><h3 className="font-display font-bold text-lg text-[#0a2540] mb-3">Most Requested Skills</h3><div className="space-y-2">{d.skill_gap.top_skills.map((s) => (<div key={s.skill} className="flex items-center gap-3"><div className="w-28 text-sm text-slate-600">{s.skill}</div><div className="flex-1 h-5 bg-slate-100 rounded"><div className="h-full bg-[#1e5bff] rounded" style={{ width: `${s.count / (d.skill_gap.top_skills[0]?.count || 1) * 100}%` }} /></div><span className="text-xs text-slate-500 w-6">{s.count}</span></div>))}</div></Card>
          <Card className="border-slate-200 shadow-sm p-6"><h3 className="font-display font-bold text-lg text-[#0a2540] mb-3">Most Common Candidate Gaps</h3><div className="space-y-2">{d.skill_gap.common_gaps.map((s) => (<div key={s.skill} className="flex items-center gap-3"><div className="w-28 text-sm text-slate-600">{s.skill}</div><div className="flex-1 h-5 bg-slate-100 rounded"><div className="h-full bg-red-400 rounded" style={{ width: `${s.count / (d.skill_gap.common_gaps[0]?.count || 1) * 100}%` }} /></div><span className="text-xs text-slate-500 w-6">{s.count}</span></div>))}</div></Card>
        </TabsContent>

        <TabsContent value="health" className="mt-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {d.job_performance.filter((j) => j.status === "active").map((j) => (
              <Card key={j.id} className="border-slate-200 shadow-sm p-5">
                <div className="flex items-center justify-between mb-2"><span className="font-medium text-[#0a2540]">{j.title}</span><StatusBadge status={j.health} /></div>
                <p className="text-xs text-slate-500">{j.health_reason}</p>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
