import React, { useState, useEffect, useRef } from 'react';
import { Vocabulary, Concept, Story, Challenge, Simulation, SimulationFeedback } from '../types';
import { BookOpen, MessageCircle, Lightbulb, Brain, Volume2, Sparkles, ArrowRight, PlayCircle, Loader2, Send, User, CheckCircle2, ChevronLeft, ChevronRight, PenTool, XCircle, Mic, MicOff } from 'lucide-react';
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
    
    <div className="flex-1 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
          <h2 className="text-5xl font-serif font-black text-ink dark:text-paper tracking-tight leading-none">{current.word}</h2>
          <button onClick={handlePlay} disabled={isPlaying} className="p-4 bg-gray-50 dark:bg-zinc-800 hover:bg-indigo-100 dark:hover:bg-zinc-700 rounded-2xl transition-all text-indigo-600 dark:text-indigo-400 border border-gray-100 dark:border-zinc-700 shadow-sm active:scale-90">
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

      <div className="space-y-4">
          <div className="bg-white dark:bg-zinc-800 p-5 rounded-2xl border border-gray-100 dark:border-zinc-700 shadow-sm">
              <h3 className="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-3">Model Usage</h3>
              <p className="text-lg font-serif text-ink dark:text-paper italic leading-relaxed">"{current.exampleSentence}"</p>
          </div>
          <p className="text-[11px] text-gray-400 dark:text-zinc-500 font-medium bg-gray-50 dark:bg-zinc-800 px-3 py-2 rounded-lg inline-block">Etymology: {current.etymology}</p>
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
    const [input, setInput] = useState("");
    const [feedback, setFeedback] = useState<{ correct: boolean; feedback: string } | null>(null);
    const [isChecking, setIsChecking] = useState(false);
    
    const current = words[wordIdx];

    const handleCheck = async () => {
        if (!input.trim() || isChecking) return;
        setIsChecking(true);
        const result = await evaluateSentence(current.word, current.simpleDefinition, input);
        setFeedback(result);
        setIsChecking(false);
    };

    const handleNext = () => {
        setFeedback(null);
        setInput("");
        if (wordIdx < words.length - 1) setWordIdx(wordIdx + 1);
        else onNext();
    };

    return (
        <div className="h-full flex flex-col space-y-6 animate-fade-in">
             <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-fuchsia-600 dark:text-fuchsia-400 font-black uppercase tracking-[0.2em] text-[10px]">
                    <PenTool size={14} />
                    <span>Drill {wordIdx + 1} of {words.length}</span>
                </div>
                <button 
                  onClick={onSkip}
                  className="text-[10px] font-black uppercase text-gray-400 dark:text-zinc-500 hover:text-ink dark:hover:text-paper transition-colors flex items-center gap-1"
                >
                  Skip Practice <XCircle size={12} />
                </button>
            </div>

            <div className="flex-1">
                <h3 className="text-xs font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-2">Use it in a sentence:</h3>
                <h2 className="text-4xl font-serif font-black text-ink dark:text-paper mb-6">{current.word}</h2>

                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={!!feedback}
                    placeholder={`e.g., "The team showed great ${current.word.toLowerCase()} during the meeting."`}
                    className="w-full h-32 p-5 bg-white dark:bg-zinc-800 border-2 border-gray-100 dark:border-zinc-700 rounded-3xl resize-none focus:outline-none focus:border-fuchsia-500 transition-all text-lg font-medium leading-relaxed shadow-inner dark:text-paper"
                />

                {feedback && (
                    <div className={`mt-6 p-6 rounded-3xl border-2 animate-fade-in ${feedback.correct ? 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800/30 text-green-800 dark:text-green-300' : 'bg-orange-50 dark:bg-orange-900/20 border-orange-100 dark:border-orange-800/30 text-orange-800 dark:text-orange-300'}`}>
                        <div className="flex items-center gap-2 mb-2">
                            {feedback.correct ? <CheckCircle2 size={18} /> : <Sparkles size={18} />}
                            <span className="font-black text-[10px] uppercase tracking-widest">{feedback.correct ? 'Perfect Usage' : 'Coach Hint'}</span>
                        </div>
                        <p className="font-bold text-lg">{feedback.feedback}</p>
                    </div>
                )}
            </div>

            <div className="pt-4">
                {!feedback ? (
                    <button 
                        onClick={handleCheck}
                        disabled={!input.trim() || isChecking}
                        className="w-full bg-ink dark:bg-fuchsia-600 text-white py-5 rounded-3xl font-black uppercase tracking-widest hover:bg-fuchsia-600 dark:hover:bg-fuchsia-500 transition-all shadow-xl disabled:opacity-50"
                    >
                        {isChecking ? <Loader2 size={24} className="animate-spin mx-auto" /> : 'Evaluate Sentence'}
                    </button>
                ) : (
                    <button onClick={handleNext} className="w-full bg-fuchsia-600 text-white py-5 rounded-3xl font-black uppercase tracking-widest shadow-xl animate-fade-in">
                        {wordIdx < words.length - 1 ? 'Next Word' : 'Go to Core Concept'}
                    </button>
                )}
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

export const StoryView: React.FC<{ data: Story }> = ({ data }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const handlePlayStory = async () => {
      if (isPlaying) return;
      setIsPlaying(true);
      try { await playTextToSpeech(data.body); } finally { setIsPlaying(false); }
  };

  return (
  <div className="space-y-6 animate-fade-in">
    <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 font-black uppercase tracking-[0.2em] text-[10px]">
            <BookOpen size={14} />
            <span>Micro Storytelling</span>
        </div>
        <button onClick={handlePlayStory} disabled={isPlaying} className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-all border border-emerald-100 dark:border-emerald-900/30 shadow-sm">
            {isPlaying ? <Loader2 size={14} className="animate-spin" /> : <PlayCircle size={14} />}
            {isPlaying ? "Rendering Voice..." : "Audio Experience"}
        </button>
    </div>

    <h2 className="text-3xl font-serif font-black text-ink dark:text-paper leading-tight">{data.headline}</h2>
    
    <div className="bg-emerald-50/20 dark:bg-emerald-950/10 p-8 rounded-[2.5rem] border border-emerald-100 dark:border-emerald-900/20 shadow-inner">
        <div className="prose prose-lg text-gray-800 dark:text-zinc-300 leading-relaxed font-serif text-lg">
        {data.body.split('\n').map((paragraph, idx) => (
            <p key={idx} className="mb-4 last:mb-0">{paragraph}</p>
        ))}
        </div>
    </div>

    <div className="flex items-center gap-5 bg-emerald-100 dark:bg-emerald-900/30 p-6 rounded-[1.5rem] text-emerald-950 dark:text-emerald-100 shadow-md border border-emerald-200 dark:border-emerald-800/40">
      <Brain size={32} className="text-emerald-700 dark:text-emerald-400 flex-shrink-0" />
      <div>
          <h3 className="font-black text-[10px] uppercase opacity-50 tracking-widest mb-1.5">The Moral Lesson</h3>
          <p className="font-black text-lg leading-tight">{data.keyTakeaway}</p>
      </div>
    </div>
  </div>
  );
};

export const ChallengeView: React.FC<{ data: Challenge; onComplete: () => void }> = ({ data, onComplete }) => (
  <div className="flex flex-col h-full justify-between animate-fade-in">
    <div className="space-y-8">
      <div className="flex items-center space-x-2 text-purple-600 dark:text-purple-400 font-black uppercase tracking-[0.2em] text-[10px]">
        <Brain size={14} />
        <span>Today's Real-World Lab</span>
      </div>

      <div>
        <h2 className="text-4xl font-serif font-black text-ink dark:text-paper mb-6">Your Mission</h2>
        <div className="bg-white dark:bg-zinc-800 p-12 rounded-[3rem] shadow-2xl border border-gray-100 dark:border-zinc-700 text-center relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 group-hover:h-4 transition-all duration-500"></div>
            <p className="text-2xl text-gray-800 dark:text-paper font-black leading-relaxed italic">"{data.task}"</p>
        </div>
      </div>

      <div className="bg-purple-50 dark:bg-purple-950/20 p-8 rounded-[2rem] border border-purple-100 dark:border-purple-900/30 flex gap-5 items-start shadow-sm">
        <div className="bg-purple-200 dark:bg-purple-900/40 p-3 rounded-2xl text-purple-700 dark:text-purple-300 shadow-inner">
            <Lightbulb size={28} />
        </div>
        <div>
            <h3 className="font-black text-[10px] text-purple-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5">Strategic Hint</h3>
            <p className="text-purple-900 dark:text-purple-200 font-bold leading-relaxed">{data.tip}</p>
        </div>
      </div>
    </div>

    <button 
      onClick={onComplete}
      className="w-full bg-ink dark:bg-purple-600 text-white py-6 rounded-[1.5rem] font-black uppercase tracking-[0.2em] hover:bg-purple-600 dark:hover:bg-purple-500 transition-all mt-8 flex items-center justify-center gap-4 shadow-2xl transform hover:-translate-y-1 active:scale-95"
    >
      Finish Day & Save
      <CheckCircle2 size={24} />
    </button>
  </div>
);