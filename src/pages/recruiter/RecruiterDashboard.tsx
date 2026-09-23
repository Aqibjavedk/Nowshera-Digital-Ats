import React, { useEffect, useState } from "react";
import { Job } from "../../types";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { Briefcase, Users, ArrowRight, Clock, Award, ShieldAlert, Loader2 } from "lucide-react";

interface RecruiterDashboardProps {
  onSelectJob: (jobId: string) => void;
}

export const RecruiterDashboard: React.FC<RecruiterDashboardProps> = ({ onSelectJob }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, [user?.id]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.getRecruiterStats();
      setStats(res);
    } catch (err: any) {
      setError(err.message || "Failed to load recruiter workspace");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-16 text-center text-xs text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
        Loading assigned recruitment pipelines...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 bg-rose-50 border border-rose-200 rounded-2xl text-center">
        <ShieldAlert className="w-8 h-8 text-rose-500 mx-auto mb-2" />
        <p className="text-sm font-bold text-rose-900">{error}</p>
        <p className="text-xs text-rose-700 mt-1">
          Recruiters may only access jobs they are explicitly assigned to.
        </p>
      </div>
    );
  }

  const assignedJobs: Job[] = stats?.assignedJobs || [];
  const pipelineCounts = stats?.pipelineCounts || {};

  return (
    <div className="space-y-8">
      {/* Workspace Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div>
          <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
            Recruiter Workspace • Nowshera Digital
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold mt-3">Welcome, {user?.fullName}</h1>
          <p className="text-xs text-slate-300 mt-1">
            Assigned roles: <strong className="text-white">{assignedJobs.length} active positions</strong>
          </p>
        </div>

        {/* Global Pipeline Numbers */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 bg-slate-800/80 p-3 rounded-2xl border border-slate-700">
          {[
            { label: "Applied", val: pipelineCounts.applied || 0, color: "text-blue-400" },
            { label: "Shortlist", val: pipelineCounts.shortlisted || 0, color: "text-indigo-400" },
            { label: "Interview", val: pipelineCounts.interview || 0, color: "text-purple-400" },
            { label: "Offer", val: pipelineCounts.offer || 0, color: "text-amber-400" },
            { label: "Hired", val: pipelineCounts.hired || 0, color: "text-emerald-400" },
            { label: "Rejected", val: pipelineCounts.rejected || 0, color: "text-rose-400" },
          ].map((item, idx) => (
            <div key={idx} className="text-center p-2">
              <div className={`text-base sm:text-lg font-black ${item.color}`}>{item.val}</div>
              <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Assigned Positions */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Your Assigned Job Pipelines</h2>
            <p className="text-xs text-slate-500">
              Only positions specifically assigned to you by the recruitment administrator
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
            {assignedJobs.length} Jobs
          </span>
        </div>

        {assignedJobs.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            <Briefcase className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            No positions currently assigned to your account.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assignedJobs.map((job) => (
              <div
                key={job.id}
                className="p-5 rounded-2xl border border-slate-200 hover:border-indigo-400 transition bg-slate-50/30 hover:bg-white flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-indigo-50 text-indigo-700">
                      {job.department}
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

                  <h3 className="text-base font-bold text-slate-900">{job.title}</h3>
                  <div className="text-xs text-slate-500 mt-1">
                    {job.location} • {job.jobType}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        Hired: <strong>{job.filledOpenings}</strong> / {job.openings}
                      </span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Last date: {new Date(job.lastDate).toLocaleDateString()}</span>
                    </span>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end">
                  <button
                    onClick={() => onSelectJob(job.id)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-indigo-600 rounded-xl transition shadow-sm"
                  >
                    <span>Manage Applicants & Pipeline</span>
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
