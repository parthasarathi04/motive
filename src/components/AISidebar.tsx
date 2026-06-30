import React, { useState, useRef, useEffect } from 'react';
import { useMotive } from '../contexts/MotiveContext';
import { ProposedAction } from '../types';
import { 
  Sparkles, 
  Send, 
  Brain, 
  RefreshCw, 
  ChevronRight, 
  Trophy, 
  AlertTriangle, 
  Lightbulb, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Info,
  CheckCircle2,
  XCircle,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const AISidebar: React.FC = () => {
  const { 
    chatMessages, 
    isChatLoading, 
    sendChatMessage, 
    dailyBrief, 
    weeklyReview, 
    isAiSidebarOpen,
    setIsAiSidebarOpen,
    addGoal,
    addCommitment,
    updateCommitment,
    deleteCommitment
  } = useMotive();

  const isOpen = isAiSidebarOpen;
  const setIsOpen = setIsAiSidebarOpen;
  const [activeTab, setActiveTab] = useState<'brief' | 'review' | 'chat'>('brief');
  const [inputText, setInputText] = useState('');
  const [isAiInitialized, setIsAiInitialized] = useState<boolean | null>(null);
  
  // Audio states
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  
  // Agentic States
  const [isAutoExecute, setIsAutoExecute] = useState(() => localStorage.getItem('mo_auto_execute') === 'true');
  const [executedActionIds, setExecutedActionIds] = useState<Record<string, 'EXECUTED' | 'REJECTED'>>({});

  const chatEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Check Gemini Status
  useEffect(() => {
    fetch('/api/ai/status')
      .then(res => res.json())
      .then(data => setIsAiInitialized(data.initialized))
      .catch(() => setIsAiInitialized(false));
  }, [isOpen]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, activeTab]);

  // Clean up speech synthesis on unmount or tab change
  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, [activeTab, isOpen]);

  // Auto-execute logic if enabled
  useEffect(() => {
    if (!isAutoExecute) return;
    
    const lastMsg = chatMessages[chatMessages.length - 1];
    if (lastMsg && lastMsg.sender === 'ai' && lastMsg.actions && lastMsg.actions.length > 0) {
      lastMsg.actions.forEach(action => {
        if (!executedActionIds[action.id]) {
          executeAction(action).then(success => {
            if (success) {
              setExecutedActionIds(prev => ({ ...prev, [action.id]: 'EXECUTED' }));
            }
          });
        }
      });
    }
  }, [chatMessages, isAutoExecute]);

  const executeAction = async (action: ProposedAction): Promise<boolean> => {
    try {
      if (action.type === 'CREATE_GOAL') {
        const { title, description, deadline, area, customCommitments } = action.data;
        await addGoal(title, description, deadline, area, customCommitments);
      } else if (action.type === 'CREATE_COMMITMENT') {
        const { title, type, constraint, estimatedDuration, scheduledStart, goalId } = action.data;
        await addCommitment({
          title,
          type: type || 'FOCUS_BLOCK',
          constraint: constraint || 'FLEXIBLE',
          estimatedDuration: estimatedDuration || 45,
          scheduledStart: scheduledStart || null,
          origin: 'AI',
          status: 'PLANNED'
        }, goalId);
      } else if (action.type === 'RESCHEDULE_COMMITMENT') {
        const { id, scheduledStart } = action.data;
        await updateCommitment(id, { 
          scheduledStart,
          status: 'SCHEDULED'
        });
      } else if (action.type === 'DELETE_COMMITMENT') {
        const { id } = action.data;
        await deleteCommitment(id);
      }
      return true;
    } catch (err) {
      console.error("Failed to execute Mo action:", err);
      return false;
    }
  };

  const handleApproveAction = async (action: ProposedAction) => {
    const success = await executeAction(action);
    if (success) {
      setExecutedActionIds(prev => ({ ...prev, [action.id]: 'EXECUTED' }));
    }
  };

  const handleRejectAction = (actionId: string) => {
    setExecutedActionIds(prev => ({ ...prev, [actionId]: 'REJECTED' }));
  };

  const handleSend = async (e?: React.FormEvent | React.KeyboardEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;
    const text = inputText;
    setInputText('');
    await sendChatMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickPrompts = [
    "Suggest a strategy to balance my current goals",
    "How can I resolve timeline conflicts in my schedule?",
    "Help me prioritize high-impact commitments today",
    "Analyze my current momentum and offer focus tips"
  ];

  const handleQuickPrompt = async (prompt: string) => {
    await sendChatMessage(prompt);
  };

  // Speak message action
  const handleToggleSpeak = (msgId: string, text: string) => {
    if (!window.speechSynthesis) return;

    if (speakingMessageId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
    } else {
      window.speechSynthesis.cancel();
      
      // Clean text from markdown bold stars/formatting before speaking
      const cleanText = text.replace(/[\*\_]/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      
      utterance.onend = () => setSpeakingMessageId(null);
      utterance.onerror = () => setSpeakingMessageId(null);
      
      setSpeakingMessageId(msgId);
      window.speechSynthesis.speak(utterance);
    }
  };

  // Toggle Voice dictation
  const handleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice speech recognition is not supported in this browser. Please try Chrome, Edge, or Safari.");
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
    } else {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText(prev => prev + (prev ? ' ' : '') + transcript);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Elegant Blur Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-slate-900/15 dark:bg-black/50 backdrop-blur-md z-45"
          />

          {/* Expanded Mo Drawer */}
          <motion.aside
            initial={{ x: 500, opacity: 0.9 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 500, opacity: 0.9 }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            className="w-full sm:w-[500px] md:w-[520px] border-l border-slate-200/60 dark:border-zinc-800/80 bg-white/95 dark:bg-[#0c0d0e]/95 backdrop-blur-xl flex flex-col h-screen fixed right-0 top-0 z-50 transition-colors duration-300 shadow-2xl"
          >
            {/* Header / Tabs */}
            <div className="p-4.5 border-b border-neutral-100 dark:border-zinc-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4.5 w-4.5 text-indigo-500 fill-indigo-500/15" />
                <span className="font-semibold text-sm tracking-wide font-sans text-neutral-800 dark:text-neutral-100">Mo Companion</span>
              </div>

              <button 
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-zinc-300 hover:bg-neutral-50 dark:hover:bg-zinc-900 transition-all cursor-pointer"
                title="Close Drawer"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            {/* Sub Tabs */}
            <div className="grid grid-cols-3 border-b border-neutral-100 dark:border-zinc-900 p-2.5 gap-1.5 font-mono text-[11px]">
              {(['brief', 'review', 'chat'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab);
                    window.speechSynthesis?.cancel();
                    setSpeakingMessageId(null);
                  }}
                  className={`py-2 rounded-xl font-bold tracking-wider cursor-pointer capitalize transition-all border ${
                    activeTab === tab 
                      ? 'bg-neutral-900 text-white border-neutral-900 dark:bg-zinc-100 dark:text-zinc-950 dark:border-zinc-100 shadow-sm' 
                      : 'text-neutral-500 hover:text-neutral-850 dark:hover:text-zinc-200 border-transparent hover:bg-neutral-50 dark:hover:bg-zinc-900/40'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Main Content Area Layout with fixed scroll containers to prevent input bottom gap issues */}
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              
              {/* 1. Daily Executive Brief Tab */}
              {activeTab === 'brief' && (
                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                  {dailyBrief ? (
                    <div className="space-y-5">
                      {/* Greeting */}
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-emerald-500 animate-pulse" />
                        <h3 className="text-base font-semibold text-neutral-950 dark:text-neutral-50 tracking-tight leading-none">{dailyBrief.greeting}</h3>
                      </div>

                      {/* Summary Executive Card */}
                      <div className="bg-neutral-50 dark:bg-zinc-900/40 border border-neutral-200/40 dark:border-zinc-800/80 p-5 rounded-2xl">
                        <p className="text-xs text-neutral-600 dark:text-zinc-300 leading-relaxed">
                          {dailyBrief.summary}
                        </p>
                      </div>

                      {/* Today's Focus Areas */}
                      <div className="space-y-3">
                        <h4 className="text-[10px] uppercase font-mono tracking-wider font-semibold text-neutral-500 dark:text-zinc-500">Key Focus Objectives</h4>
                        <div className="space-y-2">
                          {dailyBrief.focusAreas.map((area, idx) => (
                            <div key={idx} className="flex items-start gap-2.5 text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                              <span className="text-emerald-500 font-mono mt-0.5">&bull;</span>
                              <span>{area}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Top Recommendation Reminder */}
                      <div className="bg-emerald-500/5 border border-emerald-500/10 p-4.5 rounded-xl flex items-start gap-3">
                        <Lightbulb className="h-4.5 w-4.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase font-mono font-semibold text-emerald-600 dark:text-emerald-400">Next Action Goal</p>
                          <p className="text-xs text-neutral-700 dark:text-zinc-300 leading-relaxed">
                            {dailyBrief.recommendation}
                          </p>
                        </div>
                      </div>

                      {/* Closing message */}
                      <p className="text-[11px] font-mono italic text-neutral-500 dark:text-zinc-400 leading-normal text-center pt-3">
                        "{dailyBrief.closingMessage}"
                      </p>
                    </div>
                  ) : (
                    <div className="py-24 text-center text-neutral-400">
                      <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-3 text-neutral-350" />
                      <p className="text-xs font-mono">Synthesizing Daily Brief...</p>
                    </div>
                  )}
                </div>
              )}

              {/* 2. Weekly Performance Review Tab */}
              {activeTab === 'review' && (
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {weeklyReview ? (
                    <div className="space-y-6">
                      {/* Wins */}
                      <div className="space-y-3">
                        <h4 className="text-[10px] uppercase font-mono tracking-wider font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                          <Trophy className="h-3.5 w-3.5" />
                          Key Accomplishments
                        </h4>
                        <div className="space-y-2.5">
                          {weeklyReview.wins.map((win: string, idx: number) => (
                            <div key={idx} className="bg-emerald-500/5 border border-emerald-500/10 px-4 py-3 rounded-xl text-xs text-neutral-700 dark:text-zinc-300 leading-relaxed">
                              {win}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Risks */}
                      <div className="space-y-2.5">
                        <h4 className="text-[10px] uppercase font-mono tracking-wider font-bold text-rose-500 flex items-center gap-1.5">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          Critical Risks & Opportunities
                        </h4>
                        <div className="bg-rose-500/5 border border-rose-500/10 p-4.5 rounded-xl text-xs text-neutral-700 dark:text-zinc-300 leading-relaxed">
                          {weeklyReview.biggestRisk}
                        </div>
                      </div>

                      {/* Next Week Focus */}
                      <div className="space-y-3">
                        <h4 className="text-[10px] uppercase font-mono tracking-wider font-bold text-neutral-500 dark:text-zinc-500">
                          Next Week Intentions
                        </h4>
                        <div className="space-y-2">
                          {weeklyReview.nextWeekFocus.map((focus: string, idx: number) => (
                            <div key={idx} className="flex items-start gap-2.5 text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                              <span className="text-indigo-500 mt-0.5 font-mono">&bull;</span>
                              <span>{focus}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-24 text-center text-neutral-400">
                      <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-3 text-neutral-350" />
                      <p className="text-xs font-mono">Generating Retrospective Review...</p>
                    </div>
                  )}
                </div>
              )}

              {/* 3. Interactive Chat Tab */}
              {activeTab === 'chat' && (
                <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                  
                  {/* Subtle Alert banner for fallback initialization status */}
                  {isAiInitialized === false && (
                    <div className="mx-4.5 mt-3 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-start gap-2.5 shadow-xs">
                      <Info className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                      <div className="space-y-0.5 text-[10.5px] text-amber-700 dark:text-amber-400 leading-relaxed">
                        <p className="font-bold">Gemini is running on smart fallbacks</p>
                        <p>To enable real-time personalized reasoning, please provide a valid <code className="font-mono bg-amber-500/10 px-1 py-0.2 rounded font-bold">GEMINI_API_KEY</code> in the Settings panel.</p>
                      </div>
                    </div>
                  )}

                  {/* Messages list with dedicated separate scroll scope */}
                  <div className="flex-1 overflow-y-auto p-4.5 space-y-4">
                    {chatMessages.map((msg) => {
                      const isAi = msg.sender === 'ai';
                      const isSpeaking = speakingMessageId === msg.id;
                      return (
                        <div 
                          key={msg.id}
                          className="flex flex-col space-y-2"
                        >
                          <div className={`flex gap-3 ${isAi ? 'justify-start' : 'justify-end'}`}>
                            {isAi && (
                              <div className="h-8 w-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
                                <Brain className="h-4.5 w-4.5" />
                              </div>
                            )}
                            <div className="max-w-[85%] flex flex-col gap-1 items-end">
                              <div className={`px-4 py-3 rounded-2xl text-xs leading-relaxed relative group ${
                                isAi 
                                  ? 'bg-neutral-150/80 dark:bg-zinc-900/80 text-neutral-800 dark:text-zinc-200 rounded-tl-none border border-neutral-200/20 dark:border-zinc-800/50' 
                                  : 'bg-indigo-600 dark:bg-indigo-600 text-white dark:text-white rounded-tr-none font-medium shadow-sm'
                              }`}>
                                {msg.text}

                                {/* Click-to-speak button on AI responses */}
                                {isAi && (
                                  <button
                                    type="button"
                                    onClick={() => handleToggleSpeak(msg.id, msg.text)}
                                    className={`absolute -right-3 -bottom-3 p-1.5 rounded-full shadow-md border bg-white dark:bg-zinc-850 border-neutral-100 dark:border-zinc-800 text-neutral-500 dark:text-zinc-400 hover:text-indigo-500 dark:hover:text-indigo-400 hover:scale-105 transition-all cursor-pointer opacity-0 group-hover:opacity-100 ${isSpeaking ? 'opacity-100 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 border-indigo-200' : ''}`}
                                    title={isSpeaking ? "Stop Speech" : "Speak Aloud"}
                                  >
                                    {isSpeaking ? <VolumeX className="h-3 w-3 animate-pulse" /> : <Volume2 className="h-3 w-3" />}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Agentic Workspace Action Panel */}
                          {isAi && msg.actions && msg.actions.length > 0 && (
                            <div className="ml-11 bg-neutral-50 dark:bg-zinc-900 border border-neutral-200/50 dark:border-zinc-800/80 p-3.5 rounded-2xl text-xs space-y-3 shadow-xs">
                              <div className="flex items-center justify-between border-b border-neutral-100 dark:border-zinc-800/60 pb-2">
                                <span className="font-mono text-[9.5px] font-bold text-neutral-400 dark:text-zinc-500 tracking-wider uppercase flex items-center gap-1.5">
                                  <Sparkles className="h-3.5 w-3.5 text-indigo-500" /> Proposed Action
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] text-neutral-400 dark:text-zinc-500 font-semibold font-mono uppercase tracking-wider">Auto-Execute</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const next = !isAutoExecute;
                                      setIsAutoExecute(next);
                                      localStorage.setItem('mo_auto_execute', String(next));
                                    }}
                                    className={`relative inline-flex h-4.5 w-8.5 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isAutoExecute ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-zinc-800'}`}
                                  >
                                    <span className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${isAutoExecute ? 'translate-x-4' : 'translate-x-0'}`} />
                                  </button>
                                </div>
                              </div>

                              <div className="space-y-2">
                                {msg.actions.map((action) => {
                                  const status = executedActionIds[action.id] || action.status;
                                  const isExecuted = status === 'EXECUTED';
                                  const isRejected = status === 'REJECTED';
                                  const isPending = status === 'PENDING';

                                  return (
                                    <div key={action.id} className="flex items-center justify-between p-2.5 rounded-xl border border-neutral-100 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/20 shadow-xs">
                                      <div className="flex items-start gap-2.5 max-w-[70%]">
                                        <span className="mt-0.5 text-indigo-500 shrink-0">
                                          {action.type === 'CREATE_GOAL' ? <Trophy className="h-4 w-4" /> :
                                           action.type === 'CREATE_COMMITMENT' ? <Clock className="h-4 w-4 text-emerald-500" /> :
                                           action.type === 'RESCHEDULE_COMMITMENT' ? <RefreshCw className="h-4 w-4 text-amber-500" /> :
                                           <AlertTriangle className="h-4 w-4 text-rose-500" />}
                                        </span>
                                        <div className="space-y-0.5">
                                          <p className="font-semibold text-neutral-800 dark:text-zinc-200 text-[11px] leading-snug">{action.description}</p>
                                          {action.type === 'CREATE_COMMITMENT' && action.data.estimatedDuration && (
                                            <p className="text-[9.5px] font-mono text-neutral-400 dark:text-zinc-500 font-bold">{action.data.estimatedDuration} min &bull; {action.data.type}</p>
                                          )}
                                          {action.type === 'CREATE_GOAL' && action.data.deadline && (
                                            <p className="text-[9.5px] font-mono text-neutral-400 dark:text-zinc-500 font-bold">Deadline: {action.data.deadline} &bull; {action.data.area}</p>
                                          )}
                                        </div>
                                      </div>

                                      <div className="flex gap-1.5 shrink-0">
                                        {isPending && (
                                          <>
                                            <button
                                              type="button"
                                              onClick={() => handleApproveAction(action)}
                                              className="px-2.5 py-1 text-[10px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all cursor-pointer shadow-xs flex items-center gap-1"
                                            >
                                              Approve
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => handleRejectAction(action.id)}
                                              className="px-2.5 py-1 text-[10px] font-bold bg-neutral-100 dark:bg-zinc-800 hover:bg-neutral-200 dark:hover:bg-zinc-750 text-neutral-600 dark:text-zinc-350 rounded-lg transition-all cursor-pointer"
                                            >
                                              Reject
                                            </button>
                                          </>
                                        )}
                                        {isExecuted && (
                                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                            ✓ Executed
                                          </span>
                                        )}
                                        {isRejected && (
                                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold font-mono bg-neutral-100 dark:bg-zinc-800 text-neutral-400 dark:text-zinc-500">
                                            Dismissed
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {isChatLoading && (
                      <div className="flex gap-3 justify-start animate-pulse">
                        <div className="h-8 w-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
                          <Brain className="h-4.5 w-4.5 animate-bounce" />
                        </div>
                        <div className="px-4 py-3 rounded-2xl text-xs bg-neutral-150/80 dark:bg-zinc-900/80 text-neutral-500 font-mono rounded-tl-none border border-neutral-200/20 dark:border-zinc-800/50">
                          Evaluating roadmap variables...
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Suggestion Prompts */}
                  {chatMessages.length < 3 && !isChatLoading && (
                    <div className="flex flex-wrap gap-1.5 px-4.5 py-3 border-t border-neutral-100 dark:border-zinc-900 bg-white/50 dark:bg-transparent">
                      {quickPrompts.map((p, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleQuickPrompt(p)}
                          className="text-[10px] font-mono px-3 py-1.5 rounded-xl border border-neutral-200/60 dark:border-zinc-850 hover:border-indigo-500/45 text-neutral-500 dark:text-zinc-400 hover:text-indigo-500 dark:hover:text-indigo-400 cursor-pointer transition-all bg-white dark:bg-zinc-900/20 hover:shadow-xs"
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Message Input Box & Control Form - firmly fixed at bottom with zero extra margin gaps */}
                  <div className="p-4 border-t border-neutral-100 dark:border-zinc-900 bg-white dark:bg-[#0c0d0e]">
                    <form onSubmit={handleSend} className="flex gap-2 items-end">
                      {/* Audio mic dictation button */}
                      <button
                        type="button"
                        onClick={handleVoiceInput}
                        className={`p-2.5 rounded-xl transition-all flex items-center justify-center cursor-pointer border h-[38px] ${
                          isListening 
                            ? 'bg-rose-500/10 border-rose-500/30 text-rose-500 animate-pulse scale-105' 
                            : 'bg-neutral-50 dark:bg-zinc-900 border-neutral-200/70 dark:border-zinc-800/80 text-neutral-400 hover:text-neutral-600 dark:hover:text-zinc-350'
                        }`}
                        title={isListening ? "Listening... Click to stop" : "Voice input (Dictate)"}
                      >
                        {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                      </button>

                      <div className="flex-1 relative">
                        <textarea
                          rows={Math.min(3, Math.max(1, inputText.split('\n').length))}
                          value={inputText}
                          onChange={(e) => setInputText(e.target.value)}
                          onKeyDown={handleKeyDown}
                          placeholder={isListening ? "Listening... Speak now" : "Discuss commitments, timeline, replan..."}
                          className={`w-full px-4 py-2.5 text-xs bg-neutral-50 dark:bg-zinc-900 border border-neutral-200/70 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-indigo-500 dark:text-neutral-50 placeholder-neutral-400/80 transition-all resize-none block scrollbar-none min-h-[38px] ${isListening ? 'border-rose-300 dark:border-rose-900 bg-rose-500/5' : ''}`}
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isChatLoading || !inputText.trim()}
                        className="p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-neutral-200 dark:disabled:bg-zinc-800 text-white rounded-xl transition-all flex items-center justify-center cursor-pointer disabled:opacity-40 shadow-sm h-[38px] w-[38px]"
                        title="Send Message"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                    </form>
                  </div>
                </div>
              )}

            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default AISidebar;
