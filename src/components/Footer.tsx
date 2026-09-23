import React from "react";
import { Shield, Sparkles, CheckCircle2 } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-900">Nowshera Digital</span>
          <span>• Centralized Job Recruitment &amp; Applicant Tracking System</span>
        </div>

        <div className="flex items-center gap-4 text-[11px]">
          <span className="inline-flex items-center gap-1 text-slate-600">
            <Shield className="w-3.5 h-3.5 text-indigo-600" />
            Enterprise Security
          </span>
          <span className="inline-flex items-center gap-1 text-slate-600">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Automated Talent Pipeline
          </span>
          <span className="inline-flex items-center gap-1 text-slate-600">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            AI Candidate Insights
          </span>
        </div>
      </div>
    </footer>
  );
};
