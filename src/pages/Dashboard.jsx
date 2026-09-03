import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";

import {
  KPICard,
  CardsSkeleton,
  ErrorState,
  EmptyState,
  StatusBadge,
} from "@/components/common";

import { Card } from "@/components/ui/card";

import {
  Users,
  UserCheck,
  Briefcase,
  BriefcaseBusiness,
  FileText,
  ListChecks,
  CalendarClock,
  Trophy,
  Activity,
  Building2,
  CheckCircle2,
  Clock3,
  Target,
  TrendingDown,
} from "lucide-react";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

/* ============================================================
   COLORS
============================================================ */

const funnelColors = [
  "#1e5bff",
  "#2b6bff",
  "#17a2c7",
  "#17b6c7",
  "#14b8a6",
  "#22c55e",
  "#16a34a",
];

const statusColors = [
  "#1e5bff",
  "#17b6c7",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
];

/* ============================================================
   HELPERS
============================================================ */

const numberValue = (value) => {
  if (typeof value === "number") return value;

  if (value === null || value === undefined || value === "") {
    return 0;
  }

  const parsed = Number(value);

  return Number.isNaN(parsed) ? 0 : parsed;
};

const formatStatus = (status) => {
  if (!status) return "";

  return String(status)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

/* ============================================================
   COMPONENT
============================================================ */

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);

  const navigate = useNavigate();

  /* ==========================================================
     LOAD DASHBOARD
  ========================================================== */

 const load = async () => {
  setError(false);

  try {
    const dashboardResponse = await api.get(
      "/organizations/me/dashboard"
    );

    console.log(
      "Organization Dashboard API:",
      dashboardResponse.data
    );

    setData(dashboardResponse.data || {});
  } catch (err) {
    console.error("Dashboard API error:", err);
    console.error("Status:", err.response?.status);
    console.error("Response:", err.response?.data);

    setError(true);
  }
};

  useEffect(() => {
    load();
  }, []);

  /* ==========================================================
     ERROR
  ========================================================== */

  if (error) {
    return <ErrorState onRetry={load} />;
  }

  /* ==========================================================
     LOADING
  ========================================================== */

  if (!data) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-72 bg-slate-200 rounded animate-pulse" />

        <div className="h-5 w-96 bg-slate-200 rounded animate-pulse" />

        <CardsSkeleton count={4} />

        <CardsSkeleton count={4} />

        <div className="h-80 bg-slate-100 rounded-xl animate-pulse" />
      </div>
    );
  }

 /* ==========================================================
   API DATA
========================================================== */

const organization = data.organization || {};
const candidates = data.candidates || {};
const recruitmentFunnel = data.recruitment_funnel || {};
const candidateQuality = data.candidate_quality || {};

const jobOverview = Array.isArray(data.active_jobs)
  ? data.active_jobs
  : [];

const recentActivity = Array.isArray(data.recent_activity)
  ? data.recent_activity
  : [];

  /* ==========================================================
   BASIC VALUES
========================================================== */

const totalUsers = numberValue(
  organization.total_users
);

const activeUsers = numberValue(
  organization.active_users
);

const totalJobs = numberValue(
  organization.total_jobs
);

const activeJobs = numberValue(
  organization.active_jobs
);

const totalApplications = numberValue(
  candidates.total_applications
);

const matchedProfiles = numberValue(
  candidates.matched_profiles
);

const shortlisted = numberValue(
  candidates.shortlisted
);

const totalInterviews = numberValue(
  candidates.interviews
);

const hiredApplications = numberValue(
  candidates.selected
);

const screeningApplications = numberValue(
  recruitmentFunnel.screening
);

const finalistApplications = numberValue(
  recruitmentFunnel.finalist
);
 

  /* ==========================================================
     RECRUITMENT FUNNEL
     
     Only available values are used.
     Missing values become 0.
  ========================================================== */

 /* ==========================================================
   RECRUITMENT FUNNEL
========================================================== */

