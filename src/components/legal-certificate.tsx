import React, { useState } from 'react';
import { Printer, X, Shield, Lock, Scale, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { AuditRecord } from '@/lib/app-data';

interface LegalCertificateProps {
  record: AuditRecord;
  onClose?: () => void;
}

export function LegalCertificate({ record, onClose }: LegalCertificateProps) {
  const [copied, setCopied] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const manifest = JSON.stringify(
    {
      statute: 'Section 63 BSA 2023 / Section 52A NDPS Act 1985',
      recordId: record.id,
      caseNumber: record.caseNumber,
      sha256: record.sha256,
      officer: record.officer,
      timestamp: record.timestamp,
      verdict: record.verdict,
      reagent: record.reagent,
    },
    null,
    2
  );

  const copyManifest = () => {
    navigator.clipboard.writeText(manifest);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Action Bar (hidden on print) */}
      <div className="print:hidden flex items-center justify-between p-3.5 bg-card border border-border rounded-xl">
        <div className="flex items-center gap-2 text-xs font-semibold">
          <Scale size={16} className="text-primary" />
          <span>Section 63 BSA 2023 Electronic Evidence Certificate</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={copyManifest}>
            {copied ? 'Copied Manifest' : 'Copy Hash Manifest'}
          </Button>
          <Button size="sm" onClick={handlePrint}>
            <Printer size={14} className="mr-1" />
            Print Certificate
          </Button>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X size={16} />
            </Button>
          )}
        </div>
      </div>

      {/* Official Certificate Canvas */}
      <article className="bg-white text-zinc-900 border border-zinc-300 rounded-2xl p-8 sm:p-12 shadow-md space-y-6 font-serif print:border-none print:shadow-none print:p-0">
        <div className="text-center border-b-2 border-zinc-900 pb-5 space-y-1">
          <div className="w-12 h-12 mx-auto rounded-full border-2 border-zinc-900 flex items-center justify-center mb-1">
            <Scale size={24} className="text-zinc-900" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wide">
            Certificate of Forensic Electronic Evidence
          </h1>
          <p className="text-xs font-sans font-bold tracking-widest text-zinc-700 uppercase">
            Under Section 63 of the Bharatiya Sakshya Adhiniyam, 2023 (Act No. 47 of 2023)
          </p>
          <p className="text-xs font-sans text-zinc-600 italic">
            Read with Section 52A of the Narcotic Drugs and Psychotropic Substances Act, 1985
          </p>
        </div>

        {/* Declaration */}
        <div className="text-xs font-sans leading-relaxed text-zinc-800 space-y-2">
          <p>
            I, <strong>{record.officer}</strong>, acting in the official capacity of Field Interdiction Officer attached to the Narcotics Control Bureau, hereby solemnly affirm and certify that:
          </p>
          <ol className="list-decimal pl-5 space-y-1 text-zinc-700">
            <li>
              The optical colorimetric reaction evidence photograph described herein was captured in the ordinary lawful discharge of official duties.
            </li>
            <li>
              Throughout the material period of capture, processing, and hashing, the recording device operated under lawful official custody without unauthorized alteration or compromise.
            </li>
            <li>
              The SHA-256 cryptographic digest was computed synchronously at the time of exposure prior to any transmission, preserving chain-of-custody integrity.
            </li>
          </ol>
        </div>

        {/* Identification Grid */}
        <div className="border border-zinc-300 rounded-lg p-4 font-sans text-xs grid grid-cols-1 sm:grid-cols-2 gap-3 bg-zinc-50">
          <div>
            <span className="text-[10px] uppercase font-bold text-zinc-500">Evidence Record ID:</span>
            <div className="font-bold text-zinc-900 font-mono text-sm">{record.id}</div>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-zinc-500">Case / FIR Reference:</span>
            <div className="font-bold text-zinc-900 font-mono text-sm">{record.caseNumber}</div>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-zinc-500">Timestamp:</span>
            <div className="font-mono text-zinc-800">{new Date(record.timestamp).toLocaleString('en-IN')}</div>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-zinc-500">Seizure Location & GPS:</span>
            <div className="text-zinc-800">{record.location} {record.gps && `(${record.gps})`}</div>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-zinc-500">Presumptive Spot Reagent:</span>
            <div className="font-semibold text-zinc-900">{record.reagent}</div>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-zinc-500">Screening Result:</span>
            <div className="font-bold text-zinc-900">
              {record.verdict} ({record.confidence}% match confidence)
            </div>
          </div>
        </div>

        {/* Cryptographic Hash Seal */}
        <div className="border border-zinc-900 rounded-lg p-4 font-mono text-xs space-y-1.5 bg-zinc-100">
          <div className="flex items-center gap-1.5 font-bold font-sans text-zinc-900">
            <Lock size={14} />
            <span>SHA-256 CRYPTOGRAPHIC TAMPER SEAL</span>
          </div>
          <div className="bg-white p-2.5 rounded border border-zinc-300 break-all select-all font-bold text-zinc-950">
            {record.sha256}
          </div>
          <p className="text-[10px] font-sans text-zinc-600">
            Deterministic WebCrypto digest generated over raw uncompressed exposure bytes.
          </p>
        </div>

        {/* Signatures */}
        <div className="pt-8 font-sans text-xs grid grid-cols-2 gap-8 text-center border-t border-zinc-300">
          <div className="space-y-12">
            <span className="text-[10px] font-bold uppercase text-zinc-500">Independent Witness (Panch)</span>
            <div className="border-t border-zinc-400 pt-1 text-zinc-700">Signature of Witness</div>
          </div>
          <div className="space-y-12">
            <span className="text-[10px] font-bold uppercase text-zinc-500">Investigating Officer</span>
            <div className="border-t border-zinc-400 pt-1 font-bold text-zinc-900">
              {record.officer}
            </div>
          </div>
        </div>

        <p className="text-[10px] font-sans text-center text-zinc-500 italic pt-2">
          This digital certificate constitutes prima facie admissible electronic evidence under Section 63 of the Bharatiya Sakshya Adhiniyam, 2023 for submission before the Special NDPS Court.
        </p>
      </article>
    </div>
  );
}
