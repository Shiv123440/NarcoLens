import React, { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  RotateCcw,
  LogOut,
  Check,
  Pencil,
  KeyRound,
  Eye,
  EyeOff,
  Shield,
  X,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  MapPin,
  BadgeAlert,
  Loader2,
} from "lucide-react";
import { useOfficer } from "@/hooks/use-auth";
import {
  signOutOfficer,
  updateActiveOfficerProfile,
  changeOfficerPassword,
  validatePassword,
  type OfficerUser,
} from "@/lib/auth-service";
import { resetDemoEvidenceData } from "@/lib/evidence";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface ProfileViewProps {
  onBack?: () => void;
  isModal?: boolean;
}

export function ProfileContent({ onBack, isModal = false }: ProfileViewProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const officer = useOfficer();

  // Profile fields state
  const officerProfile = officer.profile;
  const fullName = officerProfile?.full_name || "Insp. Rajesh Kumar";
  const rank = officerProfile?.rank || "Inspector";
  const station = officerProfile?.station || "Delhi Zonal Unit";
  const department = officerProfile?.department || "NCB";
  const badgeId = officerProfile?.badge_id || officerProfile?.officer_id || "NCB-DEL-4082";
  const deviceId = officerProfile?.device_id || "FIELD-UNIT-07";
  const district = officerProfile?.district || "New Delhi, Delhi";

  // Voice & Language state
  const [speakReplies, setSpeakReplies] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("drugshield_speak_aloud");
      if (stored !== null) return stored === "true";
    }
    return officerProfile?.speak_aloud ?? true;
  });

  const [language, setLanguage] = useState<"en" | "hi">(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("drugshield_lang");
      if (stored === "hi" || stored === "en") return stored;
    }
    return officerProfile?.language || "en";
  });

  // Edit Modal State
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState(fullName);
  const [editRank, setEditRank] = useState(rank);
  const [editStation, setEditStation] = useState(station);
  const [editBadgeId, setEditBadgeId] = useState(badgeId);
  const [editDeviceId, setEditDeviceId] = useState(deviceId);
  const [editDistrict, setEditDistrict] = useState(district);
  const [editSaving, setEditSaving] = useState(false);

  // Password Reset Modal State
  const [pwdOpen, setPwdOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pwdError, setPwdError] = useState<string | null>(null);
  const [pwdSuccess, setPwdSuccess] = useState(false);
  const [pwdSaving, setPwdSaving] = useState(false);

  // Toast / notification feedback
  const [bannerMessage, setBannerMessage] = useState<{ text: string; type: "success" | "info" } | null>(null);

  const showBanner = (text: string, type: "success" | "info" = "success") => {
    setBannerMessage({ text, type });
    setTimeout(() => {
      setBannerMessage(null);
    }, 3500);
  };

  // Toggle voice speech
  const handleToggleSpeak = () => {
    const next = !speakReplies;
    setSpeakReplies(next);
    if (typeof window !== "undefined") {
      localStorage.setItem("drugshield_speak_aloud", String(next));
    }
    updateActiveOfficerProfile({ speak_aloud: next });
    showBanner(next ? "Voice replies enabled (hands-free mode)" : "Voice replies muted", "info");
  };

  // Change language
  const handleSelectLanguage = (lang: "en" | "hi") => {
    setLanguage(lang);
    if (typeof window !== "undefined") {
      localStorage.setItem("drugshield_lang", lang);
    }
    updateActiveOfficerProfile({ language: lang });
    showBanner(lang === "en" ? "Language set to English" : "भाषा हिंदी में सेट की गई", "info");
  };

  // Reset demo data
  const handleResetDemoData = async () => {
    resetDemoEvidenceData();
    await queryClient.invalidateQueries({ queryKey: ["evidence"] });
    showBanner("Demo forensic records reset to factory state", "success");
  };

  // Sign out
  const handleSignOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await signOutOfficer();
    void navigate({ to: "/auth", search: { mode: "login", next: "/" }, replace: true });
  };

  // Save edited profile
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setEditSaving(true);
    try {
      updateActiveOfficerProfile({
        full_name: editName.trim() || fullName,
        rank: editRank.trim() || rank,
        station: editStation.trim() || station,
        department: `NCB · ${editStation.trim() || station}`,
        badge_id: editBadgeId.trim() || badgeId,
        officer_id: editBadgeId.trim() || badgeId,
        device_id: editDeviceId.trim() || deviceId,
        district: editDistrict.trim() || district,
      });
      showBanner("Profile updated successfully", "success");
      setEditOpen(false);
    } finally {
      setEditSaving(false);
    }
  };

  // Save new password
  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError(null);

    if (newPassword !== confirmPassword) {
      setPwdError("Passwords do not match.");
      return;
    }

    const validation = validatePassword(newPassword);
    if (!validation.valid) {
      setPwdError(validation.error || "Password does not meet security requirements.");
      return;
    }

    setPwdSaving(true);
    try {
      const res = changeOfficerPassword(newPassword);
      if (res.success) {
        setPwdSuccess(true);
        setNewPassword("");
        setConfirmPassword("");
        showBanner("Password changed successfully", "success");
        setTimeout(() => {
          setPwdSuccess(false);
          setPwdOpen(false);
        }, 1200);
      } else {
        setPwdError(res.error || "Could not change password.");
      }
    } finally {
      setPwdSaving(false);
    }
  };

  // Initials generator
  const getInitials = (name: string) => {
    // If it's Insp. Rajesh Kumar, return RK
    const clean = name.replace(/^insp\.?\s+/i, "").replace(/^si\.?\s+/i, "");
    const parts = clean.split(/[\s@.]+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return (parts[0]?.[0] || "R").toUpperCase() + "K";
  };

  // Password validation checklist helpers
  const hasMinLen = newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);

  return (
    <div className="w-full max-w-md mx-auto text-zinc-900 font-sans select-none pb-8 sm:pb-4">
      {/* Toast Banner Notification */}
      {bannerMessage && (
        <div
          role="status"
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-zinc-900 text-white text-xs font-semibold shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-3 duration-200"
        >
          <CheckCircle2 size={14} className="text-emerald-400" />
          <span>{bannerMessage.text}</span>
        </div>
      )}

      {/* Top Header */}
      <header className="flex items-center justify-between pt-2 pb-4">
        <div className="flex items-center gap-3">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="p-1 -ml-1 text-zinc-900 hover:text-zinc-600 rounded-full active:scale-95 transition-transform"
              aria-label="Back"
            >
              <ArrowLeft size={22} strokeWidth={2.4} />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (window.history.length > 1) {
                  window.history.back();
                } else {
                  void navigate({ to: "/" });
                }
              }}
              className="p-1 -ml-1 text-zinc-900 hover:text-zinc-600 rounded-full active:scale-95 transition-transform"
              aria-label="Back"
            >
              <ArrowLeft size={22} strokeWidth={2.4} />
            </button>
          )}
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Profile</h1>
        </div>

        {/* Quick Edit Icon Button in Top Header */}
        <button
          type="button"
          onClick={() => {
            setEditName(fullName);
            setEditRank(rank);
            setEditStation(station);
            setEditBadgeId(badgeId);
            setEditDeviceId(deviceId);
            setEditDistrict(district);
            setEditOpen(true);
          }}
          className="text-xs font-semibold px-2.5 py-1.5 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition-colors flex items-center gap-1.5 active:scale-95"
          title="Edit Officer Profile"
          aria-label="Edit Officer Profile"
        >
          <Pencil size={12} strokeWidth={2.5} />
          <span>Edit</span>
        </button>
      </header>

      {/* Officer Avatar + Name Section */}
      <section className="flex items-center gap-4 mt-2 mb-6">
        <div className="relative">
          <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-[#FCE8D5] text-[#7C2D12] flex items-center justify-center font-bold text-2xl tracking-wide shadow-xs shrink-0 select-none">
            {getInitials(fullName)}
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="text-xl sm:text-[22px] font-bold text-zinc-900 leading-tight truncate">
            {fullName}
          </h2>
          <p className="text-sm text-zinc-500 font-normal mt-1 leading-snug truncate">
            {rank} · {department.includes("NCB") ? department : `NCB · ${station}`}
          </p>
        </div>
      </section>

      {/* Officer Identification Details Card */}
      <section className="bg-white rounded-2xl border border-zinc-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3.5">
          <span className="text-[14px] text-zinc-500 font-normal">Badge ID</span>
          <span className="text-[14px] font-bold text-zinc-900 font-mono tracking-tight">
            {badgeId}
          </span>
        </div>
        <div className="h-px bg-zinc-100 mx-4" />
        <div className="flex items-center justify-between px-4 py-3.5">
          <span className="text-[14px] text-zinc-500 font-normal">Device</span>
          <span className="text-[14px] font-bold text-zinc-900 font-mono tracking-tight">
            {deviceId}
          </span>
        </div>
        <div className="h-px bg-zinc-100 mx-4" />
        <div className="flex items-center justify-between px-4 py-3.5">
          <span className="text-[14px] text-zinc-500 font-normal">District</span>
          <span className="text-[14px] font-bold text-zinc-900">
            {district}
          </span>
        </div>
      </section>

      {/* Voice and Language Section */}
      <section className="mt-6">
        <h3 className="text-[16px] font-bold text-zinc-900 mb-2.5">Voice and language</h3>
        <div className="bg-white rounded-2xl border border-zinc-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4">
          {/* Speak replies aloud row */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-[15px] font-semibold text-zinc-900 leading-tight">
                Speak replies aloud
              </div>
              <div className="text-[13px] text-zinc-500 mt-0.5 leading-snug">
                Hands-free while wearing gloves
              </div>
            </div>

            {/* Exact toggle switch matching the reference image */}
            <button
              type="button"
              role="switch"
              aria-checked={speakReplies}
              onClick={handleToggleSpeak}
              className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${
                speakReplies ? "bg-[#59B2A8]" : "bg-zinc-200"
              }`}
            >
              {/* Optional orange decorative accent on active pill matching the screenshot */}
              {speakReplies && (
                <span className="absolute left-1.5 w-2 h-2 rounded-full bg-[#E85D04]" />
              )}
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  speakReplies ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <div className="h-px bg-zinc-100 my-3.5" />

          {/* Language selection row */}
          <div>
            <div className="text-[14px] text-zinc-700 font-medium mb-2.5">Language</div>
            <div className="flex items-center gap-2.5">
              {/* English Pill */}
              <button
                type="button"
                onClick={() => handleSelectLanguage("en")}
                className={`py-2 px-3.5 rounded-xl text-[14px] flex items-center gap-1.5 transition-all ${
                  language === "en"
                    ? "bg-[#FEEADB] text-[#9A3412] font-semibold shadow-2xs border border-[#FDBA74]"
                    : "bg-white text-zinc-800 border border-zinc-200 hover:bg-zinc-50 font-medium"
                }`}
              >
                {language === "en" && <Check size={16} strokeWidth={2.8} />}
                <span>English</span>
              </button>

              {/* Hindi Pill */}
              <button
                type="button"
                onClick={() => handleSelectLanguage("hi")}
                className={`py-2 px-4 rounded-xl text-[14px] flex items-center gap-1.5 transition-all ${
                  language === "hi"
                    ? "bg-[#FEEADB] text-[#9A3412] font-semibold shadow-2xs border border-[#FDBA74]"
                    : "bg-white text-zinc-800 border border-zinc-200 hover:bg-zinc-50 font-medium"
                }`}
              >
                {language === "hi" && <Check size={16} strokeWidth={2.8} />}
                <span>हिंदी</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Security & Password Reset Section */}
      <section className="mt-6">
        <h3 className="text-[16px] font-bold text-zinc-900 mb-2.5">Security & Credentials</h3>
        <div className="bg-white rounded-2xl border border-zinc-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#FEEADB] text-[#9A3412] flex items-center justify-center shrink-0">
              <KeyRound size={20} strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              <div className="text-[15px] font-semibold text-zinc-900 leading-tight">
                Officer Password
              </div>
              <div className="text-[12px] text-zinc-500 mt-0.5 truncate">
                Encrypted field login authentication
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setNewPassword("");
              setConfirmPassword("");
              setPwdError(null);
              setPwdSuccess(false);
              setPwdOpen(true);
            }}
            className="px-3.5 py-1.5 rounded-xl border border-zinc-300 hover:bg-zinc-50 active:bg-zinc-100 text-xs font-semibold text-zinc-800 transition-colors shrink-0"
          >
            Reset password
          </button>
        </div>
      </section>

      {/* Data Section */}
      <section className="mt-6">
        <h3 className="text-[16px] font-bold text-zinc-900 mb-2.5">Data</h3>
        <button
          type="button"
          onClick={handleResetDemoData}
          className="w-full py-3.5 px-4 bg-white border border-zinc-300 rounded-2xl sm:rounded-full font-semibold text-[15px] text-zinc-900 hover:bg-zinc-50 active:bg-zinc-100 flex items-center justify-center gap-2 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all cursor-pointer"
        >
          <RotateCcw size={16} strokeWidth={2.2} className="text-zinc-700" />
          <span>Reset demo data</span>
        </button>

        {/* Sign out link */}
        <button
          type="button"
          onClick={handleSignOut}
          className="w-full py-3 mt-4 flex items-center justify-center gap-2 text-[#C5221F] hover:text-red-700 font-semibold text-[15px] transition-colors cursor-pointer"
        >
          <LogOut size={16} strokeWidth={2.2} />
          <span>Sign out</span>
        </button>
      </section>

      {/* Footer Disclaimers */}
      <footer className="text-center mt-7 space-y-2">
        <p className="text-xs text-zinc-500 leading-relaxed max-w-xs mx-auto">
          Colour model v2 is on this phone and reads plate photos offline. Printed FIR and kit labels need the server.
        </p>
        <p className="text-[11px] text-zinc-400 font-mono tracking-tight">
          Narcol-ops prototype · SIH 2026 · RS 26221
        </p>
      </footer>

      {/* Edit Profile Modal Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md w-[92vw] bg-[#F8FAFC] p-5 rounded-2xl border border-zinc-200">
          <DialogHeader className="text-left pb-2">
            <DialogTitle className="text-lg font-bold text-zinc-900 flex items-center gap-2">
              <Pencil size={18} className="text-[#E85D04]" />
              Edit Officer Profile
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveProfile} className="space-y-3.5 mt-2">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm bg-white border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E85D04] text-zinc-900"
                placeholder="e.g. Insp. Rajesh Kumar"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Rank / Title
                </label>
                <input
                  type="text"
                  value={editRank}
                  onChange={(e) => setEditRank(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm bg-white border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E85D04] text-zinc-900"
                  placeholder="Inspector"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Station / Unit
                </label>
                <input
                  type="text"
                  value={editStation}
                  onChange={(e) => setEditStation(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm bg-white border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E85D04] text-zinc-900"
                  placeholder="Delhi Zonal Unit"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Badge ID
                </label>
                <input
                  type="text"
                  value={editBadgeId}
                  onChange={(e) => setEditBadgeId(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm bg-white border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E85D04] font-mono text-zinc-900"
                  placeholder="NCB-DEL-4082"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Device ID
                </label>
                <input
                  type="text"
                  value={editDeviceId}
                  onChange={(e) => setEditDeviceId(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm bg-white border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E85D04] font-mono text-zinc-900"
                  placeholder="FIELD-UNIT-07"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                District / Jurisdiction
              </label>
              <input
                type="text"
                value={editDistrict}
                onChange={(e) => setEditDistrict(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm bg-white border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E85D04] text-zinc-900"
                placeholder="New Delhi, Delhi"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3">
              <button
                type="button"
                onClick={() => setEditOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-zinc-200 text-zinc-800 hover:bg-zinc-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={editSaving}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-[#0F172A] text-white hover:bg-zinc-800 transition-colors flex items-center gap-1.5"
              >
                {editSaving && <Loader2 size={13} className="animate-spin" />}
                Save Changes
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Password Reset Modal Dialog */}
      <Dialog open={pwdOpen} onOpenChange={setPwdOpen}>
        <DialogContent className="max-w-md w-[92vw] bg-[#F8FAFC] p-5 rounded-2xl border border-zinc-200">
          <DialogHeader className="text-left pb-1">
            <DialogTitle className="text-lg font-bold text-zinc-900 flex items-center gap-2">
              <KeyRound size={18} className="text-[#E85D04]" />
              Password Reset
            </DialogTitle>
          </DialogHeader>

          {pwdSuccess ? (
            <div className="py-6 text-center space-y-2">
              <CheckCircle2 size={36} className="text-emerald-500 mx-auto" />
              <p className="font-bold text-zinc-900">Password Updated Successfully</p>
              <p className="text-xs text-zinc-500">Your officer security credentials have been updated.</p>
            </div>
          ) : (
            <form onSubmit={handleSavePassword} className="space-y-3.5 mt-2">
              {pwdError && (
                <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
                  <AlertCircle size={15} className="shrink-0 mt-0.5" />
                  <span>{pwdError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="w-full px-3 py-2 pr-10 text-sm bg-white border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E85D04] text-zinc-900"
                    placeholder="Enter new strong password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-1"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Confirm Password
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm bg-white border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E85D04] text-zinc-900"
                  placeholder="Re-enter new password"
                />
              </div>

              {/* Password Requirements Checklist */}
              <div className="p-3 bg-zinc-100 rounded-xl space-y-1.5 text-xs text-zinc-600">
                <div className="font-semibold text-zinc-700 mb-1">Requirements:</div>
                <div className={`flex items-center gap-1.5 ${hasMinLen ? "text-emerald-600 font-medium" : ""}`}>
                  <Check size={12} className={hasMinLen ? "opacity-100" : "opacity-30"} />
                  At least 8 characters
                </div>
                <div className={`flex items-center gap-1.5 ${hasUpper ? "text-emerald-600 font-medium" : ""}`}>
                  <Check size={12} className={hasUpper ? "opacity-100" : "opacity-30"} />
                  At least one uppercase letter (A-Z)
                </div>
                <div className={`flex items-center gap-1.5 ${hasLower ? "text-emerald-600 font-medium" : ""}`}>
                  <Check size={12} className={hasLower ? "opacity-100" : "opacity-30"} />
                  At least one lowercase letter (a-z)
                </div>
                <div className={`flex items-center gap-1.5 ${hasNumber ? "text-emerald-600 font-medium" : ""}`}>
                  <Check size={12} className={hasNumber ? "opacity-100" : "opacity-30"} />
                  At least one number (0-9)
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setPwdOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-zinc-200 text-zinc-800 hover:bg-zinc-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pwdSaving || !hasMinLen || !hasUpper || !hasLower || !hasNumber}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-[#0F172A] text-white hover:bg-zinc-800 disabled:opacity-50 transition-colors flex items-center gap-1.5"
                >
                  {pwdSaving && <Loader2 size={13} className="animate-spin" />}
                  Update Password
                </button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/**
 * ProfileModal - Dialog wrapper that opens as a modern window when clicking profile on the nav bar.
 */
export function ProfileModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-full max-h-[92vh] overflow-y-auto bg-[#F8FAFC] rounded-3xl p-5 sm:p-6 border border-zinc-200 shadow-2xl focus:outline-none">
        <ProfileContent onBack={() => onOpenChange(false)} isModal />
      </DialogContent>
    </Dialog>
  );
}