const funnel = [
  {
    stage: "Applications",
    count: numberValue(
      recruitmentFunnel.applications
    ),
  },
  {
    stage: "Matched",
    count: numberValue(
      recruitmentFunnel.matched
    ),
  },
  {
    stage: "Screening",
    count: numberValue(
      recruitmentFunnel.screening
    ),
  },
  {
    stage: "Shortlisted",
    count: numberValue(
      recruitmentFunnel.shortlisted
    ),
  },
  {
    stage: "Interview",
    count: numberValue(
      recruitmentFunnel.interview
    ),
  },
  {
    stage: "Finalist",
    count: numberValue(
      recruitmentFunnel.finalist
    ),
  },
  {
    stage: "Selected",
    count: numberValue(
      recruitmentFunnel.selected
    ),
  },
];
  /* ==========================================================
     FUNNEL CALCULATIONS
  ========================================================== */

  const funnelWithStats = funnel.map(
    (item, index) => {
      const previous =
        index === 0
          ? totalApplications
          : funnel[index - 1].count;

      const conversion =
        totalApplications > 0
          ? ((item.count / totalApplications) * 100).toFixed(1)
          : "0.0";

      const dropoff =
        previous > 0
          ? (((previous - item.count) / previous) * 100).toFixed(1)
          : "0.0";

      return {
        ...item,
        conversion,
        dropoff,
      };
    }
  );

  

  /* ==========================================================
     JOB OVERVIEW
     
     Supports API returning:
     
     recruitment.job_overview
     organization.job_overview
     recruitment.jobs.list
     recruitment.jobs.items
  ========================================================== */


/* ==========================================================
   CANDIDATE QUALITY
========================================================== */

const avgATS = numberValue(
  candidateQuality.average_ats_score
);

const avgMatch = numberValue(
  candidateQuality.average_match_score
);

const above90 = numberValue(
  candidateQuality.above_90
);

const below60 = numberValue(
  candidateQuality.below_60
);

const scoreDistribution =
  candidateQuality.score_distribution || {};

