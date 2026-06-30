import React, { useState } from 'react';
import { useMotive } from '../contexts/MotiveContext';
import { Sparkles, Calendar, Zap, ArrowRight, CheckCircle, EyeOff, RotateCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const RecommendationSection: React.FC = () => {
  const { recommendations, acceptRecommendation, dismissRecommendation, generateNewRecommendation } = useMotive();
  const [isRegenerating, setIsRegenerating] = useState(false);

  const activeRec = recommendations.find(r => r.status === 'ACTIVE');

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    await generateNewRecommendation();
    setIsRegenerating(false);
  };

  return (
    <div className="space-y-3" id="motive-recommendation-section">
      <div className="flex items-center justify-between h-8">
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-4 w-4 text-emerald-600 fill-emerald-600/10 animate-pulse" />
          <h2 className="text-xs font-semibold text-slate-800 dark:text-zinc-200 uppercase tracking-wider font-mono">Next Best Action</h2>
        </div>
        <button
          onClick={handleRegenerate}
          disabled={isRegenerating}
          className="px-2 py-1 text-[10.5px] font-bold text-slate-600 dark:text-zinc-300 bg-white dark:bg-[#131415] border border-slate-200/60 dark:border-zinc-800/80 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer transition-all flex items-center gap-1 shadow-xs shrink-0"
        >
          <RotateCw className={`h-3 w-3 ${isRegenerating ? 'animate-spin' : ''}`} />
          <span>{isRegenerating ? "Re-planning..." : "Re-evaluate"}</span>
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeRec ? (
          <motion.div
            key={activeRec.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="relative bg-white dark:bg-[#131415] border border-slate-100 dark:border-zinc-900 rounded-xl p-3.5 transition-colors duration-300"
          >
            {/* Top Stats Strip - Tighter and smaller */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-slate-500 dark:text-zinc-400 mb-2.5 pb-2 border-b border-slate-50 dark:border-zinc-900/60">
              <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200/60 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-400 px-1.5 py-0.5 rounded font-bold">
                <Zap className="h-3 w-3 fill-emerald-600/15 text-emerald-800 dark:text-emerald-400" />
                <span>{activeRec.impact}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-[9.5px]">
                  <Calendar className="h-3 w-3" />
                  <span>{activeRec.estimatedMinutes}m</span>
                </div>
                <span className="text-slate-300 dark:text-zinc-800">|</span>
                <div className="flex items-center gap-1 bg-slate-100 text-slate-800 dark:bg-zinc-850 dark:text-zinc-300 px-1.5 py-0.5 rounded border border-slate-200/50 dark:border-zinc-800 font-semibold text-[9.5px] whitespace-nowrap">
                  <span>{activeRec.confidence}% Confidence</span>
                </div>
              </div>
            </div>

            {/* Recommendation Content - Tighter */}
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-slate-900 dark:text-zinc-50 tracking-tight leading-snug">
                {activeRec.title}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-normal">
                {activeRec.reason}
              </p>
            </div>

            {/* Action Buttons - Compact */}
            <div className="flex items-center gap-2 mt-3.5 pt-2.5 border-t border-slate-50 dark:border-zinc-900/60">
              <button
                onClick={() => acceptRecommendation(activeRec)}
                className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold shadow-sm transition-all cursor-pointer"
              >
                <CheckCircle className="h-3.5 w-3.5" />
                <span>Resolve</span>
                <ArrowRight className="h-3 w-3" />
              </button>
              
              <button
                onClick={() => dismissRecommendation(activeRec.id)}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-zinc-900/40 dark:hover:bg-zinc-900/80 text-slate-500 dark:text-zinc-400 border border-slate-100 dark:border-zinc-900 rounded-lg text-[11px] font-semibold transition-all cursor-pointer"
              >
                <EyeOff className="h-3 w-3" />
                <span>Skip</span>
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="border border-dashed border-slate-300 dark:border-zinc-800 rounded-xl p-8 flex flex-col items-center justify-center text-center text-slate-400 dark:text-zinc-500 bg-slate-50/10 dark:bg-zinc-900/10"
          >
            <Sparkles className="h-6 w-6 text-slate-400 dark:text-zinc-500 mb-2.5" />
            <p className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider font-mono">No active recommendations</p>
            <p className="text-[10.5px] text-slate-450 dark:text-zinc-500 mt-1 mb-4 leading-relaxed max-w-[200px]">
              No suggestions found. Re-evaluate the graph to trigger the recommender.
            </p>
            <button
              onClick={handleRegenerate}
              className="px-3 py-1.5 bg-slate-50 dark:bg-zinc-900/40 border border-slate-150 dark:border-zinc-800 rounded-lg text-[11px] font-bold text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-850 transition-all cursor-pointer shadow-xs"
            >
              Analyze Workspace
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
export default RecommendationSection;
