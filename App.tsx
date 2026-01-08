import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Calendar, ChevronLeft, ChevronRight, Loader2, CheckCircle2, History, Trophy, User, BookOpen, Briefcase, PartyPopper, Brain, Heart, Download, LogOut, Award, Target, Camera, Info, Smile, Users, Scale, MessageSquare, Home, Baby, Globe, Atom, Palette, Terminal, Zap, Moon, Sun, MonitorSmartphone, PlusCircle, AlertCircle, RefreshCcw, ArrowUpCircle, Play, Settings2, BarChart3, Laugh, Handshake, HeartHandshake } from 'lucide-react';
import { jsPDF } from "jspdf";
import { generateDailyLesson } from './services/geminiService';
import { DailyLesson, AppState, Vibe, SimulationFeedback, SkillLevel } from './types';
import { ProgressBar } from './components/ProgressBar';
import { IntroView, VocabularyView, ConceptView, StoryView, ChallengeView, SimulatorView, VocabularyPracticeView, ReviewVaultView, ScrambleText } from './components/LessonViews';

const App = () => {
  const [appState, setAppState] = useState<AppState>(AppState.DASHBOARD);
  const [lesson, setLesson] = useState<DailyLesson | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [streak, setStreak] = useState(0); 
  const [levelXp, setLevelXp] = useState(0);
  const [history, setHistory] = useState<DailyLesson[]>([]);
  const [lastError, setLastError] = useState<string | null>(null);
  
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showVault, setShowVault] = useState(false);

  const [selectedVibe, setSelectedVibe] = useState<Vibe>('social');
  const [selectedLevel, setSelectedLevel] = useState<SkillLevel>('noob');
  const [selectedTheme, setSelectedTheme] = useState<string>('General');
  
  const vibeThemeMap: Record<Vibe, { color1: string, color2: string, color3: string, duration: string, scale: string }> = {
    social: { color1: 'bg-fuchsia-500/20', color2: 'bg-pink-500/20', color3: 'bg-indigo-500/10', duration: '7s', scale: 'scale-110' },
    professional: { color1: 'bg-slate-400/20', color2: 'bg-blue-600/20', color3: 'bg-zinc-500/10', duration: '14s', scale: 'scale-100' },
    intellectual: { color1: 'bg-indigo-600/20', color2: 'bg-blue-800/20', color3: 'bg-violet-900/10', duration: '18s', scale: 'scale-105' },
    charisma: { color1: 'bg-amber-400/25', color2: 'bg-orange-500/20', color3: 'bg-yellow-200/10', duration: '9s', scale: 'scale-125' },
    leadership: { color1: 'bg-yellow-600/20', color2: 'bg-amber-700/20', color3: 'bg-orange-400/10', duration: '11s', scale: 'scale-115' },
    humorous: { color1: 'bg-orange-500/25', color2: 'bg-fuchsia-600/20', color3: 'bg-yellow-400/15', duration: '5s', scale: 'scale-150' },
    empathy: { color1: 'bg-rose-400/20', color2: 'bg-pink-300/20', color3: 'bg-red-400/10', duration: '16s', scale: 'scale-95' },
    negotiation: { color1: 'bg-teal-500/20', color2: 'bg-emerald-600/20', color3: 'bg-cyan-400/10', duration: '12s', scale: 'scale-110' },
    family: { color1: 'bg-green-500/20', color2: 'bg-sky-400/20', color3: 'bg-lime-400/10', duration: '15s', scale: 'scale-100' },
    parenting: { color1: 'bg-cyan-500/20', color2: 'bg-indigo-400/20', color3: 'bg-blue-300/10', duration: '13s', scale: 'scale-105' },
  };

  const currentBiosphere = vibeThemeMap[selectedVibe] || vibeThemeMap.social;

  const vibeOptions: { id: Vibe; icon: any; label: string }[] = [
    { id: 'social', icon: PartyPopper, label: 'Social' },
    { id: 'professional', icon: Briefcase, label: 'Pro' },
    { id: 'intellectual', icon: Brain, label: 'Smart' },
    { id: 'charisma', icon: Sparkles, label: 'Charm' },
    { id: 'leadership', icon: Users, label: 'Lead' },
    { id: 'humorous', icon: Laugh, label: 'Funny' },
    { id: 'empathy', icon: Heart, label: 'Kind' },
    { id: 'negotiation', icon: Handshake, label: 'Deal' },
    { id: 'family', icon: Home, label: 'Kin' },
    { id: 'parenting', icon: Baby, label: 'Parent' },
  ];

  useEffect(() => {
    const savedHistory = localStorage.getItem('luminary_history');
    const savedStats = localStorage.getItem('luminary_stats');
    const savedTheme = localStorage.getItem('luminary_theme');
    
    if (savedTheme === 'dark') setIsDarkMode(true);
    if (savedHistory) {
        try { setHistory(JSON.parse(savedHistory)); } catch (e) {}
    }
    if (savedStats) {
        try {
            const stats = JSON.parse(savedStats);
            setStreak(stats.streak || 0);
            setLevelXp(stats.xp || 0);
            if (stats.selectedLevel) setSelectedLevel(stats.selectedLevel);
        } catch (e) {}
    }
  }, []);

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('luminary_theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const handleDeleteLesson = (id: string) => {
    const newHistory = history.filter(h => h.id !== id);
    setHistory(newHistory);
    localStorage.setItem('luminary_history', JSON.stringify(newHistory));
  };

  const handleDownloadLesson = (lessonData: DailyLesson) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    let y = 20;
    
    const checkPageBreak = (heightNeeded: number) => {
        if (y + heightNeeded > 280) {
            doc.addPage();
            y = 20;
        }
    };

    // Header
    doc.setFont("times", "bold");
    doc.setFontSize(26);
    doc.setTextColor(9, 9, 11);
    doc.text(lessonData.theme, margin, y);
    y += 10;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(113, 113, 122);
    doc.text(`${lessonData.date} | ${lessonData.level.toUpperCase()} PROTOCOL | ${lessonData.vibe.toUpperCase()} VIBE`, margin, y);
    y += 15;
    
    doc.setDrawColor(228, 228, 231);
    doc.line(margin, y - 5, pageWidth - margin, y - 5);

    // 1. Vocabulary
    checkPageBreak(30);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(79, 70, 229);
    doc.text("1. LEXICAL SPECIMENS", margin, y);
    y += 10;
    
    lessonData.vocabularies.forEach(v => {
        checkPageBreak(40);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(9, 9, 11);
        doc.text(v.word, margin, y);
        y += 6;
        
        doc.setFont("helvetica", "italic");
        doc.setFontSize(10);
        doc.setTextColor(113, 113, 122);
        doc.text(`${v.partOfSpeech.toLowerCase()} /${v.pronunciation}/`, margin, y);
        y += 7;

        doc.setFont("times", "normal");
        doc.setFontSize(12);
        doc.setTextColor(39, 39, 42);
        const def = doc.splitTextToSize(`"${v.simpleDefinition}"`, contentWidth);
        doc.text(def, margin, y);
        y += (def.length * 6) + 2;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(79, 70, 229);
        doc.text(v.khmerDefinition, margin, y);
        y += 8;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(82, 82, 91);
        const sentence = doc.splitTextToSize(`Usage: ${v.exampleSentences[0]}`, contentWidth);
        doc.text(sentence, margin, y);
        y += (sentence.length * 5) + 12;
    });

    // 2. Concept
    checkPageBreak(50);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(245, 158, 11);
    doc.text("2. COGNITIVE ANCHOR", margin, y);
    y += 10;
    
    doc.setFont("times", "bold");
    doc.setFontSize(16);
    doc.setTextColor(9, 9, 11);
    doc.text(lessonData.concept.title, margin, y);
    y += 8;
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    const explanation = doc.splitTextToSize(lessonData.concept.explanation, contentWidth);
    doc.text(explanation, margin, y);
    y += (explanation.length * 6) + 8;

    doc.setFont("helvetica", "bolditalic");
    const analogy = doc.splitTextToSize(`Mental Hook: "${lessonData.concept.analogy}"`, contentWidth);
    doc.text(analogy, margin, y);
    y += (analogy.length * 6) + 15;

    // 3. Narrative
    checkPageBreak(60);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(16, 185, 129);
    doc.text("3. THE NARRATIVE", margin, y);
    y += 10;
    
    doc.setFont("times", "bold");
    doc.setFontSize(14);
    doc.setTextColor(9, 9, 11);
    doc.text(lessonData.story.headline, margin, y);
    y += 8;
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    const body = doc.splitTextToSize(lessonData.story.body, contentWidth);
    doc.text(body, margin, y);
    y += (body.length * 6) + 8;

    doc.setFont("helvetica", "bold");
    doc.setTextColor(5, 150, 105);
    const takeaway = doc.splitTextToSize(`SYNAPSE: ${lessonData.story.keyTakeaway}`, contentWidth);
    doc.text(takeaway, margin, y);
    y += (takeaway.length * 6) + 15;

    // 4. Mission
    checkPageBreak(30);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(139, 92, 246);
    doc.text("4. THE MISSION", margin, y);
    y += 10;
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(9, 9, 11);
    const task = doc.splitTextToSize(lessonData.challenge.task, contentWidth);
    doc.text(task, margin, y);
    y += (task.length * 6) + 5;

    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    doc.setTextColor(113, 113, 122);
    doc.text(`Protocol Tip: ${lessonData.challenge.tip}`, margin, y);
    
    doc.save(`Luminary_Log_${lessonData.theme.replace(/\s+/g, '_')}.pdf`);
  };

  const handleStartLesson = async () => {
    setAppState(AppState.LOADING);
    setLastError(null);
    try {
      const data = await generateDailyLesson(selectedVibe, selectedLevel, selectedTheme);
      setLesson(data);
      setStepIndex(0); 
      
      const newHistory = [data, ...history].slice(0, 50);
      setHistory(newHistory);
      localStorage.setItem('luminary_history', JSON.stringify(newHistory));
      
      const newStreak = streak + 1;
      const newXp = levelXp + 150;
      setStreak(newStreak); setLevelXp(newXp);
      localStorage.setItem('luminary_stats', JSON.stringify({ streak: newStreak, xp: newXp, selectedLevel }));

      setAppState(AppState.LESSON);
    } catch (e: any) { 
      setLastError(e.message || "An unknown error occurred.");
      setAppState(AppState.ERROR); 
    }
  };

  const renderContent = () => {
    if (!lesson) return null;
    let view;
    switch (stepIndex) {
      case 0: view = <IntroView theme={lesson.theme} level={lesson.level} onNext={() => setStepIndex(1)} />; break;
      case 1: view = <VocabularyView data={lesson.vocabularies} onNext={() => setStepIndex(2)} />; break;
      case 2: view = <VocabularyPracticeView words={lesson.vocabularies} onNext={() => setStepIndex(3)} onSkip={() => setStepIndex(3)} />; break;
      case 3: view = <ConceptView data={lesson.concept} />; break;
      case 4: view = <SimulatorView data={lesson.simulation} onComplete={() => setStepIndex(5)} onSkip={() => setStepIndex(5)} />; break;
      case 5: view = <StoryView data={lesson.story} />; break;
      case 6: view = <ChallengeView data={lesson.challenge} onComplete={() => setAppState(AppState.COMPLETED)} />; break;
      default: view = null;
    }
    return (
        <div key={stepIndex} className="h-full w-full animate-slide-in-right">
            {view}
        </div>
    );
  };

  if (showVault) {
      return (
          <div className="fixed inset-0 bg-surface dark:bg-[#0a0a0a] flex items-center justify-center p-4 z-50">
              <div className="w-full max-w-2xl h-[90dvh] bg-white dark:bg-[#121212] rounded-[2rem] shadow-3d dark:shadow-3d-dark border border-white/40 dark:border-white/5 relative overflow-hidden">
                <ReviewVaultView 
                  words={history.flatMap(l => l.vocabularies.map(v => ({ ...v, lessonId: l.id })))} 
                  lessons={history} 
                  onClose={() => setShowVault(false)} 
                  onDeleteLesson={handleDeleteLesson}
                  onDownloadLesson={handleDownloadLesson}
                />
              </div>
          </div>
      );
  }

  if (appState === AppState.DASHBOARD) {
    return (
      <div className="h-[100dvh] bg-surface dark:bg-[#0a0a0a] flex flex-col overflow-hidden relative">
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
            <div className={`absolute top-[-20%] left-[-15%] w-[80%] h-[80%] ${currentBiosphere.color1} rounded-full blur-[120px] transition-all duration-[2000ms] animate-pulse-slow ${currentBiosphere.scale}`} style={{ animationDuration: currentBiosphere.duration }}></div>
            <div className={`absolute bottom-[-20%] right-[-15%] w-[80%] h-[80%] ${currentBiosphere.color2} rounded-full blur-[120px] transition-all duration-[2000ms] animate-pulse-slow ${currentBiosphere.scale}`} style={{ animationDuration: currentBiosphere.duration, animationDelay: '-2s' }}></div>
            <div className={`absolute top-[25%] left-[25%] w-[50%] h-[50%] ${currentBiosphere.color3} rounded-full blur-[100px] transition-all duration-[2000ms] animate-pulse-slow`} style={{ animationDuration: `calc(${currentBiosphere.duration} * 1.5)`, animationDelay: '-1s' }}></div>
        </div>

        <div className="flex-1 flex flex-col max-w-md mx-auto w-full p-5 h-full z-10">
          <header className="flex justify-between items-end px-2 mb-4 shrink-0">
            <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 dark:text-gray-500 mb-1 ml-1">Cognitive Unit</p>
                <h1 className="font-serif text-3xl font-black text-ink dark:text-white tracking-tighter leading-none">Luminary<span className="text-indigo-500">.</span></h1>
            </div>
            <div className="flex items-center gap-3">
               <div className="flex items-center bg-white/60 dark:bg-white/5 backdrop-blur-md rounded-full p-1 pl-3 pr-1 shadow-sm border border-white/40 dark:border-white/10">
                   <div className="flex flex-col items-end mr-3 leading-none"><span className="text-[8px] font-black uppercase text-gray-400">Streak</span><span className="text-sm font-black text-ink dark:text-white font-serif">{streak}</span></div>
                   <div onClick={() => setShowVault(true)} className="w-8 h-8 rounded-full bg-white dark:bg-[#202023] flex items-center justify-center shadow-md cursor-pointer hover:scale-105 transition-transform text-indigo-500 border border-black/5"><BookOpen size={14} /></div>
               </div>
               <button onClick={() => setIsDarkMode(!isDarkMode)} className="w-10 h-10 rounded-full bg-white/60 dark:bg-white/5 backdrop-blur-md flex items-center justify-center shadow-sm border border-white/40 dark:border-white/10 text-gray-400 hover:text-ink dark:hover:text-white transition-colors">{isDarkMode ? <Sun size={18} /> : <Moon size={18} />}</button>
            </div>
          </header>

          <div className="flex-1 bg-white/80 dark:bg-[#121212]/90 backdrop-blur-xl rounded-[2.5rem] shadow-3d dark:shadow-3d-dark border border-white/60 dark:border-white/5 p-1 flex flex-col relative overflow-hidden">
             <div className="flex-1 flex flex-col p-6 z-10 gap-6 overflow-y-auto hide-scrollbar">
                <div className="space-y-2">
                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 px-1">Logic Pattern</span>
                    <div className="bg-surface dark:bg-[#0a0a0a]/50 p-1 rounded-2xl shadow-inner border border-black/5 dark:border-white/5 flex relative isolate">
                        {(['noob', 'beginner', 'intermediate', 'advanced', 'master'] as SkillLevel[]).map((lvl) => (
                            <button key={lvl} onClick={() => setSelectedLevel(lvl)} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase transition-all duration-300 relative ${selectedLevel === lvl ? 'bg-white dark:bg-[#252529] text-indigo-600 shadow-sm z-10 scale-100 ring-1 ring-black/5 dark:ring-white/10' : 'text-gray-400 hover:text-gray-600 dark:hover:text-zinc-400'}`}>{lvl === 'intermediate' ? 'Int' : lvl}</button>
                        ))}
                    </div>
                </div>
                <div className="space-y-2 flex-1 min-h-0 flex flex-col">
                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 px-1">Atmosphere</span>
                    <div className="grid grid-cols-5 gap-2.5 h-full content-start">
                        {vibeOptions.map((v) => (
                            <button key={v.id} onClick={() => setSelectedVibe(v.id as Vibe)} className={`aspect-square rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all duration-500 group border relative overflow-hidden ${selectedVibe === v.id ? 'bg-indigo-600 border-indigo-500 shadow-lg shadow-indigo-500/20 translate-y-[-2px]' : 'bg-surface dark:bg-[#18181b] border-transparent hover:bg-gray-100 dark:hover:bg-[#202023]'}`}>
                                <div className={`${selectedVibe === v.id ? 'text-white' : 'text-gray-400 dark:text-gray-500 group-hover:text-indigo-500'}`}><v.icon size={20} strokeWidth={2.5} /></div>
                                <span className={`text-[8px] font-black uppercase ${selectedVibe === v.id ? 'text-indigo-100' : 'text-gray-300 dark:text-gray-600'}`}>{v.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
                <div className="space-y-2">
                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 px-1">Semantic Focus</span>
                    <div className="flex flex-wrap gap-2">
                        {['General', 'Tech', 'Psych', 'Biz', 'Art', 'Sci', 'Phil', 'History'].map(t => (
                            <button key={t} onClick={() => setSelectedTheme(t)} className={`flex-1 min-w-[70px] py-2.5 rounded-xl text-[9px] font-black uppercase border transition-all ${selectedTheme === t ? 'bg-ink dark:bg-white text-white dark:text-ink border-ink dark:border-white shadow-lg transform scale-105' : 'bg-surface dark:bg-[#18181b] border-transparent text-gray-400 hover:bg-gray-200 dark:hover:bg-white/5'}`}>{t}</button>
                        ))}
                    </div>
                </div>
             </div>
             <div className="p-6 pt-0 z-10">
                 <button onClick={handleStartLesson} className="w-full py-5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl font-black uppercase tracking-[0.25em] text-[11px] shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 group relative overflow-hidden border border-white/10">
                    <span className="relative z-10">Synchronize Neural Link</span><Play size={14} className="fill-white relative z-10 group-hover:translate-x-1 transition-transform"/>
                 </button>
             </div>
          </div>
        </div>
      </div>
    );
  }

  if (appState === AppState.LOADING) {
    return (
      <div className="h-[100dvh] bg-surface dark:bg-[#0a0a0a] flex flex-col items-center justify-center p-6 text-center">
        <div className="relative mb-8"><div className="w-20 h-20 bg-indigo-600/20 dark:bg-indigo-500/20 rounded-full animate-ping absolute inset-0"></div><div className="w-20 h-20 bg-white dark:bg-[#18181b] rounded-full flex items-center justify-center shadow-3d relative z-10"><Loader2 size={32} className="text-indigo-600 animate-spin" /></div></div>
        <h2 className="text-xl font-serif font-black text-ink dark:text-white mb-2 tracking-tight"><ScrambleText text="Curating Neural Data" /></h2>
      </div>
    );
  }

  if (appState === AppState.ERROR) {
    return (
      <div className="h-[100dvh] bg-surface dark:bg-[#0a0a0a] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-white dark:bg-[#18181b] text-red-500 rounded-3xl flex items-center justify-center mb-6 shadow-slab"><AlertCircle size={24} /></div>
        <h2 className="text-xl font-serif font-black text-ink dark:text-white mb-2">Sync Interrupted</h2>
        <button onClick={handleStartLesson} className="bg-ink dark:bg-white text-white dark:text-ink px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg transition-transform"><RefreshCcw size={14} /> Re-Initialize</button>
      </div>
    );
  }

  if (appState === AppState.COMPLETED) {
    return (
      <div className="h-[100dvh] bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
        <div className="relative z-10 flex flex-col items-center animate-scale-up">
            <div className="w-24 h-24 bg-gradient-to-tr from-yellow-400 to-orange-500 rounded-[2rem] flex items-center justify-center text-white mb-6 shadow-2xl border-4 border-white/20"><Trophy size={40} fill="currentColor" /></div>
            <h2 className="text-5xl font-serif font-black mb-4 tracking-tighter leading-none">Cognition<br/>Upgraded</h2>
            <div className="flex items-center gap-3 mb-10 bg-white/10 px-8 py-3 rounded-full backdrop-blur-md border border-white/10"><span className="text-xl font-bold">+150 XP</span></div>
            <button onClick={() => setAppState(AppState.DASHBOARD)} className="w-full max-w-xs bg-white text-ink py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl">Return to Orbit</button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] bg-surface dark:bg-[#0a0a0a] flex flex-col items-center justify-center p-2 sm:p-4 overflow-hidden">
      <div 
        className="w-full max-w-2xl h-full max-h-[95dvh] bg-white dark:bg-[#121212] rounded-[2rem] shadow-3d dark:shadow-3d-dark border border-white/40 dark:border-white/5 flex flex-col relative animate-scale-up overflow-hidden"
      >
        <header className="flex justify-between items-center px-6 py-5 shrink-0 z-20 border-b border-gray-100 dark:border-white/5">
          <button onClick={() => setAppState(AppState.DASHBOARD)} className="w-8 h-8 bg-surface dark:bg-white/5 rounded-full text-gray-400 hover:text-red-500 flex items-center justify-center transition-colors"><LogOut size={14}/></button>
          <div className="flex gap-1.5">{[0,1,2,3,4,5,6].map((step) => (<div key={step} className={`h-1 rounded-full transition-all duration-500 ${step <= stepIndex ? 'w-5 bg-indigo-600 dark:bg-indigo-500' : 'w-1 bg-gray-200 dark:bg-white/10'}`}></div>))}</div>
        </header>
        <div className="flex-1 px-6 pb-6 overflow-hidden relative flex flex-col min-h-0">
           {renderContent()}
        </div>
        {stepIndex > 0 && stepIndex < 6 && ![1, 2, 4].includes(stepIndex) && (
          <div className="absolute bottom-6 right-6 z-30">
             <button onClick={() => setStepIndex(stepIndex + 1)} className="bg-ink dark:bg-white text-white dark:text-ink w-14 h-14 rounded-full flex items-center justify-center shadow-3d hover:scale-110 active:scale-90 transition-transform"><ChevronRight size={24} /></button>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;