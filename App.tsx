
import React, { useState, useEffect, useRef } from 'react';
// Added Loader2 to the imports from lucide-react
import { Sparkles, ChevronLeft, ChevronRight, History, Trophy, User, Briefcase, PartyPopper, Brain, Heart, Download, LogOut, Award, Target, Camera, Info, Smile, Users, Scale, Home, Baby, Globe, Atom, Palette, Terminal, Zap, Moon, Sun, MonitorSmartphone, PlusCircle, AlertCircle, RefreshCcw, Loader2 } from 'lucide-react';
import { jsPDF } from "jspdf";
import { generateDailyLesson } from './services/geminiService';
import { DailyLesson, AppState, Vibe, SimulationFeedback, SkillLevel } from './types';
import { IntroView, VocabularyView, ConceptView, StoryView, ChallengeView, SimulatorView, VocabularyPracticeView } from './components/LessonViews';

const App = () => {
  const [appState, setAppState] = useState<AppState>(AppState.DASHBOARD);
  const [lesson, setLesson] = useState<DailyLesson | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [streak, setStreak] = useState(0); 
  const [levelXp, setLevelXp] = useState(0);
  const [history, setHistory] = useState<DailyLesson[]>([]);
  const [lastError, setLastError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [currentSimLog, setCurrentSimLog] = useState<{ role: string; text: string }[]>([]);
  const [currentFeedback, setCurrentFeedback] = useState<SimulationFeedback | null>(null);
  const [selectedVibe, setSelectedVibe] = useState<Vibe>('social');
  const [selectedLevel, setSelectedLevel] = useState<SkillLevel>('noob');
  const [selectedTheme, setSelectedTheme] = useState<string>('General');
  const [memoryAnchor, setMemoryAnchor] = useState<{ word: string; definition: string; id: string } | null>(null);
  const [anchorRevealed, setAnchorRevealed] = useState(false);
  const [anchorCompleted, setAnchorCompleted] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedHistory = localStorage.getItem('luminary_history');
    const savedStats = localStorage.getItem('luminary_stats');
    const savedPhoto = localStorage.getItem('luminary_profile_photo');
    const savedTheme = localStorage.getItem('luminary_theme');
    
    if (savedPhoto) setProfilePhoto(savedPhoto);
    if (savedTheme === 'dark') setIsDarkMode(true);

    if (savedHistory) {
      try {
        const parsedHistory: DailyLesson[] = JSON.parse(savedHistory);
        setHistory(parsedHistory);
        if (parsedHistory.length > 0) {
          const randomLesson = parsedHistory[Math.floor(Math.random() * parsedHistory.length)];
          const randomVocab = randomLesson.vocabularies[Math.floor(Math.random() * randomLesson.vocabularies.length)];
          setMemoryAnchor({ word: randomVocab.word, definition: randomVocab.simpleDefinition, id: randomLesson.id });
        }
      } catch (e) {}
    }
    if (savedStats) {
      try {
        const stats = JSON.parse(savedStats);
        setStreak(stats.streak || 0);
        setLevelXp(stats.xp || 0);
        if (stats.selectedLevel) setSelectedLevel(stats.selectedLevel);
      } catch (e) {}
    }

    const handleInstallPrompt = (e: any) => { e.preventDefault(); setDeferredPrompt(e); setIsInstallable(true); };
    window.addEventListener('beforeinstallprompt', handleInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
  }, []);

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('luminary_theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const handleStartLesson = async () => {
    setAppState(AppState.LOADING);
    setLastError(null);
    try {
      const data = await generateDailyLesson(selectedVibe, selectedLevel, selectedTheme);
      setLesson(data);
      setStepIndex(0); 
      setCurrentSimLog([]);
      setCurrentFeedback(null);
      setAppState(AppState.LESSON);
    } catch (e: any) { 
      setLastError(e.message || "Connection failed");
      setAppState(AppState.ERROR); 
    }
  };

  const handleReviewLesson = (pastLesson: DailyLesson) => {
    setLesson(pastLesson);
    setStepIndex(0);
    setAppState(AppState.LESSON);
  };

  const handleDownloadPDF = () => {
    if (!lesson) return;
    const doc = new jsPDF();
    const margin = 20;
    let y = 30;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("LUMINARY SESSION REPORT", margin, y);
    y += 15;
    doc.setFontSize(12);
    doc.text(`Theme: ${lesson.theme}`, margin, y);
    y += 10;
    doc.text(`Level: ${lesson.level.toUpperCase()}`, margin, y);
    y += 10;
    doc.text(`Date: ${lesson.date}`, margin, y);
    doc.save(`Luminary_${lesson.timestamp}.pdf`);
  };

  const handleNextStep = () => {
    if (stepIndex < 6) setStepIndex(prev => prev + 1);
    else {
      if (lesson) {
        const isRevisit = history.some(h => h.id === lesson.id);
        if (!isRevisit) {
          const newHistory = [lesson, ...history].slice(0, 20);
          setHistory(newHistory);
          localStorage.setItem('luminary_history', JSON.stringify(newHistory));
          const ns = streak + 1; const nx = levelXp + 150;
          setStreak(ns); setLevelXp(nx);
          localStorage.setItem('luminary_stats', JSON.stringify({ streak: ns, xp: nx, selectedLevel }));
        }
      }
      setAppState(AppState.COMPLETED);
    }
  };

  const renderContent = () => {
    if (!lesson) return null;
    switch (stepIndex) {
      case 0: return <IntroView theme={lesson.theme} level={lesson.level} onNext={handleNextStep} />;
      case 1: return <VocabularyView data={lesson.vocabularies} onNext={handleNextStep} />;
      case 2: return <VocabularyPracticeView words={lesson.vocabularies} onNext={handleNextStep} onSkip={handleNextStep} />;
      case 3: return <ConceptView data={lesson.concept} />;
      case 4: return <SimulatorView data={lesson.simulation} onComplete={(h, f) => { setCurrentSimLog(h); setCurrentFeedback(f); handleNextStep(); }} onSkip={handleNextStep} />;
      case 5: return <StoryView data={lesson.story} />;
      case 6: return <ChallengeView data={lesson.challenge} onComplete={handleNextStep} />;
      default: return null;
    }
  };

  if (showProfile) {
    return (
      <div className="min-h-screen bg-surface dark:bg-ink flex items-center justify-center p-4 transition-colors">
        <div className="max-w-md w-full space-y-6">
          <header className="flex items-center justify-between">
            <button onClick={() => setShowProfile(false)} className="bg-white dark:bg-zinc-800 p-3 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-700 text-gray-400">
              <ChevronLeft size={20} />
            </button>
            <h1 className="font-serif text-3xl font-black text-ink dark:text-paper">Profile</h1>
            <button onClick={toggleTheme} className="p-3 bg-white dark:bg-zinc-800 rounded-2xl border border-gray-100 dark:border-zinc-700 text-ink dark:text-paper">
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </header>
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] shadow-sm text-center border border-gray-100 dark:border-zinc-800">
             <div className="relative inline-block">
                <div className="w-32 h-32 bg-gray-100 dark:bg-zinc-800 rounded-[2rem] border-4 border-white dark:border-zinc-700 shadow-xl overflow-hidden flex items-center justify-center">
                   {profilePhoto ? <img src={profilePhoto} className="w-full h-full object-cover" /> : <User size={64} className="text-gray-300" />}
                </div>
                <button onClick={() => fileInputRef.current?.click()} className="absolute bottom-0 right-0 bg-ink dark:bg-indigo-600 text-white p-2.5 rounded-xl border-2 border-white dark:border-zinc-900"><Camera size={16} /></button>
                <input type="file" ref={fileInputRef} onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const r = new FileReader();
                    r.onloadend = () => { setProfilePhoto(r.result as string); localStorage.setItem('luminary_profile_photo', r.result as string); };
                    r.readAsDataURL(file);
                  }
                }} className="hidden" accept="image/*" />
             </div>
             <h2 className="mt-4 font-serif text-2xl font-black text-ink dark:text-paper">Luminary Explorer</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div className="bg-white dark:bg-zinc-900 p-5 rounded-3xl text-center shadow-sm border border-gray-100 dark:border-zinc-800">
                <Trophy size={20} className="mx-auto text-orange-500 mb-2" />
                <p className="text-[10px] text-gray-400 uppercase font-black">Streak</p>
                <p className="font-serif text-2xl font-black text-ink dark:text-paper">{streak} Days</p>
             </div>
             <div className="bg-white dark:bg-zinc-900 p-5 rounded-3xl text-center shadow-sm border border-gray-100 dark:border-zinc-800">
                <Sparkles size={20} className="mx-auto text-indigo-500 mb-2" />
                <p className="text-[10px] text-gray-400 uppercase font-black">XP</p>
                <p className="font-serif text-2xl font-black text-ink dark:text-paper">{levelXp}</p>
             </div>
          </div>
        </div>
      </div>
    );
  }

  if (appState === AppState.DASHBOARD) {
    return (
      <div className="min-h-screen bg-surface dark:bg-ink flex items-center justify-center p-4 transition-colors">
        <div className="max-w-md w-full space-y-6">
          <header className="flex justify-between items-end">
            <div>
              <p className="text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest mb-1">Daily Micro-learning</p>
              <h1 className="font-serif text-4xl font-black text-ink dark:text-paper">Luminary</h1>
            </div>
            <button onClick={() => setShowProfile(true)} className="w-12 h-12 bg-white dark:bg-zinc-800 rounded-2xl flex items-center justify-center border-2 border-gray-100 dark:border-zinc-700 shadow-sm overflow-hidden">
                {profilePhoto ? <img src={profilePhoto} className="w-full h-full object-cover" /> : <User size={24} />}
            </button>
          </header>

          <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-zinc-800 flex justify-around">
             <div className="text-center">
                 <p className="text-[10px] text-gray-400 uppercase font-black mb-1">Streak</p>
                 <p className="font-serif text-2xl font-black text-ink dark:text-paper">{streak}</p>
             </div>
             <div className="text-center">
                 <p className="text-[10px] text-gray-400 uppercase font-black mb-1">Knowledge XP</p>
                 <p className="font-serif text-2xl font-black text-ink dark:text-paper">{levelXp}</p>
             </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Skill Level</h3>
            <div className="flex bg-gray-100 dark:bg-zinc-800 p-1 rounded-2xl gap-1">
              {(['noob', 'beginner', 'intermediate', 'advanced', 'master'] as SkillLevel[]).map((lvl) => (
                <button key={lvl} onClick={() => setSelectedLevel(lvl)} className={`flex-1 py-2 text-[10px] font-black uppercase rounded-xl transition-all ${selectedLevel === lvl ? 'bg-white dark:bg-zinc-700 text-ink dark:text-paper shadow-md' : 'text-gray-400 hover:text-gray-600'}`}>
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Vibe</h3>
            <div className="grid grid-cols-5 gap-2">
                {[
                    { id: 'social', icon: PartyPopper, color: 'text-pink-600' },
                    { id: 'professional', icon: Briefcase, color: 'text-blue-600' },
                    { id: 'intellectual', icon: Brain, color: 'text-emerald-600' },
                    { id: 'charisma', icon: Heart, color: 'text-red-600' },
                    { id: 'leadership', icon: Users, color: 'text-amber-600' },
                ].map((v) => (
                    <button key={v.id} onClick={() => setSelectedVibe(v.id as Vibe)} className={`p-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 ${selectedVibe === v.id ? 'border-indigo-600 bg-white dark:bg-zinc-800 shadow-lg' : 'border-transparent bg-white dark:bg-zinc-900 opacity-70'}`}>
                        <v.icon size={16} className={v.color} />
                        <span className="font-black text-[7px] uppercase text-ink dark:text-paper">{v.id}</span>
                    </button>
                ))}
            </div>
          </div>

          <button onClick={handleStartLesson} className="w-full bg-ink dark:bg-indigo-600 text-white p-6 rounded-[2rem] shadow-2xl flex items-center justify-between group active:scale-95 transition-all">
            <div className="text-left">
              <h2 className="text-2xl font-serif font-black mb-1">Start Session</h2>
              <p className="text-white/60 text-[10px] font-black uppercase tracking-widest">{selectedLevel.toUpperCase()} • {selectedVibe.toUpperCase()}</p>
            </div>
            <ChevronRight size={28} />
          </button>

          <div className="pt-4">
            <h3 className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-4 flex items-center gap-2"><History size={14}/> Previous Insights</h3>
            <div className="space-y-3">
                {history.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 bg-white dark:bg-zinc-900 rounded-[2rem] border-2 border-dashed border-gray-100 dark:border-zinc-800"><p className="text-[10px] font-black uppercase">No history yet</p></div>
                ) : (
                    history.map((item) => (
                        <div key={item.id} onClick={() => handleReviewLesson(item)} className="bg-white dark:bg-zinc-900 p-5 rounded-[1.5rem] border border-gray-100 dark:border-zinc-800 shadow-sm flex justify-between items-center cursor-pointer hover:shadow-md transition-all">
                            <div>
                                <h4 className="font-serif font-black text-ink dark:text-paper">{item.theme}</h4>
                                <p className="text-[10px] text-gray-400 font-bold uppercase">{item.date}</p>
                            </div>
                            <ChevronRight size={16} className="text-gray-300" />
                        </div>
                    ))
                )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (appState === AppState.LOADING) {
    return (
      <div className="min-h-screen bg-surface dark:bg-ink flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="animate-spin text-indigo-600 mb-4" size={48} />
        <h2 className="text-3xl font-serif font-black text-ink dark:text-paper mb-2">Architecting Vibe</h2>
        <p className="text-gray-500 font-black uppercase text-[10px] tracking-widest">Applying {selectedLevel} rhetorical patterns</p>
      </div>
    );
  }

  if (appState === AppState.ERROR) {
    return (
      <div className="min-h-screen bg-surface dark:bg-ink flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-3xl flex items-center justify-center mb-6">
            <AlertCircle size={40} />
        </div>
        <h2 className="text-3xl font-serif font-black text-ink dark:text-paper mb-4">Connection Failed</h2>
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-gray-100 dark:border-zinc-800 mb-8 max-w-sm w-full shadow-inner">
            <p className="text-sm font-bold text-gray-800 dark:text-zinc-200 mb-2">Lesson generation failed.</p>
            <p className="text-xs text-gray-500">Error: {lastError}</p>
        </div>
        <div className="flex flex-col w-full max-w-xs gap-3">
            <button onClick={handleStartLesson} className="bg-ink dark:bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase shadow-xl flex items-center justify-center gap-2">
              <RefreshCcw size={18} /> Retry Connection
            </button>
            <button onClick={() => setAppState(AppState.DASHBOARD)} className="bg-white dark:bg-zinc-800 text-ink dark:text-paper py-4 rounded-2xl font-black uppercase border border-gray-100 dark:border-zinc-700">
              Return Home
            </button>
        </div>
      </div>
    );
  }

  if (appState === AppState.COMPLETED) {
    return (
      <div className="min-h-screen bg-ink text-white flex flex-col items-center justify-center p-6 text-center">
        <Trophy size={64} className="text-indigo-400 mb-6" />
        <h2 className="text-5xl font-serif font-black mb-4">Session Complete</h2>
        <p className="text-indigo-200 mb-10 font-medium">You've unlocked new rhetorical levels.</p>
        <div className="flex flex-col w-full max-w-xs gap-4">
            <button onClick={handleDownloadPDF} className="bg-white/10 text-white py-5 rounded-3xl font-black uppercase tracking-widest border border-white/10 flex items-center justify-center gap-2">
              <Download size={20} /> Get Report
            </button>
            <button onClick={() => setAppState(AppState.DASHBOARD)} className="bg-white text-ink py-5 rounded-3xl font-black uppercase tracking-widest">Return Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface dark:bg-ink flex flex-col items-center p-4 sm:p-6 transition-colors">
      <div className="w-full max-w-2xl flex flex-col flex-1">
        <header className="flex justify-between items-center mb-6">
          <button onClick={() => setAppState(AppState.DASHBOARD)} className="bg-white dark:bg-zinc-800 p-2.5 rounded-xl shadow-sm text-gray-400"><LogOut size={20}/></button>
          <div className="text-center">
             <p className="text-[9px] font-black uppercase text-indigo-600 dark:text-indigo-400">{lesson?.vibe} • {lesson?.level}</p>
             <p className="font-serif font-black text-ink dark:text-paper text-sm">{lesson?.date}</p>
          </div>
          <div className="w-10 h-1.5 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-600 transition-all duration-500" style={{ width: `${(stepIndex/6)*100}%` }}></div>
          </div>
        </header>

        <div className="flex-1 bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-zinc-800 p-6 sm:p-10 mb-6 overflow-y-auto">
           {renderContent()}
        </div>

        {stepIndex > 0 && stepIndex < 6 && stepIndex !== 1 && stepIndex !== 2 && stepIndex !== 4 && (
          <div className="flex justify-end pb-4">
             <button onClick={handleNextStep} className="bg-ink dark:bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black uppercase flex items-center gap-2 shadow-lg active:scale-95 transition-all">Next <ChevronRight size={18} /></button>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
