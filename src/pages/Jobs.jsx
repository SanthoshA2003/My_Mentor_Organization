import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

import {
  StatusBadge,
  EmptyState,
  TableSkeleton,
  KPICard,
} from "@/components/common";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Plus,
  MoreHorizontal,
  Search,
  Briefcase,
  Layers,
  PlayCircle,
  PauseCircle,
  XCircle,
  CheckCircle2,
} from "lucide-react";

import { toast } from "sonner";

export default function Jobs() {
  const { can } = useAuth();
  const navigate = useNavigate();

  const [jobs, setJobs] = useState(null);
  const [q, setQ] = useState("");
  const [statusF, setStatusF] = useState("all");
  const [deptF, setDeptF] = useState("all");

  // --------------------------------------------------
  // Load jobs
  // --------------------------------------------------

  const load = async () => {
    try {
      const response = await api.get("/organizations/me/jobs");

      console.log("Organization Jobs API:", response.data);

      setJobs(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Organization Jobs API error:", error);
      console.error("Status:", error.response?.status);
      console.error("Response:", error.response?.data);

      setJobs([]);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // --------------------------------------------------
  // Change job status
  // --------------------------------------------------

  const changeStatus = async (job, status) => {
    try {
      await api.post(`/jobs/${job.id}/status`, {
        status,
      });

      toast.success(`Job ${status}`);

      await load();
    } catch (error) {
      console.error("Change job status error:", error);
      console.error("Status:", error.response?.status);
      console.error("Response:", error.response?.data);

      toast.error(
        error.response?.data?.detail ||
          "Failed to change job status."
      );
    }
  };

  // --------------------------------------------------
  // Duplicate job
  // --------------------------------------------------

  const duplicate = async (job) => {
    try {
      await api.post(`/jobs/${job.id}/duplicate`);

      toast.success("Job duplicated as draft");

      await load();
    } catch (error) {
      console.error("Duplicate job error:", error);
      console.error("Status:", error.response?.status);
      console.error("Response:", error.response?.data);

      toast.error(
        error.response?.data?.detail ||
          "Failed to duplicate job."
      );
    }
  };

  // --------------------------------------------------
  // Departments
  // --------------------------------------------------

  const depts = [
    ...new Set(
      (jobs || [])
        .map((job) => job.department)
        .filter(Boolean)
    ),
  ];

  // --------------------------------------------------
  // Filter jobs
  // --------------------------------------------------

  const filtered = (jobs || []).filter((job) => {
    const searchText = `
      ${job.title || ""}
      ${job.department || ""}
      ${job.location || ""}
    `.toLowerCase();

    const matchesSearch = searchText.includes(
      q.toLowerCase()
    );

    const matchesStatus =
      statusF === "all" ||
      job.status === statusF;

    const matchesDepartment =
      deptF === "all" ||
      job.department === deptF;

    return (
      matchesSearch &&
      matchesStatus &&
      matchesDepartment
    );
  });

  // --------------------------------------------------
  // Counts
  // --------------------------------------------------

  const counts = (jobs || []).reduce(
    (accumulator, job) => {
      const status = job.status;

      if (status) {
        accumulator[status] =
          (accumulator[status] || 0) + 1;
      }

      return accumulator;
    },
    {}
  );

  // --------------------------------------------------
  // Render
  // --------------------------------------------------

  return (
    <div className="space-y-6">

      {/* ==================================================
          HEADER
      ================================================== */}

      <div className="flex items-center justify-between flex-wrap gap-3">

        <div>
          <h1 className="font-display font-extrabold text-3xl text-[#0a2540]">
            Jobs
          </h1>

          <p className="text-slate-500 mt-1">
            Create and manage job descriptions and their
            recruitment pipelines.
          </p>
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

      {/* ==================================================
          KPI CARDS
      ================================================== */}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">

        <KPICard
          testId="job-kpi-total"
          label="Total Jobs"
          value={jobs?.length || 0}
          icon={Briefcase}
        />

        <KPICard
          testId="job-kpi-draft"
          label="Draft"
          value={counts.draft || 0}
          icon={Layers}
          accent="text-slate-500"
        />

        <KPICard
          testId="job-kpi-active"
          label="Active"
          value={
            (counts.active || 0) +
            (counts.open || 0)
          }
          icon={PlayCircle}
          accent="text-emerald-500"
        />

        <KPICard
          testId="job-kpi-paused"
          label="Paused"
          value={counts.paused || 0}
          icon={PauseCircle}
          accent="text-amber-500"
        />

        <KPICard
          testId="job-kpi-closed"
          label="Closed"
          value={counts.closed || 0}
          icon={XCircle}
          accent="text-slate-500"
        />

        <KPICard
          testId="job-kpi-filled"
          label="Filled"
          value={counts.filled || 0}
          icon={CheckCircle2}
          accent="text-[#1e5bff]"
        />

      </div>

      {/* ==================================================
          SEARCH + FILTERS
      ================================================== */}

      <div className="flex items-center gap-3 flex-wrap">

        {/* Search */}

        <div className="relative flex-1 min-w-[200px] max-w-sm">

          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
          />

          <Input
            data-testid="jobs-search"
            value={q}
            onChange={(event) =>
              setQ(event.target.value)
            }
            placeholder="Search jobs..."
            className="pl-9"
          />

        </div>

        {/* Status */}

        <Select
          value={statusF}
          onValueChange={setStatusF}
        >

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

            <SelectItem value="open">
              Open
            </SelectItem>

            <SelectItem value="closed">
              Closed
            </SelectItem>

            <SelectItem value="draft">
              Draft
            </SelectItem>

            <SelectItem value="paused">
              Paused
            </SelectItem>

            <SelectItem value="filled">
              Filled
            </SelectItem>

          </SelectContent>

        </Select>

        {/* Department */}

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

            {depts.map((department) => (
              <SelectItem
                key={department}
                value={department}
              >
                {department}
              </SelectItem>
            ))}

          </SelectContent>

        </Select>

      </div>

      {/* ==================================================
          JOBS TABLE
      ================================================== */}

      <Card
        className="border-slate-200 shadow-sm overflow-hidden"
        data-testid="jobs-table"
      >

        {/* Loading */}

        {!jobs ? (

          <TableSkeleton />

        ) : filtered.length === 0 ? (

          /* Empty state */

          <EmptyState
            icon={Briefcase}
            title="You haven't created any jobs yet."
            description="Create your first job description to begin sourcing and matching candidates."
            action={
              can("create_job") ? (
                <Button
                  data-testid="create-first-job-btn"
                  onClick={() =>
                    navigate("/jobs/new")
                  }
                  className="bg-[#1e5bff] hover:bg-[#154cdb]"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Job
                </Button>
              ) : null
            }
          />

        ) : (

          /* Table */

          <div className="overflow-x-auto">

            <table className="w-full text-sm">

              {/* ==================================================
                  TABLE HEADER
              ================================================== */}

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
                  ].map((heading) => (

                    <th
                      key={heading}
                      className="px-3 py-3 font-semibold text-xs uppercase whitespace-nowrap"
                    >
                      {heading}
                    </th>

                  ))}

                </tr>

              </thead>

              {/* ==================================================
                  TABLE BODY
              ================================================== */}

              <tbody>

                {filtered.map((job) => (

                  <tr
                    key={job.id}
                    className="border-t border-slate-100 hover:bg-slate-50 transition-colors duration-150 cursor-pointer"
                    onClick={() =>
                      navigate(`/jobs/${job.id}`)
                    }
                  >

                    {/* Job ID */}

                    <td className="px-3 py-3 text-slate-500 whitespace-nowrap">
                      {job.job_code || "—"}
                    </td>

                    {/* Title */}

                    <td className="px-3 py-3 font-medium text-[#0a2540] whitespace-nowrap">
                      {job.title || "—"}
                    </td>

                    {/* Department */}

                    <td className="px-3 py-3 text-slate-600">
                      {job.department || "—"}
                    </td>

                    {/* Location */}

                    <td className="px-3 py-3 text-slate-600">
                      {job.location || "—"}
                    </td>

                    {/* Type */}

                    <td className="px-3 py-3 text-slate-600 whitespace-nowrap">
                      {job.job_type ||
                        job.employment_type ||
                        "—"}
                    </td>

                    {/* Experience */}

                    <td className="px-3 py-3 text-slate-600 whitespace-nowrap">

                      {job.experience ? (

                        job.experience

                      ) : job.min_experience != null &&
                        job.max_experience != null ? (

                        `${job.min_experience}-${job.max_experience}y`

                      ) : (

                        "—"

                      )}

                    </td>

                    {/* Applications */}

                    <td className="px-3 py-3">
                      {job.stats?.applications ??
                        job.applicants ??
                        "—"}
                    </td>

                    {/* Matched */}

                    <td className="px-3 py-3">
                      {job.stats?.matched ?? "—"}
                    </td>

                    {/* Shortlist */}

                    <td className="px-3 py-3">
                      {job.stats?.shortlisted ?? "—"}
                    </td>

                    {/* Interviews */}

                    <td className="px-3 py-3">
                      {job.stats?.interviews ?? "—"}
                    </td>

                    {/* Selected */}

                    <td className="px-3 py-3">
                      {job.stats?.selected ?? "—"}
                    </td>

                    {/* Status */}

                    <td className="px-3 py-3">

                      <StatusBadge
                        status={job.status || "—"}
                      />

                    </td>

                    {/* ==================================================
                        ACTIONS
                    ================================================== */}

                    <td
                      className="px-3 py-3"
                      onClick={(event) =>
                        event.stopPropagation()
                      }
                    >

                      <DropdownMenu>

                        <DropdownMenuTrigger asChild>

                          <button
                            type="button"
                            data-testid={`job-actions-${job.id}`}
                            className="h-8 w-8 rounded flex items-center justify-center hover:bg-slate-100"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>

                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end">

                          {/* View */}

                          <DropdownMenuItem
                            onClick={() =>
                              navigate(
                                `/jobs/${job.id}`
                              )
                            }
                          >
                            View
                          </DropdownMenuItem>

                          {/* Edit */}

                          <DropdownMenuItem
                            onClick={() =>
                              navigate(
                                `/jobs/${job.id}/edit`
                              )
                            }
                          >
                            Edit
                          </DropdownMenuItem>

                          {/* Duplicate */}

                          <DropdownMenuItem
                            onClick={() =>
                              duplicate(job)
                            }
                          >
                            Duplicate
                          </DropdownMenuItem>

                          {/* Status actions */}

                          {job.status === "open" && (
                            <DropdownMenuItem
                              onClick={() =>
                                changeStatus(
                                  job,
                                  "paused"
                                )
                              }
                            >
                              Pause
                            </DropdownMenuItem>
                          )}

                          {job.status === "paused" && (
                            <DropdownMenuItem
                              onClick={() =>
                                changeStatus(
                                  job,
                                  "open"
                                )
                              }
                            >
                              Reopen
                            </DropdownMenuItem>
                          )}

                          {job.status !== "closed" && (
                            <DropdownMenuItem
                              onClick={() =>
                                changeStatus(
                                  job,
                                  "closed"
                                )
                              }
                            >
                              Close
                            </DropdownMenuItem>
                          )}

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