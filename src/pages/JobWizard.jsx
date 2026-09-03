import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { api, formatApiError } from "@/lib/api";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

import {
  Check,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Save,
} from "lucide-react";

import { toast } from "sonner";

const STEPS = [
  "Basic Information",
  "Job Description",
  "Requirements",
  "Screening Questions",
  "ATS Configuration",
  "Review & Publish",
];

/*
 * --------------------------------------------------
 * MANUAL RECRUITERS
 * --------------------------------------------------
 *
 * These are static/manual dropdown options.
 *
 * IMPORTANT:
 * If your backend expects real UUIDs, replace the
 * IDs below with the actual recruiter UUIDs.
 */

const RECRUITERS = [
  {
    id: "recruiter-1",
    name: "Kavinashri G",
  },
  {
    id: "recruiter-2",
    name: "Priya Sharma",
  },
  {
    id: "recruiter-3",
    name: "Rahul Kumar",
  },
];

/*
 * --------------------------------------------------
 * MANUAL HIRING MANAGERS
 * --------------------------------------------------
 */

const HIRING_MANAGERS = [
  {
    id: "manager-1",
    name: "Santhosh A",
  },
  {
    id: "manager-2",
    name: "Arun Kumar",
  },
  {
    id: "manager-3",
    name: "Divya Raj",
  },
];

const ATS_KEYS = [
  ["skills", "Skills"],
  ["experience", "Experience"],
  ["education", "Education"],
  ["role_relevance", "Role Relevance"],
  ["screening", "Screening Questions"],
  ["certifications", "Certifications"],
];

/*
 * --------------------------------------------------
 * TAG INPUT
 * --------------------------------------------------
 */

