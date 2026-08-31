  import { useEffect, useState } from "react";
  import { useNavigate } from "react-router-dom";
  import { api } from "@/lib/api";
  import { useAuth } from "@/context/AuthContext";
  import { StatusBadge, EmptyState, TableSkeleton, KPICard } from "@/components/common";
  import { Card } from "@/components/ui/card";
  import { Input } from "@/components/ui/input";
  import { Button } from "@/components/ui/button";
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
  import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
  import { Plus, MoreHorizontal, Search, Briefcase, Layers, PlayCircle, PauseCircle, XCircle, CheckCircle2 } from "lucide-react";
  import { toast } from "sonner";

  export default function Jobs() {
    const { can } = useAuth();
    const navigate = useNavigate();
    const [jobs, setJobs] = useState(null);
    const [q, setQ] = useState("");
    const [statusF, setStatusF] = useState("all");
    const [deptF, setDeptF] = useState("all");

  const load = () =>
    api
      .get("/organizations/me/jobs")
      .then((r) => {
        console.log("Organization Jobs API:", r.data);
        setJobs(Array.isArray(r.data) ? r.data : []);
      })
      .catch((error) => {
        console.error("Organization Jobs API error:", error);
        console.error("Status:", error.response?.status);
        console.error("Response:", error.response?.data);
        setJobs([]);
      });
      
      useEffect(() => { load(); }, []);

    const changeStatus = async (job, status) => {
      await api.post(`/jobs/${job.id}/status`, { status });
      toast.success(`Job ${status}`); load();
    };
    const duplicate = async (job) => { await api.post(`/jobs/${job.id}/duplicate`); toast.success("Job duplicated as draft"); load(); };

    const depts = [...new Set((jobs || []).map((j) => j.department).filter(Boolean))];
    const filtered = (jobs || []).filter((j) =>
      `${j.title} ${j.department} ${j.location}`.toLowerCase().includes(q.toLowerCase()) &&
      (statusF === "all" || j.status === statusF) &&
      (deptF === "all" || j.department === deptF)
    );

    const counts = (jobs || []).reduce((a, j) => { a[j.status] = (a[j.status] || 0) + 1; return a; }, {});

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display font-extrabold text-3xl text-[#0a2540]">Jobs</h1>
            <p className="text-slate-500 mt-1">Create and manage job descriptions and their recruitment pipelines.</p>
          </div>
<Button
  data-testid="new-job-btn"
  onClick={() => navigate("/jobs/new")}
  className="bg-[#1e5bff] hover:bg-[#154cdb] transition-colors duration-200"
>
  <Plus className="h-4 w-4 mr-2" />
  New Job Description
</Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <KPICard testId="job-kpi-total" label="Total Jobs" value={jobs?.length || 0} icon={Briefcase} />
          <KPICard testId="job-kpi-draft" label="Draft" value={counts.draft || 0} icon={Layers} accent="text-slate-500" />
  <KPICard
    testId="job-kpi-active"
    label="Active"
    value={(counts.active || 0) + (counts.open || 0)}
    icon={PlayCircle}
    accent="text-emerald-500"
  />
          <KPICard testId="job-kpi-paused" label="Paused" value={counts.paused || 0} icon={PauseCircle} accent="text-amber-500" />
          <KPICard testId="job-kpi-closed" label="Closed" value={counts.closed || 0} icon={XCircle} accent="text-slate-500" />
          <KPICard testId="job-kpi-filled" label="Filled" value={counts.filled || 0} icon={CheckCircle2} accent="text-[#1e5bff]" />
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input data-testid="jobs-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search jobs..." className="pl-9" />
          </div>
          <Select value={statusF} onValueChange={setStatusF}>
    <SelectTrigger
      data-testid="jobs-status-filter"
      className="w-36"
    >
      <SelectValue placeholder="Status" />
    </SelectTrigger>

    <SelectContent>
      {["all", "open", "closed"].map((s) => (
        <SelectItem
          key={s}
          value={s}
          className="capitalize"
        >
          {s === "all"
            ? "All Status"
            : s === "open"
            ? "Open"
            : "Closed"}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
          <Select value={deptF} onValueChange={setDeptF}><SelectTrigger data-testid="jobs-dept-filter" className="w-40"><SelectValue placeholder="Department" /></SelectTrigger>
            <SelectContent><SelectItem value="all">All Departments</SelectItem>{depts.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
          </Select>
        </div>

        <Card className="border-slate-200 shadow-sm overflow-hidden" data-testid="jobs-table">
          {!jobs ? <TableSkeleton /> : filtered.length === 0 ? (
            <EmptyState icon={Briefcase} title="You haven't created any jobs yet." description="Create your first job description to begin sourcing and matching candidates."
              action={can("create_job") && <Button data-testid="create-first-job-btn" onClick={() => navigate("/jobs/new")} className="bg-[#1e5bff] hover:bg-[#154cdb]"><Plus className="h-4 w-4 mr-2" /> Create Your First Job</Button>} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
  <thead className="bg-slate-50 text-slate-500">
    <tr className="text-left">
      {[
        "Job ID",
        "Title",
        "Dept",
        "Location",
        "Type",
        "Exp",
        "Apps",
        "Matched",
        "Shortlist",
        "Interviews",
        "Selected",
        "Status",
        "",
      ].map((h) => (
        <th
          key={h}
          className="px-3 py-3 font-semibold text-xs uppercase whitespace-nowrap"
        >
          {h}
        </th>
      ))}
    </tr>
  </thead>

              <tbody>
    {filtered.map((j) => (
      <tr
        key={j.id}
        className="border-t border-slate-100 hover:bg-slate-50 transition-colors duration-150 cursor-pointer"
        onClick={() => navigate(`/jobs/${j.id}`)}
      >

        {/* Job ID
            Not available currently.
            When API adds job_code, it will automatically show.
        */}
        <td className="px-3 py-3 text-slate-500 whitespace-nowrap">
          {j.job_code || "—"}
        </td>


        {/* Title */}
        <td className="px-3 py-3 font-medium text-[#0a2540] whitespace-nowrap">
          {j.title || "—"}
        </td>


        {/* Department
            Not available currently.
        */}
        <td className="px-3 py-3 text-slate-600">
          {j.department || "—"}
        </td>


        {/* Location */}
        <td className="px-3 py-3 text-slate-600">
          {j.location || "—"}
        </td>


        {/* Type
            Current API: job_type
            Future API can still use employment_type if needed.
        */}
        <td className="px-3 py-3 text-slate-600 whitespace-nowrap">
          {j.job_type || j.employment_type || "—"}
        </td>


        {/* Experience
            Current API: experience
            Future API may provide min/max experience.
        */}
      {/* EXPERIENCE */}
  <td className="px-3 py-3 text-slate-600 whitespace-nowrap">
    {j.experience
      ? j.experience
      : j.min_experience != null && j.max_experience != null
      ? `${j.min_experience}-${j.max_experience}y`
      : "—"}
  </td>


        {/* Applications
            Current API: applicants
            Future API: stats.applications
        */}
        <td className="px-3 py-3">
          {j.stats?.applications ?? j.applicants ?? "—"}
        </td>


        {/* Matched
            Not available currently.
        */}
        <td className="px-3 py-3">
          {j.stats?.matched ?? "—"}
        </td>


        {/* Shortlist
            Not available currently.
        */}
        <td className="px-3 py-3">
          {j.stats?.shortlisted ?? "—"}
        </td>


        {/* Interviews
            Not available currently.
        */}
        <td className="px-3 py-3">
          {j.stats?.interviews ?? "—"}
        </td>


        {/* Selected
            Not available currently.
        */}
        <td className="px-3 py-3">
          {j.stats?.selected ?? "—"}
        </td>


        {/* Status */}
        <td className="px-3 py-3">
          <StatusBadge
            status={j.status || "—"}
          />
        </td>


        {/* Actions */}
        <td
          className="px-3 py-3"
          onClick={(e) => e.stopPropagation()}
        >
          <DropdownMenu>

            <DropdownMenuTrigger asChild>
              <button
                type="button"
                data-testid={`job-actions-${j.id}`}
                className="h-8 w-8 rounded flex items-center justify-center hover:bg-slate-100"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>


          <DropdownMenuContent align="end">

    {/* View */}
    <DropdownMenuItem
      onClick={() =>
        navigate(`/jobs/${j.id}`)
      }
    >
      View
    </DropdownMenuItem>


    {/* Edit */}
    <DropdownMenuItem
      onClick={() =>
        navigate(`/jobs/${j.id}/edit`)
      }
    >
      Edit
    </DropdownMenuItem>


    {/* Duplicate */}
    <DropdownMenuItem
      onClick={() => duplicate(j)}
    >
      Duplicate
    </DropdownMenuItem>


  </DropdownMenuContent>
          </DropdownMenu>
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
