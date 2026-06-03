/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Lock, Eye, EyeOff, Check, X, ShieldAlert } from "lucide-react";

export const ChangePassword: React.FC = () => {
  const { changePassword } = useAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  // Status logs
  const [isUpdating, setIsUpdating] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Check guidelines for brand new passwords
  const hasLength = newPassword.length >= 8 && newPassword.length <= 16;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword);
  const isMatch = newPassword === confirmPassword && confirmPassword.length > 0;
  const isValidNew = hasLength && hasUpper && hasSpecial && isMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!isValidNew) {
      setErrorMsg("New password must fulfill all validation items and match the verification input.");
      return;
    }

    setIsUpdating(true);
    const result = await changePassword(currentPassword, newPassword);
    setIsUpdating(false);

    if (result.success) {
      setSuccessMsg("Your credential password has been updated securely. It is active immediately.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      setErrorMsg(result.error || "Incorrect current password or other system validation failure.");
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white border-2 border-black p-6 space-y-6 rounded-none shadow-[4px_4px_0px_0px_#000000] text-black selection:bg-black selection:text-white" id="change_password_box">
      <div>
        <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-black/50 font-black flex items-center gap-1">
          <ShieldAlert className="w-3.5 h-3.5 stroke-[2.5px]" /> Credential Rotation
        </span>
        <h1 className="text-2xl font-black tracking-tight text-black font-display mt-1 uppercase">Change Account Password</h1>
        <p className="text-xs text-black/60 mt-1 font-sans">
          We recommend choosing a robust, high-entropy unique password containing uppercase and special characters.
        </p>
      </div>

      {errorMsg && (
        <div className="p-3 bg-white text-red-600 border-2 border-red-600 rounded-none leading-relaxed text-xs font-bold flex items-start gap-2" id="pwd_error_box">
          <X className="w-4 h-4 shrink-0 mt-0.5 stroke-[2.5px]" />
          <span className="uppercase tracking-wide font-mono text-[11px]">{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-black text-white border-2 border-black rounded-none leading-relaxed text-xs font-bold flex items-start gap-2" id="pwd_success_box">
          <Check className="w-4 h-4 shrink-0 mt-0.5 stroke-[2.5px] text-green-400" />
          <span className="uppercase tracking-wide font-mono text-[11px]">{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Current Password */}
        <div>
          <label className="block text-xs font-black text-black mb-1.5 uppercase tracking-wider font-mono">Current Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-3.5 text-black w-4 h-4" />
            <input
              type={showCurrent ? "text" : "password"}
              required
              placeholder="••••••••"
              className="w-full pl-10 pr-10 py-3 bg-white hover:bg-zinc-50 focus:bg-zinc-50 text-xs font-bold border-2 border-black rounded-none transition-all outline-none"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              id="current_password"
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute right-3 top-3.5 text-black hover:text-zinc-650 transition-colors cursor-pointer"
            >
              {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* New Password */}
        <div>
          <label className="block text-xs font-black text-black mb-1.5 uppercase tracking-wider font-mono">New Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-3.5 text-black w-4 h-4" />
            <input
              type={showNew ? "text" : "password"}
              required
              placeholder="e.g. RobustP@ssword12"
              className={`w-full pl-10 pr-10 py-3 bg-white hover:bg-zinc-50 focus:bg-zinc-50 text-xs font-bold border-2 rounded-none transition-all outline-none ${newPassword.length > 0 ? ((hasLength && hasUpper && hasSpecial) ? "border-black" : "border-red-500") : "border-black"}`}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              id="new_password"
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-3 top-3.5 text-black hover:text-zinc-650 transition-colors cursor-pointer"
            >
              {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Guidelines visual meter */}
          <div className="mt-2.5 p-3 bg-zinc-50 border-2 border-black rounded-none space-y-1.5 text-[10px] text-black font-mono font-bold uppercase tracking-wide">
            <div className={`flex items-center gap-1.5 ${hasLength ? "text-slate-900" : "text-black/45"}`}>
              {hasLength ? <Check className="w-3.5 h-3.5 stroke-[3px]" /> : <X className="w-3.5 h-3.5 text-red-500 stroke-[3px]" />} Between 8 and 16 characters ({newPassword.length})
            </div>
            <div className={`flex items-center gap-1.5 ${hasUpper ? "text-slate-900" : "text-black/45"}`}>
              {hasUpper ? <Check className="w-3.5 h-3.5 stroke-[3px]" /> : <X className="w-3.5 h-3.5 text-red-500 stroke-[3px]" />} At least one UPPERCASE character (A-Z)
            </div>
            <div className={`flex items-center gap-1.5 ${hasSpecial ? "text-slate-900" : "text-black/45"}`}>
              {hasSpecial ? <Check className="w-3.5 h-3.5 stroke-[3px]" /> : <X className="w-3.5 h-3.5 text-red-500 stroke-[3px]" />} At least one special symbol (!@#$%^&*)
            </div>
          </div>
        </div>

        {/* Confirm password */}
        <div>
          <label className="block text-xs font-black text-black mb-1.5 uppercase tracking-wider font-mono">Confirm New Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-3.5 text-black w-4 h-4" />
            <input
              type="password"
              required
              placeholder="Confirm new value..."
              className={`w-full pl-10 pr-4 py-3 bg-white hover:bg-zinc-50 focus:bg-zinc-50 text-xs font-bold border-2 rounded-none transition-all outline-none ${confirmPassword.length > 0 ? (isMatch ? "border-black" : "border-red-500") : "border-black"}`}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              id="confirm_password"
            />
          </div>
          {confirmPassword.length > 0 && !isMatch && (
            <p className="text-[10px] text-red-500 font-mono font-bold uppercase tracking-wide mt-1">Passwords do not match</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isUpdating || !isValidNew}
          className="w-full py-3 bg-black text-white hover:bg-white hover:text-black border-2 border-black text-xs font-black uppercase tracking-widest transition-all cursor-pointer disabled:bg-zinc-100 disabled:text-zinc-400 active:translate-x-[1px] active:translate-y-[1px]"
          id="btn_submit_change_password"
        >
          {isUpdating ? "Confirming rotation..." : "Rotate Credentials Now"}
        </button>
      </form>
    </div>
  );
};
