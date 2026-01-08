import React from 'react';
import { Brain, Sparkles, MessageSquare, Zap, Target, Award, Shield, Heart, Zap as Flash, Users, Mic2, Star, Lock, MapPin, Smile, Gavel, Lightbulb, Crown, Feather } from 'lucide-react';
import { SkillNode } from '../types';

export const SKILL_TREE_DATA: SkillNode[] = [
    { id: 'core_1', label: 'Core Clarity', description: 'Master conversational flow.', icon: Zap, targetVibe: 'social', targetLevel: 'noob', requiredXp: 0, cost: 0, dependencies: [], position: { x: 50, y: 90 } },
    { id: 'social_1', label: 'The Icebreaker', description: 'Ignite small talk effortlessly.', icon: Sparkles, targetVibe: 'social', targetLevel: 'beginner', requiredXp: 200, cost: 250, dependencies: ['core_1'], position: { x: 30, y: 75 } },
    { id: 'humor_1', label: 'Wit & Banter', description: 'Timing and comedy basics.', icon: MessageSquare, targetVibe: 'humorous', targetLevel: 'intermediate', requiredXp: 600, cost: 500, dependencies: ['social_1'], position: { x: 20, y: 55 } },
    { id: 'charisma_1', label: 'Magnetic Presence', description: 'Command any room.', icon: Heart, targetVibe: 'charisma', targetLevel: 'advanced', requiredXp: 1200, cost: 1000, dependencies: ['humor_1'], position: { x: 15, y: 35 } },
    { id: 'story_1', label: 'Grand Storyteller', description: 'Weave compelling narratives.', icon: Feather, targetVibe: 'charisma', targetLevel: 'master', requiredXp: 2500, cost: 2000, dependencies: ['charisma_1'], position: { x: 25, y: 15 } },
    { id: 'empathy_1', label: 'Active Listening', description: 'Deep emotional connection.', icon: Smile, targetVibe: 'empathy', targetLevel: 'beginner', requiredXp: 200, cost: 250, dependencies: ['core_1'], position: { x: 50, y: 70 } },
    { id: 'logic_1', label: 'Rhetoric', description: 'The art of argument.', icon: Flash, targetVibe: 'intellectual', targetLevel: 'intermediate', requiredXp: 800, cost: 500, dependencies: ['empathy_1'], position: { x: 50, y: 50 } },
    { id: 'phil_1', label: 'Deep Thought', description: 'Abstract concepts & philosophy.', icon: Brain, targetVibe: 'intellectual', targetLevel: 'advanced', requiredXp: 1500, cost: 1000, dependencies: ['logic_1'], position: { x: 50, y: 30 } },
    { id: 'sage_1', label: 'The Sage', description: 'Wisdom and clarity.', icon: Lightbulb, targetVibe: 'intellectual', targetLevel: 'master', requiredXp: 3000, cost: 2000, dependencies: ['phil_1'], position: { x: 50, y: 10 } },
    { id: 'pro_1', label: 'Strategic Mind', description: 'Business logic & poise.', icon: Shield, targetVibe: 'professional', targetLevel: 'beginner', requiredXp: 200, cost: 250, dependencies: ['core_1'], position: { x: 70, y: 75 } },
    { id: 'neg_1', label: 'The Dealmaker', description: 'Win-win negotiation.', icon: HandshakeIcon, targetVibe: 'negotiation', targetLevel: 'intermediate', requiredXp: 600, cost: 500, dependencies: ['pro_1'], position: { x: 80, y: 55 } },
    { id: 'lead_1', label: 'Alpha Leader', description: 'Inspire and direct teams.', icon: Users, targetVibe: 'leadership', targetLevel: 'advanced', requiredXp: 1200, cost: 1000, dependencies: ['neg_1'], position: { x: 85, y: 35 } },
    { id: 'vision_1', label: 'Visionary', description: 'Architect of the future.', icon: Crown, targetVibe: 'leadership', targetLevel: 'master', requiredXp: 2500, cost: 2000, dependencies: ['lead_1'], position: { x: 75, y: 15 } },
];

function HandshakeIcon(props: any) {
    return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m11 17 2 2a1 1 0 1 0 3-3"/><path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.86l.47.36a2 2 0 0 0 2.29.24l1.86-1.11a2 2 0 0 0 .83-1.74l-.08-.74a2 2 0 0 0-3.53-.94l-3.37 3.37a5 5 0 0 0-1.27 2.1l-.85 3.33a5 5 0 0 0 1.27 4.5l3.5 3.5a1 1 0 0 0 1.42 0l2-2"/><path d="m19 19 3 3"/></svg>
}

