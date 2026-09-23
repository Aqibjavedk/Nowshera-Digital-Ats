import React, { useState } from "react";
import {
  Briefcase,
  User,
  Users,
  Shield,
  FileText,
  Mail,
  CheckCircle2,
  Menu,
  X,
  ChevronDown,
  Sparkles,
  Database,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface HeaderProps {
  currentView: string;
  onNavigate: (view: string, id?: string) => void;
  onOpenTestCases?: () => void;
  onOpenEmailAudit?: () => void;
  onOpenSupabaseStatus?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
}) => {
  const { user, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const role = user?.role || "candidate";

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => onNavigate("jobs")}
              className="flex items-center gap-2.5 text-left focus:outline-none"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black tracking-tight shadow-md shadow-slate-900/10">
                <Briefcase className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-base tracking-tight text-slate-900">
                    Nowshera Digital
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase tracking-wider">
                    ATS
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 hidden sm:block">
                  Centralized Hiring Platform
                </p>
              </div>
            </button>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1">
              <button
                onClick={() => onNavigate("jobs")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  currentView === "jobs"
                    ? "bg-slate-100 text-slate-900"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                Browse Jobs
              </button>

              {role === "candidate" && (
                <button
                  onClick={() => onNavigate("my-applications")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    currentView === "my-applications"
                      ? "bg-slate-100 text-slate-900"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  My Applications
                </button>
              )}

              {role === "recruiter" && (
                <button
                  onClick={() => onNavigate("recruiter-dashboard")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    currentView === "recruiter-dashboard"
                      ? "bg-slate-100 text-slate-900"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  Assigned Recruitment Pipeline
                </button>
              )}

              {role === "admin" && (
                <>
                  <button
                    onClick={() => onNavigate("admin-dashboard")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      currentView === "admin-dashboard"
                        ? "bg-slate-100 text-slate-900"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    Admin Metrics
                  </button>
                  <button
                    onClick={() => onNavigate("admin-jobs")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      currentView === "admin-jobs"
                        ? "bg-slate-100 text-slate-900"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    Manage Jobs
                  </button>
                  <button
                    onClick={() => onNavigate("admin-recruiters")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      currentView === "admin-recruiters"
                        ? "bg-slate-100 text-slate-900"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    Manage Recruiters
                  </button>
                </>
              )}
            </nav>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2.5">
            {/* User Profile Menu / Sign In */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 pl-2.5 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition text-left"
                >
                  <div className="text-right hidden sm:block">
                    <div className="text-xs font-bold text-slate-900 leading-tight">
                      {user.fullName}
                    </div>
                    <div className="text-[10px] uppercase font-semibold tracking-wider text-indigo-600">
                      {user.role}
                    </div>
                  </div>
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs text-white ${
                      role === "admin"
                        ? "bg-slate-900"
                        : role === "recruiter"
                        ? "bg-purple-600"
                        : "bg-indigo-600"
                    }`}
                  >
                    {user.fullName.charAt(0) || "U"}
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 p-2 z-50">
                    <div className="px-3 py-2 border-b border-slate-100 mb-1">
                      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Signed in as
                      </p>
                      <p className="text-xs font-bold text-slate-800 truncate">
                        {user.email}
                      </p>
                      <span className="inline-block mt-1 text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
                        Role: {user.role}
                      </span>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          if (user.role === "admin") onNavigate("admin-dashboard");
                          else if (user.role === "recruiter") onNavigate("recruiter-dashboard");
                          else onNavigate("my-applications");
                        }}
                        className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                      >
                        Dashboard
                      </button>
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onNavigate("profile");
                        }}
                        className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                      >
                        Profile &amp; CV
                      </button>
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-100">
                      <button
                        onClick={async () => {
                          setUserDropdownOpen(false);
                          await signOut();
                          onNavigate("login");
                        }}
                        className="w-full text-center text-xs font-bold py-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onNavigate("login")}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 hover:bg-slate-100 transition"
                >
                  Sign In
                </button>
                <button
                  onClick={() => onNavigate("signup")}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition shadow-sm"
                >
                  Sign Up
                </button>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-2">
          <button
            onClick={() => {
              onNavigate("jobs");
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 text-sm font-semibold rounded-lg text-slate-700 hover:bg-slate-50"
          >
            Browse Open Jobs
          </button>

          {role === "candidate" && (
            <button
              onClick={() => {
                onNavigate("my-applications");
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-sm font-semibold rounded-lg text-slate-700 hover:bg-slate-50"
            >
              My Applications
            </button>
          )}

          {role === "recruiter" && (
            <button
              onClick={() => {
                onNavigate("recruiter-dashboard");
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-sm font-semibold rounded-lg text-slate-700 hover:bg-slate-50"
            >
              Recruiter Pipeline
            </button>
          )}

          {role === "admin" && (
            <>
              <button
                onClick={() => {
                  onNavigate("admin-dashboard");
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-sm font-semibold rounded-lg text-slate-700 hover:bg-slate-50"
              >
                Admin Metrics
              </button>
              <button
                onClick={() => {
                  onNavigate("admin-jobs");
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-sm font-semibold rounded-lg text-slate-700 hover:bg-slate-50"
              >
                Manage Jobs
              </button>
              <button
                onClick={() => {
                  onNavigate("admin-recruiters");
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-sm font-semibold rounded-lg text-slate-700 hover:bg-slate-50"
              >
                Manage Recruiters
              </button>
            </>
          )}

          {/* Mobile Auth Actions */}
          <div className="pt-2 border-t border-slate-100">
            {user ? (
              <div className="space-y-2">
                <div className="px-3 py-1.5 bg-slate-50 rounded-lg flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">{user.fullName}</span>
                  <span className="font-mono text-[10px] uppercase font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                    {user.role}
                  </span>
                </div>
                <button
                  onClick={() => {
                    onNavigate("profile");
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm font-semibold rounded-lg text-slate-700 hover:bg-slate-50"
                >
                  Profile &amp; Upload CV
                </button>
                <button
                  onClick={async () => {
                    setMobileMenuOpen(false);
                    await signOut();
                    onNavigate("login");
                  }}
                  className="w-full text-left px-3 py-2 text-sm font-bold text-rose-600 hover:bg-rose-50 rounded-lg"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => {
                    onNavigate("login");
                    setMobileMenuOpen(false);
                  }}
                  className="py-2 text-center text-xs font-bold border border-slate-200 rounded-lg text-slate-800 hover:bg-slate-50"
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    onNavigate("signup");
                    setMobileMenuOpen(false);
                  }}
                  className="py-2 text-center text-xs font-bold bg-slate-900 text-white rounded-lg hover:bg-slate-800"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
