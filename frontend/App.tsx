/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { UserRole } from "./types";
import { BrowseStores } from "./components/BrowseStores";
import { MyRatings } from "./components/MyRatings";
import { StoreOwnerDashboard } from "./components/StoreOwnerDashboard";
import { AdminConsole } from "./components/AdminConsole";
import { ChangePassword } from "./components/ChangePassword";
import { LoginModal } from "./components/LoginModal";
import { Store, Shield, User as UserIcon, Star, KeyRound, LogOut, Key, UserPlus2, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

function AppContent() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  
  // Tab selector state based on roles or guests
  const [activeTab, setActiveTab] = useState<string>("browse");

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 font-mono text-xs" id="app_global_loader">
        <div className="text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-slate-400 animate-spin mx-auto" />
          <p className="text-slate-500 font-semibold uppercase tracking-widest">Verifying profile tokens...</p>
        </div>
      </div>
    );
  }

  // Handle default tab selection on login state change
  const handleLoginSuccess = () => {
    if (user) {
      if (user.role === UserRole.ADMIN) {
        setActiveTab("admin");
      } else if (user.role === UserRole.OWNER) {
        setActiveTab("merchant");
      } else {
        setActiveTab("browse");
      }
    }
  };

  return (
    <div className="min-h-screen bg-white text-black flex flex-col justify-between selection:bg-black selection:text-white" id="main_app_layout">
      {/* Platform Header */}
      <header className="sticky top-0 z-30 bg-white border-b-2 border-black py-4 transition-all" id="global_header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Logo Brand layout */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab("browse")} id="app_brand_logo">
            <div className="bg-black text-white px-3 py-1 text-xl font-black tracking-tighter uppercase border-2 border-black select-none">
              STXR
            </div>
            <div>
              <span className="font-mono text-[9px] font-bold tracking-[0.2em] text-black/55 uppercase leading-none block">CHALLENGE CAPABILITY</span>
              <span className="font-display font-black text-black text-xl tracking-tighter uppercase block leading-tight">
                Store Rating Platform
              </span>
            </div>
          </div>

          {/* Navigation Controls */}
          <nav className="flex flex-wrap items-center gap-2" id="navigation_menu">
            {/* 1. Public Browse stores (always available) */}
            <button
              onClick={() => setActiveTab("browse")}
              className={`inline-flex items-center gap-1.5 py-2 px-3.5 border-2 border-black text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${activeTab === "browse" ? "bg-black text-white shadow-none" : "bg-white text-black hover:bg-black hover:text-white"}`}
              id="nav_btn_browse"
            >
              <Store className="w-3.5 h-3.5" /> Explore Stores
            </button>

            {/* 2. Logged in customer controls */}
            {isAuthenticated && user?.role === UserRole.USER && (
              <button
                onClick={() => setActiveTab("ratings")}
                className={`inline-flex items-center gap-1.5 py-2 px-3.5 border-2 border-black text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${activeTab === "ratings" ? "bg-black text-white shadow-none" : "bg-white text-black hover:bg-black hover:text-white"}`}
                id="nav_btn_my_ratings"
              >
                <Star className="w-3.5 h-3.5" /> My Rated Ledger
              </button>
            )}

            {/* 3. Store Owner stats controls */}
            {isAuthenticated && user?.role === UserRole.OWNER && (
              <button
                onClick={() => setActiveTab("merchant")}
                className={`inline-flex items-center gap-1.5 py-2 px-3.5 border-2 border-black text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${activeTab === "merchant" ? "bg-black text-white shadow-none" : "bg-white text-black hover:bg-black hover:text-white"}`}
                id="nav_btn_merchant"
              >
                <Shield className="w-3.5 h-3.5" /> Merchant Dashboard
              </button>
            )}

            {/* 4. Administrator security console controls */}
            {isAuthenticated && user?.role === UserRole.ADMIN && (
              <button
                onClick={() => setActiveTab("admin")}
                className={`inline-flex items-center gap-1.5 py-2 px-3.5 border-2 border-black text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${activeTab === "admin" ? "bg-black text-white shadow-none" : "bg-white text-black hover:bg-black hover:text-white"}`}
                id="nav_btn_admin"
              >
                <Shield className="w-3.5 h-3.5" /> Admin Control Tower
              </button>
            )}

            {/* 5. Common credential rotation link */}
            {isAuthenticated && (
              <button
                onClick={() => setActiveTab("password")}
                className={`inline-flex items-center gap-1.5 py-2 px-3.5 border-2 border-black text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${activeTab === "password" ? "bg-black text-white shadow-none" : "bg-white text-black hover:bg-black hover:text-white"}`}
                id="nav_btn_password"
              >
                <KeyRound className="w-3.5 h-3.5" /> Password Menu
              </button>
            )}

            {/* 6. Guest Auth Option */}
            {!isAuthenticated ? (
              <div className="flex gap-2 pl-2 border-l-2 border-black">
                <button
                  onClick={() => setActiveTab("login")}
                  className={`inline-flex items-center gap-1.5 py-2 px-3 border-2 border-black text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${activeTab === "login" ? "bg-black text-white" : "bg-white text-black hover:bg-black hover:text-white"}`}
                  id="nav_btn_login"
                >
                  <Key className="w-3.5 h-3.5" /> Sign In
                </button>
                <button
                  onClick={() => setActiveTab("signup")}
                  className={`inline-flex items-center gap-1.5 py-2 px-3 border-2 border-black text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${activeTab === "signup" ? "bg-black text-white" : "bg-white text-black hover:bg-black hover:text-white"}`}
                  id="nav_btn_signup"
                >
                  <UserPlus2 className="w-3.5 h-3.5" /> Join Today
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  logout();
                  setActiveTab("browse");
                }}
                className="inline-flex items-center gap-1.5 py-2 px-3 bg-white hover:bg-black hover:text-white border-2 border-black text-black text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
                id="nav_btn_logout"
              >
                <LogOut className="w-3.5 h-3.5" /> Exit
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* User Scoped Identity Card (Inline ribbon display on authorization) */}
      {isAuthenticated && user && (
        <div className="bg-black text-white border-b-2 border-black py-2.5 px-4" id="ribbon_identity">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-center justify-between text-xs font-bold tracking-[0.1em] uppercase font-mono gap-2">
            <div className="flex items-center gap-2">
              <UserIcon className="w-3.5 h-3.5 text-white/70" />
              <span>Signed in as: <span className="font-sans font-black text-white">{user.name}</span></span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-4">
              <span>Coordinates: <span className="text-white/80 font-sans tracking-normal">{user.address}</span></span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-none text-[10px] font-black uppercase border-2 bg-white text-black border-white select-none">
                {user.role}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Primary Dashboard Content Area */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 flex-1">
        <AnimatePresence mode="wait">
          {activeTab === "browse" && (
            <div key="browse" id="view_browse_tab">
              <BrowseStores />
            </div>
          )}

          {activeTab === "ratings" && isAuthenticated && user?.role === UserRole.USER && (
            <div key="ratings" id="view_ratings_tab">
              <MyRatings />
            </div>
          )}

          {activeTab === "merchant" && isAuthenticated && user?.role === UserRole.OWNER && (
            <div key="merchant" id="view_merchant_tab">
              <StoreOwnerDashboard />
            </div>
          )}

          {activeTab === "admin" && isAuthenticated && user?.role === UserRole.ADMIN && (
            <div key="admin" id="view_admin_tab">
              <AdminConsole />
            </div>
          )}

          {activeTab === "password" && isAuthenticated && (
            <div key="password" id="view_password_tab">
              <ChangePassword />
            </div>
          )}

          {activeTab === "login" && !isAuthenticated && (
            <div key="login" id="view_login_tab">
              <LoginModal onSuccess={handleLoginSuccess} initialTab="login" />
            </div>
          )}

          {activeTab === "signup" && !isAuthenticated && (
            <div key="signup" id="view_signup_tab">
              <LoginModal onSuccess={handleLoginSuccess} initialTab="register" />
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
