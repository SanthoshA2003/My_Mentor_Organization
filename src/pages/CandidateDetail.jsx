import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api, formatApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { EmptyState, scoreColor, scoreLabel } from "@/components/common";
import { ArrowLeft, MapPin, Mail, Phone, FileText, GitCompare, Sparkles, Activity, CheckCircle2, XCircle, ArrowRightLeft, CalendarPlus, StickyNote } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function CandidateDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { can } = useAuth();
  const [d, setD] = useState(null);
  const [users, setUsers] = useState([]);
  const [note, setNote] = useState("");
  const [schedOpen, setSchedOpen] = useState(false);
  const [sched, setSched] = useState({ interview_type: "Technical", scheduled_at: "", interviewer_id: "" });

  const load = () => api.get(`/applications/${id}`).then((r) => setD(r.data)).catch(() => setD(false));
  useEffect(() => { load(); api.get("/users").then((r) => setUsers(r.data)).catch(() => {}); }, [id]);

  const move = async (stage) => { try { await api.post(`/applications/${id}/stage`, { stage }); toast.success(`Moved to ${stage}`); load(); } catch (e) { toast.error(formatApiError(e.response?.data?.detail)); } };
  const addNote = async () => { if (!note.trim()) return; await api.post(`/applications/${id}/notes`, { text: note }); setNote(""); toast.success("Note added"); load(); };
  const schedule = async () => {
    try { await api.post("/interviews", { ...sched, application_id: id }); toast.success("Interview scheduled"); setSchedOpen(false); load(); }
    catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
  };

  if (d === false) return <EmptyState icon={FileText} title="Candidate not found" />;
  if (!d) return <div className="h-64 bg-slate-200 rounded animate-pulse" />;

  const { candidate: c, job, ats, match, comparison, ai_summary, application, timeline } = d;
  const resultStyle = { Match: "bg-emerald-50 text-emerald-700", Partial: "bg-amber-50 text-amber-700", Gap: "bg-red-50 text-red-700" };

  return (
    <div className="space-y-6">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#1e5bff] transition-colors duration-200"><ArrowLeft className="h-4 w-4" /> Back</button>

      {/* Header */}
      <Card className="border-slate-200 shadow-sm p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16"><AvatarImage src={c.avatar_url} /><AvatarFallback className="text-lg bg-[#1e5bff] text-white">{c.name[0]}</AvatarFallback></Avatar>
            <div>
              <h1 className="font-display font-extrabold text-2xl text-[#0a2540]">{c.name}</h1>
              <div className="text-sm text-slate-500">{c.current_role} · {c.years_experience} yrs experience</div>
              <div className="flex items-center gap-4 mt-1 text-xs text-slate-500 flex-wrap">
                <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {c.location}</span>
                {can("view_resume") && <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {c.email}</span>}
                {can("view_resume") && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {c.phone}</span>}
                <span>Stage: <b className="text-slate-700">{application.stage}</b></span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-3">
            <div className="flex gap-2">
              <div className={cn("rounded-lg border px-4 py-2 text-center", scoreColor(ats.total))}><div className="text-xs opacity-70">ATS Score</div><div className="text-2xl font-bold">{ats.total}</div></div>
              <div className={cn("rounded-lg border px-4 py-2 text-center", scoreColor(match.score))}><div className="text-xs opacity-70">Match Score</div><div className="text-2xl font-bold">{match.score}</div></div>
            </div>
          </div>
        </div>
        <div className="flex gap-2 mt-4 flex-wrap">
          {can("shortlist") && <Button size="sm" onClick={() => move("Shortlisted")} className="bg-[#1e5bff] hover:bg-[#154cdb]"><CheckCircle2 className="h-4 w-4 mr-1.5" /> Shortlist</Button>}
          {can("reject") && <Button size="sm" variant="outline" className="text-red-600" onClick={() => move("Rejected")}><XCircle className="h-4 w-4 mr-1.5" /> Reject</Button>}
          {can("move_stage") && (
            <Select onValueChange={move}><SelectTrigger data-testid="move-stage-select" className="w-40 h-9"><ArrowRightLeft className="h-4 w-4 mr-1" /><SelectValue placeholder="Move Stage" /></SelectTrigger>
              <SelectContent>{["Screening", "Shortlisted", "Interview", "Technical Round", "HR Round", "Finalist", "Selected"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
          )}
          {can("schedule_interview") && <Button size="sm" variant="outline" data-testid="schedule-interview-btn" onClick={() => setSchedOpen(true)}><CalendarPlus className="h-4 w-4 mr-1.5" /> Schedule Interview</Button>}
        </div>
      </Card>

      <Tabs defaultValue="scores">
        <TabsList className="bg-white border border-slate-200 flex-wrap h-auto">
          {[["scores", "Score Breakdown"], ["comparison", "JD Comparison"], ["resume", "Resume Analysis"], ["summary", "AI Summary"], ["timeline", "Timeline"]].map(([v, l]) => (
            <TabsTrigger key={v} value={v} data-testid={`ctab-${v}`} className="data-[state=active]:bg-[#1e5bff] data-[state=active]:text-white">{l}</TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="scores" className="mt-4 grid md:grid-cols-2 gap-4">
          <Card className="border-slate-200 shadow-sm p-6">
            <h3 className="font-display font-bold text-lg text-[#0a2540] mb-1">ATS Score Breakdown</h3>
            <p className="text-xs text-slate-500 mb-4">Computed from this job's ATS weight configuration.</p>
            <table className="w-full text-sm">
              <thead><tr className="text-left text-slate-500 text-xs uppercase"><th className="pb-2">Category</th><th className="pb-2 text-right">Weight</th><th className="pb-2 text-right">Score</th></tr></thead>
              <tbody>{ats.categories.map((row) => (<tr key={row.category} className="border-t border-slate-100"><td className="py-2 text-slate-700">{row.category}</td><td className="py-2 text-right text-slate-500">{row.weight}%</td><td className="py-2 text-right font-semibold text-[#0a2540]">{row.score}</td></tr>))}
                <tr className="border-t-2 border-slate-200 font-bold"><td className="py-2 text-[#0a2540]">Total</td><td className="py-2 text-right">100%</td><td className="py-2 text-right text-[#1e5bff]">{ats.total}</td></tr>
              </tbody>
            </table>
          </Card>
          <Card className="border-slate-200 shadow-sm p-6">
            <h3 className="font-display font-bold text-lg text-[#0a2540] mb-3">Two Scores Explained</h3>
            <div className="space-y-3 text-sm">
              <div className={cn("rounded-lg border p-3", scoreColor(ats.total))}><div className="font-semibold">ATS Score: {ats.total} — {scoreLabel(ats.total)}</div><p className="text-xs mt-1 opacity-80">Measures how well the candidate matches the job's <b>structured requirements</b> (skills, experience, education) using the configured weights.</p></div>
              <div className={cn("rounded-lg border p-3", scoreColor(match.score))}><div className="font-semibold">My Mentor Match: {match.score} — {scoreLabel(match.score)}</div><p className="text-xs mt-1 opacity-80">A <b>broader alignment</b> score factoring projects, learning evidence, growth and career profile — not just keyword matching.</p></div>
              <div><div className="text-xs font-bold uppercase text-slate-500 mb-1">Match Reason</div><p className="text-slate-600">{match.match_reason}</p></div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="comparison" className="mt-4">
          <Card className="border-slate-200 shadow-sm p-6" data-testid="jd-comparison">
            <h3 className="font-display font-bold text-lg text-[#0a2540] mb-4 flex items-center gap-2"><GitCompare className="h-5 w-5 text-[#1e5bff]" /> JD vs Candidate</h3>
            <table className="w-full text-sm">
              <thead><tr className="text-left text-slate-500 text-xs uppercase"><th className="pb-2">Requirement</th><th className="pb-2">Candidate Evidence</th><th className="pb-2 text-right">Result</th></tr></thead>
              <tbody>{comparison.map((row, i) => (<tr key={i} className="border-t border-slate-100"><td className="py-2.5 font-medium text-[#0a2540]">{row.requirement}</td><td className="py-2.5 text-slate-600">{row.evidence}</td><td className="py-2.5 text-right"><span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", resultStyle[row.result])}>{row.result}</span></td></tr>))}</tbody>
            </table>
          </Card>
        </TabsContent>

        <TabsContent value="resume" className="mt-4 grid md:grid-cols-2 gap-4">
          <Card className="border-slate-200 shadow-sm p-6">
            <h3 className="font-display font-bold text-lg text-[#0a2540] mb-3 flex items-center gap-2"><FileText className="h-5 w-5 text-[#1e5bff]" /> Resume</h3>
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 text-sm text-slate-600">
              <div className="font-medium text-[#0a2540] mb-2">{c.resume_filename}</div>
              <p>{c.professional_summary}</p>
            </div>
          </Card>
          <Card className="border-slate-200 shadow-sm p-6 space-y-3">
            <h3 className="font-display font-bold text-lg text-[#0a2540]">Extracted Information</h3>
            <div><div className="text-xs font-bold uppercase text-slate-500 mb-1">Skills</div><div className="flex flex-wrap gap-1.5">{c.skills.map((s) => <span key={s} className="rounded-full bg-blue-50 text-blue-700 px-2 py-0.5 text-xs">{s}</span>)}</div></div>
            <div><div className="text-xs font-bold uppercase text-slate-500 mb-1">Certifications</div><div className="flex flex-wrap gap-1.5">{c.certifications.length ? c.certifications.map((s) => <span key={s} className="rounded-full bg-emerald-50 text-emerald-700 px-2 py-0.5 text-xs">{s}</span>) : <span className="text-xs text-slate-400">None listed</span>}</div></div>
            <div><div className="text-xs font-bold uppercase text-slate-500 mb-1">Projects</div><ul className="list-disc pl-5 text-sm text-slate-600">{c.projects.map((p) => <li key={p}>{p}</li>)}</ul></div>
            <div className="text-sm text-slate-600"><b>Experience:</b> {c.years_experience} yrs · <b>Education:</b> {c.education}</div>
          </Card>
        </TabsContent>

        <TabsContent value="summary" className="mt-4">
          <Card className="border-slate-200 shadow-sm p-6" data-testid="ai-summary">
            <h3 className="font-display font-bold text-lg text-[#0a2540] mb-3 flex items-center gap-2"><Sparkles className="h-5 w-5 text-[#17b6c7]" /> AI Candidate Summary</h3>
            <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-700 mb-4">{ai_summary.overall}</div>
            <div className="grid md:grid-cols-2 gap-4">
              <div><div className="text-xs font-bold uppercase text-emerald-600 mb-1">Strengths</div><ul className="list-disc pl-5 text-sm text-slate-600 space-y-1">{ai_summary.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul></div>
              <div><div className="text-xs font-bold uppercase text-red-600 mb-1">Gaps</div><ul className="list-disc pl-5 text-sm text-slate-600 space-y-1">{ai_summary.gaps.map((s, i) => <li key={i}>{s}</li>)}</ul></div>
            </div>
            <div className={cn("mt-4 rounded-lg border p-3 font-semibold", scoreColor(ats.total))}>{ai_summary.recommendation}</div>
            <p className="text-xs text-slate-400 mt-2">This AI recommendation is decision support only and does not make hiring decisions automatically.</p>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="mt-4 grid md:grid-cols-3 gap-4">
          <Card className="border-slate-200 shadow-sm p-6 md:col-span-2">
            <h3 className="font-display font-bold text-lg text-[#0a2540] mb-4 flex items-center gap-2"><Activity className="h-5 w-5 text-[#1e5bff]" /> Activity Timeline</h3>
            <div className="space-y-3">
              {timeline.length === 0 && <p className="text-sm text-slate-400">No activity yet.</p>}
              {timeline.map((t) => (<div key={t.id} className="flex gap-3"><div className="flex flex-col items-center"><div className="h-2.5 w-2.5 rounded-full bg-[#1e5bff] mt-1.5" /><div className="w-px flex-1 bg-slate-200" /></div><div className="pb-3"><div className="text-sm text-slate-700">{t.text}</div><div className="text-xs text-slate-400">{t.actor} · {new Date(t.created_at).toLocaleString()}</div></div></div>))}
            </div>
          </Card>
          <Card className="border-slate-200 shadow-sm p-6">
            <h3 className="font-display font-bold text-base text-[#0a2540] mb-3 flex items-center gap-2"><StickyNote className="h-4 w-4" /> Notes</h3>
            {can("add_notes") && <div className="space-y-2 mb-3"><Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note..." data-testid="note-input" /><Button size="sm" data-testid="add-note-btn" onClick={addNote} className="bg-[#1e5bff] hover:bg-[#154cdb]">Add Note</Button></div>}
            <div className="space-y-2">{(application.notes || []).map((n) => (<div key={n.id} className="rounded-lg bg-slate-50 p-2 text-sm"><div className="text-slate-700">{n.text}</div><div className="text-xs text-slate-400 mt-0.5">{n.author}</div></div>))}</div>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={schedOpen} onOpenChange={setSchedOpen}>
        <DialogContent><DialogHeader><DialogTitle>Schedule Interview — {c.name}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1"><Label>Interview Type</Label><Select value={sched.interview_type} onValueChange={(v) => setSched({ ...sched, interview_type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["Technical", "HR", "Managerial", "Culture Fit"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1"><Label>Date & Time</Label><input type="datetime-local" data-testid="interview-datetime" value={sched.scheduled_at} onChange={(e) => setSched({ ...sched, scheduled_at: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" /></div>
            <div className="space-y-1"><Label>Interviewer</Label><Select value={sched.interviewer_id} onValueChange={(v) => setSched({ ...sched, interviewer_id: v })}><SelectTrigger data-testid="interviewer-select"><SelectValue placeholder="Select interviewer" /></SelectTrigger><SelectContent>{users.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}</SelectContent></Select></div>
          </div>
          <DialogFooter><Button data-testid="confirm-schedule-btn" onClick={schedule} disabled={!sched.scheduled_at || !sched.interviewer_id} className="bg-[#1e5bff] hover:bg-[#154cdb]">Schedule & Notify</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
