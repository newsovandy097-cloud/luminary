
import React, { useState, useMemo } from 'react';
import { SkillNode, Vibe, SkillLevel } from '../types';
import { Lock, Unlock, Zap, CheckCircle2, Shield, Mic2, BrainCircuit, XCircle, ArrowRight } from 'lucide-react';

// --- Data Definition ---

export const SKILL_TREE_DATA: SkillNode[] = [
  // Core
  { id: 'core_1', label: 'Protocol Alpha', description: 'The foundation of interaction.', branch: 'core', x: 50, y: 50, cost: 0, parents: [], targetVibe: 'social', targetLevel: 'noob' },
  
  // Diplomat Branch (Top Left)
  { id: 'dip_1', label: 'Empathy Link', description: 'Understand feelings before facts.', branch: 'diplomat', x: 35, y: 35, cost: 100, parents: ['core_1'], targetVibe: 'empathy', targetLevel: 'beginner' },
  { id: 'dip_2', label: 'Conflict Diffusal', description: 'Lower the temperature of any room.', branch: 'diplomat', x: 20, y: 25, cost: 250, parents: ['dip_1'], targetVibe: 'family', targetLevel: 'intermediate' },
  { id: 'dip_3', label: 'Peacekeeper', description: 'Master of harmonious resolution.', branch: 'diplomat', x: 10, y: 10, cost: 500, parents: ['dip_2'], targetVibe: 'parenting', targetLevel: 'advanced' },

  // Orator Branch (Top Right)
  { id: 'ora_1', label: 'Ice Breaker', description: 'Never have an awkward silence again.', branch: 'orator', x: 65, y: 35, cost: 100, parents: ['core_1'], targetVibe: 'humorous', targetLevel: 'beginner' },
  { id: 'ora_2', label: 'Storyteller', description: 'Captivate groups with narrative.', branch: 'orator', x: 80, y: 25, cost: 250, parents: ['ora_1'], targetVibe: 'charisma', targetLevel: 'intermediate' },
  { id: 'ora_3', label: 'Voice of God', description: 'Command absolute attention.', branch: 'orator', x: 90, y: 10, cost: 500, parents: ['ora_2'], targetVibe: 'charisma', targetLevel: 'master' },

  // Strategist Branch (Bottom)
  { id: 'str_1', label: 'Logic Gate', description: 'Construct unassailable arguments.', branch: 'strategist', x: 50, y: 70, cost: 100, parents: ['core_1'], targetVibe: 'intellectual', targetLevel: 'beginner' },
  { id: 'str_2', label: 'Negotiator', description: 'Find leverage in every exchange.', branch: 'strategist', x: 40, y: 85, cost: 250, parents: ['str_1'], targetVibe: 'negotiation', targetLevel: 'intermediate' },
  { id: 'str_3', label: 'Executive', description: 'Lead with vision and precision.', branch: 'strategist', x: 60, y: 85, cost: 250, parents: ['str_1'], targetVibe: 'leadership', targetLevel: 'advanced' },
  { id: 'str_4', label: 'Grandmaster', description: '5D Chess in human form.', branch: 'strategist', x: 50, y: 95, cost: 800, parents: ['str_2', 'str_3'], targetVibe: 'professional', targetLevel: 'master' },
];

interface SkillTreeViewProps {
  unlockedNodes: string[];
  totalXp: number;
  spentXp: number;
  onUnlock: (nodeId: string, cost: number) => void;
  onSelect: (node: SkillNode) => void;
  onClose: () => void;
  activeNodeId: string | null;
}

