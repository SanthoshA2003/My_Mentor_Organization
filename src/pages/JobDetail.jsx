import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api, formatApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { StatusBadge, ScoreBadge, EmptyState, TableSkeleton, scoreColor } from "@/components/common";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ArrowLeft, Edit, Pause, XCircle, PlayCircle, MapPin, Briefcase, Users2, FileText, Target, Layout, CalendarClock, BarChart3, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const STAGE_COLORS = { Applied: "border-t-slate-400", Screening: "border-t-blue-400", Shortlisted: "border-t-[#1e5bff]", Interview: "border-t-teal-400", "Technical Round": "border-t-cyan-500", "HR Round": "border-t-indigo-400", Finalist: "border-t-emerald-400", Selected: "border-t-emerald-600", Rejected: "border-t-red-400", Withdrawn: "border-t-slate-300" };

export default function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { can } = useAuth();
  const [job, setJob] = useState(null);
  const [tab, setTab] = useState("overview");
  const [apps, setApps] = useState(null);
  const [matched, setMatched] = useState(null);
  const [pipeline, setPipeline] = useState(null);
  const [ivs, setIvs] = useState(null);

  const loadJob = () => api.get(`/jobs/${id}`).then((r) => setJob(r.data)).catch(() => setJob(false));
  useEffect(() => { loadJob(); }, [id]);

  useEffect(() => {
    if (tab === "applications" && !apps) api.get(`/jobs/${id}/applications`).then((r) => setApps(r.data)).catch(() => setApps([]));
    if (tab === "matched" && !matched) api.get(`/jobs/${id}/matched`).then((r) => setMatched(r.data)).catch(() => setMatched([]));
    if (tab === "pipeline" && !pipeline) api.get(`/jobs/${id}/pipeline`).then((r) => setPipeline(r.data)).catch(() => setPipeline(null));
    if (tab === "interviews" && !ivs) api.get(`/jobs/${id}/interviews`).then((r) => setIvs(r.data)).catch(() => setIvs([]));
  }, [tab]);

  const changeStatus = async (status) => { await api.post(`/jobs/${id}/status`, { status }); toast.success(`Job ${status}`); loadJob(); };
  const moveStage = async (appId, stage) => {
    try { await api.post(`/applications/${appId}/stage`, { stage }); toast.success(`Moved to ${stage}`); setPipeline(null); setApps(null);
      setTab((t) => t); api.get(`/jobs/${id}/pipeline`).then((r) => setPipeline(r.data)); }
    catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
  };

  if (job === false) return <EmptyState icon={Briefcase} title="Job not found" />;
  if (!job) return <div className="space-y-4"><div className="h-24 bg-slate-200 rounded animate-pulse" /><TableSkeleton /></div>;

  const s = job.stats;

  return (
    <div className="space-y-6">
      <button onClick={() => navigate("/jobs")} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#1e5bff] transition-colors duration-200"><ArrowLeft className="h-4 w-4" /> Back to Jobs</button>

      {/* Header */}
      <Card className="border-slate-200 shadow-sm p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-display font-extrabold text-2xl text-[#0a2540]">{job.title}</h1>
              <StatusBadge status={job.status} />
            </div>
            <div className="flex items-center gap-4 mt-2 text-sm text-slate-500 flex-wrap">
              <span>{job.job_code}</span>
              <span className="flex items-center gap-1"><Briefcase className="h-4 w-4" /> {job.department}</span>
              <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {job.location} · {job.work_mode}</span>
              <span>{job.min_experience}-{job.max_experience} yrs</span>
              <span>{job.openings} opening(s)</span>
              <span>Created {new Date(job.created_at).toLocaleDateString()}</span>
            </div>
          </div>
          <div className="flex gap-2">
            {can("edit_job") && <Button variant="outline" data-testid="edit-job-btn" onClick={() => navigate(`/jobs/${id}/edit`)}><Edit className="h-4 w-4 mr-2" /> Edit</Button>}
            {can("pause_job") && job.status === "active" && <Button variant="outline" onClick={() => changeStatus("paused")}><Pause className="h-4 w-4 mr-2" /> Pause</Button>}
            {can("edit_job") && job.status === "paused" && <Button variant="outline" onClick={() => changeStatus("active")}><PlayCircle className="h-4 w-4 mr-2" /> Reopen</Button>}
            {can("close_job") && job.status !== "closed" && <Button variant="outline" className="text-red-600" onClick={() => changeStatus("closed")}><XCircle className="h-4 w-4 mr-2" /> Close Job</Button>}
          </div>
        </div>
      </Card>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-white border border-slate-200 flex-wrap h-auto">
          {[["overview", "Overview", Layout], ["applications", "Applications", FileText], ["matched", "Matched Profiles", Target], ["pipeline", "Pipeline", Users2], ["interviews", "Interviews", CalendarClock], ["analytics", "Analytics", BarChart3]].map(([v, l, Icon]) => (
            <TabsTrigger key={v} value={v} data-testid={`tab-${v}`} className="data-[state=active]:bg-[#1e5bff] data-[state=active]:text-white"><Icon className="h-4 w-4 mr-1.5" /> {l}</TabsTrigger>
          ))}
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="mt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {[["Applications", s.applications], ["Matched", s.matched], ["Shortlisted", s.shortlisted], ["Interviews", s.interviews], ["Finalists", s.finalists], ["Selected", s.selected], ["Avg ATS", s.avg_ats]].map(([l, v]) => (
              <Card key={l} className="border-slate-200 shadow-sm p-4"><div className="text-xs font-bold uppercase text-slate-500">{l}</div><div className="text-2xl font-bold font-display text-[#0a2540] mt-1">{v}</div></Card>
            ))}
          </div>
          <Card className="border-slate-200 shadow-sm p-6 mt-4">
            <h3 className="font-display font-bold text-lg text-[#0a2540] mb-2">Job Summary</h3>
            <p className="text-sm text-slate-600">{job.summary}</p>
            <div className="grid grid-cols-2 gap-6 mt-4">
              <div><div className="text-xs font-bold uppercase text-slate-500 mb-2">Responsibilities</div><ul className="list-disc pl-5 space-y-1 text-sm text-slate-600">{job.responsibilities?.map((r, i) => <li key={i}>{r}</li>)}</ul></div>
              <div className="space-y-3">
                <div><div className="text-xs font-bold uppercase text-slate-500 mb-1">Required Skills</div><div className="flex flex-wrap gap-1.5">{job.required_skills?.map((sk) => <span key={sk} className="rounded-full bg-blue-50 text-blue-700 px-2 py-0.5 text-xs">{sk}</span>)}</div></div>
                <div><div className="text-xs font-bold uppercase text-slate-500 mb-1">Preferred Skills</div><div className="flex flex-wrap gap-1.5">{job.preferred_skills?.map((sk) => <span key={sk} className="rounded-full bg-teal-50 text-teal-700 px-2 py-0.5 text-xs">{sk}</span>)}</div></div>
                <div><div className="text-xs font-bold uppercase text-slate-500 mb-1">ATS Weights</div><div className="flex flex-wrap gap-2 text-xs text-slate-600">{Object.entries(job.ats_config).map(([k, v]) => <span key={k} className="capitalize">{k.replace("_", " ")}: <b>{v}%</b></span>)}</div></div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Applications */}
        <TabsContent value="applications" className="mt-4">
          <Card className="border-slate-200 shadow-sm overflow-hidden">
            {!apps ? <TableSkeleton /> : apps.length === 0 ? <EmptyState icon={FileText} title="No candidates have applied yet." /> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-500"><tr className="text-left">{["Candidate", "Applied", "ATS", "Match", "Exp", "Stage", "Recruiter", ""].map((h) => <th key={h} className="px-4 py-3 font-semibold text-xs uppercase">{h}</th>)}</tr></thead>
                  <tbody>
                    {apps.map((a) => (
                      <tr key={a.id} className="border-t border-slate-100 hover:bg-slate-50 cursor-pointer" onClick={() => navigate(`/applications/${a.id}`)}>
                        <td className="px-4 py-3"><div className="flex items-center gap-2"><Avatar className="h-8 w-8"><AvatarImage src={a.candidate?.avatar_url} /><AvatarFallback className="text-xs">{a.candidate_name?.[0]}</AvatarFallback></Avatar><span className="font-medium text-[#0a2540]">{a.candidate_name}</span></div></td>
                        <td className="px-4 py-3 text-slate-500 text-xs">{new Date(a.applied_at).toLocaleDateString()}</td>
                        <td className="px-4 py-3"><span className={cn("rounded-full border px-2 py-0.5 text-xs font-bold", scoreColor(a.ats_score))}>{a.ats_score}</span></td>
                        <td className="px-4 py-3"><span className={cn("rounded-full border px-2 py-0.5 text-xs font-bold", scoreColor(a.match_score))}>{a.match_score}</span></td>
                        <td className="px-4 py-3 text-slate-600">{a.candidate?.years_experience}y</td>
                        <td className="px-4 py-3"><span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700">{a.stage}</span></td>
                        <td className="px-4 py-3 text-slate-600 text-xs">{a.recruiter_name}</td>
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          {can("move_stage") && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild><Button size="sm" variant="outline" data-testid={`app-actions-${a.id}`}>Move</Button></DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {["Screening", "Shortlisted", "Interview", "Technical Round", "HR Round", "Finalist", "Selected", "Rejected"].map((st) => <DropdownMenuItem key={st} onClick={() => moveStage(a.id, st)}>{st}</DropdownMenuItem>)}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Matched */}
        <TabsContent value="matched" className="mt-4">
          <Card className="border-slate-200 shadow-sm overflow-hidden">
            {!matched ? <TableSkeleton /> : matched.length === 0 ? <EmptyState icon={Target} title="No matching profiles found for this job yet." /> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-500"><tr className="text-left">{["Candidate", "ATS", "My Mentor Match", "Relevant Skills", "Missing Skills", "Match Reason", ""].map((h) => <th key={h} className="px-4 py-3 font-semibold text-xs uppercase">{h}</th>)}</tr></thead>
                  <tbody>
                    {matched.map((m) => (
                      <tr key={m.candidate.id} className="border-t border-slate-100 hover:bg-slate-50">
                        <td className="px-4 py-3"><div className="flex items-center gap-2"><Avatar className="h-8 w-8"><AvatarImage src={m.candidate.avatar_url} /><AvatarFallback className="text-xs">{m.candidate.name[0]}</AvatarFallback></Avatar><div><div className="font-medium text-[#0a2540]">{m.candidate.name}</div><div className="text-xs text-slate-400">{m.candidate.current_role}</div></div></div></td>
                        <td className="px-4 py-3"><span className={cn("rounded-full border px-2 py-0.5 text-xs font-bold", scoreColor(m.ats_score))}>{m.ats_score}</span></td>
                        <td className="px-4 py-3"><span className={cn("rounded-full border px-2 py-0.5 text-xs font-bold", scoreColor(m.match_score))}>{m.match_score}</span></td>
                        <td className="px-4 py-3"><div className="flex flex-wrap gap-1">{m.relevant_skills.slice(0, 3).map((s) => <span key={s} className="rounded bg-emerald-50 text-emerald-700 px-1.5 py-0.5 text-xs">{s}</span>)}</div></td>
                        <td className="px-4 py-3"><div className="flex flex-wrap gap-1">{m.missing_skills.slice(0, 3).map((s) => <span key={s} className="rounded bg-red-50 text-red-700 px-1.5 py-0.5 text-xs">{s}</span>)}</div></td>
                        <td className="px-4 py-3 text-xs text-slate-500 max-w-[200px]">{m.match_reason}</td>
                        <td className="px-4 py-3">{m.already_applied ? <span className="text-xs text-slate-400">Applied</span> : <span className="text-xs text-teal-600 font-medium">Sourced</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Pipeline Kanban */}
        <TabsContent value="pipeline" className="mt-4">
          {!pipeline ? <TableSkeleton /> : (
            <div className="flex gap-4 overflow-x-auto pb-4" data-testid="pipeline-board">
              {pipeline.stages.filter((st) => !["Withdrawn"].includes(st)).map((st) => (
                <div key={st} className="w-72 flex-shrink-0">
                  <div className="flex items-center justify-between mb-2 px-1"><span className="text-sm font-semibold text-[#0a2540]">{st}</span><span className="text-xs text-slate-400 bg-slate-100 rounded-full px-2 py-0.5">{pipeline.board[st]?.length || 0}</span></div>
                  <div className={cn("space-y-2 bg-slate-100/60 rounded-lg p-2 min-h-[120px] border-t-4", STAGE_COLORS[st] || "border-t-slate-300")}>
                    {(pipeline.board[st] || []).map((a) => (
                      <Card key={a.id} data-testid={`pipeline-card-${a.id}`} onClick={() => navigate(`/applications/${a.id}`)} className="border-slate-200 shadow-sm p-3 cursor-pointer hover:border-[#1e5bff]/40 transition-colors duration-150">
                        <div className="flex items-center gap-2"><Avatar className="h-7 w-7"><AvatarImage src={a.candidate?.avatar_url} /><AvatarFallback className="text-xs">{a.candidate_name?.[0]}</AvatarFallback></Avatar><span className="text-sm font-medium text-[#0a2540] truncate">{a.candidate_name}</span></div>
                        <div className="flex items-center gap-1.5 mt-2">
                          <span className={cn("rounded border px-1.5 py-0.5 text-[10px] font-bold", scoreColor(a.ats_score))}>ATS {a.ats_score}</span>
                          <span className={cn("rounded border px-1.5 py-0.5 text-[10px] font-bold", scoreColor(a.match_score))}>Match {a.match_score}</span>
                        </div>
                        <div className="text-xs text-slate-400 mt-1.5">{a.candidate?.years_experience}y · {a.relevant_skills?.[0] || a.candidate?.skills?.[0]}</div>
                        {can("move_stage") && (
                          <div onClick={(e) => e.stopPropagation()} className="mt-2">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild><button className="text-[10px] text-[#1e5bff] hover:underline">Move stage →</button></DropdownMenuTrigger>
                              <DropdownMenuContent>{pipeline.stages.filter((x) => x !== st).map((x) => <DropdownMenuItem key={x} onClick={() => moveStage(a.id, x)}>{x}</DropdownMenuItem>)}</DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Interviews */}
        <TabsContent value="interviews" className="mt-4">
          <Card className="border-slate-200 shadow-sm overflow-hidden">
            {!ivs ? <TableSkeleton /> : ivs.length === 0 ? <EmptyState icon={CalendarClock} title="No interviews scheduled for this job yet." /> : (
              <div className="overflow-x-auto"><table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500"><tr className="text-left">{["Candidate", "Type", "Interviewer", "Scheduled", "Status"].map((h) => <th key={h} className="px-4 py-3 font-semibold text-xs uppercase">{h}</th>)}</tr></thead>
                <tbody>{ivs.map((iv) => (<tr key={iv.id} className="border-t border-slate-100 hover:bg-slate-50"><td className="px-4 py-3 font-medium text-[#0a2540]">{iv.candidate_name}</td><td className="px-4 py-3 text-slate-600">{iv.interview_type}</td><td className="px-4 py-3 text-slate-600">{iv.interviewer_name}</td><td className="px-4 py-3 text-xs text-slate-500">{iv.scheduled_at ? new Date(iv.scheduled_at).toLocaleString() : "—"}</td><td className="px-4 py-3"><StatusBadge status={iv.status === "completed" ? "filled" : "active"} /></td></tr>))}</tbody>
              </table></div>
            )}
          </Card>
        </TabsContent>

        {/* Analytics */}
        <TabsContent value="analytics" className="mt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="border-slate-200 shadow-sm p-4"><div className="text-xs font-bold uppercase text-slate-500">Avg ATS Score</div><div className="text-2xl font-bold text-[#0a2540] mt-1">{s.avg_ats}</div></Card>
            <Card className="border-slate-200 shadow-sm p-4"><div className="text-xs font-bold uppercase text-slate-500">Avg Match Score</div><div className="text-2xl font-bold text-emerald-600 mt-1">{s.avg_match}</div></Card>
            <Card className="border-slate-200 shadow-sm p-4"><div className="text-xs font-bold uppercase text-slate-500">Match Rate</div><div className="text-2xl font-bold text-[#0a2540] mt-1">{s.applications ? Math.round(s.matched / s.applications * 100) : 0}%</div></Card>
            <Card className="border-slate-200 shadow-sm p-4"><div className="text-xs font-bold uppercase text-slate-500">Conversion</div><div className="text-2xl font-bold text-[#0a2540] mt-1">{s.applications ? Math.round(s.selected / s.applications * 100) : 0}%</div></Card>
          </div>
          <Card className="border-slate-200 shadow-sm p-6 mt-4 flex items-center gap-3 text-sm text-slate-600"><Sparkles className="h-5 w-5 text-[#17b6c7]" /> This job has received {s.applications} applications with {s.matched} qualified matches. Average candidate ATS score is {s.avg_ats}.</Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
