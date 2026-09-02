import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, formatApiError } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { Check, ChevronLeft, ChevronRight, Plus, X, Save } from "lucide-react";
import { toast } from "sonner";
import { ScoreBadge } from "@/components/common";

const STEPS = ["Basic Information", "Job Description", "Requirements", "Screening Questions", "ATS Configuration", "Review & Publish"];
const ATS_KEYS = [["skills", "Skills"], ["experience", "Experience"], ["education", "Education"], ["role_relevance", "Role Relevance"], ["screening", "Screening Questions"], ["certifications", "Certifications"]];

function TagInput({ value, onChange, placeholder, testId }) {
  const [input, setInput] = useState("");
  const add = () => { if (input.trim()) { onChange([...value, input.trim()]); setInput(""); } };
  return (
    <div>
      <div className="flex gap-2">
        <Input data-testid={testId} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())} placeholder={placeholder} />
        <Button type="button" variant="outline" onClick={add}><Plus className="h-4 w-4" /></Button>
      </div>
      <div className="flex flex-wrap gap-2 mt-2">
        {value.map((t, i) => (
          <span key={i} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700">
            {t}<button type="button" onClick={() => onChange(value.filter((_, x) => x !== i))}><X className="h-3 w-3" /></button>
          </span>
        ))}
      </div>
    </div>
  );
}

