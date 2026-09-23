import React, { useEffect, useState } from "react";
import { X, Mail, CheckCircle2, Clock, Send, RefreshCw } from "lucide-react";
import { EmailEvent } from "../types";
import { api } from "../lib/api";

interface EmailAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmailAuditModal: React.FC<EmailAuditModalProps> = ({ isOpen, onClose }) => {
  const [events, setEvents] = useState<EmailEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EmailEvent | null>(null);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await api.getEmailEvents();
      setEvents(res.events || []);
      if (res.events?.length && !selectedEvent) {
        setSelectedEvent(res.events[0]);
      }
    } catch (err) {
      console.error("Failed to fetch email events:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchEvents();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold shadow-md shadow-purple-100">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Email Event Architecture & n8n Audit Log</h2>
              <p className="text-xs text-slate-500">
                Live audit trail of dispatched email events with idempotency keys
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchEvents}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 flex items-center justify-center transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 overflow-hidden flex-1">
          {/* List */}
          <div className="md:col-span-5 overflow-y-auto pr-2 border-r border-slate-100 space-y-2">
            {events.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">No email events recorded yet.</div>
            ) : (
              events.map((e) => (
                <div
                  key={e.id}
                  onClick={() => setSelectedEvent(e)}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition ${
                    selectedEvent?.id === e.id
                      ? "bg-purple-50/80 border-purple-300 shadow-sm"
                      : "bg-white border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-xs text-slate-900 truncate">{e.subject}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                        e.status === "sent" || e.status === "dispatched_to_n8n"
                          ? "bg-emerald-100 text-emerald-800"
                          : e.status === "failed"
                          ? "bg-rose-100 text-rose-800"
                          : e.status === "processing"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {e.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center justify-between">
                    <span>{e.recipientName} ({e.recipientEmail})</span>
                    <span className="text-[10px]">{new Date(e.sentAt).toLocaleTimeString()}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1 font-mono truncate">
                    Key: {e.idempotencyKey}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Detail */}
          <div className="md:col-span-7 overflow-y-auto bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col">
            {selectedEvent ? (
              <div className="space-y-4">
                <div className="border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs uppercase font-mono tracking-wider text-purple-600 font-bold">
                      {selectedEvent.eventType.replace("_", " ")}
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-500 font-mono">
                      {new Date(selectedEvent.sentAt).toLocaleString()}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{selectedEvent.subject}</h3>
                  <div className="text-xs text-slate-600 mt-1">
                    To: <span className="font-semibold text-slate-800">{selectedEvent.recipientName}</span> &lt;
                    {selectedEvent.recipientEmail}&gt;
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Idempotency Key (Deduplication)
                  </h4>
                  <div className="p-2 bg-white rounded-lg border border-slate-200 text-xs font-mono text-slate-800 break-all">
                    {selectedEvent.idempotencyKey}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Webhook Payload (n8n JSON)
                  </h4>
                  <pre className="p-3 bg-slate-900 text-slate-100 rounded-lg text-xs font-mono overflow-x-auto max-h-56">
                    {JSON.stringify(selectedEvent.payload, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400 text-xs">Select an event to view details.</div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>Configured for n8n webhook automation with deduplication protection</span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition"
          >
            Close Audit
          </button>
        </div>
      </div>
    </div>
  );
};
