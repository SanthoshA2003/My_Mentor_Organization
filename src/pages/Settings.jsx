import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api, formatApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Check, X, Building2, User, Shield, Bell, Workflow, SlidersHorizontal, Plug } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const ATS_KEYS = [["skills", "Skills"], ["experience", "Experience"], ["education", "Education"], ["role_relevance", "Role Relevance"], ["screening", "Screening"], ["certifications", "Certifications"]];
const MATRIX = [
  ["View Jobs", { org_admin: "✓", recruiter: "✓", hiring_manager: "✓", interviewer: "Limited" }],
  ["Create Jobs", { org_admin: "✓", recruiter: "✓", hiring_manager: "✕", interviewer: "✕" }],
  ["View Candidates", { org_admin: "✓", recruiter: "✓", hiring_manager: "✓", interviewer: "Assigned" }],
  ["Shortlist", { org_admin: "✓", recruiter: "✓", hiring_manager: "✓", interviewer: "✕" }],
  ["Manage Users", { org_admin: "✓", recruiter: "✕", hiring_manager: "✕", interviewer: "✕" }],
  ["Reports", { org_admin: "✓", recruiter: "✓", hiring_manager: "✓", interviewer: "✕" }],
  ["Settings", { org_admin: "✓", recruiter: "✕", hiring_manager: "✕", interviewer: "✕" }],
];

function Cell({ v }) {
  if (v === "✓") return <Check className="h-4 w-4 text-emerald-600 mx-auto" />;
  if (v === "✕") return <X className="h-4 w-4 text-red-400 mx-auto" />;
  return <span className="text-xs text-amber-600">{v}</span>;
}

