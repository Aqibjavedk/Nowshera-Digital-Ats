import React, { useState } from "react";
import { Mail, Lock, AlertCircle, ArrowRight, CheckCircle2, Shield, User, Briefcase, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

interface LoginPageProps {
  onNavigate: (view: string) => void;
  onSuccessRedirect?: (role: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate, onSuccessRedirect }) => {
  const { signIn, forgotPassword } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage("Please enter both your email address and password.");
      return;
    }

    setLoading(true);
    try {
      const user = await signIn(email.trim(), password);
      setSuccessMessage(`Welcome back, ${user.fullName}! Redirecting...`);

      setTimeout(() => {
        if (onSuccessRedirect) {
          onSuccessRedirect(user.role);
        } else {
          if (user.role === "admin") {
            onNavigate("admin-dashboard");
          } else if (user.role === "recruiter") {
            onNavigate("recruiter-dashboard");
          } else {
            onNavigate("my-applications");
          }
        }
      }, 500);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to sign in. Please verify your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      setResetMessage("Please provide your registered email address.");
      return;
    }

    setResetLoading(true);
    setResetMessage(null);
    try {
      await forgotPassword(resetEmail.trim());
      setResetMessage("If an account matches that email, reset instructions have been dispatched.");
      setTimeout(() => {
        setShowForgotPasswordModal(false);
        setResetMessage(null);
      }, 2500);
    } catch (err: any) {
      setResetMessage(err.message || "Could not process request. Please try again.");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-8">
      {/* Main Sign In Form Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 p-7 sm:p-8">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-indigo-400 mx-auto mb-3 shadow-md shadow-slate-900/10">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Sign In to Nowshera ATS
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Access your applications, candidates, or hiring pipeline
          </p>
        </div>

        {errorMessage && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-800">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Authentication failed: </span>
              {errorMessage}
            </div>
          </div>
        )}

        {successMessage && (
          <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2.5 text-xs text-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSignIn} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Email Address <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. your.email@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700">
                Password <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  setResetEmail(email);
                  setShowForgotPasswordModal(true);
                }}
                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 transition"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your account password"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 transition"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm shadow-md shadow-slate-900/10 flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Signing In...
              </span>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4 text-indigo-400" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500 mb-3">Don't have a candidate account yet?</p>
          <button
            type="button"
            onClick={() => onNavigate("signup")}
            className="w-full py-2.5 px-4 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-800 font-bold text-xs sm:text-sm hover:bg-indigo-100 transition"
          >
            Create Candidate Account
          </button>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900 mb-1">Reset Password</h3>
            <p className="text-xs text-slate-500 mb-4">
              Enter your email address to receive password recovery instructions.
            </p>

            {resetMessage && (
              <div className="mb-4 p-3 rounded-xl bg-indigo-50 border border-indigo-100 text-xs text-indigo-900">
                {resetMessage}
              </div>
            )}

            <form onSubmit={handleForgotPassword} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Registered Email
                </label>
                <input
                  type="email"
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="e.g. candidate@example.com"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForgotPasswordModal(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition disabled:opacity-50"
                >
                  {resetLoading ? "Sending..." : "Send Reset Link"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
