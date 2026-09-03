import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api, formatApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";

import {
  StatusBadge,
  EmptyState,
  TableSkeleton,
  scoreColor,
} from "@/components/common";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  ArrowLeft,
  Edit,
  Pause,
  XCircle,
  PlayCircle,
  MapPin,
  Briefcase,
  Users2,
  FileText,
  Target,
  Layout,
  CalendarClock,
  BarChart3,
  Sparkles,
} from "lucide-react";

import { toast } from "sonner";
import { cn } from "@/lib/utils";

const STAGE_COLORS = {
  Applied: "border-t-slate-400",
  Screening: "border-t-blue-400",
  Shortlisted: "border-t-[#1e5bff]",
  Interview: "border-t-teal-400",
  "Technical Round": "border-t-cyan-500",
  "HR Round": "border-t-indigo-400",
  Finalist: "border-t-emerald-400",
  Selected: "border-t-emerald-600",
  Rejected: "border-t-red-400",
  Withdrawn: "border-t-slate-300",
};

const PIPELINE_STAGES = [
  "Applied",
  "Screening",
  "Shortlisted",
  "Interview",
  "Technical Round",
  "HR Round",
  "Finalist",
  "Selected",
  "Rejected",
];

export default function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { can } = useAuth();

  const [data, setData] = useState(null);
  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(true);

  // ============================================================
  // FETCH COMPLETE JOB DETAILS
  // ============================================================

  const loadJob = async () => {
    try {
      setLoading(true);

      console.log("========== JOB DETAILS LOAD ==========");

      const response = await api.get(
        `/organizations/me/jobs/${id}/details`
      );

      console.log(
        "Organization Job Details API:",
        response.data
      );

      setData(response.data);
    } catch (error) {
      console.error(
        "❌ Organization Job Details API error:",
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

      setData(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJob();
  }, [id]);

  // ============================================================
  // CHANGE JOB STATUS
  // ============================================================

  const changeStatus = async (status) => {
    try {
      await api.post(`/jobs/${id}/status`, {
        status,
      });

      toast.success(`Job ${status}`);

      await loadJob();
    } catch (error) {
      console.error("Change job status error:", error);

      toast.error(
        formatApiError(
          error.response?.data?.detail ||
            "Unable to change job status"
        )
      );
    }
  };

  // ============================================================
  // MOVE APPLICATION
  // ============================================================

  const moveStage = async (applicationId, stage) => {
    try {
      console.log("Moving application:", {
        jobId: id,
        applicationId,
        stage,
      });

      await api.put(
        `/organizations/me/jobs/${id}/applications/${applicationId}/move`,
        {
          status: stage.toLowerCase().replace(/ /g, "_"),
        }
      );

      toast.success(`Moved to ${stage}`);

      await loadJob();
    } catch (error) {
      console.error(
        "Move application stage error:",
        error
      );

      toast.error(
        formatApiError(
          error.response?.data?.detail ||
            "Unable to move application"
        )
      );
    }
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-24 bg-slate-200 rounded animate-pulse" />
        <TableSkeleton />
      </div>
    );
  }

  // ============================================================
  // NOT FOUND
  // ============================================================

  if (data === false) {
    return (
      <EmptyState
        icon={Briefcase}
        title="Job not found"
      />
    );
  }

  if (!data) {
    return null;
  }

  // ============================================================
  // NEW API RESPONSE
  //
  // {
  //   job: {},
  //   overview: {},
  //   applications: [],
  //   matched_profiles: [],
  //   pipeline: {},
  //   interviews: [],
  //   analytics: {}
  // }
  // ============================================================

  const job = data.job || {};

  console.log("========== JOB DETAIL DEBUG ==========");
console.log("Full API response:", data);
console.log("Job object:", job);

console.log("Responsibilities:", job.responsibilities);
console.log("Required skills:", job.required_skills);
console.log("Preferred skills:", job.preferred_skills);

console.log("Job keys:", Object.keys(job));

  const overview = data.overview || {};

  const applications = Array.isArray(data.applications)
    ? data.applications
    : [];

  const matched = Array.isArray(data.matched_profiles)
    ? data.matched_profiles
    : [];

  const interviews = Array.isArray(data.interviews)
    ? data.interviews
    : [];

  const pipelineData = data.pipeline || {};

  const analytics = data.analytics || {};

  // ============================================================
  // NORMALIZE JOB STATUS
  // ============================================================

  const displayStatus =
    job.status === "open"
      ? "active"
      : job.status;

  // ============================================================
  // NORMALIZE PIPELINE
  //
  // New API gives:
  //
  // pipeline: {
  //   applied: [],
  //   screening: [],
  //   shortlisted: [],
  //   interview: [],
  //   technical_round: [],
  //   hr_round: [],
  //   finalist: [],
  //   selected: [],
  //   rejected: []
  // }
  //
  // UI uses:
  //
  // Applied
  // Screening
  // Shortlisted
  // Interview
  // Technical Round
  // HR Round
  // Finalist
  // Selected
  // Rejected
  // ============================================================

  const getPipelineItems = (stage) => {
    const keyMap = {
      Applied: "applied",
      Screening: "screening",
      Shortlisted: "shortlisted",
      Interview: "interview",
      "Technical Round": "technical_round",
      "HR Round": "hr_round",
      Finalist: "finalist",
      Selected: "selected",
      Rejected: "rejected",
    };

    return pipelineData[keyMap[stage]] || [];
  };

  // ============================================================
  // ATS WEIGHTS
  // ============================================================

  const atsWeights =
    job.ats_weights ||
    job.ats_config ||
    {};

  return (
    <div className="space-y-6">

      {/* ======================================================
          BACK TO JOBS
      ====================================================== */}

      <button
        onClick={() => navigate("/jobs")}
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#1e5bff] transition-colors duration-200"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Jobs
      </button>

      {/* ======================================================
          HEADER
      ====================================================== */}

      <Card className="border-slate-200 shadow-sm p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">

          <div>

            <div className="flex items-center gap-3">

              <h1 className="font-display font-extrabold text-2xl text-[#0a2540]">
                {job.title || "Untitled Job"}
              </h1>

              <StatusBadge
                status={displayStatus || "—"}
              />

            </div>

            <div className="flex items-center gap-4 mt-2 text-sm text-slate-500 flex-wrap">

              {/* Job ID */}
              <span>
                {job.job_id || job.id || "—"}
              </span>

              {/* Department */}
              <span className="flex items-center gap-1">
                <Briefcase className="h-4 w-4" />
                {job.department || "—"}
              </span>

              {/* Location + Work Mode */}
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />

                {job.location || "—"}

                {job.work_mode
                  ? ` · ${job.work_mode}`
                  : ""}
              </span>

              {/* Experience */}
              <span>
                {job.experience_min != null &&
                job.experience_max != null
                  ? `${job.experience_min}-${job.experience_max} yrs`
                  : job.experience_min != null
                  ? `${job.experience_min}+ yrs`
                  : job.experience_max != null
                  ? `Up to ${job.experience_max} yrs`
                  : "Experience —"}
              </span>

              {/* Openings */}
              <span>
                {job.openings ?? 0} opening(s)
              </span>

              {/* Created */}
              {job.created_at && (
                <span>
                  Created{" "}
                  {new Date(
                    job.created_at
                  ).toLocaleDateString()}
                </span>
              )}

            </div>
          </div>

          {/* HEADER ACTIONS */}

          <div className="flex gap-2">

            {can("edit_job") && (
              <Button
                variant="outline"
                data-testid="edit-job-btn"
                onClick={() =>
                  navigate(`/jobs/${id}/edit`)
                }
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}

            {can("pause_job") &&
              displayStatus === "active" && (
                <Button
                  variant="outline"
                  onClick={() =>
                    changeStatus("paused")
                  }
                >
                  <Pause className="h-4 w-4 mr-2" />
                  Pause
                </Button>
              )}

            {can("edit_job") &&
              displayStatus === "paused" && (
                <Button
                  variant="outline"
                  onClick={() =>
                    changeStatus("active")
                  }
                >
                  <PlayCircle className="h-4 w-4 mr-2" />
                  Reopen
                </Button>
              )}

            {can("close_job") &&
              displayStatus !== "closed" && (
                <Button
                  variant="outline"
                  className="text-red-600"
                  onClick={() =>
                    changeStatus("closed")
                  }
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Close Job
                </Button>
              )}

          </div>
        </div>
      </Card>

      {/* ======================================================
          TABS
      ====================================================== */}

      <Tabs
        value={tab}
        onValueChange={setTab}
      >

        <TabsList className="bg-white border border-slate-200 flex-wrap h-auto">

          {[
            ["overview", "Overview", Layout],
            ["applications", "Applications", FileText],
            ["matched", "Matched Profiles", Target],
            ["pipeline", "Pipeline", Users2],
            ["interviews", "Interviews", CalendarClock],
            ["analytics", "Analytics", BarChart3],
          ].map(([value, label, Icon]) => (

            <TabsTrigger
              key={value}
              value={value}
              data-testid={`tab-${value}`}
              className="data-[state=active]:bg-[#1e5bff] data-[state=active]:text-white"
            >
              <Icon className="h-4 w-4 mr-1.5" />
              {label}
            </TabsTrigger>

          ))}

        </TabsList>

        {/* ====================================================
            OVERVIEW
        ==================================================== */}

        <TabsContent
          value="overview"
          className="mt-4"
        >

          {/* KPI CARDS */}

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">

            {[
              [
                "Applications",
                overview.applications ?? 0,
              ],
              [
                "Matched",
                overview.matched ?? 0,
              ],
              [
                "Shortlisted",
                overview.shortlisted ?? 0,
              ],
              [
                "Interviews",
                overview.interviews ?? 0,
              ],
              [
                "Finalists",
                overview.finalists ?? 0,
              ],
              [
                "Selected",
                overview.selected ?? 0,
              ],
              [
                "Avg ATS",
                overview.avg_ats_score ?? 0,
              ],
            ].map(([label, value]) => (

              <Card
                key={label}
                className="border-slate-200 shadow-sm p-4"
              >
                <div className="text-xs font-bold uppercase text-slate-500">
                  {label}
                </div>

                <div className="text-2xl font-bold font-display text-[#0a2540] mt-1">
                  {value}
                </div>
              </Card>

            ))}

          </div>

          {/* JOB SUMMARY */}

          <Card className="border-slate-200 shadow-sm p-6 mt-4">

            <h3 className="font-display font-bold text-lg text-[#0a2540] mb-2">
              Job Summary
            </h3>

            <p className="text-sm text-slate-600">
              {job.summary ||
                "No job summary available."}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">

              {/* RESPONSIBILITIES */}

              <div>

                <div className="text-xs font-bold uppercase text-slate-500 mb-2">
                  Responsibilities
                </div>

                {job.responsibilities?.length > 0 ? (

                  <ul className="list-disc pl-5 space-y-1 text-sm text-slate-600">

                    {job.responsibilities.map(
                      (responsibility, index) => (
                        <li key={index}>
                          {responsibility}
                        </li>
                      )
                    )}

                  </ul>

                ) : (

                  <p className="text-sm text-slate-400">
                    No responsibilities added.
                  </p>

                )}

              </div>

              {/* RIGHT SIDE */}

              <div className="space-y-3">

                {/* REQUIRED SKILLS */}

                <div>

                  <div className="text-xs font-bold uppercase text-slate-500 mb-1">
                    Required Skills
                  </div>

                  <div className="flex flex-wrap gap-1.5">

                    {job.required_skills?.length > 0 ? (

                      job.required_skills.map(
                        (skill) => (
                          <span
                            key={skill}
                            className="rounded-full bg-blue-50 text-blue-700 px-2 py-0.5 text-xs"
                          >
                            {skill}
                          </span>
                        )
                      )

                    ) : (

                      <span className="text-sm text-slate-400">
                        No required skills.
                      </span>

                    )}

                  </div>

                </div>

                {/* PREFERRED SKILLS */}

                <div>

                  <div className="text-xs font-bold uppercase text-slate-500 mb-1">
                    Preferred Skills
                  </div>

                  <div className="flex flex-wrap gap-1.5">

                    {job.preferred_skills?.length > 0 ? (

                      job.preferred_skills.map(
                        (skill) => (
                          <span
                            key={skill}
                            className="rounded-full bg-teal-50 text-teal-700 px-2 py-0.5 text-xs"
                          >
                            {skill}
                          </span>
                        )
                      )

                    ) : (

                      <span className="text-sm text-slate-400">
                        No preferred skills.
                      </span>

                    )}

                  </div>

                </div>

                {/* ATS WEIGHTS */}

                <div>

                  <div className="text-xs font-bold uppercase text-slate-500 mb-1">
                    ATS Weights
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs text-slate-600">

                    {Object.entries(
                      atsWeights
                    ).map(([key, value]) => (

                      <span
                        key={key}
                        className="capitalize"
                      >
                        {key.replaceAll("_", " ")}:{" "}
                        <b>{value}%</b>
                      </span>

                    ))}

                  </div>

                </div>

              </div>

            </div>

          </Card>

        </TabsContent>

        {/* ====================================================
            APPLICATIONS
        ==================================================== */}

        <TabsContent
          value="applications"
          className="mt-4"
        >

          <Card className="border-slate-200 shadow-sm overflow-hidden">

            {applications.length === 0 ? (

              <EmptyState
                icon={FileText}
                title="No candidates have applied yet."
              />

            ) : (

              <div className="overflow-x-auto">

                <table className="w-full text-sm">

                  <thead className="bg-slate-50 text-slate-500">

                    <tr className="text-left">

                      {[
                        "Candidate",
                        "Applied",
                        "ATS",
                        "Match",
                        "Exp",
                        "Stage",
                        "Recruiter",
                        "",
                      ].map((header) => (

                        <th
                          key={header}
                          className="px-4 py-3 font-semibold text-xs uppercase whitespace-nowrap"
                        >
                          {header}
                        </th>

                      ))}

                    </tr>

                  </thead>

                  <tbody>

                    {applications.map((application) => (

                      <tr
                        key={
                          application.application_id
                        }
                        className="border-t border-slate-100 hover:bg-slate-50 cursor-pointer"
                        onClick={() =>
                          navigate(
                            `/applications/${application.application_id}`
                          )
                        }
                      >

                        {/* CANDIDATE */}

                        <td className="px-4 py-3">

                          <div className="flex items-center gap-2">

                            <Avatar className="h-8 w-8">

                              <AvatarFallback className="text-xs">
                                {application.candidate_name?.[0] ||
                                  "?"}
                              </AvatarFallback>

                            </Avatar>

                            <span className="font-medium text-[#0a2540]">
                              {application.candidate_name ||
                                "—"}
                            </span>

                          </div>

                        </td>

                        {/* APPLIED */}

                        <td className="px-4 py-3 text-slate-500 text-xs">

                          {application.applied_at
                            ? new Date(
                                application.applied_at
                              ).toLocaleDateString()
                            : "—"}

                        </td>

                        {/* ATS */}

                        <td className="px-4 py-3">

                          <span
                            className={cn(
                              "rounded-full border px-2 py-0.5 text-xs font-bold",
                              scoreColor(
                                application.ats_score
                              )
                            )}
                          >
                            {application.ats_score ??
                              "—"}
                          </span>

                        </td>

                        {/* MATCH */}

                        <td className="px-4 py-3">

                          <span
                            className={cn(
                              "rounded-full border px-2 py-0.5 text-xs font-bold",
                              scoreColor(
                                application.match_score
                              )
                            )}
                          >
                            {application.match_score ??
                              "—"}
                          </span>

                        </td>

                        {/* EXPERIENCE */}

                        <td className="px-4 py-3 text-slate-600">
                          {application.experience ||
                            "—"}
                        </td>

                        {/* STAGE */}

                        <td className="px-4 py-3">

                          <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
                            {application.stage ||
                              "—"}
                          </span>

                        </td>

                        {/* RECRUITER */}

                        <td className="px-4 py-3 text-slate-600 text-xs">
                          {application.recruiter ||
                            "—"}
                        </td>

                        {/* MOVE */}

                        <td
                          className="px-4 py-3"
                          onClick={(event) =>
                            event.stopPropagation()
                          }
                        >

                          {can("move_stage") && (

                            <DropdownMenu>

                              <DropdownMenuTrigger
                                asChild
                              >

                                <Button
                                  size="sm"
                                  variant="outline"
                                  data-testid={`app-actions-${application.application_id}`}
                                >
                                  Move
                                </Button>

                              </DropdownMenuTrigger>

                              <DropdownMenuContent align="end">

                                {PIPELINE_STAGES
                                  .filter(
                                    (stage) =>
                                      stage.toLowerCase() !==
                                      application.stage?.toLowerCase()
                                  )
                                  .map((stage) => (

                                    <DropdownMenuItem
                                      key={stage}
                                      onClick={() =>
                                        moveStage(
                                          application.application_id,
                                          stage
                                        )
                                      }
                                    >
                                      {stage}
                                    </DropdownMenuItem>

                                  ))}

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

        {/* ====================================================
            MATCHED PROFILES
        ==================================================== */}

        <TabsContent
          value="matched"
          className="mt-4"
        >

          <Card className="border-slate-200 shadow-sm overflow-hidden">

            {matched.length === 0 ? (

              <EmptyState
                icon={Target}
                title="No matching profiles found for this job yet."
              />

            ) : (

              <div className="overflow-x-auto">

                <table className="w-full text-sm">

                  <thead className="bg-slate-50 text-slate-500">

                    <tr className="text-left">

                      {[
                        "Candidate",
                        "ATS",
                        "My Mentor Match",
                        "Relevant Skills",
                        "Missing Skills",
                        "Match Reason",
                        "",
                      ].map((header) => (

                        <th
                          key={header}
                          className="px-4 py-3 font-semibold text-xs uppercase"
                        >
                          {header}
                        </th>

                      ))}

                    </tr>

                  </thead>

                  <tbody>

                    {matched.map((m, index) => {

                      const candidate =
                        m.candidate || {};

                      return (

                        <tr
                          key={
                            m.candidate_id ||
                            candidate.id ||
                            index
                          }
                          className="border-t border-slate-100 hover:bg-slate-50"
                        >

                          {/* CANDIDATE */}

                          <td className="px-4 py-3">

                            <div className="flex items-center gap-2">

                              <Avatar className="h-8 w-8">

                                <AvatarImage
                                  src={
                                    candidate.avatar_url
                                  }
                                />

                                <AvatarFallback className="text-xs">
                                  {(
                                    candidate.name ||
                                    m.candidate_name ||
                                    "?"
                                  )[0]}
                                </AvatarFallback>

                              </Avatar>

                              <div>

                                <div className="font-medium text-[#0a2540]">
                                  {candidate.name ||
                                    m.candidate_name ||
                                    "—"}
                                </div>

                                <div className="text-xs text-slate-400">
                                  {candidate.current_role ||
                                    ""}
                                </div>

                              </div>

                            </div>

                          </td>

                          {/* ATS */}

                          <td className="px-4 py-3">

                            <span
                              className={cn(
                                "rounded-full border px-2 py-0.5 text-xs font-bold",
                                scoreColor(
                                  m.ats_score
                                )
                              )}
                            >
                              {m.ats_score ?? "—"}
                            </span>

                          </td>

                          {/* MATCH */}

                          <td className="px-4 py-3">

                            <span
                              className={cn(
                                "rounded-full border px-2 py-0.5 text-xs font-bold",
                                scoreColor(
                                  m.match_score
                                )
                              )}
                            >
                              {m.match_score ?? "—"}
                            </span>

                          </td>

                          {/* RELEVANT SKILLS */}

                          <td className="px-4 py-3">

                            <div className="flex flex-wrap gap-1">

                              {(m.relevant_skills || [])
                                .slice(0, 3)
                                .map((skill) => (

                                  <span
                                    key={skill}
                                    className="rounded bg-emerald-50 text-emerald-700 px-1.5 py-0.5 text-xs"
                                  >
                                    {skill}
                                  </span>

                                ))}

                            </div>

                          </td>

                          {/* MISSING SKILLS */}

                          <td className="px-4 py-3">

                            <div className="flex flex-wrap gap-1">

                              {(m.missing_skills || [])
                                .slice(0, 3)
                                .map((skill) => (

                                  <span
                                    key={skill}
                                    className="rounded bg-red-50 text-red-700 px-1.5 py-0.5 text-xs"
                                  >
                                    {skill}
                                  </span>

                                ))}

                            </div>

                          </td>

                          {/* REASON */}

                          <td className="px-4 py-3 text-xs text-slate-500 max-w-[200px]">
                            {m.match_reason || "—"}
                          </td>

                          {/* SOURCE */}

                          <td className="px-4 py-3">

                            {m.already_applied ? (

                              <span className="text-xs text-slate-400">
                                Applied
                              </span>

                            ) : (

                              <span className="text-xs text-teal-600 font-medium">
                                Sourced
                              </span>

                            )}

                          </td>

                        </tr>

                      );

                    })}

                  </tbody>

                </table>

              </div>

            )}

          </Card>

        </TabsContent>

        {/* ====================================================
            PIPELINE
        ==================================================== */}

        <TabsContent
          value="pipeline"
          className="mt-4"
        >

          <div
            className="flex gap-4 overflow-x-auto pb-4"
            data-testid="pipeline-board"
          >

            {PIPELINE_STAGES.map((stage) => {

              const items =
                getPipelineItems(stage);

              return (

                <div
                  key={stage}
                  className="w-72 flex-shrink-0"
                >

                  {/* COLUMN HEADER */}

                  <div className="flex items-center justify-between mb-2 px-1">

                    <span className="text-sm font-semibold text-[#0a2540]">
                      {stage}
                    </span>

                    <span className="text-xs text-slate-400 bg-slate-100 rounded-full px-2 py-0.5">
                      {items.length}
                    </span>

                  </div>

                  {/* COLUMN */}

                  <div
                    className={cn(
                      "space-y-2 bg-slate-100/60 rounded-lg p-2 min-h-[120px] border-t-4",
                      STAGE_COLORS[stage] ||
                        "border-t-slate-300"
                    )}
                  >

                    {items.map((application) => (

                      <Card
                        key={
                          application.application_id
                        }
                        data-testid={`pipeline-card-${application.application_id}`}
                        className="border-slate-200 shadow-sm p-3 cursor-pointer hover:border-[#1e5bff]/40 transition-colors duration-150"
                        onClick={() =>
                          navigate(
                            `/applications/${application.application_id}`
                          )
                        }
                      >

                        {/* NAME */}

                        <div className="flex items-center gap-2">

                          <Avatar className="h-7 w-7">

                            <AvatarFallback className="text-xs">
                              {application.candidate_name?.[0] ||
                                "?"}
                            </AvatarFallback>

                          </Avatar>

                          <span className="text-sm font-medium text-[#0a2540] truncate">
                            {application.candidate_name ||
                              "—"}
                          </span>

                        </div>

                        {/* SCORES */}

                        <div className="flex items-center gap-1.5 mt-2">

                          <span
                            className={cn(
                              "rounded border px-1.5 py-0.5 text-[10px] font-bold",
                              scoreColor(
                                application.ats_score
                              )
                            )}
                          >
                            ATS{" "}
                            {application.ats_score ??
                              "—"}
                          </span>

                          <span
                            className={cn(
                              "rounded border px-1.5 py-0.5 text-[10px] font-bold",
                              scoreColor(
                                application.match_score
                              )
                            )}
                          >
                            Match{" "}
                            {application.match_score ??
                              "—"}
                          </span>

                        </div>

                        {/* EXPERIENCE */}

                        <div className="text-xs text-slate-400 mt-1.5">
                          {application.experience ||
                            "—"}
                        </div>

                        {/* MOVE STAGE */}

                        {can("move_stage") && (

                          <div
                            onClick={(event) =>
                              event.stopPropagation()
                            }
                            className="mt-2"
                          >

                            <DropdownMenu>

                              <DropdownMenuTrigger
                                asChild
                              >

                                <button className="text-[10px] text-[#1e5bff] hover:underline">
                                  Move stage →
                                </button>

                              </DropdownMenuTrigger>

                              <DropdownMenuContent>

                                {PIPELINE_STAGES
                                  .filter(
                                    (nextStage) =>
                                      nextStage !==
                                      stage
                                  )
                                  .map(
                                    (nextStage) => (

                                      <DropdownMenuItem
                                        key={nextStage}
                                        onClick={() =>
                                          moveStage(
                                            application.application_id,
                                            nextStage
                                          )
                                        }
                                      >
                                        {nextStage}
                                      </DropdownMenuItem>

                                    )
                                  )}

                              </DropdownMenuContent>

                            </DropdownMenu>

                          </div>

                        )}

                      </Card>

                    ))}

                  </div>

                </div>

              );

            })}

          </div>

        </TabsContent>

        {/* ====================================================
            INTERVIEWS
        ==================================================== */}

        <TabsContent
          value="interviews"
          className="mt-4"
        >

          <Card className="border-slate-200 shadow-sm overflow-hidden">

            {interviews.length === 0 ? (

              <EmptyState
                icon={CalendarClock}
                title="No interviews scheduled for this job yet."
              />

            ) : (

              <div className="overflow-x-auto">

                <table className="w-full text-sm">

                  <thead className="bg-slate-50 text-slate-500">

                    <tr className="text-left">

                      {[
                        "Candidate",
                        "Type",
                        "Interviewer",
                        "Scheduled",
                        "Status",
                      ].map((header) => (

                        <th
                          key={header}
                          className="px-4 py-3 font-semibold text-xs uppercase"
                        >
                          {header}
                        </th>

                      ))}

                    </tr>

                  </thead>

                  <tbody>

                    {interviews.map(
                      (interview, index) => (

                        <tr
                          key={
                            interview.id ||
                            interview.interview_id ||
                            index
                          }
                          className="border-t border-slate-100 hover:bg-slate-50"
                        >

                          <td className="px-4 py-3 font-medium text-[#0a2540]">
                            {interview.candidate_name ||
                              "—"}
                          </td>

                          <td className="px-4 py-3 text-slate-600">
                            {interview.interview_type ||
                              interview.type ||
                              "—"}
                          </td>

                          <td className="px-4 py-3 text-slate-600">
                            {interview.interviewer_name ||
                              interview.interviewer ||
                              "—"}
                          </td>

                          <td className="px-4 py-3 text-xs text-slate-500">

                            {interview.scheduled_at
                              ? new Date(
                                  interview.scheduled_at
                                ).toLocaleString()
                              : "—"}

                          </td>

                          <td className="px-4 py-3">

                            <StatusBadge
                              status={
                                interview.status ===
                                "completed"
                                  ? "filled"
                                  : "active"
                              }
                            />

                          </td>

                        </tr>

                      )
                    )}

                  </tbody>

                </table>

              </div>

            )}

          </Card>

        </TabsContent>

        {/* ====================================================
            ANALYTICS
        ==================================================== */}

        <TabsContent
          value="analytics"
          className="mt-4"
        >

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

            <Card className="border-slate-200 shadow-sm p-4">

              <div className="text-xs font-bold uppercase text-slate-500">
                Avg ATS Score
              </div>

              <div className="text-2xl font-bold text-[#0a2540] mt-1">
                {analytics.avg_ats_score ?? 0}
              </div>

            </Card>

            <Card className="border-slate-200 shadow-sm p-4">

              <div className="text-xs font-bold uppercase text-slate-500">
                Avg Match Score
              </div>

              <div className="text-2xl font-bold text-emerald-600 mt-1">
                {analytics.avg_match_score ?? 0}
              </div>

            </Card>

            <Card className="border-slate-200 shadow-sm p-4">

              <div className="text-xs font-bold uppercase text-slate-500">
                Match Rate
              </div>

              <div className="text-2xl font-bold text-[#0a2540] mt-1">
                {analytics.match_rate ?? 0}%
              </div>

            </Card>

            <Card className="border-slate-200 shadow-sm p-4">

              <div className="text-xs font-bold uppercase text-slate-500">
                Conversion
              </div>

              <div className="text-2xl font-bold text-[#0a2540] mt-1">
                {analytics.conversion ?? 0}%
              </div>

            </Card>

          </div>

          <Card className="border-slate-200 shadow-sm p-6 mt-4 flex items-center gap-3 text-sm text-slate-600">

            <Sparkles className="h-5 w-5 text-[#17b6c7]" />

            This job has received{" "}
            {overview.applications ?? 0}{" "}
            applications with{" "}
            {overview.matched ?? 0} qualified matches.
            Average candidate ATS score is{" "}
            {analytics.avg_ats_score ?? 0}.

          </Card>

        </TabsContent>

      </Tabs>

    </div>
  );
}