export default function Settings() {
  const { user, org, setOrg, can } = useAuth();
  const [params] = useSearchParams();
  const [tab, setTab] = useState(params.get("tab") || "organization");
  const [settings, setSettings] = useState(null);
  const [orgForm, setOrgForm] = useState({});
  const [ats, setAts] = useState(null);
  const [acct, setAcct] = useState({ first_name: user?.first_name || "", last_name: user?.last_name || "", phone: user?.phone || "" });
  const editable = can("edit_settings");

  useEffect(() => {
    api.get("/settings").then((r) => { setSettings(r.data.settings); setOrgForm(r.data.organization || {}); setAts(r.data.settings?.default_ats_config); }).catch(() => {});
  }, []);

  const saveOrg = async () => { try { const { data } = await api.put("/settings/organization", orgForm); setOrg(data); toast.success("Organization profile saved"); } catch (e) { toast.error(formatApiError(e.response?.data?.detail)); } };
  const saveAts = async () => { try { await api.put("/settings/ats", ats); toast.success("Default ATS config saved"); } catch (e) { toast.error(formatApiError(e.response?.data?.detail)); } };
  const saveAcct = async () => { try { await api.put("/account", acct); toast.success("Account updated"); } catch (e) { toast.error(formatApiError(e.response?.data?.detail)); } };
  const atsTotal = ats ? Object.values(ats).reduce((a, b) => a + b, 0) : 0;

  return (
    <div className="space-y-6">
      <div><h1 className="font-display font-extrabold text-3xl text-[#0a2540]">Settings</h1><p className="text-slate-500 mt-1">Manage your organization, account, roles and portal configuration.</p></div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-white border border-slate-200 flex-wrap h-auto">
          {[["organization", "Organization", Building2], ["account", "My Account", User], ["roles", "Users & Roles", Shield], ["pipeline", "Pipeline", Workflow], ["ats", "ATS", SlidersHorizontal], ["notifications", "Notifications", Bell], ["security", "Security", Shield], ["integrations", "Integrations", Plug]].map(([v, l, Icon]) => (
            <TabsTrigger key={v} value={v} data-testid={`stab-${v}`} className="data-[state=active]:bg-[#1e5bff] data-[state=active]:text-white text-xs"><Icon className="h-4 w-4 mr-1.5" /> {l}</TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="organization" className="mt-4">
          <Card className="border-slate-200 shadow-sm p-6 max-w-2xl space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1 col-span-2"><Label>Organization Name</Label><Input data-testid="org-name-input" disabled={!editable} value={orgForm.name || ""} onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })} /></div>
              <div className="space-y-1"><Label>Website</Label><Input disabled={!editable} value={orgForm.website || ""} onChange={(e) => setOrgForm({ ...orgForm, website: e.target.value })} /></div>
              <div className="space-y-1"><Label>Industry</Label><Input disabled={!editable} value={orgForm.industry || ""} onChange={(e) => setOrgForm({ ...orgForm, industry: e.target.value })} /></div>
              <div className="space-y-1"><Label>Company Size</Label><Input disabled={!editable} value={orgForm.company_size || ""} onChange={(e) => setOrgForm({ ...orgForm, company_size: e.target.value })} /></div>
              <div className="space-y-1"><Label>Contact Email</Label><Input disabled={!editable} value={orgForm.contact_email || ""} onChange={(e) => setOrgForm({ ...orgForm, contact_email: e.target.value })} /></div>
              <div className="space-y-1"><Label>Contact Phone</Label><Input disabled={!editable} value={orgForm.contact_phone || ""} onChange={(e) => setOrgForm({ ...orgForm, contact_phone: e.target.value })} /></div>
              <div className="space-y-1"><Label>Address</Label><Input disabled={!editable} value={orgForm.address || ""} onChange={(e) => setOrgForm({ ...orgForm, address: e.target.value })} /></div>
              <div className="space-y-1 col-span-2"><Label>Description</Label><Textarea disabled={!editable} rows={3} value={orgForm.description || ""} onChange={(e) => setOrgForm({ ...orgForm, description: e.target.value })} /></div>
            </div>
            {editable && <Button data-testid="save-org-btn" onClick={saveOrg} className="bg-[#1e5bff] hover:bg-[#154cdb]">Save Changes</Button>}
          </Card>
        </TabsContent>

        <TabsContent value="account" className="mt-4">
          <Card className="border-slate-200 shadow-sm p-6 max-w-xl space-y-4">
            <div className="flex items-center gap-4"><Avatar className="h-16 w-16"><AvatarImage src={user?.avatar_url} /><AvatarFallback className="bg-[#1e5bff] text-white text-lg">{user?.name?.[0]}</AvatarFallback></Avatar><div><div className="font-semibold text-[#0a2540]">{user?.name}</div><div className="text-sm text-slate-500">{user?.email}</div></div></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1"><Label>First Name</Label><Input value={acct.first_name} onChange={(e) => setAcct({ ...acct, first_name: e.target.value })} /></div>
              <div className="space-y-1"><Label>Last Name</Label><Input value={acct.last_name} onChange={(e) => setAcct({ ...acct, last_name: e.target.value })} /></div>
              <div className="space-y-1 col-span-2"><Label>Phone</Label><Input value={acct.phone} onChange={(e) => setAcct({ ...acct, phone: e.target.value })} /></div>
            </div>
            <div className="flex gap-2"><Button data-testid="save-account-btn" onClick={saveAcct} className="bg-[#1e5bff] hover:bg-[#154cdb]">Save</Button><Button variant="outline" onClick={() => toast.info("Password reset link sent to your email (simulated)")}>Change Password</Button></div>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="mt-4">
          <Card className="border-slate-200 shadow-sm p-6 overflow-x-auto">
            <h3 className="font-display font-bold text-lg text-[#0a2540] mb-4">Permission Matrix</h3>
            <table className="w-full text-sm min-w-[560px]">
              <thead><tr className="text-slate-500 text-xs uppercase"><th className="text-left pb-2">Permission</th><th className="pb-2">Admin</th><th className="pb-2">Recruiter</th><th className="pb-2">Hiring Manager</th><th className="pb-2">Interviewer</th></tr></thead>
              <tbody>{MATRIX.map(([perm, roles]) => (<tr key={perm} className="border-t border-slate-100"><td className="py-2.5 font-medium text-[#0a2540]">{perm}</td><td className="text-center"><Cell v={roles.org_admin} /></td><td className="text-center"><Cell v={roles.recruiter} /></td><td className="text-center"><Cell v={roles.hiring_manager} /></td><td className="text-center"><Cell v={roles.interviewer} /></td></tr>))}</tbody>
            </table>
            <p className="text-xs text-slate-400 mt-4">The permission system is designed to support additional custom roles in future.</p>
          </Card>
        </TabsContent>

        <TabsContent value="pipeline" className="mt-4">
          <Card className="border-slate-200 shadow-sm p-6 max-w-xl">
            <h3 className="font-display font-bold text-lg text-[#0a2540] mb-1">Recruitment Pipeline Stages</h3>
            <p className="text-xs text-slate-500 mb-4">These stages define the candidate journey. Custom stages coming soon.</p>
            <div className="flex flex-wrap gap-2">{(settings?.pipeline_stages || []).map((s) => <span key={s} className="rounded-full bg-slate-100 px-3 py-1.5 text-sm text-slate-700">{s}</span>)}</div>
          </Card>
        </TabsContent>

        <TabsContent value="ats" className="mt-4">
          <Card className="border-slate-200 shadow-sm p-6 max-w-xl space-y-5">
            <h3 className="font-display font-bold text-lg text-[#0a2540]">Default ATS Configuration</h3>
            {ats && ATS_KEYS.map(([k, l]) => (<div key={k}><div className="flex justify-between mb-1"><Label>{l}</Label><span className="text-sm font-semibold text-[#1e5bff]">{ats[k]}%</span></div><Slider disabled={!editable} value={[ats[k]]} max={60} step={5} onValueChange={([v]) => setAts({ ...ats, [k]: v })} /></div>))}
            <div className={cn("rounded-lg p-3 flex justify-between", atsTotal === 100 ? "bg-emerald-50" : "bg-red-50")}><span className="font-semibold text-[#0a2540]">Total</span><span data-testid="settings-ats-total" className={cn("font-bold", atsTotal === 100 ? "text-emerald-600" : "text-red-600")}>{atsTotal}%</span></div>
            {editable && <Button data-testid="save-ats-btn" onClick={saveAts} disabled={atsTotal !== 100} className="bg-[#1e5bff] hover:bg-[#154cdb]">Save ATS Config</Button>}
            <p className="text-xs text-slate-400">Jobs can override these defaults during creation. Total must equal 100%.</p>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-4">
          <Card className="border-slate-200 shadow-sm p-6 max-w-xl space-y-3">
            <h3 className="font-display font-bold text-lg text-[#0a2540]">Email Notifications</h3>
            {["New application", "Candidate shortlisted", "Interview scheduled", "Interview reminder", "Interview feedback", "Candidate selected", "Job published", "New user invitation"].map((n) => (
              <div key={n} className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0"><span className="text-sm text-slate-700">{n}</span><Switch defaultChecked disabled={!editable} /></div>
            ))}
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-4">
          <Card className="border-slate-200 shadow-sm p-6 max-w-xl space-y-4">
            <h3 className="font-display font-bold text-lg text-[#0a2540]">Security</h3>
            <div className="flex items-center justify-between"><div><div className="text-sm font-medium text-slate-700">Password Policy</div><div className="text-xs text-slate-500">{settings?.security?.password_policy}</div></div></div>
            <div className="flex items-center justify-between"><div><div className="text-sm font-medium text-slate-700">Session Timeout</div><div className="text-xs text-slate-500">{settings?.security?.session_timeout_minutes} minutes</div></div></div>
            <div className="flex items-center justify-between"><div><div className="text-sm font-medium text-slate-700">Two-Factor Authentication</div><div className="text-xs text-slate-500">Add an extra layer of security</div></div><Switch disabled={!editable} /></div>
            <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-500">Login history and active sessions are tracked in the Audit Log.</div>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="mt-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {["Email", "Calendar", "HRMS", "External ATS", "Job Boards", "Webhooks", "API"].map((i) => (
              <Card key={i} className="border-slate-200 shadow-sm p-5 flex items-center justify-between"><div className="flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center"><Plug className="h-5 w-5 text-slate-500" /></div><span className="font-medium text-[#0a2540]">{i}</span></div><span className="text-xs text-slate-400">Coming soon</span></Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
