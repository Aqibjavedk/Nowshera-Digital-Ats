import React, { useState, useEffect } from "react";
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, RefreshCw, ArrowRight, ShieldCheck, UserCheck, Mail, KeyRound } from "lucide-react";
import { api, setAuthSession } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";

interface SetupPageProps {
  initialToken?: string;
  onNavigate: (view: string) => void;
  onSuccessRedirect?: (role: string) => void;
}

type SetupState = "loading" | "valid" | "expired" | "invalid" | "used" | "error" | "success";

/**
 * Extracts and sanitizes the 64-character hexadecimal recruiter setup token from the current URL.
 * Handles direct search parameters, return_url redirects (__cookie_check.html), and double URL encoding.
 */
export function extractSetupTokenFromLocation(): string {
  if (typeof window === "undefined") return "";

  const href = window.location.href || "";
  const search = window.location.search || "";

  // 1. Direct query parameter: 'token'
  try {
    const urlParams = new URLSearchParams(search);
    const directToken = urlParams.get("token");
    if (directToken) {
      const clean = directToken.trim().toLowerCase();
      if (/^[0-9a-f]{64}$/.test(clean)) return clean;
      const match = clean.match(/[0-9a-f]{64}/);
      if (match) return match[0];
    }

    // 2. Check return_url / returnUrl / redirect_to parameter (e.g. from __cookie_check.html)
    const returnUrlParam = urlParams.get("return_url") || urlParams.get("returnUrl") || urlParams.get("redirect_to");
    if (returnUrlParam) {
      let decodedUrl = returnUrlParam;
      try { decodedUrl = decodeURIComponent(decodedUrl); } catch {}
      try { decodedUrl = decodeURIComponent(decodedUrl); } catch {}

      // Search inside decoded URL query
      if (decodedUrl.includes("?")) {
        const subSearch = decodedUrl.substring(decodedUrl.indexOf("?"));
        const subParams = new URLSearchParams(subSearch);
        const subToken = subParams.get("token");
        if (subToken) {
          const cleanSub = subToken.trim().toLowerCase();
          if (/^[0-9a-f]{64}$/.test(cleanSub)) return cleanSub;
          const matchSub = cleanSub.match(/[0-9a-f]{64}/);
          if (matchSub) return matchSub[0];
        }
      }

      // Scan decoded return_url for 64-character hex sequence
      const matchInReturnUrl = decodedUrl.match(/(?:token[=%\uFFFD\s]*)([0-9a-fA-F]{64})/i) || decodedUrl.match(/[0-9a-fA-F]{64}/);
      if (matchInReturnUrl) {
        const found = (matchInReturnUrl[1] || matchInReturnUrl[0]).toLowerCase();
        if (/^[0-9a-f]{64}$/.test(found)) return found;
      }
    }
  } catch (err) {
    console.warn("Error parsing URL parameters:", err);
  }

  // 3. Scan the entire decoded href for a 64-hex token
  try {
    let decodedHref = href;
    try { decodedHref = decodeURIComponent(decodedHref); } catch {}
    try { decodedHref = decodeURIComponent(decodedHref); } catch {}

    const matchHref = decodedHref.match(/(?:token[=%\uFFFD\s]*)([0-9a-fA-F]{64})/i) || decodedHref.match(/[0-9a-fA-F]{64}/);
    if (matchHref) {
      const found = (matchHref[1] || matchHref[0]).toLowerCase();
      if (/^[0-9a-f]{64}$/.test(found)) return found;
    }
  } catch {
    // ignore
  }

  return "";
}

