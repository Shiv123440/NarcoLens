"use client";

import React, { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "@tanstack/react-router";
import {
  X,
  MapPin,
  Calendar,
  FlaskConical,
  User,
  ShieldCheck,
  Hash,
  ArrowRight,
  Target,
  Clock3,
  Disc,
  CheckCircle2,
  FileText,
} from "lucide-react";
import { useOutsideClick } from "@/hooks/use-outside-click";
import type { AuditRecord } from "@/lib/app-data";

export interface ExpandableEvidenceCardProps {
  record: AuditRecord | null;
  onClose: () => void;
}

export function ExpandableEvidenceCard({
  record,
  onClose,
}: ExpandableEvidenceCardProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    if (!record) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow || "auto";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [record, onClose]);

  useOutsideClick(modalRef, () => {
    if (record) onClose();
  });

  const handleOpenDetailedReport = () => {
    if (!record) return;
    const recordId = record.id;
    onClose();
    void navigate({
      to: "/audit/$recordId",
      params: { recordId },
    });
  };

  return (
    <>
      <AnimatePresence>
        {record && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200]"
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {record && (
          <div className="fixed inset-0 grid place-items-center z-[210] p-4 sm:p-6 overflow-y-auto">
            <motion.div
              layoutId={`evidence-card-${record.id}`}
              ref={modalRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={`evidence-title-${record.id}`}
              className="relative w-full max-w-[580px] bg-white rounded-2xl shadow-2xl border border-[rgba(226,220,212,0.95)] overflow-hidden flex flex-col my-auto"
            >
              {/* Top Header Bar */}
              <div className="relative px-6 pt-5 pb-4 border-b border-[rgba(226,220,212,0.7)] bg-[#FAF8F5] flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="app-kicker text-[0.68rem] text-[#E85D04] tracking-wider uppercase font-bold font-mono">
                      Field Test Preview
                    </span>
                    <span className="text-zinc-400">·</span>
                    <span className="font-mono text-xs text-zinc-500 font-medium">
                      {record.id}
                    </span>
                  </div>
                  <motion.h3
                    layoutId={`evidence-title-${record.id}`}
                    id={`evidence-title-${record.id}`}
                    className="text-xl sm:text-2xl font-bold text-[#14171A] tracking-tight"
                  >
                    {record.substance || "Presumptive Test"}
                  </motion.h3>
                  <p className="text-xs text-zinc-500 font-mono mt-0.5">
                    Case: {record.caseNumber}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/60 transition-colors"
                  aria-label="Close preview"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Main Card Body */}
              <div className="p-6 space-y-5 text-sm text-[#14171A]">
                {/* Status & Summary Highlight */}
                <div className="p-3.5 rounded-xl bg-orange-50/70 border border-orange-200/70 flex items-start gap-3">
                  <div className="mt-0.5 shrink-0">
                    {record.verdict === "POSITIVE" ? (
                      <Target className="w-5 h-5 text-red-600" />
                    ) : record.verdict === "INCONCLUSIVE" ? (
                      <Clock3 className="w-5 h-5 text-amber-600" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="font-semibold text-zinc-900">
                        {record.verdict === "POSITIVE"
                          ? `Detected: ${record.substance}`
                          : record.verdict === "INCONCLUSIVE"
                          ? "Result Inconclusive"
                          : "No Drug Detected"}
                      </span>
                      {record.confidence !== undefined && (
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-white border border-orange-200 text-orange-800">
                          {record.confidence}% match
                        </span>
                      )}
                    </div>
                    {record.summary && (
                      <p className="text-xs text-zinc-600 mt-1 leading-relaxed">
                        {record.summary}
                      </p>
                    )}
                  </div>
                </div>

                {/* Evidence Grid Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                  {/* Reagent */}
                  <div className="p-3 rounded-lg bg-[#FAF8F5] border border-[rgba(226,220,212,0.7)] flex items-center gap-3">
                    <span className="w-8 h-8 rounded-md bg-amber-500/10 text-[#E85D04] border border-amber-500/20 grid place-items-center shrink-0">
                      <FlaskConical className="w-4 h-4" />
                    </span>
                    <div className="min-w-0">
                      <div className="text-[11px] text-zinc-500 font-mono uppercase">Reagent</div>
                      <div className="font-semibold truncate text-xs sm:text-sm">{record.reagent || "Standard Kit"}</div>
                    </div>
                  </div>

                  {/* Date & Time */}
                  <div className="p-3 rounded-lg bg-[#FAF8F5] border border-[rgba(226,220,212,0.7)] flex items-center gap-3">
                    <span className="w-8 h-8 rounded-md bg-amber-500/10 text-[#E85D04] border border-amber-500/20 grid place-items-center shrink-0">
                      <Calendar className="w-4 h-4" />
                    </span>
                    <div className="min-w-0">
                      <div className="text-[11px] text-zinc-500 font-mono uppercase">Timestamp</div>
                      <div className="font-semibold truncate text-xs sm:text-sm">
                        {new Date(record.timestamp).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Location */}
                  {record.location && (
                    <div className="p-3 rounded-lg bg-[#FAF8F5] border border-[rgba(226,220,212,0.7)] flex items-center gap-3">
                      <span className="w-8 h-8 rounded-md bg-amber-500/10 text-[#E85D04] border border-amber-500/20 grid place-items-center shrink-0">
                        <MapPin className="w-4 h-4" />
                      </span>
                      <div className="min-w-0">
                        <div className="text-[11px] text-zinc-500 font-mono uppercase">Location</div>
                        <div className="font-semibold truncate text-xs sm:text-sm">{record.location}</div>
                      </div>
                    </div>
                  )}

                  {/* Officer */}
                  {record.officer && (
                    <div className="p-3 rounded-lg bg-[#FAF8F5] border border-[rgba(226,220,212,0.7)] flex items-center gap-3">
                      <span className="w-8 h-8 rounded-md bg-amber-500/10 text-[#E85D04] border border-amber-500/20 grid place-items-center shrink-0">
                        <User className="w-4 h-4" />
                      </span>
                      <div className="min-w-0">
                        <div className="text-[11px] text-zinc-500 font-mono uppercase">Field Officer</div>
                        <div className="font-semibold truncate text-xs sm:text-sm">{record.officer}</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Chain of Custody & Security Hash Info */}
                <div className="space-y-1.5 pt-1 text-xs">
                  <div className="flex items-center justify-between text-zinc-500 font-mono text-[11px]">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Evidence Seal Status:</span>
                    </span>
                    <span className="font-semibold text-zinc-700">
                      {record.sealed ? "Sealed & Tamper-Protected" : "Unsealed Draft"}
                    </span>
                  </div>
                  {record.sha256 && (
                    <div className="flex items-center gap-1.5 text-zinc-400 font-mono text-[10px] truncate bg-zinc-50 p-2 rounded border border-zinc-200/70">
                      <Hash className="w-3 h-3 text-zinc-400 shrink-0" />
                      <span className="truncate">{record.sha256}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Footer Bar */}
              <div className="px-6 py-4 bg-[#FAF8F5] border-t border-[rgba(226,220,212,0.7)] flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs sm:text-sm font-medium text-zinc-600 hover:text-zinc-900 rounded-lg hover:bg-zinc-200/50 transition-colors"
                >
                  Close
                </button>

                <motion.button
                  layoutId={`button-${record.id}`}
                  type="button"
                  onClick={handleOpenDetailedReport}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-[#FF8A1D] hover:bg-[#FF962E] text-black shadow-md shadow-orange-500/20 transition-all cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>View full audit report</span>
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
