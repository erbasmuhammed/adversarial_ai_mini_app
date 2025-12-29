
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Target, 
  Zap, 
  RefreshCcw, 
  Layers, 
  EyeOff, 
  CheckCircle, 
  ChevronRight,
  WifiOff,
  Activity,
  Box,
  Fingerprint,
  X,
  Keyboard,
  Ghost,
  AlertTriangle
} from 'lucide-react';
import { generateShipImage, classifyImage } from './geminiService';
import { ClassificationResult, ImageState, GameStatus, Mission, Patch } from './types';

const MISSIONS: Mission[] = [
  { 
    id: 1, 
    title: "Project Emera: Mirage", 
    targetShip: "Modern Naval Frigate", 
    objective: "Scramble the AI until it detects 'Water' or 'Waves' instead of the hull.",
    successCondition: (res) => {
      const top = res[0].className.toLowerCase();
      return !top.includes('ship') && !top.includes('boat') && !top.includes('frigate');
    },
    successMessage: "SYSTEM_SPOOFED: The AI is now reporting environmental surface data only. Vessel is invisible to tracking."
  },
  { 
    id: 2, 
    title: "Project Emera: Camouflage", 
    targetShip: "Large Cargo Carrier", 
    objective: "Force misclassification as 'Building', 'Dock', or 'Platform'.",
    successCondition: (res) => {
      const top = res[0].className.toLowerCase();
      return top.includes('build') || top.includes('dock') || top.includes('platform') || top.includes('urban');
    },
    successMessage: "TARGET_LOST: Carrier signature successfully remapped to stationary harbor architecture."
  }
];