function TagInput({
  value,
  onChange,
  placeholder,
  testId,
}) {
  const [input, setInput] = useState("");

  const add = () => {
    const trimmed = input.trim();

    if (!trimmed) {
      return;
    }

    onChange([...value, trimmed]);
    setInput("");
  };

  return (
    <div>
      <div className="flex gap-2">
        <Input
          data-testid={testId}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
        />

        <Button
          type="button"
          variant="outline"
          onClick={add}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 mt-2">
        {value.map((t, i) => (
          <span
            key={`${t}-${i}`}
            className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700"
          >
            {t}

            <button
              type="button"
              onClick={() =>
                onChange(
                  value.filter((_, x) => x !== i)
                )
              }
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}

/*
 * ==================================================
 * JOB WIZARD
 * ==================================================
 */

export default function JobWizard() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    company_name: "MyMentor",

    title: "",
    department: "",

    /*
     * job_type = role/category
     * employment_type = Full-time/Part-time/etc.
     *
     * API currently receives employment_type as job_type.
     */
    job_type: "Individual Contributor",
    employment_type: "Full-time",

    location: "",
    work_mode: "On-site",

    min_experience: 2,
    max_experience: 6,
    openings: 1,

    salary_min: 800000,
    salary_max: 1800000,

    recruiter_id: "",
    recruiter_name: "",

    hiring_manager_id: "",
    hiring_manager_name: "",

    summary: "",
    description: "",

    responsibilities: [],
    required_skills: [],
    preferred_skills: [],

    education: "bachelors",

    mandatory_requirements: [],
    preferred_requirements: [],

    screening_questions: [],

    ats_config: {
      skills: 30,
      experience: 20,
      education: 15,
      role_relevance: 20,
      screening: 10,
      certifications: 5,
    },

    apply_email: "",

    status: "draft",
  });

  /*
   * ==================================================
   * LOAD EXISTING JOB
   * ==================================================
   *
   * No /users API call here.
   *
   * Recruiter and Hiring Manager are manual dropdowns.
   */

  useEffect(() => {
    if (!id) {
      return;
    }

    api
      .get(`/jobs/${id}`)
      .then((r) => {
        const data = r.data || {};

        setForm((f) => ({
          ...f,

          ...data,

          company_name:
            data.company_name ?? f.company_name,

          title:
            data.title ?? f.title,

          department:
            data.department ?? f.department,

          employment_type:
            data.employment_type ??
            data.job_type ??
            f.employment_type,

          job_type:
            data.job_type ??
            f.job_type,

          location:
            data.location ?? f.location,

          work_mode:
            data.work_mode ?? f.work_mode,

          min_experience:
            data.min_experience ??
            f.min_experience,

          max_experience:
            data.max_experience ??
            f.max_experience,

          openings:
            data.openings ?? f.openings,

          salary_min:
            data.salary_min ?? f.salary_min,

          salary_max:
            data.salary_max ?? f.salary_max,

          recruiter_id:
            data.recruiter_id ?? "",

          recruiter_name:
            data.recruiter_name ?? "",

          hiring_manager_id:
            data.hiring_manager_id ?? "",

          hiring_manager_name:
            data.hiring_manager_name ?? "",

          summary:
            data.summary ?? f.summary,

          description:
            data.description ?? f.description,

          responsibilities:
            Array.isArray(data.responsibilities)
              ? data.responsibilities
              : f.responsibilities,

          required_skills:
            Array.isArray(data.required_skills)
              ? data.required_skills
              : f.required_skills,

          preferred_skills:
            Array.isArray(data.preferred_skills)
              ? data.preferred_skills
              : f.preferred_skills,

          education:
            data.education ?? f.education,

          mandatory_requirements:
            Array.isArray(data.mandatory_requirements)
              ? data.mandatory_requirements
              : f.mandatory_requirements,

          preferred_requirements:
            Array.isArray(data.preferred_requirements)
              ? data.preferred_requirements
              : f.preferred_requirements,

          screening_questions:
            Array.isArray(data.screening_questions)
              ? data.screening_questions.map((q) => ({
                  id:
                    q.id ||
                    crypto.randomUUID(),

                  type:
                    q.question_type ||
                    q.type ||
                    "yes_no",

                  text:
                    q.question ||
                    q.text ||
                    "",

                  mandatory:
                    q.required ??
                    q.mandatory ??
                    true,

                  options:
                    Array.isArray(q.options)
                      ? q.options
                      : [],
                }))
              : f.screening_questions,

          ats_config: {
            ...f.ats_config,

            ...(data.ats_configuration || {}),

            screening:
              data.ats_configuration
                ?.screening_questions ??
              data.ats_configuration
                ?.screening ??
              f.ats_config.screening,
          },

          apply_email:
            data.apply_email ??
            f.apply_email,

          status:
            data.status ?? f.status,
        }));
      })
      .catch((error) => {
        console.error(
          "Load job error:",
          error.response?.data || error
        );

        toast.error("Failed to load job.");
      });
  }, [id]);

  /*
   * ==================================================
   * GENERIC FORM SETTER
   * ==================================================
   */

  const set = (key, value) => {
    setForm((f) => ({
      ...f,
      [key]: value,
    }));
  };

  /*
   * ==================================================
   * ATS TOTAL
   * ==================================================
   */

  const atsTotal = Object.values(
    form.ats_config
  ).reduce((a, b) => a + Number(b || 0), 0);

  /*
   * ==================================================
   * SAVE / PUBLISH
   * ==================================================
   */

  const save = async (status) => {
    if (!form.company_name?.trim()) {
      toast.error("Company name is required.");
      return;
    }

    if (!form.title?.trim()) {
      toast.error("Job title is required.");
      return;
    }

    if (status === "active" && atsTotal !== 100) {
      toast.error(
        "ATS weights must total 100% before publishing."
      );
      return;
    }

    setSaving(true);

    const payload = {
      company_name:
        form.company_name.trim(),

      title:
        form.title.trim(),

      department:
        form.department || "",

      /*
       * Backend expects job_type to contain
       * Full-time / Part-time / Contract / Internship.
       */
      job_type:
        form.employment_type || "Full-time",

      location:
        form.location || "",

      work_mode:
        form.work_mode || "On-site",

      min_experience:
        Number(form.min_experience) || 0,

      max_experience:
        Number(form.max_experience) || 0,

      openings:
        Number(form.openings) || 1,

      salary_min:
        Number(form.salary_min) || 0,

      salary_max:
        Number(form.salary_max) || 0,

      /*
       * Manual recruiter dropdown
       */
      recruiter_id: null,

      /*
       * Manual hiring manager dropdown
       */
      hiring_manager_id: null,

      summary:
        form.summary || "",

      description:
        form.description || "",

      responsibilities:
        form.responsibilities || [],

      required_skills:
        form.required_skills || [],

      preferred_skills:
        form.preferred_skills || [],

      education:
        form.education || "",

      mandatory_requirements:
        form.mandatory_requirements || [],

      preferred_requirements:
        form.preferred_requirements || [],

      screening_questions: (
        form.screening_questions || []
      ).map((q) => ({
        question:
          q.text || "",

        question_type:
          q.type || "yes_no",

        required:
          Boolean(q.mandatory),

        options:
          Array.isArray(q.options) &&
          q.options.length > 0
            ? q.options
            : q.type === "yes_no"
              ? ["Yes", "No"]
              : [],
      })),

      ats_configuration: {
        skills:
          Number(form.ats_config.skills) || 0,

        experience:
          Number(form.ats_config.experience) || 0,

        education:
          Number(form.ats_config.education) || 0,

        role_relevance:
          Number(
            form.ats_config.role_relevance
          ) || 0,

        screening_questions:
          Number(
            form.ats_config.screening
          ) || 0,

        certifications:
          Number(
            form.ats_config.certifications
          ) || 0,
      },

      apply_email:
        form.apply_email || "",

      /*
       * Backend accepts:
       * draft
       * active
       * closed
       * paused
       */
      status,
    };

    console.log(
      "Job API payload:",
      payload
    );

    try {
      if (id) {
        await api.put(
          `/jobs/${id}`,
          payload
        );
      } else {
        await api.post(
          "/organizations/me/jobs",
          payload
        );
      }

      toast.success(
        status === "active"
          ? "Job published!"
          : "Draft saved"
      );

      navigate("/jobs");
    } catch (e) {
      console.error(
        "Save job error:",
        e.response?.data || e
      );

      const detail =
        e.response?.data?.detail;

      toast.error(
        formatApiError(detail) ||
          e.response?.data?.message ||
          "Failed to save job."
      );
    } finally {
      setSaving(false);
    }
  };

  /*
   * ==================================================
   * SCREENING QUESTIONS
   * ==================================================
   */

  const addQuestion = () => {
    set(
      "screening_questions",
      [
        ...form.screening_questions,

        {
          id: crypto.randomUUID(),

          type: "yes_no",

          text: "",

          mandatory: true,

          options: [
            "Yes",
            "No",
          ],
        },
      ]
    );
  };

  const updateQ = (
    index,
    key,
    value
  ) => {
    const questions = [
      ...form.screening_questions,
    ];

    questions[index] = {
      ...questions[index],
      [key]: value,
    };

    if (
      key === "type" &&
      value === "yes_no"
    ) {
      questions[index].options = [
        "Yes",
        "No",
      ];
    }

    if (
      key === "type" &&
      value !== "yes_no"
    ) {
      questions[index].options = [];
    }

    set(
      "screening_questions",
      questions
    );
  };

  /*
   * ==================================================
   * RENDER
   * ==================================================
   */

  return (
    <div className="space-y-6 max-w-4xl">

      {/* =========================================
          HEADER
      ========================================= */}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-[#0a2540]">
            {id
              ? "Edit Job Description"
              : "New Job Description"}
          </h1>

          <p className="text-slate-500 text-sm mt-0.5">
            Step {step + 1} of {STEPS.length}:{" "}
            {STEPS[step]}
          </p>
        </div>

        <Button
          variant="outline"
          data-testid="save-draft-btn"
          onClick={() => save("draft")}
          disabled={saving}
        >
          <Save className="h-4 w-4 mr-2" />
          Save Draft
        </Button>
      </div>

      {/* =========================================
          PROGRESS
      ========================================= */}

      <div className="flex items-center">
        {STEPS.map((s, i) => (
          <div
            key={s}
            className="flex items-center flex-1 last:flex-none"
          >
            <button
              type="button"
              onClick={() => setStep(i)}
              className="flex items-center gap-2 shrink-0"
            >
              <div
                className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors duration-200",

                  i < step
                    ? "bg-emerald-500 text-white"
                    : i === step
                      ? "bg-[#1e5bff] text-white"
                      : "bg-slate-200 text-slate-500"
                )}
              >
                {i < step ? (
                  <Check className="h-4 w-4" />
                ) : (
                  i + 1
                )}
              </div>

              <span
                className={cn(
                  "text-xs font-medium hidden md:block",

                  i === step
                    ? "text-[#0a2540]"
                    : "text-slate-400"
                )}
              >
                {s}
              </span>
            </button>

            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  "h-0.5 flex-1 mx-2",

                  i < step
                    ? "bg-emerald-500"
                    : "bg-slate-200"
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* =========================================
          MAIN CARD
      ========================================= */}

      <Card
        className="border-slate-200 shadow-sm p-6"
        data-testid="wizard-card"
      >

        {/* =========================================
            STEP 0 - BASIC INFORMATION
        ========================================= */}

        {step === 0 && (
          <div className="grid grid-cols-2 gap-4">

            {/* Company Name */}

            <div className="space-y-1 col-span-2">
              <Label>
                Company Name
              </Label>

              <Input
                data-testid="company-name-input"
                value={form.company_name}
                onChange={(e) =>
                  set(
                    "company_name",
                    e.target.value
                  )
                }
                placeholder="e.g. MyMentor"
              />
            </div>

            {/* Job Title */}

            <div className="space-y-1 col-span-2">
              <Label>
                Job Title
              </Label>

              <Input
                data-testid="job-title-input"
                value={form.title}
                onChange={(e) =>
                  set(
                    "title",
                    e.target.value
                  )
                }
                placeholder="e.g. Senior Frontend Engineer"
              />
            </div>

            {/* Department */}

            <div className="space-y-1">
              <Label>
                Department
              </Label>

              <Input
                data-testid="job-dept-input"
                value={form.department}
                onChange={(e) =>
                  set(
                    "department",
                    e.target.value
                  )
                }
                placeholder="e.g. Engineering"
              />
            </div>

            {/* Employment Type */}

            <div className="space-y-1">
              <Label>
                Employment Type
              </Label>

              <Select
                value={
                  form.employment_type
                }
                onValueChange={(v) =>
                  set(
                    "employment_type",
                    v
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select employment type" />
                </SelectTrigger>

                <SelectContent>
                  {[
                    "Full-time",
                    "Part-time",
                    "Contract",
                    "Internship",
                  ].map((t) => (
                    <SelectItem
                      key={t}
                      value={t}
                    >
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Location */}

            <div className="space-y-1">
              <Label>
                Location
              </Label>

              <Input
                value={form.location}
                onChange={(e) =>
                  set(
                    "location",
                    e.target.value
                  )
                }
                placeholder="e.g. Chennai"
              />
            </div>

            {/* Work Mode */}

            <div className="space-y-1">
              <Label>
                Work Mode
              </Label>

              <Select
                value={form.work_mode}
                onValueChange={(v) =>
                  set(
                    "work_mode",
                    v
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  {[
                    "On-site",
                    "Hybrid",
                    "Remote",
                  ].map((t) => (
                    <SelectItem
                      key={t}
                      value={t}
                    >
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Min Experience */}

            <div className="space-y-1">
              <Label>
                Min Experience (yrs)
              </Label>

              <Input
                type="number"
                min="0"
                value={form.min_experience}
                onChange={(e) =>
                  set(
                    "min_experience",
                    Number(e.target.value)
                  )
                }
              />
            </div>

            {/* Max Experience */}

            <div className="space-y-1">
              <Label>
                Max Experience (yrs)
              </Label>

              <Input
                type="number"
                min="0"
                value={form.max_experience}
                onChange={(e) =>
                  set(
                    "max_experience",
                    Number(e.target.value)
                  )
                }
              />
            </div>

            {/* Openings */}

            <div className="space-y-1">
              <Label>
                Number of Openings
              </Label>

              <Input
                type="number"
                min="1"
                value={form.openings}
                onChange={(e) =>
                  set(
                    "openings",
                    Number(e.target.value)
                  )
                }
              />
            </div>

            {/* Salary Min */}

            <div className="space-y-1">
              <Label>
                Salary Min
              </Label>

              <Input
                type="number"
                min="0"
                value={form.salary_min}
                onChange={(e) =>
                  set(
                    "salary_min",
                    Number(e.target.value)
                  )
                }
              />
            </div>

            {/* Salary Max */}

            <div className="space-y-1">
              <Label>
                Salary Max
              </Label>

              <Input
                type="number"
                min="0"
                value={form.salary_max}
                onChange={(e) =>
                  set(
                    "salary_max",
                    Number(e.target.value)
                  )
                }
              />
            </div>

            {/* =====================================
                RECRUITER - MANUAL DROPDOWN
            ===================================== */}

            <div className="space-y-1">
              <Label>
                Recruiter
              </Label>

              <Select
                value={
                  form.recruiter_id || ""
                }
                onValueChange={(value) => {
                  const recruiter =
                    RECRUITERS.find(
                      (item) =>
                        item.id === value
                    );

                  set(
                    "recruiter_id",
                    recruiter?.id || ""
                  );

                  set(
                    "recruiter_name",
                    recruiter?.name || ""
                  );
                }}
              >
                <SelectTrigger
                  data-testid="job-recruiter-select"
                  className="w-full"
                >
                  <SelectValue placeholder="Assign recruiter" />
                </SelectTrigger>

                <SelectContent>
                  {RECRUITERS.map(
                    (recruiter) => (
                      <SelectItem
                        key={recruiter.id}
                        value={recruiter.id}
                      >
                        {recruiter.name}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* =====================================
                HIRING MANAGER - MANUAL DROPDOWN
            ===================================== */}

            <div className="space-y-1">
              <Label>
                Hiring Manager
              </Label>

              <Select
                value={
                  form.hiring_manager_id ||
                  ""
                }
                onValueChange={(value) => {
                  const manager =
                    HIRING_MANAGERS.find(
                      (item) =>
                        item.id === value
                    );

                  set(
                    "hiring_manager_id",
                    manager?.id || ""
                  );

                  set(
                    "hiring_manager_name",
                    manager?.name || ""
                  );
                }}
              >
                <SelectTrigger
                  data-testid="job-hiring-manager-select"
                  className="w-full"
                >
                  <SelectValue placeholder="Assign manager" />
                </SelectTrigger>

                <SelectContent>
                  {HIRING_MANAGERS.map(
                    (manager) => (
                      <SelectItem
                        key={manager.id}
                        value={manager.id}
                      >
                        {manager.name}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* =========================================
            STEP 1 - JOB DESCRIPTION
        ========================================= */}

        {step === 1 && (
          <div className="space-y-4">

            {/* Summary */}

            <div className="space-y-1">
              <Label>
                Job Summary
              </Label>

              <Textarea
                data-testid="job-summary-input"
                rows={4}
                value={form.summary}
                onChange={(e) =>
                  set(
                    "summary",
                    e.target.value
                  )
                }
                placeholder="Short summary of the role..."
              />
            </div>

            {/* Description */}

            <div className="space-y-1">
              <Label>
                Job Description
              </Label>

              <Textarea
                data-testid="job-description-input"
                rows={6}
                value={form.description}
                onChange={(e) =>
                  set(
                    "description",
                    e.target.value
                  )
                }
                placeholder="Detailed description of the role..."
              />
            </div>

            {/* Responsibilities */}

            <div className="space-y-1">
              <Label>
                Responsibilities
              </Label>

              <TagInput
                testId="responsibility-input"
                value={
                  form.responsibilities
                }
                onChange={(v) =>
                  set(
                    "responsibilities",
                    v
                  )
                }
                placeholder="Add a responsibility & press Enter"
              />
            </div>

            {/* Skills */}

            <div className="grid grid-cols-2 gap-4">

              {/* Required Skills */}

              <div className="space-y-1">
                <Label>
                  Required Skills
                </Label>

                <TagInput
                  testId="required-skill-input"
                  value={
                    form.required_skills
                  }
                  onChange={(v) =>
                    set(
                      "required_skills",
                      v
                    )
                  }
                  placeholder="e.g. React"
                />
              </div>

              {/* Preferred Skills */}

              <div className="space-y-1">
                <Label>
                  Preferred Skills
                </Label>

                <TagInput
                  testId="preferred-skill-input"
                  value={
                    form.preferred_skills
                  }
                  onChange={(v) =>
                    set(
                      "preferred_skills",
                      v
                    )
                  }
                  placeholder="e.g. GraphQL"
                />
              </div>
            </div>

            {/* Education */}

            <div className="space-y-1 max-w-xs">
              <Label>
                Education
              </Label>

              <Select
                value={
                  form.education
                }
                onValueChange={(v) =>
                  set(
                    "education",
                    v
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  {[
                    [
                      "high_school",
                      "High School",
                    ],
                    [
                      "diploma",
                      "Diploma",
                    ],
                    [
                      "bachelors",
                      "Bachelors",
                    ],
                    [
                      "masters",
                      "Masters",
                    ],
                    [
                      "phd",
                      "PhD",
                    ],
                  ].map(
                    ([k, v]) => (
                      <SelectItem
                        key={k}
                        value={k}
                      >
                        {v}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* =========================================
            STEP 2 - REQUIREMENTS
        ========================================= */}

        {step === 2 && (
          <div className="grid grid-cols-2 gap-6">

            {/* Mandatory */}

            <div className="space-y-1">
              <Label className="text-[#0a2540] font-semibold">
                Mandatory Requirements
              </Label>

              <p className="text-xs text-slate-500 mb-1">
                Used for ATS scoring
              </p>

              <TagInput
                testId="mandatory-req-input"
                value={
                  form.mandatory_requirements
                }
                onChange={(v) =>
                  set(
                    "mandatory_requirements",
                    v
                  )
                }
                placeholder="Add requirement"
              />
            </div>

            {/* Preferred */}

            <div className="space-y-1">
              <Label className="text-[#0a2540] font-semibold">
                Preferred Requirements
              </Label>

              <p className="text-xs text-slate-500 mb-1">
                Nice to have
              </p>

              <TagInput
                testId="preferred-req-input"
                value={
                  form.preferred_requirements
                }
                onChange={(v) =>
                  set(
                    "preferred_requirements",
                    v
                  )
                }
                placeholder="Add requirement"
              />
            </div>
          </div>
        )}

        {/* =========================================
            STEP 3 - SCREENING QUESTIONS
        ========================================= */}

        {step === 3 && (
          <div className="space-y-4">

            <div className="flex items-center justify-between">
              <Label className="text-[#0a2540] font-semibold">
                Screening Questions
              </Label>

              <Button
                type="button"
                variant="outline"
                size="sm"
                data-testid="add-question-btn"
                onClick={addQuestion}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Question
              </Button>
            </div>

            {form.screening_questions
              .length === 0 && (
              <p className="text-sm text-slate-400">
                No screening questions added.
              </p>
            )}

            {form.screening_questions.map(
              (q, i) => (
                <div
                  key={q.id}
                  className="rounded-lg border border-slate-200 p-3 space-y-2"
                >
                  <div className="flex gap-2">

                    <Input
                      value={q.text}
                      onChange={(e) =>
                        updateQ(
                          i,
                          "text",
                          e.target.value
                        )
                      }
                      placeholder="Question text"
                      className="flex-1"
                    />

                    <Select
                      value={q.type}
                      onValueChange={(v) =>
                        updateQ(
                          i,
                          "type",
                          v
                        )
                      }
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>

                      <SelectContent>
                        {[
                          [
                            "yes_no",
                            "Yes/No",
                          ],
                          [
                            "multiple_choice",
                            "Multiple Choice",
                          ],
                          [
                            "short_answer",
                            "Short Answer",
                          ],
                          [
                            "number",
                            "Number",
                          ],
                          [
                            "experience",
                            "Experience",
                          ],
                        ].map(
                          ([k, v]) => (
                            <SelectItem
                              key={k}
                              value={k}
                            >
                              {v}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>

                    <button
                      type="button"
                      onClick={() =>
                        set(
                          "screening_questions",
                          form.screening_questions.filter(
                            (_, x) =>
                              x !== i
                          )
                        )
                      }
                    >
                      <X className="h-4 w-4 text-slate-400" />
                    </button>
                  </div>

                  <label className="flex items-center gap-2 text-xs text-slate-600">
                    <input
                      type="checkbox"
                      checked={
                        q.mandatory
                      }
                      onChange={(e) =>
                        updateQ(
                          i,
                          "mandatory",
                          e.target.checked
                        )
                      }
                    />

                    Mandatory
                  </label>
                </div>
              )
            )}
          </div>
        )}

        {/* =========================================
            STEP 4 - ATS CONFIGURATION
        ========================================= */}

        {step === 4 && (
          <div className="space-y-5">

            <p className="text-sm text-slate-500">
              Configure how candidates are scored.
              Weights must total 100%.
            </p>

            {ATS_KEYS.map(
              ([key, label]) => (
                <div key={key}>

                  <div className="flex items-center justify-between mb-1">
                    <Label>
                      {label}
                    </Label>

                    <span className="text-sm font-semibold text-[#1e5bff]">
                      {
                        form.ats_config[
                          key
                        ]
                      }
                      %
                    </span>
                  </div>

                  <Slider
                    value={[
                      Number(
                        form.ats_config[
                          key
                        ]
                      ),
                    ]}
                    max={60}
                    step={5}
                    onValueChange={([
                      value,
                    ]) =>
                      set(
                        "ats_config",
                        {
                          ...form.ats_config,
                          [key]: value,
                        }
                      )
                    }
                  />
                </div>
              )
            )}

            <div
              className={cn(
                "rounded-lg p-4 flex items-center justify-between",

                atsTotal === 100
                  ? "bg-emerald-50 border border-emerald-200"
                  : "bg-red-50 border border-red-200"
              )}
            >
              <span className="font-semibold text-[#0a2540]">
                Total Weight
              </span>

              <span
                data-testid="ats-total"
                className={cn(
                  "text-xl font-bold",

                  atsTotal === 100
                    ? "text-emerald-600"
                    : "text-red-600"
                )}
              >
                {atsTotal}%
              </span>
            </div>

            {atsTotal !== 100 && (
              <p className="text-xs text-red-600">
                Total must equal 100% before
                publishing.
              </p>
            )}
          </div>
        )}

        {/* =========================================
            STEP 5 - REVIEW & PUBLISH
        ========================================= */}

        {step === 5 && (
          <div
            className="space-y-4"
            data-testid="review-section"
          >

            <h3 className="font-display font-bold text-lg text-[#0a2540]">
              {form.title ||
                "Untitled"}
            </h3>

            {/* Basic Information */}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">

              {[
                [
                  "Company",
                  form.company_name,
                ],
                [
                  "Department",
                  form.department,
                ],
                [
                  "Location",
                  form.location,
                ],
                [
                  "Work Mode",
                  form.work_mode,
                ],
                [
                  "Type",
                  form.employment_type,
                ],
                [
                  "Experience",
                  `${form.min_experience}-${form.max_experience} yrs`,
                ],
                [
                  "Openings",
                  form.openings,
                ],
                [
                  "Recruiter",
                  form.recruiter_name,
                ],
                [
                  "Hiring Manager",
                  form.hiring_manager_name,
                ],
              ].map(
                ([label, value]) => (
                  <div
                    key={label}
                    className="rounded-lg bg-slate-50 p-3"
                  >
                    <div className="text-xs text-slate-500">
                      {label}
                    </div>

                    <div className="font-medium text-[#0a2540]">
                      {value || "—"}
                    </div>
                  </div>
                )
              )}
            </div>

            {/* Summary */}

            <div>
              <div className="text-xs font-bold uppercase text-slate-500 mb-1">
                Summary
              </div>

              <p className="text-sm text-slate-600">
                {form.summary ||
                  "—"}
              </p>
            </div>

            {/* Description */}

            <div>
              <div className="text-xs font-bold uppercase text-slate-500 mb-1">
                Description
              </div>

              <p className="text-sm text-slate-600 whitespace-pre-wrap">
                {form.description ||
                  "—"}
              </p>
            </div>

            {/* Required Skills */}

            <div>
              <div className="text-xs font-bold uppercase text-slate-500 mb-1">
                Required Skills
              </div>

              <div className="flex flex-wrap gap-1.5">
                {form.required_skills.map(
                  (s, i) => (
                    <span
                      key={`${s}-${i}`}
                      className="rounded-full bg-blue-50 text-blue-700 px-2 py-0.5 text-xs"
                    >
                      {s}
                    </span>
                  )
                )}
              </div>
            </div>

            {/* ATS Configuration */}

            <div>
              <div className="text-xs font-bold uppercase text-slate-500 mb-1">
                ATS Configuration
              </div>

              <div className="flex flex-wrap gap-2">
                {ATS_KEYS.map(
                  ([k, label]) => (
                    <span
                      key={k}
                      className="text-xs text-slate-600"
                    >
                      {label}:{" "}
                      <b>
                        {
                          form.ats_config[
                            k
                          ]
                        }
                        %
                      </b>
                    </span>
                  )
                )}
              </div>
            </div>

            {atsTotal !== 100 && (
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-700">
                ATS weights total{" "}
                {atsTotal}%. Adjust to
                100% to publish.
              </div>
            )}
          </div>
        )}

        {/* =========================================
            BOTTOM NAVIGATION
        ========================================= */}

        <div className="flex items-center justify-between mt-8 pt-4 border-t border-slate-100">

          <Button
  variant="outline"
  onClick={() => {
    if (step === 0) {
      navigate("/jobs");
    } else {
      setStep((s) => s - 1);
    }
  }}
>
  <ChevronLeft className="h-4 w-4 mr-1" />
  Back
</Button>

          {step < STEPS.length - 1 ? (
            <Button
              type="button"
              data-testid="wizard-next"
              className="bg-[#1e5bff] hover:bg-[#154cdb]"
              onClick={() =>
                setStep((s) => s + 1)
              }
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button
              type="button"
              data-testid="publish-job-btn"
              className="bg-emerald-500 hover:bg-emerald-600"
              disabled={
                saving ||
                atsTotal !== 100
              }
              onClick={() =>
                save("active")
              }
            >
              Publish Job
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}