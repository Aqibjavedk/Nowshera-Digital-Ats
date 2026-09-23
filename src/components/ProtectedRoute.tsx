import React from "react";
import { ShieldAlert, Lock, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface ProtectedRouteProps {
  allowedRoles?: ("admin" | "recruiter" | "candidate")[];
  onNavigate: (view: string) => void;
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  allowedRoles,
  onNavigate,
  children,
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8">
        <div className="w-8 h-8 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
        <p className="text-xs font-semibold text-slate-500">Checking credentials &amp; permissions...</p>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white rounded-3xl border border-slate-200 p-8 text-center shadow-lg">
        <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-700 mx-auto mb-4">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-black text-slate-900 tracking-tight mb-2">
          Authentication Required
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mb-6">
          Please sign in to your Nowshera ATS account to access this section.
        </p>
        <button
          onClick={() => onNavigate("login")}
          className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition"
        >
          <span>Go to Sign In</span>
          <ArrowRight className="w-4 h-4 text-indigo-400" />
        </button>
      </div>
    );
  }

  // Role not authorized
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white rounded-3xl border border-rose-200 p-8 text-center shadow-lg">
        <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 mx-auto mb-4">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-black text-slate-900 tracking-tight mb-2">
          403 Access Denied
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 mb-2">
          You do not have permission to view this section.
        </p>
        <div className="inline-block px-3 py-1 bg-slate-100 rounded-lg text-xs font-mono text-slate-700 mb-6">
          Current Role: <span className="font-bold uppercase text-indigo-700">{user.role}</span> &bull; Required:{" "}
          <span className="font-bold uppercase text-slate-900">{allowedRoles.join(" or ")}</span>
        </div>
        <div className="space-y-2">
          <button
            onClick={() => {
              if (user.role === "admin") onNavigate("admin-dashboard");
              else if (user.role === "recruiter") onNavigate("recruiter-dashboard");
              else onNavigate("my-applications");
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm transition"
          >
            Return to Authorized Dashboard
          </button>
          <button
            onClick={() => onNavigate("jobs")}
            className="w-full py-2 px-4 rounded-xl text-slate-600 hover:text-slate-900 font-semibold text-xs transition"
          >
            Browse Open Jobs
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
