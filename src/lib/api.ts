/**
 * Frontend API client for Nowshera Digital ATS
 */

import { Application, EmailEvent, GlobalATSStats, Job, UserProfile } from "../types";

// Get currently stored active user ID and token
export function getActiveUserId(): string | null {
  return localStorage.getItem("ats_user_id") || null;
}

export function getAuthToken(): string | null {
  return localStorage.getItem("ats_auth_token") || localStorage.getItem("ats_user_id") || null;
}

export function setAuthSession(token: string, userId: string): void {
  localStorage.setItem("ats_auth_token", token);
  localStorage.setItem("ats_user_id", userId);
}

export function clearAuthSession(): void {
  localStorage.removeItem("ats_auth_token");
  localStorage.removeItem("ats_user_id");
}

export function setActiveUserId(id: string): void {
  localStorage.setItem("ats_user_id", id);
  localStorage.setItem("ats_auth_token", id);
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const userId = getActiveUserId();
  const headers = new Headers(options.headers || {});
  
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (userId) {
    headers.set("x-user-id", userId);
  }

  const res = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await res.json();
  if (!res.ok) {
    const errorMsg = data.message || data.error || `Request failed with status ${res.status}`;
    const err = new Error(errorMsg);
    (err as any).status = res.status;
    (err as any).data = data;
    throw err;
  }
  return data;
}

export const api = {
  // Auth
  login: (payload: { email: string; password: string }) =>
    request<{ user: UserProfile; token: string }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  registerCandidate: (payload: { fullName: string; email: string; password: string; confirmPassword?: string; phone?: string }) =>
    request<{ user: UserProfile; token: string; message: string }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  forgotPassword: (payload: { email: string }) =>
    request<{ success: boolean; message: string }>("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  logout: () =>
    request<{ success: boolean; message: string }>("/api/auth/logout", {
      method: "POST",
    }),
  getMe: () => request<{ user: UserProfile | null; allDemoUsers: UserProfile[] }>("/api/auth/me"),
  switchDemoUser: (userId: string) =>
    request<{ success: boolean; user: UserProfile }>("/api/auth/switch-demo", {
      method: "POST",
      body: JSON.stringify({ userId }),
    }),
  register: (payload: { email: string; fullName: string; role?: string; phone?: string; password?: string }) =>
    request<{ user: UserProfile }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  validateSetupToken: (token: string) =>
    request<{
      valid: boolean;
      recruiter: { id: string; email: string; fullName: string; role: string };
      message?: string;
      error?: string;
    }>(`/api/auth/setup/validate?token=${encodeURIComponent(token)}`),
  completeSetup: (payload: { token: string; password: string }) =>
    request<{
      success: boolean;
      message: string;
      user: UserProfile;
      token?: string;
    }>("/api/auth/setup/complete", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  // Jobs
  getJobs: () => request<{ jobs: Job[] }>("/api/jobs"),
  getJob: (id: string) => request<{ job: Job }>(`/api/jobs/${id}`),
  createJob: (payload: any) =>
    request<{ job: Job }>("/api/jobs", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  openJob: (id: string, recruiterIds: string[]) =>
    request<{ success: boolean; job: Job }>(`/api/jobs/${id}/open`, {
      method: "POST",
      body: JSON.stringify({ recruiterIds }),
    }),
  closeJob: (id: string) =>
    request<{ success: boolean; job: Job }>(`/api/jobs/${id}/close`, {
      method: "POST",
    }),
  updateJob: (id: string, payload: any) =>
    request<{ job: Job }>(`/api/jobs/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  // Recruiters
  getRecruiters: () => request<{ recruiters: UserProfile[] }>("/api/recruiters"),
  createRecruiter: (payload: { fullName: string; email: string; assignedJobIds?: string[] }) =>
    request<{
      recruiter: UserProfile;
      emailStatus?: "queued" | "processing" | "sent" | "failed" | "dispatched_to_n8n" | "simulated";
      emailMessage?: string;
    }>("/api/recruiters", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  toggleRecruiterActive: (id: string) =>
    request<{ recruiter: UserProfile }>(`/api/recruiters/${id}/toggle-active`, {
      method: "POST",
    }),

  // CV Upload
  uploadCv: async (file: File): Promise<{ success: boolean; cvId?: string; filePath: string; fileName: string; fileSize: number }> => {
    const formData = new FormData();
    formData.append("cv", file);
    return request<{ success: boolean; cvId?: string; filePath: string; fileName: string; fileSize: number }>("/api/upload-cv", {
      method: "POST",
      body: formData,
    });
  },

  // Applications
  apply: (payload: { jobId: string; cvId?: string; cvFilePath?: string; cvFileName?: string }) =>
    request<{ success: boolean; application: Application; message: string }>("/api/applications", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getMyApplications: () => request<{ applications: (Application & { interviews: any[] })[] }>("/api/my-applications"),
  withdrawApplication: (id: string) =>
    request<{ success: boolean; application: Application }>(`/api/applications/${id}/withdraw`, {
      method: "POST",
    }),
  getJobApplications: (jobId: string) =>
    request<{ applications: (Application & { interviews: any[] })[] }>(`/api/jobs/${jobId}/applications`),
  getApplicationDetail: (id: string) => request<any>(`/api/applications/${id}`),

  // Pipeline transitions
  changeStage: (id: string, targetStage: string, notes?: string) =>
    request<any>(`/api/applications/${id}/stage`, {
      method: "PATCH",
      body: JSON.stringify({ targetStage, notes }),
    }),

  // Interview
  scheduleInterview: (id: string, scheduledTime: string, locationOrLink: string) =>
    request<any>(`/api/applications/${id}/schedule-interview`, {
      method: "POST",
      body: JSON.stringify({ scheduledTime, locationOrLink }),
    }),

  // Recruiter Notes
  addNote: (id: string, note: string) =>
    request<any>(`/api/applications/${id}/notes`, {
      method: "POST",
      body: JSON.stringify({ note }),
    }),

  // AI Summary retry
  retryAISummary: (id: string) =>
    request<any>(`/api/applications/${id}/ai-summary/retry`, {
      method: "POST",
    }),

  // Stats
  getAdminStats: () => request<GlobalATSStats>("/api/admin/stats"),
  getRecruiterStats: () => request<any>("/api/recruiter/stats"),

  // Email Events
  getEmailEvents: () => request<{ events: EmailEvent[] }>("/api/email-events"),

  // Reset Test Data
  resetTestData: () => request<{ success: boolean; message: string }>("/api/test-data/reset", { method: "POST" }),

  // Supabase Database & Storage Status
  getSupabaseStatus: () =>
    request<{
      connected: boolean;
      supabaseUrl: string;
      projectRef: string;
      tablesReady: boolean;
      bucketReady: boolean;
      storageBucket: string;
      maxCvSize: string;
      allowedMimeType: string;
      schemaPath: string;
      seedPath: string;
      schemaSql: string;
      seedSql: string;
      migrationCompleteSql: string;
    }>("/api/supabase/status"),
};
