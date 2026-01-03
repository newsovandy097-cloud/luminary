import React, { useState, useEffect, useRef } from 'react';
import { Vocabulary, Concept, Story, Challenge, Simulation, SimulationFeedback } from '../types';
import { BookOpen, MessageCircle, Lightbulb, Brain, Volume2, Sparkles, ArrowRight, PlayCircle, Loader2, Send, User, CheckCircle2, ChevronLeft, ChevronRight, PenTool, XCircle, Mic, MicOff, RefreshCw, Layers, Check, History, Target } from 'lucide-react';
import { playTextToSpeech, getSimulationReply, evaluateSimulation, evaluateSentence } from '../services/geminiService';

export const IntroView: React.FC<{ theme: string; level: string; onNext: () => void }> = ({ theme, level, onNext }) => (
  <div className="flex flex-col items-center justify-center h-full text-center space-y-6 animate-fade-in p-6">
    <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-full text-sm font-bold tracking-wide uppercase">
      <Sparkles size={16} />
      {level.toUpperCase()} Session
    </div>
    
    <h1 className="text-4xl sm:text-5xl font-serif font-black text-ink dark:text-paper leading-tight">
      {theme}
    </h1>
    
    <p className="text-gray-500 dark:text-zinc-400 text-lg max-w-md mx-auto leading-relaxed font-medium">
      Today we transform how you speak. 3 powerful words, 1 core concept, and a live simulation tailored for {level} level.
    </p>

    <div className="pt-8">
      <button 
        onClick={onNext}
        className="group relative inline-flex items-center justify-center px-10 py-5 font-bold text-white transition-all duration-300 bg-ink dark:bg-indigo-600 rounded-3xl hover:bg-indigo-600 dark:hover:bg-indigo-500 hover:shadow-2xl hover:-translate-y-1 transform active:scale-95"
      >
        <span>Start Lesson</span>
        <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
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
  <div className="space-y-6 h-full flex flex-col animate-fade-in">
    <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 font-black uppercase tracking-[0.2em] text-[10px]">
            <BookOpen size={14} />
            <span>Power Word {index + 1} of {data.length}</span>
        </div>
        <div className="flex gap-1.5">
            {data.map((_, i) => (
                <div key={i} className={`h-1.5 w-6 rounded-full transition-all duration-500 ${i === index ? 'bg-indigo-600 w-10' : 'bg-indigo-100 dark:bg-zinc-800'}`}></div>
            ))}
        </div>
    </div>
    
    <div className="flex-1 overflow-y-auto hide-scrollbar">
      <div className="flex items-center justify-between mb-4">
          <h2 className="text-5xl font-serif font-black text-ink dark:text-paper tracking-tight leading-none">{current.word}</h2>
          <button onClick={handlePlay} disabled={isPlaying} className="p-4 bg-gray-50 dark:bg-zinc-800 hover:bg-indigo-100 dark:hover:bg-zinc-700 rounded-2xl transition-all text-indigo-600 dark:text-indigo-400 border border-gray-100 dark:border-zinc-700 shadow-sm active:scale-90 flex-shrink-0">
            {isPlaying ? <Loader2 size={24} className="animate-spin" /> : <Volume2 size={24} />}
          </button>
      </div>
      <p className="text-gray-400 dark:text-zinc-500 text-xl font-medium mb-8 font-serif">/{current.pronunciation}/</p>

      <div className="bg-indigo-50 dark:bg-indigo-950/20 p-6 rounded-[2rem] border-2 border-indigo-100 dark:border-indigo-900/30 relative mb-8">
        <div className="absolute -top-3 left-8 bg-indigo-600 text-white px-4 py-1 text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg">
          Practical Meaning
        </div>
        <p className="text-indigo-950 dark:text-indigo-200 text-xl font-bold leading-relaxed pt-2">
          "{current.simpleDefinition}"
        </p>
      </div>

      <div className="bg-white dark:bg-zinc-800 p-5 rounded-2xl border border-gray-100 dark:border-zinc-700 shadow-sm">
          <h3 className="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-3">Model Usages</h3>
          <ul className="space-y-3">
            {current.exampleSentences && current.exampleSentences.length > 0 ? (
                current.exampleSentences.map((sentence, idx) => (
                    <li key={idx} className="text-base font-serif text-ink dark:text-paper italic leading-relaxed pl-3 border-l-2 border-indigo-100 dark:border-indigo-800">
                        "{sentence}"
                    </li>
                ))
            ) : (
                <li className="text-base font-serif text-ink dark:text-paper italic leading-relaxed">
                   "{ (current as any).exampleSentence }"
                </li>
            )}
          </ul>
      </div>
      <div className="mt-4 text-right">
        <p className="text-[10px] text-gray-400 dark:text-zinc-500 font-medium px-2 inline-block">Etymology: {current.etymology}</p>
      </div>
    </div>

    <button onClick={nextWord} className="w-full bg-ink dark:bg-indigo-600 text-white py-5 rounded-[1.5rem] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-indigo-600 dark:hover:bg-indigo-500 transition-all shadow-xl active:scale-95">
        {index < data.length - 1 ? "Next Word" : "Begin Practice"}
        <ArrowRight size={20} />
    </button>
  </div>
  );
};

