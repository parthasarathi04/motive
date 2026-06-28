import React, { useState, useRef, useEffect } from 'react';
import { useMotive } from '../contexts/MotiveContext';
import { Sparkles, Send, Brain, RefreshCw, ChevronLeft, ChevronRight, X, User, Trophy, AlertTriangle, Lightbulb } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const AISidebar: React.FC = () => {
  const { 
    chatMessages, 
    isChatLoading, 
    sendChatMessage, 
    dailyBrief, 
    weeklyReview, 
    goals, 
    commitments, 
    isSyncing,
    isAiSidebarOpen,
    setIsAiSidebarOpen
  } = useMotive();

  const isOpen = isAiSidebarOpen;
  const setIsOpen = setIsAiSidebarOpen;
  const [activeTab, setActiveTab] = useState<'brief' | 'review' | 'chat'>('brief');
  const [inputText, setInputText] = useState('');
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    const text = inputText;
    setInputText('');
    await sendChatMessage(text);
  };

  const quickPrompts = [
    "Plan interview roadmap",
    "Resolve France Visa scheduling",
    "List calendar conflicts",
    "Show next high impact task"
  ];

  const handleQuickPrompt = async (prompt: string) => {
    await sendChatMessage(prompt);
  };

  return (
    <>
      {/* AISidebar Container */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: 360, opacity: 0.8 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 360, opacity: 0.8 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-[360px] border-l border-slate-200/55 dark:border-zinc-800 bg-white/95 dark:bg-[#0c0d0e]/95 backdrop-blur-md flex flex-col h-screen fixed right-0 top-0 z-50 transition-colors duration-300 shadow-2xl"
          >
            {/* Header / Tabs */}
            <div className="p-4 border-b border-neutral-100 dark:border-zinc-900 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Brain className="h-4.5 w-4.5 text-emerald-500 fill-emerald-500/15" />
                <span className="font-semibold text-xs tracking-wider uppercase font-mono text-neutral-800 dark:text-neutral-100">AI Chief of Staff</span>
              </div>

              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-md text-neutral-400 hover:text-neutral-600 dark:hover:text-zinc-300 transition-all cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Sub Tabs */}
            <div className="grid grid-cols-3 border-b border-neutral-100 dark:border-zinc-900 p-2 gap-1 font-mono text-[11px]">
              {(['brief', 'review', 'chat'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-1.5 rounded-lg font-bold tracking-wider cursor-pointer capitalize transition-all border ${activeTab === tab ? 'bg-neutral-900 text-white border-neutral-900 dark:bg-zinc-100 dark:text-zinc-950 dark:border-zinc-100' : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-zinc-200 border-transparent'}`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              
              {/* 1. Daily Executive Brief Tab */}
              {activeTab === 'brief' && (
                <div className="space-y-4.5">
                  {dailyBrief ? (
                    <div className="space-y-4">
                      {/* Greeting */}
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-emerald-500 animate-pulse" />
                        <h3 className="text-base font-semibold text-neutral-950 dark:text-neutral-50 tracking-tight leading-none">{dailyBrief.greeting}</h3>
                      </div>

                      {/* Summary Executive Card */}
                      <div className="bg-neutral-50 dark:bg-zinc-900/50 border border-neutral-200/40 dark:border-zinc-800/80 p-4.5 rounded-2xl">
                        <p className="text-xs text-neutral-600 dark:text-zinc-300 leading-relaxed">
                          {dailyBrief.summary}
                        </p>
                      </div>

                      {/* Today's Focus Areas */}
                      <div className="space-y-2">
                        <h4 className="text-[10px] uppercase font-mono tracking-wider font-semibold text-neutral-500 dark:text-zinc-500">Key Focus Objectives</h4>
                        <div className="space-y-1.5">
                          {dailyBrief.focusAreas.map((area, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                              <span className="text-emerald-500 font-mono mt-0.5">&bull;</span>
                              <span>{area}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Top Recommendation Reminder */}
                      <div className="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-xl flex items-start gap-2.5">
                        <Lightbulb className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase font-mono font-semibold text-emerald-600 dark:text-emerald-400">Next Action Goal</p>
                          <p className="text-xs text-neutral-700 dark:text-zinc-300 leading-relaxed">
                            {dailyBrief.recommendation}
                          </p>
                        </div>
                      </div>

                      {/* Closing message */}
                      <p className="text-[11px] font-mono italic text-neutral-500 dark:text-zinc-400 leading-normal text-center pt-2">
                        "{dailyBrief.closingMessage}"
                      </p>
                    </div>
                  ) : (
                    <div className="py-20 text-center text-neutral-400">
                      <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-neutral-300" />
                      <p className="text-xs font-mono">Synthesizing Daily Brief...</p>
                    </div>
                  )}
                </div>
              )}

              {/* 2. Weekly Performance Review Tab */}
              {activeTab === 'review' && (
                <div className="space-y-5">
                  {weeklyReview ? (
                    <div className="space-y-5">
                      {/* Wins */}
                      <div className="space-y-2.5">
                        <h4 className="text-[10px] uppercase font-mono tracking-wider font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                          <Trophy className="h-3.5 w-3.5" />
                          Key Accomplishments
                        </h4>
                        <div className="space-y-2">
                          {weeklyReview.wins.map((win: string, idx: number) => (
                            <div key={idx} className="bg-emerald-500/5 border border-emerald-500/10 px-3.5 py-2.5 rounded-xl text-xs text-neutral-700 dark:text-zinc-300 leading-relaxed">
                              {win}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Risks */}
                      <div className="space-y-2">
                        <h4 className="text-[10px] uppercase font-mono tracking-wider font-bold text-rose-500 flex items-center gap-1.5">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          Critical Risks & Opportunities
                        </h4>
                        <div className="bg-rose-500/5 border border-rose-500/10 p-4 rounded-xl text-xs text-neutral-700 dark:text-zinc-300 leading-relaxed">
                          {weeklyReview.biggestRisk}
                        </div>
                      </div>

                      {/* Next Week Focus */}
                      <div className="space-y-2.5">
                        <h4 className="text-[10px] uppercase font-mono tracking-wider font-bold text-neutral-500 dark:text-zinc-500">
                          Next Week Intentions
                        </h4>
                        <div className="space-y-1.5">
                          {weeklyReview.nextWeekFocus.map((focus: string, idx: number) => (
                            <div key={idx} className="flex items-start gap-2 text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                              <span className="text-indigo-500 mt-0.5 font-mono">&bull;</span>
                              <span>{focus}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-20 text-center text-neutral-400">
                      <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2" />
                      <p className="text-xs font-mono">Generating Retrospective Review...</p>
                    </div>
                  )}
                </div>
              )}

              {/* 3. Interactive Chat Tab */}
              {activeTab === 'chat' && (
                <div className="flex flex-col h-[calc(100vh-210px)]">
                  {/* Messages list */}
                  <div className="flex-1 overflow-y-auto space-y-3 pb-3">
                    {chatMessages.map((msg) => {
                      const isAi = msg.sender === 'ai';
                      return (
                        <div 
                          key={msg.id}
                          className={`flex gap-2.5 ${isAi ? 'justify-start' : 'justify-end'}`}
                        >
                          {isAi && (
                            <div className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center flex-shrink-0">
                              <Brain className="h-4 w-4" />
                            </div>
                          )}
                          <div className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${isAi ? 'bg-neutral-100 dark:bg-zinc-900 text-neutral-800 dark:text-zinc-200 rounded-tl-none' : 'bg-emerald-600 dark:bg-emerald-600 text-white dark:text-white rounded-tr-none font-medium shadow-sm'}`}>
                            {msg.text}
                          </div>
                        </div>
                      );
                    })}
                    {isChatLoading && (
                      <div className="flex gap-2.5 justify-start">
                        <div className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center flex-shrink-0">
                          <Brain className="h-4 w-4 animate-bounce" />
                        </div>
                        <div className="px-3.5 py-2.5 rounded-2xl text-xs bg-neutral-100 dark:bg-zinc-900 text-neutral-500 font-mono animate-pulse">
                          Evaluating roadmap variables...
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Suggestion Prompts */}
                  {chatMessages.length < 3 && !isChatLoading && (
                    <div className="flex flex-wrap gap-1.5 py-2 border-t border-neutral-100 dark:border-zinc-900">
                      {quickPrompts.map((p, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleQuickPrompt(p)}
                          className="text-[10px] font-mono px-2.5 py-1 rounded-lg border border-neutral-200/55 dark:border-zinc-850 hover:border-emerald-500/30 text-neutral-500 dark:text-zinc-400 hover:text-emerald-500 cursor-pointer transition-all"
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Message Input Box */}
                  <form onSubmit={handleSend} className="flex gap-2 pt-2 border-t border-neutral-100 dark:border-zinc-900 bg-white dark:bg-zinc-950">
                    <input
                      type="text"
                      required
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="Discuss commitments, timeline, replan..."
                      className="flex-1 px-3.5 py-2 text-xs bg-neutral-50 dark:bg-zinc-900 border border-neutral-200/70 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-emerald-500 dark:text-neutral-50"
                    />
                    <button
                      type="submit"
                      disabled={isChatLoading || !inputText.trim()}
                      className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all flex items-center justify-center cursor-pointer disabled:opacity-40 shadow-sm"
                    >
                      <Send className="h-3.5 w-3.5" />
                    </button>
                  </form>
                </div>
              )}

            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
};
export default AISidebar;
