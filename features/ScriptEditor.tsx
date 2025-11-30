
import React, { useState } from 'react';
import { ProjectState, SUPPORTED_LANGUAGES, AspectRatio, VIDEO_STYLES, VIDEO_DURATIONS, VideoDuration } from '../types';
import { generateScriptFromTopic } from '../services/geminiService';
import { Wand2, Loader2, FileText, MonitorPlay, Smartphone, Square, ArrowRight, Palette, Layers, Clock } from 'lucide-react';

interface Props {
  state: ProjectState;
  updateState: (updates: Partial<ProjectState>) => void;
  onNext: () => void;
}

export const ScriptEditor: React.FC<Props> = ({ state, updateState, onNext }) => {
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'generate' | 'paste'>('generate');

  const handleGenerate = async () => {
    if (!state.topic && mode === 'generate') return;
    if (!state.rawScript && mode === 'paste') return;

    setLoading(true);
    try {
      const scenes = await generateScriptFromTopic(
        state.topic, 
        state.language, 
        mode === 'paste' ? state.rawScript : null,
        state.selectedStyles,
        state.styleIntensity,
        state.targetDuration
      );
      updateState({ scenes });
    } catch (e) {
      alert("Failed to generate script. Please check API Key.");
    } finally {
      setLoading(false);
    }
  };

  const toggleStyle = (styleId: string) => {
    const current = state.selectedStyles || [];
    if (current.includes(styleId)) {
      updateState({ selectedStyles: current.filter(id => id !== styleId) });
    } else {
      if (current.length < 3) {
        updateState({ selectedStyles: [...current, styleId] });
      }
    }
  };

  const hasScenes = state.scenes.length > 0;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column: Input & Settings */}
        <div className="space-y-6">
          
          {/* Project Settings */}
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-400" />
              1. Format & Language
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Target Language</label>
                <select 
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-200"
                  value={state.language}
                  onChange={(e) => updateState({ language: e.target.value })}
                >
                  {SUPPORTED_LANGUAGES.map(lang => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Video Format</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { val: AspectRatio.LANDSCAPE, icon: MonitorPlay, label: '16:9' },
                      { val: AspectRatio.PORTRAIT, icon: Smartphone, label: '9:16' },
                      { val: AspectRatio.SQUARE, icon: Square, label: '1:1' },
                    ].map(opt => (
                      <button
                        key={opt.val}
                        onClick={() => updateState({ targetRatio: opt.val })}
                        className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all ${
                          state.targetRatio === opt.val 
                          ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400' 
                          : 'bg-slate-900 border-slate-700 hover:border-slate-600 text-slate-400'
                        }`}
                      >
                        <opt.icon className="w-5 h-5 mb-1" />
                        <span className="text-xs">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Target Duration</label>
                   <div className="relative">
                      <select
                        className={`w-full h-[62px] bg-slate-900 border border-slate-700 rounded-lg p-3 pl-10 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-200 appearance-none ${
                            mode === 'paste' ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        value={state.targetDuration}
                        onChange={(e) => updateState({ targetDuration: e.target.value as VideoDuration })}
                        disabled={mode === 'paste'}
                      >
                         {VIDEO_DURATIONS.map(d => (
                           <option key={d} value={d}>{d}</option>
                         ))}
                      </select>
                      <Clock className="absolute left-3 top-5 w-5 h-5 text-slate-500 pointer-events-none" />
                   </div>
                   {mode === 'paste' && (
                       <p className="text-[10px] text-indigo-400 mt-1">Duration determined by script length</p>
                   )}
                </div>
              </div>
            </div>
          </div>

          {/* Visual Engine */}
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
             <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
               <Palette className="w-5 h-5 text-pink-400" />
               2. Visual Style Engine
             </h2>
             
             <div className="space-y-4">
                <div className="flex items-center justify-between">
                   <label className="text-sm font-medium text-slate-400">Select Style (Max 3)</label>
                   <div className="flex bg-slate-900 rounded-lg p-0.5 border border-slate-700">
                      {['Soft', 'Medium', 'Extreme'].map(int => (
                         <button
                           key={int}
                           onClick={() => updateState({ styleIntensity: int as any })}
                           className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                             state.styleIntensity === int 
                             ? 'bg-slate-700 text-white' 
                             : 'text-slate-500 hover:text-slate-300'
                           }`}
                         >
                           {int}
                         </button>
                      ))}
                   </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                   {VIDEO_STYLES.map(style => {
                      const isSelected = state.selectedStyles?.includes(style.id);
                      return (
                        <button
                          key={style.id}
                          onClick={() => toggleStyle(style.id)}
                          disabled={!isSelected && (state.selectedStyles?.length || 0) >= 3}
                          className={`text-left p-2 rounded border text-xs transition-all ${
                            isSelected 
                            ? 'bg-pink-600/20 border-pink-500 text-pink-300' 
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-600 disabled:opacity-50'
                          }`}
                        >
                          <div className="font-bold truncate">{style.name}</div>
                        </button>
                      );
                   })}
                </div>
                {state.selectedStyles?.length > 0 && (
                   <div className="text-xs text-slate-500">
                      Active: <span className="text-pink-400">{state.selectedStyles.map(id => VIDEO_STYLES.find(s => s.id === id)?.name).join(' + ')}</span>
                   </div>
                )}
             </div>
          </div>

          {/* Script Input */}
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
             <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
               <Layers className="w-5 h-5 text-emerald-400" />
               3. Script & Concept
             </h2>

             <div className="flex gap-4 mb-4 border-b border-slate-700 pb-2">
                <button 
                  onClick={() => setMode('generate')}
                  className={`pb-2 text-sm font-medium transition-colors ${mode === 'generate' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-slate-400'}`}
                >
                  AI Generation
                </button>
                <button 
                  onClick={() => setMode('paste')}
                  className={`pb-2 text-sm font-medium transition-colors ${mode === 'paste' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-slate-400'}`}
                >
                  Manual Script
                </button>
             </div>

             {mode === 'generate' ? (
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-slate-400">Video Topic / Concept</label>
                  <textarea 
                    className="w-full h-32 bg-slate-900 border border-slate-700 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-slate-200"
                    placeholder="e.g. The history of coffee, 5 facts about Mars, Motivational workout..."
                    value={state.topic}
                    onChange={(e) => updateState({ topic: e.target.value })}
                  />
                </div>
             ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                     <label className="block text-sm font-medium text-slate-400">Paste your script</label>
                     <span className="text-xs text-indigo-400 bg-indigo-400/10 px-2 py-1 rounded border border-indigo-400/20">
                       Auto-translates to {state.language}
                     </span>
                  </div>
                  <textarea 
                    className="w-full h-32 bg-slate-900 border border-slate-700 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-slate-200"
                    placeholder={`Paste your script in any language. We'll translate it to ${state.language} during processing.`}
                    value={state.rawScript}
                    onChange={(e) => updateState({ rawScript: e.target.value })}
                  />
                </div>
             )}

             <button 
               onClick={handleGenerate}
               disabled={loading || (mode === 'generate' && !state.topic) || (mode === 'paste' && !state.rawScript)}
               className="mt-6 w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-all"
             >
               {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
               {loading ? 'Processing...' : 'Generate Scenes'}
             </button>
          </div>
        </div>

        {/* Right Column: Scene Preview */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Generated Scenes</h2>
            <span className="text-sm text-slate-400">{state.scenes.length} scenes</span>
          </div>

          <div className="space-y-4 h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {!hasScenes && (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-800 rounded-xl">
                <FileText className="w-12 h-12 mb-4 opacity-50" />
                <p>No scenes generated yet.</p>
              </div>
            )}
            
            {state.scenes.map((scene, idx) => (
              <div key={idx} className="bg-slate-800 p-4 rounded-lg border border-slate-700 group hover:border-indigo-500/50 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Scene {idx + 1}</span>
                  <span className="text-xs text-slate-500">{scene.durationEstimates}s</span>
                </div>
                <p className="text-slate-300 text-sm mb-3 font-medium">"{scene.text}"</p>
                <div className="bg-slate-900 p-2 rounded text-xs text-slate-500 italic border border-slate-800">
                  <span className="text-pink-400 not-italic mr-1">Visual:</span>
                  {scene.visualPrompt}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={onNext}
            disabled={!hasScenes}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-lg font-bold text-lg shadow-lg shadow-emerald-900/20 transition-all flex items-center justify-center gap-2"
          >
            Confirm & Continue <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
