/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { UserRole } from "../types";
import { ShieldCheck, Mail, Lock, User as UserIcon, MapPin, Eye, EyeOff, Check, X } from "lucide-react";
import { motion } from "motion/react";

interface LoginModalProps {
  onSuccess: () => void;
  initialTab?: "login" | "register";
}

export const LoginModal: React.FC<LoginModalProps> = ({ onSuccess, initialTab = "login" }) => {
  const { login, registerUser } = useAuth();
  const [activeTab, setActiveTab] = useState<"login" | "register">(initialTab);

  // Form Fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [signUpRole, setSignUpRole] = useState<UserRole>(UserRole.USER);

  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // Field Validation states
  const hasMinNameVal = name.length >= 20;
  const hasMaxNameVal = name.length <= 60;
  const isNameVal = hasMinNameVal && hasMaxNameVal;

  const isEmailVal = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const isPassLength = password.length >= 8 && password.length <= 16;
  const isPassUpper = /[A-Z]/.test(password);
  const isPassSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  const isPassVal = isPassLength && isPassUpper && isPassSpecial;

  const isAddressVal = address.trim().length > 0 && address.trim().length <= 400;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      onSuccess();
    } else {
      setErrorMsg(result.error || "Login fell short.");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    // Double validate client-side
    if (!isNameVal) {
      setErrorMsg("Name Must Be Between 20 and 60 Characters");
      return;
    }
    if (!isEmailVal) {
      setErrorMsg("Please provide a valid email");
      return;
    }
    if (!isPassVal) {
      setErrorMsg("Password Must Fulfill All Security Criteria");
      return;
    }
    if (!isAddressVal) {
      setErrorMsg("Address cannot be empty or exceed 400 chars");
      return;
    }

    setLoading(true);
    const result = await registerUser({
      name,
      email,
      password,
      address,
      role: signUpRole
    });
    setLoading(false);

    if (result.success) {
      setSuccessMsg("Registration completed! You can now log in below.");
      // Soft transition to login
      setTimeout(() => {
        setActiveTab("login");
        setErrorMsg("");
        setSuccessMsg("");
      }, 2000);
    } else {
      setErrorMsg(result.error || "Fail to register.");
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-none border-2 border-black shadow-[4px_4px_0px_0px_#000000] overflow-hidden" id="auth_container_card">
      <div className="flex bg-zinc-50">
        <button
          className={`flex-1 py-4 text-xs font-black uppercase tracking-wider transition-colors border-b-2 border-black ${activeTab === "login" ? "bg-black text-white border-r-2 border-black" : "bg-white text-black border-r-2 border-black hover:bg-black hover:text-white"}`}
          onClick={() => {
            setActiveTab("login");
            setErrorMsg("");
            setSuccessMsg("");
          }}
          id="btn_tab_login"
        >
          Secure Sign In
        </button>
        <button
          className={`flex-1 py-4 text-xs font-black uppercase tracking-wider transition-colors border-b-2 border-black ${activeTab === "register" ? "bg-black text-white" : "bg-white text-black hover:bg-black hover:text-white"}`}
          onClick={() => {
            setActiveTab("register");
            setErrorMsg("");
            setSuccessMsg("");
          }}
          id="btn_tab_register"
        >
          New Registration
        </button>
      </div>

      <div className="p-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-black tracking-tight text-black font-display uppercase">
            {activeTab === "login" ? "Welcome Back" : "Establish Profile"}
          </h2>
          <p className="text-[10px] text-zinc-500 mt-1.5 font-mono uppercase font-bold tracking-widest">
            {activeTab === "login" ? "Sign in to score, review and audit local stores" : "Create standard reviewer or store merchant accounts"}
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-white text-red-600 border-2 border-red-600 rounded-none text-xs font-bold leading-relaxed flex items-center gap-2" id="auth_error_container">
            <X className="w-4 h-4 shrink-0 stroke-[2.5px]" />
            <span className="uppercase tracking-wide font-mono text-[11px]">{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-black text-white border-2 border-black rounded-none text-xs font-bold leading-relaxed flex items-center gap-2" id="auth_success_container">
            <Check className="w-4 h-4 shrink-0 stroke-[2.5px] text-green-400" />
            <span className="uppercase tracking-wide font-mono text-[11px]">{successMsg}</span>
          </div>
        )}

        {activeTab === "login" ? (
          <form onSubmit={handleLogin} className="space-y-4" id="form_login">
            <div>
              <label className="block text-xs font-black text-black mb-1.5 uppercase tracking-wider font-mono">Feedback Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 text-black w-4 h-4" />
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  className="w-full pl-10 pr-4 py-3 bg-white hover:bg-zinc-50 focus:bg-zinc-50 text-xs font-bold border-2 border-black rounded-none transition-all outline-none"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  id="login_email_input"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-black mb-1.5 uppercase tracking-wider font-mono">Secret Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 text-black w-4 h-4" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 bg-white hover:bg-zinc-50 focus:bg-zinc-50 text-xs font-bold border-2 border-black rounded-none transition-all outline-none"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  id="login_password_input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-black hover:text-zinc-650 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-black text-white hover:bg-white hover:text-black border-2 border-black font-black text-xs uppercase tracking-widest transition-all duration-100 disabled:bg-zinc-100 disabled:text-zinc-400 cursor-pointer active:translate-x-[1px] active:translate-y-[1px]"
              id="login_submit_btn"
            >
              {loading ? "Authenticating Profile..." : "Authorize Login"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4" id="form_register">
            <div>
              <label className="block text-xs font-black text-black mb-1.5 uppercase tracking-wider font-mono">Select Register Role</label>
              <div className="grid grid-cols-2 gap-3 mb-1">
                <button
                  type="button"
                  className={`py-2 px-3 border-2 rounded-none text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer ${signUpRole === UserRole.USER ? "border-black bg-black text-white" : "border-black bg-white text-black hover:bg-black hover:text-white"}`}
                  onClick={() => setSignUpRole(UserRole.USER)}
                  id="role_select_user"
                >
                  Customer User
                </button>
                <button
                  type="button"
                  className={`py-2 px-3 border-2 rounded-none text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer ${signUpRole === UserRole.OWNER ? "border-black bg-black text-white" : "border-black bg-white text-black hover:bg-black hover:text-white"}`}
                  onClick={() => setSignUpRole(UserRole.OWNER)}
                  id="role_select_owner"
                >
                  Store Owner
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-black mb-1.5 uppercase tracking-wider font-mono">Full Legal Name</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-3.5 text-black w-4 h-4" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Christopher Robin Jenkins Esquire"
                  className={`w-full pl-10 pr-4 py-2.5 bg-white hover:bg-zinc-50 focus:bg-zinc-50 text-xs font-bold border-2 rounded-none transition-all outline-none ${name.length > 0 ? (isNameVal ? "border-black" : "border-red-500") : "border-black"}`}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  id="register_name_input"
                />
              </div>
              <div className="mt-1.5 flex flex-wrap gap-x-3 text-[10px] text-black font-mono font-bold uppercase tracking-wide">
                <span className={`inline-flex items-center gap-1 ${isNameVal ? "text-slate-800" : "text-black/45"}`}>
                  {isNameVal ? <Check className="w-3" /> : <X className="w-3 text-red-500" />} Min 20 chars ({name.length})
                </span>
                <span className={`inline-flex items-center gap-1 ${hasMaxNameVal ? "text-slate-800" : "text-red-500"}`}>
                  {hasMaxNameVal ? <Check className="w-3" /> : <X className="w-3" />} Max 60 chars ({name.length}/60)
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-black mb-1.5 uppercase tracking-wider font-mono">Registered Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 text-black w-4 h-4" />
                <input
                  type="email"
                  required
                  placeholder="e.g. reviewer.expert@platform.com"
                  className={`w-full pl-10 pr-4 py-2.5 bg-white hover:bg-zinc-50 focus:bg-zinc-50 text-xs font-bold border-2 rounded-none transition-all outline-none ${email.length > 0 ? (isEmailVal ? "border-black" : "border-red-500") : "border-black"}`}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  id="register_email_input"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-black mb-1.5 uppercase tracking-wider font-mono">Physical Home Address</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3.5 text-black w-4 h-4" />
                <textarea
                  required
                  rows={2}
                  placeholder="e.g. 100 Main Street Block C, Springfield OR"
                  className={`w-full pl-10 pr-4 py-2 bg-white hover:bg-zinc-50 focus:bg-zinc-50 text-xs font-bold border-2 rounded-none transition-all outline-none ${address.length > 0 ? (isAddressVal ? "border-black" : "border-red-500") : "border-black"}`}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  id="register_address_input"
                />
              </div>
              <div className="mt-1 flex items-center justify-between text-[10px] text-black font-mono font-bold uppercase tracking-wide">
                <span>Maximum 400 Characters</span>
                <span className={address.length > 400 ? "text-red-500 font-extrabold" : ""}>{address.length}/400</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-black mb-1.5 uppercase tracking-wider font-mono">Create Secure Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 text-black w-4 h-4" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="8–16 characters, uppercase & special"
                  className={`w-full pl-10 pr-10 py-2.5 bg-white hover:bg-zinc-50 focus:bg-zinc-50 text-xs font-bold border-2 rounded-none transition-all outline-none ${password.length > 0 ? (isPassVal ? "border-black" : "border-red-500") : "border-black"}`}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  id="register_password_input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-black hover:text-zinc-650 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="mt-2 space-y-1 bg-zinc-50 p-3 border-2 border-black rounded-none text-[10px] font-mono font-bold uppercase tracking-wide">
                <div className="font-black text-black uppercase tracking-widest text-[9px] mb-1">Required checklist:</div>
                <div className={`flex items-center gap-1.5 ${isPassLength ? "text-black" : "text-black/45"}`}>
                  {isPassLength ? <Check className="w-3 text-black stroke-[3px]" /> : <X className="w-3 text-red-500 stroke-[3px]" />} 8 to 16 characters
                </div>
                <div className={`flex items-center gap-1.5 ${isPassUpper ? "text-black" : "text-black/45"}`}>
                  {isPassUpper ? <Check className="w-3 text-black stroke-[3px]" /> : <X className="w-3 text-red-500 stroke-[3px]" />} At least one UPPERCASE letter (A-Z)
                </div>
                <div className={`flex items-center gap-1.5 ${isPassSpecial ? "text-black" : "text-black/45"}`}>
                  {isPassSpecial ? <Check className="w-3 text-black stroke-[3px]" /> : <X className="w-3 text-red-500 stroke-[3px]" />} At least one special symbol (!@#$%^&*)
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !isNameVal || !isEmailVal || !isPassVal || !isAddressVal}
              className="w-full py-3 bg-black hover:bg-white hover:text-black border-2 border-black text-white font-black text-xs uppercase tracking-widest transition-all duration-100 disabled:bg-zinc-100 disabled:text-zinc-400 cursor-pointer active:translate-x-[1px] active:translate-y-[1px]"
              id="register_submit_btn"
            >
              {loading ? "Registering account..." : "Submit Registration"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
