import React, { useEffect, useState, useRef } from "react";
import { Application, Interview } from "../../types";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { PipelineBadge } from "../../components/PipelineBadge";
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  Clock,
  ArrowRight,
  RefreshCw,
  Loader2,
} from "lucide-react";

interface CandidateDashboardProps {
  onNavigateToJobs: () => void;
  onNavigateToJobDetail: (jobId: string) => void;
}

export const CandidateDashboard: React.FC<CandidateDashboardProps> = ({
  onNavigateToJobs,
  onNavigateToJobDetail,
}) => {
  const { user, showToast, refreshAuth } = useAuth();
  const [applications, setApplications] = useState<(Application & { interviews?: Interview[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const [withdrawModalApp, setWithdrawModalApp] = useState<(Application & { interviews?: Interview[] }) | null>(null);
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [uploadingCv, setUploadingCv] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchMyApplications();
  }, [user?.id]);

  const fetchMyApplications = async () => {
    try {
      setLoading(true);
      const res = await api.getMyApplications();
      setApplications(res.applications || []);
    } catch (err: any) {
      console.error("Failed to load applications:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      showToast("CV must be a PDF file smaller than or equal to 2 MB.", "error");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showToast("CV must be a PDF file smaller than or equal to 2 MB.", "error");
      return;
    }

    try {
      setUploadingCv(true);
      const res = await api.uploadCv(file);
      showToast(`Profile CV updated: ${res.fileName}`, "success");
      await refreshAuth();
    } catch (err: any) {
      showToast(err.message || "Failed to upload CV", "error");
    } finally {
      setUploadingCv(false);
    }
  };

  const handleOpenWithdrawModal = (app: Application & { interviews?: Interview[] }) => {
    setWithdrawError(null);
    setWithdrawModalApp(app);
  };

  const handleConfirmWithdraw = async () => {
    if (!withdrawModalApp) return;

    try {
      setWithdrawing(true);
      setWithdrawError(null);
      await api.withdrawApplication(withdrawModalApp.id);
      showToast("Application withdrawn successfully.", "success");
      setWithdrawModalApp(null);
      await fetchMyApplications();
    } catch (err: any) {
      const msg = err.message || "Unable to withdraw the application. Please try again.";
      setWithdrawError(msg);
      showToast(msg, "error");
    } finally {
      setWithdrawing(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Profile & CV Management Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Candidate Profile</span>
            <h1 className="text-2xl font-bold text-slate-900 mt-1">{user?.fullName}</h1>
            <p className="text-xs text-slate-500 mt-0.5">{user?.email} • {user?.phone || "No phone added"}</p>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleCvUpload}
              accept="application/pdf,.pdf"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingCv}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-700 bg-slate-50 border border-slate-300 rounded-xl hover:bg-slate-100 transition shadow-sm disabled:opacity-50"
            >
              {uploadingCv ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <UploadCloud className="w-3.5 h-3.5 text-indigo-600" />
              )}
              <span>{user?.currentCvName ? "Update Profile CV (PDF)" : "Upload Default CV (PDF)"}</span>
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-700">
            <FileText className="w-4 h-4 text-indigo-600" />
            <span>
              Current CV on File:{" "}
              <strong className="text-slate-900">{user?.currentCvName || "None uploaded"}</strong>
            </span>
          </div>
          <span className="text-[11px] text-slate-400">Accepted format: PDF only, max 2.0 MB</span>
        </div>
      </div>

      {/* Applications Section */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">My Job Applications</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Track real-time hiring progress, interview details, and active stages
            </p>
          </div>
          <button
            onClick={fetchMyApplications}
            disabled={loading}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
            title="Refresh applications"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
            Loading your active submissions...
          </div>
        ) : applications.length === 0 ? (
          <div className="py-12 text-center">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-800">No applications found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              You haven't submitted any job applications yet. Browse open roles at Nowshera Digital to get started.
            </p>
            <button
              onClick={onNavigateToJobs}
              className="mt-4 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-sm"
            >
              Browse Open Jobs
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => {
              const activeInterview = (app.interviews || []).slice(-1)[0];
              const stage = app.status;

              return (
                <div
                  key={app.id}
                  className="p-5 rounded-2xl border border-slate-200 hover:border-slate-300 transition bg-slate-50/40 hover:bg-white flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">{app.jobTitle}</span>
                      <span className="text-xs text-slate-500">• {app.jobDepartment || app.department}</span>
                      <PipelineBadge stage={stage} size="sm" />
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Applied on: {new Date(app.appliedAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                        <span>CV: {app.cvFileName}</span>
                      </div>
                    </div>

                    {/* Interview scheduled notice */}
                    {stage === "interview" && activeInterview && (
                      <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-900 flex items-start gap-2.5 mt-2">
                        <Calendar className="w-4 h-4 text-purple-600 mt-0.5 shrink-0" />
                        <div>
                          <span className="font-bold">Interview Scheduled: </span>
                          <span>{new Date(activeInterview.scheduledTime).toLocaleString()}</span>
                          <div className="text-[11px] text-purple-700 mt-0.5">
                            Location/Link: <strong>{activeInterview.locationOrLink}</strong>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {stage !== "withdrawn" && stage !== "hired" && stage !== "rejected" && (
                      <button
                        onClick={() => handleOpenWithdrawModal(app)}
                        className="px-3.5 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition shadow-xs"
                      >
                        Withdraw Application
                      </button>
                    )}

                    {(stage === "withdrawn" || stage === "rejected") && (
                      <button
                        onClick={() => onNavigateToJobDetail(app.jobId)}
                        className="inline-flex items-center gap-1 px-3.5 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition shadow-xs"
                      >
                        <span>Reapply</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      onClick={() => onNavigateToJobDetail(app.jobId)}
                      className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition shadow-xs"
                    >
                      View Job Post
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Professional Withdrawal Confirmation Modal */}
      {withdrawModalApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 sm:p-7">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Withdraw Application?</h3>
                <p className="text-xs font-semibold text-indigo-600 mt-0.5">
                  {withdrawModalApp.jobTitle}
                </p>
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
                    setWithdrawModalApp(null);
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
