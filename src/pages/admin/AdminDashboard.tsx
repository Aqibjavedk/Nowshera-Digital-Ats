import React, { useEffect, useState } from "react";
import { GlobalATSStats, JobStats } from "../../types";
import { api } from "../../lib/api";
import {
  Users,
  Briefcase,
  Award,
  CheckCircle2,
  Clock,
  Calendar,
  Gift,
  XCircle,
  AlertCircle,
  PlusCircle,
  ArrowRight,
  RefreshCw,
  Loader2,
} from "lucide-react";

interface AdminDashboardProps {
  onNavigateToJobs: () => void;
  onNavigateToRecruiters: () => void;
  onSelectJob: (jobId: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onNavigateToJobs,
  onNavigateToRecruiters,
  onSelectJob,
}) => {
  const [stats, setStats] = useState<GlobalATSStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getAdminStats();
      setStats(res);
    } catch (err: any) {
      setError(err.message || "Failed to load admin metrics");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-16 text-center text-xs text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
        Loading ATS enterprise analytics...
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-8 bg-rose-50 border border-rose-200 rounded-2xl text-center">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
        <p className="text-sm font-bold text-rose-900">{error || "Failed to load stats"}</p>
        <button
          onClick={fetchStats}
          className="mt-3 px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-xl"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Aggregate totals across all job pipelines
  const aggregatedStages = (stats.jobStats || []).reduce(
    (acc, j) => {
      acc.applied += j.applied || 0;
      acc.shortlisted += j.shortlisted || 0;
      acc.interview += j.interview || 0;
      acc.offer += j.offer || 0;
      acc.hired += j.hired || 0;
      acc.rejected += j.rejected || 0;
      return acc;
    },
    { applied: 0, shortlisted: 0, interview: 0, offer: 0, hired: 0, rejected: 0 }
  );

  const stageCards = [
    { label: "Applied", count: aggregatedStages.applied, icon: Clock, color: "text-blue-600", bg: "bg-blue-50" },
    {
      label: "Shortlisted",
      count: aggregatedStages.shortlisted,
      icon: CheckCircle2,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
    {
      label: "Interview",
      count: aggregatedStages.interview,
      icon: Calendar,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    { label: "Offer", count: aggregatedStages.offer, icon: Gift, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Hired", count: aggregatedStages.hired, icon: Award, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Rejected", count: aggregatedStages.rejected, icon: XCircle, color: "text-rose-600", bg: "bg-rose-50" },
  ];

  return (
    <div className="space-y-8">
      {/* Overview Top Card */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
            Admin HR Command Center
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-3">Nowshera Digital ATS Metrics</h1>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Real-time recruitment pipeline metrics, active position fill rates, and candidate volume.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onNavigateToJobs}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-md shadow-indigo-500/20"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create / Manage Jobs</span>
          </button>
          <button
            onClick={fetchStats}
            className="p-2.5 text-slate-400 hover:text-white bg-slate-800 rounded-xl transition"
            title="Refresh statistics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Overview Stat Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase">Total Positions</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{stats.totalJobs}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {stats.openJobs} open, {stats.draftJobs} draft, {stats.closedJobs} closed
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase">Total Applications</div>
          <div className="text-2xl font-black text-indigo-600 mt-1">{stats.totalApplications}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Across all departments</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase">Interviews Conducted</div>
          <div className="text-2xl font-black text-purple-600 mt-1">{stats.totalInterviews}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Scheduled slots</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase">Hires Completed</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">{stats.totalHired}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Accepted offers</div>
        </div>
      </div>

      {/* Global Stage Breakdown Grid */}
      <div>
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
          Overall Applicant Pipeline Distribution
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {stageCards.map((c, i) => {
            const Icon = c.icon;
            return (
              <div key={i} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-8 h-8 rounded-lg ${c.bg} ${c.color} flex items-center justify-center`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Stage</span>
                </div>
                <div className="text-2xl font-black text-slate-900">{c.count}</div>
                <div className="text-xs font-medium text-slate-500 mt-0.5">{c.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Jobs Funnel Breakdown */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">Job Positions & Applicant Volume</h3>
            <p className="text-xs text-slate-500">Applicant breakdown and stage progress per opening</p>
          </div>
          <button
            onClick={onNavigateToJobs}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition"
          >
            Manage All Jobs →
          </button>
        </div>

        <div className="space-y-3">
          {(stats.jobStats || []).map((job: JobStats) => (
            <div
              key={job.jobId}
              onClick={() => onSelectJob(job.jobId)}
              className="p-4 rounded-2xl border border-slate-100 hover:border-indigo-300 bg-slate-50/50 hover:bg-white cursor-pointer transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition">
                    {job.jobTitle}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      job.status === "open"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-rose-50 text-rose-700"
                    }`}
                  >
                    {job.status}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-3">
                  <span>Openings: {job.openings}</span>
                  <span>•</span>
                  <span>Hired: {job.hired}</span>
                  <span>•</span>
                  <span>Interviews: {job.interview}</span>
                  <span>•</span>
                  <span>Shortlisted: {job.shortlisted}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-base font-black text-slate-900">{job.totalApplications}</div>
                  <div className="text-[10px] text-slate-400 font-semibold uppercase">Applicants</div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
