import React, { useState, useEffect } from 'react';
import { Sparkles, Loader2, Trophy, User, BookOpen, LogOut, ChevronRight, Play, RefreshCcw, AlertCircle, History, XCircle, Star, Brain, Zap, Settings, BarChart3 } from 'lucide-react';
import { generateDailyLesson } from './services/geminiService';
import { DailyLesson, AppState, SimulationFeedback, SkillNode, SkillLevel } from './types';
import { IntroView, VocabularyView, ConceptView, StoryView, ChallengeView, SimulatorView, VocabularyPracticeView, ReviewVaultView, ScrambleText } from './components/LessonViews';
import { SkillTreeView, SKILL_TREE_DATA } from './components/SkillTreeView';

const App = () => {
  // --- App State ---
  const [appState, setAppState] = useState<AppState>(AppState.DASHBOARD);
  
  // --- Progression State ---
  const [totalXp, setTotalXp] = useState(0);
  const [spentXp, setSpentXp] = useState(0);
  const [unlockedNodes, setUnlockedNodes] = useState<string[]>(['core_1']);
  const [activeNodeId, setActiveNodeId] = useState<string>('core_1');
  const [selectedLevel, setSelectedLevel] = useState<SkillLevel>('noob');
  const [streak, setStreak] = useState(0);
  
  // --- Session State ---
  const [lesson, setLesson] = useState<DailyLesson | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [history, setHistory] = useState<DailyLesson[]>([]);
  const [lastError, setLastError] = useState<string | null>(null);
  
  // --- UI State ---
  const [showVault, setShowVault] = useState(false);

  const LEVELS: SkillLevel[] = ['noob', 'beginner', 'intermediate', 'advanced', 'master'];

  // --- Initialization ---
  useEffect(() => {
    document.documentElement.classList.add('dark');
    const savedStats = localStorage.getItem('luminary_v2_stats');
    const savedHistory = localStorage.getItem('luminary_history');

    if (savedStats) {
      try {
        const stats = JSON.parse(savedStats);
        setTotalXp(stats.totalXp || 0);
        setSpentXp(stats.spentXp || 0);
        setStreak(stats.streak || 0);

        const validNodeIds = new Set(SKILL_TREE_DATA.map(n => n.id));
        let safeUnlockedNodes = (stats.unlockedNodes || ['core_1']).filter((id: string) => validNodeIds.has(id));
        if (safeUnlockedNodes.length === 0) safeUnlockedNodes = ['core_1'];
        setUnlockedNodes(safeUnlockedNodes);

        let safeActiveId = stats.activeNodeId;
        if (!validNodeIds.has(safeActiveId) || !safeUnlockedNodes.includes(safeActiveId)) {
            safeActiveId = safeUnlockedNodes[safeUnlockedNodes.length - 1];
        }
        setActiveNodeId(safeActiveId);
        
        const node = SKILL_TREE_DATA.find(n => n.id === safeActiveId);
        if (node) setSelectedLevel(node.targetLevel);

      } catch (e) { 
        setUnlockedNodes(['core_1']);
        setActiveNodeId('core_1');
      }
    }
    if (savedHistory) {
      try { setHistory(JSON.parse(savedHistory)); } catch (e) { console.error(e); }
    }
  }, []);

  const handleNodeSelect = (node: SkillNode) => {
    setActiveNodeId(node.id);
    setSelectedLevel(node.targetLevel);
  };

  useEffect(() => {
    localStorage.setItem('luminary_v2_stats', JSON.stringify({ totalXp, spentXp, unlockedNodes, activeNodeId, streak }));
  }, [totalXp, spentXp, unlockedNodes, activeNodeId, streak]);

  const handleUnlockNode = (nodeId: string, cost: number) => {
    if ((totalXp - spentXp) >= cost) {
      setSpentXp(prev => prev + cost);
      setUnlockedNodes(prev => [...prev, nodeId]);
      const node = SKILL_TREE_DATA.find(n => n.id === nodeId);
      setActiveNodeId(nodeId);
      if (node) setSelectedLevel(node.targetLevel);
    }
  };

  const handleStartLesson = async () => {
    let activeNode = SKILL_TREE_DATA.find(n => n.id === activeNodeId);
    if (!activeNode) activeNode = SKILL_TREE_DATA[0];

    setAppState(AppState.LOADING);
    setLastError(null);
    
    try {
      const data = await generateDailyLesson(activeNode.targetVibe, selectedLevel);
      setLesson(data);
      setStepIndex(0);
      const newHistory = [data, ...history].slice(0, 50);
      setHistory(newHistory);
      localStorage.setItem('luminary_history', JSON.stringify(newHistory));
      setAppState(AppState.LESSON);
    } catch (e: any) {
      setLastError(e.message || "Neural link failed.");
      setAppState(AppState.ERROR);
    }
  };

  const handleCompleteLesson = () => {
     setTotalXp(prev => prev + 250);
     setStreak(prev => prev + 1);
     setAppState(AppState.COMPLETED);
  };

  const handleNextStep = () => {
    if (stepIndex < 6) setStepIndex(prev => prev + 1);
    else handleCompleteLesson();
  };

  const renderLessonContent = () => {
    if (!lesson) return null;
    let view;
    switch (stepIndex) {
      case 0: view = <IntroView theme={lesson.theme} level={lesson.level} onNext={handleNextStep} />; break;
      case 1: view = <VocabularyView data={lesson.vocabularies} onNext={handleNextStep} />; break;
      case 2: view = <VocabularyPracticeView words={lesson.vocabularies} onNext={handleNextStep} onSkip={handleNextStep} />; break;
      case 3: view = <ConceptView data={lesson.concept} />; break;
      case 4: view = <SimulatorView data={lesson.simulation} onComplete={handleNextStep} onSkip={handleNextStep} />; break;
      case 5: view = <StoryView data={lesson.story} />; break;
      case 6: view = <ChallengeView data={lesson.challenge} onComplete={handleNextStep} />; break;
      default: view = null;
    }
    return <div key={stepIndex} className="h-full w-full animate-slide-in-right">{view}</div>;
  };

  const availableXp = totalXp - spentXp;
  const activeNodeData = SKILL_TREE_DATA.find(n => n.id === activeNodeId) || SKILL_TREE_DATA[0];

  if (appState === AppState.DASHBOARD) {
    return (
      <div className="h-[100dvh] bg-[#050505] text-white overflow-hidden relative font-sans flex flex-col selection:bg-indigo-500/30">
        {/* Background Layer */}
        <div className="absolute inset-0 z-0">
             <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse-slow"></div>
             <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-fuchsia-600/10 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
             <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay"></div>
        </div>

        {/* Compact HUD Header */}
        <header className="relative z-20 px-6 py-4 flex justify-between items-center bg-[#050505]/40 backdrop-blur-xl border-b border-white/5">
            <div className="flex items-center gap-4">
                <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-tr from-indigo-500 to-fuchsia-500 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                    <div className="relative w-9 h-9 bg-black rounded-xl flex items-center justify-center border border-white/10">
                        <Brain size={18} className="text-indigo-400" />
                    </div>
                </div>
                <div className="flex flex-col">
                    <h1 className="text-lg font-serif font-black tracking-tight leading-none">Luminary</h1>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="w-1 h-1 bg-indigo-500 rounded-full animate-pulse"></span>
                        <p className="text-[7px] font-black uppercase text-gray-500 tracking-[0.2em]">Neural Core v2.5 Online</p>
                    </div>
                </div>
            </div>
            
            <div className="flex items-center gap-2">
                 <div className="bg-white/5 border border-white/10 rounded-2xl px-3 py-1.5 flex items-center gap-3">
                     <div className="flex flex-col items-center">
                         <span className="text-[6px] font-black uppercase text-gray-500 leading-none">XP</span>
                         <span className="text-xs font-bold text-white font-mono">{availableXp}</span>
                     </div>
                     <div className="w-px h-6 bg-white/10"></div>
                     <div className="flex flex-col items-center">
                         <span className="text-[6px] font-black uppercase text-gray-500 leading-none">Streak</span>
                         <span className="text-xs font-bold text-indigo-400 font-mono">{streak}d</span>
                     </div>
                 </div>
                 <button onClick={() => setShowVault(true)} className="w-9 h-9 bg-white/5 border border-white/10 rounded-full flex items-center justify-center hover:bg-white/10 transition-all active:scale-95 group">
                     <History size={16} className="text-gray-400 group-hover:text-white transition-colors" />
                 </button>
            </div>
        </header>

        {/* Constellation Workspace */}
        <main className="flex-1 relative z-10 min-h-0 bg-transparent">
            <SkillTreeView 
                unlockedNodes={unlockedNodes} 
                availableXp={availableXp} 
                activeNodeId={activeNodeId}
                onSelect={handleNodeSelect}
                onUnlock={handleUnlockNode}
            />
        </main>

        {/* HUD Footer: Selection & Control */}
        <footer className="relative z-20 p-5 bg-gradient-to-t from-[#050505] via-[#050505]/90 to-transparent">
             <div className="max-w-md mx-auto w-full space-y-4">
                 <div className="bg-[#121212]/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-4 shadow-2xl">
                     <div className="flex justify-between items-end mb-4">
                        <div className="space-y-0.5">
                           <span className="text-[7px] font-black text-indigo-400 uppercase tracking-[0.3em]">Node Selected</span>
                           <h3 className="text-lg font-serif font-black text-white">{activeNodeData.label}</h3>
                        </div>
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-500/10 rounded-full border border-indigo-500/20">
                           <Zap size={10} className="text-indigo-400" />
                           <span className="text-[8px] font-black text-indigo-300 uppercase tracking-widest">{activeNodeData.targetVibe}</span>
                        </div>
                     </div>

                     <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-[7px] font-black uppercase text-gray-500 tracking-widest">Neural Intensity</span>
                            <span className="text-[8px] font-black text-indigo-400 uppercase">{selectedLevel}</span>
                        </div>
                        <div className="flex bg-black/40 p-1 rounded-xl border border-white/5 gap-1">
                            {LEVELS.map((lvl) => (
                                <button
                                    key={lvl}
                                    onClick={() => setSelectedLevel(lvl)}
                                    className={`flex-1 py-1.5 rounded-lg text-[7px] font-black uppercase transition-all duration-300 ${
                                        selectedLevel === lvl 
                                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                                        : 'text-gray-600 hover:text-gray-400'
                                    }`}
                                >
                                    {lvl.slice(0, 3)}
                                </button>
                            ))}
                        </div>
                     </div>
                 </div>

                 <button 
                    onClick={handleStartLesson}
                    className="w-full py-4.5 bg-white text-black rounded-3xl font-black uppercase tracking-[0.2em] text-[10px] shadow-[0_0_40px_rgba(255,255,255,0.15)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 group relative overflow-hidden"
                 >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    <span className="relative">Sync Neural Link</span> 
                    <ChevronRight size={14} className="relative group-hover:translate-x-1 transition-transform"/>
                 </button>
             </div>
        </footer>

        {showVault && (
            <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
               <div className="w-full max-w-2xl h-[90vh] bg-[#121212] rounded-[2rem] border border-white/10 overflow-hidden relative shadow-2xl">
                   <ReviewVaultView 
                      words={history.flatMap(l => l.vocabularies.map(v => ({...v, lessonId: l.id})))} 
                      lessons={history} 
                      onClose={() => setShowVault(false)}
                   />
               </div>
            </div>
        )}
      </div>
    );
  }

  // --- Intermediate States ---
  if (appState === AppState.LOADING) {
      return (
          <div className="h-[100dvh] bg-[#050505] flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
               <div className="w-24 h-24 relative mb-10">
                   <div className="absolute inset-0 bg-indigo-500/20 rounded-full animate-ping"></div>
                   <div className="w-full h-full bg-[#121212] rounded-full flex items-center justify-center border border-white/10 shadow-[0_0_40px_rgba(79,70,229,0.2)] relative z-10">
                       <Loader2 size={32} className="text-indigo-400 animate-spin" />
                   </div>
               </div>
               <h2 className="text-2xl font-serif font-black text-white mb-3">
                   <ScrambleText text="Calibrating Neural Sync..." />
               </h2>
               <div className="px-5 py-2 bg-white/5 rounded-full border border-white/10">
                    <p className="text-[8px] font-black uppercase text-indigo-300 tracking-[0.3em]">{activeNodeData.label} • {selectedLevel.toUpperCase()}</p>
               </div>
          </div>
      );
  }

  if (appState === AppState.ERROR) {
      return (
          <div className="h-[100dvh] bg-[#050505] flex flex-col items-center justify-center p-8 text-center relative">
              <div className="w-20 h-20 bg-red-950/30 rounded-full flex items-center justify-center border border-red-500/20 mb-8">
                  <AlertCircle size={32} className="text-red-500" />
              </div>
              <h2 className="text-2xl font-serif font-black text-white mb-4">Neural Disconnect</h2>
              <p className="text-sm text-gray-500 mb-10 max-w-xs">{lastError || "Protocol failure in sector 7."}</p>
              <button onClick={() => setAppState(AppState.DASHBOARD)} className="px-10 py-4 bg-white text-black rounded-full font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-transform shadow-xl">
                  Re-Initialize
              </button>
          </div>
      );
  }

  if (appState === AppState.COMPLETED) {
      return (
          <div className="h-[100dvh] bg-[#050505] flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
             <div className="relative z-10 flex flex-col items-center animate-scale-up">
                 <div className="w-24 h-24 bg-gradient-to-tr from-indigo-500 to-fuchsia-600 rounded-[2.5rem] flex items-center justify-center text-white mb-10 shadow-[0_0_60px_rgba(99,102,241,0.3)] rotate-12 border border-white/20">
                     <Trophy size={40} strokeWidth={2.5} />
                 </div>
                 <h2 className="text-5xl font-serif font-black text-white mb-3 tracking-tighter">Node<br/>Aligned</h2>
                 <div className="bg-indigo-500/10 backdrop-blur-md px-10 py-4 rounded-3xl border border-indigo-500/20 mb-14">
                     <span className="text-indigo-400 font-black text-2xl font-mono tracking-tighter">+250 XP</span>
                 </div>
                 <button 
                    onClick={() => setAppState(AppState.DASHBOARD)} 
                    className="px-12 py-5 bg-white text-black rounded-full font-black uppercase tracking-widest text-[10px] hover:scale-[1.02] transition-transform shadow-2xl"
                 >
                    Return to Orbit
                 </button>
             </div>
          </div>
      );
  }

  return (
    <div className="h-[100dvh] bg-[#050505] flex flex-col items-center justify-center p-3 sm:p-5 perspective-container relative overflow-hidden">
         <div className="w-full max-w-2xl h-full max-h-[95dvh] bg-[#121212]/95 backdrop-blur-2xl rounded-[3rem] shadow-2xl flex flex-col relative animate-scale-up z-10 border border-white/10">
            <header className="flex justify-between items-center px-8 py-6 shrink-0 z-20 border-b border-white/5">
                <button onClick={() => setAppState(AppState.DASHBOARD)} className="w-10 h-10 rounded-full bg-white/5 text-gray-500 hover:text-white flex items-center justify-center transition-all border border-white/5">
                    <LogOut size={16}/>
                </button>
                <div className="flex gap-2">
                    {[0,1,2,3,4,5,6].map((step) => (
                        <div key={step} className={`h-1 rounded-full transition-all duration-700 ${step <= stepIndex ? 'w-6 bg-indigo-500' : 'w-1 bg-white/10'}`}></div>
                    ))}
                </div>
                <div className="w-10"></div>
            </header>
            <div className="flex-1 px-8 pb-8 overflow-hidden relative flex flex-col min-h-0 text-white">
                {renderLessonContent()}
            </div>
            {stepIndex > 0 && stepIndex < 6 && ![1, 2, 4].includes(stepIndex) && (
                <div className="absolute bottom-8 right-8 z-30">
                    <button onClick={handleNextStep} className="bg-white text-black w-14 h-14 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all">
                        <ChevronRight size={24} strokeWidth={3} />
                    </button>
                </div>
            )}
         </div>
    </div>
  );
};

export default App;