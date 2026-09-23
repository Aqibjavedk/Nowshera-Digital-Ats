import React, { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";

import { JobsPage } from "./pages/jobs/JobsPage";
import { JobDetailPage } from "./pages/jobs/JobDetailPage";
import { CandidateDashboard } from "./pages/candidate/CandidateDashboard";
import { RecruiterDashboard } from "./pages/recruiter/RecruiterDashboard";
import { JobApplicantsPage } from "./pages/recruiter/JobApplicantsPage";
import { ApplicationDetailPage } from "./pages/recruiter/ApplicationDetailPage";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { AdminJobsPage } from "./pages/admin/AdminJobsPage";
import { AdminRecruitersPage } from "./pages/admin/AdminRecruitersPage";
import { LoginPage } from "./pages/auth/LoginPage";
import { SignupPage } from "./pages/auth/SignupPage";
import { SetupPage } from "./pages/auth/SetupPage";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { CheckCircle2, AlertCircle, Info } from "lucide-react";

function MainApp() {
  const { user, toastMessage } = useAuth();
  
  // Detect setup URL or route on load
  const [currentView, setCurrentView] = useState<string>(() => {
    const path = window.location.pathname;
    const search = window.location.search;
    const href = window.location.href;

    if (
      path.includes("/auth/setup") ||
      path.startsWith("/setup") ||
      href.includes("/auth/setup") ||
      new URLSearchParams(search).has("token") ||
      (path.includes("__cookie_check.html") && (search.includes("setup") || search.includes("token")))
    ) {
      return "setup";
    }
    if (path === "/login") return "login";
    if (path === "/signup") return "signup";
    return "jobs";
  });

  const [selectedJobId, setSelectedJobId] = useState<string>("job-1");
  const [selectedApplicationId, setSelectedApplicationId] = useState<string>("app-1");

  // Keep state synchronized with browser navigation
  React.useEffect(() => {
    const handleUrlCheck = () => {
      const path = window.location.pathname;
      const search = window.location.search;
      const href = window.location.href;

      if (
        path.includes("/auth/setup") ||
        path.startsWith("/setup") ||
        href.includes("/auth/setup") ||
        new URLSearchParams(search).has("token") ||
        (path.includes("__cookie_check.html") && (search.includes("setup") || search.includes("token")))
      ) {
        setCurrentView("setup");
      }
    };
    window.addEventListener("popstate", handleUrlCheck);
    window.addEventListener("hashchange", handleUrlCheck);
    return () => {
      window.removeEventListener("popstate", handleUrlCheck);
      window.removeEventListener("hashchange", handleUrlCheck);
    };
  }, []);

  const handleNavigate = (view: string, id?: string) => {
    if (id) {
      if (view === "job-detail" || view === "job-applications") {
        setSelectedJobId(id);
      } else if (view === "application-detail") {
        setSelectedApplicationId(id);
      }
    }
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900 antialiased selection:bg-indigo-500 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl text-xs font-semibold border ${
              toastMessage.type === "success"
                ? "bg-slate-900 text-white border-slate-800"
                : toastMessage.type === "error"
                ? "bg-rose-600 text-white border-rose-500"
                : "bg-indigo-900 text-white border-indigo-800"
            }`}
          >
            {toastMessage.type === "success" && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            {toastMessage.type === "error" && <AlertCircle className="w-4 h-4 text-rose-300" />}
            {toastMessage.type === "info" && <Info className="w-4 h-4 text-indigo-300" />}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Top Navigation */}
      <Header
        currentView={currentView}
        onNavigate={handleNavigate}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === "login" && (
          <LoginPage
            onNavigate={handleNavigate}
            onSuccessRedirect={(role) => {
              if (role === "admin") handleNavigate("admin-dashboard");
              else if (role === "recruiter") handleNavigate("recruiter-dashboard");
              else handleNavigate("my-applications");
            }}
          />
        )}

        {currentView === "signup" && (
          <SignupPage
            onNavigate={handleNavigate}
            onSuccessRedirect={() => handleNavigate("my-applications")}
          />
        )}

        {currentView === "setup" && (
          <SetupPage
            onNavigate={handleNavigate}
            onSuccessRedirect={(role) => {
              if (role === "recruiter") handleNavigate("recruiter-dashboard");
              else if (role === "admin") handleNavigate("admin-dashboard");
              else handleNavigate("my-applications");
            }}
          />
        )}

        {currentView === "jobs" && (
          <JobsPage onSelectJob={(jobId) => handleNavigate("job-detail", jobId)} />
        )}

        {currentView === "job-detail" && (
          <JobDetailPage
            jobId={selectedJobId}
            onBack={() => handleNavigate("jobs")}
            onNavigateToMyApplications={() => handleNavigate("my-applications")}
          />
        )}

        {(currentView === "my-applications" || currentView === "profile") && (
          <ProtectedRoute allowedRoles={["candidate", "recruiter", "admin"]} onNavigate={handleNavigate}>
            <CandidateDashboard
              onNavigateToJobs={() => handleNavigate("jobs")}
              onNavigateToJobDetail={(jobId) => handleNavigate("job-detail", jobId)}
            />
          </ProtectedRoute>
        )}

        {currentView === "recruiter-dashboard" && (
          <ProtectedRoute allowedRoles={["recruiter", "admin"]} onNavigate={handleNavigate}>
            <RecruiterDashboard
              onSelectJob={(jobId) => handleNavigate("job-applications", jobId)}
            />
          </ProtectedRoute>
        )}

        {currentView === "job-applications" && (
          <ProtectedRoute allowedRoles={["recruiter", "admin"]} onNavigate={handleNavigate}>
            <JobApplicantsPage
              jobId={selectedJobId}
              onBack={() => handleNavigate("recruiter-dashboard")}
              onSelectApplication={(appId) => handleNavigate("application-detail", appId)}
            />
          </ProtectedRoute>
        )}

        {currentView === "application-detail" && (
          <ProtectedRoute allowedRoles={["recruiter", "admin"]} onNavigate={handleNavigate}>
            <ApplicationDetailPage
              applicationId={selectedApplicationId}
              onBack={() => handleNavigate("job-applications", selectedJobId)}
            />
          </ProtectedRoute>
        )}

        {currentView === "admin-dashboard" && (
          <ProtectedRoute allowedRoles={["admin"]} onNavigate={handleNavigate}>
            <AdminDashboard
              onNavigateToJobs={() => handleNavigate("admin-jobs")}
              onNavigateToRecruiters={() => handleNavigate("admin-recruiters")}
              onSelectJob={(jobId) => handleNavigate("job-applications", jobId)}
            />
          </ProtectedRoute>
        )}

        {currentView === "admin-jobs" && (
          <ProtectedRoute allowedRoles={["admin"]} onNavigate={handleNavigate}>
            <AdminJobsPage onSelectJob={(jobId) => handleNavigate("job-applications", jobId)} />
          </ProtectedRoute>
        )}

        {currentView === "admin-recruiters" && (
          <ProtectedRoute allowedRoles={["admin"]} onNavigate={handleNavigate}>
            <AdminRecruitersPage />
          </ProtectedRoute>
        )}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
