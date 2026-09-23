import React from "react";
import { ApplicationStage } from "../types";
import { CheckCircle2, Clock, Calendar, Gift, Award, XCircle, AlertCircle } from "lucide-react";

interface PipelineBadgeProps {
  stage: ApplicationStage;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const PipelineBadge: React.FC<PipelineBadgeProps> = ({ stage, className = "", size = "md" }) => {
  const configs: Record<
    ApplicationStage,
    { label: string; bg: string; text: string; border: string; icon: React.ReactNode }
  > = {
    applied: {
      label: "Applied",
      bg: "bg-blue-50",
      text: "text-blue-700",
      border: "border-blue-200",
      icon: <Clock className="w-3.5 h-3.5" />,
    },
    shortlisted: {
      label: "Shortlisted",
      bg: "bg-indigo-50",
      text: "text-indigo-700",
      border: "border-indigo-200",
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    },
    interview: {
      label: "Interview",
      bg: "bg-purple-50",
      text: "text-purple-700",
      border: "border-purple-200",
      icon: <Calendar className="w-3.5 h-3.5" />,
    },
    offer: {
      label: "Offer",
      bg: "bg-amber-50",
      text: "text-amber-800",
      border: "border-amber-200",
      icon: <Gift className="w-3.5 h-3.5" />,
    },
    hired: {
      label: "Hired",
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      border: "border-emerald-200",
      icon: <Award className="w-3.5 h-3.5" />,
    },
    rejected: {
      label: "Rejected",
      bg: "bg-rose-50",
      text: "text-rose-700",
      border: "border-rose-200",
      icon: <XCircle className="w-3.5 h-3.5" />,
    },
    withdrawn: {
      label: "Withdrawn",
      bg: "bg-slate-100",
      text: "text-slate-700",
      border: "border-slate-300",
      icon: <AlertCircle className="w-3.5 h-3.5" />,
    },
  };

  const config = configs[stage] || {
    label: stage,
    bg: "bg-slate-100",
    text: "text-slate-700",
    border: "border-slate-200",
    icon: null,
  };

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs gap-1",
    md: "px-2.5 py-1 text-xs gap-1.5 font-medium",
    lg: "px-3.5 py-1.5 text-sm gap-2 font-semibold",
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-full border ${config.bg} ${config.text} ${config.border} ${sizeClasses} ${className}`}
    >
      {config.icon}
      <span>{config.label}</span>
    </span>
  );
};
