import React, { useEffect, useState } from "react";
import { Application, AISummary, RecruiterNote, StageHistoryItem, Interview } from "../../types";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { PipelineBadge } from "../../components/PipelineBadge";
import {
  ArrowLeft,
  FileText,
  Sparkles,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RotateCcw,
  MessageSquare,
  Clock,
  ShieldCheck,
  Send,
  Loader2,
  Lock,
} from "lucide-react";

interface ApplicationDetailPageProps {
  applicationId: string;
  onBack: () => void;
}

export const ApplicationDetailPage: React.FC<ApplicationDetailPageProps> = ({
  applicationId,
  onBack,
}) => {
  const { showToast } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Stage transition
  const [targetStage, setTargetStage] = useState<string>("");
  const [transitionNotes, setTransitionNotes] = useState<string>("");
  const [transitioning, setTransitioning] = useState(false);
  const [transitionError, setTransitionError] = useState<string | null>(null);

  // Interview scheduling modal
  const [interviewModalOpen, setInterviewModalOpen] = useState(false);
  const [interviewTime, setInterviewTime] = useState("");
  const [interviewLocation, setInterviewLocation] = useState("Google Meet / Room 204");
  const [schedulingInterview, setSchedulingInterview] = useState(false);
  const [interviewError, setInterviewError] = useState<string | null>(null);

  // New Note
  const [newNoteText, setNewNoteText] = useState("");
  const [addingNote, setAddingNote] = useState(false);

  // AI retry
  const [retryingAi, setRetryingAi] = useState(false);

  useEffect(() => {
    fetchApplication();
  }, [applicationId]);

  const fetchApplication = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getApplicationDetail(applicationId);
      setData(res);
      setTargetStage("");
    } catch (err: any) {
      setError(err.message || "Failed to load application details");
    } finally {
      setLoading(false);
    }
  };

  const handleStageChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetStage) return;

    // If moving to interview, open the interview scheduling modal instead of direct change!
    if (targetStage === "interview") {
      setInterviewModalOpen(true);
      return;
    }

    try {
      setTransitioning(true);
      setTransitionError(null);
      await api.changeStage(applicationId, targetStage, transitionNotes);
      showToast(`Application moved to ${targetStage} successfully!`, "success");
      setTransitionNotes("");
      await fetchApplication();
    } catch (err: any) {
      setTransitionError(err.message || "Failed to update stage");
      showToast(err.message || "Stage transition failed", "error");
    } finally {
      setTransitioning(false);
    }
  };

  const handleScheduleInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!interviewTime) {
      setInterviewError("Please pick a scheduled date and time.");
      return;
    }

    try {
      setSchedulingInterview(true);
      setInterviewError(null);
      await api.scheduleInterview(applicationId, interviewTime, interviewLocation);
      showToast("Interview scheduled and invitation email dispatched!", "success");
      setInterviewModalOpen(false);
      await fetchApplication();
    } catch (err: any) {
      setInterviewError(err.message || "Failed to schedule interview");
    } finally {
      setSchedulingInterview(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    try {
      setAddingNote(true);
      await api.addNote(applicationId, newNoteText.trim());
      showToast("Recruiter note added!", "success");
      setNewNoteText("");
      await fetchApplication();
    } catch (err: any) {
      showToast(err.message || "Failed to add note", "error");
    } finally {
      setAddingNote(false);
    }
  };

  const handleRetryAi = async () => {
    try {
      setRetryingAi(true);
      await api.retryAISummary(applicationId);
      showToast("Triggered AI summary generation...", "info");
      setTimeout(() => {
        fetchApplication();
      }, 2000);
    } catch (err: any) {
      showToast(err.message || "Retry failed", "error");
    } finally {
      setRetryingAi(false);
    }
  };

  if (loading) {
    return (
      <div className="py-16 text-center text-xs text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
        Loading application details...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 bg-rose-50 border border-rose-200 rounded-2xl text-center max-w-xl mx-auto">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
        <p className="text-sm font-bold text-rose-900">{error || "Access Denied"}</p>
        <p className="text-xs text-rose-700 mt-1">
          You may only access applications for jobs assigned to you.
        </p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-xl"
        >
          Go Back
        </button>
      </div>
    );
  }

  const app: Application = data.application;
  const aiSummary: AISummary | null = data.aiSummary;
  const notes: RecruiterNote[] = data.notes || [];
  const history: StageHistoryItem[] = data.history || [];
  const interviews: Interview[] = data.interviews || [];
  const currentStage = app.status;

  // Determine allowed next transitions based on strict pipeline rules:
  // Applied -> Shortlisted, Rejected
  // Shortlisted -> Interview, Rejected
  // Interview -> Offer, Rejected
  // Offer -> Hired, Rejected
  // Hired, Rejected, Withdrawn -> Terminal (no forward transitions)
  const allowedNextStages: { stage: string; label: string }[] = [];
  if (currentStage === "applied") {
    allowedNextStages.push({ stage: "shortlisted", label: "Shortlist Candidate" });
    allowedNextStages.push({ stage: "rejected", label: "Reject Candidate" });
  } else if (currentStage === "shortlisted") {
    allowedNextStages.push({ stage: "interview", label: "Schedule Interview" });
    allowedNextStages.push({ stage: "rejected", label: "Reject Candidate" });
  } else if (currentStage === "interview") {
    allowedNextStages.push({ stage: "offer", label: "Extend Offer" });
    allowedNextStages.push({ stage: "rejected", label: "Reject Candidate" });
  } else if (currentStage === "offer") {
    allowedNextStages.push({ stage: "hired", label: "Hire Candidate" });
    allowedNextStages.push({ stage: "rejected", label: "Reject Candidate" });
  }

  return (
    <div className="space-y-6">
      {/* Top back button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Applicants List
      </button>

      {/* Main Candidate Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold text-slate-500">{app.jobDepartment || app.department}</span>
              <span className="text-xs text-slate-300">•</span>
              <span className="text-xs font-semibold text-slate-700">{app.jobTitle}</span>
              <PipelineBadge stage={currentStage} size="sm" />
            </div>
            <h1 className="text-2xl font-black text-slate-900">{app.candidateName}</h1>
            <p className="text-xs text-slate-500 mt-1">
              {app.candidateEmail} {app.candidatePhone ? `• ${app.candidatePhone}` : ""}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={`/api/cv/${app.cvFilePath}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition shadow-sm"
            >
              <FileText className="w-4 h-4" />
              <span>Inspect CV ({app.cvFileName})</span>
            </a>
          </div>
        </div>

        {/* Pipeline Transition Bar */}
        <div className="mt-6 pt-2">
          {allowedNextStages.length > 0 ? (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                Pipeline Action: Advance Candidate
              </h3>

              {transitionError && (
                <div className="p-3 mb-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{transitionError}</span>
                </div>
              )}

              <form onSubmit={handleStageChange} className="flex flex-col sm:flex-row gap-2 items-center">
                <select
                  value={targetStage}
                  onChange={(e) => setTargetStage(e.target.value)}
                  className="w-full sm:w-64 px-3 py-2 text-xs rounded-xl bg-white border border-slate-300 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="">Select Next Stage...</option>
                  {allowedNextStages.map((s) => (
                    <option key={s.stage} value={s.stage}>
                      {s.label} ({s.stage})
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  placeholder="Optional transition note or rationale..."
                  value={transitionNotes}
                  onChange={(e) => setTransitionNotes(e.target.value)}
                  className="w-full flex-1 px-3 py-2 text-xs rounded-xl bg-white border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />

                <button
                  type="submit"
                  disabled={!targetStage || transitioning}
                  className="w-full sm:w-auto px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-indigo-600 rounded-xl transition shadow-sm disabled:opacity-50"
                >
                  {transitioning ? "Updating..." : "Execute Transition"}
                </button>
              </form>
            </div>
          ) : (
            <div className="p-3 bg-slate-100 rounded-xl text-xs text-slate-600 font-medium">
              Application is in terminal stage <strong>{currentStage}</strong>. No further forward transitions
              permitted by recruitment policy.
            </div>
          )}
        </div>
      </div>

      {/* Two-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (AI Summary & Interview) */}
        <div className="lg:col-span-7 space-y-6">
          {/* AI CV Summary Panel */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">AI-Generated Summary</h2>
                  <p className="text-[11px] text-slate-400">Strictly assistive; recruiter makes all decisions</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    aiSummary?.status === "completed"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : aiSummary?.status === "pending"
                      ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                      : "bg-rose-50 text-rose-700 border border-rose-200"
                  }`}
                >
                  {aiSummary?.status === "completed" ? "completed" : aiSummary?.status === "pending" ? "pending" : "unavailable"}
                </span>

                {(!aiSummary || aiSummary?.status === "failed") && (
                  <button
                    onClick={handleRetryAi}
                    disabled={retryingAi}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 transition"
                  >
                    <RotateCcw className={`w-3 h-3 ${retryingAi ? "animate-spin" : ""}`} />
                    <span>Try Again</span>
                  </button>
                )}
              </div>
            </div>

            {!aiSummary || aiSummary?.status === "failed" ? (
              <div className="p-4 bg-rose-50/60 border border-rose-200 rounded-2xl text-center space-y-2">
                <AlertCircle className="w-6 h-6 text-rose-500 mx-auto" />
                <h4 className="text-xs font-bold text-rose-900">Summary not available</h4>
                <p className="text-[11px] text-rose-700 max-w-sm mx-auto">
                  {aiSummary?.errorMessage ||
                    "An error occurred while generating the AI summary. Click 'Try Again' to retry."}
                </p>
                <button
                  onClick={handleRetryAi}
                  disabled={retryingAi}
                  className="px-3 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition"
                >
                  {retryingAi ? "Retrying..." : "Try Again"}
                </button>
              </div>
            ) : aiSummary?.status === "pending" ? (
              <div className="py-8 text-center text-xs text-slate-500 space-y-2">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-600" />
                <p>Analyzing CV against job requirements in background...</p>
              </div>
            ) : aiSummary ? (
              <div className="space-y-4 text-xs">
                {/* 3-5 Bullet Candidate Profile */}
                <div>
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-1.5">
                    Candidate Profile
                  </h4>
                  <ul className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {(aiSummary.shortProfile || aiSummary.candidateProfileBullets || []).map((bullet: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2 text-slate-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Requirements Found vs Not Found */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-emerald-50/60 border border-emerald-100 p-3 rounded-xl">
                    <h4 className="font-bold text-emerald-900 text-[11px] uppercase tracking-wider mb-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Requirements Found
                    </h4>
                    <ul className="space-y-1 text-emerald-800">
                      {(aiSummary.requirementsFound || []).length > 0 ? (
                        aiSummary.requirementsFound.map((r: string, i: number) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span>•</span>
                            <span>{r}</span>
                          </li>
                        ))
                      ) : (
                        <li className="text-slate-400 italic">None identified</li>
                      )}
                    </ul>
                  </div>

                  <div className="bg-rose-50/60 border border-rose-100 p-3 rounded-xl">
                    <h4 className="font-bold text-rose-900 text-[11px] uppercase tracking-wider mb-1 flex items-center gap-1">
                      <XCircle className="w-3.5 h-3.5 text-rose-600" />
                      Requirements Missing
                    </h4>
                    <ul className="space-y-1 text-rose-800">
                      {(aiSummary.requirementsNotFound || aiSummary.requirementsMissing || []).length > 0 ? (
                        (aiSummary.requirementsNotFound || aiSummary.requirementsMissing || []).map((r: string, i: number) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span>•</span>
                            <span>{r}</span>
                          </li>
                        ))
                      ) : (
                        <li className="text-slate-400 italic">None missing</li>
                      )}
                    </ul>
                  </div>
                </div>

                {/* Exactly 3 Interview Questions */}
                <div>
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-1.5">
                    Suggested Technical Interview Questions (3)
                  </h4>
                  <div className="space-y-2">
                    {(aiSummary.interviewQuestions || aiSummary.suggestedInterviewQuestions || []).map((q: string, idx: number) => (
                      <div key={idx} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-start gap-2">
                        <span className="w-5 h-5 rounded-md bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0 text-[11px]">
                          {idx + 1}
                        </span>
                        <span className="text-slate-700 font-medium leading-relaxed">{q}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI Privacy Guard Notice */}
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] text-slate-500 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    <strong>AI Safety Policy:</strong> Demographic attributes (DOB, religion, gender) are excluded.
                    AI does not rank or make hiring decisions.
                  </span>
                </div>
              </div>
            ) : null}
          </div>

          {/* Scheduled Interviews History */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-purple-600" />
                <h3 className="text-sm font-bold text-slate-900">Interview Log</h3>
              </div>
              {currentStage === "interview" && (
                <button
                  onClick={() => setInterviewModalOpen(true)}
                  className="px-2.5 py-1 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition"
                >
                  + New Interview Slot
                </button>
              )}
            </div>

            {interviews.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">No interviews logged yet.</div>
            ) : (
              <div className="space-y-2">
                {interviews.map((iv) => (
                  <div
                    key={iv.id}
                    className="p-3 bg-purple-50/50 border border-purple-100 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900">
                        {new Date(iv.scheduledTime).toLocaleString()}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Location / Link: <strong>{iv.locationOrLink}</strong>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-100 text-purple-800">
                      Scheduled
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Recruiter Notes & Audit Trail */}
        <div className="lg:col-span-5 space-y-6">
          {/* Private Recruiter Notes (Test 9: Privacy verification) */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-slate-700" />
                <h3 className="text-sm font-bold text-slate-900">Private Recruiter Notes</h3>
              </div>
              <span className="flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                <Lock className="w-3 h-3" />
                Staff Only
              </span>
            </div>

            <form onSubmit={handleAddNote} className="space-y-2">
              <textarea
                rows={3}
                placeholder="Write confidential internal feedback on technical assessment, culture fit..."
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                className="w-full p-3 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!newNoteText.trim() || addingNote}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition disabled:opacity-50"
                >
                  <Send className="w-3 h-3" />
                  <span>{addingNote ? "Adding..." : "Add Note"}</span>
                </button>
              </div>
            </form>

            <div className="space-y-2.5 max-h-64 overflow-y-auto pt-2">
              {notes.length === 0 ? (
                <div className="text-center py-4 text-xs text-slate-400">No recruiter notes yet.</div>
              ) : (
                notes.map((n) => (
                  <div key={n.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                      <span className="font-bold text-slate-700">{n.recruiterName || n.authorName}</span>
                      <span>{new Date(n.createdAt).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-slate-800 whitespace-pre-line leading-relaxed">{n.note}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Stage Audit Trail */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Clock className="w-4 h-4 text-slate-700" />
              <h3 className="text-sm font-bold text-slate-900">Stage Audit History</h3>
            </div>

            <div className="space-y-3">
              {history.map((h, i) => (
                <div key={h.id || i} className="flex items-start gap-3 text-xs">
                  <div className="w-2 h-2 rounded-full bg-indigo-600 mt-1.5 shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">
                        {h.fromStage ? `${h.fromStage} → ` : ""}
                        {h.toStage}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(h.changedAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500">By: {h.changedByName}</div>
                    {h.notes && <div className="text-[11px] text-slate-600 italic mt-0.5">"{h.notes}"</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Interview Modal */}
      {interviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Schedule Candidate Interview</h3>
            <p className="text-xs text-slate-500">
              Pick interview date & time. Validation prevents past dates and overlapping recruiter slots.
            </p>

            {interviewError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{interviewError}</span>
              </div>
            )}

            <form onSubmit={handleScheduleInterview} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={interviewTime}
                  onChange={(e) => setInterviewTime(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Location or Meeting URL
                </label>
                <input
                  type="text"
                  required
                  placeholder="https://meet.google.com/xyz or Room 204"
                  value={interviewLocation}
                  onChange={(e) => setInterviewLocation(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setInterviewModalOpen(false);
                    setInterviewError(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={schedulingInterview}
                  className="px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition shadow-sm disabled:opacity-50"
                >
                  {schedulingInterview ? "Scheduling..." : "Confirm & Send Email"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
