import React, { useEffect, useState, useRef } from "react";
import { Job, Application } from "../../types";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { PipelineBadge } from "../../components/PipelineBadge";
import {
  Briefcase,
  MapPin,
  Calendar,
  Users,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  UploadCloud,
  FileText,
  Lock,
  Loader2,
  RotateCcw,
} from "lucide-react";

interface JobDetailPageProps {
  jobId: string;
  onBack: () => void;
  onNavigateToMyApplications: () => void;
}

export const JobDetailPage: React.FC<JobDetailPageProps> = ({
  jobId,
  onBack,
  onNavigateToMyApplications,
}) => {
  const { user, showToast } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [candidateApp, setCandidateApp] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Application Modal state
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadedCvPath, setUploadedCvPath] = useState<string | null>(null);
  const [uploadedCvName, setUploadedCvName] = useState<string | null>(null);
  const [uploadedCvId, setUploadedCvId] = useState<string | null>(null);
  const [uploadingCv, setUploadingCv] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [applySuccess, setApplySuccess] = useState<string | null>(null);

  // Withdrawal modal state
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchJobAndApplication();
  }, [jobId, user?.id]);

  const fetchJobAndApplication = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getJob(jobId);
      setJob(res.job);

      if (user?.role === "candidate") {
        try {
          const appsRes = await api.getMyApplications();
          const found = (appsRes.applications || []).find((a) => a.jobId === jobId);
          setCandidateApp(found || null);
        } catch {
          // Silent catch for candidate apps
        }
      }

      if (user?.currentCvPath) {
        setUploadedCvPath(user.currentCvPath);
        setUploadedCvName(user.currentCvName || "Existing_CV.pdf");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load job details");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Strict validation
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setApplyError("CV must be a PDF file smaller than or equal to 2 MB.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setApplyError("CV must be a PDF file smaller than or equal to 2 MB.");
      return;
    }

    try {
      setUploadingCv(true);
      setApplyError(null);
      const res = await api.uploadCv(file);
      setUploadedCvPath(res.filePath);
      setUploadedCvName(res.fileName);
      if (res.cvId) {
        setUploadedCvId(res.cvId);
      }
      showToast("PDF CV uploaded successfully!", "success");
    } catch (err: any) {
      setApplyError(err.message || "Failed to upload CV");
    } finally {
      setUploadingCv(false);
    }
  };

  const handleSubmitApplication = async () => {
    if (!job) return;

    if (!uploadedCvPath && !user?.currentCvPath) {
      setApplyError("Please upload a PDF CV (max 2 MB) to proceed with your application.");
      return;
    }

    try {
      setSubmitting(true);
      setApplyError(null);
      const res = await api.apply({
        jobId: job.id,
        cvId: uploadedCvId || (user as any)?.currentCvId || undefined,
        cvFilePath: uploadedCvPath || user?.currentCvPath,
        cvFileName: uploadedCvName || user?.currentCvName,
      });

      setCandidateApp(res.application);
      setApplySuccess(res.message);
      showToast("Application submitted successfully!", "success");
    } catch (err: any) {
      setApplyError(err.message || "Failed to submit application");
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmWithdraw = async () => {
    if (!candidateApp) return;

    try {
      setWithdrawing(true);
      setWithdrawError(null);
      const res = await api.withdrawApplication(candidateApp.id);
      setCandidateApp(res.application);
      showToast("Application withdrawn successfully.", "success");
      setWithdrawModalOpen(false);
      await fetchJobAndApplication();
    } catch (err: any) {
      const msg = err.message || "Unable to withdraw the application. Please try again.";
      setWithdrawError(msg);
      showToast(msg, "error");
    } finally {
      setWithdrawing(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-500 font-medium">Loading position specifications...</p>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="max-w-2xl mx-auto p-8 bg-white rounded-2xl border border-slate-200 text-center shadow-sm">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-900">Job Unavailable</h3>
        <p className="text-xs text-slate-600 mt-2">{error || "The requested job was not found."}</p>
        <button
          onClick={onBack}
          className="mt-6 px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
        >
          Return to All Jobs
        </button>
      </div>
    );
  }

  const isExpired = new Date(job.lastDate).getTime() < new Date().setHours(0, 0, 0, 0);
  const isFilled = job.filledOpenings >= job.openings;
  const isJobActive = job.status === "open" && !isExpired && !isFilled;
  const hasActiveApp = candidateApp && ["applied", "shortlisted", "interview", "offer"].includes(candidateApp.status);
  const hasWithdrawnApp = candidateApp && candidateApp.status === "withdrawn";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Jobs Listing
      </button>

      {/* Main Job Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-md text-xs font-bold bg-indigo-50 text-indigo-700">
                {job.department}
              </span>
              <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700">
                {job.jobType}
              </span>
              <span
                className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
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
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{job.title}</h1>
            <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-500 font-medium">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span>{job.location}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-slate-400" />
                <span>
                  {job.openings - job.filledOpenings} of {job.openings} open seat
                  {job.openings > 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>Deadline: {new Date(job.lastDate).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div>
            {user?.role === "candidate" ? (
              hasActiveApp ? (
                <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex flex-col sm:items-end gap-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700">My Application:</span>
                    <PipelineBadge stage={candidateApp.status} size="sm" />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setWithdrawError(null);
                        setWithdrawModalOpen(true);
                      }}
                      className="px-3.5 py-1.5 text-xs font-bold text-rose-700 bg-white hover:bg-rose-50 border border-rose-200 rounded-xl transition shadow-xs"
                    >
                      Withdraw Application
                    </button>
                    <button
                      onClick={onNavigateToMyApplications}
                      className="px-3.5 py-1.5 text-xs font-bold text-indigo-700 bg-white hover:bg-indigo-50 border border-indigo-200 rounded-xl transition shadow-xs"
                    >
                      View Dashboard
                    </button>
                  </div>
                </div>
              ) : hasWithdrawnApp ? (
                <div className="flex flex-col sm:items-end gap-2.5">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>Previous status:</span>
                    <PipelineBadge stage="withdrawn" size="sm" />
                  </div>
                  {isJobActive && (
                    <button
                      onClick={() => {
                        setApplySuccess(null);
                        setApplyError(null);
                        setApplyModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-md shadow-indigo-100"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reapply for this Role</span>
                    </button>
                  )}
                </div>
              ) : isJobActive ? (
                <button
                  onClick={() => {
                    setApplySuccess(null);
                    setApplyError(null);
                    setApplyModalOpen(true);
                  }}
                  className="w-full sm:w-auto px-6 py-3 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-md shadow-indigo-100"
                >
                  Apply for this Role
                </button>
              ) : (
                <div className="px-4 py-2.5 bg-slate-100 border border-slate-200 text-slate-600 text-xs font-semibold rounded-xl text-center">
                  {job.status === "closed"
                    ? "Position Closed"
                    : isExpired
                    ? "Application Deadline Passed"
                    : isFilled
                    ? "All Openings Filled"
                    : "Not accepting applications"}
                </div>
              )
            ) : (
              <div className="px-4 py-3 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-xl flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Active role: <strong>{user?.role}</strong>. Switch to a candidate account to test submitting
                  applications.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Description & Requirements */}
        <div className="mt-8 space-y-8">
          <div>
            <h2 className="text-base font-bold text-slate-900 mb-3">About the Position</h2>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{job.description}</p>
          </div>

          <div>
            <h2 className="text-base font-bold text-slate-900 mb-3">Key Requirements & Qualifications</h2>
            <ul className="space-y-2.5">
              {job.requirements.map((req, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-700 leading-relaxed">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 mt-1 shrink-0" />
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Apply Modal */}
      {applyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 sm:p-8">
            {applySuccess ? (
              <div className="text-center py-4 space-y-4">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Application Submitted!</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{applySuccess}</p>
                <div className="p-3 bg-slate-50 rounded-xl text-left border border-slate-200 text-[11px] text-slate-600 space-y-1">
                  <div>
                    • <strong>Status:</strong> Applied (awaiting recruiter review)
                  </div>
                  <div>• <strong>Confirmation:</strong> Confirmation email dispatched to your inbox</div>
                  <div>• <strong>CV Snapshot:</strong> Preserved securely for this application</div>
                </div>
                <div className="pt-2 flex gap-2">
                  <button
                    onClick={() => {
                      setApplyModalOpen(false);
                      onNavigateToMyApplications();
                    }}
                    className="flex-1 px-4 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition"
                  >
                    View My Applications
                  </button>
                  <button
                    onClick={() => {
                      setApplyModalOpen(false);
                      setApplySuccess(null);
                    }}
                    className="px-4 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {hasWithdrawnApp ? `Reapply for ${job.title}` : `Apply for ${job.title}`}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Upload or confirm your PDF resume. Max size: 2 MB.
                  </p>
                </div>

                {applyError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                    <span>{applyError}</span>
                  </div>
                )}

                {/* Candidate Info Confirmation */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 space-y-1">
                  <div>
                    Applicant: <span className="font-semibold text-slate-900">{user?.fullName}</span>
                  </div>
                  <div>
                    Email: <span className="font-semibold text-slate-900">{user?.email}</span>
                  </div>
                </div>

                {/* CV File Selector */}
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-700">Curriculum Vitae (PDF only, ≤ 2MB)</label>

                  {uploadedCvName ? (
                    <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-medium text-indigo-950 truncate">
                        <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                        <span className="truncate">{uploadedCvName}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-xs text-indigo-700 hover:text-indigo-900 font-bold shrink-0 ml-2"
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-2xl p-6 text-center cursor-pointer transition bg-slate-50/50 hover:bg-slate-50"
                    >
                      <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-xs font-semibold text-slate-700">Click to select PDF CV</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Strictly PDF up to 2 MB</p>
                    </div>
                  )}

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="application/pdf,.pdf"
                    className="hidden"
                  />

                  {uploadingCv && (
                    <div className="flex items-center gap-2 text-xs text-indigo-600 font-medium">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Validating and uploading PDF...</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setApplyModalOpen(false);
                      setApplyError(null);
                    }}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmitApplication}
                    disabled={submitting || uploadingCv}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-md shadow-indigo-100 disabled:opacity-50"
                  >
                    {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{submitting ? "Submitting..." : hasWithdrawnApp ? "Submit New Application" : "Confirm & Submit Application"}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Professional Withdrawal Confirmation Modal */}
      {withdrawModalOpen && candidateApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 sm:p-7">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Withdraw Application?</h3>
                <p className="text-xs font-semibold text-indigo-600 mt-0.5">{job.title}</p>
                <p className="text-xs text-slate-600 mt-2.5 leading-relaxed">
                  Are you sure you want to withdraw this application? You can reapply later with a new application.
                </p>
              </div>
            </div>

            {withdrawError && (
              <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                <span>{withdrawError}</span>
              </div>
            )}

            <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  if (!withdrawing) {
                    setWithdrawModalOpen(false);
                    setWithdrawError(null);
                  }
                }}
                disabled={withdrawing}
                className="px-4 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmWithdraw}
                disabled={withdrawing}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition shadow-sm disabled:opacity-50"
              >
                {withdrawing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Withdrawing...</span>
                  </>
                ) : (
                  <span>Withdraw Application</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
