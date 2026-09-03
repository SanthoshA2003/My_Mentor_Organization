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
  const [jobSummary, setJobSummary] = useState(null);
  const [q, setQ] = useState("");
  const [statusF, setStatusF] = useState("all");
  const [deptF, setDeptF] = useState("all");



  const load = async () => {
    try {
      console.log("========== JOBS LOAD ==========");

      const response = await api.get(
        "/organizations/me/jobslist"
      );

      console.log(
        "Organization Jobs List API:",
        response.data
      );

      const data = response.data;

      // API response:
      // {
      //   items: [],
      //   total: 5,
      //   page: 1,
      //   page_size: 20,
      //   total_pages: 1
      // }

      setJobs(
        Array.isArray(data?.items)
          ? data.items
          : []
      );

      // Save pagination information if needed
      setJobSummary({
        total_jobs: data?.total ?? 0,
        page: data?.page ?? 1,
        page_size: data?.page_size ?? 20,
        total_pages: data?.total_pages ?? 1,
      });

    } catch (error) {
      console.error(
        "❌ Organization Jobs List API error:",
        error
      );

      console.error(
        "STATUS:",
        error.response?.status
      );

      console.error(
        "RESPONSE:",
        error.response?.data
      );

      setJobs([]);
      setJobSummary({});
    }
  };

  useEffect(() => { load(); }, []);

  // Job Summary API values
  const totalJobs = jobs?.length ?? 0;

  const draftJobs =
    jobs?.filter(
      (job) => job.status === "draft"
    ).length ?? 0;

  const activeJobs =
    jobs?.filter(
      (job) =>
        job.status === "active" ||
        job.status === "open"
    ).length ?? 0;

  const pausedJobs =
    jobs?.filter(
      (job) => job.status === "paused"
    ).length ?? 0;

  const closedJobs =
    jobs?.filter(
      (job) => job.status === "closed"
    ).length ?? 0;

  const filledJobs =
    jobs?.filter(
      (job) => job.status === "filled"
    ).length ?? 0;

  const changeStatus = async (job, status) => {
    await api.post(`/jobs/${job.id}/status`, { status });
    toast.success(`Job ${status}`); load();
  };
  const duplicate = async (job) => {
  try {
    console.log("Duplicating job:", job.id);

    const response = await api.post(
      `/organizations/me/${job.id}/duplicate`
    );

    console.log("Duplicate job response:", response.data);

    toast.success("Job duplicated successfully");

    await load();
  } catch (error) {
    console.error("Duplicate job error:", error);
    console.error("Status:", error.response?.status);
    console.error("Response:", error.response?.data);

    toast.error(
      error.response?.data?.detail ||
      error.response?.data?.message ||
      "Failed to duplicate job."
    );
  }
};
  const depts = [...new Set((jobs || []).map((j) => j.department).filter(Boolean))];
  const filtered = (jobs || []).filter((j) => {
    const searchText =
      `${j.title || ""} ${j.department || ""} ${j.location || ""}`.toLowerCase();

    const matchesSearch = searchText.includes(q.toLowerCase());

    let matchesStatus = true;

    if (statusF !== "all") {
      if (statusF === "active") {
        // API currently uses "open" or "active"
        matchesStatus =
          j.status === "open" ||
          j.status === "active";
      } else {
        matchesStatus = j.status === statusF;
      }
    }

    const matchesDepartment =
      deptF === "all" ||
      j.department === deptF;

    return (
      matchesSearch &&
      matchesStatus &&
      matchesDepartment
    );
  });

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
        <KPICard
          testId="job-kpi-total"
          label="Total Jobs"
          value={totalJobs}
          icon={Briefcase}
        />

        <KPICard
          testId="job-kpi-draft"
          label="Draft"
          value={draftJobs}
          icon={Layers}
          accent="text-slate-500"
        />

        <KPICard
          testId="job-kpi-active"
          label="Active"
          value={activeJobs}
          icon={PlayCircle}
          accent="text-emerald-500"
        />

        <KPICard
          testId="job-kpi-paused"
          label="Paused"
          value={pausedJobs}
          icon={PauseCircle}
          accent="text-amber-500"
        />

        <KPICard
          testId="job-kpi-closed"
          label="Closed"
          value={closedJobs}
          icon={XCircle}
          accent="text-slate-500"
        />

        <KPICard
          testId="job-kpi-filled"
          label="Filled"
          value={filledJobs}
          icon={CheckCircle2}
          accent="text-[#1e5bff]"
        />
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
            <SelectItem value="all">
              All Status
            </SelectItem>

            <SelectItem value="draft">
              Draft
            </SelectItem>

            <SelectItem value="active">
              Active
            </SelectItem>

            <SelectItem value="paused">
              Paused
            </SelectItem>

            <SelectItem value="closed">
              Closed
            </SelectItem>

            <SelectItem value="filled">
              Filled
            </SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={deptF}
          onValueChange={setDeptF}
        >
          <SelectTrigger
            data-testid="jobs-dept-filter"
            className="w-40"
          >
            <SelectValue placeholder="Department" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="all">
              All Departments
            </SelectItem>

            {depts.map((d) => (
              <SelectItem
                key={d}
                value={d}
              >
                {d}
              </SelectItem>
            ))}
          </SelectContent>
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
                    // "Job ID",
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
                {filtered.map((j) => {
                  const displayStatus =
                    j.status === "open"
                      ? "active"
                      : j.status;

                  return (
                    <tr
                      key={j.id}
                      className="border-t border-slate-100 hover:bg-slate-50 transition-colors duration-150 cursor-pointer"
                      onClick={() => navigate(`/jobs/${j.id}`)}
                    >

                      {/* Job ID */}
                      {/* <td className="px-3 py-3 text-slate-500 whitespace-nowrap">
                        {j.job_id || j.id || "—"}
                      </td> */}

                      {/* Title */}
                      <td className="px-3 py-3 font-medium text-[#0a2540] whitespace-nowrap">
                        {j.title || "—"}
                      </td>

                      {/* Department */}
                      <td className="px-3 py-3 text-slate-600">
                        {j.department || "—"}
                      </td>

                      {/* Location */}
                      <td className="px-3 py-3 text-slate-600">
                        {j.location || "—"}
                      </td>

                      {/* Employment Type */}
                      <td className="px-3 py-3 text-slate-600 whitespace-nowrap">
                        {j.employment_type || "—"}
                      </td>

                      {/* Experience */}
                      <td className="px-3 py-3 text-slate-600 whitespace-nowrap">
                        {j.experience_min != null &&
                          j.experience_max != null
                          ? `${j.experience_min}-${j.experience_max}y`
                          : j.experience_min != null
                            ? `${j.experience_min}y`
                            : j.experience_max != null
                              ? `${j.experience_max}y`
                              : "—"}
                      </td>

                      {/* Applications */}
                      <td className="px-3 py-3">
                        {j.applications_count ?? 0}
                      </td>

                      {/* Matched */}
                      <td className="px-3 py-3">
                        {j.matched_count ?? 0}
                      </td>

                      {/* Shortlist */}
                      <td className="px-3 py-3">
                        {j.shortlisted_count ?? 0}
                      </td>

                      {/* Interviews */}
                      <td className="px-3 py-3">
                        {j.interviews_count ?? 0}
                      </td>

                      {/* Selected */}
                      <td className="px-3 py-3">
                        {j.selected_count ?? 0}
                      </td>

                      {/* Status */}
                      <td className="px-3 py-3">
                        <StatusBadge
                          status={displayStatus || "—"}
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
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}