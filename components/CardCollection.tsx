import React from 'react';
import { CollectedCard } from '../types';
import { ChevronLeft, Grid, Filter, Crown, Sparkles, XCircle } from 'lucide-react';

interface CardCollectionProps {
    cards: CollectedCard[];
    onBack: () => void;
}

export const CardCollection: React.FC<CardCollectionProps> = ({ cards, onBack }) => {
    // Group cards by Vibe
    const getGradient = (vibe: string) => {
        switch(vibe) {
            case 'social': return 'from-pink-500 to-rose-500';
            case 'professional': return 'from-blue-600 to-indigo-700';
            case 'intellectual': return 'from-emerald-600 to-teal-700';
            case 'charisma': return 'from-amber-500 to-orange-600';
            default: return 'from-indigo-500 to-purple-600';
        }
    };

    return (
        <div className="min-h-screen bg-surface dark:bg-ink flex flex-col p-4 sm:p-6 transition-colors duration-300">
            <header className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="bg-white dark:bg-zinc-800 p-3 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-700 text-gray-400 hover:text-ink dark:hover:text-paper transition-all">
                        <ChevronLeft size={20} />
                    </button>
                    <div>
                        <h1 className="font-serif text-3xl font-black text-ink dark:text-paper">Artifact Vault</h1>
                        <p className="text-[10px] text-gray-400 dark:text-zinc-500 font-black uppercase tracking-widest">{cards.length} Artifacts Collected</p>
                    </div>
                </div>
            </header>

            {cards.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50">
                    <Grid size={48} className="mb-4 text-gray-300 dark:text-zinc-700" />
                    <p className="text-gray-400 font-medium">Your vault is empty.</p>
                    <p className="text-xs text-gray-300 uppercase tracking-widest mt-2">Complete lessons to unlock cards.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-10">
                    {cards.map((card) => (
                        <div key={card.id} className="group perspective-1000 h-[300px] cursor-pointer">
                            <div className="relative w-full h-full transform transition-transform duration-500 group-hover:rotate-y-12 preserve-3d">
                                <div className={`absolute inset-0 bg-gradient-to-br ${getGradient(card.vibe)} rounded-[2rem] p-6 text-white shadow-2xl flex flex-col justify-between border-2 border-white/10`}>
                                    {/* Texture overlay */}
                                    <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] rounded-[2rem]"></div>
                                    
                                    <div className="relative z-10 flex justify-between items-start">
                                        <div className="bg-black/20 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10">
                                            {card.vibe}
                                        </div>
                                        <Crown size={20} className="text-white/50" />
                                    </div>

                                    <div className="relative z-10 text-center">
                                        <Sparkles size={32} className="mx-auto mb-4 text-white/80" />
                                        <h3 className="font-serif font-black text-2xl leading-tight mb-1">{card.title}</h3>
                                        <p className="text-[10px] uppercase tracking-widest opacity-70">{card.theme} Mastery</p>
                                    </div>

                                    <div className="relative z-10">
                                        <div className="w-full h-px bg-gradient-to-r from-transparent via-white/40 to-transparent mb-3"></div>
                                        <div className="flex justify-between items-end">
                                            <p className="text-[9px] font-mono opacity-60">#{card.id.slice(-6)}</p>
                                            <p className="text-[10px] font-black bg-white text-indigo-900 px-2 py-0.5 rounded uppercase">{card.rarity}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
