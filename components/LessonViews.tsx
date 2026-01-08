
import React, { useState, useEffect, useRef } from 'react';
import { Vocabulary, Concept, Story, Challenge, Simulation, SimulationFeedback, DailyLesson } from '../types';
// Added Settings to the imports to resolve the "Cannot find name 'Settings'" error on line 172.
import { BookOpen, MessageCircle, Lightbulb, Brain, Volume2, Sparkles, ArrowRight, PlayCircle, Loader2, Send, User, CheckCircle2, ChevronLeft, ChevronRight, PenTool, XCircle, Mic, MicOff, RefreshCw, Layers, Check, History, Target, Zap, Anchor, Wand2, Info, MessageSquareQuote, Radio, GripVertical, Award, Star, Filter, Flame, Trophy, Search, FileText, Activity, Box, Play, Eye, Trash2, Download, Bot, Settings } from 'lucide-react';
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
      const rotateX = ((y - cy) / cy) * -3; 
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
  <div className="flex flex-col items-center justify-center h-full text-center space-y-8 p-4">
    <div className="inline-flex items-center gap-2.5 px-4 py-1.5 bg-indigo-500/10 text-indigo-400 rounded-full text-[9px] font-black tracking-[0.2em] uppercase border border-indigo-500/20 shadow-xl">
      <Sparkles size={12} />
      {level} Neural Pattern
    </div>
    
    <h1 className="text-5xl sm:text-7xl font-serif font-black text-white leading-none tracking-tighter drop-shadow-2xl">
      <ScrambleText text={theme} />
    </h1>
    
    <div className="w-16 h-1 bg-indigo-500 rounded-full shadow-[0_0_20px_rgba(99,102,241,0.5)]"></div>

    <p className="text-zinc-400 text-sm sm:text-base max-w-sm mx-auto font-medium leading-relaxed">
      Targeting vocabulary, logic, and poise. <br/>
      <span className="text-white font-black uppercase tracking-tighter">Est. Time: 15 Minutes</span>
    </p>

    <div className="pt-10">
      <button 
        onClick={onNext}
        className="group relative inline-flex items-center justify-center px-10 py-5 font-black bg-white text-black rounded-3xl hover:-translate-y-1 active:scale-95 shadow-2xl tracking-[0.2em] uppercase text-[10px] transition-all"
      >
        <span>Initialize Path</span>
        <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
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
    <div className="flex items-center justify-between mb-6 shrink-0">
        <div className="flex items-center space-x-2 text-indigo-400 font-black uppercase tracking-[0.2em] text-[9px]">
            <BookOpen size={14} />
            <span>Node Data {index + 1}/{data.length}</span>
        </div>
        <div className="flex gap-1.5">
            {data.map((_, i) => (
                <div key={i} className={`h-1.5 rounded-full transition-all duration-700 ${i === index ? 'bg-indigo-500 w-8' : 'bg-white/10 w-2'}`}></div>
            ))}
        </div>
    </div>
    
    <div className="flex-1 flex flex-col min-h-0 space-y-5 overflow-y-auto hide-scrollbar pb-6">
      <HoloCard className="bg-white/5 p-6 rounded-[2rem] border border-white/10 relative group shrink-0 shadow-2xl overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
          <div className="absolute top-6 right-6 z-20">
             <button onClick={(e) => { e.stopPropagation(); handlePlay(); }} disabled={isPlaying} className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center hover:scale-110 transition-all active:scale-95 shadow-xl">
                {isPlaying ? <Loader2 size={18} className="animate-spin" /> : <Volume2 size={18} />}
             </button>
          </div>
          
          <h2 className="text-5xl font-serif font-black text-white tracking-tighter leading-none mb-3 relative z-10">{current.word}</h2>
          <div className="flex items-center gap-3 mb-6 relative z-10">
              <span className="text-[11px] font-serif italic text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded uppercase tracking-widest">{current.partOfSpeech}</span>
              <span className="text-[11px] font-mono text-zinc-500 tracking-tighter">/{current.pronunciation}/</span>
          </div>

          <div className="p-5 bg-black/40 rounded-2xl border border-white/5 space-y-4 relative z-10">
              <p className="text-base font-serif italic text-zinc-300 leading-snug">
                  "{current.simpleDefinition}"
              </p>
              <div className="h-px w-full bg-white/5"></div>
              <p className="text-lg font-khmer text-indigo-400 font-black leading-relaxed">
                  {current.khmerDefinition}
              </p>
          </div>
      </HoloCard>

      <div className="bg-indigo-500/5 p-5 rounded-2xl border border-indigo-500/10 relative overflow-hidden backdrop-blur-md shrink-0">
         <div className="relative z-10">
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-indigo-400 mb-1 block">Memory Link</span>
            <p className="text-sm font-serif italic font-medium text-white leading-relaxed">"{current.mnemoLink}"</p>
         </div>
      </div>

      <div className="space-y-3 px-1">
          <h3 className="text-[9px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2"><Settings size={10}/> Contextual Vectors</h3>
          <div className="space-y-3">
            {(current.exampleSentences || [(current as any).exampleSentence]).slice(0, 3).map((sentence: string, idx: number) => (
                <div key={idx} className="pl-4 border-l-2 border-indigo-500/30 py-1 bg-white/5 rounded-r-xl">
                    <p className="text-xs text-zinc-400 italic leading-relaxed font-medium">"{sentence}"</p>
                </div>
            ))}
          </div>
      </div>
    </div>

    <div className="pt-4 mt-auto shrink-0">
        <button onClick={nextWord} className="w-full bg-white text-black py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:-translate-y-1 transition-all shadow-xl active:scale-95 text-[10px]">
            {index < data.length - 1 ? "Next Word" : "Enter Practice"}
            <ArrowRight size={16} />
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
        <div className="h-full flex flex-col space-y-5 relative">
             {puzzleSolved && <DopamineBurst />}
             <div className="flex items-center justify-between shrink-0">
                <div className="flex items-center space-x-2 text-fuchsia-400 font-black uppercase tracking-[0.2em] text-[9px]">
                    <Layers size={14} />
                    <span>Puzzle {wordIdx + 1}/{words.length}</span>
                </div>
                <div className="flex gap-4">
                  <button onClick={handleHint} disabled={isGettingHint || puzzleSolved} className="text-[9px] font-black uppercase text-amber-500 flex items-center gap-1.5 hover:text-amber-400 transition-colors">
                    {isGettingHint ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />} Get Hint
                  </button>
                  <button onClick={onSkip} className="text-[9px] font-black uppercase text-zinc-500 hover:text-white flex items-center gap-1.5 transition-colors">Skip <XCircle size={12} /></button>
                </div>
            </div>

            <div className="flex-1 flex flex-col justify-start pt-6 min-h-0">
                <div className="text-center mb-8 shrink-0 space-y-2">
                    <h2 className="text-4xl font-serif font-black text-white leading-none tracking-tight">{current.word}</h2>
                    <p className="text-xs font-serif italic text-zinc-400 leading-relaxed max-w-xs mx-auto">"{current.simpleDefinition}"</p>
                </div>

                <div className={`min-h-[120px] bg-black/40 rounded-3xl border border-white/5 flex flex-wrap content-start gap-2 mb-8 p-5 transition-all duration-500 ${puzzleSolved ? 'border-indigo-500/50 bg-indigo-500/10' : isWrong ? 'border-red-500/50 bg-red-500/10' : ''}`}>
                    {selectedWords.length === 0 && !puzzleSolved && (
                        <div className="w-full h-full flex items-center justify-center text-zinc-700 text-[9px] font-black uppercase tracking-[0.3em] pointer-events-none italic opacity-50">Assemble Fragments</div>
                    )}
                    {selectedWords.map((item) => (
                        <button key={item.id} onClick={() => !puzzleSolved && handleWordClick(item, false)} className="bg-white text-black px-4 py-2 rounded-xl text-xs font-bold shadow-xl animate-scale-up hover:-translate-y-0.5 transition-all">{item.text}</button>
                    ))}
                </div>

                {hintText && (
                    <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-2xl mb-5 text-center shrink-0 animate-fade-in">
                        <p className="text-[11px] font-bold text-amber-300 italic">"{hintText}"</p>
                    </div>
                )}

                <div className="flex flex-wrap justify-center gap-2 overflow-y-auto pb-4">
                    {scrambledWords.map((item) => (
                        <button key={item.id} onClick={() => handleWordClick(item, true)} className="bg-[#18181b] text-zinc-300 px-4 py-2.5 rounded-xl text-xs font-bold shadow-xl border border-white/5 hover:-translate-y-1 active:scale-95 transition-all hover:bg-zinc-800">{item.text}</button>
                    ))}
                </div>
            </div>

            <div className="pt-4 shrink-0">
                {!puzzleSolved ? (
                    <button onClick={handleCheck} disabled={selectedWords.length === 0} className="w-full bg-white text-black py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-xl disabled:opacity-30 transition-all text-[10px]">Align Pattern</button>
                ) : (
                    <button onClick={() => wordIdx < words.length - 1 ? setWordIdx(wordIdx + 1) : onNext()} className="w-full bg-fuchsia-600 text-white py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-xl animate-scale-up flex items-center justify-center gap-3 text-[10px] hover:scale-[1.02] transition-all">
                        {wordIdx < words.length - 1 ? 'Next Pattern' : 'Initialize Mastery'} <ArrowRight size={18} />
                    </button>
                )}
            </div>
        </div>
    );
};

