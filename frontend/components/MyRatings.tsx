/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Rating } from "../types";
import { Star, FileClock, Edit2, Calendar, RefreshCw, Inbox, Check, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface HydratedRating extends Rating {
  storeName: string;
}

export const MyRatings: React.FC = () => {
  const { user, apiFetch } = useAuth();
  const [ratings, setRatings] = useState<HydratedRating[]>([]);
  const [loading, setLoading] = useState(true);

  // Editing state
  const [editingRatingId, setEditingRatingId] = useState<string | null>(null);
  const [tempScore, setTempScore] = useState<number>(5);
  const [isSaving, setIsSaving] = useState(false);

  // Feedback notifications
  const [feedback, setFeedback] = useState<{ text: string; isError: boolean } | null>(null);

  useEffect(() => {
    if (user) {
      loadMyRatings();
    }
  }, [user]);

  const loadMyRatings = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/ratings?userId=${user?.id}`);
      if (res.ok) {
        const data: HydratedRating[] = await res.json();
        setRatings(data);
      }
    } catch (err) {
      console.error("Failed to load user ratings", err);
    } finally {
      setLoading(false);
    }
  };

  const triggerFeedback = (text: string, isError = false) => {
    setFeedback({ text, isError });
    setTimeout(() => {
      setFeedback(null);
    }, 4000);
  };

  const handleStartEdit = (rating: HydratedRating) => {
    setEditingRatingId(rating.id);
    setTempScore(rating.rating);
  };

  const handleCancelEdit = () => {
    setEditingRatingId(null);
  };

  const handleSaveEdit = async (ratingId: string) => {
    setIsSaving(true);
    try {
      const res = await apiFetch(`/api/ratings/${ratingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: tempScore })
      });

      if (res.ok) {
        triggerFeedback("Rating updated successfully!");
        setEditingRatingId(null);
        loadMyRatings();
      } else {
        const errorData = await res.json();
        triggerFeedback(errorData.error || "Failed to update rating.", true);
      }
    } catch (err) {
      triggerFeedback("Network error connecting to rating registry.", true);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 selection:bg-black selection:text-white">
      {/* Toast Notice */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 right-6 z-50 p-4 rounded-none border-2 border-black shadow-[4px_4px_0px_0px_#000000] text-xs font-black uppercase tracking-wider flex items-center gap-3 max-w-sm ${feedback.isError ? "bg-white text-black" : "bg-black text-white"}`}
            id="my_ratings_feedback_banner"
          >
            {feedback.isError ? <X className="w-4 h-4 shrink-0 stroke-[2.5px] text-red-500" /> : <Check className="w-4 h-4 shrink-0 stroke-[2.5px] text-green-400" />}
            <span>{feedback.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Info */}
      <div className="bg-black text-white border-2 border-black p-8 flex flex-col md:flex-row md:items-center justify-between gap-6" id="my_ratings_header">
        <div>
          <span className="text-xs font-mono font-bold tracking-[0.3em] text-white/50 uppercase">Reviewer Ledger</span>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tighter leading-none uppercase font-display mt-1">Your Scoring Log Ledger</h1>
          <p className="text-xs text-white/60 mt-2 font-sans">
            Browse through stores you scored in the past and update rating stars easily to represent current outcomes.
          </p>
        </div>
        <div className="bg-zinc-900 border-2 border-zinc-800 p-4 rounded-none text-left self-start md:self-auto font-mono shrink-0">
          <div className="text-[10px] uppercase font-black tracking-wider text-white/40">Total Scores Logged</div>
          <div className="text-4xl font-black text-white font-display mt-1 italic">{ratings.length}</div>
        </div>
      </div>

      {/* Ratings Listing cards */}
      {loading ? (
        <div className="text-center py-20 bg-white border-2 border-black rounded-none shadow-[4px_4px_0px_0px_#000000]" id="my_ratings_loader">
          <RefreshCw className="w-10 h-10 mx-auto text-black animate-spin" />
          <p className="text-xs text-black font-mono font-black uppercase tracking-widest mt-4">Summoning your reviewer files...</p>
        </div>
      ) : ratings.length === 0 ? (
        <div className="text-center py-20 bg-white border-2 border-black rounded-none p-8 shadow-[4px_4px_0px_0px_#000000]" id="my_ratings_empty">
          <Inbox className="w-12 h-12 mx-auto text-black mb-3" />
          <h3 className="text-base font-black text-black uppercase tracking-wider font-display">No Scores Registered</h3>
          <p className="text-xs text-black/60 mt-2 max-w-sm mx-auto">
            You haven't submitted any feedback on merchant establishments yet. Explore the stores grid to get started!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="my_ratings_cards_grid">
          {ratings.map((log) => {
            const isEditing = editingRatingId === log.id;

            return (
              <div
                key={log.id}
                className="bg-white border-2 border-black hover:bg-black hover:text-white p-6 transition-all rounded-none hover:shadow-[4px_4px_0px_0px_#000000] flex flex-col justify-between group"
                id={`my_rating_card_${log.id}`}
              >
                <div>
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <h3 className="font-black text-lg tracking-tight text-black group-hover:text-white font-display line-clamp-1 uppercase">
                      {log.storeName}
                    </h3>
                    <span className="text-[10px] font-mono text-black/55 group-hover:text-white/60 font-bold uppercase shrink-0 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(log.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Rating Stars indicators */}
                  {!isEditing ? (
                    <div className="flex items-center gap-0.5 py-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-5 h-5 ${s <= log.rating ? "text-amber-500 fill-amber-500" : "text-zinc-200 group-hover:text-zinc-700"}`}
                        />
                      ))}
                      <span className="text-xs font-mono font-extrabold text-black/60 group-hover:text-white/80 uppercase ml-2 tracking-wide">({log.rating} Stars)</span>
                    </div>
                  ) : (
                    <div className="bg-zinc-50 group-hover:bg-zinc-900 group-hover:border-white/20 p-4 border border-black rounded-none space-y-2 text-black group-hover:text-white transition-all">
                      <div className="text-[10px] font-mono font-black uppercase tracking-widest text-black/50 group-hover:text-white/50">Adjust Rating Score:</div>
                      <div className="flex items-center gap-1 justify-center py-2 bg-white group-hover:bg-black border border-black/10">
                        {[1, 2, 3, 4, 5].map((starVal) => (
                          <button
                            key={starVal}
                            onClick={() => setTempScore(starVal)}
                            className="p-1 hover:scale-125 transition-transform"
                            id={`edit_star_${log.id}_${starVal}`}
                          >
                            <Star
                              className={`w-7 h-7 stroke-1.5 ${starVal <= tempScore ? "text-amber-500 fill-amber-500" : "text-zinc-200 group-hover:text-zinc-800 hover:text-amber-400"}`}
                            />
                          </button>
                        ))}
                      </div>
                      <div className="text-center font-black text-xs text-black group-hover:text-white font-mono uppercase tracking-wide">Current Pick: {tempScore} out of 5</div>
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-4 border-t-2 border-black/10 group-hover:border-white/10 flex items-center justify-between gap-4">
                  <div className="text-[9px] font-mono text-black/40 group-hover:text-white/40 uppercase font-black">
                    ID: <span className="font-bold">{log.id.substring(0, 8)}...</span>
                  </div>

                  {!isEditing ? (
                    <button
                      onClick={() => handleStartEdit(log)}
                      className="inline-flex items-center gap-1.5 py-2 px-3 bg-white text-black border-2 border-black text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer rounded-none hover:bg-black hover:text-white group-hover:bg-white group-hover:text-black group-hover:border-white"
                      id={`btn_modify_rating_${log.id}`}
                    >
                      <Edit2 className="w-3 h-3" /> Adjust Rating
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleCancelEdit}
                        className="py-1.5 px-3 bg-white border border-black hover:bg-black hover:text-white text-black font-black text-[11px] rounded-none transition-all cursor-pointer group-hover:text-black group-hover:bg-white"
                        id={`btn_cancel_modify_${log.id}`}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveEdit(log.id)}
                        disabled={isSaving}
                        className="py-1.5 px-3 bg-black text-white border border-black hover:bg-white hover:text-black font-black text-[11px] rounded-none transition-all cursor-pointer group-hover:text-white group-hover:bg-black group-hover:border-white"
                        id={`btn_save_modify_${log.id}`}
                      >
                        {isSaving ? "Saving..." : "Lock Changes"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