export const SetupPage: React.FC<SetupPageProps> = ({
  initialToken,
  onNavigate,
  onSuccessRedirect,
}) => {
  const { showToast, refreshAuth } = useAuth();

  // Extract token from prop or current URL parameters
  const [token, setToken] = useState<string>(() => {
    if (initialToken && /^[0-9a-f]{64}$/i.test(initialToken.trim())) {
      return initialToken.trim().toLowerCase();
    }
    return extractSetupTokenFromLocation();
  });

  const [state, setState] = useState<SetupState>("loading");
  const [recruiterInfo, setRecruiterInfo] = useState<{ id: string; email: string; fullName: string; role: string } | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("");

  // Form inputs
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const validateToken = async (tokenToValidate: string) => {
    const cleanToken = tokenToValidate ? tokenToValidate.trim().toLowerCase() : "";
    
    if (!cleanToken) {
      setState("invalid");
      setStatusMessage("No setup token provided in the link. Please check your invitation email.");
      return;
    }

    if (!/^[0-9a-f]{64}$/.test(cleanToken)) {
      setState("invalid");
      setStatusMessage("Invalid setup token format. A setup token must be a 64-character hexadecimal key.");
      return;
    }

    setState("loading");
    setFormError(null);

    try {
      const data = await api.validateSetupToken(cleanToken);
      if (data.valid && data.recruiter) {
        setRecruiterInfo(data.recruiter);
        setState("valid");
      } else {
        setState("invalid");
        setStatusMessage(data.message || "This setup link is invalid or malformed.");
      }
    } catch (err: any) {
      const msg = err?.message || "";
      const errType = err?.data?.error || "";

      if (msg.includes("already been used") || msg.toLowerCase().includes("used") || errType === "used") {
        setState("used");
        setStatusMessage("This recruiter setup link has already been used. Please log in with your password.");
      } else if (msg.includes("expired") || msg.toLowerCase().includes("expired") || errType === "expired") {
        setState("expired");
        setStatusMessage("This recruiter setup invitation has expired (valid for 48 hours). Please contact your administrator for a new invite.");
      } else if (msg.includes("invalid") || msg.includes("not found") || msg.includes("404") || errType === "invalid") {
        setState("invalid");
        setStatusMessage(msg || "This recruiter setup link is invalid or does not exist.");
      } else {
        setState("error");
        setStatusMessage(msg || "Unable to verify setup invitation. Please check your network connection and retry.");
      }
    }
  };

  useEffect(() => {
    const extracted = token || extractSetupTokenFromLocation();
    if (extracted) {
      setToken(extracted);
      validateToken(extracted);
    } else {
      setState("invalid");
      setStatusMessage("Missing or invalid setup token. Please use the complete link provided in your welcome email.");
    }
  }, []);

  const handleCompleteSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!password) {
      setFormError("Please enter a new password.");
      return;
    }

    if (password.length < 8) {
      setFormError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setFormError("Passwords do not match. Please verify and re-type.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await api.completeSetup({
        token: token.trim(),
        password,
      });

      setState("success");
      setStatusMessage(res.message || "Your recruiter account has been set up successfully!");
      showToast("Account setup complete! Redirecting...", "success");

      if (res.token && res.user) {
        setAuthSession(res.token, res.user.id);
        await refreshAuth();
      }

      // Smooth redirect after 1.5 seconds
      setTimeout(() => {
        if (onSuccessRedirect) {
          onSuccessRedirect("recruiter");
        } else {
          onNavigate("recruiter-dashboard");
        }
      }, 1500);
    } catch (err: any) {
      setFormError(err.message || "Failed to finalize account setup. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-8 animate-in fade-in duration-300">
      {/* Brand / Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 mb-4 ring-4 ring-indigo-50">
          <KeyRound className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900">
          Recruiter Account Setup
        </h1>
        <p className="text-sm text-slate-500 mt-1.5">
          Nowshera Digital Applicant Tracking System
        </p>
      </div>

      {/* State: LOADING */}
      {state === "loading" && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 mb-4 animate-spin">
            <RefreshCw className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-slate-900">Verifying Invitation...</h2>
          <p className="text-xs text-slate-500 mt-1">
            Please wait while we validate your secure recruiter invitation link.
          </p>
        </div>
      )}

      {/* State: INVALID TOKEN */}
      {state === "invalid" && (
        <div className="bg-white rounded-3xl border border-rose-200 shadow-sm p-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-black text-slate-900">Invalid Setup Link</h2>
          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
            {statusMessage || "This recruiter setup link is invalid, incomplete, or corrupted."}
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <button
              onClick={() => onNavigate("login")}
              className="w-full py-3 px-4 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition flex items-center justify-center gap-2"
            >
              Go to Sign In
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* State: EXPIRED TOKEN */}
      {state === "expired" && (
        <div className="bg-white rounded-3xl border border-amber-200 shadow-sm p-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-black text-slate-900">Setup Link Expired</h2>
          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
            {statusMessage || "For security, recruiter setup links expire after 48 hours. Please contact your system administrator to re-issue your invite."}
          </p>
          <div className="mt-6">
            <button
              onClick={() => onNavigate("login")}
              className="w-full py-3 px-4 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition flex items-center justify-center gap-2"
            >
              Return to Sign In
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* State: ALREADY USED */}
      {state === "used" && (
        <div className="bg-white rounded-3xl border border-indigo-200 shadow-sm p-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 mb-4">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-black text-slate-900">Account Already Set Up</h2>
          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
            {statusMessage || "This invitation link has already been used to set up your password. You can now sign in directly."}
          </p>
          <div className="mt-6">
            <button
              onClick={() => onNavigate("login")}
              className="w-full py-3 px-4 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition flex items-center justify-center gap-2"
            >
              Sign In to Your Account
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* State: ERROR / NETWORK FAILURE */}
      {state === "error" && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-black text-slate-900">Connection Error</h2>
          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
            {statusMessage || "An unexpected error occurred while verifying your invitation."}
          </p>
          <div className="mt-6 flex gap-3">
            <button
              onClick={() => validateToken(token)}
              className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Try Again
            </button>
            <button
              onClick={() => onNavigate("login")}
              className="py-3 px-4 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition"
            >
              Sign In
            </button>
          </div>
        </div>
      )}

      {/* State: SUCCESS */}
      {state === "success" && (
        <div className="bg-white rounded-3xl border border-emerald-200 shadow-xl p-8 text-center animate-in zoom-in-95 duration-300">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 mb-4 ring-4 ring-emerald-100/60">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-black text-slate-900">Setup Complete!</h2>
          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
            {statusMessage || "Your recruiter credentials have been saved. Redirecting to your dashboard..."}
          </p>
          <div className="mt-6">
            <button
              onClick={() => {
                if (onSuccessRedirect) onSuccessRedirect("recruiter");
                else onNavigate("recruiter-dashboard");
              }}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-2"
            >
              Go to Recruiter Dashboard
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* State: VALID - SHOW SETUP FORM */}
      {state === "valid" && recruiterInfo && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl p-6 sm:p-8">
          {/* Recruiter Details Summary Card */}
          <div className="mb-6 p-4 rounded-2xl bg-slate-50 border border-slate-200/60">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Verified Recruiter Profile
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                <ShieldCheck className="w-3 h-3" />
                Role: Recruiter
              </span>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                <UserCheck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span>{recruiterInfo.fullName}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="font-mono text-[11px]">{recruiterInfo.email}</span>
              </div>
            </div>
          </div>

          {formError && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleCompleteSetup} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Must contain at least 8 characters.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 active:scale-[0.99] disabled:opacity-50 transition shadow-md shadow-indigo-600/25 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Activating Account...</span>
                </>
              ) : (
                <>
                  <span>Complete Account Setup</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <button
              type="button"
              onClick={() => onNavigate("login")}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition"
            >
              Already have an active password? Sign in
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
