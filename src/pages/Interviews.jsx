import { useEffect, useState } from "react";
import { api, formatApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/card";
import { EmptyState, TableSkeleton, StatusBadge } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { CalendarClock, Star } from "lucide-react";
import { toast } from "sonner";

export default function Interviews() {
  const { can } = useAuth();
  const [ivs, setIvs] = useState(null);
  const [active, setActive] = useState(null);
  const [fb, setFb] = useState({ overall_rating: 4, technical_rating: 4, communication_rating: 4, problem_solving_rating: 4, role_suitability: "High", strengths: "", concerns: "", written_feedback: "", recommendation: "Hire" });

 const load = async () => {
  try {
    const response = await api.get("/organizations/me/interviews");

    console.log("Organization Interviews API:", response.data);

    setIvs(Array.isArray(response.data) ? response.data : []);
  } catch (error) {
    console.error("Organization Interviews API error:", error);
    console.error("Status:", error.response?.status);
    console.error("Response:", error.response?.data);

    setIvs([]);
  }
};

  useEffect(() => { load(); }, []);

  const submit = async () => {
    try { await api.post(`/interviews/${active.id}/feedback`, fb); toast.success("Feedback submitted"); setActive(null); load(); }
    catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
  };

  const Rating = ({ label, val, onChange }) => (
    <div className="flex items-center justify-between">
      <Label>{label}</Label>
      <div className="flex gap-1">{[1, 2, 3, 4, 5].map((n) => <button key={n} onClick={() => onChange(n)}><Star className={`h-5 w-5 ${n <= val ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} /></button>)}</div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-extrabold text-3xl text-[#0a2540]">Interviews</h1>
        <p className="text-slate-500 mt-1">Scheduled and completed interviews across all jobs.</p>
      </div>
      <Card className="border-slate-200 shadow-sm overflow-hidden" data-testid="interviews-table">
        {!ivs ? <TableSkeleton /> : ivs.length === 0 ? <EmptyState icon={CalendarClock} title="No interviews scheduled yet" description="Schedule interviews from a candidate's profile." /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500"><tr className="text-left">{["Candidate", "Job", "Type", "Interviewer", "Scheduled", "Status", ""].map((h) => <th key={h} className="px-4 py-3 font-semibold text-xs uppercase">{h}</th>)}</tr></thead>
            <tbody>
  {ivs.map((iv) => (
    <tr
      key={iv.id}
      className="border-t border-slate-100 hover:bg-slate-50"
    >
      {/* Candidate */}
      <td className="px-4 py-3 font-medium text-[#0a2540]">
        {iv.candidate_name || "—"}
      </td>

      {/* Job */}
      <td className="px-4 py-3 text-slate-600">
        {iv.job_title || "—"}
      </td>

      {/* Type */}
      <td className="px-4 py-3 text-slate-600">
        {iv.interview_type || "—"}
      </td>

      {/* Interviewer */}
      <td className="px-4 py-3 text-slate-600">
        {iv.interviewer_name || "—"}
      </td>

      {/* Scheduled */}
      <td className="px-4 py-3 text-slate-500 text-xs">
        {iv.scheduled_at
          ? new Date(iv.scheduled_at).toLocaleString()
          : "—"}
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <StatusBadge
          status={
            iv.status === "completed"
              ? "filled"
              : iv.status || "active"
          }
        />
      </td>

      {/* Feedback */}
      <td className="px-4 py-3">
        <Button
          size="sm"
          variant="outline"
          data-testid={`feedback-btn-${iv.id}`}
          onClick={() => {
            setActive(iv);

            if (iv.feedback) {
              setFb(iv.feedback);
            }
          }}
        >
          {iv.feedback
            ? "View Feedback"
            : "Add Feedback"}
        </Button>
      </td>
    </tr>
  ))}
</tbody>
            </table>
          </div>
        )}
      </Card>

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Interview Feedback — {active?.candidate_name}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <Rating label="Overall Rating" val={fb.overall_rating} onChange={(v) => setFb({ ...fb, overall_rating: v })} />
            <Rating label="Technical" val={fb.technical_rating} onChange={(v) => setFb({ ...fb, technical_rating: v })} />
            <Rating label="Communication" val={fb.communication_rating} onChange={(v) => setFb({ ...fb, communication_rating: v })} />
            <Rating label="Problem Solving" val={fb.problem_solving_rating} onChange={(v) => setFb({ ...fb, problem_solving_rating: v })} />
            <div className="space-y-1"><Label>Role Suitability</Label><Select value={fb.role_suitability} onValueChange={(v) => setFb({ ...fb, role_suitability: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["High", "Medium", "Low"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1"><Label>Strengths</Label><Textarea rows={2} value={fb.strengths} onChange={(e) => setFb({ ...fb, strengths: e.target.value })} /></div>
            <div className="space-y-1"><Label>Concerns</Label><Textarea rows={2} value={fb.concerns} onChange={(e) => setFb({ ...fb, concerns: e.target.value })} /></div>
            <div className="space-y-1"><Label>Written Feedback</Label><Textarea rows={3} value={fb.written_feedback} onChange={(e) => setFb({ ...fb, written_feedback: e.target.value })} /></div>
            <div className="space-y-1"><Label>Recommendation</Label><Select value={fb.recommendation} onValueChange={(v) => setFb({ ...fb, recommendation: v })}><SelectTrigger data-testid="recommendation-select"><SelectValue /></SelectTrigger><SelectContent>{["Strong Hire", "Hire", "Hold", "No Hire"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
          </div>
          <DialogFooter><Button data-testid="submit-feedback-btn" onClick={submit} className="bg-[#1e5bff] hover:bg-[#154cdb]">Submit Feedback</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