export default function JobWizard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [users, setUsers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "", department: "", job_type: "Individual Contributor", employment_type: "Full-time", location: "", work_mode: "On-site",
    min_experience: 2, max_experience: 6, openings: 1, salary_min: 800000, salary_max: 1800000, recruiter_id: "", recruiter_name: "", hiring_manager_id: "", hiring_manager_name: "",
    summary: "", responsibilities: [], required_skills: [], preferred_skills: [], education: "bachelors",
    mandatory_requirements: [], preferred_requirements: [], screening_questions: [],
    ats_config: { skills: 30, experience: 20, education: 15, role_relevance: 20, screening: 10, certifications: 5 },
    status: "draft",
  });

  useEffect(() => {
    api.get("/users").then((r) => setUsers(r.data)).catch(() => {});
    if (id) api.get(`/organizations/me/jobs/${id}`).then((r) => setForm((f) => ({ ...f, ...r.data }))).catch(() => {});
  }, [id]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const atsTotal = Object.values(form.ats_config).reduce((a, b) => a + b, 0);

  const save = async (status) => {
  setSaving(true);

  const payload = {
    title: form.title,
    department: form.department,
    location: form.location,

    // API expects job_type, not employment_type
    job_type: form.employment_type,

    work_mode: form.work_mode,

    min_experience: Number(form.min_experience),
    max_experience: Number(form.max_experience),
    openings: Number(form.openings),

    salary_min: Number(form.salary_min),
    salary_max: Number(form.salary_max),

    recruiter_id: form.recruiter_id || null,
    hiring_manager_id: form.hiring_manager_id || null,

    summary: form.summary,
    description: form.description || form.summary || "",

    responsibilities: form.responsibilities,
    required_skills: form.required_skills,
    preferred_skills: form.preferred_skills,

    education: form.education,

    mandatory_requirements: form.mandatory_requirements,
    preferred_requirements: form.preferred_requirements,

    // Convert wizard questions to API format
    screening_questions: form.screening_questions.map((q) => ({
      question: q.text,
      question_type: q.type,
      required: q.mandatory,
      options: q.options || [],
    })),

    // API expects ats_configuration
    ats_configuration: {
      skills: form.ats_config.skills,
      experience: form.ats_config.experience,
      education: form.ats_config.education,
      role_relevance: form.ats_config.role_relevance,
      screening_questions: form.ats_config.screening,
      certifications: form.ats_config.certifications,
    },

    apply_email: form.apply_email || "",
    status,
  };

  try {
    if (id) {
      await api.put(`/jobs/${id}`, payload);
      toast.success("Job updated successfully");
    } else {
      await api.post("/organizations/me/jobs", payload);
      toast.success(
        status === "open"
          ? "Job published successfully!"
          : "Draft saved successfully"
      );
    }

    navigate("/jobs");
  } catch (e) {
    console.error("Job save error:", e);
    console.error("Response:", e.response?.data);

    toast.error(
      e.response?.data?.detail ||
        formatApiError(e.response?.data?.detail) ||
        "Failed to save job."
    );
  } finally {
    setSaving(false);
  }
};

  const addQuestion = () => set("screening_questions", [...form.screening_questions, { id: crypto.randomUUID(), type: "yes_no", text: "", mandatory: true }]);
  const updateQ = (i, k, v) => { const q = [...form.screening_questions]; q[i][k] = v; set("screening_questions", q); };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-[#0a2540]">{id ? "Edit Job Description" : "New Job Description"}</h1>
          <p className="text-slate-500 text-sm mt-0.5">Step {step + 1} of {STEPS.length}: {STEPS[step]}</p>
        </div>
        <Button variant="outline" data-testid="save-draft-btn" onClick={() => save("draft")} disabled={saving}><Save className="h-4 w-4 mr-2" /> Save Draft</Button>
      </div>

      {/* Progress */}
      <div className="flex items-center">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center flex-1 last:flex-none">
            <button onClick={() => setStep(i)} className="flex items-center gap-2 shrink-0">
              <div className={cn("h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors duration-200", i < step ? "bg-emerald-500 text-white" : i === step ? "bg-[#1e5bff] text-white" : "bg-slate-200 text-slate-500")}>
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span className={cn("text-xs font-medium hidden md:block", i === step ? "text-[#0a2540]" : "text-slate-400")}>{s}</span>
            </button>
            {i < STEPS.length - 1 && <div className={cn("h-0.5 flex-1 mx-2", i < step ? "bg-emerald-500" : "bg-slate-200")} />}
          </div>
        ))}
      </div>

      <Card className="border-slate-200 shadow-sm p-6" data-testid="wizard-card">
        {step === 0 && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1 col-span-2"><Label>Job Title</Label><Input data-testid="job-title-input" value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Senior Frontend Engineer" /></div>
            <div className="space-y-1"><Label>Department</Label><Input data-testid="job-dept-input" value={form.department} onChange={(e) => set("department", e.target.value)} /></div>
            <div className="space-y-1"><Label>Employment Type</Label>
              <Select value={form.employment_type} onValueChange={(v) => set("employment_type", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["Full-time", "Part-time", "Contract", "Internship"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
            </div>
            <div className="space-y-1"><Label>Location</Label><Input value={form.location} onChange={(e) => set("location", e.target.value)} /></div>
            <div className="space-y-1"><Label>Work Mode</Label>
              <Select value={form.work_mode} onValueChange={(v) => set("work_mode", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["On-site", "Hybrid", "Remote"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
            </div>
            <div className="space-y-1"><Label>Min Experience (yrs)</Label><Input type="number" value={form.min_experience} onChange={(e) => set("min_experience", +e.target.value)} /></div>
            <div className="space-y-1"><Label>Max Experience (yrs)</Label><Input type="number" value={form.max_experience} onChange={(e) => set("max_experience", +e.target.value)} /></div>
            <div className="space-y-1"><Label>Number of Openings</Label><Input type="number" value={form.openings} onChange={(e) => set("openings", +e.target.value)} /></div>
            <div className="space-y-1"><Label>Salary Min</Label><Input type="number" value={form.salary_min} onChange={(e) => set("salary_min", +e.target.value)} /></div>
            <div className="space-y-1"><Label>Salary Max</Label><Input type="number" value={form.salary_max} onChange={(e) => set("salary_max", +e.target.value)} /></div>
            <div className="space-y-1"><Label>Recruiter</Label>
              <Select value={form.recruiter_id} onValueChange={(v) => { const u = users.find((x) => x.id === v); set("recruiter_id", v); set("recruiter_name", u?.name || ""); }}>
                <SelectTrigger data-testid="job-recruiter-select"><SelectValue placeholder="Assign recruiter" /></SelectTrigger>
                <SelectContent>{users.filter((u) => ["recruiter", "hr_admin"].includes(u.role)).map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Hiring Manager</Label>
              <Select value={form.hiring_manager_id} onValueChange={(v) => { const u = users.find((x) => x.id === v); set("hiring_manager_id", v); set("hiring_manager_name", u?.name || ""); }}>
                <SelectTrigger><SelectValue placeholder="Assign manager" /></SelectTrigger>
                <SelectContent>{users.filter((u) => ["hiring_manager", "org_admin"].includes(u.role)).map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-1"><Label>Job Summary</Label><Textarea data-testid="job-summary-input" rows={4} value={form.summary} onChange={(e) => set("summary", e.target.value)} placeholder="Describe the role..." /></div>
            <div className="space-y-1"><Label>Responsibilities</Label><TagInput testId="responsibility-input" value={form.responsibilities} onChange={(v) => set("responsibilities", v)} placeholder="Add a responsibility & press Enter" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1"><Label>Required Skills</Label><TagInput testId="required-skill-input" value={form.required_skills} onChange={(v) => set("required_skills", v)} placeholder="e.g. React" /></div>
              <div className="space-y-1"><Label>Preferred Skills</Label><TagInput testId="preferred-skill-input" value={form.preferred_skills} onChange={(v) => set("preferred_skills", v)} placeholder="e.g. GraphQL" /></div>
            </div>
            <div className="space-y-1 max-w-xs"><Label>Education</Label>
              <Select value={form.education} onValueChange={(v) => set("education", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{[["high_school", "High School"], ["diploma", "Diploma"], ["bachelors", "Bachelors"], ["masters", "Masters"], ["phd", "PhD"]].map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1"><Label className="text-[#0a2540] font-semibold">Mandatory Requirements</Label><p className="text-xs text-slate-500 mb-1">Used for ATS scoring</p><TagInput testId="mandatory-req-input" value={form.mandatory_requirements} onChange={(v) => set("mandatory_requirements", v)} placeholder="Add requirement" /></div>
            <div className="space-y-1"><Label className="text-[#0a2540] font-semibold">Preferred Requirements</Label><p className="text-xs text-slate-500 mb-1">Nice to have</p><TagInput testId="preferred-req-input" value={form.preferred_requirements} onChange={(v) => set("preferred_requirements", v)} placeholder="Add requirement" /></div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between"><Label className="text-[#0a2540] font-semibold">Screening Questions</Label><Button type="button" variant="outline" size="sm" data-testid="add-question-btn" onClick={addQuestion}><Plus className="h-4 w-4 mr-1" /> Add Question</Button></div>
            {form.screening_questions.length === 0 && <p className="text-sm text-slate-400">No screening questions added.</p>}
            {form.screening_questions.map((q, i) => (
              <div key={q.id} className="rounded-lg border border-slate-200 p-3 space-y-2">
                <div className="flex gap-2">
                  <Input value={q.text} onChange={(e) => updateQ(i, "text", e.target.value)} placeholder="Question text" className="flex-1" />
                  <Select value={q.type} onValueChange={(v) => updateQ(i, "type", v)}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent>{[["yes_no", "Yes/No"], ["multiple_choice", "Multiple Choice"], ["short_answer", "Short Answer"], ["number", "Number"], ["experience", "Experience"]].map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select>
                  <button onClick={() => set("screening_questions", form.screening_questions.filter((_, x) => x !== i))}><X className="h-4 w-4 text-slate-400" /></button>
                </div>
                <label className="flex items-center gap-2 text-xs text-slate-600"><input type="checkbox" checked={q.mandatory} onChange={(e) => updateQ(i, "mandatory", e.target.checked)} /> Mandatory</label>
              </div>
            ))}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-5">
            <p className="text-sm text-slate-500">Configure how candidates are scored. Weights must total 100%.</p>
            {ATS_KEYS.map(([key, label]) => (
              <div key={key}>
                <div className="flex items-center justify-between mb-1"><Label>{label}</Label><span className="text-sm font-semibold text-[#1e5bff]">{form.ats_config[key]}%</span></div>
                <Slider value={[form.ats_config[key]]} max={60} step={5} onValueChange={([v]) => set("ats_config", { ...form.ats_config, [key]: v })} />
              </div>
            ))}
            <div className={cn("rounded-lg p-4 flex items-center justify-between", atsTotal === 100 ? "bg-emerald-50 border border-emerald-200" : "bg-red-50 border border-red-200")}>
              <span className="font-semibold text-[#0a2540]">Total Weight</span>
              <span data-testid="ats-total" className={cn("text-xl font-bold", atsTotal === 100 ? "text-emerald-600" : "text-red-600")}>{atsTotal}%</span>
            </div>
            {atsTotal !== 100 && <p className="text-xs text-red-600">Total must equal 100% before publishing.</p>}
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4" data-testid="review-section">
            <h3 className="font-display font-bold text-lg text-[#0a2540]">{form.title || "Untitled"}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              {[["Department", form.department], ["Location", form.location], ["Work Mode", form.work_mode], ["Type", form.employment_type], ["Experience", `${form.min_experience}-${form.max_experience} yrs`], ["Openings", form.openings]].map(([l, v]) => (
                <div key={l} className="rounded-lg bg-slate-50 p-3"><div className="text-xs text-slate-500">{l}</div><div className="font-medium text-[#0a2540]">{v || "—"}</div></div>
              ))}
            </div>
            <div><div className="text-xs font-bold uppercase text-slate-500 mb-1">Summary</div><p className="text-sm text-slate-600">{form.summary || "—"}</p></div>
            <div><div className="text-xs font-bold uppercase text-slate-500 mb-1">Required Skills</div><div className="flex flex-wrap gap-1.5">{form.required_skills.map((s) => <span key={s} className="rounded-full bg-blue-50 text-blue-700 px-2 py-0.5 text-xs">{s}</span>)}</div></div>
            <div><div className="text-xs font-bold uppercase text-slate-500 mb-1">ATS Configuration</div><div className="flex flex-wrap gap-2">{ATS_KEYS.map(([k, l]) => <span key={k} className="text-xs text-slate-600">{l}: <b>{form.ats_config[k]}%</b></span>)}</div></div>
            {atsTotal !== 100 && <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-700">ATS weights total {atsTotal}%. Adjust to 100% to publish.</div>}
          </div>
        )}

        <div className="flex items-center justify-between mt-8 pt-4 border-t border-slate-100">
          <Button variant="outline" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}><ChevronLeft className="h-4 w-4 mr-1" /> Back</Button>
          {step < STEPS.length - 1 ? (
            <Button data-testid="wizard-next" className="bg-[#1e5bff] hover:bg-[#154cdb]" onClick={() => setStep((s) => s + 1)}>Next <ChevronRight className="h-4 w-4 ml-1" /></Button>
          ) : (
            <Button data-testid="publish-job-btn" className="bg-emerald-500 hover:bg-emerald-600" disabled={saving || atsTotal !== 100} onClick={() => save("active")}>Publish Job</Button>
          )}
        </div>
      </Card>
    </div>
  );
}
