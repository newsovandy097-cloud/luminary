
import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Calendar, ChevronLeft, ChevronRight, Loader2, CheckCircle2, History, Trophy, User, BookOpen, Briefcase, PartyPopper, Brain, Heart, Download, LogOut, Award, Target, Camera, Info, Smile, Users, Scale, MessageSquare, Home, Baby, Globe, Atom, Palette, Terminal, Zap, Moon, Sun, MonitorSmartphone, PlusCircle, AlertCircle, RefreshCcw, ArrowUpCircle, Play, Settings2, BarChart3, Laugh, Handshake, HeartHandshake, Lightbulb, Radio, BrainCircuit } from 'lucide-react';
import { jsPDF } from "jspdf";
import { generateDailyLesson } from './services/geminiService';
import { DailyLesson, AppState, Vibe, SimulationFeedback, SkillLevel, SkillNode } from './types';
import { ProgressBar } from './components/ProgressBar';
import { IntroView, VocabularyView, ConceptView, StoryView, ChallengeView, SimulatorView, VocabularyPracticeView, ReviewVaultView, ScrambleText } from './components/LessonViews';
import { SkillTreeView, SKILL_TREE_DATA } from './components/SkillTreeView';

const App = () => {
  const [appState, setAppState] = useState<AppState>(AppState.DASHBOARD);
  const [lesson, setLesson] = useState<DailyLesson | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [streak, setStreak] = useState(0); 
  const [levelXp, setLevelXp] = useState(0);
  const [history, setHistory] = useState<DailyLesson[]>([]);
  const [lastError, setLastError] = useState<string | null>(null);
  
  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showVault, setShowVault] = useState(false);
  const [showSkillTree, setShowSkillTree] = useState(false);

  // Skill Tree State
  const [unlockedNodes, setUnlockedNodes] = useState<string[]>(['core_1']);
  const [spentXp, setSpentXp] = useState(0);
  const [activeNodeId, setActiveNodeId] = useState<string>('core_1');

  // Dashboard Tips State
  const [tipIndex, setTipIndex] = useState(0);

  // Installation State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  // Advanced State for PDF capturing
  const [currentSimLog, setCurrentSimLog] = useState<{ role: string; text: string }[]>([]);
  const [currentFeedback, setCurrentFeedback] = useState<SimulationFeedback | null>(null);

  // Dashboard & Profile State
  const [showProfile, setShowProfile] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  
  // NOTE: selectedVibe and selectedLevel are now derived from the Active Skill Node
  const [selectedTheme, setSelectedTheme] = useState<string>('General');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const tips = [
    "Silence is a power move. Pause before replying to show confidence.",
    "Mirror your partner's body language subtly to build instant rapport.",
    "People forget what you said, but remember how you made them feel.",
    "Ask open-ended questions (Who, What, How) to keep flows alive.",
    "Using a person's name is the sweetest sound to them.",
    "Slow down your speaking pace to appear more authoritative.",
    "Listen to understand, not just to reply.",
    "Palms up gestures signal openness and honesty.",
    "Maintain eye contact for 3-5 seconds to build connection."
  ];

  const getNextReviewTime = (level: number): number => {
      const now = Date.now();
      const day = 24 * 60 * 60 * 1000;
      switch (level) {
          case 0: return now + day;
          case 1: return now + (3 * day);
          case 2: return now + (7 * day);
          case 3: return now + (14 * day);
          case 4: return now + (30 * day);
          default: return now + (90 * day);
      }
  };

  useEffect(() => {
    // Tip Rotation
    const interval = setInterval(() => {
        setTipIndex(prev => (prev + 1) % tips.length);
    }, 8000);

    const savedHistory = localStorage.getItem('luminary_history');
    const savedStats = localStorage.getItem('luminary_stats');
    const savedPhoto = localStorage.getItem('luminary_profile_photo');
    const savedTheme = localStorage.getItem('luminary_theme');
    const savedSkills = localStorage.getItem('luminary_skills');
    
    if (savedPhoto) setProfilePhoto(savedPhoto);
    if (savedTheme === 'dark') setIsDarkMode(true);

    if (savedHistory) {
        try {
            const parsedHistory: DailyLesson[] = JSON.parse(savedHistory);
            setHistory(parsedHistory);
        } catch (e) { console.error(e); }
    }
    if (savedStats) {
        try {
            const stats = JSON.parse(savedStats);
            setStreak(stats.streak || 0);
            setLevelXp(stats.xp || 0);
        } catch (e) { console.error(e); }
    }
    if (savedSkills) {
        try {
            const skills = JSON.parse(savedSkills);
            if (skills.unlocked) setUnlockedNodes(skills.unlocked);
            if (skills.spent) setSpentXp(skills.spent);
            if (skills.active) setActiveNodeId(skills.active);
        } catch(e) { console.error(e); }
    }

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        clearInterval(interval);
    }
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('luminary_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('luminary_theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setIsInstallable(false);
    setDeferredPrompt(null);
  };

  const persistLesson = (newLesson: DailyLesson) => {
      const existingIdx = history.findIndex(h => h.id === newLesson.id);
      let newHistory;
      if (existingIdx > -1) {
          newHistory = [...history];
          newHistory[existingIdx] = newLesson;
      } else {
          newHistory = [newLesson, ...history].slice(0, 50);
      }
      setHistory(newHistory);
      localStorage.setItem('luminary_history', JSON.stringify(newHistory));
      
      const newStreak = streak + 1;
      const newXp = levelXp + 150;
      setStreak(newStreak); setLevelXp(newXp);
      localStorage.setItem('luminary_stats', JSON.stringify({ streak: newStreak, xp: newXp }));
  };

  const handleDeleteLesson = (id: string) => {
    const newHistory = history.filter(h => h.id !== id);
    setHistory(newHistory);
    localStorage.setItem('luminary_history', JSON.stringify(newHistory));
  };

  const handleSrsAction = (word: any, result: 'forgot' | 'remembered') => {
      const newHistory = [...history];
      const lessonIdx = newHistory.findIndex(h => h.id === word.lessonId);
      if (lessonIdx > -1) {
          const vocabIdx = newHistory[lessonIdx].vocabularies.findIndex(v => v.word === word.word);
          if (vocabIdx > -1) {
              const vocab = newHistory[lessonIdx].vocabularies[vocabIdx];
              if (result === 'remembered') {
                  vocab.srsLevel = Math.min((vocab.srsLevel || 0) + 1, 5);
                  setLevelXp(prev => prev + 25);
              } else {
                  vocab.srsLevel = 0;
              }
              vocab.nextReviewDate = getNextReviewTime(vocab.srsLevel);
          }
      }
      setHistory(newHistory);
      localStorage.setItem('luminary_history', JSON.stringify(newHistory));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setProfilePhoto(base64String);
        localStorage.setItem('luminary_profile_photo', base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  // Skill Tree Handlers
  const handleUnlockNode = (nodeId: string, cost: number) => {
      if (!unlockedNodes.includes(nodeId)) {
          const newUnlocked = [...unlockedNodes, nodeId];
          const newSpent = spentXp + cost;
          setUnlockedNodes(newUnlocked);
          setSpentXp(newSpent);
          
          localStorage.setItem('luminary_skills', JSON.stringify({
              unlocked: newUnlocked,
              spent: newSpent,
              active: activeNodeId
          }));
      }
  };

  const handleSelectNode = (node: SkillNode) => {
      setActiveNodeId(node.id);
      localStorage.setItem('luminary_skills', JSON.stringify({
          unlocked: unlockedNodes,
          spent: spentXp,
          active: node.id
      }));
      setShowSkillTree(false);
  };

  const handleDownloadLesson = (lessonData: DailyLesson) => {
    if (!lessonData) return;
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
    doc.setFontSize(22);
    doc.text(lessonData.theme, margin, y);
    y += 8;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`${lessonData.date} | ${lessonData.level.toUpperCase()} Protocol | ${lessonData.vibe.toUpperCase()} Vibe`, margin, y);
    doc.setTextColor(0);
    y += 15;
    
    doc.setLineWidth(0.5);
    doc.line(margin, y - 5, pageWidth - margin, y - 5);

    // 1. Vocabulary
    checkPageBreak(40);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(79, 70, 229); // Indigo
    doc.text("1. VOCABULARY PROTOCOL", margin, y);
    doc.setTextColor(0);
    y += 10;
    
    doc.setFontSize(10);
    lessonData.vocabularies.forEach(v => {
        const wordInfo = `${v.word} (${v.partOfSpeech}) /${v.pronunciation}/`;
        checkPageBreak(15);
        doc.setFont("helvetica", "bold");
        doc.text(wordInfo, margin, y);
        y += 5;
        
        doc.setFont("helvetica", "normal");
        const def = doc.splitTextToSize(`"${v.simpleDefinition}"`, contentWidth);
        checkPageBreak(def.length * 5);
        doc.text(def, margin, y);
        y += (def.length * 5) + 3;

        doc.setFont("helvetica", "italic");
        doc.setTextColor(80);
        const sentence = doc.splitTextToSize(`Ex: ${v.exampleSentences[0]}`, contentWidth - 10);
        checkPageBreak(sentence.length * 5);
        doc.text(sentence, margin + 5, y);
        doc.setTextColor(0);
        y += (sentence.length * 5) + 8;
    });

    // 2. Core Concept
    checkPageBreak(50);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(217, 119, 6); // Amber
    doc.text("2. CORE CONCEPT", margin, y);
    doc.setTextColor(0);
    y += 10;
    
    doc.setFont("times", "bold");
    doc.setFontSize(14);
    doc.text(lessonData.concept.title, margin, y);
    y += 7;
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const explanation = doc.splitTextToSize(lessonData.concept.explanation, contentWidth);
    checkPageBreak(explanation.length * 5);
    doc.text(explanation, margin, y);
    y += (explanation.length * 5) + 5;

    doc.setFont("helvetica", "italic");
    const analogy = doc.splitTextToSize(`Mental Hook: "${lessonData.concept.analogy}"`, contentWidth);
    checkPageBreak(analogy.length * 5);
    doc.text(analogy, margin, y);
    y += (analogy.length * 5) + 10;

    // 3. Narrative
    checkPageBreak(50);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(5, 150, 105); // Emerald
    doc.text("3. NARRATIVE", margin, y);
    doc.setTextColor(0);
    y += 10;
    
    doc.setFont("times", "bold");
    doc.setFontSize(13);
    doc.text(lessonData.story.headline, margin, y);
    y += 7;
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const body = doc.splitTextToSize(lessonData.story.body, contentWidth);
    checkPageBreak(body.length * 5);
    doc.text(body, margin, y);
    y += (body.length * 5) + 5;

    doc.setFont("helvetica", "bold");
    const takeaway = doc.splitTextToSize(`Takeaway: ${lessonData.story.keyTakeaway}`, contentWidth);
    checkPageBreak(takeaway.length * 5);
    doc.text(takeaway, margin, y);
    y += (takeaway.length * 5) + 10;

    // 4. Mission
    checkPageBreak(30);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(147, 51, 234); // Purple
    doc.text("4. MISSION", margin, y);
    doc.setTextColor(0);
    y += 10;
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    const task = doc.splitTextToSize(`Task: ${lessonData.challenge.task}`, contentWidth);
    checkPageBreak(task.length * 5);
    doc.text(task, margin, y);
    y += (task.length * 5) + 5;

    doc.setFont("helvetica", "italic");
    doc.setTextColor(100);
    const tip = doc.splitTextToSize(`Pro Tip: ${lessonData.challenge.tip}`, contentWidth);
    checkPageBreak(tip.length * 5);
    doc.text(tip, margin, y);
    
    doc.save(`Luminary_Log_${lessonData.date.replace(/,/g, '').replace(/ /g, '-')}.pdf`);
  };

  const handleStartLesson = async () => {
    setAppState(AppState.LOADING);
    setLastError(null);
    try {
      // Derive parameters from Active Node
      const activeNode = SKILL_TREE_DATA.find(n => n.id === activeNodeId) || SKILL_TREE_DATA[0];
      const data = await generateDailyLesson(activeNode.targetVibe, activeNode.targetLevel, selectedTheme);
      setLesson(data);
      setStepIndex(0); 
      setCurrentSimLog([]);
      setCurrentFeedback(null);
      persistLesson(data);
      setAppState(AppState.LESSON);
    } catch (e: any) { 
      setLastError(e.message || "An unknown error occurred while contacting Gemini.");
      setAppState(AppState.ERROR); 
    }
  };

  const handleReviewLesson = (pastLesson: DailyLesson) => {
      setLesson(pastLesson);
      setStepIndex(0);
      setAppState(AppState.LESSON);
  };

  const handleNextStep = () => {
    if (stepIndex < 6) setStepIndex(prev => prev + 1);
    else setAppState(AppState.COMPLETED);
  };

  const handleSimComplete = (history: { role: string; text: string }[], feedback: SimulationFeedback) => {
      setCurrentSimLog(history);
      setCurrentFeedback(feedback);
      handleNextStep();
  };

  const renderContent = () => {
    if (!lesson) return null;
    let view;
    switch (stepIndex) {
      case 0: view = <IntroView theme={lesson.theme} level={lesson.level} onNext={handleNextStep} />; break;
      case 1: view = <VocabularyView data={lesson.vocabularies} onNext={handleNextStep} />; break;
      case 2: view = <VocabularyPracticeView words={lesson.vocabularies} onNext={handleNextStep} onSkip={handleNextStep} />; break;
      case 3: view = <ConceptView data={lesson.concept} />; break;
      case 4: view = <SimulatorView data={lesson.simulation} onComplete={handleSimComplete} onSkip={handleNextStep} />; break;
      case 5: view = <StoryView data={lesson.story} />; break;
      case 6: view = <ChallengeView data={lesson.challenge} onComplete={handleNextStep} />; break;
      default: view = null;
    }
    return (
        <div key={stepIndex} className="h-full w-full animate-slide-in-right">
            {view}
        </div>
    );
  };

  const allWordsForVault = history.flatMap(l => l.vocabularies.map(v => ({ ...v, lessonId: l.id })));

  if (showVault) {
      return (
          <div className="fixed inset-0 bg-surface dark:bg-[#0a0a0a] flex items-center justify-center p-4 transition-colors z-50">
              <div className="w-full max-w-2xl h-[90dvh] bg-white dark:bg-[#121212] rounded-[2rem] shadow-3d dark:shadow-3d-dark border border-white/40 dark:border-white/5 relative overflow-hidden">
                <ReviewVaultView 
                  words={allWordsForVault} 
                  lessons={history} 
                  onClose={() => setShowVault(false)} 
                  onSrsAction={handleSrsAction}
                  onDeleteLesson={handleDeleteLesson}
                  onDownloadLesson={handleDownloadLesson}
                />
              </div>
          </div>
      );
  }

  if (showSkillTree) {
      return (
        <div className="fixed inset-0 z-50 bg-black">
            <SkillTreeView 
                unlockedNodes={unlockedNodes}
                totalXp={levelXp}
                spentXp={spentXp}
                onUnlock={handleUnlockNode}
                onSelect={handleSelectNode}
                onClose={() => setShowSkillTree(false)}
                activeNodeId={activeNodeId}
            />
        </div>
      );
  }

  if (showProfile) {
    return (
      <div className="fixed inset-0 bg-surface dark:bg-[#0a0a0a] flex items-center justify-center p-4 transition-colors perspective-container z-50">
        <div className="max-w-md w-full bg-white dark:bg-[#121212] rounded-[2.5rem] shadow-3d dark:shadow-3d-dark border border-white/40 dark:border-white/5 p-6 space-y-6 animate-scale-up">
          <header className="flex items-center justify-between">
            <button onClick={() => setShowProfile(false)} className="p-3 bg-surface dark:bg-white/5 rounded-2xl text-gray-400 hover:text-ink dark:hover:text-white transition-all hover:scale-105 active:scale-95 shadow-slab dark:shadow-slab-dark">
                <ChevronLeft size={20} />
            </button>
            <h1 className="font-serif text-2xl font-black text-ink dark:text-white">Profile</h1>
            <div className="w-10"></div>
          </header>

          <div className="flex flex-col items-center">
             <div className="relative group mb-4">
                <div className="w-32 h-32 bg-surface dark:bg-white/5 rounded-full shadow-slab dark:shadow-slab-dark flex items-center justify-center overflow-hidden border-4 border-white dark:border-[#18181b]">
                   {profilePhoto ? (
                      <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                   ) : (
                      <User size={48} className="text-gray-300 dark:text-white/20" />
                   )}
                </div>
                <button onClick={() => fileInputRef.current?.click()} className="absolute bottom-1 right-1 bg-ink dark:bg-indigo-600 text-white p-2.5 rounded-full shadow-lg hover:scale-110 transition-transform border-2 border-white dark:border-[#18181b]">
                   <Camera size={14} />
                </button>
                <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} className="hidden" accept="image/*" />
             </div>
             <h2 className="font-serif text-3xl font-black text-ink dark:text-white tracking-tight">Luminary</h2>
             <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full bg-surface dark:bg-white/5 text-gray-500 dark:text-gray-400 border border-black/5 dark:border-white/5">
                <Trophy size={12} />
                <span className="text-[10px] font-black uppercase tracking-widest">Lvl {Math.floor(levelXp/1000) + 1}</span>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
             <div className="bg-surface dark:bg-white/5 p-5 rounded-3xl text-center shadow-inner border border-white/50 dark:border-white/5">
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Current Streak</p>
                <p className="font-serif text-3xl font-black text-ink dark:text-white">{streak}</p>
             </div>
             <div className="bg-surface dark:bg-white/5 p-5 rounded-3xl text-center shadow-inner border border-white/50 dark:border-white/5">
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Lifetime XP</p>
                <p className="font-serif text-3xl font-black text-ink dark:text-white">{levelXp}</p>
             </div>
          </div>
        </div>
      </div>
    );
  }

  // Get current Active Node for display
  const activeNodeInfo = SKILL_TREE_DATA.find(n => n.id === activeNodeId);

  if (appState === AppState.DASHBOARD) {
    return (
      <div className="h-[100dvh] bg-surface dark:bg-[#0a0a0a] flex flex-col perspective-container overflow-hidden relative selection:bg-indigo-500 selection:text-white">
        {/* Background Ambience */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-fuchsia-500/10 rounded-full blur-[100px] pointer-events-none"></div>

        {/* Main Container */}
        <div className="flex-1 flex flex-col max-w-md mx-auto w-full p-5 h-full z-10">
          
          {/* Header - HUD Style */}
          <header className="flex justify-between items-end px-2 mb-4 shrink-0">
            <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 dark:text-gray-500 mb-1 ml-1">Daily Protocol</p>
                <h1 className="font-serif text-3xl font-black text-ink dark:text-white tracking-tighter leading-none">Luminary<span className="text-indigo-500">.</span></h1>
            </div>
            <div className="flex items-center gap-3">
               {/* Stats Capsule */}
               <div className="flex items-center bg-white/60 dark:bg-white/5 backdrop-blur-md rounded-full p-1 pl-3 pr-1 shadow-sm border border-white/40 dark:border-white/10">
                   <div className="flex flex-col items-end mr-3 leading-none">
                       <span className="text-[8px] font-black uppercase text-gray-400">Streak</span>
                       <span className="text-sm font-black text-ink dark:text-white font-serif">{streak}</span>
                   </div>
                   <div onClick={() => setShowVault(true)} className="w-8 h-8 rounded-full bg-white dark:bg-[#202023] flex items-center justify-center shadow-md cursor-pointer hover:scale-105 transition-transform text-indigo-500 border border-black/5">
                       <BookOpen size={14} />
                   </div>
               </div>
               
               {/* Theme Toggle */}
               <button onClick={toggleTheme} className="w-10 h-10 rounded-full bg-white/60 dark:bg-white/5 backdrop-blur-md flex items-center justify-center shadow-sm border border-white/40 dark:border-white/10 text-gray-400 hover:text-ink dark:hover:text-white transition-colors">
                  {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
               </button>
            </div>
          </header>

          {/* The Machine - Control Deck */}
          <div className="flex-1 bg-white dark:bg-[#121212] rounded-[2.5rem] shadow-3d dark:shadow-3d-dark border border-white/60 dark:border-white/5 p-1 flex flex-col relative overflow-hidden ring-1 ring-black/5 dark:ring-white/5">
             
             {/* Inner bezel/padding for the 'inset' feel */}
             <div className="absolute inset-0 rounded-[2.5rem] border-[6px] border-surface dark:border-[#1a1a1d] pointer-events-none z-20 opacity-50"></div>
             
             <div className="flex-1 flex flex-col p-5 z-10 gap-5 overflow-y-auto hide-scrollbar">
                
                {/* Intel Feed / Quick Tip */}
                <div key={tipIndex} className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 p-3 rounded-xl flex gap-3 items-center animate-fade-in shadow-sm relative overflow-hidden">
                   {/* Decorative bar */}
                   <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-400/50"></div>
                   <div className="bg-amber-100 dark:bg-amber-800/30 p-1.5 rounded-full text-amber-600 dark:text-amber-400 shrink-0 shadow-inner">
                      <Lightbulb size={12} strokeWidth={3} />
                   </div>
                   <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                         <p className="text-[7px] font-black uppercase text-amber-500 dark:text-amber-500/80 tracking-widest">Tactical Intel</p>
                         <div className="flex gap-0.5">
                            <span className="w-1 h-1 rounded-full bg-amber-400 animate-pulse"></span>
                         </div>
                      </div>
                      <p className="text-xs font-bold text-amber-900 dark:text-amber-100 leading-tight line-clamp-2">{tips[tipIndex]}</p>
                   </div>
                </div>

                {/* NEURAL SKILL TREE ACTIVATION */}
                <div className="space-y-2">
                    <div className="flex justify-between items-center px-1">
                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Active Link</span>
                    </div>
                    <button 
                        onClick={() => setShowSkillTree(true)}
                        className="w-full bg-[#0a0a0a] text-white p-5 rounded-2xl relative overflow-hidden group shadow-lg border border-white/10"
                    >
                        {/* Background Grid inside button */}
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:10px_10px] opacity-50 group-hover:scale-110 transition-transform duration-700"></div>
                        <div className="relative z-10 flex justify-between items-center">
                            <div className="text-left">
                                <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400 mb-1 block">Protocol</span>
                                <span className="text-lg font-black font-serif block">{activeNodeInfo?.label || "Unknown"}</span>
                                <span className="text-[10px] text-gray-400">{activeNodeInfo?.description}</span>
                            </div>
                            <div className="w-12 h-12 rounded-full border border-indigo-500/50 flex items-center justify-center relative bg-indigo-500/10 shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                                <BrainCircuit size={20} className="text-indigo-400 animate-pulse-slow" />
                            </div>
                        </div>
                    </button>
                </div>

                {/* Topics - Tags */}
                <div className="space-y-2">
                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 px-1">Focus Frequency</span>
                    <div className="flex flex-wrap gap-2">
                        {['General', 'Tech', 'Psych', 'Biz', 'Art', 'Sci', 'Phil', 'History'].map(t => (
                            <button 
                                key={t} 
                                onClick={() => setSelectedTheme(t)}
                                className={`flex-1 min-w-[70px] py-2.5 rounded-xl text-[9px] font-black uppercase border transition-all ${selectedTheme === t ? 'bg-ink dark:bg-white text-white dark:text-ink border-ink dark:border-white shadow-lg transform scale-105' : 'bg-surface dark:bg-[#18181b] border-transparent text-gray-400 hover:bg-gray-200 dark:hover:bg-white/5'}`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>
             </div>

             {/* Start Button - The Trigger */}
             <div className="p-5 pt-0 z-10">
                 <button 
                    onClick={handleStartLesson}
                    className="w-full py-5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl font-black uppercase tracking-[0.25em] text-[11px] shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 group relative overflow-hidden border border-white/10"
                 >
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%,100%_100%] bg-[position:-100%_0,0_0] bg-no-repeat transition-[background-position_0s] duration-0 group-hover:bg-[position:200%_0,0_0] group-hover:duration-[1500ms]"></div>
                    <span className="relative z-10">Initialize Session</span>
                    <Play size={14} className="fill-white relative z-10 group-hover:translate-x-1 transition-transform"/>
                 </button>
             </div>

          </div>
        </div>
      </div>
    );
  }

  // Loading View
  if (appState === AppState.LOADING) {
    return (
      <div className="h-[100dvh] bg-surface dark:bg-[#0a0a0a] flex flex-col items-center justify-center p-6 text-center">
        <div className="relative mb-8">
            <div className="w-20 h-20 bg-indigo-600/20 dark:bg-indigo-500/20 rounded-full animate-ping absolute inset-0"></div>
            <div className="w-20 h-20 bg-white dark:bg-[#18181b] rounded-full flex items-center justify-center shadow-3d dark:shadow-3d-dark relative z-10">
                <Loader2 size={32} className="text-indigo-600 dark:text-indigo-400 animate-spin" />
            </div>
        </div>
        <h2 className="text-xl font-serif font-black text-ink dark:text-white mb-2 tracking-tight">
             <ScrambleText text="Curating Intel" />
        </h2>
        <p className="text-gray-400 dark:text-gray-500 font-black uppercase text-[9px] tracking-[0.3em] animate-pulse">Running: {activeNodeInfo?.label || "Core"}</p>
      </div>
    );
  }

  // Error View
  if (appState === AppState.ERROR) {
    return (
      <div className="h-[100dvh] bg-surface dark:bg-[#0a0a0a] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-white dark:bg-[#18181b] text-red-500 rounded-3xl flex items-center justify-center mb-6 shadow-slab dark:shadow-slab-dark">
            <AlertCircle size={24} />
        </div>
        <h2 className="text-xl font-serif font-black text-ink dark:text-white mb-2">Signal Lost</h2>
        <p className="text-gray-500 text-xs max-w-md mb-8 px-4 leading-relaxed">{lastError || "Connection interrupted."}</p>
        <button onClick={handleStartLesson} className="bg-ink dark:bg-white text-white dark:text-ink px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2 shadow-lg hover:-translate-y-1 transition-transform">
           <RefreshCcw size={14} /> Retry
        </button>
        <button onClick={() => setAppState(AppState.DASHBOARD)} className="mt-6 text-gray-400 text-[9px] font-black uppercase tracking-widest hover:text-ink">Cancel</button>
      </div>
    );
  }

  // Completed View
  if (appState === AppState.COMPLETED) {
    return (
      <div className="h-[100dvh] bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-6 text-center relative overflow-hidden perspective-container">
        <div className="relative z-10 flex flex-col items-center animate-scale-up">
            <div className="w-24 h-24 bg-gradient-to-tr from-yellow-400 to-orange-500 rounded-[2rem] flex items-center justify-center text-white mb-6 shadow-[0_20px_50px_rgba(234,88,12,0.4)] rotate-6 transform transition-transform hover:rotate-12 hover:scale-105 border-4 border-white/20">
                <Trophy size={40} fill="currentColor" className="drop-shadow-md" />
            </div>
            <h2 className="text-5xl font-serif font-black mb-4 tracking-tighter leading-none">Session<br/>Complete</h2>
            <div className="flex items-center gap-3 mb-10 bg-white/10 px-8 py-3 rounded-full backdrop-blur-md border border-white/10 shadow-2xl">
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Reward</span>
                <span className="text-xl font-bold">+150 XP</span>
            </div>
            
            <button onClick={() => setAppState(AppState.DASHBOARD)} className="w-full max-w-xs bg-white text-ink py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-105 transition-transform shadow-[0_10px_30px_rgba(255,255,255,0.2)]">
                Return Home
            </button>
        </div>
      </div>
    );
  }

  // Lesson View Container (Floating Slab)
  return (
    <div className="h-[100dvh] bg-surface dark:bg-[#0a0a0a] flex flex-col items-center justify-center p-2 sm:p-4 overflow-hidden perspective-container">
      <div className="w-full max-w-2xl h-full max-h-[95dvh] bg-white dark:bg-[#121212] rounded-[2rem] shadow-3d dark:shadow-3d-dark border border-white/40 dark:border-white/5 flex flex-col relative animate-scale-up">
        
        {/* Lesson Header */}
        <header className="flex justify-between items-center px-6 py-5 shrink-0 z-20">
          <button onClick={() => setAppState(AppState.DASHBOARD)} className="w-8 h-8 bg-surface dark:bg-white/5 rounded-full text-gray-400 hover:text-red-500 flex items-center justify-center transition-colors shadow-pressed dark:shadow-none">
              <LogOut size={14}/>
          </button>
          <div className="flex gap-1.5">
             {[0,1,2,3,4,5,6].map((step) => (
                 <div key={step} className={`h-1 rounded-full transition-all duration-500 ${step <= stepIndex ? 'w-5 bg-indigo-600 dark:bg-indigo-500' : 'w-1 bg-gray-200 dark:bg-white/10'}`}></div>
             ))}
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 px-6 pb-6 overflow-hidden relative flex flex-col min-h-0">
           {renderContent()}
        </div>

        {/* Floating FAB */}
        {stepIndex > 0 && stepIndex < 6 && ![1, 2, 4].includes(stepIndex) && (
          <div className="absolute bottom-6 right-6 z-30">
             <button onClick={handleNextStep} className="bg-ink dark:bg-white text-white dark:text-ink w-14 h-14 rounded-full flex items-center justify-center shadow-3d hover:scale-110 transition-transform active:scale-90">
                 <ChevronRight size={24} />
             </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
