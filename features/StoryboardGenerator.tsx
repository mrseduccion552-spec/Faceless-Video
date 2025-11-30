
import React, { useState, useEffect } from 'react';
import { ProjectState, ScriptScene, PREBUILT_VOICES, VIDEO_STYLES } from '../types';
import { generateSceneImage, generateSpeech } from '../services/geminiService';
import { Image as ImageIcon, CheckCircle, AlertCircle, RefreshCw, Volume2 } from 'lucide-react';

interface Props {
  state: ProjectState;
  updateState: (updates: Partial<ProjectState>) => void;
  onNext: () => void;
  onBack: () => void;
}

export const StoryboardGenerator: React.FC<Props> = ({ state, updateState, onNext, onBack }) => {
  const [activeGeneration, setActiveGeneration] = useState(false);

  const startGeneration = async () => {
    setActiveGeneration(true);
    
    const newScenes = [...state.scenes];
    const selectedVoice = PREBUILT_VOICES.find(v => v.id === state.selectedVoiceId) || PREBUILT_VOICES[0];
    const voiceName = selectedVoice.apiVoiceName;

    // Construct style suffix
    const styleNames = state.selectedStyles?.map(id => VIDEO_STYLES.find(s => s.id === id)?.name).join(', ') || '';
    const styleSuffix = styleNames ? `, ${styleNames} style, ${state.styleIntensity} intensity` : '';

    for (let i = 0; i < newScenes.length; i++) {
        const scene = newScenes[i];
        newScenes[i] = { ...scene, isGeneratingImage: !scene.imageUrl, isGeneratingAudio: !scene.audioUrl };
        updateState({ scenes: [...newScenes] });

        try {
            if (!scene.imageUrl) {
                // Augment prompt with style
                const finalPrompt = `${scene.visualPrompt}${styleSuffix}`;
                const imgUrl = await generateSceneImage(finalPrompt, state.targetRatio);
                newScenes[i].imageUrl = imgUrl;
                newScenes[i].isGeneratingImage = false;
                updateState({ scenes: [...newScenes] });
                
                // Add throttle delay to avoid Rate Limits (429)
                await new Promise(r => setTimeout(r, 1500));
            }
            
            if (!scene.audioUrl) {
                const audioUrl = await generateSpeech(scene.text, voiceName);
                newScenes[i].audioUrl = audioUrl;
                newScenes[i].isGeneratingAudio = false;
                updateState({ scenes: [...newScenes] });
            }
        } catch (e) {
            console.error(`Error processing scene ${i}`, e);
            newScenes[i].isGeneratingImage = false;
            newScenes[i].isGeneratingAudio = false;
            updateState({ scenes: [...newScenes] });
        }
    }

    setActiveGeneration(false);
  };

  useEffect(() => {
    const needsGeneration = state.scenes.some(s => !s.imageUrl || !s.audioUrl);
    if (needsGeneration && !activeGeneration) {
        startGeneration();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const allDone = state.scenes.every(s => s.imageUrl && s.audioUrl);

  return (
    <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between mb-6">
            <div>
                <h2 className="text-2xl font-bold text-white">Visual & Audio Production</h2>
                <p className="text-slate-400">Generating assets for {state.scenes.length} scenes.</p>
            </div>
            {!allDone && !activeGeneration && (
                <button 
                    onClick={startGeneration}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg"
                >
                    <RefreshCw className="w-4 h-4" /> Retry Missing
                </button>
            )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {state.scenes.map((scene, idx) => (
                <div key={idx} className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 flex flex-col">
                    <div className="relative aspect-video bg-slate-900 w-full overflow-hidden">
                        {scene.imageUrl ? (
                            <img src={scene.imageUrl} alt={`Scene ${idx}`} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 p-4 text-center">
                                {scene.isGeneratingImage ? (
                                    <RefreshCw className="w-8 h-8 animate-spin text-indigo-500 mb-2" />
                                ) : (
                                    <ImageIcon className="w-8 h-8 mb-2" />
                                )}
                                <span className="text-xs">{scene.isGeneratingImage ? 'Generating Visual...' : 'Waiting...'}</span>
                            </div>
                        )}
                        <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-xs font-bold text-white">
                            Scene {idx + 1}
                        </div>
                    </div>

                    <div className="p-4 flex-1 flex flex-col">
                        <p className="text-sm text-slate-300 mb-4 line-clamp-3 flex-1">
                            "{scene.text}"
                        </p>
                        
                        <div className="flex items-center justify-between pt-4 border-t border-slate-700">
                             <div className="flex items-center gap-2">
                                {scene.audioUrl ? (
                                    <div className="flex items-center gap-1 text-emerald-400 text-xs font-medium">
                                        <Volume2 className="w-4 h-4" /> Ready
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1 text-amber-400 text-xs font-medium">
                                        <RefreshCw className={`w-3 h-3 ${scene.isGeneratingAudio ? 'animate-spin' : ''}`} /> 
                                        {scene.isGeneratingAudio ? 'Synthesizing...' : 'Pending'}
                                    </div>
                                )}
                             </div>
                             
                             {scene.imageUrl && scene.audioUrl ? (
                                <CheckCircle className="w-5 h-5 text-emerald-500" />
                             ) : (
                                <div className="w-5 h-5 rounded-full border-2 border-slate-600 border-t-indigo-500 animate-spin" />
                             )}
                        </div>
                    </div>
                </div>
            ))}
        </div>

        <div className="flex justify-between pt-8 border-t border-slate-700">
            <button 
                onClick={onBack}
                className="px-6 py-3 text-slate-400 hover:text-white transition-colors"
            >
                Back
            </button>
            <button
                onClick={onNext}
                disabled={!allDone}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-3 rounded-lg font-bold shadow-lg shadow-emerald-900/20 transition-all flex items-center gap-2"
            >
                Enter Studio <AlertCircle className="w-4 h-4 opacity-50" />
            </button>
        </div>
    </div>
  );
};