export const VocabularyPracticeView: React.FC<{ words: Vocabulary[]; onNext: () => void; onSkip: () => void }> = ({ words, onNext, onSkip }) => {
    const [wordIdx, setWordIdx] = useState(0);
    // Puzzle State
    const [scrambledWords, setScrambledWords] = useState<{id: number, text: string}[]>([]);
    const [selectedWords, setSelectedWords] = useState<{id: number, text: string}[]>([]);
    const [correctOrder, setCorrectOrder] = useState<string[]>([]);
    const [puzzleSolved, setPuzzleSolved] = useState(false);
    const [isWrong, setIsWrong] = useState(false);

    const current = words[wordIdx];

    useEffect(() => {
        // Init Puzzle
        const sentence = current.exampleSentences && current.exampleSentences.length > 0 
            ? current.exampleSentences[0] 
            : (current as any).exampleSentence;
        
        // Remove punctuation for easier matching, keep for display? Simpler to just split by space for now.
        const cleanSentence = sentence.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
        const parts = cleanSentence.split(/\s+/);
        setCorrectOrder(parts);

        const items = parts.map((w: string, i: number) => ({ id: i, text: w }));
        // Shuffle
        for (let i = items.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [items[i], items[j]] = [items[j], items[i]];
        }
        setScrambledWords(items);
        setSelectedWords([]);
        setPuzzleSolved(false);
        setIsWrong(false);
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
        
        if (currentSentence === targetSentence) {
            setPuzzleSolved(true);
            playTextToSpeech(currentSentence);
        } else {
            setIsWrong(true);
            setTimeout(() => setIsWrong(false), 500);
        }
    };

    const handleNext = () => {
        if (wordIdx < words.length - 1) setWordIdx(wordIdx + 1);
        else onNext();
    };

    return (
        <div className="h-full flex flex-col space-y-6 animate-fade-in">
             <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-fuchsia-600 dark:text-fuchsia-400 font-black uppercase tracking-[0.2em] text-[10px]">
                    <Layers size={14} />
                    <span>Syntax Puzzle {wordIdx + 1} of {words.length}</span>
                </div>
                <button 
                  onClick={onSkip}
                  className="text-[10px] font-black uppercase text-gray-400 dark:text-zinc-500 hover:text-ink dark:hover:text-paper transition-colors flex items-center gap-1"
                >
                  Skip <XCircle size={12} />
                </button>
            </div>

            <div className="flex-1 flex flex-col justify-center">
                <div className="text-center mb-8">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-zinc-500 mb-2">Rebuild the Sentence</p>
                    <h2 className="text-3xl font-serif font-black text-ink dark:text-paper mb-2">{current.word}</h2>
                    <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">"{current.simpleDefinition}"</p>
                </div>

                {/* Drop Zone */}
                <div className={`min-h-[120px] bg-white dark:bg-zinc-800 rounded-3xl border-2 border-dashed p-4 flex flex-wrap content-start gap-2 mb-6 transition-colors duration-300 ${puzzleSolved ? 'border-green-400 bg-green-50 dark:bg-green-900/20' : isWrong ? 'border-red-400 bg-red-50 dark:bg-red-900/20' : 'border-gray-200 dark:border-zinc-700'}`}>
                    {selectedWords.length === 0 && !puzzleSolved && (
                        <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-zinc-600 text-sm font-black uppercase tracking-widest pointer-events-none">
                            Tap words below
                        </div>
                    )}
                    {selectedWords.map((item) => (
                        <button 
                            key={item.id} 
                            onClick={() => !puzzleSolved && handleWordClick(item, false)}
                            className="bg-ink dark:bg-paper text-white dark:text-ink px-4 py-2 rounded-xl text-lg font-serif font-medium shadow-md animate-fade-in hover:scale-105 active:scale-95 transition-all"
                        >
                            {item.text}
                        </button>
                    ))}
                    {puzzleSolved && (
                        <div className="w-full flex items-center justify-center mt-2 text-green-600 dark:text-green-400 font-black uppercase tracking-widest text-xs gap-2 animate-bounce">
                            <CheckCircle2 size={16} /> Perfect Syntax
                        </div>
                    )}
                </div>

                {/* Scramble Pool */}
                <div className="flex flex-wrap justify-center gap-2 mb-4">
                    {scrambledWords.map((item) => (
                        <button 
                            key={item.id} 
                            onClick={() => handleWordClick(item, true)}
                            className="bg-gray-100 dark:bg-zinc-700 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-xl text-lg font-serif font-medium shadow-sm hover:bg-gray-200 dark:hover:bg-zinc-600 active:scale-95 transition-all"
                        >
                            {item.text}
                        </button>
                    ))}
                </div>
            </div>

            <div className="pt-4">
                {!puzzleSolved ? (
                    <button 
                        onClick={handleCheck}
                        disabled={selectedWords.length === 0}
                        className="w-full bg-ink dark:bg-fuchsia-600 text-white py-5 rounded-3xl font-black uppercase tracking-widest hover:bg-fuchsia-600 dark:hover:bg-fuchsia-500 transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Check Syntax
                    </button>
                ) : (
                    <button onClick={handleNext} className="w-full bg-fuchsia-600 text-white py-5 rounded-3xl font-black uppercase tracking-widest shadow-xl animate-fade-in flex items-center justify-center gap-2">
                        {wordIdx < words.length - 1 ? 'Next Word' : 'Go to Core Concept'} <ArrowRight size={20} />
                    </button>
                )}
            </div>
        </div>
    );
};

export const ReviewVaultView: React.FC<{ words: Vocabulary[], onClose: () => void }> = ({ words, onClose }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [finished, setFinished] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);

    const current = words[currentIndex];

    const handleNext = (mastered: boolean) => {
        setIsFlipped(false);
        if (currentIndex < words.length - 1) {
            setTimeout(() => setCurrentIndex(prev => prev + 1), 300);
        } else {
            setTimeout(() => setFinished(true), 300);
        }
    };

    const handlePlayAudio = async (e: React.SyntheticEvent) => {
        e.stopPropagation();
        if (isPlaying) return;
        setIsPlaying(true);
        try {
            await playTextToSpeech(current.word);
        } catch (error) {
            console.error(error);
        } finally {
            setIsPlaying(false);
        }
    };

    if (finished) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-center animate-fade-in">
                <div className="w-24 h-24 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-inner">
                    <CheckCircle2 size={48} />
                </div>
                <h2 className="text-4xl font-serif font-black text-ink dark:text-paper mb-4">Review Complete</h2>
                <p className="text-gray-500 dark:text-zinc-400 mb-10 max-w-xs text-lg font-medium leading-relaxed">You've successfully refreshed your memory bank.</p>
                <button onClick={onClose} className="w-full bg-ink dark:bg-indigo-600 text-white py-6 rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-indigo-600 dark:hover:bg-indigo-500 transition-all">
                    Return to Dashboard
                </button>
            </div>
        );
    }

    // Stop propagation handler
    const stopProp = (e: React.SyntheticEvent) => {
        e.stopPropagation();
    };

    return (
        <div className="h-full flex flex-col animate-fade-in relative">
             <div className="flex items-center justify-between mb-4 shrink-0 z-10">
                <div className="flex items-center space-x-3 text-indigo-600 dark:text-indigo-400 font-black uppercase tracking-[0.2em] text-[10px]">
                    <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
                        <RefreshCw size={14} />
                    </div>
                    <span>Vault Card {currentIndex + 1}/{words.length}</span>
                </div>
                <button onClick={onClose} className="text-gray-300 dark:text-zinc-600 hover:text-ink dark:hover:text-white transition-colors p-2 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-full">
                    <XCircle size={24} />
                </button>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center min-h-0 relative z-0">
                <div 
                    className="w-full max-w-sm h-[480px] sm:h-[520px] relative perspective-1000 group cursor-pointer transition-all duration-300"
                    onClick={() => setIsFlipped(!isFlipped)}
                >
                    <div className={`w-full h-full relative preserve-3d transition-transform duration-700 ease-out-back shadow-2xl shadow-indigo-200 dark:shadow-black/50 rounded-[2rem] ${isFlipped ? 'rotate-y-180' : ''}`}>
                        
                        {/* FRONT */}
                        <div 
                            className="absolute inset-0 backface-hidden bg-white dark:bg-zinc-800 rounded-[2rem] border border-gray-100 dark:border-zinc-700 p-6 sm:p-8 flex flex-col items-center text-center overflow-hidden"
                            style={{ zIndex: isFlipped ? 0 : 20 }}
                        >
                             <div className="flex-1 flex flex-col items-center justify-center w-full min-h-0 overflow-y-auto hide-scrollbar z-10 space-y-4">
                                {/* Decor */}
                                <Brain size={80} className="text-gray-100 dark:text-zinc-700/50 mb-2 shrink-0" />

                                <div className="space-y-4">
                                    <span className="inline-block px-4 py-1.5 bg-gray-100 dark:bg-zinc-700 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-zinc-400">
                                        Definition
                                    </span>
                                    <p className="text-2xl sm:text-3xl font-serif font-bold text-ink dark:text-paper leading-tight">
                                        "{current.simpleDefinition}"
                                    </p>
                                </div>
                             </div>
                             
                             <div className="shrink-0 mt-4 animate-pulse opacity-50">
                                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 dark:text-indigo-500">Tap Card to Flip</span>
                             </div>
                        </div>

                        {/* BACK */}
                        <div 
                            className="absolute inset-0 backface-hidden rotate-y-180 bg-gradient-to-br from-indigo-600 to-indigo-800 text-white rounded-[2rem] p-6 sm:p-8 flex flex-col text-center overflow-hidden border border-white/10"
                            style={{ zIndex: isFlipped ? 20 : 0 }}
                        >
                            {/* Background Effects */}
                            <div className="absolute -top-20 -left-20 w-40 h-40 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
                            
                            <div className="flex-1 flex flex-col items-center justify-center w-full min-h-0 overflow-y-auto hide-scrollbar z-10">
                                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200 mb-2 opacity-70">The Power Word Is</p>
                                <h2 className="text-3xl sm:text-5xl font-serif font-black mb-3 tracking-tight break-words max-w-full leading-none">{current.word}</h2>
                                <div className="flex items-center gap-3 mb-4 bg-black/20 px-4 py-2 rounded-full backdrop-blur-sm shrink-0">
                                    <p className="text-base sm:text-lg opacity-90 font-serif italic">/{current.pronunciation}/</p>
                                    <button 
                                        type="button"
                                        onClick={handlePlayAudio}
                                        onMouseDown={stopProp}
                                        onMouseUp={stopProp}
                                        onTouchStart={stopProp}
                                        onTouchEnd={stopProp}
                                        disabled={isPlaying}
                                        className="relative z-50 p-1.5 bg-white/20 hover:bg-white/40 rounded-full transition-colors active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isPlaying ? <Loader2 size={16} className="animate-spin" /> : <Volume2 size={16} />}
                                    </button>
                                </div>
                            </div>

                            <div className="w-full grid grid-cols-2 gap-3 pt-4 border-t border-white/10 shrink-0 z-20">
                                <button 
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); handleNext(false); }} 
                                    onMouseDown={stopProp}
                                    onTouchEnd={stopProp}
                                    className="py-3 sm:py-4 rounded-2xl font-black uppercase text-[9px] sm:text-[10px] tracking-widest bg-indigo-900/40 hover:bg-indigo-900/60 transition-colors text-indigo-200 border border-indigo-500/30 backdrop-blur-sm"
                                >
                                    Still Learning
                                </button>
                                <button 
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); handleNext(true); }} 
                                    onMouseDown={stopProp}
                                    onTouchEnd={stopProp}
                                    className="py-3 sm:py-4 rounded-2xl font-black uppercase text-[9px] sm:text-[10px] tracking-widest bg-white text-indigo-900 hover:scale-105 transition-transform shadow-lg"
                                >
                                    Mastered
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const ConceptView: React.FC<{ data: Concept }> = ({ data }) => (
  <div className="space-y-6 h-full flex flex-col animate-fade-in">
    <div className="flex items-center space-x-2 text-amber-600 dark:text-amber-400 font-black uppercase tracking-[0.2em] text-[10px]">
      <Lightbulb size={14} />
      <span>Big Idea Strategy</span>
    </div>

    <div>
      <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 px-3 py-1 rounded-lg text-[10px] font-black mb-3 inline-block uppercase tracking-widest">
        {data.field}
      </span>
      <h2 className="text-3xl sm:text-4xl font-serif font-black text-ink dark:text-paper mb-4">{data.title}</h2>
      <p className="text-gray-600 dark:text-zinc-400 text-lg leading-relaxed font-medium">
        {data.explanation}
      </p>
    </div>

    <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 p-8 rounded-[2.5rem] border border-amber-100 dark:border-amber-900/30 flex-1 shadow-inner">
      <div className="flex flex-col h-full justify-center space-y-4">
        <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-black text-[10px] uppercase tracking-widest">
            <Sparkles size={18} />
            <span>The Mental Hook</span>
        </div>
        <p className="text-amber-950 dark:text-amber-200 text-2xl font-black font-serif leading-relaxed italic">
          "{data.analogy}"
        </p>
      </div>
    </div>

    <div className="bg-white dark:bg-zinc-800 p-5 rounded-2xl border border-gray-100 dark:border-zinc-700 flex items-center gap-4 shadow-sm">
        <div className="bg-gray-50 dark:bg-zinc-700 p-3 rounded-xl text-gray-500 dark:text-zinc-400">
            <MessageCircle size={20} />
        </div>
        <div className="text-sm">
            <span className="block font-black text-[10px] text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-0.5">Practice Hook:</span>
            <span className="text-ink dark:text-paper font-bold italic">"{data.conversationStarter}"</span>
        </div>
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
  const [isEvaluating, setIsEvaluating] = useState(false);
  
  // Voice Input State
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize Speech Recognition if available
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => (prev ? prev + " " + transcript : transcript));
      };
      
      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
        alert("Speech recognition is not supported in this browser. Please use Chrome or Safari.");
        return;
    }
    if (isListening) {
        recognitionRef.current.stop();
    } else {
        recognitionRef.current.start();
    }
  };

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(() => scrollToBottom(), [messages, feedback]);

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

  const handleGetFeedback = async () => {
      setIsEvaluating(true);
      try {
          const result = await evaluateSimulation(messages, data.objective);
          setFeedback(result);
      } catch (e) { console.error(e); } finally { setIsEvaluating(false); }
  };

  return (
    <div className="flex flex-col h-full animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 font-black uppercase tracking-[0.2em] text-[10px]">
            <MessageCircle size={14} />
            <span>Voice Lab Simulator</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[10px] bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full font-black uppercase tracking-widest border border-blue-100 dark:border-blue-900/40">
              {data.setting}
          </span>
          <button 
            onClick={onSkip}
            className="text-[10px] font-black uppercase text-gray-400 dark:text-zinc-500 hover:text-ink dark:hover:text-paper transition-colors flex items-center gap-1"
          >
            Skip <XCircle size={12} />
          </button>
        </div>
      </div>

      <div className="bg-blue-50/50 dark:bg-blue-950/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/30 mb-4 text-xs font-bold text-blue-900 dark:text-blue-200 shadow-inner">
         Goal: {data.objective}
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 p-2 mb-4 pr-2 scroll-smooth hide-scrollbar">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-[1.5rem] text-sm font-medium shadow-sm leading-relaxed ${
                msg.role === 'user' ? 'bg-ink dark:bg-blue-600 text-white rounded-br-none' : 'bg-white dark:bg-zinc-800 text-gray-800 dark:text-paper rounded-bl-none border border-gray-100 dark:border-zinc-700'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {isTyping && (
           <div className="flex justify-start">
             <div className="bg-white dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 p-4 rounded-2xl rounded-bl-none flex space-x-1 shadow-sm">
               <div className="w-1.5 h-1.5 bg-gray-300 dark:bg-zinc-600 rounded-full animate-bounce"></div>
               <div className="w-1.5 h-1.5 bg-gray-300 dark:bg-zinc-600 rounded-full animate-bounce delay-100"></div>
               <div className="w-1.5 h-1.5 bg-gray-300 dark:bg-zinc-600 rounded-full animate-bounce delay-200"></div>
             </div>
           </div>
        )}
        
        {feedback && (
            <div className="mt-8 bg-gradient-to-r from-blue-600 to-indigo-600 p-[1px] rounded-[2rem] animate-fade-in shadow-2xl">
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-[calc(2rem-1px)]">
                    <div className="flex justify-between items-center mb-4">
                         <h4 className="font-black text-indigo-700 dark:text-indigo-400 flex items-center gap-2 uppercase text-xs tracking-widest">
                            <Sparkles size={18} /> Lab Analysis
                         </h4>
                         <div className="bg-indigo-50 dark:bg-zinc-800 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded-lg text-xs font-black">
                            Score: {feedback.score}/10
                         </div>
                    </div>
                    <p className="text-gray-700 dark:text-zinc-300 font-bold mb-4 leading-relaxed italic">"{feedback.feedback}"</p>
                    <div className="bg-indigo-50 dark:bg-zinc-800 p-5 rounded-2xl border border-indigo-100 dark:border-zinc-700 mb-6">
                        <p className="text-[10px] text-indigo-400 dark:text-zinc-500 font-black uppercase mb-1.5 tracking-widest">Coach Suggestion</p>
                        <p className="text-indigo-900 dark:text-indigo-200 text-sm font-black italic">"{feedback.suggestion}"</p>
                    </div>
                    <button 
                        onClick={() => onComplete(messages, feedback)}
                        className="w-full bg-ink dark:bg-indigo-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 dark:hover:bg-indigo-500 transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2"
                    >
                        Save & Continue <ChevronRight size={18} />
                    </button>
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {!feedback && (
        <div className="space-y-3">
             {messages.length >= 2 && (
                <button 
                    onClick={handleGetFeedback}
                    disabled={isEvaluating}
                    className="w-full py-3 bg-white dark:bg-zinc-800 text-blue-700 dark:text-blue-400 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-blue-50 dark:hover:bg-zinc-700 transition-all border-2 border-blue-100 dark:border-zinc-700"
                >
                    {isEvaluating ? "Processing Dialogue..." : "Analyze Conversation"}
                </button>
             )}
             <div className="relative flex gap-2">
                <div className="relative flex-1">
                    <input 
                        type="text" 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder={isListening ? "Listening..." : "Respond naturally..."}
                        className={`w-full bg-white dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-[1.5rem] py-5 px-6 pr-16 shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium transition-all dark:text-paper ${isListening ? 'ring-2 ring-red-400 animate-pulse' : ''}`}
                    />
                    <button 
                        onClick={handleSend}
                        disabled={!input.trim() || isTyping}
                        className="absolute right-3 top-3 p-3 bg-blue-600 dark:bg-blue-500 text-white rounded-xl hover:bg-blue-700 dark:hover:bg-blue-400 shadow-md active:scale-90 transition-all"
                    >
                        <Send size={18} />
                    </button>
                </div>
                <button 
                    onClick={toggleListening}
                    className={`p-4 rounded-[1.5rem] shadow-lg transition-all active:scale-95 border-2 ${isListening ? 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-500' : 'bg-white dark:bg-zinc-800 border-gray-100 dark:border-zinc-700 text-gray-400 hover:text-blue-500'}`}
                >
                    {isListening ? <MicOff size={20} className="animate-pulse" /> : <Mic size={20} />}
                </button>
             </div>
        </div>
      )}
    </div>
  );
};

export const StoryView: React.FC<{ data: Story }> = ({ data }) => (
  <div className="space-y-6 h-full flex flex-col animate-fade-in">
    <div className="flex items-center space-x-2 text-rose-600 dark:text-rose-400 font-black uppercase tracking-[0.2em] text-[10px]">
      <History size={14} />
      <span>Historical Context</span>
    </div>
    
    <div>
      <h2 className="text-3xl sm:text-4xl font-serif font-black text-ink dark:text-paper mb-4 leading-tight">{data.headline}</h2>
    </div>

    <div className="flex-1 overflow-y-auto hide-scrollbar pr-2">
      <p className="text-gray-600 dark:text-zinc-400 text-lg leading-relaxed font-medium font-serif border-l-4 border-rose-100 dark:border-rose-900/30 pl-4">
        {data.body}
      </p>
    </div>

    <div className="bg-rose-50 dark:bg-rose-950/20 p-6 rounded-[2rem] border border-rose-100 dark:border-rose-900/30">
        <p className="text-[10px] text-rose-700 dark:text-rose-400 font-black uppercase tracking-widest mb-2 flex items-center gap-2">
            <Lightbulb size={14} /> Key Insight
        </p>
        <p className="text-rose-900 dark:text-rose-200 text-xl font-bold italic leading-relaxed">
          "{data.keyTakeaway}"
        </p>
    </div>
  </div>
);

export const ChallengeView: React.FC<{ data: Challenge; onComplete: () => void }> = ({ data, onComplete }) => (
  <div className="h-full flex flex-col animate-fade-in text-center justify-center space-y-8">
     <div className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-full text-sm font-bold tracking-wide uppercase mx-auto">
      <Target size={16} />
      Daily Mission
    </div>

    <div>
        <h2 className="text-3xl sm:text-4xl font-serif font-black text-ink dark:text-paper mb-6">Your Challenge</h2>
        <div className="bg-indigo-600 text-white p-8 rounded-[2.5rem] shadow-2xl transform hover:scale-[1.02] transition-transform duration-500">
            <p className="text-2xl font-bold leading-relaxed">
                "{data.task}"
            </p>
        </div>
    </div>

    <div className="flex items-start gap-4 text-left max-w-sm mx-auto bg-gray-50 dark:bg-zinc-800 p-5 rounded-2xl border border-gray-100 dark:border-zinc-700">
        <div className="bg-white dark:bg-zinc-700 p-2 rounded-xl text-indigo-500 shadow-sm"><Sparkles size={20} /></div>
        <div>
            <span className="block font-black text-[10px] text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-1">Pro Tip</span>
            <p className="text-sm font-medium text-gray-600 dark:text-zinc-300 italic">{data.tip}</p>
        </div>
    </div>

    <div className="pt-4">
        <button onClick={onComplete} className="w-full bg-ink dark:bg-white text-white dark:text-ink py-5 rounded-[2rem] font-black uppercase tracking-widest hover:bg-indigo-600 dark:hover:bg-indigo-50 transition-all shadow-xl flex items-center justify-center gap-3 active:scale-95">
            <CheckCircle2 size={20} /> Complete Session
        </button>
    </div>
  </div>
);