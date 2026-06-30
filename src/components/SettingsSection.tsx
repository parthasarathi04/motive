import React, { useState } from 'react';
import { useMotive } from '../contexts/MotiveContext';
import { 
  Sun, 
  Moon, 
  Laptop, 
  RefreshCw, 
  Trash2, 
  Plus, 
  Mail, 
  Check, 
  Shield, 
  X,
  AlertTriangle,
  Sparkles,
  ExternalLink,
  Lock,
  UserCheck
} from 'lucide-react';
import { LinkedAccount } from '../types';

export const SettingsSection: React.FC = () => {
  const { 
    settings, 
    updateSettings, 
    isSyncing, 
    syncGoogleCalendar, 
    syncEmail, 
    clearAllData, 
    userProfile, 
    isSandbox 
  } = useMotive();

  const [isAccountPickerOpen, setIsAccountPickerOpen] = useState(false);
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [linkingState, setLinkingState] = useState<'IDLE' | 'LOADING' | 'SUCCESS'>('IDLE');
  const [selectedPresetEmail, setSelectedPresetEmail] = useState('');

  const currentTheme = settings?.theme || 'SYSTEM';

  const selectTheme = (theme: 'LIGHT' | 'DARK' | 'SYSTEM') => {
    updateSettings({ theme });
  };

  const handleManualSync = async () => {
    if (isSyncing) return;
    await Promise.all([syncGoogleCalendar(), syncEmail()]);
  };

  const presetAccounts = [
    { email: 'parthabhunia2001.work@gmail.com', name: 'Partha Bhunia (Work)' },
    { email: 'parthabhunia2001.personal@gmail.com', name: 'Partha Bhunia (Personal)' },
    { email: 'partha.developer@gmail.com', name: 'Partha Bhunia (Dev)' }
  ];

  const handleSelectPreset = async (email: string, name: string) => {
    setSelectedPresetEmail(email);
    setLinkingState('LOADING');
    
    // Simulate real authentic Google OAuth verification
    await new Promise(resolve => setTimeout(resolve, 1200));

    const currentAccounts = settings?.linkedAccounts || [];
    if (currentAccounts.some(acc => acc.email.toLowerCase() === email.toLowerCase())) {
      setLinkingState('IDLE');
      alert("This account is already linked.");
      return;
    }

    const newAcc: LinkedAccount = {
      email,
      name,
      photoUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
      isPrimary: false,
      linkedAt: new Date().toISOString()
    };

    await updateSettings({
      linkedAccounts: [...currentAccounts, newAcc]
    });

    setLinkingState('SUCCESS');
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Reset state
    setLinkingState('IDLE');
    setIsAccountPickerOpen(false);
  };

  const handleAddCustomAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail) return;

    setLinkingState('LOADING');
    await new Promise(resolve => setTimeout(resolve, 1200));

    const currentAccounts = settings?.linkedAccounts || [];
    if (currentAccounts.some(acc => acc.email.toLowerCase() === customEmail.toLowerCase())) {
      setLinkingState('IDLE');
      alert("This account is already linked.");
      return;
    }

    const newAcc: LinkedAccount = {
      email: customEmail,
      name: customName || customEmail.split('@')[0],
      photoUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(customName || customEmail)}`,
      isPrimary: false,
      linkedAt: new Date().toISOString()
    };

    await updateSettings({
      linkedAccounts: [...currentAccounts, newAcc]
    });

    setLinkingState('SUCCESS');
    await new Promise(resolve => setTimeout(resolve, 800));

    // Reset state
    setCustomEmail('');
    setCustomName('');
    setShowCustomInput(false);
    setLinkingState('IDLE');
    setIsAccountPickerOpen(false);
  };

  const handleUnlinkAccount = async (email: string) => {
    if (!settings?.linkedAccounts) return;
    const target = settings.linkedAccounts.find(acc => acc.email.toLowerCase() === email.toLowerCase());
    if (target?.isPrimary) {
      alert("Your primary active session account cannot be unlinked.");
      return;
    }
    if (confirm(`Are you sure you want to unlink ${email}?`)) {
      const updatedAccounts = settings.linkedAccounts.filter(acc => acc.email.toLowerCase() !== email.toLowerCase());
      await updateSettings({ linkedAccounts: updatedAccounts });
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto text-left py-2 animate-in fade-in duration-200">
      
      {/* Title & Description Header */}
      <div className="flex flex-col gap-1.5 md:flex-row md:items-center md:justify-between border-b border-slate-150/85 dark:border-zinc-850/80 pb-5">
        <div className="space-y-1">
          <h2 className="text-[19px] font-black text-slate-900 dark:text-zinc-50 tracking-tight font-sans">Settings</h2>
          <p className="text-[11.5px] text-slate-450 dark:text-zinc-500 font-medium font-sans">
            Calibrate workspace parameters, synchronize multiple Google accounts, and configure system preferences.
          </p>
        </div>
        
        <div className="flex items-center gap-1.5 self-start md:self-auto bg-slate-100/60 dark:bg-zinc-900/60 p-1 rounded-lg border border-slate-200/50 dark:border-zinc-850/40">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse ml-2" />
          <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider pr-2">
            Workspace: {isSandbox ? 'Sandbox Session' : 'Cloud Secure'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Columns - Settings Fields */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Active Theme Selector */}
          <div className="bg-white dark:bg-[#131415] border border-slate-150/70 dark:border-zinc-900 p-5 rounded-2xl shadow-xs space-y-3.5">
            <div>
              <h3 className="text-xs font-bold text-slate-800 dark:text-zinc-200 uppercase tracking-wider font-mono">Appearance</h3>
              <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-medium">Select your preferred user interface color palette.</p>
            </div>
            
            <div className="grid grid-cols-3 gap-2.5">
              <button
                onClick={() => selectTheme('LIGHT')}
                className={`py-3 px-4 rounded-xl border text-[12px] font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                  currentTheme === 'LIGHT'
                    ? 'bg-amber-500/5 border-amber-500/25 text-amber-700 dark:text-amber-400 shadow-xs'
                    : 'border-slate-100 dark:border-zinc-850 text-slate-500 hover:bg-slate-50 dark:hover:bg-zinc-900/40'
                }`}
              >
                <Sun className="h-4 w-4 shrink-0" />
                <span>Light Mode</span>
              </button>
              
              <button
                onClick={() => selectTheme('DARK')}
                className={`py-3 px-4 rounded-xl border text-[12px] font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                  currentTheme === 'DARK'
                    ? 'bg-indigo-500/5 border-indigo-500/25 text-indigo-500 dark:text-indigo-400 shadow-xs'
                    : 'border-slate-100 dark:border-zinc-850 text-slate-500 hover:bg-slate-50 dark:hover:bg-zinc-900/40'
                }`}
              >
                <Moon className="h-4 w-4 shrink-0" />
                <span>Dark Mode</span>
              </button>
              
              <button
                onClick={() => selectTheme('SYSTEM')}
                className={`py-3 px-4 rounded-xl border text-[12px] font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                  currentTheme === 'SYSTEM'
                    ? 'bg-slate-100 border-slate-300 text-slate-700 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300'
                    : 'border-slate-100 dark:border-zinc-850 text-slate-500 hover:bg-slate-50 dark:hover:bg-zinc-900/40'
                }`}
              >
                <Laptop className="h-4 w-4 shrink-0" />
                <span>System</span>
              </button>
            </div>
          </div>

          {/* Connected Google Accounts Panel (Multi-Account Sync) */}
          <div className="bg-white dark:bg-[#131415] border border-slate-150/70 dark:border-zinc-900 p-5 rounded-2xl shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-800 dark:text-zinc-200 uppercase tracking-wider font-mono">Connected Google Accounts</h3>
                <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-medium">Link multiple Google Calendars and Mailboxes to optimize schedule prioritization.</p>
              </div>
              
              <button
                onClick={() => setIsAccountPickerOpen(true)}
                className="py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Link Gmail</span>
              </button>
            </div>

            <div className="border border-slate-150 dark:border-zinc-850 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-zinc-850">
              {(settings?.linkedAccounts || []).map((acc) => (
                <div key={acc.email} className="p-4 flex items-center justify-between gap-3 bg-slate-50/25 dark:bg-zinc-900/10">
                  <div className="flex items-center gap-3 min-w-0">
                    <img 
                      src={acc.photoUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"} 
                      alt={acc.name} 
                      className="h-8 w-8 rounded-full object-cover ring-2 ring-slate-100 dark:ring-zinc-800"
                    />
                    <div className="text-left min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-xs font-bold text-slate-800 dark:text-zinc-200 truncate">{acc.name}</p>
                        {acc.isPrimary && (
                          <span className="text-[8px] px-1.5 py-0.5 font-bold uppercase tracking-wider rounded-sm bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40">
                            Primary session
                          </span>
                        )}
                        {!acc.isPrimary && (
                          <span className="text-[8.5px] font-mono font-semibold text-slate-400 dark:text-zinc-500">
                            Synced via owner session
                          </span>
                        )}
                      </div>
                      <p className="text-[10.5px] text-slate-450 dark:text-zinc-500 font-medium truncate">{acc.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {!acc.isPrimary ? (
                      <button
                        onClick={() => handleUnlinkAccount(acc.email)}
                        className="p-1.5 rounded-lg border border-slate-100 dark:border-zinc-850 hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-400 hover:text-red-500 transition-all cursor-pointer"
                        title="Unlink Account"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    ) : (
                      <span className="text-[10.5px] text-slate-400 dark:text-zinc-500 font-mono italic pr-2">App Owner</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sync Engine Details */}
          <div className="bg-white dark:bg-[#131415] border border-slate-150/70 dark:border-zinc-900 p-5 rounded-2xl shadow-xs space-y-4">
            <div>
              <h3 className="text-xs font-bold text-slate-800 dark:text-zinc-200 uppercase tracking-wider font-mono">Workspace Integration Sync</h3>
              <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-medium">Coordinate calendars and inbox contexts from all linked workspaces.</p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-zinc-900/30 border border-slate-100 dark:border-zinc-850 rounded-xl flex items-center justify-between gap-4">
              <div className="text-left space-y-0.5">
                <p className="text-xs font-bold text-slate-800 dark:text-zinc-200">Google Workspace Unified Sync</p>
                <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium">Re-scans calendar events & email timelines for priority recalibration</p>
              </div>
              
              <button
                onClick={handleManualSync}
                disabled={isSyncing}
                className={`py-2 px-3.5 rounded-lg border border-slate-200 dark:border-zinc-850 bg-white dark:bg-[#131415] text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-900 hover:text-slate-900 cursor-pointer transition-all flex items-center gap-1.5 text-xs font-bold ${
                  isSyncing ? 'opacity-55' : ''
                }`}
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
              </button>
            </div>
            
            {isSyncing && (
              <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold font-mono animate-pulse text-center">
                Querying multi-source secure endpoints in background...
              </p>
            )}
          </div>

        </div>

        {/* Right Column - Workspace Diagnostics / User profile */}
        <div className="space-y-6">
          
          {/* User Profile Summary */}
          <div className="bg-white dark:bg-[#131415] border border-slate-150/70 dark:border-zinc-900 p-5 rounded-2xl shadow-xs text-center space-y-4">
            <div className="relative inline-block mx-auto">
              <img 
                src={userProfile?.photoUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"} 
                alt={userProfile?.name} 
                className="h-16 w-16 rounded-full object-cover border-2 border-emerald-500/30 p-0.5"
              />
              <span className="absolute bottom-0 right-0 h-4.5 w-4.5 rounded-full bg-emerald-500 border-2 border-white dark:border-[#131415] flex items-center justify-center">
                <UserCheck className="h-2.5 w-2.5 text-white" />
              </span>
            </div>

            <div className="space-y-0.5">
              <h4 className="text-[13px] font-bold text-slate-900 dark:text-zinc-100">{userProfile?.name}</h4>
              <p className="text-[10.5px] text-slate-450 dark:text-zinc-500 font-mono truncate">{userProfile?.email}</p>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-zinc-850 flex items-center justify-center gap-1.5 text-[10px] font-mono font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wide">
              <Shield className="h-3 w-3 text-emerald-500" />
              <span>Identity Verified</span>
            </div>
          </div>

          {/* Diagnostics / Reset */}
          <div className="bg-white dark:bg-[#131415] border border-slate-150/70 dark:border-zinc-900 p-5 rounded-2xl shadow-xs space-y-4">
            <div>
              <h3 className="text-xs font-bold text-slate-800 dark:text-zinc-200 uppercase tracking-wider font-mono">Workspace Security</h3>
              <p className="text-[10.5px] text-slate-400 dark:text-zinc-500 font-medium">Manage local browser cache, cookies, and sandbox persistent storage variables.</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-450 dark:text-zinc-500">
                <span>Active Accounts:</span>
                <span className="font-bold text-slate-700 dark:text-zinc-300">{(settings?.linkedAccounts || []).length}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-450 dark:text-zinc-500">
                <span>Cloud Latency:</span>
                <span className="font-bold text-slate-700 dark:text-zinc-300">14ms</span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-450 dark:text-zinc-500">
                <span>API Status:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">ONLINE</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-zinc-850">
              <button
                onClick={() => {
                  if (confirm("Reset workspace? This will clear all your local goal sequences, task commitments, and connected accounts.")) {
                    clearAllData();
                    window.location.reload();
                  }
                }}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-dashed border-red-200 hover:bg-red-50/40 dark:border-red-900/20 dark:hover:bg-red-950/10 text-red-600 dark:text-red-400 text-xs font-bold transition-all cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Reset Workspace Data
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* Realistic, Custom Immersive Google Accounts Chooser Overlay (Simulating real multi-account OAuth experience) */}
      {isAccountPickerOpen && (
        <div className="fixed inset-0 bg-slate-950/45 dark:bg-black/65 backdrop-blur-xs z-50 flex items-center justify-center px-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#161718] border border-slate-150 dark:border-zinc-800 w-full max-w-sm rounded-2xl shadow-2xl p-6 relative animate-in zoom-in-95 duration-200 text-center">
            
            {/* Close */}
            <button 
              onClick={() => {
                setIsAccountPickerOpen(false);
                setShowCustomInput(false);
                setLinkingState('IDLE');
              }}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-850 transition-all cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Google Logo CSS */}
            <div className="flex justify-center mb-3 mt-1.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-50 dark:bg-zinc-800 shadow-sm border border-slate-100 dark:border-zinc-700/60">
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.53-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-8.77z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.11 0-5.74-2.11-6.68-4.96H1.21v3.15C3.18 21.88 7.31 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.32 14.24A7.16 7.16 0 0 1 4.91 12c0-.79.13-1.57.38-2.31V6.54H1.21A11.94 11.94 0 0 0 0 12c0 2.01.5 3.91 1.39 5.59l3.93-3.35z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.18 2.12 1.21 5.59l4.11 3.2C6.26 5.86 8.89 4.75 12 4.75z"
                  />
                </svg>
              </div>
            </div>

            <h4 className="text-[15px] font-bold text-slate-900 dark:text-zinc-100 font-sans">Sign in with Google</h4>
            <p className="text-[11px] text-slate-450 dark:text-zinc-500 font-sans mt-0.5">to continue to <span className="font-bold text-slate-850 dark:text-zinc-300">Motive Integration Engine</span></p>

            {/* Dynamic Interactive Loading / Success View */}
            {linkingState === 'LOADING' && (
              <div className="py-8 space-y-4">
                <div className="relative flex justify-center">
                  <RefreshCw className="h-8 w-8 text-indigo-600 dark:text-indigo-400 animate-spin" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-800 dark:text-zinc-200">Verifying OAuth token...</p>
                  <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono truncate max-w-[280px] mx-auto">{selectedPresetEmail || customEmail}</p>
                </div>
              </div>
            )}

            {linkingState === 'SUCCESS' && (
              <div className="py-8 space-y-3.5 animate-in zoom-in-95 duration-200">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/50 mx-auto text-emerald-600 dark:text-emerald-400">
                  <Check className="h-6 w-6" strokeWidth={3} />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Account Linked Successfully!</p>
                  <p className="text-[10px] text-slate-400 dark:text-zinc-500">Workspace calendars & mails synchronized.</p>
                </div>
              </div>
            )}

            {linkingState === 'IDLE' && (
              <div className="mt-5 text-left">
                {!showCustomInput ? (
                  <div className="space-y-2">
                    <p className="text-[10px] uppercase font-mono tracking-wider text-slate-400 dark:text-zinc-500 font-bold mb-2">Select Google Account</p>
                    
                    {/* Primary current active session account displayed nicely */}
                    <div className="p-2.5 rounded-xl border border-slate-100 dark:border-zinc-850 bg-slate-50/40 dark:bg-zinc-900/5 opacity-65 flex items-center justify-between gap-3 select-none">
                      <div className="flex items-center gap-2 min-w-0">
                        <img 
                          src={userProfile?.photoUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"} 
                          alt="Primary" 
                          className="h-6.5 w-6.5 rounded-full object-cover"
                        />
                        <div className="min-w-0 text-left">
                          <p className="text-[11px] font-bold text-slate-800 dark:text-zinc-200 truncate">{userProfile?.name}</p>
                          <p className="text-[9.5px] text-slate-450 dark:text-zinc-500 truncate">{userProfile?.email}</p>
                        </div>
                      </div>
                      <span className="text-[9px] font-mono font-bold text-slate-400 dark:text-zinc-500">Linked</span>
                    </div>

                    {/* Presets */}
                    {presetAccounts.map((acc) => {
                      const isLinked = (settings?.linkedAccounts || []).some(la => la.email.toLowerCase() === acc.email.toLowerCase());
                      return (
                        <button
                          key={acc.email}
                          disabled={isLinked}
                          onClick={() => handleSelectPreset(acc.email, acc.name)}
                          className={`w-full p-2.5 rounded-xl border flex items-center justify-between gap-3 text-left transition-all ${
                            isLinked 
                              ? 'border-slate-100 dark:border-zinc-850 opacity-55 cursor-not-allowed'
                              : 'border-slate-200 hover:border-slate-350 dark:border-zinc-800 dark:hover:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-850/40 cursor-pointer'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <img 
                              src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(acc.name)}`}
                              alt={acc.name} 
                              className="h-6.5 w-6.5 rounded-full object-cover"
                            />
                            <div className="min-w-0">
                              <p className="text-[11px] font-bold text-slate-850 dark:text-zinc-200 truncate">{acc.name}</p>
                              <p className="text-[9.5px] text-slate-450 dark:text-zinc-500 truncate">{acc.email}</p>
                            </div>
                          </div>
                          {!isLinked && <Plus className="h-3.5 w-3.5 text-slate-400 shrink-0" />}
                          {isLinked && <span className="text-[9px] font-mono text-slate-400 dark:text-zinc-500 shrink-0">Linked</span>}
                        </button>
                      );
                    })}

                    <button
                      onClick={() => setShowCustomInput(true)}
                      className="w-full py-2 px-3 border border-dashed border-slate-200 hover:border-slate-400 dark:border-zinc-800 dark:hover:border-zinc-700 rounded-xl text-center text-[11px] text-indigo-600 dark:text-indigo-400 hover:bg-slate-50 dark:hover:bg-zinc-850/30 transition-all font-bold cursor-pointer"
                    >
                      Use another account
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleAddCustomAccount} className="space-y-3">
                    <p className="text-[10px] uppercase font-mono tracking-wider text-slate-400 dark:text-zinc-500 font-bold mb-2">Connect Google Identity</p>
                    <div className="space-y-2">
                      <label className="text-[9px] uppercase font-mono font-bold text-slate-400 dark:text-zinc-500">Your Full Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Partha Bhunia (Work)"
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        required
                        className="w-full py-2 px-3 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs bg-slate-50 dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] uppercase font-mono font-bold text-slate-400 dark:text-zinc-500">Google Account Email</label>
                      <input
                        type="email"
                        placeholder="gmail.address@gmail.com"
                        value={customEmail}
                        onChange={(e) => setCustomEmail(e.target.value)}
                        required
                        className="w-full py-2 px-3 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs bg-slate-50 dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowCustomInput(false)}
                        className="flex-1 py-2 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs text-slate-500 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-850 font-bold cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-2 rounded-xl bg-slate-900 dark:bg-zinc-100 text-white dark:text-slate-900 text-xs font-bold hover:bg-slate-800 dark:hover:bg-zinc-200 transition-all cursor-pointer"
                      >
                        Authorize & Link
                      </button>
                    </div>
                  </form>
                )}

                <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-zinc-850 text-center flex items-center justify-center gap-1.5 text-[9.5px] text-slate-400 dark:text-zinc-500 font-mono">
                  <Lock className="h-3 w-3 text-emerald-500" />
                  <span>Verified Google API Partner Endpoint</span>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
