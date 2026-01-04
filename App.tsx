import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Calendar, ChevronLeft, ChevronRight, Loader2, CheckCircle2, History, Trophy, User, BookOpen, Briefcase, PartyPopper, Brain, Heart, Download, LogOut, Award, Target, Camera, Info, Smile, Users, Scale, MessageSquare, Home, Baby, Globe, Atom, Palette, Terminal, Zap, Moon, Sun, MonitorSmartphone, PlusCircle, AlertCircle, RefreshCcw, ArrowUpCircle } from 'lucide-react';
import { jsPDF } from "jspdf";
import { generateDailyLesson } from './services/geminiService';
import { DailyLesson, AppState, Vibe, SimulationFeedback, SkillLevel } from './types';
import { ProgressBar } from './components/ProgressBar';
import { IntroView, VocabularyView, ConceptView, StoryView, ChallengeView, SimulatorView, VocabularyPracticeView } from './components/LessonViews';

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

  // Installation State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  // Advanced State for PDF capturing
  const [currentSimLog, setCurrentSimLog] = useState<{ role: string; text: string }[]>([]);
  const [currentFeedback, setCurrentFeedback] = useState<SimulationFeedback | null>(null);

  // Dashboard & Profile State
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
        } catch (e) { console.error(e); }
    }
    if (savedStats) {
        try {
            const stats = JSON.parse(savedStats);
            setStreak(stats.streak || 0);
            setLevelXp(stats.xp || 0);
            if (stats.selectedLevel) setSelectedLevel(stats.selectedLevel);
        } catch (e) { console.error(e); }
    }

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
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

  const saveProgress = (newLesson: DailyLesson) => {
      const isRevisit = history.some(h => h.id === newLesson.id);
      if (isRevisit) return;
      const newHistory = [newLesson, ...history].slice(0, 20);
      setHistory(newHistory);
      localStorage.setItem('luminary_history', JSON.stringify(newHistory));
      const newStreak = streak + 1;
      const newXp = levelXp + 150;
      setStreak(newStreak); setLevelXp(newXp);
      localStorage.setItem('luminary_stats', JSON.stringify({ streak: newStreak, xp: newXp, selectedLevel }));
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
      console.error("Lesson Start Failure:", e);
      setLastError(e.message || "An unknown error occurred while contacting Gemini.");
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

    doc.setFillColor(26, 26, 26);
    doc.rect(0, 0, 210, 45, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont("times", "bold");
    doc.setFontSize(26);
    doc.text("LUMINARY SESSION SUMMARY", margin, 20);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`DATE: ${lesson.date.toUpperCase()}`, margin, 30);
    doc.text(`VIBE: ${lesson.vibe.toUpperCase()} | LEVEL: ${lesson.level.toUpperCase()}`, margin, 35);

    doc.setTextColor(26, 26, 26);
    y = 60;

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("MASTERED VOCABULARY", margin, y);
    y += 10;
    lesson.vocabularies.forEach((v, i) => {
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text(`${i+1}. ${v.word.toUpperCase()} (${v.partOfSpeech.toLowerCase()})`, margin + 5, y);
        y += 6;
        doc.setFont("helvetica", "italic");
        doc.text(`"${v.simpleDefinition}"`, margin + 10, y);
        y += 8;
        // Handle example sentences array
        if (v.exampleSentences && v.exampleSentences.length > 0) {
           doc.setFontSize(9);
           doc.setFont("helvetica", "normal");
           v.exampleSentences.forEach(ex => {
              doc.text(`• "${ex}"`, margin + 12, y);
              y += 5;
           });
           y += 5;
        } else {
           // Fallback for old data
           doc.text(`"${(v as any).exampleSentence}"`, margin + 10, y);
           y += 10;
        }
    });

    y += 5;
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("COMMUNICATION CONCEPT", margin, y);
    y += 10;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(lesson.concept.title, margin, y);
    y += 6;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const conceptLines = doc.splitTextToSize(lesson.concept.explanation, 170);
    doc.text(conceptLines, margin, y);
    y += (conceptLines.length * 5) + 8;
    doc.setFont("helvetica", "bolditalic");
    doc.text(`Analogy: ${lesson.concept.analogy}`, margin, y);
    y += 8;
    doc.text(`Practice Hooks:`, margin, y);
    y += 6;
    doc.setFont("helvetica", "italic");
    lesson.concept.conversationStarters.forEach(starter => {
      doc.text(`• "${starter}"`, margin + 5, y);
      y += 6;
    });
    y += 10;

    if (y > 220) { doc.addPage(); y = 20; }
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("HISTORICAL INSIGHT", margin, y);
    y += 10;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(lesson.story.headline, margin, y);
    y += 8;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const storyLines = doc.splitTextToSize(lesson.story.body, 170);
    doc.text(storyLines, margin, y);
    y += (storyLines.length * 5) + 8;
    doc.setFont("helvetica", "bolditalic");
    doc.text(`Key Takeaway: ${lesson.story.keyTakeaway}`, margin, y);
    y += 15;

    if (y > 220) { doc.addPage(); y = 20; }
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("SIMULATION DIALOGUE LOG", margin, y);
    y += 10;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const logs = currentSimLog.length > 0 ? currentSimLog : [{role:'system', text:'No simulation log recorded for this session.'}];
    logs.forEach(log => {
        if (y > 270) { doc.addPage(); y = 20; }
        const roleStr = log.role === 'user' ? "YOU: " : "COACH: ";
        const logLines = doc.splitTextToSize(`${roleStr}${log.text}`, 170);
        doc.setFont("helvetica", log.role === 'user' ? "bold" : "normal");
        doc.text(logLines, margin, y);
        y += (logLines.length * 5) + 2;
    });

    if (currentFeedback) {
        y += 10;
        if (y > 250) { doc.addPage(); y = 20; }
        doc.setFillColor(240, 248, 255);
        doc.rect(margin - 5, y - 5, 180, 35, 'F');
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text(`COACH SCORE: ${currentFeedback.score}/10`, margin, y + 5);
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(`FEEDBACK: ${currentFeedback.feedback}`, margin, y + 15);
        doc.setFont("helvetica", "bolditalic");
        doc.text(`SUGGESTION: "${currentFeedback.suggestion}"`, margin, y + 25);
        y += 45;
    }

    if (y > 260) { doc.addPage(); y = 20; }
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("DAILY CHALLENGE", margin, y);
    y += 10;
    doc.setFont("helvetica", "italic");
    doc.text(doc.splitTextToSize(lesson.challenge.task, 170), margin, y);

    doc.save(`Luminary_Report_${lesson.timestamp}.pdf`);
  };

  const handleNextStep = () => {
    if (stepIndex < 6) setStepIndex(prev => prev + 1);
    else {
      if (lesson) saveProgress(lesson);
      setAppState(AppState.COMPLETED);
    }
  };

  const handleSimComplete = (history: { role: string; text: string }[], feedback: SimulationFeedback) => {
      setCurrentSimLog(history);
      setCurrentFeedback(feedback);
      handleNextStep();
  };

  const renderContent = () => {
    if (!lesson) return null;
    switch (stepIndex) {
      case 0: return <IntroView theme={lesson.theme} level={lesson.level} onNext={handleNextStep} />;
      case 1: return <VocabularyView data={lesson.vocabularies} onNext={handleNextStep} />;
      case 2: return <VocabularyPracticeView words={lesson.vocabularies} onNext={handleNextStep} onSkip={handleNextStep} />;
      case 3: return <ConceptView data={lesson.concept} />;
      case 4: return <SimulatorView data={lesson.simulation} onComplete={handleSimComplete} onSkip={handleNextStep} />;
      case 5: return <StoryView data={lesson.story} />;
      case 6: return <ChallengeView data={lesson.challenge} onComplete={handleNextStep} />;
      default: return null;
    }
  };

  if (showProfile) {
    return (
      <div className="min-h-screen bg-surface dark:bg-ink flex items-center justify-center p-4 transition-colors duration-300">
        <div className="max-w-md w-full space-y-8 pb-10 animate-fade-in">
          <header className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => setShowProfile(false)} className="bg-white dark:bg-zinc-800 p-3 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-700 text-gray-400 hover:text-ink dark:hover:text-paper transition-all">
                <ChevronLeft size={20} />
              </button>
              <h1 className="font-serif text-3xl font-black text-ink dark:text-paper">Your Profile</h1>
            </div>
            <button onClick={toggleTheme} className="p-3 bg-white dark:bg-zinc-800 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-700 text-ink dark:text-paper hover:scale-110 transition-transform">
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </header>

          <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-zinc-800 text-center relative overflow-hidden">
             <div className="relative inline-block group">
                <div className="w-32 h-32 bg-gray-100 dark:bg-zinc-800 rounded-[2rem] border-4 border-white dark:border-zinc-700 shadow-xl overflow-hidden flex items-center justify-center">
                   {profilePhoto ? (
                      <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                   ) : (
                      <User size={64} className="text-gray-300 dark:text-zinc-600" />
                   )}
                </div>
                <button onClick={() => fileInputRef.current?.click()} className="absolute bottom-0 right-0 bg-ink dark:bg-indigo-600 text-white p-2.5 rounded-xl shadow-lg hover:bg-indigo-600 dark:hover:bg-indigo-500 transition-all border-2 border-white dark:border-zinc-900">
                   <Camera size={16} />
                </button>
                <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} className="hidden" accept="image/*" />
             </div>
             <h2 className="mt-4 font-serif text-2xl font-black text-ink dark:text-paper">Elite Luminary</h2>
             <p className="text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mt-1">Level {Math.floor(levelXp/1000) + 1}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="bg-white dark:bg-zinc-900 p-5 rounded-3xl border border-gray-100 dark:border-zinc-800 text-center shadow-sm">
                <Trophy size={20} className="mx-auto text-orange-500 mb-2" />
                <p className="text-[10px] text-gray-400 dark:text-zinc-500 font-black uppercase tracking-widest">Streak</p>
                <p className="font-serif text-2xl font-black text-ink dark:text-paper">{streak} Days</p>
             </div>
             <div className="bg-white dark:bg-zinc-900 p-5 rounded-3xl border border-gray-100 dark:border-zinc-800 text-center shadow-sm">
                <Sparkles size={20} className="mx-auto text-indigo-500 mb-2" />
                <p className="text-[10px] text-gray-400 dark:text-zinc-500 font-black uppercase tracking-widest">Total XP</p>
                <p className="font-serif text-2xl font-black text-ink dark:text-paper">{levelXp}</p>
             </div>
          </div>

          {isInstallable && (
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 rounded-[2rem] shadow-lg text-white">
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-white/20 p-3 rounded-2xl"><MonitorSmartphone size={24} /></div>
                <div>
                  <h3 className="font-black text-sm uppercase tracking-widest">Install Luminary</h3>
                  <p className="text-[10px] opacity-90 font-medium">Add to home screen for quick daily access.</p>
                </div>
              </div>
              <button onClick={handleInstallClick} className="w-full bg-white text-emerald-700 py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all">
                <PlusCircle size={16} /> Get Web App
              </button>
            </div>
          )}

          <div className="bg-ink dark:bg-indigo-950/30 text-white p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden border border-white/5 dark:border-indigo-500/20">
             <div className="absolute top-0 right-0 p-4 opacity-10"><Info size={120} /></div>
             <div className="relative">
                <h3 className="flex items-center gap-2 font-black text-xs uppercase tracking-[0.2em] mb-4 text-indigo-400"><Target size={14} /> About Luminary</h3>
                <p className="text-sm font-medium leading-relaxed opacity-80 mb-6">Luminary is designed to be your daily rhetorical coach. In just 15 minutes, we decode the patterns of world-class communicators.</p>
                <div className="pt-4 border-t border-white/10">
                   <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Created By</p>
                   <p className="text-sm font-bold text-white">Sovandy</p>
                </div>
             </div>
          </div>
        </div>
      </div>
    );
  }

  if (appState === AppState.DASHBOARD) {
    return (
      <div className="min-h-screen bg-surface dark:bg-ink flex items-center justify-center p-4 transition-colors duration-300">
        <div className="max-w-md w-full space-y-6 pb-20 scroll-smooth">
          <header className="flex justify-between items-end pb-2">
            <div>
                <p className="text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Elite Expression Lab</p>
                <h1 className="font-serif text-4xl font-black text-ink dark:text-paper">Luminary</h1>
            </div>
            <div className="flex gap-3">
              <button onClick={toggleTheme} className="w-12 h-12 bg-white dark:bg-zinc-800 rounded-2xl flex items-center justify-center border-2 border-gray-100 dark:border-zinc-700 shadow-sm text-ink dark:text-paper transition-all hover:scale-105">
                {isDarkMode ? <Sun size={24} /> : <Moon size={24} />}
              </button>
              <button onClick={() => setShowProfile(true)} className="w-12 h-12 bg-white dark:bg-zinc-800 rounded-2xl flex items-center justify-center border-2 border-gray-100 dark:border-zinc-700 shadow-sm text-gray-400 dark:text-zinc-500 overflow-hidden hover:scale-105 transition-transform">
                  {profilePhoto ? <img src={profilePhoto} className="w-full h-full object-cover" /> : <User size={24} />}
              </button>
            </div>
          </header>

          <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-zinc-800 flex justify-around items-center transition-colors">
             <div className="text-center">
                 <p className="text-[10px] text-gray-400 dark:text-zinc-500 font-black uppercase tracking-widest mb-1">Streak</p>
                 <p className="font-serif text-2xl font-black text-ink dark:text-paper">{streak} <span className="text-xs font-sans text-orange-500">days</span></p>
             </div>
             <div className="w-px h-10 bg-gray-100 dark:bg-zinc-800"></div>
             <div className="text-center">
                 <p className="text-[10px] text-gray-400 dark:text-zinc-500 font-black uppercase tracking-widest mb-1">Knowledge XP</p>
                 <p className="font-serif text-2xl font-black text-ink dark:text-paper">{levelXp}</p>
             </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-gray-400 dark:text-zinc-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
              <Award size={14} /> <span>Skill Intensity</span>
            </h3>
            <div className="flex bg-gray-100 dark:bg-zinc-800 p-1 rounded-2xl gap-1 overflow-x-auto hide-scrollbar">
              {(['noob', 'beginner', 'intermediate', 'advanced', 'master'] as SkillLevel[]).map((lvl) => (
                <button key={lvl} onClick={() => setSelectedLevel(lvl)} className={`flex-1 min-w-[70px] py-2 text-[8px] sm:text-[10px] font-black uppercase rounded-xl transition-all ${selectedLevel === lvl ? 'bg-white dark:bg-zinc-700 text-ink dark:text-paper shadow-md scale-[1.05]' : 'text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300'}`}>
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-gray-400 dark:text-zinc-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
              <Globe size={14} /> <span>Topic Focus</span>
            </h3>
            <div className="flex bg-gray-100 dark:bg-zinc-800 p-1 rounded-2xl gap-1 overflow-x-auto hide-scrollbar">
                {[
                  { id: 'General', icon: Zap },
                  { id: 'History', icon: Globe },
                  { id: 'Science', icon: Atom },
                  { id: 'Art', icon: Palette },
                  { id: 'Tech', icon: Terminal },
                  { id: 'Mindset', icon: Brain },
                ].map((t) => (
                    <button key={t.id} onClick={() => setSelectedTheme(t.id)} className={`flex-1 min-w-[80px] py-2 flex items-center justify-center gap-1.5 text-[8px] sm:text-[10px] font-black uppercase rounded-xl transition-all ${selectedTheme === t.id ? 'bg-white dark:bg-zinc-700 text-ink dark:text-paper shadow-md scale-[1.05]' : 'text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300'}`}>
                      <t.icon size={12} /> {t.id}
                    </button>
                ))}
            </div>
          </div>

          {memoryAnchor && !anchorCompleted && (
              <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-[1.5px] rounded-[2rem] shadow-lg transform transition-all hover:scale-[1.01]">
                  <div className="bg-white dark:bg-zinc-900 p-5 rounded-[calc(2rem-1px)]">
                      <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-black text-[10px] uppercase tracking-widest mb-3"><Brain size={14} /> <span>Daily Recall</span></div>
                      <p className="text-center font-serif text-3xl font-black text-ink dark:text-paper mb-4">{memoryAnchor.word}</p>
                      {!anchorRevealed ? (
                          <button onClick={() => setAnchorRevealed(true)} className="w-full bg-gray-50 dark:bg-zinc-800 text-gray-800 dark:text-paper py-3 rounded-2xl text-sm font-bold border border-gray-100 dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-all uppercase tracking-widest">Reveal</button>
                      ) : (
                          <div className="space-y-4 animate-fade-in">
                              <p className="text-center text-sm text-gray-600 dark:text-zinc-400 italic font-serif leading-relaxed px-4">"{memoryAnchor.definition}"</p>
                              <div className="grid grid-cols-2 gap-2">
                                  <button onClick={() => setAnchorCompleted(true)} className="py-2.5 bg-gray-50 dark:bg-zinc-800 text-gray-400 dark:text-zinc-600 rounded-xl text-[10px] font-black uppercase">Forget</button>
                                  <button onClick={() => { setAnchorCompleted(true); setLevelXp(prev => prev + 50); }} className="py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase shadow-md">Nailed It</button>
                              </div>
                          </div>
                      )}
                  </div>
              </div>
          )}

          <div className="space-y-4">
            <h3 className="text-gray-400 dark:text-zinc-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
              <Target size={14} /> <span>Session Energy</span>
            </h3>
            <div className="grid grid-cols-5 gap-2">
                {[
                    { id: 'social', icon: PartyPopper, color: 'text-pink-600 bg-pink-50 dark:bg-pink-900/30 dark:text-pink-400' },
                    { id: 'professional', icon: Briefcase, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400' },
                    { id: 'intellectual', icon: Brain, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400' },
                    { id: 'charisma', icon: Heart, color: 'text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400' },
                    { id: 'leadership', icon: Users, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400' },
                    { id: 'humorous', icon: Smile, color: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/30 dark:text-yellow-400' },
                    { id: 'empathy', icon: Heart, color: 'text-teal-600 bg-teal-50 dark:bg-teal-900/30 dark:text-teal-400' },
                    { id: 'negotiation', icon: Scale, color: 'text-slate-600 bg-slate-50 dark:bg-slate-900/30 dark:text-slate-400' },
                    { id: 'family', icon: Home, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-400' },
                    { id: 'parenting', icon: Baby, color: 'text-rose-600 bg-rose-50 dark:bg-rose-900/30 dark:text-rose-400' },
                ].map((v) => (
                    <button key={v.id} onClick={() => setSelectedVibe(v.id as Vibe)} className={`p-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-1.5 ${selectedVibe === v.id ? 'border-indigo-600 dark:border-indigo-400 bg-white dark:bg-zinc-800 shadow-lg scale-110 z-10' : 'border-transparent bg-white dark:bg-zinc-900 shadow-sm opacity-70'}`}>
                        <div className={`p-2 rounded-xl ${v.color} border border-transparent shadow-inner`}><v.icon size={16} /></div>
                        <span className="font-black text-[7px] uppercase tracking-tighter text-ink dark:text-paper truncate w-full text-center">{v.id}</span>
                    </button>
                ))}
            </div>
          </div>

          <button onClick={handleStartLesson} className="w-full bg-ink dark:bg-indigo-600 text-white p-6 rounded-[2rem] shadow-2xl flex items-center justify-between group hover:bg-indigo-600 dark:hover:bg-indigo-500 transition-all transform active:scale-95">
            <div className="text-left">
              <h2 className="text-2xl font-serif font-black mb-1">Enter Session</h2>
              <p className="text-white/60 text-[10px] font-black uppercase tracking-widest">{selectedLevel.toUpperCase()} LEVEL • {selectedTheme.toUpperCase()} • {selectedVibe.toUpperCase()}</p>
            </div>
            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center group-hover:bg-white/20 transition-all"><ChevronRight size={28} /></div>
          </button>

          <div className="pt-6">
            <h3 className="text-gray-400 dark:text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-4 flex items-center gap-2"><History size={14}/> <span>Previous Insights</span></h3>
            <div className="space-y-3">
                {history.length === 0 ? (
                    <div className="text-center py-12 text-gray-400 dark:text-zinc-600 bg-white dark:bg-zinc-900 rounded-[2.5rem] border-2 border-dashed border-gray-100 dark:border-zinc-800"><p className="text-[10px] font-black uppercase tracking-widest">Your log is empty</p></div>
                ) : (
                    history.map((item) => (
                        <div key={item.id} onClick={() => handleReviewLesson(item)} className="bg-white dark:bg-zinc-900 p-5 rounded-[1.5rem] border border-gray-100 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all cursor-pointer flex justify-between items-center group">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-serif font-black text-ink dark:text-paper text-lg">{item.theme}</h4>
                                  <span className="text-[8px] font-black px-1.5 py-0.5 bg-gray-100 dark:bg-zinc-800 text-ink dark:text-zinc-400 rounded uppercase">{item.level}</span>
                                </div>
                                <p className="text-[10px] text-gray-400 dark:text-zinc-500 font-bold uppercase tracking-wider">{item.date}</p>
                            </div>
                            <div className="text-indigo-600 dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition-all"><ChevronRight size={20} /></div>
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
      <div className="min-h-screen bg-surface dark:bg-ink flex flex-col items-center justify-center p-6 text-center transition-colors">
        <div className="relative mb-10">
            <div className="w-24 h-24 border-[6px] border-indigo-100 dark:border-zinc-800 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin"></div>
            <Sparkles className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-indigo-600 dark:text-indigo-400" size={32} />
        </div>
        <h2 className="text-4xl font-serif font-black text-ink dark:text-paper mb-2">Designing Vibe</h2>
        <p className="text-gray-500 dark:text-zinc-500 font-black uppercase text-[10px] tracking-[0.4em]">Optimizing {selectedLevel} patterns</p>
      </div>
    );
  }

  if (appState === AppState.ERROR) {
    return (
      <div className="min-h-screen bg-surface dark:bg-ink flex flex-col items-center justify-center p-6 text-center transition-colors">
        <div className="w-24 h-24 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-[2rem] flex items-center justify-center mb-10 shadow-lg">
            <AlertCircle size={48} />
        </div>
        <h2 className="text-4xl font-serif font-black text-ink dark:text-paper mb-4">Connection Failed</h2>
        
        <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2rem] border border-red-100 dark:border-red-900/30 mb-8 max-w-sm w-full shadow-inner text-left">
            <div className="p-4 bg-gray-50 dark:bg-zinc-800 rounded-xl border border-gray-100 dark:border-zinc-700">
               <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Raw Error Log</p>
               <p className="text-[10px] font-mono text-red-400 truncate italic">
                  "{lastError || 'Unknown Error'}"
               </p>
            </div>
        </div>

        <div className="flex flex-col w-full max-w-xs gap-3">
            <button onClick={handleStartLesson} className="bg-ink dark:bg-red-600 text-white px-8 py-5 rounded-3xl font-black uppercase tracking-widest hover:bg-red-600 dark:hover:bg-red-500 transition-all shadow-xl flex items-center justify-center gap-3">
              <RefreshCcw size={20} /> Retry Handshake
            </button>
            <button onClick={() => setAppState(AppState.DASHBOARD)} className="bg-white dark:bg-zinc-800 text-ink dark:text-paper px-8 py-5 rounded-3xl font-black uppercase tracking-widest border border-gray-100 dark:border-zinc-700 shadow-sm transition-all">
              Return Home
            </button>
        </div>
      </div>
    );
  }

  if (appState === AppState.COMPLETED) {
    return (
      <div className="min-h-screen bg-ink dark:bg-black text-white flex flex-col items-center justify-center p-6 text-center animate-fade-in overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-600 via-fuchsia-600 to-indigo-600 animate-gradient-x"></div>
        <div className="w-24 h-24 bg-indigo-600 rounded-[2.5rem] flex items-center justify-center text-white mb-10 shadow-2xl rotate-12"><Trophy size={48} /></div>
        <h2 className="text-5xl font-serif font-black mb-4">Level Up.</h2>
        <p className="text-indigo-200 text-lg mb-12 max-w-sm font-medium">Session complete. You've earned 150 XP towards your next rank.</p>
        <div className="flex flex-col w-full max-w-xs gap-4 relative z-10">
            <button onClick={handleDownloadPDF} className="bg-white/10 text-white px-8 py-5 rounded-3xl font-black uppercase tracking-widest hover:bg-white/20 transition-all border border-white/10 flex items-center justify-center gap-3"><Download size={20} /> Get Full Report</button>
            <button onClick={() => setAppState(AppState.DASHBOARD)} className="bg-white text-ink px-8 py-5 rounded-3xl font-black uppercase tracking-widest hover:bg-indigo-50 transition-all shadow-2xl">Return Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface dark:bg-ink flex flex-col items-center p-4 sm:p-6 overflow-x-hidden transition-colors">
      <div className="w-full max-w-2xl h-full flex flex-col flex-1 relative">
        <header className="flex justify-between items-center mb-8 px-2">
          <button onClick={() => setAppState(AppState.DASHBOARD)} className="bg-white dark:bg-zinc-800 p-3 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-700 text-gray-400 hover:text-red-500 transition-all active:scale-90"><LogOut size={20}/></button>
          <div className="text-center">
             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">{lesson?.vibe} • {lesson?.level}</p>
             <p className="font-serif font-black text-ink dark:text-paper">{lesson?.date}</p>
          </div>
          <div className="w-12 h-2 bg-indigo-50 dark:bg-zinc-800 rounded-full overflow-hidden border border-gray-100 dark:border-zinc-700">
              <div className="h-full bg-indigo-600 dark:bg-indigo-400 transition-all duration-700" style={{ width: `${(stepIndex/6)*100}%` }}></div>
          </div>
        </header>

        <div className="flex-1 bg-white dark:bg-zinc-900 rounded-[3rem] shadow-2xl shadow-indigo-900/10 dark:shadow-black/40 border border-white dark:border-zinc-800 p-6 sm:p-12 mb-8 overflow-y-auto hide-scrollbar relative">
           {renderContent()}
        </div>

        {stepIndex > 0 && stepIndex < 6 && stepIndex !== 1 && stepIndex !== 2 && stepIndex !== 4 && (
          <div className="flex justify-end pb-8">
             <button onClick={handleNextStep} className="bg-ink dark:bg-indigo-600 text-white px-12 py-5 rounded-[1.5rem] font-black uppercase tracking-widest flex items-center gap-3 hover:bg-indigo-600 dark:hover:bg-indigo-500 transition-all shadow-xl transform active:scale-95">Next Segment <ChevronRight size={20} /></button>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;