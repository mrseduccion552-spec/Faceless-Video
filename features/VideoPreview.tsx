
import React, { useState, useEffect, useRef } from 'react';
import { ProjectState, PREBUILT_MUSIC } from '../types';
import { Play, Pause, Download, Subtitles, Settings, Music, Edit2, ArrowUp, ArrowDown, Trash2, Check, Clock } from 'lucide-react';

interface Props {
  state: ProjectState;
  updateState: (updates: Partial<ProjectState>) => void;
  onBack: () => void;
}

export const VideoPreview: React.FC<Props> = ({ state, updateState, onBack }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const musicRef = useRef<HTMLAudioElement | null>(null);

  // Setup Music Track
  useEffect(() => {
    // If no music is selected, we don't need to do anything with musicRef
    if (!state.selectedMusicTrackId) {
        if (musicRef.current) {
            musicRef.current.pause();
            musicRef.current.src = "";
        }
        return;
    }

    let musicUrl = '';
    
    if (state.selectedMusicTrackId === 'custom' && state.customMusicBlob) {
        musicUrl = URL.createObjectURL(state.customMusicBlob);
    } else {
        const track = PREBUILT_MUSIC.find(m => m.id === state.selectedMusicTrackId);
        if (track) musicUrl = track.url;
    }

    if (musicRef.current && musicUrl) {
        musicRef.current.src = musicUrl;
        musicRef.current.loop = true;
        
        // Volume Mix Logic
        const intensityMap = { 'Low': 0.1, 'Medium': 0.25, 'High': 0.5 };
        musicRef.current.volume = intensityMap[state.bgMusicIntensity] || 0.2;
    }
  }, [state.selectedMusicTrackId, state.customMusicBlob, state.bgMusicIntensity]);

  // Load current scene audio (Narration)
  useEffect(() => {
    if (audioRef.current) {
        audioRef.current.src = state.scenes[currentSceneIndex]?.audioUrl || '';
        audioRef.current.load();
        if (isPlaying) {
            audioRef.current.play().catch(console.error);
        }
    }
    setProgress(0);
  }, [currentSceneIndex, state.scenes]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
        audioRef.current.pause();
        if (musicRef.current) musicRef.current.pause();
        setIsPlaying(false);
    } else {
        audioRef.current.play().catch(e => console.error(e));
        
        // SAFEGUARD: Only play music if we have a selected track and valid src
        if (musicRef.current && state.selectedMusicTrackId && musicRef.current.src) {
             musicRef.current.play().catch(e => console.error("Music play error (safely handled)", e));
        }
        
        setIsPlaying(true);
    }
  };

  const handleAudioEnded = () => {
    if (currentSceneIndex < state.scenes.length - 1) {
        setCurrentSceneIndex(prev => prev + 1);
    } else {
        setIsPlaying(false);
        setCurrentSceneIndex(0);
        if (musicRef.current) {
            musicRef.current.pause();
            musicRef.current.currentTime = 0;
        }
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
        const duration = audioRef.current.duration || 1;
        const current = audioRef.current.currentTime;
        setProgress((current / duration) * 100);
    }
  };

  const downloadSubtitles = (format: 'srt' | 'txt') => {
    let content = '';
    
    if (format === 'txt') {
        content = state.scenes.map(s => s.text).join('\n\n');
    } else {
        let currentTime = 0; 
        state.scenes.forEach((scene, i) => {
            const formatTime = (seconds: number) => {
                const date = new Date(seconds * 1000);
                const hh = String(Math.floor(seconds / 3600)).padStart(2, '0');
                const mm = String(date.getUTCMinutes()).padStart(2, '0');
                const ss = String(date.getUTCSeconds()).padStart(2, '0');
                const ms = String(date.getUTCMilliseconds()).padStart(3, '0');
                return `${hh}:${mm}:${ss},${ms}`;
            };
            
            const start = formatTime(currentTime);
            const duration = scene.durationEstimates || 5; 
            const end = formatTime(currentTime + duration);
            
            content += `${i + 1}\n${start} --> ${end}\n${scene.text}\n\n`;
            currentTime += duration;
        });
    }

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subtitles.${format}`;
    a.click();
  };

  const handleExport = () => {
    setIsExporting(true);
    // Simulate rendering process
    setTimeout(() => {
        const projectData = JSON.stringify(state, null, 2);
        const blob = new Blob([projectData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `project-${state.topic.slice(0, 10)}.afve`;
        a.click();
        setIsExporting(false);
    }, 2000);
  };

  // --- Edit Mode Handlers ---

  const moveScene = (index: number, direction: 'up' | 'down') => {
    const newScenes = [...state.scenes];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newScenes.length) return;
    
    [newScenes[index], newScenes[targetIndex]] = [newScenes[targetIndex], newScenes[index]];
    updateState({ scenes: newScenes });
    // Adjust current index if we moved the active scene
    if (currentSceneIndex === index) setCurrentSceneIndex(targetIndex);
    else if (currentSceneIndex === targetIndex) setCurrentSceneIndex(index);
  };

  const updateSceneText = (index: number, text: string) => {
    const newScenes = [...state.scenes];
    newScenes[index] = { ...newScenes[index], text };
    updateState({ scenes: newScenes });
  };

  const updateSceneDuration = (index: number, duration: number) => {
    const newScenes = [...state.scenes];
    newScenes[index] = { ...newScenes[index], durationEstimates: duration };
    updateState({ scenes: newScenes });
  };

  const currentScene = state.scenes[currentSceneIndex];
  const activeTrack = state.selectedMusicTrackId === 'custom' 
    ? { name: 'Custom Track' }
    : PREBUILT_MUSIC.find(m => m.id === state.selectedMusicTrackId);

  return (
    <div className="animate-fade-in flex flex-col h-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
                <h2 className="text-2xl font-bold text-white">Final Render Preview</h2>
                <p className="text-slate-400">Review your generated masterpiece.</p>
            </div>
            <div className="flex flex-wrap gap-3">
                <button 
                    onClick={() => setIsEditing(!isEditing)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                        isEditing 
                        ? 'bg-indigo-600 border-indigo-500 text-white' 
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                    }`}
                >
                    {isEditing ? <Check className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                    {isEditing ? 'Done Editing' : 'Edit More'}
                </button>
                <button 
                    onClick={() => downloadSubtitles('srt')}
                    className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-lg border border-slate-700 transition-colors"
                >
                    <Subtitles className="w-4 h-4" /> SRT
                </button>
                <button 
                    onClick={handleExport}
                    disabled={isExporting}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium shadow-lg shadow-emerald-900/20 transition-all disabled:opacity-70 disabled:cursor-wait"
                >
                    {isExporting ? (
                        <>Processing...</>
                    ) : (
                        <>
                            <Download className="w-4 h-4" /> Export Video
                        </>
                    )}
                </button>
            </div>
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Player */}
            <div className="lg:col-span-2 bg-black rounded-2xl overflow-hidden shadow-2xl relative border border-slate-800 flex flex-col h-[500px] lg:h-auto">
                <div className="flex-1 relative bg-slate-900 flex items-center justify-center">
                    {currentScene?.imageUrl ? (
                        <div className="relative w-full h-full animate-ken-burns overflow-hidden">
                             <img 
                                src={currentScene.imageUrl} 
                                alt="Scene" 
                                className="w-full h-full object-contain"
                            />
                            {/* Subtitle Overlay */}
                            <div className="absolute bottom-12 w-full text-center px-8">
                                <span className="inline-block bg-black/60 backdrop-blur-md text-white text-lg md:text-xl font-medium px-4 py-2 rounded-lg shadow-lg">
                                    {currentScene.text}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="text-slate-600">No Visual</div>
                    )}
                </div>

                {/* Controls */}
                <div className="h-16 bg-slate-900 border-t border-slate-800 px-6 flex items-center gap-4 flex-shrink-0">
                    <button 
                        onClick={togglePlay}
                        className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:bg-slate-200 transition-colors"
                    >
                        {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                    </button>
                    
                    <div className="flex-1 flex flex-col gap-1">
                        <div className="flex justify-between text-xs text-slate-400 font-mono">
                            <span>Scene {currentSceneIndex + 1}/{state.scenes.length}</span>
                            <span>{Math.round(progress)}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-indigo-500 transition-all duration-200 ease-linear"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                    
                    {/* Audio Elements */}
                    <audio 
                        ref={audioRef}
                        onEnded={handleAudioEnded}
                        onTimeUpdate={handleTimeUpdate}
                        className="hidden"
                    />
                    <audio 
                        ref={musicRef}
                        className="hidden"
                    />
                </div>
            </div>

            {/* Sidebar Details or Editor */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden flex flex-col h-[500px] lg:h-auto">
                <div className="p-4 border-b border-slate-700 bg-slate-850">
                     <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                        {isEditing ? <Edit2 className="w-4 h-4 text-indigo-400" /> : <Settings className="w-4 h-4 text-slate-400" />}
                        {isEditing ? 'Scene Editor' : 'Video Breakdown'}
                    </h3>
                    {!isEditing && activeTrack && (
                        <div className="mt-2 text-xs text-slate-400 flex items-center gap-1">
                            <Music className="w-3 h-3" /> {activeTrack.name} ({state.bgMusicIntensity})
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                    {state.scenes.map((scene, idx) => {
                        const isActive = currentSceneIndex === idx;

                        if (isEditing) {
                            return (
                                <div key={idx} className="bg-slate-900 p-3 rounded-lg border border-slate-700 space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-bold text-slate-500">SCENE {idx + 1}</span>
                                        <div className="flex gap-1">
                                            <button 
                                                onClick={() => moveScene(idx, 'up')}
                                                disabled={idx === 0}
                                                className="p-1 hover:bg-slate-700 rounded text-slate-400 disabled:opacity-30"
                                            >
                                                <ArrowUp className="w-3 h-3" />
                                            </button>
                                            <button 
                                                onClick={() => moveScene(idx, 'down')}
                                                disabled={idx === state.scenes.length - 1}
                                                className="p-1 hover:bg-slate-700 rounded text-slate-400 disabled:opacity-30"
                                            >
                                                <ArrowDown className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>

                                    <textarea
                                        value={scene.text}
                                        onChange={(e) => updateSceneText(idx, e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                                        rows={2}
                                    />

                                    <div className="flex items-center gap-2">
                                        <Clock className="w-3 h-3 text-slate-500" />
                                        <input 
                                            type="number" 
                                            value={scene.durationEstimates}
                                            onChange={(e) => updateSceneDuration(idx, parseFloat(e.target.value))}
                                            className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-300 w-16"
                                            step="0.5"
                                        />
                                        <span className="text-xs text-slate-500">sec</span>
                                    </div>
                                </div>
                            );
                        }

                        // View Mode
                        return (
                            <div 
                                key={idx} 
                                onClick={() => {
                                    setCurrentSceneIndex(idx);
                                    setIsPlaying(false);
                                    if (musicRef.current) {
                                        musicRef.current.pause();
                                        musicRef.current.currentTime = 0; 
                                    }
                                }}
                                className={`p-3 rounded-lg cursor-pointer border transition-all ${
                                    isActive 
                                    ? 'bg-indigo-600/20 border-indigo-500' 
                                    : 'bg-slate-900 border-slate-800 hover:border-slate-600'
                                }`}
                            >
                                <div className="flex justify-between mb-1">
                                    <span className={`text-xs font-bold ${isActive ? 'text-indigo-400' : 'text-slate-500'}`}>
                                        SCENE {idx + 1}
                                    </span>
                                    <span className="text-[10px] text-slate-600 font-mono">
                                        {scene.durationEstimates}s
                                    </span>
                                </div>
                                <p className={`text-xs line-clamp-2 ${isActive ? 'text-white' : 'text-slate-300'}`}>
                                    {scene.text}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-slate-700 flex justify-start">
             <button 
                onClick={onBack}
                className="px-6 py-3 text-slate-400 hover:text-white transition-colors"
            >
                Back to Production
            </button>
        </div>
    </div>
  );
};