const qualityDistribution = [
  {
    band: "90-100",
    count: numberValue(
      scoreDistribution.score_90_100
    ),
  },
  {
    band: "80-89",
    count: numberValue(
      scoreDistribution.score_80_89
    ),
  },
  {
    band: "70-79",
    count: numberValue(
      scoreDistribution.score_70_79
    ),
  },
  {
    band: "60-69",
    count: numberValue(
      scoreDistribution.score_60_69
    ),
  },
  {
    band: "<60",
    count: numberValue(
      scoreDistribution.below_60
    ),
  },
];

  /* ==========================================================
     DISPLAY
  ========================================================== */

  return (
    <div className="space-y-8">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div>
        <h1 className="font-display font-extrabold text-3xl text-[#0a2540]">
          Recruitment Command Center
        </h1>

        <p className="text-slate-500 mt-1">
          A real-time overview of your organization's
          hiring activity.
        </p>

        {organization.organization_name && (
          <div className="flex items-center gap-2 mt-4 text-sm text-slate-500">
            <Building2 className="h-4 w-4 text-[#1e5bff]" />

            <span>Organization:</span>

            <span className="font-semibold text-[#0a2540]">
              {organization.organization_name}
            </span>
          </div>
        )}
      </div>

      {/* ======================================================
          ORGANIZATION
      ====================================================== */}

      <section>
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          Organization
        </h2>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

          <KPICard
            testId="kpi-total-users"
            label="Total Users"
            value={totalUsers}
            icon={Users}
            onClick={() => navigate("/users")}
          />

          <KPICard
            testId="kpi-active-users"
            label="Active Users"
            value={activeUsers}
            icon={UserCheck}
            accent="text-emerald-500"
          />

          <KPICard
            testId="kpi-total-jobs"
            label="Total Jobs"
            value={totalJobs}
            icon={Briefcase}
            onClick={() => navigate("/jobs")}
          />

          <KPICard
            testId="kpi-active-jobs"
            label="Active Jobs"
            value={activeJobs}
            icon={BriefcaseBusiness}
            accent="text-teal-500"
            onClick={() => navigate("/jobs")}
          />

        </div>
      </section>

      {/* ======================================================
          CANDIDATES / RECRUITMENT
      ====================================================== */}

      <section>
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          Candidates
        </h2>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">

          <KPICard
            testId="kpi-total-applications"
            label="Total Applications"
            value={totalApplications}
            icon={FileText}
          />

          <KPICard
            testId="kpi-matched"
            label="Matched Profiles"
            value={matchedProfiles}
            icon={Target}
            accent="text-teal-500"
          />

          <KPICard
            testId="kpi-shortlisted"
            label="Shortlisted"
            value={shortlisted}
            icon={ListChecks}
            accent="text-[#1e5bff]"
          />

          <KPICard
            testId="kpi-interviews"
            label="Interviews"
            value={totalInterviews}
            icon={CalendarClock}
            accent="text-amber-500"
          />

          <KPICard
            testId="kpi-selected"
            label="Selected"
            value={hiredApplications}
            icon={Trophy}
            accent="text-emerald-500"
          />

        </div>
      </section>

      {/* ======================================================
          FUNNEL + QUALITY
      ====================================================== */}

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ====================================================
            RECRUITMENT FUNNEL
        ==================================================== */}

        <Card
          className="lg:col-span-2 border-slate-200 shadow-sm p-6"
          data-testid="recruitment-funnel"
        >
          <h3 className="font-display font-bold text-lg text-[#0a2540] mb-5">
            Recruitment Funnel
          </h3>

          <div className="space-y-2">

            {funnelWithStats.map(
              (item, index) => {

                const max =
                  totalApplications || 1;

                const width = Math.max(
                  6,
                  (item.count / max) * 100
                );

                return (
                  <button
                    key={item.stage}
                    data-testid={`funnel-${item.stage
                      .toLowerCase()
                      .replace(/\s+/g, "-")}`}
                    onClick={() =>
                      navigate("/jobs")
                    }
                    className="w-full group text-left"
                  >
                    <div className="flex items-center gap-3">

                      <div className="w-24 text-sm font-medium text-slate-600 shrink-0">
                        {item.stage}
                      </div>

                      <div className="flex-1 h-9 bg-slate-100 rounded-md overflow-hidden relative">

                        <div
                          className="h-full rounded-md flex items-center px-3 text-white text-sm font-semibold transition-all duration-500"
                          style={{
                            width: `${width}%`,
                            background:
                              funnelColors[
                                index %
                                  funnelColors.length
                              ],
                          }}
                        >
                          {item.count}
                        </div>

                      </div>

                      <div className="w-28 text-right text-xs shrink-0">

                        <span className="text-emerald-600 font-semibold">
                          {item.conversion}%
                        </span>

                        <span className="text-slate-400 ml-2 inline-flex items-center gap-0.5">
                          <TrendingDown className="h-3 w-3" />
                          {item.dropoff}%
                        </span>

                      </div>

                    </div>
                  </button>
                );
              }
            )}

          </div>

        </Card>

        {/* ====================================================
            CANDIDATE QUALITY
        ==================================================== */}

        <Card
          className="border-slate-200 shadow-sm p-6"
          data-testid="candidate-quality"
        >
          <h3 className="font-display font-bold text-lg text-[#0a2540] mb-1">
            Candidate Quality
          </h3>

          <div className="grid grid-cols-2 gap-3 my-4">

            <div className="rounded-lg bg-slate-50 p-3">
              <div className="text-xs text-slate-500">
                Avg ATS
              </div>

              <div className="text-xl font-bold text-[#0a2540]">
                {avgATS}
              </div>
            </div>

            <div className="rounded-lg bg-slate-50 p-3">
              <div className="text-xs text-slate-500">
                Avg Match
              </div>

              <div className="text-xl font-bold text-emerald-600">
                {avgMatch}
              </div>
            </div>

            <div className="rounded-lg bg-emerald-50 p-3">
              <div className="text-xs text-emerald-600">
                Above 90
              </div>

              <div className="text-xl font-bold text-emerald-700">
                {above90}
              </div>
            </div>

            <div className="rounded-lg bg-red-50 p-3">
              <div className="text-xs text-red-600">
                Below 60
              </div>

              <div className="text-xl font-bold text-red-700">
                {below60}
              </div>
            </div>

          </div>

          {qualityDistribution.length > 0 ? (
            <ResponsiveContainer
              width="100%"
              height={140}
            >
              <BarChart
                data={qualityDistribution}
              >
                <XAxis
                  dataKey="band"
                  tick={{
                    fontSize: 11,
                  }}
                  axisLine={false}
                  tickLine={false}
                />

                <Tooltip />

                <Bar
                  dataKey="count"
                  radius={[
                    4,
                    4,
                    0,
                    0,
                  ]}
                >
                  {qualityDistribution.map(
                    (_, index) => (
                      <Cell
                        key={index}
                        fill={
                          statusColors[
                            index %
                              statusColors.length
                          ]
                        }
                      />
                    )
                  )}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[140px] flex items-center justify-center text-sm text-slate-400">
              Candidate quality data unavailable
            </div>
          )}

        </Card>

      </section>

      {/* ======================================================
    ACTIVE JOBS OVERVIEW
====================================================== */}

