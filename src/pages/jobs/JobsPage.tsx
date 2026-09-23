import React, { useEffect, useState } from "react";
import { Job } from "../../types";
import { api } from "../../lib/api";
import { Briefcase, MapPin, Calendar, Users, Search, ArrowRight } from "lucide-react";

interface JobsPageProps {
  onSelectJob: (jobId: string) => void;
}

export const JobsPage: React.FC<JobsPageProps> = ({ onSelectJob }) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedType, setSelectedType] = useState("all");

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const res = await api.getJobs();
      setJobs(res.jobs || []);
    } catch (err: any) {
      setError(err.message || "Failed to load open positions");
    } finally {
      setLoading(false);
    }
  };

  const departments = ["all", ...Array.from(new Set(jobs.map((j) => j.department)))];

  const filteredJobs = jobs.filter((j) => {
    const matchesSearch =
      j.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = selectedDepartment === "all" || j.department === selectedDepartment;
    const matchesType = selectedType === "all" || j.jobType === selectedType;
    return matchesSearch && matchesDept && matchesType;
  });

  return (
    <div className="space-y-8">
      {/* Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-white p-8 sm:p-12 shadow-xl">
        <div className="relative z-10 max-w-2xl">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
            Nowshera Digital Hiring Portal
          </span>
          <h1 className="mt-4 text-3xl sm:text-4xl font-extrabold tracking-tight">
            Build the Future of Digital Innovation
          </h1>
          <p className="mt-3 text-slate-300 text-sm sm:text-base leading-relaxed">
            Explore open opportunities across engineering, product design, and growth. Apply directly with your PDF CV
            and track your recruitment status in real time.
          </p>
        </div>
        <div className="absolute -right-12 -bottom-12 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search roles, skills, location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="all">All Departments</option>
            {departments
              .filter((d) => d !== "all")
              .map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
          </select>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="all">All Job Types</option>
            <option value="Full-time">Full-time</option>
            <option value="Part-time">Part-time</option>
            <option value="Internship">Internship</option>
          </select>
        </div>
      </div>

      {/* States: Loading, Error, Empty, List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-64 rounded-2xl bg-white border border-slate-200 p-6 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-1/3 mb-4" />
              <div className="h-6 bg-slate-200 rounded w-3/4 mb-3" />
              <div className="h-4 bg-slate-100 rounded w-full mb-2" />
              <div className="h-4 bg-slate-100 rounded w-2/3 mb-6" />
              <div className="h-8 bg-slate-200 rounded w-full mt-auto" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="p-8 text-center bg-rose-50 border border-rose-200 rounded-2xl">
          <p className="text-sm font-semibold text-rose-800">{error}</p>
          <button
            onClick={fetchJobs}
            className="mt-3 px-4 py-2 text-xs font-bold text-rose-700 bg-white border border-rose-300 rounded-xl hover:bg-rose-50 transition"
          >
            Try Again
          </button>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl">
          <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900">No open jobs found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search query or department filter to see available positions.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJobs.map((job) => (
            <div
              key={job.id}
              className="bg-white rounded-2xl border border-slate-200 hover:border-indigo-400/80 transition-all duration-200 shadow-sm hover:shadow-md p-6 flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-indigo-50 text-indigo-700">
                    {job.department}
                  </span>
                  <span className="text-[11px] font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                    {job.jobType}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition">
                  {job.title}
                </h3>

                <p className="mt-2 text-xs text-slate-600 line-clamp-3 leading-relaxed">
                  {job.description}
                </p>

                <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px] text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{job.location}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {job.openings - job.filledOpenings} of {job.openings} opening
                      {job.openings > 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 col-span-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Apply before: {new Date(job.lastDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100">
                <button
                  onClick={() => onSelectJob(job.id)}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-indigo-600 rounded-xl transition shadow-sm"
                >
                  <span>View Job & Apply</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
