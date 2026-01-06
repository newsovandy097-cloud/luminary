import React, { useState, useEffect, useRef } from 'react';
import { Vocabulary, Concept, Story, Challenge, Simulation, SimulationFeedback, DailyLesson } from '../types';
import { BookOpen, MessageCircle, Lightbulb, Brain, Volume2, Sparkles, ArrowRight, PlayCircle, Loader2, Send, User, CheckCircle2, ChevronLeft, ChevronRight, PenTool, XCircle, Mic, MicOff, RefreshCw, Layers, Check, History, Target, Zap, Anchor, Wand2, Info, MessageSquareQuote, Radio, GripVertical, Award, Star, Filter, Flame, Trophy, Search, FileText, Activity, Box, Play, Eye, Trash2, Download } from 'lucide-react';
import { playTextToSpeech, evaluateSimulation, getGrammarHint, getSimSuggestion, getSimulationReply } from '../services/geminiService';

// --- Animation Components ---

export const ScrambleText: React.FC<{ text: string, className?: string }> = ({ text, className }) => {
  const [display, setDisplay] = useState(text);
  
  useEffect(() => {
    let iterations = 0;
    const interval = setInterval(() => {
      setDisplay(prev => text.split('').map((char, index) => {
        if (index < iterations) return char;
        if (char === ' ') return ' ';
        return "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()"[Math.floor(Math.random() * 40)];
      }).join(''));
      
      if (iterations >= text.length) clearInterval(interval);
      iterations += 1/2; // Speed control
    }, 40);
    return () => {
      clearInterval(interval);
      setDisplay(text);
    };
  }, [text]);

  return <span className={className}>{display}</span>;
};

