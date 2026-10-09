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
              className="relative w-full max-w-[580px] bg-[#10151D]/95 backdrop-blur-xl rounded-2xl shadow-[0_24px_70px_rgba(0,0,0,0.85)] border border-white/10 overflow-hidden flex flex-col my-auto text-[#F5F7FA]"
            >
              {/* Top Header Bar */}
              <div className="relative px-6 pt-5 pb-4 border-b border-white/10 bg-[#171C24]/80 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="app-kicker text-[0.68rem] text-[#F97316] tracking-wider uppercase font-bold font-mono">
                      Field Test Preview
                    </span>
                    <span className="text-white/30">·</span>
                    <span className="font-mono text-xs text-[#A6AFBD] font-medium">
                      {record.id}
                    </span>
                  </div>
                  <motion.h3
                    layoutId={`evidence-title-${record.id}`}
                    id={`evidence-title-${record.id}`}
                    className="text-xl sm:text-2xl font-bold text-[#F5F7FA] tracking-tight"
                  >
                    {record.substance || "Presumptive Test"}
                  </motion.h3>
                  <p className="text-xs text-[#A6AFBD] font-mono mt-0.5">
                    Case: {record.caseNumber}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full p-1.5 text-[#A6AFBD] hover:text-[#F5F7FA] hover:bg-white/10 transition-colors"
                  aria-label="Close preview"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Main Card Body */}
              <div className="p-6 space-y-5 text-sm text-[#F5F7FA]">
                {/* Status & Summary Highlight */}
                <div
                  className={`p-3.5 rounded-xl border flex items-start gap-3 ${
                    record.verdict === "POSITIVE"
                      ? "bg-red-500/10 border-red-500/25"
                      : record.verdict === "INCONCLUSIVE"
                      ? "bg-amber-500/10 border-amber-500/25"
                      : "bg-emerald-500/10 border-emerald-500/25"
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {record.verdict === "POSITIVE" ? (
                      <Target className="w-5 h-5 text-red-400" />
                    ) : record.verdict === "INCONCLUSIVE" ? (
                      <Clock3 className="w-5 h-5 text-amber-400" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="font-semibold text-[#F5F7FA]">
                        {record.verdict === "POSITIVE"
                          ? `Detected: ${record.substance}`
                          : record.verdict === "INCONCLUSIVE"
                          ? "Result Inconclusive"
                          : "No Drug Detected"}
                      </span>
                      {record.confidence !== undefined && (
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-[#080B10] border border-orange-500/30 text-[#FFB15C]">
                          {record.confidence}% match
                        </span>
                      )}
                    </div>
                    {record.summary && (
                      <p className="text-xs text-[#A6AFBD] mt-1 leading-relaxed">
                        {record.summary}
                      </p>
                    )}
                  </div>
                </div>

                {/* Evidence Grid Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                  {/* Reagent */}
                  <div className="p-3 rounded-lg bg-[#171C24]/80 border border-white/5 flex items-center gap-3">
                    <span className="w-8 h-8 rounded-md bg-orange-500/10 text-[#FFB15C] border border-orange-500/20 grid place-items-center shrink-0">
                      <FlaskConical className="w-4 h-4" />
                    </span>
                    <div className="min-w-0">
                      <div className="text-[11px] text-[#A6AFBD] font-mono uppercase">Reagent</div>
                      <div className="font-semibold truncate text-xs sm:text-sm text-[#F5F7FA]">{record.reagent || "Standard Kit"}</div>
                    </div>
                  </div>

                  {/* Date & Time */}
                  <div className="p-3 rounded-lg bg-[#171C24]/80 border border-white/5 flex items-center gap-3">
                    <span className="w-8 h-8 rounded-md bg-orange-500/10 text-[#FFB15C] border border-orange-500/20 grid place-items-center shrink-0">
                      <Calendar className="w-4 h-4" />
                    </span>
                    <div className="min-w-0">
                      <div className="text-[11px] text-[#A6AFBD] font-mono uppercase">Timestamp</div>
                      <div className="font-semibold truncate text-xs sm:text-sm text-[#F5F7FA]">
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
                    <div className="p-3 rounded-lg bg-[#171C24]/80 border border-white/5 flex items-center gap-3">
                      <span className="w-8 h-8 rounded-md bg-orange-500/10 text-[#FFB15C] border border-orange-500/20 grid place-items-center shrink-0">
                        <MapPin className="w-4 h-4" />
                      </span>
                      <div className="min-w-0">
                        <div className="text-[11px] text-[#A6AFBD] font-mono uppercase">Location</div>
                        <div className="font-semibold truncate text-xs sm:text-sm text-[#F5F7FA]">{record.location}</div>
                      </div>
                    </div>
                  )}

                  {/* Officer */}
                  {record.officer && (
                    <div className="p-3 rounded-lg bg-[#171C24]/80 border border-white/5 flex items-center gap-3">
                      <span className="w-8 h-8 rounded-md bg-orange-500/10 text-[#FFB15C] border border-orange-500/20 grid place-items-center shrink-0">
                        <User className="w-4 h-4" />
                      </span>
                      <div className="min-w-0">
                        <div className="text-[11px] text-[#A6AFBD] font-mono uppercase">Field Officer</div>
                        <div className="font-semibold truncate text-xs sm:text-sm text-[#F5F7FA]">{record.officer}</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Chain of Custody & Security Hash Info */}
                <div className="space-y-1.5 pt-1 text-xs">
                  <div className="flex items-center justify-between text-[#A6AFBD] font-mono text-[11px]">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Evidence Seal Status:</span>
                    </span>
                    <span className="font-semibold text-[#F5F7FA]">
                      {record.sealed ? "Sealed & Tamper-Protected" : "Unsealed Draft"}
                    </span>
                  </div>
                  {record.sha256 && (
                    <div className="flex items-center gap-1.5 text-[#A6AFBD] font-mono text-[10px] truncate bg-[#080B10]/80 p-2 rounded border border-white/5">
                      <Hash className="w-3 h-3 text-[#56D9E8] shrink-0" />
                      <span className="truncate">{record.sha256}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Footer Bar */}
              <div className="px-6 py-4 bg-[#171C24]/80 border-t border-white/10 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs sm:text-sm font-medium text-[#A6AFBD] hover:text-[#F5F7FA] rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                >
                  Close
                </button>

                <motion.button
                  layoutId={`button-${record.id}`}
                  type="button"
                  onClick={handleOpenDetailedReport}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-[#F97316] hover:bg-[#FFB15C] text-[#080B10] shadow-md shadow-orange-500/20 transition-all cursor-pointer"
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
