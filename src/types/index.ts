/**
 * Types & Interfaces for Nowshera Digital ATS
 */

export type UserRole = "candidate" | "recruiter" | "admin";

export type JobType = "Full-time" | "Part-time" | "Internship";

export type JobStatus = "draft" | "open" | "closed";

export type ApplicationStage =
  | "applied"
  | "shortlisted"
  | "interview"
  | "offer"
  | "hired"
  | "rejected"
  | "withdrawn";

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  phone?: string;
  currentCvPath?: string;
  currentCvName?: string;
  assignedJobIds?: string[];
  isActive: boolean;
  createdAt: string;
}

export interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  jobType: JobType;
  description: string;
  requirements: string[];
  lastDate: string; // ISO date YYYY-MM-DD
  openings: number;
  filledOpenings: number;
  status: JobStatus;
  assignedRecruiterIds: string[];
  recruiterIds?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Application {
  id: string;
  jobId: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone?: string;
  cvId?: string;
  cvFilePath: string;
  cvFileName: string;
  status: ApplicationStage;
  currentStage?: ApplicationStage; // Alias for convenience
  appliedAt: string;
  withdrawnAt?: string;
  updatedAt: string;
  jobTitle?: string;
  jobDepartment?: string;
  department?: string; // Alias
}

export interface StageHistoryItem {
  id: string;
  applicationId: string;
  fromStage: ApplicationStage;
  toStage: ApplicationStage;
  changedById: string;
  changedByName: string;
  changedByRole: UserRole;
  notes?: string;
  changedAt: string;
}

export type StageHistory = StageHistoryItem;

export interface Interview {
  id: string;
  applicationId: string;
  recruiterId: string;
  recruiterName: string;
  scheduledTime: string; // ISO string
  endTime: string; // ISO string (1 hour after scheduledTime)
  locationOrLink: string;
  status?: string;
  createdAt: string;
}

export interface RecruiterNote {
  id: string;
  applicationId: string;
  recruiterId: string;
  recruiterName: string;
  authorName?: string; // Alias for recruiterName
  note: string;
  createdAt: string;
}

export interface AISummary {
  id: string;
  applicationId: string;
  status: "pending" | "completed" | "failed";
  shortProfile: string[]; // 3-5 bullet points
  candidateProfileBullets?: string[]; // Alias
  requirementsFound: string[];
  requirementsNotFound: string[];
  requirementsMissing?: string[]; // Alias
  interviewQuestions: string[]; // exactly 3 questions
  suggestedInterviewQuestions?: string[]; // Alias
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmailEvent {
  id: string;
  eventType: "application_received" | "interview_invitation" | "hired" | "rejected" | "recruiter_setup";
  recipientEmail: string;
  recipientName: string;
  subject: string;
  payload: Record<string, any>;
  status: "queued" | "processing" | "sent" | "failed" | "dispatched_to_n8n" | "simulated";
  idempotencyKey: string;
  sentAt: string;
}

export interface JobStats {
  jobId: string;
  jobTitle: string;
  totalApplications: number;
  applied: number;
  shortlisted: number;
  interview: number;
  offer: number;
  hired: number;
  rejected: number;
  withdrawn: number;
  openings: number;
  status: JobStatus;
}

export interface GlobalATSStats {
  totalJobs: number;
  draftJobs: number;
  openJobs: number;
  closedJobs: number;
  totalApplications: number;
  totalHired: number;
  totalInterviews: number;
  jobStats: JobStats[];
}