export const HoloCard: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className }) => {
   const ref = useRef<HTMLDivElement>(null);
   const [style, setStyle] = useState<React.CSSProperties>({});

   const handleMove = (e: React.MouseEvent) => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const rotateX = ((y - cy) / cy) * -3; // Max 3 deg
      const rotateY = ((x - cx) / cx) * 3;

      setStyle({
         transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.01, 1.01, 1.01)`,
         transition: 'transform 0.1s ease-out'
      });
   };

   const handleLeave = () => {
      setStyle({ transform: 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)', transition: 'transform 0.5s ease-out' });
   }

   return <div ref={ref} onMouseMove={handleMove} onMouseLeave={handleLeave} style={style} className={`${className} transition-transform`}>{children}</div>
};

export const DopamineBurst: React.FC = () => {
    const particles = Array.from({length: 24});
    return (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-[100] overflow-hidden">
           {particles.map((_, i) => {
               const angle = (i / particles.length) * 360;
               const distance = 150 + Math.random() * 150;
               const tx = Math.cos(angle * Math.PI / 180) * distance + 'px';
               const ty = Math.sin(angle * Math.PI / 180) * distance + 'px';
               const color = ['bg-indigo-500', 'bg-fuchsia-500', 'bg-yellow-400', 'bg-emerald-400'][Math.floor(Math.random() * 4)];
               return <div key={i} className={`absolute w-2 h-2 rounded-full ${color} animate-particle opacity-0`} style={{ '--tx': tx, '--ty': ty } as any}></div>
           })}
        </div>
    )
}

// --- Views ---

export const IntroView: React.FC<{ theme: string; level: string; onNext: () => void }> = ({ theme, level, onNext }) => (
  <div className="flex flex-col items-center justify-center h-full text-center space-y-6 p-2">
    <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 dark:bg-white/5 text-indigo-600 dark:text-indigo-400 rounded-full text-[9px] font-black tracking-[0.2em] uppercase border border-indigo-100 dark:border-white/5 shadow-sm">
      <Sparkles size={10} />
      {level} Protocol
    </div>
    
    <h1 className="text-4xl sm:text-6xl font-serif font-black text-ink dark:text-white leading-[0.9] tracking-tighter drop-shadow-lg">
      <ScrambleText text={theme} />
    </h1>
    
    <div className="w-12 h-1 bg-indigo-600 dark:bg-indigo-500 rounded-full"></div>

    <p className="text-gray-500 dark:text-zinc-400 text-sm sm:text-base max-w-xs mx-auto font-medium leading-relaxed">
      Three words. One concept. One sim. <br/><span className="text-ink dark:text-white font-bold">15 minutes.</span>
    </p>

    <div className="pt-6">
      <button 
        onClick={onNext}
        className="group relative inline-flex items-center justify-center px-8 py-4 font-black text-white transition-all duration-300 bg-ink dark:bg-white dark:text-ink rounded-2xl hover:-translate-y-1 active:scale-95 shadow-3d dark:shadow-3d-dark tracking-widest uppercase text-[10px]"
      >
        <span>Initialize</span>
        <ArrowRight className="ml-2 w-3 h-3 group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  </div>
);

export const VocabularyView: React.FC<{ data: Vocabulary[]; onNext: () => void }> = ({ data, onNext }) => {
  const [index, setIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const current = data[index];

  const handlePlay = async () => {
    if (isPlaying) return;
    setIsPlaying(true);
    try { await playTextToSpeech(current.word); } finally { setIsPlaying(false); }
  };

  const nextWord = () => {
    if (index < data.length - 1) setIndex(index + 1);
    else onNext();
  };

  return (
  <div className="h-full flex flex-col">
    <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 font-black uppercase tracking-[0.2em] text-[9px]">
            <BookOpen size={12} />
            <span>Word {index + 1}/{data.length}</span>
        </div>
        <div className="flex gap-1">
            {data.map((_, i) => (
                <div key={i} className={`h-1 w-3 rounded-full transition-all duration-500 ${i === index ? 'bg-indigo-600 dark:bg-indigo-400 w-6' : 'bg-gray-200 dark:bg-white/10'}`}></div>
            ))}
        </div>
    </div>
    
    <div className="flex-1 flex flex-col min-h-0 space-y-4 overflow-y-auto hide-scrollbar pb-4">
      {/* 3D Card for Word */}
      <HoloCard className="bg-surface dark:bg-white/5 p-5 rounded-[1.5rem] shadow-slab dark:shadow-slab-dark border border-white/50 dark:border-white/5 relative group shrink-0">
          <div className="absolute top-4 right-4 z-20">
             <button onClick={(e) => { e.stopPropagation(); handlePlay(); }} disabled={isPlaying} className="w-10 h-10 bg-white dark:bg-black text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center hover:scale-105 transition-transform active:scale-95 shadow-md">
                {isPlaying ? <Loader2 size={16} className="animate-spin" /> : <Volume2 size={16} />}
             </button>
          </div>
          
          <h2 className="text-4xl font-serif font-black text-ink dark:text-white tracking-tighter leading-none mb-2 relative z-10">{current.word}</h2>
          <div className="flex items-center gap-2 mb-4 relative z-10">
              <span className="text-[10px] font-serif italic text-gray-400 dark:text-zinc-500">{current.partOfSpeech.toLowerCase()}</span>
              <span className="w-0.5 h-0.5 bg-gray-300 rounded-full"></span>
              <span className="text-[10px] font-mono text-gray-400 dark:text-zinc-500">/{current.pronunciation}/</span>
          </div>

          <div className="p-4 bg-white/50 dark:bg-black/20 rounded-xl border border-white/40 dark:border-white/5 space-y-3 relative z-10">
              <p className="text-sm font-serif italic text-gray-600 dark:text-zinc-300 leading-snug">
                  "{current.simpleDefinition}"
              </p>
              <div className="h-px w-full bg-black/5 dark:bg-white/5"></div>
              <p className="text-base font-khmer text-indigo-900 dark:text-indigo-300 font-bold leading-relaxed opacity-90">
                  {current.khmerDefinition}
              </p>
          </div>
      </HoloCard>

      {/* Brain Glue - Glass Effect */}
      <div className="bg-gradient-to-br from-violet-500/5 to-fuchsia-500/5 p-4 rounded-xl border border-violet-100/50 dark:border-white/5 relative overflow-hidden backdrop-blur-sm shadow-sm shrink-0">
         <div className="relative z-10">
            <span className="text-[8px] font-black uppercase tracking-widest text-violet-600 dark:text-violet-400 mb-0.5 block">Memory Hook</span>
            <p className="text-xs font-serif italic font-medium text-ink dark:text-white">"{current.mnemoLink}"</p>
         </div>
      </div>

      {/* Usage */}
      <div className="space-y-2 px-1 pb-2">
          <h3 className="text-[8px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest">Contextual Usage</h3>
          <div className="space-y-2">
            {(current.exampleSentences || [(current as any).exampleSentence]).slice(0, 3).map((sentence: string, idx: number) => (
                <div key={idx} className="pl-3 border-l-2 border-indigo-200 dark:border-indigo-900">
                    <p className="text-xs text-gray-600 dark:text-zinc-400 italic leading-snug">"{sentence}"</p>
                </div>
            ))}
          </div>
      </div>
    </div>

    <div className="pt-2 mt-auto shrink-0">
        <button onClick={nextWord} className="w-full bg-ink dark:bg-white text-white dark:text-ink py-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:-translate-y-1 transition-transform shadow-3d dark:shadow-3d-dark active:scale-95 text-[10px]">
            {index < data.length - 1 ? "Next Word" : "Enter Practice"}
            <ArrowRight size={14} />
        </button>
    </div>
  </div>
  );
};

export const VocabularyPracticeView: React.FC<{ words: Vocabulary[]; onNext: () => void; onSkip: () => void }> = ({ words, onNext, onSkip }) => {
    const [wordIdx, setWordIdx] = useState(0);
    const [scrambledWords, setScrambledWords] = useState<{id: number, text: string}[]>([]);
    const [selectedWords, setSelectedWords] = useState<{id: number, text: string}[]>([]);
    const [correctOrder, setCorrectOrder] = useState<string[]>([]);
    const [puzzleSolved, setPuzzleSolved] = useState(false);
    const [isWrong, setIsWrong] = useState(false);
    const [hintText, setHintText] = useState<string | null>(null);
    const [isGettingHint, setIsGettingHint] = useState(false);

    const current = words[wordIdx];

    useEffect(() => {
        const sentence = current.exampleSentences?.[0] || (current as any).exampleSentence;
        const cleanSentence = sentence.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
        const parts = cleanSentence.split(/\s+/).filter(Boolean);
        setCorrectOrder(parts);

        const items = parts.map((w: string, i: number) => ({ id: i, text: w }));
        for (let i = items.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [items[i], items[j]] = [items[j], items[i]];
        }
        setScrambledWords(items);
        setSelectedWords([]);
        setPuzzleSolved(false);
        setIsWrong(false);
        setHintText(null);
    }, [wordIdx, current]);

    const handleWordClick = (item: {id: number, text: string}, fromScramble: boolean) => {
        setIsWrong(false);
        if (fromScramble) {
            setScrambledWords(prev => prev.filter(w => w.id !== item.id));
            setSelectedWords(prev => [...prev, item]);
        } else {
            setSelectedWords(prev => prev.filter(w => w.id !== item.id));
            setScrambledWords(prev => [...prev, item]);
        }
    };

    const handleCheck = () => {
        const currentSentence = selectedWords.map(w => w.text).join(' ');
        const targetSentence = correctOrder.join(' ');
        if (currentSentence.toLowerCase() === targetSentence.toLowerCase()) {
            setPuzzleSolved(true);
            playTextToSpeech(currentSentence);
        } else {
            setIsWrong(true);
            setTimeout(() => setIsWrong(false), 500);
        }
    };

    const handleHint = async () => {
        if (isGettingHint || puzzleSolved) return;
        setIsGettingHint(true);
        try {
            const fragmentHistory = selectedWords.map(w => w.text);
            const smartHint = await getGrammarHint(current.word, current.simpleDefinition, fragmentHistory, correctOrder);
            setHintText(smartHint);
        } finally {
            setIsGettingHint(false);
        }
    };

    return (
        <div className="h-full flex flex-col space-y-4 relative">
             {puzzleSolved && <DopamineBurst />}
             <div className="flex items-center justify-between shrink-0">
                <div className="flex items-center space-x-2 text-fuchsia-600 dark:text-fuchsia-400 font-black uppercase tracking-[0.2em] text-[9px]">
                    <Layers size={12} />
                    <span>Puzzle {wordIdx + 1}/{words.length}</span>
                </div>
                <div className="flex gap-3">
                  <button onClick={handleHint} disabled={isGettingHint || puzzleSolved} className="text-[9px] font-black uppercase text-amber-500 flex items-center gap-1">
                    {isGettingHint ? <Loader2 size={10} className="animate-spin" /> : <Wand2 size={10} />} Hint
                  </button>
                  <button onClick={onSkip} className="text-[9px] font-black uppercase text-gray-400 hover:text-ink dark:hover:text-white flex items-center gap-1">Skip <XCircle size={10} /></button>
                </div>
            </div>

            <div className="flex-1 flex flex-col justify-start pt-4 min-h-0">
                <div className="text-center mb-6 shrink-0 space-y-1">
                    <h2 className="text-3xl font-serif font-black text-ink dark:text-white leading-none">{current.word}</h2>
                    <p className="text-xs font-serif italic text-gray-400 dark:text-zinc-500">"{current.simpleDefinition}"</p>
                    <p className="text-xs font-khmer text-indigo-600 dark:text-indigo-400 font-bold opacity-90">{current.khmerDefinition}</p>
                </div>

                {/* Drop Zone (Inset 3D) */}
                <div className={`min-h-[100px] bg-surface dark:bg-black/40 rounded-2xl shadow-pressed flex flex-wrap content-start gap-1.5 mb-6 p-3 transition-all duration-300 ${puzzleSolved ? 'border-2 border-green-400/50 bg-green-50/20' : isWrong ? 'border-2 border-red-400/50' : 'border border-transparent'}`}>
                    {selectedWords.length === 0 && !puzzleSolved && (
                        <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-zinc-700 text-[8px] font-black uppercase tracking-widest pointer-events-none">Tap words to build</div>
                    )}
                    {selectedWords.map((item) => (
                        <button key={item.id} onClick={() => !puzzleSolved && handleWordClick(item, false)} className="bg-ink dark:bg-white text-white dark:text-ink px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg animate-scale-up hover:-translate-y-0.5 transition-transform">{item.text}</button>
                    ))}
                </div>

                {hintText && (
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 p-2 rounded-lg mb-3 text-center shrink-0">
                        <p className="text-[10px] font-bold text-amber-800 dark:text-amber-200 italic">"{hintText}"</p>
                    </div>
                )}

                {/* Word Pool (Floating Tiles) */}
                <div className="flex flex-wrap justify-center gap-1.5 overflow-y-auto pb-2">
                    {scrambledWords.map((item) => (
                        <button key={item.id} onClick={() => handleWordClick(item, true)} className="bg-white dark:bg-[#18181b] text-gray-700 dark:text-zinc-300 px-3 py-1.5 rounded-lg text-xs font-bold shadow-slab dark:shadow-slab-dark border border-white/50 dark:border-white/5 hover:-translate-y-0.5 active:scale-95 transition-all">{item.text}</button>
                    ))}
                </div>
            </div>

            <div className="pt-2 shrink-0">
                {!puzzleSolved ? (
                    <button onClick={handleCheck} disabled={selectedWords.length === 0} className="w-full bg-ink dark:bg-fuchsia-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-3d disabled:opacity-50 disabled:shadow-none transition-all text-[10px]">Check Syntax</button>
                ) : (
                    <button onClick={() => wordIdx < words.length - 1 ? setWordIdx(wordIdx + 1) : onNext()} className="w-full bg-fuchsia-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-3d animate-scale-up flex items-center justify-center gap-2 text-[10px]">
                        {wordIdx < words.length - 1 ? 'Next Word' : 'Continue'} <ArrowRight size={14} />
                    </button>
                )}
            </div>
        </div>
    );
};

export const LessonRecapView: React.FC<{ data: DailyLesson }> = ({ data }) => {
  const [isPlayingStory, setIsPlayingStory] = useState(false);

  const handlePlayStory = async () => {
    if (isPlayingStory) return;
    setIsPlayingStory(true);
    try { await playTextToSpeech(data.story.body); } finally { setIsPlayingStory(false); }
  };

  return (
  <div className="h-full flex flex-col animate-fade-in overflow-y-auto hide-scrollbar space-y-8 pb-10">
    {/* Header */}
    <div className="text-center space-y-2 mt-4">
      <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 dark:bg-white/5 text-indigo-600 dark:text-indigo-400 rounded-full text-[9px] font-black tracking-[0.2em] uppercase">
        <History size={10} /> Recalled Session
      </div>
      <h2 className="text-3xl font-serif font-black text-ink dark:text-white leading-none">{data.theme}</h2>
      <p className="text-[10px] font-mono text-gray-400">{data.date}</p>
    </div>

    {/* Vocab Section */}
    <div className="space-y-3">
       <div className="flex items-center space-x-2 text-gray-400 font-black uppercase tracking-[0.2em] text-[9px]">
          <BookOpen size={12} /> <span>Vocabulary</span>
       </div>
       <div className="grid gap-3">
          {data.vocabularies.map((v, i) => (
             <div key={i} className="bg-white dark:bg-[#18181b] p-4 rounded-xl border border-black/5 dark:border-white/5 shadow-sm">
                <div className="flex justify-between items-start mb-1">
                   <h3 className="font-serif font-bold text-lg text-ink dark:text-white">{v.word}</h3>
                   <span className="text-[9px] font-mono text-gray-400">/{v.pronunciation}/</span>
                </div>
                <p className="text-xs text-gray-600 dark:text-zinc-400 italic mb-2">"{v.simpleDefinition}"</p>
                <p className="text-xs font-khmer text-indigo-600 dark:text-indigo-400 font-bold">{v.khmerDefinition}</p>
             </div>
          ))}
       </div>
    </div>

    {/* Concept Section */}
    <div className="space-y-3">
        <div className="flex items-center space-x-2 text-gray-400 font-black uppercase tracking-[0.2em] text-[9px]">
          <Lightbulb size={12} /> <span>Core Concept</span>
       </div>
       <div className="bg-amber-50 dark:bg-amber-900/10 p-5 rounded-2xl border border-amber-100 dark:border-amber-900/30">
          <h3 className="font-serif font-bold text-xl text-amber-900 dark:text-amber-100 mb-2">{data.concept.title}</h3>
          <p className="text-sm text-amber-800 dark:text-amber-200/80 leading-relaxed font-khmer">{data.concept.explanation}</p>
          <div className="mt-4 pt-4 border-t border-amber-200/50 dark:border-amber-700/30">
             <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">Analogy</p>
             <p className="text-sm italic text-amber-900 dark:text-amber-100">"{data.concept.analogy}"</p>
          </div>
       </div>
    </div>

    {/* Story Section */}
    <div className="space-y-3">
       <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-gray-400 font-black uppercase tracking-[0.2em] text-[9px]">
                <Brain size={12} /> <span>Narrative</span>
            </div>
            <button 
                onClick={handlePlayStory}
                disabled={isPlayingStory}
                className="w-6 h-6 flex items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:scale-110 transition-transform active:scale-95"
            >
                {isPlayingStory ? <Loader2 size={12} className="animate-spin" /> : <Volume2 size={12} />}
            </button>
       </div>
       <div className="bg-emerald-50 dark:bg-emerald-900/10 p-5 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
          <h3 className="font-serif font-bold text-lg text-emerald-900 dark:text-emerald-100 mb-2">{data.story.headline}</h3>
          <p className="text-sm text-emerald-800 dark:text-emerald-200/80 leading-relaxed font-khmer mb-4">{data.story.body}</p>
          <div className="bg-white/50 dark:bg-black/20 p-3 rounded-lg">
             <span className="text-[9px] font-black uppercase text-emerald-600 dark:text-emerald-400 block mb-1">Takeaway</span>
             <p className="text-xs font-bold text-emerald-800 dark:text-emerald-200">{data.story.keyTakeaway}</p>
          </div>
       </div>
    </div>

    {/* Mission Section */}
    <div className="space-y-3">
       <div className="flex items-center space-x-2 text-gray-400 font-black uppercase tracking-[0.2em] text-[9px]">
          <Target size={12} /> <span>Mission</span>
       </div>
       <div className="bg-purple-50 dark:bg-purple-900/10 p-5 rounded-2xl border border-purple-100 dark:border-purple-900/30 flex items-center gap-4">
          <div className="bg-white dark:bg-white/10 p-3 rounded-full text-purple-600 dark:text-purple-400 shadow-sm">
             <CheckCircle2 size={20} />
          </div>
          <div>
             <p className="text-sm font-bold text-purple-900 dark:text-purple-100">{data.challenge.task}</p>
             <p className="text-xs text-purple-600 dark:text-purple-300 mt-1 italic">Tip: {data.challenge.tip}</p>
          </div>
       </div>
    </div>
  </div>
  );
};

export const ReviewVaultView: React.FC<{ 
  words: Vocabulary[], 
  lessons: DailyLesson[], 
  onClose: () => void, 
  onSrsAction?: (word: any, result: 'forgot' | 'remembered') => void,
  onDeleteLesson?: (id: string) => void,
  onDownloadLesson?: (lesson: DailyLesson) => void
}> = ({ words, lessons, onClose, onSrsAction, onDeleteLesson, onDownloadLesson }) => {
    const [activeTab, setActiveTab] = useState<'words' | 'artifacts'>('words');
    const [drillIndex, setDrillIndex] = useState<number | null>(null);
    const [isFlipped, setIsFlipped] = useState(false);
    const [viewingLesson, setViewingLesson] = useState<DailyLesson | null>(null);

    const masteryTiers = [
        { label: 'New', color: 'bg-gray-100 dark:bg-zinc-800 text-gray-500', border: 'border-gray-200' },
        { label: 'Basic', color: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600', border: 'border-blue-200' },
        { label: 'Solid', color: 'bg-purple-50 dark:bg-purple-900/30 text-purple-600', border: 'border-purple-200' },
        { label: 'Pro', color: 'bg-indigo-900 text-white', border: 'border-indigo-800' },
        { label: 'Master', color: 'bg-gradient-to-r from-amber-400 to-orange-500 text-white', border: 'border-amber-400' }
    ];

    const playWordAudio = async (e: React.MouseEvent, word: string) => {
        e.stopPropagation();
        await playTextToSpeech(word);
    };

    const handleSrs = (res: 'forgot' | 'remembered') => {
        if(drillIndex !== null && onSrsAction) {
            onSrsAction(words[drillIndex], res);
            setDrillIndex(null);
            setIsFlipped(false);
        }
    };

    const handleDelete = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if (window.confirm("Are you sure you want to delete this log?")) {
        onDeleteLesson?.(id);
      }
    };

    return (
        <div className="h-full flex flex-col animate-fade-in relative max-w-2xl mx-auto w-full p-4">
            <header className="flex items-center justify-between mb-4 shrink-0">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-lg"><Box size={16} /></div>
                    <div>
                        <h2 className="text-xl font-serif font-black text-ink dark:text-white leading-none">The Vault</h2>
                        <p className="text-[9px] font-black uppercase text-gray-400 mt-0.5">Archive</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 bg-white dark:bg-[#18181b] rounded-full shadow-slab dark:shadow-slab-dark text-gray-400 hover:text-red-500 transition-colors"><XCircle size={18} /></button>
            </header>

            <div className="flex bg-surface dark:bg-white/5 p-1 rounded-xl mb-4 shrink-0 shadow-inner">
                {['words', 'artifacts'].map((tab) => (
                    <button key={tab} onClick={() => setActiveTab(tab as any)} className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${activeTab === tab ? 'bg-white dark:bg-[#18181b] shadow-md text-indigo-600' : 'text-gray-400'}`}>
                        {tab === 'words' ? 'Specimens' : 'Logs'}
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto hide-scrollbar pb-6 mask-gradient-b">
                {activeTab === 'words' ? (
                    <div className="flex flex-col gap-2">
                        {words.map((w, i) => {
                            const tier = masteryTiers[Math.min(w.srsLevel || 0, 4)];
                            return (
                                <div key={i} onClick={() => { setDrillIndex(i); setIsFlipped(false); }} className={`group relative w-full rounded-xl bg-white dark:bg-[#18181b] border ${tier.border} dark:border-white/5 p-4 flex items-center justify-between cursor-pointer hover:scale-[1.02] transition-transform shadow-slab dark:shadow-slab-dark`}>
                                    <div className="flex items-center gap-4">
                                         <div className={`w-1.5 self-stretch rounded-full ${tier.color.includes('bg-') ? tier.color.split(' ').find(c => c.startsWith('bg-')) : 'bg-gray-300'}`}></div>
                                         <div>
                                            <h4 className="font-serif font-black text-lg text-ink dark:text-white leading-none mb-1 group-hover:text-indigo-600 transition-colors">{w.word}</h4>
                                            <p className="text-[10px] font-khmer text-gray-400 dark:text-zinc-500 truncate">{w.khmerDefinition}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-3">
                                        <span className={`hidden sm:inline-block text-[7px] font-black uppercase px-2 py-1 rounded-md ${tier.color} tracking-wider`}>{tier.label}</span>
                                        <button onClick={(e) => playWordAudio(e, w.word)} className="p-2 bg-surface dark:bg-white/5 rounded-full text-gray-400 hover:text-indigo-500 transition-colors"><Volume2 size={14} /></button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="space-y-2">
                        {lessons.map((l, i) => (
                            <div key={i} onClick={() => setViewingLesson(l)} className="bg-white dark:bg-[#18181b] p-3 rounded-xl border border-white/50 dark:border-white/5 shadow-slab dark:shadow-slab-dark flex justify-between items-center hover:border-indigo-200 dark:hover:border-indigo-900 transition-colors cursor-pointer group">
                                <div className="flex-1 min-w-0 pr-4">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-[7px] font-black uppercase bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 px-1.5 py-0.5 rounded tracking-wide shrink-0">{l.theme}</span>
                                      <span className="text-[8px] font-mono text-gray-400 truncate">{l.date.split(',')[0]}</span>
                                    </div>
                                    <h4 className="font-serif font-bold text-ink dark:text-white text-xs truncate">{l.concept.title}</h4>
                                </div>
                                <div className="flex gap-2">
                                  <button onClick={(e) => {e.stopPropagation(); setViewingLesson(l);}} className="p-1.5 bg-indigo-50 dark:bg-white/5 rounded-full text-indigo-600 hover:bg-indigo-100 dark:hover:bg-white/10"><Eye size={12} /></button>
                                  <button onClick={(e) => {e.stopPropagation(); onDownloadLesson?.(l);}} className="p-1.5 bg-blue-50 dark:bg-white/5 rounded-full text-blue-600 hover:bg-blue-100 dark:hover:bg-white/10"><Download size={12} /></button>
                                  <button onClick={(e) => handleDelete(e, l.id)} className="p-1.5 bg-red-50 dark:bg-white/5 rounded-full text-red-500 hover:bg-red-100 dark:hover:bg-white/10"><Trash2 size={12} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Focus View Modal (Words) */}
            {drillIndex !== null && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-ink/60 dark:bg-black/80 backdrop-blur-md animate-fade-in">
                    <div className="bg-white dark:bg-[#121212] w-full max-w-sm rounded-[3rem] p-6 shadow-3d dark:shadow-3d-dark relative animate-scale-up border border-white/20">
                        <button onClick={() => setDrillIndex(null)} className="absolute top-6 right-6 p-2 bg-surface dark:bg-white/5 rounded-full text-gray-400 hover:text-red-500 transition-colors z-20"><XCircle size={20}/></button>
                        
                        <div className="h-72 perspective-1000 cursor-pointer mt-8" onClick={() => setIsFlipped(!isFlipped)}>
                             <div className={`w-full h-full relative preserve-3d transition-transform duration-500 ${isFlipped ? 'rotate-y-180' : ''}`}>
                                 {/* Front */}
                                 <div className="absolute inset-0 backface-hidden bg-surface dark:bg-black/40 rounded-[2.5rem] border border-white/50 dark:border-white/5 shadow-inner flex flex-col items-center justify-center text-center p-6">
                                     <h3 className="text-4xl font-serif font-black text-ink dark:text-white mb-4">{words[drillIndex].word}</h3>
                                     <p className="text-[9px] font-black uppercase tracking-widest text-indigo-400 animate-pulse bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1 rounded-full">Tap Card</p>
                                 </div>
                                 {/* Back */}
                                 <div className="absolute inset-0 backface-hidden rotate-y-180 bg-indigo-600 text-white rounded-[2.5rem] flex flex-col items-center justify-center text-center p-6 shadow-2xl border border-white/10">
                                     <p className="text-lg font-serif font-bold italic mb-4 leading-snug">"{words[drillIndex].simpleDefinition}"</p>
                                     <div className="w-8 h-1 bg-white/20 rounded-full mb-4"></div>
                                     <p className="text-base font-khmer font-bold opacity-90">{words[drillIndex].khmerDefinition}</p>
                                 </div>
                             </div>
                        </div>

                        <div className="flex gap-3 mt-8">
                            <button onClick={() => handleSrs('forgot')} className="flex-1 py-4 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-2xl font-black uppercase text-[9px] tracking-widest hover:bg-red-100 transition-colors border border-red-100 dark:border-red-900/30">Forgot</button>
                            <button onClick={() => handleSrs('remembered')} className="flex-1 py-4 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-2xl font-black uppercase text-[9px] tracking-widest hover:bg-green-100 transition-colors border border-green-100 dark:border-green-900/30">Recalled</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Full Session Recap Modal */}
            {viewingLesson && (
               <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink/60 dark:bg-black/80 backdrop-blur-md animate-fade-in">
                  <div className="w-full max-w-lg h-[80dvh] bg-white dark:bg-[#121212] rounded-[2rem] shadow-3d dark:shadow-3d-dark relative animate-scale-up border border-white/20 flex flex-col overflow-hidden">
                     <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-white/5 bg-white dark:bg-[#121212] shrink-0 z-10">
                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Full Session Log</span>
                        <button onClick={() => setViewingLesson(null)} className="p-2 bg-surface dark:bg-white/5 rounded-full text-gray-400 hover:text-red-500 transition-colors"><XCircle size={18}/></button>
                     </div>
                     <div className="flex-1 overflow-y-auto p-4 hide-scrollbar">
                        <LessonRecapView data={viewingLesson} />
                     </div>
                  </div>
               </div>
            )}
        </div>
    );
};

export const ConceptView: React.FC<{ data: Concept }> = ({ data }) => (
  <div className="h-full flex flex-col overflow-y-auto hide-scrollbar space-y-4">
    <div className="flex items-center space-x-2 text-amber-600 dark:text-amber-400 font-black uppercase tracking-[0.2em] text-[9px] shrink-0">
      <Lightbulb size={12} />
      <span>Core Concept</span>
    </div>

    <div>
      <h2 className="text-3xl sm:text-4xl font-serif font-black text-ink dark:text-white mb-2 leading-tight tracking-tight">{data.title}</h2>
      <p className="text-gray-600 dark:text-zinc-400 text-sm leading-relaxed font-medium font-khmer">
        {data.explanation}
      </p>
    </div>

    <HoloCard className="bg-amber-50 dark:bg-amber-900/10 p-5 rounded-[1.5rem] border border-amber-100 dark:border-amber-900/30 shadow-sm shrink-0">
        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500 font-black text-[9px] uppercase tracking-widest mb-2 relative z-10">
            <Sparkles size={12} />
            <span>Mental Hook</span>
        </div>
        <p className="text-amber-950 dark:text-amber-200 text-xl font-black font-serif italic leading-snug relative z-10">
          "{data.analogy}"
        </p>
    </HoloCard>

    <div className="space-y-2 pb-4">
        <h3 className="text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-zinc-500">Conversation Starters</h3>
        {data.conversationStarters.map((starter, idx) => (
            <div key={idx} className="bg-white dark:bg-[#18181b] p-3 rounded-xl border border-white/50 dark:border-white/5 shadow-slab dark:shadow-slab-dark flex gap-3 items-start">
                <span className="bg-surface dark:bg-white/10 text-gray-500 text-[9px] font-bold w-5 h-5 flex items-center justify-center rounded-full mt-0.5 shrink-0 shadow-inner">{idx + 1}</span>
                <p className="text-xs font-medium text-ink dark:text-zinc-300 italic">"{starter}"</p>
            </div>
        ))}
    </div>
  </div>
);

export const SimulatorView: React.FC<{ data: Simulation; onComplete: (history: { role: string; text: string }[], feedback: SimulationFeedback) => void; onSkip: () => void }> = ({ data, onComplete, onSkip }) => {
  const [messages, setMessages] = useState<{ role: 'model' | 'user'; text: string }[]>([
    { role: 'model', text: data.openingLine }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [feedback, setFeedback] = useState<SimulationFeedback | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(() => scrollToBottom(), [messages]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;
    const userMsg = input;
    setInput("");
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);
    try {
      const reply = await getSimulationReply([...messages, { role: 'user', text: userMsg }], { setting: data.setting, role: data.role });
      setMessages(prev => [...prev, { role: 'model', text: reply }]);
    } catch (e) { console.error(e); } finally { setIsTyping(false); }
  };

  const handleFinish = async () => {
      try {
          const result = await evaluateSimulation(messages, data.objective);
          setFeedback(result);
      } catch (e) { console.error(e); }
  };

  return (
    <div className="flex flex-col h-full relative">
      <div className="flex items-center justify-between mb-2 shrink-0">
        <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 font-black uppercase tracking-[0.2em] text-[9px]">
            <MessageCircle size={12} />
            <span>Voice Lab</span>
        </div>
        <button onClick={onSkip} className="text-gray-400 hover:text-ink"><XCircle size={16}/></button>
      </div>
      
      <div className="bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-xl mb-3 text-[9px] font-bold text-blue-800 dark:text-blue-300 border border-blue-100 dark:border-blue-900/30 shadow-sm shrink-0">
         Objective: {data.objective}
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 p-1 hide-scrollbar min-h-0">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-xs font-medium shadow-sm animate-pop-in ${
                msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-sm shadow-md' : 'bg-surface dark:bg-[#18181b] text-ink dark:text-white rounded-bl-sm border border-white/50 dark:border-white/5 shadow-slab dark:shadow-slab-dark'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {isTyping && <div className="text-[10px] text-gray-400 ml-4 animate-pulse">Assistant is typing...</div>}
        
        {feedback && (
            <div className="bg-white dark:bg-[#18181b] p-5 rounded-[1.5rem] shadow-3d dark:shadow-3d-dark border border-white/50 dark:border-white/5 animate-scale-up mt-4">
                <div className="flex items-center gap-2 mb-2">
                    <Sparkles size={14} className="text-indigo-500"/>
                    <h3 className="font-black text-[10px] uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Analysis</h3>
                </div>
                <div className="text-3xl font-serif font-black mb-2">{feedback.score}/10</div>
                <p className="text-xs text-gray-600 dark:text-zinc-400 mb-4 italic">"{feedback.feedback}"</p>
                <button onClick={() => onComplete(messages, feedback)} className="w-full bg-ink dark:bg-white text-white dark:text-ink py-3 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg hover:-translate-y-1 transition-transform">Continue</button>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {!feedback && (
          <div className="mt-2 shrink-0">
             {messages.length > 2 && <button onClick={handleFinish} className="w-full py-1.5 mb-2 text-[9px] font-black uppercase text-gray-400 hover:text-indigo-500 tracking-widest">End & Evaluate</button>}
             <div className="relative">
                 <input 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Type response..."
                    className="w-full bg-surface dark:bg-[#18181b] rounded-full py-4 pl-5 pr-12 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 border border-white/50 dark:border-white/5 shadow-inner"
                 />
                 <button onClick={handleSend} disabled={!input.trim()} className="absolute right-2 top-2 p-2 bg-indigo-600 rounded-full text-white shadow-lg disabled:opacity-50 hover:scale-105 transition-transform"><Send size={14}/></button>
             </div>
          </div>
      )}
    </div>
  );
};

export const StoryView: React.FC<{ data: Story }> = ({ data }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = async () => {
    if (isPlaying) return;
    setIsPlaying(true);
    try { await playTextToSpeech(data.body); } finally { setIsPlaying(false); }
  };

  return (
  <div className="h-full flex flex-col overflow-y-auto hide-scrollbar space-y-6">
    <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 font-black uppercase tracking-[0.2em] text-[9px]">
            <BookOpen size={12} />
            <span>Micro Story</span>
        </div>
        <button 
            onClick={handlePlay} 
            disabled={isPlaying}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:scale-110 transition-transform active:scale-95"
        >
            {isPlaying ? <Loader2 size={14} className="animate-spin" /> : <Volume2 size={14} />}
        </button>
    </div>
    
    <h2 className="text-3xl font-serif font-black text-ink dark:text-white leading-tight tracking-tight">{data.headline}</h2>
    
    <div className="prose prose-base dark:prose-invert font-khmer text-gray-600 dark:text-zinc-300 leading-relaxed text-sm">
        {data.body.split('\n').map((p, i) => <p key={i} className="mb-3">{p}</p>)}
    </div>

    <div className="mt-auto bg-emerald-50 dark:bg-emerald-900/10 p-6 rounded-[2rem] border border-emerald-100 dark:border-emerald-900/30 shadow-slab dark:shadow-slab-dark">
        <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-black text-[9px] uppercase tracking-widest mb-2">
            <Brain size={14} />
            <span>Key Takeaway</span>
        </div>
        <p className="font-bold text-lg text-emerald-950 dark:text-emerald-100">{data.keyTakeaway}</p>
    </div>
  </div>
  );
};

export const ChallengeView: React.FC<{ data: Challenge; onComplete: () => void }> = ({ data, onComplete }) => (
  <div className="h-full flex flex-col justify-between relative">
    {/* Always visible burst on mount for satisfaction? No, let's keep it simple. Actually, let's add it when they click complete or just here for the 'task' reveal feel. Let's add it on button click via prop? No, let's just leave it clean. */}
    <div className="space-y-6">
      <div className="flex items-center space-x-2 text-purple-600 dark:text-purple-400 font-black uppercase tracking-[0.2em] text-[9px]">
        <Target size={12} />
        <span>Daily Mission</span>
      </div>

      <h2 className="text-4xl font-serif font-black text-ink dark:text-white leading-[0.9] tracking-tighter">Your Task</h2>
      
      <div className="bg-white dark:bg-[#18181b] p-8 rounded-[2.5rem] shadow-3d dark:shadow-3d-dark border border-white/50 dark:border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-500 group-hover:h-3 transition-all duration-500"></div>
          <p className="text-xl font-medium italic text-gray-800 dark:text-zinc-200 leading-relaxed font-serif">"{data.task}"</p>
      </div>

      <div className="flex gap-4 items-start p-5 bg-purple-50 dark:bg-purple-900/20 rounded-[1.5rem] border border-purple-100 dark:border-purple-900/30">
          <Lightbulb size={24} className="text-purple-600 dark:text-purple-400 shrink-0" />
          <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-purple-400 dark:text-purple-500 mb-1">Pro Tip</p>
              <p className="text-sm font-bold text-purple-900 dark:text-purple-200">{data.tip}</p>
          </div>
      </div>
    </div>

    <button onClick={onComplete} className="w-full bg-ink dark:bg-purple-600 text-white py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-3d dark:shadow-3d-dark hover:-translate-y-1 transition-transform flex items-center justify-center gap-3 text-[10px]">
        Mission Accepted <CheckCircle2 size={20} />
    </button>
  </div>
);