export const SkillTreeView: React.FC<SkillTreeViewProps> = ({ unlockedNodes, totalXp, spentXp, onUnlock, onSelect, onClose, activeNodeId }) => {
  const [selectedId, setSelectedId] = useState<string | null>(activeNodeId || 'core_1');
  const availablePoints = totalXp - spentXp;

  const selectedNode = useMemo(() => SKILL_TREE_DATA.find(n => n.id === selectedId), [selectedId]);

  const getNodeState = (node: SkillNode) => {
    if (unlockedNodes.includes(node.id)) return 'unlocked';
    const hasParentUnlocked = node.parents.length === 0 || node.parents.some(p => unlockedNodes.includes(p));
    if (hasParentUnlocked) return 'available';
    return 'locked';
  };

  const handleNodeClick = (id: string) => {
    setSelectedId(id);
  };

  const handlePurchase = () => {
    if (selectedNode && availablePoints >= selectedNode.cost) {
      onUnlock(selectedNode.id, selectedNode.cost);
    }
  };

  const handleActivate = () => {
    if (selectedNode) {
        onSelect(selectedNode);
    }
  };

  return (
    <div className="h-full flex flex-col relative bg-[#08080a] text-white overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>
      
      {/* Header */}
      <div className="flex justify-between items-center p-4 z-10 bg-black/50 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400"><BrainCircuit size={20} /></div>
            <div>
                <h2 className="text-sm font-black uppercase tracking-widest text-indigo-400">Neural Web</h2>
                <p className="text-xs text-gray-400">Progression Matrix</p>
            </div>
        </div>
        <div className="flex gap-4 items-center">
            <div className="text-right">
                <span className="text-[9px] font-black uppercase text-gray-500 block">Neuro Points</span>
                <span className="text-lg font-mono font-bold text-white">{availablePoints} NP</span>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><XCircle size={24} /></button>
        </div>
      </div>

      {/* Main Graph Area */}
      <div className="flex-1 relative overflow-hidden">
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {SKILL_TREE_DATA.map(node => {
             return node.parents.map(parentId => {
                const parent = SKILL_TREE_DATA.find(p => p.id === parentId);
                if (!parent) return null;
                const isUnlocked = unlockedNodes.includes(node.id) && unlockedNodes.includes(parentId);
                return (
                    <line 
                        key={`${parentId}-${node.id}`}
                        x1={`${parent.x}%`} y1={`${parent.y}%`}
                        x2={`${node.x}%`} y2={`${node.y}%`}
                        stroke={isUnlocked ? "#6366f1" : "#27272a"}
                        strokeWidth="2"
                        strokeDasharray={isUnlocked ? "0" : "4 4"}
                        className="transition-all duration-1000"
                    />
                );
             });
          })}
        </svg>

        {SKILL_TREE_DATA.map(node => {
            const state = getNodeState(node);
            const isActive = activeNodeId === node.id;
            const isSelected = selectedId === node.id;
            
            let baseColor = "bg-zinc-800 border-zinc-700 text-zinc-500";
            if (state === 'unlocked') {
                 if (node.branch === 'diplomat') baseColor = "bg-cyan-950 border-cyan-500 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.5)]";
                 else if (node.branch === 'orator') baseColor = "bg-purple-950 border-purple-500 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.5)]";
                 else if (node.branch === 'strategist') baseColor = "bg-amber-950 border-amber-500 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.5)]";
                 else baseColor = "bg-white border-white text-black shadow-[0_0_20px_rgba(255,255,255,0.5)]";
            } else if (state === 'available') {
                baseColor = "bg-zinc-900 border-white/50 text-white animate-pulse shadow-[0_0_10px_rgba(255,255,255,0.2)]";
            }

            return (
                <button
                    key={node.id}
                    onClick={() => handleNodeClick(node.id)}
                    style={{ left: `${node.x}%`, top: `${node.y}%` }}
                    className={`absolute w-12 h-12 -ml-6 -mt-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 z-10 ${baseColor} ${isSelected ? 'scale-125 ring-4 ring-white/20' : 'hover:scale-110'}`}
                >
                    {state === 'locked' && <Lock size={14} />}
                    {state === 'available' && <Unlock size={14} />}
                    {state === 'unlocked' && isActive && <Zap size={18} fill="currentColor" />}
                    {state === 'unlocked' && !isActive && <div className="w-3 h-3 rounded-full bg-current"></div>}
                </button>
            );
        })}
      </div>

      {/* Footer Info Pane */}
      <div className="h-48 bg-[#0a0a0a] border-t border-white/10 p-5 shrink-0 z-20 flex flex-col justify-between">
         {selectedNode ? (
             <>
                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className={`text-xl font-black font-serif tracking-tight ${getNodeState(selectedNode) === 'locked' ? 'text-gray-500' : 'text-white'}`}>
                                {selectedNode.label}
                            </h3>
                            {activeNodeId === selectedNode.id && <span className="bg-green-500/20 text-green-400 text-[9px] font-bold px-2 py-0.5 rounded uppercase">Active</span>}
                        </div>
                        <p className="text-gray-400 text-xs italic">"{selectedNode.description}"</p>
                    </div>
                    <div className="text-right">
                        <span className="text-[9px] font-black uppercase text-gray-500 block mb-1">Requirements</span>
                        <div className="flex items-center gap-1 justify-end">
                            {selectedNode.cost > 0 ? (
                                <>
                                    <span className={`text-sm font-bold ${availablePoints >= selectedNode.cost ? 'text-indigo-400' : 'text-red-400'}`}>{selectedNode.cost}</span>
                                    <span className="text-[9px] text-gray-500">NP</span>
                                </>
                            ) : <span className="text-[10px] text-gray-400 uppercase">Free</span>}
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 mt-4">
                     {getNodeState(selectedNode) === 'unlocked' ? (
                         <button 
                            onClick={handleActivate}
                            disabled={activeNodeId === selectedNode.id}
                            className="flex-1 bg-white text-black h-12 rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-gray-200 disabled:opacity-50 disabled:bg-zinc-800 disabled:text-gray-500 transition-colors"
                        >
                            {activeNodeId === selectedNode.id ? 'Equipped' : 'Activate Protocol'}
                            {activeNodeId !== selectedNode.id && <Zap size={16} />}
                         </button>
                     ) : getNodeState(selectedNode) === 'available' ? (
                         <button 
                            onClick={handlePurchase}
                            disabled={availablePoints < selectedNode.cost}
                            className="flex-1 bg-indigo-600 text-white h-12 rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-indigo-500 disabled:opacity-50 disabled:bg-zinc-800 disabled:text-gray-500 transition-colors shadow-[0_0_20px_rgba(79,70,229,0.3)]"
                         >
                            Unlock Node
                            <Unlock size={16} />
                         </button>
                     ) : (
                        <button disabled className="flex-1 bg-zinc-900 border border-white/5 text-gray-600 h-12 rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 cursor-not-allowed">
                            Locked
                            <Lock size={16} />
                        </button>
                     )}
                </div>
             </>
         ) : (
            <div className="flex items-center justify-center h-full text-gray-600 uppercase text-xs font-bold tracking-widest">Select a node</div>
         )}
      </div>
    </div>
  );
};
