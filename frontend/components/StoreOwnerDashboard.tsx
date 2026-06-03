/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Store, UserRole } from "../types";
import { Star, Store as StoreIcon, Users, MessageSquareCode, Sparkles, RefreshCw, ArrowUpDown, ChevronDown, Calendar, Search } from "lucide-react";

interface FeedbackExtended {
  id: string;
  rating: number;
  createdAt: string;
  userId: string;
  userName: string;
  userEmail: string;
  userAddress: string;
}

interface CustomStoreWithAvg extends Store {
  averageRating: number;
  ratingsCount: number;
}

export const StoreOwnerDashboard: React.FC = () => {
  const { user, apiFetch } = useAuth();
  
  const [stores, setStores] = useState<CustomStoreWithAvg[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>("");
  const [feedback, setFeedback] = useState<FeedbackExtended[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  // Sorting state for table
  const [sortBy, setSortBy] = useState<keyof FeedbackExtended | "">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Filtering reviews table
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (user) {
      loadOwnerStores();
    }
  }, [user]);

  useEffect(() => {
    if (selectedStoreId) {
      loadStoreFeedback(selectedStoreId);
    }
  }, [selectedStoreId]);

  const loadOwnerStores = async () => {
    setLoading(true);
    try {
      // Find stores managed by this owner ID
      const res = await apiFetch(`/api/stores?ownerId=${user?.id}`);
      if (res.ok) {
        const data: CustomStoreWithAvg[] = await res.json();
        setStores(data);
        if (data.length > 0) {
          setSelectedStoreId(data[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load stores for owner", err);
    } finally {
      setLoading(false);
    }
  };

  const loadStoreFeedback = async (storeId: string) => {
    setFeedbackLoading(true);
    try {
      const res = await apiFetch(`/api/stores/${storeId}`);
      if (res.ok) {
        const data = await res.json();
        setFeedback(data.feedback || []);
        
        // Synchronise average rating / count in stores array with latest response
        setStores(prev => prev.map(s => s.id === storeId ? { ...s, averageRating: data.averageRating, ratingsCount: data.ratingsCount } : s));
      }
    } catch (err) {
      console.error("Failed load store feedback detail", err);
    } finally {
      setFeedbackLoading(false);
    }
  };

  // Switch managed stores
  const handleStoreChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedStoreId(e.target.value);
  };

  const activeStore = stores.find(s => s.id === selectedStoreId);

  // Sorting Function
  const handleSort = (column: keyof FeedbackExtended) => {
    if (sortBy === column) {
      setSortOrder(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  // Filter and Sort Table Reviews
  const filteredFeedback = feedback.filter(item => {
    const q = searchQuery.toLowerCase();
    return (
      item.userName.toLowerCase().includes(q) ||
      item.userEmail.toLowerCase().includes(q) ||
      item.userAddress.toLowerCase().includes(q)
    );
  });

  const sortedFeedback = [...filteredFeedback].sort((a: any, b: any) => {
    if (!sortBy) return 0;
    
    let valA = a[sortBy];
    let valB = b[sortBy];

    if (typeof valA === "string") valA = valA.toLowerCase();
    if (typeof valB === "string") valB = valB.toLowerCase();

    const order = sortOrder === "desc" ? -1 : 1;
    if (valA < valB) return -1 * order;
    if (valA > valB) return 1 * order;
    return 0;
  });

  // Calculate Average score across all reviews
  const overallAvg = activeStore ? activeStore.averageRating : 0;
  const overallCount = activeStore ? activeStore.ratingsCount : 0;

  return (
    <div className="space-y-6 selection:bg-black selection:text-white text-black">
      {/* Greetings banner */}
      <div className="bg-black text-white p-8 md:p-12 border-2 border-black flex flex-col md:flex-row justify-between items-start md:items-center gap-6 rounded-none shadow-[4px_4px_0px_0px_#000000]" id="owner_welcome_banner">
        <div className="space-y-2">
          <span className="text-xs font-mono tracking-[0.3em] text-white/50 font-bold uppercase block">Merchant Headquarters</span>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tighter leading-none uppercase font-display">Merchant Business Central</h1>
          <p className="text-xs text-white/60 max-w-md mt-1 leading-relaxed font-sans">
            Welcome back, <span className="font-extrabold text-white">{user?.name}</span>. Audit user scores, map merchant reviews, and inspect customer profiles securely.
          </p>
        </div>

        {/* Store select picker */}
        {stores.length > 0 ? (
          <div className="bg-zinc-900 border-2 border-zinc-800 p-4 rounded-none space-y-1.5 min-w-[240px]">
            <label className="block text-[10px] font-black font-mono text-white/50 uppercase tracking-widest">Active Business View:</label>
            <div className="relative">
              <select
                value={selectedStoreId}
                onChange={handleStoreChange}
                className="w-full bg-black text-xs text-white border-2 border-white py-2 px-3 pr-8 rounded-none outline-none appearance-none font-black uppercase transition-all cursor-pointer focus:bg-zinc-900"
                id="select_store_owner_active"
              >
                {stores.map(s => (
                  <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-2.5 w-4 h-4 text-white pointer-events-none" />
            </div>
          </div>
        ) : null}
      </div>

      {loading ? (
        <div className="text-center py-20 bg-white border-2 border-black rounded-none shadow-[4px_4px_0px_0px_#000000]" id="owner_main_loader">
          <RefreshCw className="w-10 h-10 mx-auto text-black animate-spin" />
          <p className="text-xs text-black font-mono font-black uppercase tracking-widest mt-4">Summoning business metrics...</p>
        </div>
      ) : stores.length === 0 ? (
        <div className="text-center py-20 bg-white border-2 border-black rounded-none p-8 shadow-[4px_4px_0px_0px_#000000]" id="owner_empty_merchant">
          <StoreIcon className="w-12 h-12 mx-auto text-black mb-3" />
          <h3 className="text-base font-black text-black uppercase tracking-wider font-display">No Affiliated Stores Linked</h3>
          <p className="text-xs text-black/60 mt-2 max-w-sm mx-auto">
            Your merchant profile has not been assigned as an owner to any registered business yet. Please contact the platform Admin to hook up your store.
          </p>
        </div>
      ) : (
        <div className="space-y-6" id="owner_dashboard_view">
          {/* Statistical layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Metric 1: Average Rating Score */}
            <div className="bg-white border-2 border-black p-6 rounded-none hover:shadow-[4px_4px_0px_0px_#000000] transition-all flex items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-black tracking-widest text-black/50 uppercase">Average Rating Score</span>
                <div className="text-3xl sm:text-4xl font-black text-black flex items-baseline gap-1 font-display uppercase italic">
                  {overallAvg}
                  <span className="text-xs text-black/50 font-bold uppercase tracking-wide">/ 5.0 Stars</span>
                </div>
                <div className="flex items-center gap-0.5 mt-2">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const roundedAvg = Math.round(overallAvg);
                    return (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${star <= roundedAvg ? "text-amber-500 fill-amber-500" : "text-zinc-200"}`}
                      />
                    );
                  })}
                </div>
              </div>
              <div className="p-4 bg-zinc-100 border-2 border-black rounded-none text-black shrink-0">
                <Sparkles className="w-8 h-8" />
              </div>
            </div>

            {/* Metric 2: Total feedback count */}
            <div className="bg-white border-2 border-black p-6 rounded-none hover:shadow-[4px_4px_0px_0px_#000000] transition-all flex items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-black tracking-widest text-black/50 uppercase">Total Ratings Logged</span>
                <div className="text-3xl sm:text-4xl font-black text-black font-display uppercase italic">
                  {overallCount}
                  <span className="text-xs text-black/50 font-bold uppercase tracking-wide"> feed logs</span>
                </div>
                <p className="text-[9px] text-black/45 font-mono uppercase tracking-wide font-black mt-2">All ratings are verified using secure client tokens</p>
              </div>
              <div className="p-4 bg-zinc-100 border-2 border-black rounded-none text-black shrink-0">
                <Users className="w-8 h-8" />
              </div>
            </div>
          </div>

          {/* Customer Reviews Ledgers lists */}
          <div className="bg-white border-2 border-black rounded-none shadow-[4px_4px_0px_0px_#000000] overflow-hidden" id="customers_feedback_panel">
            <div className="p-6 border-b-2 border-black bg-zinc-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-black tracking-widest text-black uppercase font-mono">Customers Who Rated Store</h3>
                <p className="text-[11px] text-black/60 mt-0.5 font-bold uppercase tracking-wider font-mono">Physical home coordinates, email, and rating history breakdown</p>
              </div>
              {/* Live search input specifically for the reviews layout */}
              <div className="relative max-w-sm w-full">
                <Search className="absolute left-3 top-3.5 w-4 h-4 text-black" />
                <input
                  type="text"
                  placeholder="Filter name, email, or address..."
                  className="w-full pl-9 pr-4 py-3 bg-white border-2 border-black text-xs font-bold outline-none rounded-none transition-all focus:bg-zinc-50 hover:bg-zinc-50"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  id="search_owner_customer_reviews"
                />
              </div>
            </div>

            {/* Table layout */}
            {feedbackLoading ? (
              <div className="text-center py-16" id="feedback_table_loader">
                <RefreshCw className="w-6 h-6 mx-auto text-black animate-spin" />
                <p className="text-xs text-black font-mono font-black uppercase mt-2">Compiling customer table...</p>
              </div>
            ) : sortedFeedback.length === 0 ? (
              <div className="text-center py-12 p-8" id="feedback_table_empty">
                <MessageSquareCode className="w-8 h-8 mx-auto text-black mb-2" />
                <p className="text-xs text-black font-mono font-bold uppercase tracking-wider max-w-sm mx-auto">
                  No verified customer ratings found matching your search.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse" id="owner_feedback_table">
                  <thead>
                    <tr className="bg-zinc-100 border-b-2 border-black text-[10px] font-mono tracking-widest font-black text-black uppercase">
                      <th className="py-3.5 px-6 select-none cursor-pointer hover:bg-zinc-200 border-r border-black/10" onClick={() => handleSort("userName")}>
                        <div className="flex items-center gap-1.5">
                          Customer Name <ArrowUpDown className="w-3.5 h-3.5 text-black" />
                        </div>
                      </th>
                      <th className="py-3.5 px-6 select-none cursor-pointer hover:bg-zinc-200 border-r border-black/10" onClick={() => handleSort("userEmail")}>
                        <div className="flex items-center gap-1.5">
                          Verified Email <ArrowUpDown className="w-3.5 h-3.5 text-black" />
                        </div>
                      </th>
                      <th className="py-3.5 px-6 select-none cursor-pointer hover:bg-zinc-200 border-r border-black/10" onClick={() => handleSort("userAddress")}>
                        <div className="flex items-center gap-1.5">
                          Home Address <ArrowUpDown className="w-3.5 h-3.5 text-black" />
                        </div>
                      </th>
                      <th className="py-3.5 px-6 select-none cursor-pointer hover:bg-zinc-200 border-r border-black/10" onClick={() => handleSort("rating")}>
                        <div className="flex items-center gap-1.5">
                          Score <ArrowUpDown className="w-3.5 h-3.5 text-black" />
                        </div>
                      </th>
                      <th className="py-3.5 px-6 select-none cursor-pointer hover:bg-zinc-200" onClick={() => handleSort("createdAt")}>
                        <div className="flex items-center gap-1.5">
                          Rating Date <ArrowUpDown className="w-3.5 h-3.5 text-black" />
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/10 text-xs">
                    {sortedFeedback.map((item) => (
                      <tr key={item.id} className="hover:bg-zinc-50 transition-colors">
                        <td className="py-3.5 px-6 font-black text-black uppercase font-display border-r border-black/5">{item.userName}</td>
                        <td className="py-3.5 px-6 font-mono font-bold text-black border-r border-black/5">{item.userEmail}</td>
                        <td className="py-3.5 px-6 max-w-[280px] text-black/75 font-semibold truncate border-r border-black/5" title={item.userAddress}>
                          {item.userAddress}
                        </td>
                        <td className="py-3.5 px-6 border-r border-black/5">
                          <div className="flex items-center gap-0.5" title={`${item.rating}/5 stars`}>
                            {[1, 2, 3, 4, 5].map((st) => (
                              <Star
                                key={st}
                                className={`w-3.5 h-3.5 ${st <= item.rating ? "text-amber-500 fill-amber-500" : "text-zinc-200"}`}
                              />
                            ))}
                          </div>
                        </td>
                        <td className="py-3.5 px-6 font-mono text-black/60 font-bold uppercase flex items-center gap-1.5 mt-0.5">
                          <Calendar className="w-3.5 h-3.5 text-black" />
                          {new Date(item.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="p-4 bg-zinc-100 border-t-2 border-black font-mono font-bold uppercase text-[10px] text-black/60 flex justify-between">
              <span>Displaying {sortedFeedback.length} rating logs</span>
              {sortBy ? (
                <span>Sorted by {String(sortBy).toUpperCase()} ({sortOrder === "asc" ? "ASCENDING" : "DESCENDING"})</span>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