export const ConceptView: React.FC<{ data: Concept }> = ({ data }) => (
  <div className="h-full flex flex-col overflow-y-auto hide-scrollbar space-y-6">
    <div className="flex items-center space-x-2 text-amber-400 font-black uppercase tracking-[0.2em] text-[9px] shrink-0">
      <Lightbulb size={14} />
      <span>Neural Concept</span>
    </div>

    <div>
      <h2 className="text-4xl sm:text-5xl font-serif font-black text-white mb-3 leading-[1.1] tracking-tighter">{data.title}</h2>
      <p className="text-zinc-400 text-sm leading-relaxed font-medium font-khmer">
        {data.explanation}
      </p>
    </div>

    <HoloCard className="bg-amber-500/5 p-6 rounded-[2rem] border border-amber-500/10 shadow-xl shrink-0">
        <div className="flex items-center gap-2 text-amber-500 font-black text-[9px] uppercase tracking-widest mb-3 relative z-10">
            <Sparkles size={14} />
            <span>Neural Analogy</span>
        </div>
        <p className="text-white text-xl font-black font-serif italic leading-snug relative z-10">
          "{data.analogy}"
        </p>
    </HoloCard>

    <div className="space-y-3 pb-6">
        <h3 className="text-[9px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">Initiate Contact Hooks</h3>
        {data.conversationStarters.map((starter, idx) => (
            <div key={idx} className="bg-[#18181b] p-4 rounded-2xl border border-white/5 shadow-xl flex gap-4 items-center group hover:bg-zinc-800 transition-colors">
                <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-black w-7 h-7 flex items-center justify-center rounded-xl shrink-0 group-hover:scale-110 transition-transform">{idx + 1}</span>
                <p className="text-xs font-medium text-zinc-200 italic leading-relaxed">"{starter}"</p>
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
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [isGettingSuggestion, setIsGettingSuggestion] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(() => scrollToBottom(), [messages]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;
    const userMsg = input;
    setInput("");
    setSuggestion(null);
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);
    try {
      const reply = await getSimulationReply([...messages, { role: 'user', text: userMsg }], { setting: data.setting, role: data.role });
      setMessages(prev => [...prev, { role: 'model', text: reply }]);
      // Automagically play reply audio? Optional for immersion.
      // playTextToSpeech(reply);
    } catch (e) { console.error(e); } finally { setIsTyping(false); }
  };

  const handleGetAssist = async () => {
    if (isGettingSuggestion || isTyping) return;
    setIsGettingSuggestion(true);
    try {
      const hint = await getSimSuggestion(messages as any, data);
      setSuggestion(hint);
    } finally {
      setIsGettingSuggestion(false);
    }
  };

  const handleFinish = async () => {
      setIsTyping(true);
      try {
          const result = await evaluateSimulation(messages as any, data.objective);
          setFeedback(result);
      } catch (e) { console.error(e); } finally { setIsTyping(false); }
  };

  return (
    <div className="flex flex-col h-full relative">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center space-x-2 text-blue-400 font-black uppercase tracking-[0.2em] text-[9px]">
            <Radio size={14} className="animate-pulse" />
            <span>Voice Lab Active</span>
        </div>
        <div className="flex items-center gap-3">
             <button 
                onClick={handleGetAssist} 
                disabled={isGettingSuggestion || isTyping || !!feedback}
                className={`flex items-center gap-1.5 text-[9px] font-black uppercase transition-all ${isGettingSuggestion ? 'text-indigo-400' : 'text-indigo-500 hover:text-indigo-300'}`}
             >
                {isGettingSuggestion ? <Loader2 size={12} className="animate-spin" /> : <Bot size={12} />} AI Assist
             </button>
             <button onClick={onSkip} className="text-zinc-600 hover:text-white transition-colors"><XCircle size={18}/></button>
        </div>
      </div>
      
      <div className="bg-blue-500/5 px-4 py-2.5 rounded-2xl mb-4 text-[10px] font-black text-blue-300 border border-blue-500/10 shadow-lg shrink-0 flex items-center gap-2">
         <Target size={12}/> Mission: {data.objective}
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 p-1 hide-scrollbar min-h-0 mask-gradient-b pb-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`group relative max-w-[85%] px-5 py-4 rounded-3xl text-sm font-medium shadow-2xl animate-pop-in ${
                msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-none border border-white/10' : 'bg-[#18181b] text-white rounded-bl-none border border-white/5'
            }`}>
              {msg.text}
              <div className={`absolute top-0 ${msg.role === 'user' ? 'right-full mr-2' : 'left-full ml-2'} opacity-0 group-hover:opacity-100 transition-opacity`}>
                   <button onClick={() => playTextToSpeech(msg.text)} className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-zinc-500 hover:text-white"><Volume2 size={10}/></button>
              </div>
            </div>
          </div>
        ))}
        {isTyping && (
            <div className="flex items-center gap-2 ml-4">
                <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
            </div>
        )}
        
        {suggestion && (
            <div className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-3xl animate-scale-up mt-2 flex gap-3 items-start">
                <Bot size={16} className="text-indigo-400 shrink-0 mt-0.5" />
                <div>
                    <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest block mb-1">AI Coach Hint</span>
                    <p className="text-xs italic text-indigo-200 leading-relaxed font-medium cursor-pointer" onClick={() => setInput(suggestion)}>"{suggestion}"</p>
                    <button onClick={() => setInput(suggestion)} className="text-[9px] font-black text-white mt-2 flex items-center gap-1 opacity-70 hover:opacity-100 uppercase tracking-widest">Apply Hint</button>
                </div>
            </div>
        )}

        {feedback && (
            <div className="bg-[#121212] p-6 rounded-[2.5rem] shadow-2xl border border-white/10 animate-scale-up mt-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-indigo-500"></div>
                <div className="flex items-center gap-3 mb-4">
                    <Sparkles size={16} className="text-indigo-400"/>
                    <h3 className="font-black text-[10px] uppercase tracking-widest text-indigo-400">Sync Analysis</h3>
                </div>
                <div className="text-4xl font-serif font-black mb-4 tracking-tighter">{feedback.score}<span className="text-zinc-600 text-xl">/10</span></div>
                <p className="text-sm text-zinc-400 mb-6 italic leading-relaxed font-medium">"{feedback.feedback}"</p>
                <div className="bg-white/5 p-4 rounded-2xl mb-6">
                    <span className="text-[8px] font-black uppercase text-zinc-500 tracking-widest block mb-2">Growth Vector</span>
                    <p className="text-xs text-white font-bold italic">"{feedback.suggestion}"</p>
                </div>
                <button onClick={() => onComplete(messages as any, feedback)} className="w-full bg-white text-black py-4.5 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-95 transition-all">Proceed to Sync</button>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {!feedback && (
          <div className="mt-4 shrink-0">
             {messages.length > 2 && <button onClick={handleFinish} className="w-full py-2 mb-3 text-[9px] font-black uppercase text-zinc-500 hover:text-indigo-400 tracking-[0.3em] transition-colors">Terminate & Evaluate</button>}
             <div className="relative group">
                 <input 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Type dialogue..."
                    className="w-full bg-black/40 rounded-full py-4.5 pl-6 pr-14 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 border border-white/5 shadow-inner placeholder:text-zinc-700 font-medium"
                 />
                 <button onClick={handleSend} disabled={!input.trim() || isTyping} className="absolute right-2.5 top-2.5 w-10 h-10 bg-white rounded-full text-black shadow-xl disabled:opacity-20 hover:scale-105 transition-all flex items-center justify-center"><Send size={16}/></button>
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
  <div className="h-full flex flex-col overflow-y-auto hide-scrollbar space-y-8">
    <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-2 text-emerald-400 font-black uppercase tracking-[0.2em] text-[9px]">
            <Brain size={16} />
            <span>Narrative Thread</span>
        </div>
        <button 
            onClick={handlePlay} 
            disabled={isPlaying}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-white text-black hover:scale-110 transition-all active:scale-95 shadow-xl"
        >
            {isPlaying ? <Loader2 size={18} className="animate-spin" /> : <Volume2 size={18} />}
        </button>
    </div>
    
    <h2 className="text-4xl font-serif font-black text-white leading-[1.1] tracking-tighter">{data.headline}</h2>
    
    <div className="prose prose-lg dark:prose-invert font-khmer text-zinc-300 leading-relaxed text-base italic">
        {data.body.split('\n').map((p, i) => <p key={i} className="mb-4">"{p}"</p>)}
    </div>

    <div className="mt-auto bg-emerald-500/5 p-8 rounded-[2.5rem] border border-emerald-500/10 shadow-2xl">
        <div className="flex items-center gap-2 text-emerald-400 font-black text-[9px] uppercase tracking-widest mb-3">
            <Target size={14} />
            <span>Root Takeaway</span>
        </div>
        <p className="font-black text-2xl text-white tracking-tighter leading-tight">{data.keyTakeaway}</p>
    </div>
  </div>
  );
};

export const ChallengeView: React.FC<{ data: Challenge; onComplete: () => void }> = ({ data, onComplete }) => (
  <div className="h-full flex flex-col justify-between relative py-6">
    <div className="space-y-8">
      <div className="flex items-center space-x-2 text-purple-400 font-black uppercase tracking-[0.2em] text-[9px]">
        <Zap size={16} />
        <span>Physical Manifestation</span>
      </div>

      <h2 className="text-5xl font-serif font-black text-white leading-[0.9] tracking-tighter">Daily<br/>Mission</h2>
      
      <div className="bg-white/5 p-10 rounded-[3rem] border border-white/10 relative overflow-hidden group shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-purple-500 to-indigo-600"></div>
          <p className="text-2xl font-black italic text-zinc-200 leading-relaxed font-serif tracking-tight">"{data.task}"</p>
      </div>

      <div className="flex gap-5 items-start p-6 bg-purple-500/10 rounded-[2rem] border border-purple-500/20">
          <div className="bg-purple-500/20 p-3 rounded-2xl shadow-inner"><Lightbulb size={24} className="text-purple-400 shrink-0" /></div>
          <div>
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-purple-400 mb-2">Tactical Hint</p>
              <p className="text-base font-bold text-white italic leading-snug">"{data.tip}"</p>
          </div>
      </div>
    </div>

    <button onClick={onComplete} className="w-full bg-white text-black py-5 rounded-[2.5rem] font-black uppercase tracking-[0.3em] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 text-[10px]">
        Initiate Protocol <CheckCircle2 size={20} />
    </button>
  </div>
);

export const ReviewVaultView: React.FC<{ 
    words: Vocabulary[], 
    lessons: DailyLesson[], 
    onClose: () => void 
  }> = ({ words, lessons, onClose }) => {
      const [activeTab, setActiveTab] = useState<'words' | 'artifacts'>('words');
      const [viewingLesson, setViewingLesson] = useState<DailyLesson | null>(null);
  
      return (
          <div className="h-full flex flex-col animate-fade-in relative max-w-2xl mx-auto w-full p-6">
              <header className="flex items-center justify-between mb-8 shrink-0">
                  <div className="flex items-center gap-4">
                      <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-2xl"><Box size={20} /></div>
                      <div>
                          <h2 className="text-2xl font-serif font-black text-white leading-none tracking-tight">The Vault</h2>
                          <p className="text-[8px] font-black uppercase text-indigo-400 tracking-[0.3em] mt-1.5">Sector 9 Archives</p>
                      </div>
                  </div>
                  <button onClick={onClose} className="p-3 bg-white/5 border border-white/10 rounded-full text-zinc-500 hover:text-white transition-all active:scale-95"><XCircle size={20} /></button>
              </header>
  
              <div className="flex bg-black/40 p-1.5 rounded-2xl mb-8 shrink-0 border border-white/5">
                  {['words', 'artifacts'].map((tab) => (
                      <button key={tab} onClick={() => setActiveTab(tab as any)} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === tab ? 'bg-white text-black shadow-xl' : 'text-zinc-500 hover:text-zinc-300'}`}>
                          {tab === 'words' ? 'Nodes' : 'Logs'}
                      </button>
                  ))}
              </div>
  
              <div className="flex-1 overflow-y-auto hide-scrollbar pb-10 mask-gradient-b">
                  {activeTab === 'words' ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {words.map((w, i) => (
                              <div key={i} className="group bg-[#18181b] p-5 rounded-3xl border border-white/5 hover:border-indigo-500/30 transition-all cursor-pointer shadow-xl relative overflow-hidden">
                                  <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button onClick={(e) => { e.stopPropagation(); playTextToSpeech(w.word); }} className="p-2 bg-indigo-500/10 text-indigo-400 rounded-full"><Volume2 size={12}/></button>
                                  </div>
                                  <h4 className="font-serif font-black text-xl text-white mb-1">{w.word}</h4>
                                  <p className="text-[10px] font-khmer text-indigo-400 font-black mb-3">{w.khmerDefinition}</p>
                                  <p className="text-[10px] italic text-zinc-500 line-clamp-2 leading-relaxed">"{w.simpleDefinition}"</p>
                              </div>
                          ))}
                      </div>
                  ) : (
                      <div className="space-y-3">
                          {lessons.map((l, i) => (
                              <div key={i} onClick={() => setViewingLesson(l)} className="bg-[#18181b] p-5 rounded-3xl border border-white/5 flex justify-between items-center hover:border-indigo-500/30 transition-all cursor-pointer group shadow-xl">
                                  <div className="flex-1 min-w-0 pr-6">
                                      <div className="flex items-center gap-3 mb-1.5">
                                        <span className="text-[8px] font-black uppercase bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-500/20">{l.theme}</span>
                                        <span className="text-[9px] font-mono text-zinc-600">{l.date.split(',')[0]}</span>
                                      </div>
                                      <h4 className="font-serif font-black text-white text-base truncate">{l.concept.title}</h4>
                                  </div>
                                  <button className="p-3 bg-white/5 rounded-full text-zinc-500 group-hover:text-white group-hover:bg-indigo-600 transition-all"><Eye size={18}/></button>
                              </div>
                          ))}
                      </div>
                  )}
              </div>
  
              {viewingLesson && (
                 <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in">
                    <div className="w-full max-w-lg h-[80dvh] bg-[#121212] rounded-[3rem] shadow-2xl relative animate-scale-up border border-white/10 flex flex-col overflow-hidden">
                       <header className="flex justify-between items-center p-6 border-b border-white/5 bg-[#121212] shrink-0 z-10">
                          <span className="text-[9px] font-black uppercase tracking-[0.3em] text-indigo-400">Memory Core Sync</span>
                          <button onClick={() => setViewingLesson(null)} className="p-2 bg-white/5 rounded-full text-zinc-500 hover:text-white transition-all"><XCircle size={20}/></button>
                       </header>
                       <div className="flex-1 overflow-y-auto p-6 hide-scrollbar">
                          <LessonRecapView data={viewingLesson} />
                       </div>
                    </div>
                 </div>
              )}
          </div>
      );
  };

export const LessonRecapView: React.FC<{ data: DailyLesson }> = ({ data }) => {
  return (
    <div className="space-y-10 pb-10">
      <div className="text-center space-y-3">
        <h2 className="text-4xl font-serif font-black text-white leading-none">{data.theme}</h2>
        <div className="flex justify-center gap-2">
            <span className="text-[9px] font-black uppercase bg-indigo-500/10 text-indigo-400 px-2.5 py-1 rounded-full">{data.level}</span>
            <span className="text-[9px] font-black uppercase bg-white/5 text-zinc-500 px-2.5 py-1 rounded-full">{data.vibe}</span>
        </div>
      </div>

      <div className="grid gap-4">
        {data.vocabularies.map((v, i) => (
            <div key={i} className="bg-white/5 p-5 rounded-3xl border border-white/5">
                <div className="flex justify-between items-baseline mb-2">
                    <h3 className="font-serif font-black text-xl text-white">{v.word}</h3>
                    <span className="text-[10px] font-mono text-zinc-600 italic">/{v.pronunciation}/</span>
                </div>
                <p className="text-sm font-khmer text-indigo-400 font-black mb-1">{v.khmerDefinition}</p>
                <p className="text-xs text-zinc-400 italic">"{v.simpleDefinition}"</p>
            </div>
        ))}
      </div>

      <div className="space-y-4">
          <div className="flex items-center gap-2 text-amber-400 text-[10px] font-black uppercase tracking-widest"><Lightbulb size={16}/> Concept Summary</div>
          <div className="bg-amber-500/5 p-6 rounded-3xl border border-amber-500/10">
              <h4 className="font-serif font-black text-2xl text-white mb-3">{data.concept.title}</h4>
              <p className="text-sm text-zinc-400 leading-relaxed font-khmer italic mb-4">"{data.concept.explanation}"</p>
              <div className="bg-black/40 p-4 rounded-2xl">
                  <span className="text-[8px] font-black uppercase text-amber-500 tracking-widest block mb-1">Analogy Hook</span>
                  <p className="text-sm text-white font-bold">"{data.concept.analogy}"</p>
              </div>
          </div>
      </div>
    </div>
  );
};
