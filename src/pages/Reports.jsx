import { useEffect, useState } from "react";
import { api, getToken, API } from "@/lib/api";
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
  KPICard,
  StatusBadge,
  CardsSkeleton,
} from "@/components/common";
import {
  Download,
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
  CartesianGrid,
} from "recharts";

const funnelColors = [
  "#1e5bff",
  "#2b6bff",
  "#17a2c7",
  "#17b6c7",
  "#14b8a6",
  "#22c55e",
  "#16a34a",
];

const qualityColors = [
  "#22c55e", // 90-100 - Green
  "#16a34a", // 80-89  - Dark Green
  "#17b6c7", // 70-79  - Cyan
  "#f59e0b", // 60-69  - Orange
  "#ef4444", // <60    - Red
];

export default function Reports() {
  const { can } = useAuth();

  const [d, setD] = useState(null);

  // =========================================================
  // FETCH RECRUITMENT ANALYTICS
  // =========================================================
  useEffect(() => {
    api
      .get("/organizations/me/analytics/recruitment/dashboard")
      .then((r) => {
        console.log("Recruitment Dashboard API:", r.data);
        setD(r.data);
      })
      .catch((error) => {
        console.error(
          "Recruitment Dashboard API Error:",
          error
        );

        console.error(
          "Response:",
          error.response?.data
        );

        setD(false);
      });
  }, []);

  // =========================================================
  // EXPORT
  // =========================================================
  const exportCsv = (kind) => {
    const url = `${API}/reports/export?kind=${kind}&auth=${getToken()}`;

    window.open(
      url.replace(
        "&auth=",
        `&_t=${Date.now()}&auth=`
      ),
      "_blank"
    );

    api
      .get(`/reports/export?kind=${kind}`, {
        responseType: "blob",
      })
      .then((res) => {
        const blob = new Blob([res.data], {
          type: "text/csv",
        });

        const link = document.createElement("a");

        link.href = URL.createObjectURL(blob);
        link.download = `${kind}_report.csv`;

        link.click();

        URL.revokeObjectURL(link.href);
      })
      .catch((error) => {
        console.error(
          "Export error:",
          error
        );
      });
  };

  // =========================================================
  // LOADING
  // =========================================================
  if (d === false) {
    return (
      <div className="text-sm text-slate-500">
        Recruitment analytics will appear once your
        organization has hiring activity.
      </div>
    );
  }

  if (!d) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
        <CardsSkeleton />
      </div>
    );
  }

  // =========================================================
  // OVERVIEW
  // =========================================================
  const o = d.overview || {};

  // =========================================================
  // JOB PERFORMANCE
  // =========================================================
  const jobs = d.job_performance?.jobs || [];

  // =========================================================
  // CANDIDATE QUALITY
  // =========================================================
  const candidateQuality =
    d.candidate_quality || {};

  const distribution =
    candidateQuality.score_distribution || {};

  const qualityChartData = [
    {
      band: "90-100",
      count: distribution.score_90_100 || 0,
    },
    {
      band: "80-89",
      count: distribution.score_80_89 || 0,
    },
    {
      band: "70-79",
      count: distribution.score_70_79 || 0,
    },
    {
      band: "60-69",
      count: distribution.score_60_69 || 0,
    },
    {
      band: "<60",
      count: distribution.below_60 || 0,
    },
  ];

  // =========================================================
  // FUNNEL
  // =========================================================
  const funnel = d.funnel || {};

  const funnelData = [
    {
      stage: "Applications",
      count: funnel.applications || 0,
    },
    {
      stage: "Matched",
      count: funnel.matched || 0,
    },
    {
      stage: "Screened",
      count: funnel.screened || 0,
    },
    {
      stage: "Shortlisted",
      count: funnel.shortlisted || 0,
    },
    {
      stage: "Interview",
      count: funnel.interviewed || 0,
    },
    {
      stage: "Finalist",
      count: funnel.finalists || 0,
    },
    {
      stage: "Selected",
      count: funnel.selected || 0,
    },
  ];

  // =========================================================
  // SOURCES
  // =========================================================
  const sources =
    d.sources?.sources || [];

  // =========================================================
  // RECRUITERS
  // =========================================================
  const recruiters =
    d.recruiters?.recruiters || [];

  // =========================================================
  // SKILL GAP
  // =========================================================
  const requestedSkills =
    d.skill_gap?.most_requested_skills || [];

  const candidateGaps =
    d.skill_gap?.candidate_gaps || [];

  // =========================================================
  // JOB HEALTH
  // =========================================================
  const jobHealth =
    d.job_health || [];

  return (
    <div className="space-y-6">

      {/* =====================================================
          HEADER
      ====================================================== */}
      <div className="flex items-center justify-between flex-wrap gap-3">

        <div>
          <h1 className="font-display font-extrabold text-3xl text-[#0a2540]">
            Recruitment Intelligence
          </h1>

          <p className="text-slate-500 mt-1">
            Insights across jobs, candidates, funnel and
            hiring performance.
          </p>
        </div>

        {can("export_reports") && (
          <div className="flex gap-2">

            <Button
              variant="outline"
              data-testid="export-overview-btn"
              onClick={() =>
                exportCsv("overview")
              }
            >
              <Download className="h-4 w-4 mr-2" />
              Export Overview
            </Button>

            <Button
              variant="outline"
              data-testid="export-jobperf-btn"
              onClick={() =>
                exportCsv("job_performance")
              }
            >
              <Download className="h-4 w-4 mr-2" />
              Export Job Performance
            </Button>

          </div>
        )}
      </div>

      {/* =====================================================
          TABS
      ====================================================== */}
      <Tabs defaultValue="overview">

        <TabsList className="bg-white border border-slate-200 flex-wrap h-auto">

          {[
            ["overview", "Overview"],
            ["jobs", "Job Performance"],
            ["funnel", "Funnel"],
            ["quality", "Candidate Quality"],
            ["sources", "Sources"],
            ["time", "Time to Hire"],
            ["recruiters", "Recruiters"],
            ["skills", "Skill Gap"],
            ["health", "Job Health"],
          ].map(([value, label]) => (
            <TabsTrigger
              key={value}
              value={value}
              data-testid={`rtab-${value}`}
              className="
                data-[state=active]:bg-[#1e5bff]
                data-[state=active]:text-white
                text-xs
              "
            >
              {label}
            </TabsTrigger>
          ))}

        </TabsList>

        {/* ===================================================
            OVERVIEW
        ==================================================== */}
        <TabsContent
          value="overview"
          className="mt-4 space-y-4"
        >

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">

            <KPICard
              label="Total Jobs"
              value={o.total_jobs || 0}
            />

            <KPICard
              label="Active Jobs"
              value={o.active_jobs || 0}
              accent="text-emerald-500"
            />

            <KPICard
              label="Applications"
              value={o.applications || 0}
            />

            <KPICard
              label="Matched"
              value={o.matched || 0}
              accent="text-teal-500"
            />

            <KPICard
              label="Shortlisted"
              value={o.shortlisted || 0}
            />

            <KPICard
              label="Interviews"
              value={o.interviews || 0}
              accent="text-amber-500"
            />

            <KPICard
              label="Finalists"
              value={o.finalists || 0}
            />

            <KPICard
              label="Selected"
              value={o.selected || 0}
              accent="text-emerald-500"
            />

            <KPICard
              label="Rejected"
              value={o.rejected || 0}
              accent="text-red-500"
            />

            {/* FIXED: conversione -> conversion */}
            <KPICard
              label="Conversion"
              value={`${o.conversion || 0}%`}
              accent="text-[#1e5bff]"
            />

            <KPICard
              label="Avg ATS"
              value={o.avg_ats || 0}
            />

            <KPICard
              label="Time to Hire"
              value={`${o.time_to_hire || 0}d`}
            />

          </div>
        </TabsContent>

        {/* ===================================================
            JOB PERFORMANCE
        ==================================================== */}
        <TabsContent
          value="jobs"
          className="mt-4"
        >

          <Card className="border-slate-200 shadow-sm overflow-hidden">

            <div className="overflow-x-auto">

              <table className="w-full text-sm">

                <thead className="bg-slate-50 text-slate-500">

                  <tr className="text-left">

                    {[
                      "Job",
                      "Dept",
                      "Apps",
                      "Matched",
                      "Match Rate",
                      "Shortlist",
                      "Interviews",
                      "Selected",
                      "Avg ATS",
                      "Days Open",
                      "Conversion",
                    ].map((h) => (
                      <th
                        key={h}
                        className="
                          px-3 py-3
                          font-semibold
                          text-xs
                          uppercase
                          whitespace-nowrap
                        "
                      >
                        {h}
                      </th>
                    ))}

                  </tr>

                </thead>

                <tbody>

                  {jobs.map((j) => (

                    <tr
                      key={j.job_id}
                      className="
                        border-t
                        border-slate-100
                        hover:bg-slate-50
                      "
                    >

                      <td className="px-3 py-3 font-medium text-[#0a2540]">
                        {j.job_title || "—"}
                      </td>

                      <td className="px-3 py-3 text-slate-600">
                        {j.department || "—"}
                      </td>

                      <td className="px-3 py-3">
                        {j.applications || 0}
                      </td>

                      <td className="px-3 py-3">
                        {j.matched || 0}
                      </td>

                      <td className="px-3 py-3">
                        {j.match_rate || 0}%
                      </td>

                      <td className="px-3 py-3">
                        {j.shortlisted || 0}
                      </td>

                      <td className="px-3 py-3">
                        {j.interviews || 0}
                      </td>

                      <td className="px-3 py-3">
                        {j.selected || 0}
                      </td>

                      <td className="px-3 py-3">
                        {j.avg_ats || 0}
                      </td>

                      <td className="px-3 py-3">
                        {j.days_open || 0}
                      </td>

                      <td className="px-3 py-3">
                        {j.conversion || 0}%
                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          </Card>

        </TabsContent>

        {/* ===================================================
            FUNNEL
        ==================================================== */}
        <TabsContent
          value="funnel"
          className="mt-4"
        >

          <Card className="border-slate-200 shadow-sm p-6 space-y-2">

            {funnelData.map((f, i) => {

              const max =
                funnelData[0]?.count || 1;

              const width =
                Math.max(
                  6,
                  (f.count / max) * 100
                );

              const conversion =
                max > 0
                  ? (f.count / max) * 100
                  : 0;

              const dropoff =
                100 - conversion;

              return (

                <div
                  key={f.stage}
                  className="flex items-center gap-3"
                >

                  <div className="w-24 text-sm font-medium text-slate-600">
                    {f.stage}
                  </div>

                  <div className="flex-1 h-9 bg-slate-100 rounded-md overflow-hidden">

                    <div
                      className="
                        h-full
                        flex
                        items-center
                        px-3
                        text-white
                        text-sm
                        font-semibold
                      "
                      style={{
                        width: `${width}%`,
                        background:
                          funnelColors[i],
                      }}
                    >
                      {f.count}
                    </div>

                  </div>

                  <div className="w-28 text-right text-xs">

                    <span className="text-emerald-600 font-semibold">
                      {conversion.toFixed(1)}%
                    </span>

                    <span className="text-slate-400 ml-2 inline-flex items-center gap-0.5">

                      <TrendingDown className="h-3 w-3" />

                      {dropoff.toFixed(1)}%

                    </span>

                  </div>

                </div>

              );
            })}

          </Card>

        </TabsContent>

        {/* ===================================================
            CANDIDATE QUALITY
        ==================================================== */}
        <TabsContent
          value="quality"
          className="mt-4 grid md:grid-cols-2 gap-4"
        >

          <Card className="border-slate-200 shadow-sm p-6">

            <h3 className="font-display font-bold text-lg text-[#0a2540] mb-3">
              Score Distribution
            </h3>

          <ResponsiveContainer
  width="100%"
  height={240}
>
  <BarChart
    data={qualityChartData}
    margin={{
      top: 10,
      right: 10,
      left: 0,
      bottom: 5,
    }}
  >
    <CartesianGrid
      strokeDasharray="3 3"
      vertical={false}
      stroke="#e2e8f0"
    />

    <XAxis
      dataKey="band"
      tick={{
        fontSize: 11,
        fill: "#64748b",
      }}
      axisLine={{
        stroke: "#94a3b8",
      }}
      tickLine={false}
    />

    <YAxis
      tick={{
        fontSize: 11,
        fill: "#64748b",
      }}
      axisLine={{
        stroke: "#94a3b8",
      }}
      tickLine={false}
      allowDecimals={false}
    />

    <Tooltip
      cursor={{
        fill: "#f1f5f9",
      }}
      contentStyle={{
        backgroundColor: "#ffffff",
        border: "1px solid #cbd5e1",
        borderRadius: "4px",
        padding: "10px 12px",
        boxShadow:
          "0 2px 6px rgba(0,0,0,0.08)",
      }}
      labelStyle={{
        color: "#0a2540",
        fontWeight: 600,
      }}
      formatter={(value) => [
        value,
        "count",
      ]}
    />

    <Bar
      dataKey="count"
      radius={[
        5,
        5,
        0,
        0,
      ]}
      barSize={80}
    >
      {qualityChartData.map(
        (_, index) => (
          <Cell
            key={`quality-cell-${index}`}
            fill={qualityColors[index]}
          />
        )
      )}
    </Bar>
  </BarChart>
</ResponsiveContainer>

          </Card>

          <Card className="border-slate-200 shadow-sm p-6 grid grid-cols-2 gap-3 content-start">

            <div className="rounded-lg bg-slate-50 p-4">

              <div className="text-xs text-slate-500">
                Avg ATS
              </div>

              <div className="text-2xl font-bold text-[#0a2540]">
                {candidateQuality.average_ats_score || 0}
              </div>

            </div>

            <div className="rounded-lg bg-slate-50 p-4">

              <div className="text-xs text-slate-500">
                Avg Match
              </div>

              <div className="text-2xl font-bold text-emerald-600">
                {candidateQuality.average_match_score || 0}
              </div>

            </div>

            <div className="rounded-lg bg-emerald-50 p-4">

              <div className="text-xs text-emerald-600">
                Above 90
              </div>

              <div className="text-2xl font-bold text-emerald-700">
                {candidateQuality.above_90 || 0}
              </div>

            </div>

            <div className="rounded-lg bg-red-50 p-4">

              <div className="text-xs text-red-600">
                Below 60
              </div>

              <div className="text-2xl font-bold text-red-700">
                {candidateQuality.below_60 || 0}
              </div>

            </div>

          </Card>

        </TabsContent>

        {/* ===================================================
            SOURCES
        ==================================================== */}
        <TabsContent
          value="sources"
          className="mt-4"
        >

          <Card className="border-slate-200 shadow-sm overflow-hidden">

            <div className="overflow-x-auto">

              <table className="w-full text-sm">

                <thead className="bg-slate-50 text-slate-500">

                  <tr className="text-left">

                    {[
                      "Source",
                      "Applications",
                      "Shortlisted",
                      "Interviews",
                      "Hires",
                      "Conversion",
                    ].map((h) => (
                      <th
                        key={h}
                        className="
                          px-4
                          py-3
                          font-semibold
                          text-xs
                          uppercase
                        "
                      >
                        {h}
                      </th>
                    ))}

                  </tr>

                </thead>

                <tbody>

                  {sources.map((s) => (

                    <tr
                      key={s.source}
                      className="
                        border-t
                        border-slate-100
                        hover:bg-slate-50
                      "
                    >

                      <td className="px-4 py-3 font-medium text-[#0a2540]">
                        {s.source || "Unknown"}
                      </td>

                      <td className="px-4 py-3">
                        {s.applications || 0}
                      </td>

                      <td className="px-4 py-3">
                        {s.shortlisted || 0}
                      </td>

                      <td className="px-4 py-3">
                        {s.interviews || 0}
                      </td>

                      <td className="px-4 py-3">
                        {s.hires || 0}
                      </td>

                      <td className="px-4 py-3">
                        {s.conversion || 0}%
                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          </Card>

        </TabsContent>

        {/* ===================================================
            TIME TO HIRE
        ==================================================== */}
        <TabsContent
          value="time"
          className="mt-4"
        >

          <Card className="border-slate-200 shadow-sm p-6">

            <div className="mb-4">

              <span className="text-xs font-bold uppercase text-slate-500">
                Average Time to Hire
              </span>

              <div className="text-3xl font-bold text-[#0a2540]">
                {d.time_to_hire?.average_time_to_hire || 0} days
              </div>

            </div>

            <div className="space-y-2">

              {[
                [
                  "Job → First Application",
                  d.time_to_hire?.job_to_first_application,
                ],
                [
                  "Application → Screening",
                  d.time_to_hire?.application_to_screening,
                ],
                [
                  "Screening → Shortlist",
                  d.time_to_hire?.screening_to_shortlist,
                ],
                [
                  "Shortlist → Interview",
                  d.time_to_hire?.shortlist_to_interview,
                ],
                [
                  "Interview → Selection",
                  d.time_to_hire?.interview_to_selection,
                ],
              ].map(([stage, days]) => {

                const value = days || 0;

                const width =
                  value > 0
                    ? Math.min(
                        100,
                        Math.max(
                          6,
                          value * 8
                        )
                      )
                    : 6;

                return (

                  <div
                    key={stage}
                    className="flex items-center gap-3"
                  >

                    <div className="w-56 text-sm text-slate-600">
                      {stage}
                    </div>

                    <div className="flex-1 h-6 bg-slate-100 rounded">

                      <div
                        className="
                          h-full
                          bg-[#17b6c7]
                          rounded
                          flex
                          items-center
                          px-2
                          text-white
                          text-xs
                        "
                        style={{
                          width: `${width}%`,
                        }}
                      >
                        {value}d
                      </div>

                    </div>

                  </div>

                );
              })}

            </div>

          </Card>

        </TabsContent>

        {/* ===================================================
            RECRUITERS
        ==================================================== */}
        <TabsContent
          value="recruiters"
          className="mt-4"
        >

          <Card className="border-slate-200 shadow-sm overflow-hidden">

            <div className="overflow-x-auto">

              <table className="w-full text-sm">

                <thead className="bg-slate-50 text-slate-500">

                  <tr className="text-left">

                    {[
                      "Recruiter",
                      "Jobs",
                      "Applications",
                      "Shortlisted",
                      "Interviews",
                      "Selected",
                      "Avg Days",
                      "Conversion",
                    ].map((h) => (
                      <th
                        key={h}
                        className="
                          px-4
                          py-3
                          font-semibold
                          text-xs
                          uppercase
                        "
                      >
                        {h}
                      </th>
                    ))}

                  </tr>

                </thead>

                <tbody>

                  {recruiters.map((r) => (

                    <tr
                      key={r.recruiter_id}
                      className="
                        border-t
                        border-slate-100
                        hover:bg-slate-50
                      "
                    >

                      <td className="px-4 py-3 font-medium text-[#0a2540]">
                        {r.recruiter_name || "—"}
                      </td>

                      <td className="px-4 py-3">
                        {r.jobs || 0}
                      </td>

                      <td className="px-4 py-3">
                        {r.applications || 0}
                      </td>

                      <td className="px-4 py-3">
                        {r.shortlisted || 0}
                      </td>

                      <td className="px-4 py-3">
                        {r.interviews || 0}
                      </td>

                      <td className="px-4 py-3">
                        {r.selected || 0}
                      </td>

                      <td className="px-4 py-3">
                        {r.avg_days || 0}
                      </td>

                      <td className="px-4 py-3">
                        {r.conversion || 0}%
                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          </Card>

        </TabsContent>

        {/* ===================================================
            SKILL GAP
        ==================================================== */}
        <TabsContent
          value="skills"
          className="mt-4 grid md:grid-cols-2 gap-4"
        >

          {/* MOST REQUESTED SKILLS */}
          <Card className="border-slate-200 shadow-sm p-6">

            <h3 className="font-display font-bold text-lg text-[#0a2540] mb-3">
              Most Requested Skills
            </h3>

            <div className="space-y-2">

              {requestedSkills.map((s) => {

                const max =
                  requestedSkills[0]?.count ||
                  1;

                return (

                  <div
                    key={s.skill}
                    className="flex items-center gap-3"
                  >

                    <div className="w-28 text-sm text-slate-600">
                      {s.skill}
                    </div>

                    <div className="flex-1 h-5 bg-slate-100 rounded">

                      <div
                        className="
                          h-full
                          bg-[#1e5bff]
                          rounded
                        "
                        style={{
                          width: `${
                            (s.count / max) *
                            100
                          }%`,
                        }}
                      />

                    </div>

                    <span className="text-xs text-slate-500 w-6">
                      {s.count}
                    </span>

                  </div>

                );
              })}

            </div>

          </Card>

          {/* CANDIDATE GAPS */}
          <Card className="border-slate-200 shadow-sm p-6">

            <h3 className="font-display font-bold text-lg text-[#0a2540] mb-3">
              Most Common Candidate Gaps
            </h3>

            <div className="space-y-2">

              {candidateGaps.map((s) => {

                const max =
                  candidateGaps[0]?.count ||
                  1;

                return (

                  <div
                    key={s.skill}
                    className="flex items-center gap-3"
                  >

                    <div className="w-28 text-sm text-slate-600">
                      {s.skill}
                    </div>

                    <div className="flex-1 h-5 bg-slate-100 rounded">

                      <div
                        className="
                          h-full
                          bg-red-400
                          rounded
                        "
                        style={{
                          width: `${
                            (s.count / max) *
                            100
                          }%`,
                        }}
                      />

                    </div>

                    <span className="text-xs text-slate-500 w-6">
                      {s.count}
                    </span>

                  </div>

                );
              })}

            </div>

          </Card>

        </TabsContent>

        {/* ===================================================
            JOB HEALTH
        ==================================================== */}
        <TabsContent
          value="health"
          className="mt-4"
        >

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">

            {jobHealth.map((job) => (

              <Card
                key={job.job_id}
                className="border-slate-200 shadow-sm p-5"
              >

                <div className="flex items-center justify-between mb-2">

                  <span className="font-medium text-[#0a2540]">
                    {job.job_title}
                  </span>

                  <StatusBadge
                    status={job.health_status}
                  />

                </div>

                <p className="text-xs text-slate-500">
                  {job.applications || 0} applications,{" "}
                  {job.qualified_matches || 0} qualified
                  matches, avg score{" "}
                  {job.average_score || 0},{" "}
                  {job.days_open || 0} days open
                </p>

              </Card>

            ))}

          </div>

        </TabsContent>

      </Tabs>

    </div>
  );
}