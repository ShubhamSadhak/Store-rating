/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Store, Rating, UserRole } from "../types";
import { Search, MapPin, Inbox, Star, MessageSquarePlus, RefreshCw, X, Check, Calendar, ArrowUpDown } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface EnhancedStore extends Store {
  averageRating: number;
  ratingsCount: number;
}

interface FeedbackLog {
  id: string;
  rating: number;
  createdAt: string;
  userName: string;
  userEmail: string;
}

export const BrowseStores: React.FC = () => {
  const { user, apiFetch } = useAuth();
  
  const [stores, setStores] = useState<EnhancedStore[]>([]);
  const [userRatings, setUserRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Sorting state
  const [searchQuery, setSearchQuery] = useState("");
  const [addressQuery, setAddressQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "rating">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Selected store detail for rating history modal
  const [selectedStore, setSelectedStore] = useState<EnhancedStore | null>(null);
  const [storeFeedback, setStoreFeedback] = useState<FeedbackLog[]>([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  // Rating Submit states
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [ratingInput, setRatingInput] = useState<number>(5);
  const [toastMsg, setToastMsg] = useState<{ text: string; isError: boolean } | null>(null);

  useEffect(() => {
    fetchStores();
    if (user && user.role === UserRole.USER) {
      fetchUserRatings();
    }
  }, [user]);

  const fetchStores = async () => {
    setLoading(true);
    try {
      const url = `/api/stores?search=${encodeURIComponent(searchQuery)}&address=${encodeURIComponent(addressQuery)}`;
      const res = await apiFetch(url);
      if (res.ok) {
        const data: EnhancedStore[] = await res.json();
        setStores(data);
      }
    } catch (err) {
      console.error("Failed to load stores", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserRatings = async () => {
    if (!user) return;
    try {
      const res = await apiFetch(`/api/ratings?userId=${user.id}`);
      if (res.ok) {
        const data: Rating[] = await res.json();
        setUserRatings(data);
      }
    } catch (err) {
      console.error("Failed to load user ratings", err);
    }
  };

  const triggerToast = (text: string, isError = false) => {
    setToastMsg({ text, isError });
    setTimeout(() => {
      setToastMsg(null);
    }, 4000);
  };

  const handleSearchReset = () => {
    setSearchQuery("");
    setAddressQuery("");
    setTimeout(() => fetchStores(), 50);
  };

  // View store audits and feedback logs
  const handleViewStoreDetails = async (store: EnhancedStore) => {
    setSelectedStore(store);
    setStoreFeedback([]);
    setFeedbackLoading(true);

    try {
      const res = await apiFetch(`/api/stores/${store.id}`);
      if (res.ok) {
        const data = await res.json();
        setStoreFeedback(data.feedback || []);
        // Match live ratings with latest state
        if (data.averageRating !== undefined) {
          setSelectedStore(prev => prev ? { ...prev, averageRating: data.averageRating, ratingsCount: data.ratingsCount } : null);
        }
      }
    } catch (err) {
      console.error("Failed loading store feed details", err);
    } finally {
      setFeedbackLoading(false);
    }
  };

  // Submit Rating Score (1-5) via POST or PUT
  const handleSubmitRating = async (storeId: string, score: number) => {
    if (!user || user.role !== UserRole.USER) {
      triggerToast("Access Denied: Only registered normal customer accounts can submit feedback", true);
      return;
    }

    setIsSubmittingRating(true);
    const existingRating = userRatings.find(r => r.storeId === storeId);

    try {
      let response;
      if (existingRating) {
        // Run PUT to update rating
        response = await apiFetch(`/api/ratings/${existingRating.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rating: score })
        });
      } else {
        // Run POST to submit new rating
        response = await apiFetch("/api/ratings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ storeId, rating: score })
        });
      }

      const resData = await response.json();
      if (response.ok) {
        triggerToast(existingRating ? "Your store rating was updated successfully!" : "Thank you! Rating submitted successfully!");
        fetchUserRatings();
        fetchStores();
        // Update selectedStore live modal averages if active
        if (selectedStore && selectedStore.id === storeId) {
          setTimeout(() => handleViewStoreDetails(selectedStore), 100);
        }
      } else {
        triggerToast(resData.error || "Submission error.", true);
      }
    } catch (err) {
      triggerToast("Failed to link rating network.", true);
    } finally {
      setIsSubmittingRating(false);
    }
  };

  // Process sorting on current store listings array
  const sortedStores = [...stores].sort((a, b) => {
    const valA = sortBy === "rating" ? a.averageRating : a.name.toLowerCase();
    const valB = sortBy === "rating" ? b.averageRating : b.name.toLowerCase();

    const order = sortOrder === "desc" ? -1 : 1;
    if (valA < valB) return -1 * order;
    if (valA > valB) return 1 * order;
    return 0;
  });

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === "asc" ? "desc" : "asc");
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-6 right-6 z-50 p-4 rounded-xl shadow-lg border text-xs font-semibold flex items-center gap-2 max-w-sm ${toastMsg.isError ? "bg-rose-50 border-rose-100 text-rose-700" : "bg-emerald-50 border-emerald-100 text-emerald-800"}`}
            id="toast_message_banner"
          >
            {toastMsg.isError ? <X className="w-4 h-4 shrink-0" /> : <Check className="w-4 h-4 shrink-0" />}
            <span>{toastMsg.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <div className="bg-black text-white p-8 md:p-12 border-2 border-black flex flex-col md:flex-row justify-between items-start md:items-end gap-6 selection:bg-white selection:text-black" id="hero_header_container">
        <div className="space-y-3">
          <span className="text-xs font-mono tracking-[0.3em] text-white/50 font-bold uppercase block">Platform Index</span>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tighter leading-none uppercase font-display">
            Discover Stores
          </h1>
          <p className="text-xs font-bold tracking-[0.2em] uppercase text-white/60">
            Real-time feed, client-side filters & cumulated reviews
          </p>
        </div>
        <div className="flex gap-8 border-l-2 border-white/20 pl-6 text-left shrink-0">
          <div className="space-y-1">
            <div className="text-4xl sm:text-5xl font-black tracking-tighter italic">{stores.length}</div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-white/50">Total Stores</div>
          </div>
          <div className="space-y-1">
            <div className="text-4xl sm:text-5xl font-black tracking-tighter italic">
              {stores.reduce((acc, current) => acc + (current.ratingsCount || 0), 0)}
            </div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-white/50">Total Ratings</div>
          </div>
        </div>
      </div>

      {/* Explore Filters */}
      <div className="bg-white border-2 border-black p-6 space-y-4" id="store_filters_box">
        <div className="text-xs font-black tracking-[0.15em] text-black uppercase font-mono mb-2">Search and Refine Stores</div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Query Name */}
          <div>
            <label className="block text-[11px] font-black text-black uppercase tracking-wider mb-1.5 font-mono">Store Name</label>
            <div className="relative">
              <Search className="absolute left-3 top-3.5 text-black w-4 h-4" />
              <input
                type="text"
                placeholder="e.g. Fresh Organic Market..."
                className="w-full pl-9 pr-4 py-3 bg-white hover:bg-zinc-50 focus:bg-zinc-50 text-xs font-bold border-2 border-black rounded-none outline-none transition-all placeholder:text-zinc-400"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                id="search_store_name"
              />
            </div>
          </div>

          {/* Query Address */}
          <div>
            <label className="block text-[11px] font-black text-black uppercase tracking-wider mb-1.5 font-mono">Location Address</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3.5 text-black w-4 h-4" />
              <input
                type="text"
                    placeholder="e.g. Mumbai, Bengaluru..."
                className="w-full pl-9 pr-4 py-3 bg-white hover:bg-zinc-50 focus:bg-zinc-50 text-xs font-bold border-2 border-black rounded-none outline-none transition-all placeholder:text-zinc-400"
                value={addressQuery}
                onChange={(e) => setAddressQuery(e.target.value)}
                id="search_store_address"
              />
            </div>
          </div>

          {/* Action buttons and sorting logic */}
          <div className="flex items-end gap-3">
            <button
              onClick={fetchStores}
              className="flex-1 py-3 bg-black hover:bg-white hover:text-black border-2 border-black text-white font-black uppercase tracking-widest text-xs rounded-none transition-all cursor-pointer active:translate-x-[1px] active:translate-y-[1px]"
              id="btn_apply_search"
            >
              Analyze Directory
            </button>
            <button
              onClick={handleSearchReset}
              className="px-4 py-3 bg-white hover:bg-black hover:text-white border-2 border-black text-black font-black uppercase tracking-wider text-xs rounded-none transition-all cursor-pointer"
              title="Reset Filters"
              id="btn_reset_search"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Extra Sorting & Stats summary */}
        <div className="border-t-2 border-black pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-black">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[10px] uppercase font-black tracking-[0.2em] text-black">Sort By:</span>
            <button
              onClick={() => setSortBy("name")}
              className={`px-3 py-1.5 border-2 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer rounded-none ${sortBy === "name" ? "border-black bg-black text-white" : "border-black bg-white text-black hover:bg-black hover:text-white"}`}
              id="sort_by_name"
            >
              Merchant Name
            </button>
            <button
              onClick={() => setSortBy("rating")}
              className={`px-3 py-1.5 border-2 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer rounded-none ${sortBy === "rating" ? "border-black bg-black text-white" : "border-black bg-white text-black hover:bg-black hover:text-white"}`}
              id="sort_by_rating"
            >
              Store Rating
            </button>
            <button
              onClick={toggleSortOrder}
              className="p-1.5 text-black bg-white hover:bg-black hover:text-white border-2 border-black rounded-none transition-all cursor-pointer ml-1"
              title={`Toggle ${sortOrder === "asc" ? "Descending" : "Ascending"}`}
              id="toggle_sort_direction"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="font-mono text-[10px] text-black uppercase tracking-widest font-black">
            MATCHING DIR RESULTS: <span className="font-display font-black text-xs block sm:inline">{stores.length} STOREFRONTS</span>
          </div>
        </div>
      </div>

      {/* Grid listing */}
      {loading ? (
        <div className="text-center py-20 bg-white border-2 border-black rounded-none shadow-[4px_4px_0px_0px_#000000]" id="store_loader_container">
          <RefreshCw className="w-10 h-10 mx-auto text-black animate-spin" />
          <p className="text-xs text-black font-mono font-black uppercase tracking-widest mt-4">Sifting directories...</p>
        </div>
      ) : sortedStores.length === 0 ? (
        <div className="text-center py-20 bg-white border-2 border-black rounded-none p-8 shadow-[4px_4px_0px_0px_#000000]" id="store_empty_container">
          <Inbox className="w-12 h-12 mx-auto text-black mb-3" />
          <h3 className="text-base font-black text-black uppercase tracking-wider font-display">No Stores Detected</h3>
          <p className="text-xs text-black/60 mt-2 max-w-sm mx-auto">
            We couldn't locate any matching merchants. Try checking your keyword spellings or resetting filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in-50 duration-200" id="stores_grid_list">
          {sortedStores.slice(0, 1).map((store) => {
            const myRating = userRatings.find(r => r.storeId === store.id);

            return (
              <div
                key={store.id}
                className="bg-white border-2 border-black hover:bg-black hover:text-white p-6 transition-all flex flex-col justify-between rounded-none hover:shadow-[4px_4px_0px_0px_#000000] group"
                id={`store_card_${store.id}`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h3 className="font-black text-lg tracking-tight text-black group-hover:text-white font-display line-clamp-1 uppercase">
                      {store.name}
                    </h3>
                    <div className="flex items-center gap-1 bg-black text-white px-2.5 py-0.5 border border-black group-hover:bg-white group-hover:text-black font-mono text-[10px] font-black uppercase tracking-wide select-none">
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400 group-hover:fill-black group-hover:text-black" />
                      <span className="italic">{store.averageRating > 0 ? store.averageRating : "N/A"}</span>
                    </div>
                  </div>

                  <div className="space-y-2 mb-5">
                    <p className="text-xs text-black/60 group-hover:text-white/80 flex items-start gap-1 font-sans">
                      <MapPin className="w-3.5 h-3.5 text-black/40 group-hover:text-white/60 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{store.address}</span>
                    </p>
                    <p className="text-[11px] font-mono text-black/45 group-hover:text-white/60 flex items-center gap-1">
                      <span className="font-bold">EMAIL:</span>
                      <span className="text-black/85 group-hover:text-white line-clamp-1">{store.email}</span>
                    </p>
                  </div>
                </div>

                <div className="border-t-2 border-black/10 group-hover:border-white/10 pt-4">
                  {/* Reviews summary */}
                  <div className="flex items-center justify-between gap-2 mb-4 text-[11px] font-mono uppercase">
                    <span className="text-black/45 group-hover:text-white/60 font-bold">REVIEWS RECORD:</span>
                    <span className="font-extrabold text-black/80 group-hover:text-white">{store.ratingsCount} feedlogs</span>
                  </div>

                  {/* Personal Rating submissions indicator / controls */}
                  {user && user.role === UserRole.USER ? (
                    <div className="bg-zinc-50 group-hover:bg-zinc-900 group-hover:border-white/20 p-3 border border-black mb-4 text-xs text-black group-hover:text-white transition-all">
                      <div className="flex items-center justify-between gap-1 mb-2">
                        <span className="font-black text-black/60 group-hover:text-white/60 text-[10px] uppercase font-mono tracking-wider">Your rating score:</span>
                        {myRating ? (
                          <span className="inline-flex items-center gap-0.5 text-[9px] bg-black text-white px-2 py-0.5 border border-black group-hover:bg-white group-hover:text-black font-mono uppercase font-black select-none">
                            Rated
                          </span>
                        ) : (
                          <span className="text-[9px] text-black/45 group-hover:text-white/40 italic font-mono font-bold uppercase select-none">No score</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 justify-center py-1 bg-white group-hover:bg-black border border-black/10 p-1">
                        {[1, 2, 3, 4, 5].map((starVal) => {
                          const currentScore = myRating ? myRating.rating : 0;
                          return (
                            <button
                              key={starVal}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSubmitRating(store.id, starVal);
                              }}
                              className="p-1 hover:scale-125 transition-transform"
                              id={`rate_star_${store.id}_${starVal}`}
                              title={`Submit ${starVal} Star rating`}
                            >
                              <Star
                                className={`w-6 h-6 stroke-1.5 ${starVal <= currentScore ? "text-amber-500 fill-amber-500" : "text-zinc-200 group-hover:text-zinc-800 hover:text-amber-400"}`}
                              />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}

                  {/* Operational Details Button */}
                  <button
                    onClick={() => handleViewStoreDetails(store)}
                    className="w-full py-2 bg-white group-hover:bg-white text-black border-2 border-black hover:bg-black hover:text-white text-xs font-black uppercase tracking-wider text-center transition-all cursor-pointer rounded-none"
                    id={`btn_view_details_${store.id}`}
                  >
                    View Feedback Feed
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Store audit & feedback history Dialog */}
      {selectedStore && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm" id="store_details_dialog">
          <div className="bg-white max-w-2xl w-full border-2 border-black max-h-[85vh] flex flex-col shadow-[8px_8px_0px_0px_#000000] overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150 rounded-none text-black">
            {/* Header info */}
            <div className="p-6 border-b-2 border-black bg-zinc-50 flex justify-between items-start gap-4">
              <div>
                <span className="text-[10px] font-mono font-black uppercase tracking-[0.2em] text-black/50">Review Audit feed</span>
                <h2 className="text-2xl font-black tracking-tight text-black font-display mt-1 uppercase leading-none">{selectedStore.name}</h2>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs">
                  <span className="text-black/75 flex items-center gap-1 font-bold">
                    <MapPin className="w-3.5 h-3.5 text-black" /> {selectedStore.address}
                  </span>
                  <span className="font-mono text-black font-bold uppercase">
                    Average Score: <span className="font-sans font-black text-black text-xs inline-flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" /> {selectedStore.averageRating > 0 ? selectedStore.averageRating : "N/A"} ({selectedStore.ratingsCount} reviews)
                    </span>
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedStore(null)}
                className="py-1 px-3 bg-white border-2 border-black hover:bg-black hover:text-white text-black rounded-none text-xs font-black uppercase tracking-widest transition-all cursor-pointer mb-2"
                id="btn_close_details"
              >
                Close feed
              </button>
            </div>

            {/* Scrollable feed list */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4 max-h-[50vh]">
              <div className="text-xs font-black font-mono tracking-widest text-black uppercase">Customer feedback logs ({storeFeedback.length})</div>
              {feedbackLoading ? (
                <div className="text-center py-10" id="feedback_feed_loader">
                  <RefreshCw className="w-8 h-8 mx-auto text-black animate-spin" />
                  <p className="text-xs text-black font-mono font-black uppercase tracking-wider mt-3">Summoning reviews...</p>
                </div>
              ) : storeFeedback.length === 0 ? (
                <div className="text-center py-10 border-2 border-black border-dashed rounded-none bg-zinc-50" id="feedback_empty_container">
                  <Inbox className="w-10 h-10 mx-auto text-black mb-2" />
                  <p className="text-xs text-black font-mono font-bold uppercase tracking-wide">No customers have graded this establishment yet.</p>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {storeFeedback.map((review) => (
                    <div key={review.id} className="p-4 bg-zinc-50 hover:bg-black hover:text-white border-2 border-black rounded-none space-y-2 transition-all group/review">
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="text-xs font-black uppercase tracking-wide text-black group-hover/review:text-white">{review.userName}</div>
                        <div className="flex items-center gap-0.5 bg-white border-2 border-black px-1.5 py-0.5 rounded-none text-[10px] font-mono text-black font-black select-none">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3 h-3 ${s <= review.rating ? "text-amber-500 fill-amber-500" : "text-zinc-200"}`}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 text-[10px] text-black/60 group-hover/review:text-white/80">
                        <span className="font-mono">Contact: {review.userEmail}</span>
                        <span className="font-mono flex items-center gap-1">
                          <Calendar className="w-3" /> {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Backed Score Input panel within modal for normal users */}
            {user && user.role === UserRole.USER && (
              <div className="bg-zinc-100 p-5 border-t-2 border-black text-xs flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center sm:text-left">
                  <div className="font-black text-black uppercase tracking-wider">Quick Score this storefront:</div>
                  <p className="text-[11px] text-black/65 font-bold">Rate service quality instantly with one tap.</p>
                </div>
                <div className="flex items-center gap-1 bg-white border-2 border-black p-1 select-none">
                  {[1, 2, 3, 4, 5].map((starVal) => {
                    const myRating = userRatings.find(r => r.storeId === selectedStore.id);
                    const currentScore = myRating ? myRating.rating : 0;
                    return (
                      <button
                        key={starVal}
                        onClick={() => handleSubmitRating(selectedStore.id, starVal)}
                        className="p-1.5 hover:scale-125 transition-transform active:scale-95"
                        id={`modal_rate_star_${starVal}`}
                      >
                        <Star
                          className={`w-6 h-6 stroke-1.5 ${starVal <= currentScore ? "text-amber-500 fill-amber-500" : "text-zinc-200 hover:text-amber-400"}`}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
