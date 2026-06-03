/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { User, Store, Rating, UserRole, PlatformStats } from "../types";
import { Users, Store as StoreIcon, Star, PlusCircle, Check, X, Search, ChevronDown, RefreshCw, BarChart2, ShieldCheck, Mail, Lock, UserCheck, MapPin, Eye, EyeOff, Calendar, ListFilter, Sliders, ArrowUpDown } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export const AdminConsole: React.FC = () => {
  const { user, apiFetch } = useAuth();

  const [activeSubTab, setActiveSubTab] = useState<"stats" | "users" | "stores">("stats");

  // Global Stat metrics state
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Manage Users state
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userFilters, setUserFilters] = useState({
    name: "",
    email: "",
    address: "",
    role: ""
  });
  const [userSort, setUserSort] = useState<{ field: keyof User | ""; order: "asc" | "desc" }>({
    field: "createdAt",
    order: "desc"
  });
  const [selectedProfile, setSelectedProfile] = useState<User | null>(null);

  // Manage Stores state
  const [stores, setStores] = useState<(Store & { averageRating: number; ratingsCount: number })[]>([]);
  const [storesLoading, setStoresLoading] = useState(false);
  const [auditStoreDetail, setAuditStoreDetail] = useState<(Store & { averageRating: number; ratingsCount: number }) | null>(null);
  const [auditFeedback, setAuditFeedback] = useState<any[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);

  // Forms processing states
  const [toast, setToast] = useState<{ text: string; isError: boolean } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Adding Users form fields
  const [addUserName, setAddUserName] = useState("");
  const [addUserEmail, setAddUserEmail] = useState("");
  const [addUserPassword, setAddUserPassword] = useState("");
  const [addUserAddress, setAddUserAddress] = useState("");
  const [addUserRole, setAddUserRole] = useState<UserRole>(UserRole.USER);
  const [showPass, setShowPass] = useState(false);

  // Adding Stores form fields
  const [addStoreName, setAddStoreName] = useState("");
  const [addStoreEmail, setAddStoreEmail] = useState("");
  const [addStoreAddress, setAddStoreAddress] = useState("");
  const [addStoreOwner, setAddStoreOwner] = useState("");

  useEffect(() => {
    loadStats();
    if (activeSubTab === "users") {
      fetchUsers();
    } else if (activeSubTab === "stores") {
      fetchStores();
    }
  }, [activeSubTab]);

  const triggerToast = (text: string, isError = false) => {
    setToast({ text, isError });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  const loadStats = async () => {
    setStatsLoading(true);
    try {
      const res = await apiFetch("/api/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Failed load stats admin", err);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      // Encode query filters
      const { name, email, address, role } = userFilters;
      let url = `/api/users?name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}&address=${encodeURIComponent(address)}`;
      if (role) {
        url += `&role=${role}`;
      }
      if (userSort.field) {
        url += `&sortBy=${String(userSort.field)}&sortOrder=${userSort.order}`;
      }

      const res = await apiFetch(url);
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error("Failed loading users", err);
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchStores = async () => {
    setStoresLoading(true);
    try {
      const res = await apiFetch("/api/stores");
      if (res.ok) {
        const data = await res.json();
        setStores(data);
      }
    } catch (err) {
      console.error("Failed loading stores", err);
    } finally {
      setStoresLoading(false);
    }
  };

  // Validators (strict client side match rules)
  const isNameVal = addUserName.length >= 20 && addUserName.length <= 60;
  const isEmailVal = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addUserEmail);
  const isPassVal = addUserPassword.length >= 8 && addUserPassword.length <= 16 && /[A-Z]/.test(addUserPassword) && /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(addUserPassword);
  const isAddressVal = addUserAddress.trim().length > 0 && addUserAddress.trim().length <= 400;

  // Add User Operation
  const handleAddUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isNameVal || !isEmailVal || !isPassVal || !isAddressVal) {
      triggerToast("User input fields fail to meet strict validation rules", true);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiFetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: addUserName,
          email: addUserEmail,
          password: addUserPassword,
          address: addUserAddress,
          role: addUserRole
        })
      });

      if (res.ok) {
        triggerToast("New User account created successfully!");
        setAddUserName("");
        setAddUserEmail("");
        setAddUserPassword("");
        setAddUserAddress("");
        setAddUserRole(UserRole.USER);
        loadStats();
        if (activeSubTab === "users") {
          fetchUsers();
        }
      } else {
        const errData = await res.json();
        triggerToast(errData.error || "Failed to create user account", true);
      }
    } catch (err) {
      triggerToast("Error saving user profile to endpoint.", true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add Store Operation
  const handleAddStoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addStoreName.trim()) {
      triggerToast("Store Name is required", true);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addStoreEmail)) {
      triggerToast("Please provide a valid store email", true);
      return;
    }
    if (addStoreAddress.trim().length === 0 || addStoreAddress.length > 400) {
      triggerToast("Address is required and max 400 characters", true);
      return;
    }
    if (!addStoreOwner) {
      triggerToast("Please specify a designated store owner ID", true);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiFetch("/api/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: addStoreName,
          email: addStoreEmail,
          address: addStoreAddress,
          ownerId: addStoreOwner
        })
      });

      if (res.ok) {
        triggerToast("Merchant Store storefront added successfully!");
        setAddStoreName("");
        setAddStoreEmail("");
        setAddStoreAddress("");
        setAddStoreOwner("");
        loadStats();
        if (activeSubTab === "stores") {
          fetchStores();
        }
      } else {
        const errData = await res.json();
        triggerToast(errData.error || "Store creation failed.", true);
      }
    } catch (err) {
      triggerToast("Failed adding store.", true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Trigger User Sorting Logic
  const handleUserSort = (column: keyof User) => {
    setUserSort(prev => {
      const newOrder = prev.field === column && prev.order === "asc" ? "desc" : "asc";
      return { field: column, order: newOrder };
    });
  };

  // Apply sequential changes of user query filters immediately
  useEffect(() => {
    if (activeSubTab === "users") {
      fetchUsers();
    }
  }, [userFilters, userSort]);

  // Open store audit logs popup within Admin Control Room
  const handleAuditStore = async (store: any) => {
    setAuditStoreDetail(store);
    setAuditFeedback([]);
    setAuditLoading(true);

    try {
      const res = await apiFetch(`/api/stores/${store.id}`);
      if (res.ok) {
        const data = await res.json();
        setAuditFeedback(data.feedback || []);
      }
    } catch (err) {
      console.error("Failed load audit data for store", err);
    } finally {
      setAuditLoading(false);
    }
  };

  const handleClearUserFilters = () => {
    setUserFilters({ name: "", email: "", address: "", role: "" });
  };

  return (
    <div className="space-y-6 selection:bg-black selection:text-white text-black animate-none">
      {/* Toast Notice */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`fixed top-6 right-6 z-50 p-4 rounded-none border-2 border-black shadow-[4px_4px_0px_0px_#000000] text-xs font-black uppercase tracking-wider flex items-center gap-3 max-w-sm ${toast.isError ? "bg-white text-black" : "bg-black text-white"}`}
            id="admin_toast_box"
          >
            {toast.isError ? <X className="w-4 h-4 shrink-0 stroke-[2.5px] text-red-500" /> : <Check className="w-4 h-4 shrink-0 stroke-[2.5px] text-green-400" />}
            <span>{toast.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Admin Title Box */}
      <div className="bg-black text-white p-8 md:p-12 border-2 border-black flex flex-col md:flex-row justify-between items-start md:items-center gap-6 rounded-none shadow-[4px_4px_0px_0px_#000000]" id="admin_header_banner">
        <div className="space-y-2">
          <span className="text-xs font-mono tracking-[0.3em] text-white/50 font-bold uppercase block">Platform Security Room</span>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tighter leading-none uppercase font-display">System Administrator Control Tower</h1>
          <p className="text-xs text-white/60 max-w-sm mt-1 leading-relaxed font-sans">
            Provision users, register new merchant stores, and audit store feedback logs across the entire ecosystem.
          </p>
        </div>
        <div className="flex gap-1 bg-zinc-900 border-2 border-zinc-800 p-1 rounded-none self-start md:self-auto shrink-0">
          {(["stats", "users", "stores"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveSubTab(tab)}
              className={`px-3 py-1.5 rounded-none text-xs font-black uppercase tracking-wider font-mono transition-all cursor-pointer ${activeSubTab === tab ? "bg-white text-black font-black" : "text-white/50 hover:text-white"}`}
              id={`admin_subtab_btn_${tab}`}
            >
              {tab === "stats" ? "Platform Metrics" : tab === "users" ? "Audit Users" : "Audit Stores"}
            </button>
          ))}
        </div>
      </div>

      {/* Sub Tab: Stats & Provisioning Forms */}
      {activeSubTab === "stats" && (
        <div className="space-y-6" id="panel_admin_stats">
          {/* Quick Metrics Widget */}
          {statsLoading ? (
            <div className="text-center py-20 bg-white border-2 border-black rounded-none shadow-[4px_4px_0px_0px_#000000]">
              <RefreshCw className="w-10 h-10 mx-auto text-black animate-spin" />
              <p className="text-xs text-black font-mono font-black uppercase mt-4">Updating registry stats...</p>
            </div>
          ) : stats ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Metric 1 */}
              <div className="bg-white border-2 border-black p-6 rounded-none hover:shadow-[4px_4px_0px_0px_#000000] transition-all flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-black/55 font-black">Ecosystem Users</span>
                  <div className="text-4xl font-black text-black font-display uppercase italic mt-1">{stats.totalUsers}</div>
                  <p className="text-[9px] text-black/45 font-mono uppercase font-black mt-1">Customers, store owners & admins</p>
                </div>
                <div className="p-4 bg-zinc-100 border-2 border-black rounded-none text-black shrink-0">
                  <Users className="w-6 h-6" />
                </div>
              </div>

              {/* Metric 2 */}
              <div className="bg-white border-2 border-black p-6 rounded-none hover:shadow-[4px_4px_0px_0px_#000000] transition-all flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-black/55 font-black">Registered Businesses</span>
                  <div className="text-4xl font-black text-black font-display uppercase italic mt-1">{stats.totalStores}</div>
                  <p className="text-[9px] text-black/45 font-mono uppercase font-black mt-1">Unique merchant storefronts</p>
                </div>
                <div className="p-4 bg-zinc-100 border-2 border-black rounded-none text-black shrink-0">
                  <StoreIcon className="w-6 h-6" />
                </div>
              </div>

              {/* Metric 3 */}
              <div className="bg-white border-2 border-black p-6 rounded-none hover:shadow-[4px_4px_0px_0px_#000000] transition-all flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-black/55 font-black">Ratings Logged</span>
                  <div className="text-4xl font-black text-black font-display uppercase italic mt-1">{stats.totalRatings}</div>
                  <p className="text-[9px] text-black/45 font-mono uppercase font-black mt-1">Verified review evaluations</p>
                </div>
                <div className="p-4 bg-zinc-100 border-2 border-black rounded-none text-black shrink-0">
                  <Star className="w-6 h-6" />
                </div>
              </div>
            </div>
          ) : null}

          {/* User & Store Provisioning Forms side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form 1: Add New Platform User */}
            <div className="bg-white border-2 border-black rounded-none p-6 shadow-[4px_4px_0px_0px_#000000] space-y-4" id="box_add_user">
              <div>
                <h3 className="text-sm font-black tracking-widest text-black uppercase font-mono flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-black" /> Provision Platform Account
                </h3>
                <p className="text-[11px] text-black/50 font-bold uppercase tracking-wider font-mono">Registers Admin, Merchant, or Normal Reviewer</p>
              </div>

              <form onSubmit={handleAddUserSubmit} className="space-y-4">
                {/* Select Role */}
                <div>
                  <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-1.5 font-mono">Assigned Role</label>
                  <select
                    value={addUserRole}
                    onChange={(e) => setAddUserRole(e.target.value as UserRole)}
                    className="w-full bg-white hover:bg-zinc-50 focus:bg-zinc-50 border-2 border-black py-2.5 px-3 rounded-none outline-none font-bold text-xs uppercase tracking-wide transition-all cursor-pointer"
                    id="add_user_role"
                  >
                    <option value={UserRole.USER}>Normal Reviewer (USER)</option>
                    <option value={UserRole.OWNER}>Merchant Owner (OWNER)</option>
                    <option value={UserRole.ADMIN}>System Administrator (ADMIN)</option>
                  </select>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-1.5 font-mono">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Timothy Lawrence Washington"
                    className="w-full bg-white hover:bg-zinc-50 focus:bg-zinc-50 border-2 border-black py-2.5 px-3 rounded-none outline-none font-bold text-xs uppercase tracking-wide transition-all"
                    value={addUserName}
                    onChange={(e) => setAddUserName(e.target.value)}
                    id="add_user_name_input"
                  />
                  <div className="mt-1 flex items-center justify-between text-[10px] text-black/50 font-bold uppercase tracking-wide font-mono">
                    <span>Range: 20-60 characters</span>
                    <span className={addUserName.length > 60 || addUserName.length < 20 ? "text-red-500 font-black" : "text-black"}>{addUserName.length}/60</span>
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-1.5 font-mono">Security Email</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. u.executive@platform.com"
                    className="w-full bg-white hover:bg-zinc-50 focus:bg-zinc-50 border-2 border-black py-2.5 px-3 rounded-none outline-none font-bold text-xs uppercase tracking-wide transition-all"
                    value={addUserEmail}
                    onChange={(e) => setAddUserEmail(e.target.value)}
                    id="add_user_email_input"
                  />
                </div>

                {/* Home Address */}
                <div>
                  <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-1.5 font-mono">Physical Address</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 59 Broadway Boulevard, New York NY 10006"
                    className="w-full bg-white hover:bg-zinc-50 focus:bg-zinc-50 border-2 border-black py-2.5 px-3 rounded-none outline-none font-bold text-xs uppercase tracking-wide transition-all"
                    value={addUserAddress}
                    onChange={(e) => setAddUserAddress(e.target.value)}
                    id="add_user_address_input"
                  />
                  <div className="mt-1 text-[10px] text-black/55 font-bold uppercase tracking-wide font-mono">Max 400 characters (current: {addUserAddress.length})</div>
                </div>

                {/* Password with inline validation */}
                <div>
                  <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-1.5 font-mono">Passcode Credentials</label>
                  <div className="relative">
                    <input
                      type={showPass ? "text" : "password"}
                      required
                      placeholder="e.g. SecurP@ss1!"
                      className="w-full bg-white hover:bg-zinc-50 focus:bg-zinc-50 border-2 border-black py-2.5 pl-3 pr-9 rounded-none outline-none font-bold text-xs uppercase tracking-wide transition-all"
                      value={addUserPassword}
                      onChange={(e) => setAddUserPassword(e.target.value)}
                      id="add_user_password_input"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-2.5 top-3 text-black hover:text-zinc-600 cursor-pointer"
                    >
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="mt-1 text-[9px] text-black/55 font-bold uppercase tracking-wider leading-relaxed font-mono">
                    Must be 8-16 chars, contain a capital letter and a special symbol.
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !isNameVal || !isEmailVal || !isPassVal || !isAddressVal}
                  className="w-full py-3 bg-black text-white hover:bg-white hover:text-black border-2 border-black text-xs font-black uppercase tracking-widest transition-all cursor-pointer disabled:bg-zinc-100 disabled:text-zinc-400 active:translate-x-[1px] active:translate-y-[1px]"
                  id="add_user_submit_btn"
                >
                  {isSubmitting ? "Registring User..." : "Commit User Registration"}
                </button>
              </form>
            </div>

            {/* Form 2: Add Store storefront */}
            <div className="bg-white border-2 border-black rounded-none p-6 shadow-[4px_4px_0px_0px_#000000] space-y-4" id="box_add_store">
              <div>
                <h3 className="text-sm font-black tracking-widest text-black uppercase font-mono flex items-center gap-1.5">
                  <PlusCircle className="w-4 h-4 text-black" /> Register Merchant Store
                </h3>
                <p className="text-[11px] text-black/50 font-bold uppercase tracking-wider font-mono">Adds store profile & assigns OWNER account</p>
              </div>

              <form onSubmit={handleAddStoreSubmit} className="space-y-4">
                {/* Store Name */}
                <div>
                  <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-1.5 font-mono">Store Title / Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. borders Literature and Coffee"
                    className="w-full bg-white hover:bg-zinc-50 focus:bg-zinc-50 border-2 border-black py-2.5 px-3 rounded-none outline-none font-bold text-xs uppercase tracking-wide transition-all"
                    value={addStoreName}
                    onChange={(e) => setAddStoreName(e.target.value)}
                    id="add_store_name_input"
                  />
                </div>

                {/* Store Email */}
                <div>
                  <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-1.5 font-mono">Feedback Email</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. border.coffee@feedback.org"
                    className="w-full bg-white hover:bg-zinc-50 focus:bg-zinc-50 border-2 border-black py-2.5 px-3 rounded-none outline-none font-bold text-xs uppercase tracking-wide transition-all"
                    value={addStoreEmail}
                    onChange={(e) => setAddStoreEmail(e.target.value)}
                    id="add_store_email_input"
                  />
                </div>

                {/* Store Address */}
                <div>
                  <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-1.5 font-mono">Store Coordinates Physical Address</label>
                  <textarea
                    required
                    rows={2}
                    placeholder="e.g. 100 Literary Way, Readville VT 05401"
                    className="w-full bg-white hover:bg-zinc-50 focus:bg-zinc-50 border-2 border-black py-2.5 px-3 rounded-none outline-none font-bold text-xs uppercase tracking-wide transition-all resize-none font-sans"
                    value={addStoreAddress}
                    onChange={(e) => setAddStoreAddress(e.target.value)}
                    id="add_store_address_input"
                  />
                  <div className="mt-1 flex items-center justify-between text-[10px] text-black/55 font-bold uppercase tracking-wide font-mono">
                    <span>Max 400 characters</span>
                    <span>{addStoreAddress.length}/400</span>
                  </div>
                </div>

                {/* Assigned Owner Select */}
                <div>
                  <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-1.5 font-mono">Designated Store Owner Link</label>
                  <input
                    type="text"
                    required
                    placeholder="Owner User ID (e.g. owner-1)"
                    className="w-full bg-white hover:bg-zinc-50 focus:bg-zinc-50 border-2 border-black py-2.5 px-3 rounded-none outline-none font-bold text-xs uppercase tracking-wide transition-all"
                    value={addStoreOwner}
                    onChange={(e) => setAddStoreOwner(e.target.value)}
                    id="add_store_owner_id_input"
                  />
                  <div className="mt-1 text-[9px] text-black/50 font-bold uppercase tracking-wider leading-relaxed font-mono">
                    Target OWNER ID must already have a "Store Owner" role account (e.g. <span className="font-extrabold text-black">owner-1</span>, <span className="font-extrabold text-black">owner-2</span>)
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !addStoreName.trim() || !addStoreAddress.trim() || !addStoreOwner.trim()}
                  className="w-full py-3 bg-black text-white hover:bg-white hover:text-black border-2 border-black text-xs font-black uppercase tracking-widest transition-all cursor-pointer disabled:bg-zinc-100 disabled:text-zinc-400 active:translate-x-[1px] active:translate-y-[1px]"
                  id="add_store_submit_btn"
                >
                  {isSubmitting ? "Generating store profile..." : "Commit Store Integration"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Sub Tab: Manage Users with dynamic list, filters, sequential filter and sort head headers */}
      {activeSubTab === "users" && (
        <div className="bg-white border-2 border-black rounded-none shadow-[4px_4px_0px_0px_#000000] overflow-hidden" id="panel_admin_users">
          {/* Header & filters */}
          <div className="p-6 border-b-2 border-black bg-zinc-50 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-black tracking-widest text-black uppercase font-mono">Users registry and security audits</h3>
                <p className="text-[11px] text-black/60 font-bold uppercase tracking-wider font-mono">Filter, audit, and examine detailed customer credentials securely</p>
              </div>
              <button
                onClick={handleClearUserFilters}
                className="py-1.5 px-3 bg-white hover:bg-black border-2 border-black text-black hover:text-white rounded-none text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer"
                id="btn_clear_user_filters"
              >
                Reset User Filters
              </button>
            </div>

            {/* Filter inputs panel */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-white border-2 border-black rounded-none shadow-sm">
              {/* Filter 1: Name */}
              <div>
                <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-1.5 font-mono">Filter Name</label>
                <input
                  type="text"
                  placeholder="name contains..."
                  className="w-full bg-white border-2 border-black py-2 px-2.5 text-xs font-bold uppercase outline-none"
                  value={userFilters.name}
                  onChange={(e) => setUserFilters(prev => ({ ...prev, name: e.target.value }))}
                  id="filter_user_name"
                />
              </div>

              {/* Filter 2: Email */}
              <div>
                <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-1.5 font-mono">Filter Email</label>
                <input
                  type="text"
                  placeholder="email contains..."
                  className="w-full bg-white border-2 border-black py-2 px-2.5 text-xs font-bold uppercase outline-none"
                  value={userFilters.email}
                  onChange={(e) => setUserFilters(prev => ({ ...prev, email: e.target.value }))}
                  id="filter_user_email"
                />
              </div>

              {/* Filter 3: Address */}
              <div>
                <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-1.5 font-mono">Filter Address</label>
                <input
                  type="text"
                  placeholder="address contains..."
                  className="w-full bg-white border-2 border-black py-2 px-2.5 text-xs font-bold uppercase outline-none"
                  value={userFilters.address}
                  onChange={(e) => setUserFilters(prev => ({ ...prev, address: e.target.value }))}
                  id="filter_user_address"
                />
              </div>

              {/* Filter 4: Role */}
              <div>
                <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-1.5 font-mono">Filter Role</label>
                <select
                  value={userFilters.role}
                  onChange={(e) => setUserFilters(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full bg-white border-2 border-black py-2.5 px-2.5 text-xs font-bold uppercase outline-none cursor-pointer"
                  id="filter_user_role"
                >
                  <option value="">All Roles</option>
                  <option value={UserRole.ADMIN}>ADMIN (System Administrator)</option>
                  <option value={UserRole.OWNER}>OWNER (Store Merchant)</option>
                  <option value={UserRole.USER}>USER (Customer Reviewer)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table list */}
          {usersLoading ? (
            <div className="text-center py-20 bg-white" id="users_table_loader">
              <RefreshCw className="w-10 h-10 mx-auto text-black animate-spin" />
              <p className="text-xs text-black font-mono font-black uppercase mt-4">Sifting users ledger...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-20 p-8" id="users_table_empty">
              <ListFilter className="w-12 h-12 mx-auto text-black mb-3" />
              <p className="text-xs text-black font-mono font-bold uppercase tracking-wider">No registered users match specified query guidelines.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse" id="admin_users_table">
                <thead>
                  <tr className="bg-zinc-100 border-b-2 border-black text-[10px] font-mono tracking-widest font-black text-black uppercase select-none">
                    <th className="py-3.5 px-6 cursor-pointer hover:bg-zinc-200 border-r border-black/10" onClick={() => handleUserSort("name")}>
                      <div className="flex items-center gap-1.5">
                        Name <ArrowUpDown className="w-3.5 h-3.5 text-black" />
                      </div>
                    </th>
                    <th className="py-3.5 px-6 cursor-pointer hover:bg-zinc-200 border-r border-black/10" onClick={() => handleUserSort("email")}>
                      <div className="flex items-center gap-1.5">
                        Security Email <ArrowUpDown className="w-3.5 h-3.5 text-black" />
                      </div>
                    </th>
                    <th className="py-3.5 px-6 cursor-pointer hover:bg-zinc-200 border-r border-black/10" onClick={() => handleUserSort("address")}>
                      <div className="flex items-center gap-1.5">
                        Physical Address <ArrowUpDown className="w-3.5 h-3.5 text-black" />
                      </div>
                    </th>
                    <th className="py-3.5 px-6 cursor-pointer hover:bg-zinc-200 border-r border-black/10" onClick={() => handleUserSort("role")}>
                      <div className="flex items-center gap-1.5">
                        Ecosystem Role <ArrowUpDown className="w-3.5 h-3.5 text-black" />
                      </div>
                    </th>
                    <th className="py-3.5 px-6 text-right font-black tracking-widest">Audit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/10 text-xs">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="py-3.5 px-6 font-black text-black uppercase font-display border-r border-black/5">{u.name}</td>
                      <td className="py-3.5 px-6 font-mono font-bold text-black border-r border-black/5">{u.email}</td>
                      <td className="py-3.5 px-6 max-w-xs truncate text-black/75 font-semibold border-r border-black/5" title={u.address}>{u.address}</td>
                      <td className="py-3.5 px-6 border-r border-black/5">
                        <span className={`inline-flex items-center px-2 py-0.5 border-2 border-black font-extrabold font-mono text-[9px] uppercase rounded-none ${u.role === UserRole.ADMIN ? "bg-purple-200 text-black border-black" : u.role === UserRole.OWNER ? "bg-amber-100 text-black border-black" : "bg-emerald-100 text-black border-black"}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <button
                          onClick={() => setSelectedProfile(u)}
                          className="py-1 px-2.5 bg-white border-2 border-black text-[10px] text-black font-black uppercase tracking-wider rounded-none cursor-pointer hover:bg-black hover:text-white transition-all"
                          id={`btn_inspect_user_${u.id}`}
                        >
                          Inspect File
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="p-4 bg-zinc-100 border-t-2 border-black font-mono font-bold uppercase text-[10px] text-black/60 flex justify-between items-center">
            <span>Total: {users.length} user files found</span>
            {userSort.field ? (
              <span>Auditing order: {userSort.field.toUpperCase()} ({userSort.order === "asc" ? "ASCENDING" : "DESCENDING"})</span>
            ) : null}
          </div>
        </div>
      )}

      {/* Sub Tab: Audit Stores with individual review evaluation details */}
      {activeSubTab === "stores" && (
        <div className="bg-white border-2 border-black rounded-none shadow-[4px_4px_0px_0px_#000000] overflow-hidden" id="panel_admin_stores">
          <div className="p-6 border-b-2 border-black bg-zinc-50">
            <h3 className="text-sm font-black tracking-widest text-black uppercase font-mono">Store listings & quality ratings</h3>
            <p className="text-[11px] text-black/60 font-bold uppercase tracking-wider font-mono">Examine ratings counts, review average scores, and inspect store reviews</p>
          </div>

          {storesLoading ? (
            <div className="text-center py-20 bg-white" id="stores_list_loader">
              <RefreshCw className="w-10 h-10 mx-auto text-black animate-spin" />
              <p className="text-xs text-black font-mono font-black uppercase mt-4">Aggregating store storefront statistics...</p>
            </div>
          ) : stores.length === 0 ? (
            <div className="text-center py-20 p-8" id="stores_list_empty">
              <StoreIcon className="w-12 h-12 mx-auto text-black mb-3" />
              <p className="text-xs text-black font-mono font-bold uppercase tracking-wider">No active storefront profiles found in database.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse" id="admin_stores_table">
                <thead>
                  <tr className="bg-zinc-100 border-b-2 border-black text-[10px] font-mono tracking-widest font-black text-black uppercase">
                    <th className="py-3.5 px-6 border-r border-black/10">Store Title</th>
                    <th className="py-3.5 px-6 border-r border-black/10">Feedback Contact</th>
                    <th className="py-3.5 px-6 border-r border-black/10">Physical Coordinates</th>
                    <th className="py-3.5 px-6 text-center border-r border-black/10">Score Avg</th>
                    <th className="py-3.5 px-6 text-center border-r border-black/10">Reviews Logged</th>
                    <th className="py-3.5 px-6 text-right font-black tracking-widest font-mono">Audits</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/10 text-xs">
                  {stores.map((s) => (
                    <tr key={s.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="py-3.5 px-6 font-black text-black uppercase font-display border-r border-black/5">{s.name}</td>
                      <td className="py-3.5 px-6 font-mono font-bold text-black border-r border-black/5">{s.email}</td>
                      <td className="py-3.5 px-6 max-w-xs truncate text-black/75 font-semibold border-r border-black/5" title={s.address}>{s.address}</td>
                      <td className="py-3.5 px-6 text-center border-r border-black/5">
                        <span className="inline-flex items-center gap-0.5 bg-amber-100 text-black font-black font-mono px-2 py-0.5 border-2 border-black rounded-none">
                          <Star className="w-3.5 h-3.5 fill-black text-black" />
                          {s.averageRating > 0 ? s.averageRating : "N/A"}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-center font-mono font-black text-black border-r border-black/5 uppercase tracking-wide">{s.ratingsCount} feedlogs</td>
                      <td className="py-3.5 px-6 text-right">
                        <button
                          onClick={() => handleAuditStore(s)}
                          className="py-1 px-2.5 bg-black text-white hover:bg-white hover:text-black border-2 border-black text-[10px] font-black uppercase tracking-wider rounded-none cursor-pointer transition-all"
                          id={`btn_audit_store_${s.id}`}
                        >
                          Audit Reviews
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal Profile Info: Detailed User Information */}
      {selectedProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-none" id="user_profile_modal">
          <div className="bg-white max-w-sm w-full border-4 border-black p-6 rounded-none shadow-[8px_8px_0px_0px_#000000] relative text-center">
            <button
              onClick={() => setSelectedProfile(null)}
              className="absolute right-4 top-4 p-1 bg-white hover:bg-zinc-100 border-2 border-black text-black rounded-none cursor-pointer"
            >
              <X className="w-4 h-4 stroke-[2.5px]" />
            </button>

            <span className={`inline-flex px-3 py-1 border-2 border-black text-[9px] font-black font-mono uppercase mt-4 rounded-none ${selectedProfile.role === UserRole.ADMIN ? "bg-purple-200 text-black border-black" : selectedProfile.role === UserRole.OWNER ? "bg-amber-100 text-black border-black" : "bg-emerald-100 text-black border-black"}`}>
              {selectedProfile.role}
            </span>

            <h2 className="text-xl font-black tracking-tight text-black mt-3 leading-tight uppercase font-display">{selectedProfile.name}</h2>
            <p className="text-xs font-mono font-bold text-black/60 mt-1">{selectedProfile.email}</p>

            <div className="border-t-2 border-black my-4 pt-4 text-left space-y-3 text-xs">
              <div className="space-y-0.5">
                <div className="text-[9px] font-mono font-black uppercase text-black/50 tracking-wider">Unique File Identifier:</div>
                <div className="font-mono text-[10px] text-black font-bold select-all bg-zinc-100 p-1 border border-black">{selectedProfile.id}</div>
              </div>
              <div className="space-y-0.5">
                <div className="text-[9px] font-mono font-black uppercase text-text/50 text-black tracking-wider">Registered Coordinates Address:</div>
                <div className="text-black text-[11px] font-bold leading-relaxed">{selectedProfile.address}</div>
              </div>
              <div className="space-y-0.5 flex justify-between items-center text-[10px] text-black/55 font-mono font-black uppercase tracking-wide">
                <span>Created: {new Date(selectedProfile.createdAt).toLocaleDateString()}</span>
                <span>Updated: {new Date(selectedProfile.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
            
            <button
              onClick={() => setSelectedProfile(null)}
              className="w-full py-2 bg-black text-white hover:bg-white hover:text-black border-2 border-black text-xs font-black uppercase tracking-widest cursor-pointer"
            >
              Close Profile File
            </button>
          </div>
        </div>
      )}

      {/* Modal Reviews Audit popup */}
      {auditStoreDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-none" id="store_audit_modal">
          <div className="bg-white max-w-2xl w-full max-h-[80vh] flex flex-col border-4 border-black shadow-[8px_8px_0px_0px_#000000] overflow-hidden">
            {/* Header info */}
            <div className="p-6 border-b-4 border-black bg-zinc-100 flex justify-between items-start gap-4" id="store_audit_header">
              <div>
                <span className="text-[9px] font-mono uppercase tracking-widest text-black/55 font-black">Admin Review Quality Audit</span>
                <h2 className="text-xl font-black tracking-tight text-black uppercase font-display mt-0.5">{auditStoreDetail.name}</h2>
                <div className="mt-1 text-[11px] font-mono font-bold flex items-center gap-1">
                  <span>Cumulative Score:</span>
                  <span className="text-black font-black inline-flex items-center gap-0.5">
                    <Star className="w-3.5 h-3.5 fill-black text-black" /> {auditStoreDetail.averageRating} ({auditStoreDetail.ratingsCount} feedlogs)
                  </span>
                </div>
              </div>
              <button
                onClick={() => setAuditStoreDetail(null)}
                className="py-1 px-3 bg-white hover:bg-black border-2 border-black text-black hover:text-white rounded-none text-xs font-black uppercase tracking-wider cursor-pointer"
                id="btn_close_store_audit"
              >
                Close Audit
              </button>
            </div>

            {/* Scroll feed reviews list */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4 max-h-[50vh] bg-zinc-50" id="store_audit_scroll_container">
              <h3 className="text-xs font-black font-mono tracking-widest text-black/45 uppercase">Review Submission Feed history</h3>
              {auditLoading ? (
                <div className="text-center py-16" id="audit_reviews_loader">
                  <RefreshCw className="w-10 h-10 mx-auto text-black animate-spin" />
                  <p className="text-xs text-black font-mono font-black uppercase mt-4">Connecting audit logs...</p>
                </div>
              ) : auditFeedback.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed border-black/25">
                  <p className="text-xs text-black/50 font-mono uppercase font-black tracking-wider">No feedback logs found in database for this store.</p>
                </div>
              ) : (
                <div className="table-container space-y-4">
                  {auditFeedback.map((item) => (
                    <div key={item.id} className="p-4 bg-white border-2 border-black rounded-none space-y-3 text-xs shadow-sm">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="font-black text-black uppercase font-display">{item.userName}</div>
                          <div className="font-mono text-[10px] text-black/50 font-bold uppercase tracking-wider">ID: {item.userId} | Contact: {item.userEmail}</div>
                        </div>
                        <div className="flex bg-zinc-100 px-2 py-1 border-2 border-black items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((st) => (
                            <Star
                              key={st}
                              className={`w-3.5 h-3.5 ${st <= item.rating ? "text-black fill-black" : "text-black/10"}`}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="text-[11px] text-black font-semibold leading-relaxed flex items-center gap-1.5 bg-zinc-100 border border-black p-2">
                        <MapPin className="w-4 h-4 text-black shrink-0" />
                        <span>Address: {item.userAddress}</span>
                      </div>
                      <div className="text-[10px] text-black/50 font-mono font-bold uppercase tracking-wider text-right flex items-center justify-end gap-1">
                        <Calendar className="w-4 h-4 text-black/30" /> {new Date(item.createdAt).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
