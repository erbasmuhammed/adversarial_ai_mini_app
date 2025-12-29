
import React from 'react';
import { Settings, Sliders, Zap } from 'lucide-react';
// Corrected import from types
import { AttackType } from '../types';

interface AttackControlsProps {
  epsilon: number;
  setEpsilon: (val: number) => void;
  attackType: AttackType;
  setAttackType: (val: AttackType) => void;
  disabled?: boolean;
}

const AttackControls: React.FC<AttackControlsProps> = ({ 
  epsilon, 
  setEpsilon, 
  attackType, 
  setAttackType,
  disabled 
}) => {
  return (
    <div className={`bg-slate-900/30 border border-white/5 rounded-3xl p-8 space-y-8 transition-all duration-500 ${disabled ? 'opacity-30 grayscale pointer-events-none' : ''}`}>
      <h2 className="text-lg font-bold flex items-center gap-2 italic uppercase">
        <Settings className="w-5 h-5 text-sky-400" /> Attack Vector
      </h2>

      <div className="space-y-6">
        <label className="block">
          <span className="text-[10px] mono text-slate-500 uppercase mb-3 block font-bold tracking-widest">Methodology</span>
          <select 
            value={attackType}
            onChange={(e) => setAttackType(e.target.value as AttackType)}
            className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-4 text-sm font-bold focus:border-sky-500 outline-none transition-all appearance-none cursor-pointer text-white"
          >
            {/* Fix: cast Object.values to string array to avoid unknown type errors during map */}
            {(Object.values(AttackType) as string[]).map((type) => (
              <option key={type} value={type} className="bg-slate-900">{type}</option>
            ))}
          </select>
        </label>

        <div className="space-y-4">
          <div className="flex items-center justify-between text-[10px] mono uppercase font-bold">
            <span className="text-slate-500">Signal Variance ($\epsilon$)</span>
            <span className="text-sky-400 px-2 py-0.5 bg-sky-500/10 border border-sky-500/20 rounded">{(epsilon * 100).toFixed(1)}%</span>
          </div>
          <div className="relative flex items-center h-6">
            <input 
              type="range" 
              min="0.01" 
              max="0.20" 
              step="0.005"
              value={epsilon}
              onChange={(e) => setEpsilon(parseFloat(e.target.value))}
              className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500 relative z-10"
            />
            <div className="absolute inset-0 flex justify-between px-1 pointer-events-none">
               {[...Array(10)].map((_, i) => (
                 <div key={i} className="w-px h-full bg-white/5" />
               ))}
            </div>
          </div>
          <div className="flex justify-between text-[9px] text-slate-600 mono font-black">
            <span>COVERT</span>
            <span>OPTIMAL</span>
            <span>DETECTABLE</span>
          </div>
        </div>
      </div>

      <div className="pt-6 border-t border-white/5">
        <div className="flex items-start gap-3 p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl">
           <Zap className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
           <p className="text-[11px] text-amber-200/60 leading-relaxed italic">
             Higher signal variance simplifies the breach but increases visual artifacts, risking automated detection.
           </p>
        </div>
      </div>
    </div>
  );
};

export default AttackControls;
