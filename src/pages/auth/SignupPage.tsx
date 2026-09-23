import React, { useState } from "react";
import { Mail, Lock, User, Phone, AlertCircle, CheckCircle2, ArrowRight, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

interface SignupPageProps {
  onNavigate: (view: string) => void;
  onSuccessRedirect?: (role: string) => void;
}

export const SignupPage: React.FC<SignupPageProps> = ({ onNavigate, onSuccessRedirect }) => {
  const { signUpCandidate } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Read form values directly from current form targets to guarantee no stale state
    const form = e.currentTarget;
    const formData = new FormData(form);

    const submittedFullName = ((formData.get("fullName") as string) ?? fullName).trim();
    const submittedEmail = ((formData.get("email") as string) ?? email).trim();
    const submittedPhone = ((formData.get("phone") as string) ?? phone).trim();
    // Do NOT automatically modify, trim, lowercase, or otherwise alter user passwords
    const submittedPassword = (formData.get("password") as string) ?? password;
    const submittedConfirmPassword = (formData.get("confirmPassword") as string) ?? confirmPassword;

    // Validation sequence
    if (!submittedFullName) {
      setErrorMessage("Please enter your full legal name.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!submittedEmail || !emailRegex.test(submittedEmail.toLowerCase())) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    // 1. Password is required
    if (!submittedPassword) {
      setErrorMessage("Password is required.");
      return;
    }

    // 2. Confirm Password is required
    if (!submittedConfirmPassword) {
      setErrorMessage("Confirm Password is required.");
      return;
    }

    // 3. Password must meet minimum requirement of 6 characters
    if (submittedPassword.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }

    // 4. Confirm Password must exactly match Password
    // 5. If they do not match, show: "Passwords do not match."
    if (submittedPassword !== submittedConfirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      // 6. If they match, continue with Supabase registration
      // Pass all 5 arguments in exact order: (fullName, email, password, confirmPassword, phone)
      const user = await signUpCandidate(
        submittedFullName,
        submittedEmail,
        submittedPassword,
        submittedConfirmPassword,
        submittedPhone
      );
      setSuccessMessage(`Account created successfully for ${user.fullName}! Welcome to Nowshera ATS.`);

      setTimeout(() => {
        if (onSuccessRedirect) {
          onSuccessRedirect("candidate");
        } else {
          onNavigate("my-applications");
        }
      }, 600);
    } catch (err: any) {
      setErrorMessage(err.message || "Could not complete registration. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-8">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 p-7 sm:p-8">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-indigo-50 border border-indigo-200 rounded-2xl flex items-center justify-center text-indigo-700 mx-auto mb-3 shadow-xs">
            <User className="w-6 h-6" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Create Candidate Account
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Apply to open roles and track your recruitment status in real time
          </p>
        </div>

        {/* Security badge notice */}
        <div className="mb-5 p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-2 text-[11px] text-slate-600">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            Candidate Portal Registration &bull; Internal recruiter and admin privileges are provisioned by invitation only.
          </span>
        </div>

        {errorMessage && (
          <div
            id="signup-error-banner"
            className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-800"
          >
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div id="signup-error-text" className="font-semibold text-rose-800">
              {errorMessage}
            </div>
          </div>
        )}

        {successMessage && (
          <div
            id="signup-success-banner"
            className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2.5 text-xs text-emerald-800"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span id="signup-success-text">{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSignUp} className="space-y-4">
          <div>
            <label htmlFor="signup-fullname" className="block text-xs font-bold text-slate-700 mb-1.5">
              Full Legal Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                id="signup-fullname"
                name="fullName"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Bilal Tariq"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              />
            </div>
          </div>

          <div>
            <label htmlFor="signup-email" className="block text-xs font-bold text-slate-700 mb-1.5">
              Email Address <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                id="signup-email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. bilal.candidate@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              />
            </div>
          </div>

          <div>
            <label htmlFor="signup-phone" className="block text-xs font-bold text-slate-700 mb-1.5">
              Optional Phone Number <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                id="signup-phone"
                name="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +92 300 1234567"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              />
            </div>
          </div>

          <div>
            <label htmlFor="signup-password" className="block text-xs font-bold text-slate-700 mb-1.5">
              Password <span className="text-rose-500">*</span>{" "}
              <span className="text-[11px] text-slate-400 font-normal">(Min 6 characters)</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                id="signup-password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Choose a strong password"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              />
              <button
                id="signup-toggle-password"
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 transition"
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="signup-confirm-password" className="block text-xs font-bold text-slate-700 mb-1.5">
              Confirm Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                id="signup-confirm-password"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-type password"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              />
              <button
                id="signup-toggle-confirm-password"
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 transition"
                tabIndex={-1}
                aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            id="signup-submit-button"
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating Candidate Account...
              </span>
            ) : (
              <>
                <span>Sign Up</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500 mb-2">Already have an account?</p>
          <button
            id="signup-goto-login-btn"
            type="button"
            onClick={() => onNavigate("login")}
            className="text-xs sm:text-sm font-bold text-indigo-600 hover:text-indigo-800 transition"
          >
            Sign In with Email &amp; Password &rarr;
          </button>
        </div>
      </div>
    </div>
  );
};
