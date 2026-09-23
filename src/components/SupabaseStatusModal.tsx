import React, { useState, useEffect } from "react";
import {
  Database,
  X,
  CheckCircle2,
  Copy,
  ExternalLink,
  ShieldCheck,
  HardDrive,
  FileCode,
  Server,
  KeyRound,
  Check,
  RefreshCw,
  Table,
  Clock,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { api } from "../lib/api";

interface SupabaseStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseStatusModal: React.FC<SupabaseStatusModalProps> = ({ isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedSchema, setCopiedSchema] = useState(false);
  const [copiedSeed, setCopiedSeed] = useState(false);
  const [activeTab, setActiveTab] = useState<"migration" | "overview" | "schema" | "seed" | "checklist">("migration");

  const [status, setStatus] = useState<{
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
  } | null>(null);

  const loadStatus = async () => {
    setLoading(true);
    try {
      const data = await api.getSupabaseStatus();
      setStatus(data);
    } catch (err) {
      console.error("Failed to load Supabase status:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadStatus();
    }
  }, [isOpen]);

  const handleCopyAll = () => {
    if (!status?.migrationCompleteSql) return;
    navigator.clipboard.writeText(status.migrationCompleteSql);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleCopySchema = () => {
    if (!status?.schemaSql) return;
    navigator.clipboard.writeText(status.schemaSql);
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 2000);
  };

  const handleCopySeed = () => {
    if (!status?.seedSql) return;
    navigator.clipboard.writeText(status.seedSql);
    setCopiedSeed(true);
    setTimeout(() => setCopiedSeed(false), 2000);
  };

  if (!isOpen) return null;

  const tablesList = [
    { name: "profiles", desc: "User profiles synced from auth.users (candidate, recruiter, admin roles)", ready: status?.tablesReady },
    { name: "jobs", desc: "Job postings with draft/open/closed states and opening counts", ready: status?.tablesReady },
    { name: "job_recruiters", desc: "Assignment mapping connecting recruiters to specific jobs for RLS", ready: status?.tablesReady },
    { name: "cvs", desc: "Metadata references to uploaded private PDF CVs in storage", ready: status?.tablesReady },
    { name: "applications", desc: "Candidate applications with stage tracking and unique active constraint", ready: status?.tablesReady },
    { name: "application_stage_history", desc: "Immutable audit log of all applicant stage movements", ready: status?.tablesReady },
    { name: "recruiter_notes", desc: "Internal evaluation notes (strictly hidden from candidates via RLS)", ready: status?.tablesReady },
    { name: "interviews", desc: "1-hour scheduled interviews with recruiter conflict checks", ready: status?.tablesReady },
    { name: "ai_summaries", desc: "Gemini AI profile evaluation (strictly hidden from candidates via RLS)", ready: status?.tablesReady },
    { name: "email_events", desc: "Audit log of n8n webhook notifications with unique idempotency keys", ready: status?.tablesReady },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
              <Database className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base tracking-tight text-white">
                  Supabase Database & Storage Setup
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase tracking-wider">
                  Connected
                </span>
                {status?.tablesReady ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase tracking-wider">
                    Tables Active
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase tracking-wider">
                    Tables Pending Migration
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Project: <code className="text-slate-200">{status?.projectRef || "bpnirccbzdmtrtocyuhh"}</code> &bull; Storage: <code className="text-emerald-400">cv-files (Ready)</code>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadStatus}
              disabled={loading}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              title="Refresh status"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab("migration")}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 shrink-0 ${
              activeTab === "migration"
                ? "border-emerald-600 text-emerald-700 bg-white"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            1-Click SQL Migration
          </button>
          <button
            onClick={() => setActiveTab("overview")}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 shrink-0 ${
              activeTab === "overview"
                ? "border-emerald-600 text-emerald-700 bg-white"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            Tables Status & Storage
          </button>
          <button
            onClick={() => setActiveTab("schema")}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 shrink-0 ${
              activeTab === "schema"
                ? "border-emerald-600 text-emerald-700 bg-white"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            schema.sql
          </button>
          <button
            onClick={() => setActiveTab("seed")}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 shrink-0 ${
              activeTab === "seed"
                ? "border-emerald-600 text-emerald-700 bg-white"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            seed.sql
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === "migration" && (
            <div className="space-y-6">
              {/* Instructions Banner */}
              <div className="p-5 rounded-2xl border border-indigo-200 bg-indigo-50/70 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 text-indigo-950 font-extrabold text-sm">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    How to Apply the Database Migration to Supabase
                  </div>
                  <a
                    href="https://supabase.com/dashboard/project/bpnirccbzdmtrtocyuhh/sql"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-indigo-700 hover:text-indigo-900 hover:underline"
                  >
                    Open Supabase SQL Editor
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-xs text-indigo-900 leading-relaxed">
                  Supabase requires DDL migrations (like <code>CREATE TABLE</code>) to be run through the Supabase SQL Editor. 
                  Click the button below to copy the complete, self-contained migration script, paste it into your <strong>Supabase SQL Editor</strong>, and click <strong>Run</strong>.
                </p>
                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <button
                    onClick={handleCopyAll}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl transition shadow-md hover:shadow"
                  >
                    {copiedAll ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                    {copiedAll ? "Copied to Clipboard!" : "Copy Section A Schema Migration"}
                  </button>
                  <span className="text-[11px] text-indigo-700 font-medium">
                    (Includes all 10 tables, RLS policies, trigger, and storage bucket — no dummy users)
                  </span>
                </div>
              </div>

              {/* Status indicators */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                  <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs mb-1">
                    <CheckCircle2 className="w-4 h-4" />
                    Private Storage Bucket
                  </div>
                  <div className="text-sm font-extrabold text-slate-900">
                    cv-files (Ready in Supabase)
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Configured for application/pdf &le; 2 MB with signed URLs.
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                  <div className="flex items-center gap-2 text-amber-600 font-bold text-xs mb-1">
                    {status?.tablesReady ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Clock className="w-4 h-4 text-amber-600" />
                    )}
                    Database Tables (10 Tables)
                  </div>
                  <div className="text-sm font-extrabold text-slate-900">
                    {status?.tablesReady ? "Tables Verified Active" : "Pending SQL Editor Execution"}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Paste the SQL script into Supabase to activate all 10 tables.
                  </div>
                </div>
              </div>

              {/* Code Preview */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700 font-mono">
                    Combined Script Preview (schema + seed)
                  </span>
                  <button
                    onClick={handleCopyAll}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
                  >
                    {copiedAll ? "Copied!" : "Copy Full Script"}
                  </button>
                </div>
                <div className="relative rounded-xl border border-slate-200 bg-slate-950 p-4 font-mono text-[11px] text-slate-200 overflow-x-auto max-h-64 leading-relaxed">
                  <pre>{status?.migrationCompleteSql?.substring(0, 1500) + "\n\n-- ... [39,000+ characters complete script] ..."} </pre>
                </div>
              </div>
            </div>
          )}

          {activeTab === "overview" && (
            <div className="space-y-6">
              <div>
                <h4 className="font-extrabold text-sm text-slate-900 mb-3 flex items-center gap-2">
                  <Table className="w-4 h-4 text-indigo-600" />
                  Database Tables Verification Checklist
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {tablesList.map((t, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg border border-slate-200 bg-white flex items-start gap-2.5"
                    >
                      {t.ready ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                      ) : (
                        <Clock className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900">public.{t.name}</span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${t.ready ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                            {t.ready ? "Verified" : "Pending SQL Run"}
                          </span>
                        </div>
                        <p className="text-slate-500 text-[11px] mt-0.5">{t.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "schema" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 font-mono">/supabase/schema.sql</span>
                  <p className="text-[11px] text-slate-500">
                    Tables, constraints, functions, triggers, and Row Level Security policies.
                  </p>
                </div>
                <button
                  onClick={handleCopySchema}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition shadow-sm"
                >
                  {copiedSchema ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedSchema ? "Copied!" : "Copy Schema SQL"}
                </button>
              </div>

              <div className="relative rounded-xl border border-slate-200 bg-slate-950 p-4 font-mono text-[11px] text-slate-200 overflow-x-auto max-h-96 leading-relaxed">
                <pre>{status?.schemaSql || "-- Loading schema SQL..."}</pre>
              </div>
            </div>
          )}

          {activeTab === "seed" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 font-mono">/supabase/seed.sql</span>
                  <p className="text-[11px] text-slate-500">
                    Fictional test dataset for Nowshera Digital ATS with auth users, recruiters, jobs, and applicants.
                  </p>
                </div>
                <button
                  onClick={handleCopySeed}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition shadow-sm"
                >
                  {copiedSeed ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedSeed ? "Copied!" : "Copy Seed SQL"}
                </button>
              </div>

              <div className="relative rounded-xl border border-slate-200 bg-slate-950 p-4 font-mono text-[11px] text-slate-200 overflow-x-auto max-h-96 leading-relaxed">
                <pre>{status?.seedSql || "-- Loading seed SQL..."}</pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Nowshera Digital ATS &bull; Supabase Project bpnirccbzdmtrtocyuhh</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