const App: React.FC = () => {
  const [level, setLevel] = useState(0);
  const [status, setStatus] = useState<GameStatus>('briefing');
  const [loading, setLoading] = useState(false);
  const [originalImage, setOriginalImage] = useState<ImageState | null>(null);
  const [patches, setPatches] = useState<Patch[]>([]);
  const [selectedPatchId, setSelectedPatchId] = useState<string | null>(null);
  const [results, setResults] = useState<ClassificationResult[] | null>(null);
  
  const mission = MISSIONS[level];
  const containerRef = useRef<HTMLDivElement>(null);
  const compositeCanvasRef = useRef<HTMLCanvasElement>(null);

  // Keyboard controls for moving patches
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedPatchId || status !== 'patching') return;

      // Increased speeds as requested: 5px normal, 30px with Shift
      const step = e.shiftKey ? 30 : 5;
      const currentPatch = patches.find(p => p.id === selectedPatchId);
      if (!currentPatch) return;

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        updatePatch(selectedPatchId, { y: currentPatch.y - step });
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        updatePatch(selectedPatchId, { y: currentPatch.y + step });
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        updatePatch(selectedPatchId, { x: currentPatch.x - step });
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        updatePatch(selectedPatchId, { x: currentPatch.x + step });
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        setPatches(prev => prev.filter(p => p.id !== selectedPatchId));
        setSelectedPatchId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPatchId, patches, status]);

  const startMission = async () => {
    setLoading(true);
    try {
      const url = await generateShipImage(mission.targetShip);
      setOriginalImage({ url, base64: url, width: 512, height: 512 });
      setPatches([]);
      setResults(null);
      setStatus('patching');
    } catch (e) {
      alert("Comms error.");
    } finally {
      setLoading(false);
    }
  };

  const addPatch = (type: Patch['type']) => {
    const newPatch: Patch = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      x: 200 + Math.random() * 100,
      y: 200 + Math.random() * 100,
      size: 140,
      rotation: Math.random() * 360
    };
    setPatches([...patches, newPatch]);
    setSelectedPatchId(newPatch.id);
  };

  const updatePatch = (id: string, updates: Partial<Patch>) => {
    setPatches(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const renderComposite = async (): Promise<string> => {
    if (!originalImage || !compositeCanvasRef.current) return '';
    const canvas = compositeCanvasRef.current;
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    img.crossOrigin = "anonymous";
    
    return new Promise((resolve) => {
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        patches.forEach(patch => {
          ctx.save();
          ctx.translate(patch.x, patch.y);
          ctx.rotate((patch.rotation * Math.PI) / 180);
          
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(-patch.size/2, -patch.size/2, patch.size, patch.size);
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 15;
          for(let i=0; i<4; i++) {
              ctx.strokeRect(-patch.size/2 + i*15, -patch.size/2 + i*15, patch.size - i*30, patch.size - i*30);
          }
          ctx.restore();
        });
        resolve(canvas.toDataURL('image/png'));
      };
      img.src = originalImage.url;
    });
  };

  const analyze = async () => {
    setLoading(true);
    setStatus('scanning');
    try {
      const compositeData = await renderComposite();
      const res = await classifyImage(compositeData);
      setResults(res);
      if (mission.successCondition(res)) {
        setStatus('breached');
      } else {
        setStatus('patching');
      }
    } catch (e) {
      alert("Neural analysis failed.");
      setStatus('patching');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen bg-transparent text-slate-300 font-mono overflow-hidden transition-all duration-1000 ${status === 'breached' ? 'border-[16px] border-emerald-500/10' : ''}`}>
      <header className="h-16 border-b border-white/5 bg-black/40 backdrop-blur-md flex items-center justify-between px-6 z-50 relative">
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded flex items-center justify-center transition-colors ${status === 'breached' ? 'bg-emerald-500 shadow-[0_0_15px_#10b981]' : 'bg-sky-500 shadow-[0_0_15px_#0ea5e9]'}`}>
            <Fingerprint className={`w-6 h-6 ${status === 'breached' ? 'text-black' : 'text-white'}`} />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tighter text-white uppercase flex items-center gap-2">
              PROJECT_EMERA // TERMINAL
              {status === 'breached' && <span className="bg-emerald-500 text-black px-1 text-[10px] animate-pulse">SPOOF_ACTIVE</span>}
            </h1>
            <p className="text-[10px] text-slate-500 uppercase">Module: {mission.title}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-8">
           <div className="text-right">
              <span className="text-[9px] text-slate-500 uppercase block">Active Target</span>
              <span className="text-[11px] text-sky-400 font-bold uppercase tracking-widest">{mission.targetShip}</span>
           </div>
           <button onClick={() => setStatus('briefing')} className="p-2 hover:bg-white/10 rounded text-slate-500 transition-colors">
              <RefreshCcw className="w-4 h-4" />
           </button>
        </div>
      </header>

      <main className="h-[calc(100vh-64px)] grid grid-cols-12 overflow-hidden">
        {status === 'briefing' ? (
          <div className="col-span-12 flex items-center justify-center">
             <div className="max-w-xl w-full p-12 bg-black/60 border border-white/10 rounded-2xl text-center space-y-8 backdrop-blur-xl relative overflow-hidden group shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                <div className="absolute top-0 left-0 w-full h-1 bg-sky-500/20 group-hover:bg-sky-500 transition-all duration-700" />
                <div className="space-y-4">
                   <Target className="w-12 h-12 mx-auto text-sky-500 animate-pulse" />
                   <h2 className="text-4xl font-black italic text-white uppercase tracking-tighter">{mission.title}</h2>
                   <p className="text-slate-400 leading-relaxed text-sm italic px-8">
                     {mission.objective}
                   </p>
                </div>
                <button 
                   onClick={startMission}
                   disabled={loading}
                   className="w-full py-5 bg-sky-600 hover:bg-sky-500 text-white font-black uppercase tracking-widest rounded-xl transition-all shadow-2xl flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {loading ? <RefreshCcw className="animate-spin" /> : <Zap className="w-5 h-5" />}
                  Initiate Warfare Protocol
                </button>
             </div>
          </div>
        ) : (
          <>
            <div className="col-span-3 border-r border-white/5 bg-black/60 backdrop-blur-lg p-6 space-y-8 overflow-y-auto">
               <div className="space-y-1">
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Emera: Offensive Arsenal</h3>
                  <p className="text-[11px] text-slate-600 italic">Deploy high-entropy adversarial patches</p>
               </div>

               <div className="grid grid-cols-1 gap-3">
                  <button 
                    onClick={() => addPatch('geometric')}
                    className="group p-5 bg-white/5 border border-white/10 rounded-xl hover:border-sky-500 hover:bg-white/10 transition-all text-left flex items-center gap-4 relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-sky-500/5 group-hover:bg-sky-500/10 transition-colors" />
                    <div className="w-12 h-12 bg-white flex flex-col items-center justify-center shrink-0 border border-black/20 shadow-lg relative z-10">
                       <div className="w-8 h-8 border-4 border-black" />
                       <div className="w-4 h-4 border-2 border-black absolute" />
                    </div>
                    <div className="relative z-10">
                      <span className="text-xs font-black text-white uppercase block">Adversarial Patch</span>
                      <span className="text-[9px] text-sky-400 uppercase font-bold">Geometric Inversion</span>
                    </div>
                  </button>
               </div>

               {selectedPatchId && (
                 <div className="pt-8 space-y-6 border-t border-white/5 animate-in slide-in-from-left-4">
                    <div className="flex items-center justify-between">
                       <h3 className="text-[10px] font-black text-sky-500 uppercase flex items-center gap-2">
                         <Box className="w-3 h-3" /> Patch {selectedPatchId.slice(0,4)}
                       </h3>
                       <button onClick={() => {
                         setPatches(patches.filter(p => p.id !== selectedPatchId));
                         setSelectedPatchId(null);
                       }} className="text-[10px] text-red-500 hover:text-red-400 font-bold uppercase underline-offset-4 hover:underline">Delete Patch</button>
                    </div>
                    
                    <div className="bg-sky-500/5 border border-sky-500/20 p-3 rounded-lg flex items-start gap-2">
                      <Keyboard className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[9px] text-sky-400 font-bold uppercase block mb-1">High-Speed Movement Active</span>
                        <p className="text-[10px] text-slate-500 leading-tight">Arrows: 5px | Shift+Arrows: 30px | Del: Scrap</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                       <div className="space-y-2">
                          <label className="flex justify-between text-[10px] uppercase font-bold text-slate-500">
                             <span>Scale Factor</span>
                             <span className="text-white font-black">{patches.find(p => p.id === selectedPatchId)?.size}</span>
                          </label>
                          <input 
                            type="range" min="60" max="650" 
                            value={patches.find(p => p.id === selectedPatchId)?.size || 100}
                            onChange={(e) => updatePatch(selectedPatchId, { size: parseInt(e.target.value) })}
                            className="w-full h-1 bg-slate-800/50 rounded-lg appearance-none cursor-pointer accent-sky-500"
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="flex justify-between text-[10px] uppercase font-bold text-slate-500">
                             <span>Inversion Phase</span>
                             <span className="text-white font-black">{Math.round(patches.find(p => p.id === selectedPatchId)?.rotation || 0)}°</span>
                          </label>
                          <input 
                            type="range" min="0" max="360" 
                            value={patches.find(p => p.id === selectedPatchId)?.rotation || 0}
                            onChange={(e) => updatePatch(selectedPatchId, { rotation: parseInt(e.target.value) })}
                            className="w-full h-1 bg-slate-800/50 rounded-lg appearance-none cursor-pointer accent-sky-500"
                          />
                       </div>
                    </div>
                 </div>
               )}

               <div className="pt-8 border-t border-white/5">
                 <button 
                   onClick={analyze}
                   disabled={loading || patches.length === 0}
                   className={`w-full py-4 font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 ${status === 'breached' ? 'bg-emerald-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'bg-white text-black hover:bg-sky-400 active:scale-95'}`}
                 >
                   {loading ? <RefreshCcw className="animate-spin w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                   {status === 'breached' ? 'Re-Verify Spoof' : 'Analyze Neural Core'}
                 </button>
               </div>
            </div>

            <div className="col-span-6 relative flex items-center justify-center p-8 bg-black/20 backdrop-blur-[2px]">
               <div className="absolute inset-0 opacity-10 bg-[linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:32px_32px]" />
               
               <div className="relative group max-w-full max-h-full aspect-square shadow-[0_0_80px_rgba(0,0,0,0.8)] border border-white/10 overflow-hidden rounded-sm" ref={containerRef}>
                  {originalImage && (
                    <>
                      <img src={originalImage.url} className="w-full h-full object-cover" alt="Target" />
                      
                      {status === 'breached' && results && (
                        <div className="absolute inset-0 pointer-events-none overflow-hidden">
                           {[...Array(8)].map((_, i) => (
                             <div 
                               key={i} 
                               className="absolute border border-emerald-500/60 animate-pulse bg-emerald-500/5 transition-all duration-700"
                               style={{
                                 top: `${Math.random() * 80}%`,
                                 left: `${Math.random() * 80}%`,
                                 width: `${10 + Math.random() * 30}%`,
                                 height: `${10 + Math.random() * 20}%`,
                                 animationDelay: `${i * 0.2}s`
                               }}
                             >
                                <div className="bg-emerald-500 text-black text-[8px] px-1 font-bold absolute -top-4 whitespace-nowrap flex items-center gap-1">
                                  <Ghost className="w-2 h-2" />
                                  DETECTION: {results[Math.floor(Math.random() * results.length)].className.toUpperCase()}
                                </div>
                                <div className="absolute inset-0 flex items-center justify-center text-[8px] font-black text-emerald-500/40 opacity-20">
                                   PHANTOM_ID_{Math.floor(Math.random() * 9999)}
                                </div>
                             </div>
                           ))}

                           <div className="absolute inset-[15%] border-4 border-red-500/40 border-dashed animate-pulse">
                              <div className="bg-red-500 text-white text-[10px] px-2 py-0.5 font-bold absolute -top-6 left-0 flex items-center gap-2">
                                <AlertTriangle className="w-3 h-3" /> NEURAL_COLLAPSE: SHIP_ID_REJECTED
                              </div>
                           </div>
                        </div>
                      )}

                      {status !== 'breached' && (
                        <div className="absolute inset-0 pointer-events-none p-4">
                           <div className="w-full h-full border-2 transition-all duration-300 border-sky-500/30 animate-pulse">
                              <div className="absolute top-2 left-2 flex gap-2">
                                 <div className="bg-sky-500 text-black text-[9px] px-2 py-0.5 font-bold uppercase tracking-widest">
                                    {results ? `DETECTED: ${results[0].className}` : 'TARGET_LOCKED: VESSEL_ID_ACTIVE'}
                                 </div>
                                 <div className="bg-black/60 text-white text-[9px] px-2 py-0.5 border border-white/20">CONF: {results ? (results[0].confidence * 100).toFixed(0) : '99'}%</div>
                              </div>
                           </div>
                        </div>
                      )}

                      {patches.map(patch => (
                        <div 
                          key={patch.id}
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            setSelectedPatchId(patch.id);
                          }}
                          className={`absolute cursor-move select-none transition-all ${selectedPatchId === patch.id ? 'ring-2 ring-sky-500 shadow-[0_0_40px_rgba(14,165,233,0.7)] z-50 scale-105' : 'z-40 opacity-90'}`}
                          style={{
                            left: patch.x,
                            top: patch.y,
                            width: patch.size,
                            height: patch.size,
                            transform: `translate(-50%, -50%) rotate(${patch.rotation}deg)`,
                            pointerEvents: status === 'scanning' ? 'none' : 'auto'
                          }}
                          onMouseMove={(e) => {
                            if (e.buttons === 1 && selectedPatchId === patch.id) {
                              updatePatch(patch.id, {
                                x: patch.x + e.movementX,
                                y: patch.y + e.movementY
                              });
                            }
                          }}
                        >
                           <div className="w-full h-full relative overflow-hidden bg-white border border-black/20 group/patch">
                              <div className="w-full h-full grid grid-cols-4 grid-rows-4 bg-white">
                                 {[...Array(16)].map((_, i) => (
                                   <div key={i} className={`w-full h-full ${i % 3 === 0 ? 'bg-black' : 'bg-white'}`} />
                                 ))}
                              </div>

                              {selectedPatchId === patch.id && (
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPatches(prev => prev.filter(p => p.id !== patch.id));
                                    setSelectedPatchId(null);
                                  }}
                                  className="absolute top-1 right-1 w-7 h-7 bg-red-600 hover:bg-red-500 text-white rounded shadow-xl flex items-center justify-center transition-all z-[60] active:scale-90"
                                  title="Scrap Patch"
                                >
                                  <X className="w-5 h-5" />
                                </button>
                              )}
                           </div>
                        </div>
                      ))}
                    </>
                  )}
               </div>
            </div>

            <div className="col-span-3 border-l border-white/5 bg-black/60 backdrop-blur-lg p-6 flex flex-col gap-6">
               <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                     <Activity className="w-3 h-3 text-sky-500" /> Model Telemetry
                  </h3>
                  
                  {results ? (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                       <div className={`p-4 rounded-xl border transition-colors ${status === 'breached' ? 'bg-emerald-500/10 border-emerald-500/40' : 'bg-red-500/10 border-red-500/40'}`}>
                          <span className="text-[9px] text-slate-500 uppercase font-bold block mb-1">Current Classification</span>
                          <span className={`text-xl font-black italic uppercase block tracking-tight ${status === 'breached' ? 'text-emerald-400' : 'text-red-400'}`}>
                            {results[0].className}
                          </span>
                          <div className="mt-3 h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                             <div 
                               className={`h-full transition-all duration-1000 ${status === 'breached' ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-red-500 shadow-[0_0_10px_#ef4444]'}`} 
                               style={{ width: `${results[0].confidence * 100}%` }} 
                             />
                          </div>
                          <div className="flex justify-between mt-1">
                             <span className="text-[9px] text-slate-600 uppercase">System Integrity</span>
                             <span className="text-[10px] text-white font-bold">{(results[0].confidence * 100).toFixed(1)}%</span>
                          </div>
                       </div>

                       <div className="space-y-2">
                          <span className="text-[9px] text-slate-500 uppercase font-bold tracking-widest block">Neural Hallucinations</span>
                          {results.slice(1).map((r, i) => (
                             <div key={i} className={`flex justify-between items-center text-[11px] p-2 border border-white/5 rounded-md transition-all ${status === 'breached' ? 'bg-emerald-500/5 text-emerald-400/80' : 'bg-white/5 text-slate-400'}`}>
                                <span className="uppercase truncate pr-2 font-bold">{r.className}</span>
                                <span className="font-bold shrink-0">{(r.confidence * 100).toFixed(0)}%</span>
                             </div>
                          ))}
                       </div>
                    </div>
                  ) : (
                    <div className="h-32 flex flex-col items-center justify-center border border-white/10 rounded-xl border-dashed gap-2 bg-black/20">
                       <WifiOff className="w-6 h-6 text-slate-700" />
                       <span className="text-[9px] text-slate-700 uppercase tracking-widest text-center px-4">Connecting to Neural Engine...</span>
                    </div>
                  )}
               </div>

               <div className="flex-1" />

               <div className={`p-5 rounded-2xl border transition-all duration-500 backdrop-blur-md ${status === 'breached' ? 'bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.15)]' : 'bg-black/40 border-white/10'}`}>
                  <div className="flex items-center gap-2 mb-3">
                     {status === 'breached' ? <CheckCircle className="w-5 h-5 text-emerald-400" /> : <Box className="w-5 h-5 text-sky-500" />}
                     <span className={`text-[11px] font-black uppercase tracking-widest ${status === 'breached' ? 'text-emerald-400' : 'text-slate-400'}`}>
                        {status === 'breached' ? 'BREACH_SUCCESSFUL' : 'TARGETING_MODE'}
                     </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed italic border-l-2 border-white/10 pl-3">
                     {status === 'breached' ? mission.successMessage : "Model is currently identifying the vessel correctly. Strategic patch placement required to scramble weights."}
                  </p>
                  
                  {status === 'breached' && (
                    <button 
                      onClick={() => {
                        if (level < MISSIONS.length - 1) {
                          setLevel(level + 1);
                          setStatus('briefing');
                        } else {
                          setLevel(0);
                          setStatus('briefing');
                        }
                      }}
                      className="w-full mt-6 py-4 bg-emerald-500 text-black rounded-lg font-black text-[10px] uppercase flex items-center justify-center gap-2 hover:bg-emerald-400 hover:shadow-[0_0_20px_#10b981] transition-all"
                    >
                      Analyze Next Target <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
               </div>
            </div>
          </>
        )}
      </main>

      {status === 'scanning' && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center gap-6">
           <div className="relative">
              <div className="w-24 h-24 border-2 border-sky-500/20 rounded-full animate-ping" />
              <div className="absolute inset-0 flex items-center justify-center">
                 <div className="w-12 h-12 bg-sky-500/20 rounded-full flex items-center justify-center">
                    <Layers className="w-6 h-6 text-sky-500 animate-bounce" />
                 </div>
              </div>
           </div>
           <div className="text-center space-y-1">
              <h3 className="text-sky-500 font-black tracking-[0.4em] uppercase text-sm animate-pulse">Running Inversion Analysis</h3>
              <p className="text-[10px] text-slate-600 uppercase">Evaluating Neural Gradient Response via Gemini weights</p>
           </div>
        </div>
      )}

      <canvas ref={compositeCanvasRef} className="hidden" />
    </div>
  );
};

export default App;
