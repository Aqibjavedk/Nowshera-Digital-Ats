import React, { useEffect, useState } from "react";
import { UserProfile, Job } from "../../types";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import {
  Users,
  UserPlus,
  Briefcase,
  CheckCircle2,
  XCircle,
  Mail,
  Shield,
  X,
  Loader2,
} from "lucide-react";

export const AdminRecruitersPage: React.FC = () => {
  const { showToast } = useAuth();
  const [recruiters, setRecruiters] = useState<UserProfile[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Recruiter Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [assignedJobIds, setAssignedJobIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [recRes, jobsRes] = await Promise.all([api.getRecruiters(), api.getJobs()]);
      setRecruiters(recRes.recruiters || []);
      setJobs(jobsRes.jobs || []);
    } catch (err: any) {
      showToast(err.message || "Failed to load recruiters", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRecruiter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email) return;

    try {
      setSubmitting(true);
      const res = await api.createRecruiter({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        assignedJobIds,
      });

      if (res.emailStatus === "sent") {
        showToast(`Recruiter account for ${fullName} created and welcome email sent!`, "success");
      } else if (res.emailStatus === "failed") {
        showToast(`Recruiter created, but welcome email could not be sent.`, "error");
      } else {
        showToast(`Recruiter created. Welcome email queued.`, "info");
      }

      setModalOpen(false);
      setFullName("");
      setEmail("");
      setAssignedJobIds([]);
      await fetchData();
    } catch (err: any) {
      showToast(err.message || "Failed to create recruiter", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (id: string, name: string) => {
    try {
      await api.toggleRecruiterActive(id);
      showToast(`Updated recruiter status for ${name}`, "info");
      await fetchData();
    } catch (err: any) {
      showToast(err.message || "Failed to update recruiter status", "error");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-black text-slate-900">Manage Recruitment Staff</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure recruiter roles, job pipeline permissions, and active operational status
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-indigo-600 rounded-xl transition shadow-sm"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New Recruiter</span>
        </button>
      </div>

      {/* Recruiter List */}
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
          Loading team roster...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recruiters.map((rec) => {
            const assignedPositions = jobs.filter((j) => rec.assignedJobIds?.includes(j.id));

            return (
              <div
                key={rec.id}
                className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:border-slate-300 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-purple-100 text-purple-700 font-extrabold flex items-center justify-center text-sm shadow-sm">
                        {rec.fullName.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-slate-900">{rec.fullName}</h3>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              rec.isActive
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-slate-100 text-slate-500 border border-slate-200"
                            }`}
                          >
                            {rec.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{rec.email}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleActive(rec.id, rec.fullName)}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
                    >
                      {rec.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </div>

                  {/* Assigned Jobs */}
                  <div className="pt-3 border-t border-slate-100">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Assigned Positions ({assignedPositions.length})
                    </div>
                    {assignedPositions.length === 0 ? (
                      <div className="text-xs text-slate-400 italic">No positions assigned</div>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {assignedPositions.map((p) => (
                          <span
                            key={p.id}
                            className="px-2.5 py-1 bg-slate-50 rounded-lg text-xs font-medium text-slate-700 border border-slate-200"
                          >
                            {p.title}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Role: Verified Talent Acquisition Specialist</span>
                  <span className="font-mono">ID: {rec.id}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Recruiter Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Provision Recruiter Account</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRecruiter} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Farhan Tariq"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Work Email</label>
                <input
                  type="email"
                  required
                  placeholder="farhan@nowsheradigital.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Assign Initial Roles</label>
                <div className="space-y-1.5 max-h-40 overflow-y-auto bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  {jobs.map((job) => {
                    const isSelected = assignedJobIds.includes(job.id);
                    return (
                      <label
                        key={job.id}
                        className={`flex items-center gap-2 p-1.5 rounded-lg text-xs cursor-pointer ${
                          isSelected ? "bg-indigo-100 font-semibold text-indigo-900" : "hover:bg-slate-100"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) setAssignedJobIds([...assignedJobIds, job.id]);
                            else setAssignedJobIds(assignedJobIds.filter((id) => id !== job.id));
                          }}
                          className="rounded text-indigo-600"
                        />
                        <span>{job.title}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 font-bold text-white bg-slate-900 hover:bg-indigo-600 rounded-xl transition shadow-sm disabled:opacity-50"
                >
                  {submitting ? "Provisioning..." : "Create Recruiter & Send Invite"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