<section>
  <Card
    className="border-slate-200 shadow-sm overflow-hidden"
    data-testid="job-overview"
  >
    <div className="p-5 border-b border-slate-100">
      <h3 className="font-display font-bold text-lg text-[#0a2540]">
        Active Jobs Overview
      </h3>
    </div>

    {jobOverview.length === 0 ? (
      <EmptyState
        icon={Briefcase}
        title="No active jobs"
        description="There are no active jobs available."
      />
    ) : (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr className="text-left">
              {[
                "Job Title",
                "Department",
                "Location",
                "Applications",
                "Matched",
                "Shortlisted",
                "Interviews",
                "Selected",
                "Status",
                "",
              ].map((header) => (
                <th
                  key={header}
                  className="px-4 py-3 font-semibold text-xs uppercase tracking-wide whitespace-nowrap"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {jobOverview.map((job) => (
              <tr
                key={job.id}
                className="border-t border-slate-100 hover:bg-slate-50"
              >
                {/* Job Title */}
                <td className="px-4 py-3 font-medium text-[#0a2540] whitespace-nowrap">
                  {job.title || ""}
                </td>

                {/* Department
                    Not available from current API
                */}
                <td className="px-4 py-3 text-slate-600">
                  {job.department || ""}
                </td>

                {/* Location */}
                <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                  {job.location || ""}
                </td>

                {/* Applications */}
               <td className="px-4 py-3">
  {job.applications ?? ""}
</td>

                {/* Matched
                    Not available from current API
                */}
                <td className="px-4 py-3">
                  {job.matched ?? ""}
                </td>

                {/* Shortlisted
                    Not available from current API
                */}
                <td className="px-4 py-3">
                  {job.shortlisted ?? ""}
                </td>

                {/* Interviews
                    Not available from current API
                */}
                <td className="px-4 py-3">
                  {job.interviews ?? ""}
                </td>

                {/* Selected
                    Not available from current API
                */}
                <td className="px-4 py-3">
                  {job.selected ?? ""}
                </td>

                {/* Status */}
                <td className="px-4 py-3">
                  {job.status ? (
                    <StatusBadge status={job.status} />
                  ) : (
                    ""
                  )}
                </td>

                {/* View Job */}
                <td className="px-4 py-3">
                  <button
                    onClick={() =>
                      navigate(`/jobs/${job.id}`)
                    }
                    className="text-[#1e5bff] font-medium hover:underline whitespace-nowrap"
                  >
                    View Job
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </Card>
</section>

      {/* ======================================================
          RECENT ACTIVITY
      ====================================================== */}

      <section>

        <Card
          className="border-slate-200 shadow-sm p-6"
          data-testid="recent-activity"
        >

          <h3 className="font-display font-bold text-lg text-[#0a2540] mb-4 flex items-center gap-2">

            <Activity className="h-5 w-5 text-[#1e5bff]" />

            Recent Activity

          </h3>

          {recentActivity.length === 0 ? (

            <div className="py-10 text-center">

              <Activity className="h-10 w-10 mx-auto text-slate-300" />

              <p className="mt-3 text-sm font-medium text-slate-600">
                No recent activity
              </p>

              <p className="text-xs text-slate-400 mt-1">
                Recent organization activity will appear here.

              </p>

            </div>

          ) : (

            <div className="space-y-1">

             {recentActivity.map((activity, index) => {

  const createdAt = activity.created_at;

  return (
    <div
      key={activity.id || index}
      className="flex items-center gap-3 py-3 border-b border-slate-50 last:border-0"
    >

      {/* Activity dot */}
      <div className="h-2 w-2 rounded-full bg-[#17b6c7] shrink-0" />

      {/* Activity text */}
      <div className="flex-1 text-sm text-slate-700">
        {activity.activity || "-"}
      </div>

      {/* Date / Time */}
      {createdAt && (
        <div className="text-xs text-slate-400 whitespace-nowrap">
          {new Date(createdAt).toLocaleDateString()}{" "}
          {new Date(createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      )}

    </div>
  );
})}

            </div>

          )}

        </Card>

      </section>
    </div>
  );
}