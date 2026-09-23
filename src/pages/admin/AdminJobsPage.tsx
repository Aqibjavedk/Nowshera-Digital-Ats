import React, { useEffect, useState } from "react";
import { Job, UserProfile } from "../../types";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import {
  Briefcase,
  Plus,
  Users,
  Calendar,
  Lock,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowRight,
  Loader2,
} from "lucide-react";

interface AdminJobsPageProps {
  onSelectJob: (jobId: string) => void;
}

export const AdminJobsPage: React.FC<AdminJobsPageProps> = ({ onSelectJob }) => {
  const { showToast } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [recruiters, setRecruiters] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Create Job Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDepartment, setNewDepartment] = useState("Engineering");
  const [newLocation, setNewLocation] = useState("Nowshera / Hybrid");
  const [newType, setNewType] = useState("Full-time");
  const [newOpenings, setNewOpenings] = useState(1);
  const [newLastDate, setNewLastDate] = useState("2026-10-30");
  const [newDescription, setNewDescription] = useState("");
  const [newRequirements, setNewRequirements] = useState("");
  const [selectedRecruiterIds, setSelectedRecruiterIds] = useState<string[]>([]);
  const [saveAsDraft, setSaveAsDraft] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Assign Recruiter Modal for opening a Draft job
  const [openJobTarget, setOpenJobTarget] = useState<Job | null>(null);
  const [openRecruiterIds, setOpenRecruiterIds] = useState<string[]>([]);
  const [openingLoading, setOpeningLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [jobsRes, recRes] = await Promise.all([api.getJobs(), api.getRecruiters()]);
      setJobs(jobsRes.jobs || []);
      setRecruiters(recRes.recruiters || []);
    } catch (err: any) {
      showToast(err.message || "Failed to load jobs", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!saveAsDraft && selectedRecruiterIds.length === 0) {
      setFormError("An open job must have at least one recruiter assigned. Or save as Draft.");
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);
      const reqList = newRequirements
        .split("\n")
        .map((r) => r.trim())
        .filter((r) => r.length > 0);

      await api.createJob({
        title: newTitle,
        department: newDepartment,
        location: newLocation,
        jobType: newType,
        openings: Number(newOpenings),
        lastDate: newLastDate,
        description: newDescription,
        requirements: reqList.length > 0 ? reqList : ["Relevant experience in role"],
        recruiterIds: selectedRecruiterIds,
        status: saveAsDraft ? "draft" : "open",
      });

      showToast(`Job "${newTitle}" created successfully!`, "success");
      setCreateModalOpen(false);
      resetForm();
      await fetchData();
    } catch (err: any) {
      setFormError(err.message || "Failed to create job");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenJob = async () => {
    if (!openJobTarget) return;
    if (openRecruiterIds.length === 0) {
      showToast("Please assign at least one recruiter to publish this job.", "error");
      return;
    }

    try {
      setOpeningLoading(true);
      await api.openJob(openJobTarget.id, openRecruiterIds);
      showToast(`Position "${openJobTarget.title}" is now Open for applicants!`, "success");
      setOpenJobTarget(null);
      await fetchData();
    } catch (err: any) {
      showToast(err.message || "Failed to open job", "error");
    } finally {
      setOpeningLoading(false);
    }
  };

  const handleCloseJob = async (jobId: string, title: string) => {
    if (!confirm(`Are you sure you want to close "${title}"? No new applications will be accepted.`)) return;
    try {
      await api.closeJob(jobId);
      showToast(`Position "${title}" is now Closed.`, "info");
      await fetchData();
    } catch (err: any) {
      showToast(err.message || "Failed to close job", "error");
    }
  };

  const resetForm = () => {
    setNewTitle("");
    setNewDescription("");
    setNewRequirements("");
    setSelectedRecruiterIds([]);
    setSaveAsDraft(false);
    setFormError(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-black text-slate-900">Manage Job Requisitions</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Create draft jobs, assign dedicated recruitment staff, and publish open positions
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setCreateModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-indigo-600 rounded-xl transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Job</span>
        </button>
      </div>

      {/* Jobs List */}
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
          Loading requisitions...
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {jobs.map((job) => {
            const assignedRecruiters = recruiters.filter((r) => job.recruiterIds?.includes(r.id));

            return (
              <div
                key={job.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-slate-300 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 max-w-xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-indigo-600">{job.department}</span>
                    <span className="text-xs text-slate-300">•</span>
                    <span className="text-base font-bold text-slate-900">{job.title}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        job.status === "open"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : job.status === "closed"
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}
                    >
                      {job.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 line-clamp-2">{job.description}</p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        Hired: <strong>{job.filledOpenings}</strong> / {job.openings} openings
                      </span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Last date: {new Date(job.lastDate).toLocaleDateString()}</span>
                    </span>
                    <span className="text-slate-400">
                      Assigned:{" "}
                      <strong className="text-slate-700">
                        {assignedRecruiters.map((r) => r.fullName).join(", ") || "None"}
                      </strong>
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {job.status === "draft" && (
                    <button
                      onClick={() => {
                        setOpenJobTarget(job);
                        setOpenRecruiterIds(job.recruiterIds || []);
                      }}
                      className="px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition"
                    >
                      Publish to Open
                    </button>
                  )}

                  {job.status === "open" && (
                    <button
                      onClick={() => handleCloseJob(job.id, job.title)}
                      className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition"
                    >
                      Close Job
                    </button>
                  )}

                  <button
                    onClick={() => onSelectJob(job.id)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition"
                  >
                    <span>View Pipeline</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Job Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 sm:p-4 backdrop-blur-sm overflow-hidden">
          <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            {/* Fixed Header */}
            <div className="flex items-center justify-between px-6 py-4 sm:px-8 sm:py-5 border-b border-slate-100 shrink-0 bg-white">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Create New Job Position</h3>
                <p className="text-xs text-slate-500">Draft or publish requisition for Nowshera Digital</p>
              </div>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Content */}
            <form
              id="create-job-form"
              onSubmit={handleCreateJob}
              className="flex-1 overflow-y-auto px-6 py-5 sm:px-8 sm:py-6 space-y-4 text-xs"
            >
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Job Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Lead React Architect"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Engineering, Product, Design"
                    value={newDepartment}
                    onChange={(e) => setNewDepartment(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Location</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Nowshera Office / Remote"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Job Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Internship">Internship</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Total Openings</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={newOpenings}
                    onChange={(e) => setNewOpenings(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Last Date to Apply</label>
                  <input
                    type="date"
                    required
                    value={newLastDate}
                    onChange={(e) => setNewLastDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Job Description</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe core mission, daily responsibilities, and team expectations..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Key Requirements (One per line)
                </label>
                <textarea
                  rows={3}
                  placeholder="3+ years React & TypeScript&#10;Experience with Cloud APIs&#10;Strong communication skills"
                  value={newRequirements}
                  onChange={(e) => setNewRequirements(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono"
                />
              </div>

              {/* Recruiter Assignment */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Assign Recruiters (Required to publish directly to Open)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  {recruiters.map((rec) => {
                    const isSelected = selectedRecruiterIds.includes(rec.id);
                    return (
                      <label
                        key={rec.id}
                        className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition ${
                          isSelected ? "bg-indigo-100 text-indigo-900 font-semibold" : "hover:bg-slate-100"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedRecruiterIds([...selectedRecruiterIds, rec.id]);
                            } else {
                              setSelectedRecruiterIds(selectedRecruiterIds.filter((id) => id !== rec.id));
                            }
                          }}
                          className="rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <span>{rec.fullName}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="draftCheckbox"
                  checked={saveAsDraft}
                  onChange={(e) => setSaveAsDraft(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="draftCheckbox" className="font-semibold text-slate-700">
                  Save as Draft (Allows publishing later with assigned recruiters)
                </label>
              </div>
            </form>

            {/* Fixed Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 sm:px-8 sm:py-4 border-t border-slate-100 shrink-0 bg-slate-50/80">
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="px-4 py-2 font-semibold text-slate-600 hover:text-slate-800 transition text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="create-job-form"
                disabled={submitting}
                className="px-5 py-2.5 font-bold text-white bg-slate-900 hover:bg-indigo-600 rounded-xl transition shadow-sm disabled:opacity-50 text-xs"
              >
                {submitting ? "Saving..." : saveAsDraft ? "Save Draft Requisition" : "Publish Open Position"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Publish Draft Modal */}
      {openJobTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm overflow-hidden">
          <div className="relative w-full max-w-md max-h-[90vh] flex flex-col bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-6 pb-3 border-b border-slate-100 shrink-0">
              <h3 className="text-lg font-bold text-slate-900">Publish Requisition to Open</h3>
              <p className="text-xs text-slate-500 mt-1">
                Per hiring policy, assigning at least one recruiter is required before publishing:{" "}
                <strong>{openJobTarget.title}</strong>
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-2">
              <label className="block text-xs font-bold text-slate-700">Select Recruiter(s)</label>
              {recruiters.map((rec) => {
                const checked = openRecruiterIds.includes(rec.id);
                return (
                  <label
                    key={rec.id}
                    className={`flex items-center gap-2 p-2 rounded-xl border text-xs cursor-pointer ${
                      checked ? "bg-indigo-50 border-indigo-300 font-semibold" : "border-slate-200"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        if (e.target.checked) setOpenRecruiterIds([...openRecruiterIds, rec.id]);
                        else setOpenRecruiterIds(openRecruiterIds.filter((id) => id !== rec.id));
                      }}
                      className="rounded text-indigo-600"
                    />
                    <span>{rec.fullName} ({rec.email})</span>
                  </label>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100 shrink-0 bg-slate-50/80">
              <button
                type="button"
                onClick={() => setOpenJobTarget(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleOpenJob}
                disabled={openingLoading}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-sm disabled:opacity-50"
              >
                {openingLoading ? "Publishing..." : "Confirm & Publish"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