export const SkillTreeView: React.FC<{ 
    unlockedNodes: string[], 
    availableXp: number, 
    onUnlock: (nodeId: string, cost: number) => void,
    onSelect: (node: SkillNode) => void,
    activeNodeId: string
}> = ({ unlockedNodes, availableXp, onUnlock, onSelect, activeNodeId }) => {

    return (
        <div className="h-full w-full relative overflow-hidden select-none">
            {/* SVG Connections Layer */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                <defs>
                    <linearGradient id="line-unlocked" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity="0.6" />
                        <stop offset="100%" stopColor="#818cf8" stopOpacity="0.4" />
                    </linearGradient>
                    <linearGradient id="line-locked" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#27272a" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#3f3f46" stopOpacity="0.2" />
                    </linearGradient>
                </defs>
                {SKILL_TREE_DATA.map(node => {
                    return node.dependencies.map(depId => {
                        const parent = SKILL_TREE_DATA.find(n => n.id === depId);
                        if (!parent) return null;
                        
                        const isUnlocked = unlockedNodes.includes(node.id);
                        
                        return (
                            <line 
                                key={`${parent.id}-${node.id}`}
                                x1={`${parent.position.x}%`} 
                                y1={`${parent.position.y}%`} 
                                x2={`${node.position.x}%`} 
                                y2={`${node.position.y}%`} 
                                stroke={isUnlocked ? "url(#line-unlocked)" : "url(#line-locked)"} 
                                strokeWidth={isUnlocked ? "2" : "1"}
                                className="transition-all duration-1000"
                            />
                        );
                    });
                })}
            </svg>

            {/* Nodes Layer */}
            <div className="absolute inset-0 z-10">
                {SKILL_TREE_DATA.map((node) => {
                    const isUnlocked = unlockedNodes.includes(node.id);
                    const isActive = activeNodeId === node.id;
                    const parentsUnlocked = node.dependencies.length === 0 || node.dependencies.every(d => unlockedNodes.includes(d));
                    const canUnlock = !isUnlocked && parentsUnlocked && availableXp >= node.cost;

                    return (
                        <div 
                            key={node.id}
                            className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20"
                            style={{ left: `${node.position.x}%`, top: `${node.position.y}%` }}
                        >
                            <button 
                                onClick={() => {
                                    if (isUnlocked) {
                                        onSelect(node);
                                    } else if (canUnlock) {
                                        onUnlock(node.id, node.cost);
                                    }
                                }}
                                className={`
                                    relative flex items-center justify-center rounded-full transition-all duration-700 group
                                    ${isActive 
                                        ? 'w-20 h-20 bg-indigo-600 shadow-[0_0_50px_rgba(79,70,229,0.5)] border-4 border-white scale-110 z-30' 
                                        : 'w-12 h-12 border border-white/5 z-10 hover:scale-110'
                                    }
                                    ${!isActive && isUnlocked ? 'bg-[#18181b] hover:bg-[#202025] hover:border-indigo-500/30' : ''}
                                    ${!isUnlocked && parentsUnlocked ? 'bg-indigo-900/10 border-dashed border-indigo-500/20' : ''}
                                    ${!isUnlocked && !parentsUnlocked ? 'bg-black/40 border-white/5 opacity-20 grayscale cursor-not-allowed' : ''}
                                `}
                            >
                                {isActive && (
                                    <>
                                        <div className="absolute inset-0 rounded-full border border-indigo-400 animate-ping opacity-10"></div>
                                        <div className="absolute -inset-2 rounded-full border border-white/10 animate-pulse"></div>
                                    </>
                                )}

                                <node.icon 
                                    size={isActive ? 28 : 18} 
                                    className={`transition-colors duration-500 ${
                                        isActive ? 'text-white' : 
                                        isUnlocked ? 'text-indigo-400' : 
                                        canUnlock ? 'text-indigo-400/50' : 'text-zinc-700'
                                    }`} 
                                />

                                {!isUnlocked && (
                                    <div className="absolute -top-1 -right-1 bg-black/80 rounded-full p-1 border border-white/10 z-20">
                                        <Lock size={8} className="text-zinc-500" />
                                    </div>
                                )}

                                {canUnlock && (
                                    <div className="absolute -bottom-2 bg-amber-500 text-black text-[7px] font-black px-1.5 py-0.5 rounded-full shadow-lg whitespace-nowrap animate-bounce z-20 uppercase">
                                        Unlock {node.cost}
                                    </div>
                                )}
                            </button>

                            {(isUnlocked || parentsUnlocked) && (
                                <div className={`absolute top-full mt-2 left-1/2 -translate-x-1/2 w-40 text-center pointer-events-none transition-all duration-500 z-40 ${isActive ? 'opacity-100 translate-y-0' : 'opacity-40 translate-y-1'}`}>
                                    <h3 className={`text-[8px] font-black uppercase tracking-[0.2em] mb-0.5 ${isActive ? 'text-indigo-300' : 'text-zinc-600'}`}>
                                        {node.label}
                                    </h3>
                                    {isActive && (
                                        <div className="bg-[#121212]/90 backdrop-blur-md text-zinc-400 px-2 py-1 rounded-lg border border-white/5 shadow-2xl inline-block mt-1">
                                            <p className="text-[7px] font-medium leading-none whitespace-nowrap italic opacity-80">"{node.description}"</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};