import React, { useEffect, useState } from "react";
import { Application, Job, ApplicationStage } from "../../types";
import { api } from "../../lib/api";
import { PipelineBadge } from "../../components/PipelineBadge";
import {
  ArrowLeft,
  Users,
  Search,
  Calendar,
  FileText,
  ArrowRight,
  ShieldAlert,
  Loader2,
} from "lucide-react";

interface JobApplicantsPageProps {
  jobId: string;
  onBack: () => void;
  onSelectApplication: (applicationId: string) => void;
}

export const JobApplicantsPage: React.FC<JobApplicantsPageProps> = ({
  jobId,
  onBack,
  onSelectApplication,
}) => {
  const [job, setJob] = useState<Job | null>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeStageFilter, setActiveStageFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchJobAndApplicants();
  }, [jobId]);

  const fetchJobAndApplicants = async () => {
    try {
      setLoading(true);
      setError(null);
      const [jobRes, appsRes] = await Promise.all([
        api.getJob(jobId),
        api.getJobApplications(jobId),
      ]);
      setJob(jobRes.job);
      setApplications(appsRes.applications || []);
    } catch (err: any) {
      setError(err.message || "Failed to load applicants");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-16 text-center text-xs text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
        Loading candidate pipeline...
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="p-8 bg-rose-50 border border-rose-200 rounded-2xl text-center max-w-xl mx-auto">
        <ShieldAlert className="w-8 h-8 text-rose-500 mx-auto mb-2" />
        <p className="text-sm font-bold text-rose-900">{error || "Access Denied"}</p>
        <p className="text-xs text-rose-700 mt-1">
          You do not have permission to view applicants for this job.
        </p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-xl"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const stages: { key: string; label: string }[] = [
    { key: "all", label: "All Applicants" },
    { key: "applied", label: "Applied" },
    { key: "shortlisted", label: "Shortlisted" },
    { key: "interview", label: "Interview" },
    { key: "offer", label: "Offer" },
    { key: "hired", label: "Hired" },
    { key: "rejected", label: "Rejected" },
    { key: "withdrawn", label: "Withdrawn" },
  ];

  const filteredApplications = applications.filter((app) => {
    const matchesStage = activeStageFilter === "all" || app.currentStage === activeStageFilter;
    const matchesSearch =
      app.candidateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.candidateEmail.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStage && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Recruiter Workspace
      </button>

      {/* Header Info */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-indigo-50 text-indigo-700">
              {job.department}
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                job.status === "open"
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-rose-50 text-rose-700"
              }`}
            >
              {job.status}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{job.title}</h1>
          <p className="text-xs text-slate-500 mt-1">
            {job.location} • {job.jobType} • Openings:{" "}
            <strong>
              {job.filledOpenings} / {job.openings} filled
            </strong>
          </p>
        </div>

        <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs">
          <div className="text-center px-2">
            <div className="text-base font-bold text-slate-900">{applications.length}</div>
            <div className="text-[10px] text-slate-500 uppercase font-semibold">Total Applicants</div>
          </div>
          <div className="h-6 w-px bg-slate-200" />
          <div className="text-center px-2">
            <div className="text-base font-bold text-emerald-600">{job.filledOpenings}</div>
            <div className="text-[10px] text-slate-500 uppercase font-semibold">Hired</div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search candidate name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Stage pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            {stages.map((st) => {
              const count =
                st.key === "all"
                  ? applications.length
                  : applications.filter((a) => a.currentStage === st.key).length;

              return (
                <button
                  key={st.key}
                  onClick={() => setActiveStageFilter(st.key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
                    activeStageFilter === st.key
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  <span>{st.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] ${
                      activeStageFilter === st.key ? "bg-slate-700 text-white" : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Applicants List */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        {filteredApplications.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            No candidates found matching the selected filter criteria.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredApplications.map((app) => (
              <div
                key={app.id}
                className="p-5 hover:bg-slate-50/80 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-slate-900">{app.candidateName}</span>
                    <PipelineBadge stage={app.currentStage} size="sm" />
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                    <span>{app.candidateEmail}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      <span>{app.cvFileName}</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Applied: {new Date(app.appliedAt).toLocaleDateString()}</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => onSelectApplication(app.id)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition"
                  >
                    <span>Review Application & AI</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
