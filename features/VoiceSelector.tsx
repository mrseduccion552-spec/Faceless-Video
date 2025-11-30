
import React, { useState, useRef, useEffect } from 'react';
import { ProjectState, PREBUILT_VOICES, PREBUILT_MUSIC, VoiceProfile, MusicTrack } from '../types';
import { Mic, Play, Upload, User, Volume2, Check, Loader2, Square, AudioLines, Music, Activity } from 'lucide-react';
import { generateSpeech } from '../services/geminiService';

interface Props {
  state: ProjectState;
  updateState: (updates: Partial<ProjectState>) => void;
  onNext: () => void;
  onBack: () => void;
}

export const VoiceSelector: React.FC<Props> = ({ state, updateState, onNext, onBack }) => {
  const [playingPreview, setPlayingPreview] = useState<string | null>(null);
  const [playingMusicPreview, setPlayingMusicPreview] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState<string | null>(null);
  const [isCloning, setIsCloning] = useState(false);
  const [clonedProfile, setClonedProfile] = useState<VoiceProfile | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const musicRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (musicRef.current) {
        musicRef.current.pause();
        musicRef.current = null;
      }
    };
  }, []);

  const handlePlayVoicePreview = async (voice: VoiceProfile, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (musicRef.current) {
        musicRef.current.pause();
        setPlayingMusicPreview(null);
    }

    if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
    }

    if (playingPreview === voice.id) {
        setPlayingPreview(null);
        return;
    }

    setLoadingPreview(voice.id);

    try {
        const text = `Hello. This is a preview of the ${voice.name} voice. I am ready to generate your faceless video narration.`;
        const audioUrl = await generateSpeech(text, voice.apiVoiceName);
        
        const audio = new Audio(audioUrl);
        audioRef.current = audio;
        
        audio.onended = () => {
            setPlayingPreview(null);
            setLoadingPreview(null);
        };

        audio.onerror = () => {
             console.error("Audio playback error");
             setPlayingPreview(null);
             setLoadingPreview(null);
        };

        await audio.play();
        setLoadingPreview(null);
        setPlayingPreview(voice.id);

    } catch (e) {
        console.error("Preview failed", e);
        setLoadingPreview(null);
        setPlayingPreview(null);
    }
  };

  const handleVoiceFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCloning(true);
    setTimeout(() => {
        const newProfile: VoiceProfile = {
            id: 'cloned-1',
            name: 'Custom Clone',
            gender: 'Male', 
            style: 'Matched from Audio',
            apiVoiceName: 'Fenrir',
            isCloned: true
        };
        setClonedProfile(newProfile);
        updateState({ selectedVoiceId: newProfile.id });
        setIsCloning(false);
    }, 2500);
  };

  const handlePlayMusicPreview = (track: MusicTrack, e: React.MouseEvent) => {
    e.stopPropagation();

    if (audioRef.current) {
        audioRef.current.pause();
        setPlayingPreview(null);
    }

    if (musicRef.current) {
        musicRef.current.pause();
        musicRef.current = null;
    }

    if (playingMusicPreview === track.id) {
        setPlayingMusicPreview(null);
        return;
    }

    try {
        const audio = new Audio(track.url);
        audio.volume = 0.5;
        musicRef.current = audio;

        audio.onended = () => setPlayingMusicPreview(null);
        audio.onerror = (e) => {
            console.error("Music preview error", e);
            setPlayingMusicPreview(null);
        };
        
        audio.play().catch(e => console.error("Music play error", e));
        setPlayingMusicPreview(track.id);
    } catch (e) {
        console.error("Failed to init audio", e);
    }
  };

  const handleMusicUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        updateState({ customMusicBlob: file, selectedMusicTrackId: 'custom' });
    }
  };

  return (
    <div className="space-y-12 animate-fade-in pb-12">
        <div>
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">1. Select Your Narrator</h2>
                <p className="text-slate-400">Choose from our pro library or clone your own voice.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-300 flex items-center gap-2">
                        <User className="w-5 h-5" /> Standard Library
                    </h3>
                    <div className="space-y-3">
                        {PREBUILT_VOICES.map(voice => (
                            <div 
                                key={voice.id}
                                onClick={() => updateState({ selectedVoiceId: voice.id })}
                                className={`relative overflow-hidden p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                                    state.selectedVoiceId === voice.id 
                                    ? 'bg-indigo-600/20 border-indigo-500 ring-1 ring-indigo-500' 
                                    : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                                }`}
                            >
                                <div className="flex items-center gap-4 z-10">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shadow-lg ${
                                        state.selectedVoiceId === voice.id ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-400'
                                    }`}>
                                        {voice.gender === 'Male' ? 'M' : 'F'}
                                    </div>
                                    <div>
                                        <div className="font-medium text-slate-200 text-lg">{voice.name}</div>
                                        <div className="text-xs text-slate-500 flex items-center gap-2">
                                            <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-700">{voice.style}</span>
                                            {playingPreview === voice.id && (
                                                <span className="text-indigo-400 flex items-center gap-1 animate-pulse">
                                                    <AudioLines className="w-3 h-3" /> Speaking...
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                
                                <button 
                                    onClick={(e) => handlePlayVoicePreview(voice, e)}
                                    className={`z-10 p-3 rounded-full transition-all ${
                                        playingPreview === voice.id
                                        ? 'bg-indigo-500 text-white' 
                                        : 'bg-slate-700 text-slate-400 hover:text-white hover:bg-slate-600'
                                    }`}
                                >
                                    {loadingPreview === voice.id ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : playingPreview === voice.id ? (
                                        <Square className="w-5 h-5 fill-current" />
                                    ) : (
                                        <Play className="w-5 h-5 fill-current ml-0.5" />
                                    )}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-300 flex items-center gap-2">
                        <Mic className="w-5 h-5" /> Voice Cloning Engine
                    </h3>
                    
                    <div className="bg-slate-800 border-2 border-dashed border-slate-700 rounded-xl p-8 flex flex-col items-center justify-center text-center transition-colors hover:border-slate-600 h-[280px]">
                        {isCloning ? (
                            <div className="space-y-4">
                                <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mx-auto" />
                                <p className="text-indigo-400 text-sm">Analyzing Voice Patterns...</p>
                            </div>
                        ) : clonedProfile ? (
                            <div 
                                onClick={() => updateState({ selectedVoiceId: clonedProfile.id })}
                                className={`w-full h-full flex flex-col items-center justify-center p-4 rounded-lg cursor-pointer ${state.selectedVoiceId === clonedProfile.id ? 'bg-emerald-500/10 border border-emerald-500' : ''}`}
                            >
                                <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4 text-emerald-500">
                                    <Check className="w-8 h-8" />
                                </div>
                                <h4 className="font-bold text-white text-lg mb-1">Clone Ready</h4>
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setClonedProfile(null);
                                        updateState({ selectedVoiceId: PREBUILT_VOICES[0].id });
                                    }}
                                    className="text-xs text-red-400 hover:underline mt-2"
                                >
                                    Remove
                                </button>
                            </div>
                        ) : (
                            <>
                                <Upload className="w-10 h-10 text-slate-500 mb-4" />
                                <p className="text-sm text-slate-400 mb-6 max-w-xs">
                                    Upload a 10-30s clean recording to clone a voice.
                                </p>
                                <input 
                                    type="file" 
                                    accept="audio/*" 
                                    className="hidden" 
                                    id="voice-upload"
                                    onChange={handleVoiceFileUpload}
                                />
                                <label 
                                    htmlFor="voice-upload"
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium cursor-pointer"
                                >
                                    Select Audio
                                </label>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>

        <div className="pt-8 border-t border-slate-700">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">2. Atmosphere & Score</h2>
                <p className="text-slate-400">Set the emotional tone with adaptive background music.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-4">
                    <h3 className="text-lg font-semibold text-slate-300 flex items-center gap-2">
                        <Music className="w-5 h-5" /> Music Library
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {PREBUILT_MUSIC.map(track => (
                            <div 
                                key={track.id}
                                onClick={() => updateState({ selectedMusicTrackId: track.id })}
                                className={`p-3 rounded-lg border cursor-pointer flex items-center justify-between group ${
                                    state.selectedMusicTrackId === track.id
                                    ? 'bg-indigo-600/20 border-indigo-500' 
                                    : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                                }`}
                            >
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className={`w-8 h-8 rounded flex items-center justify-center flex-shrink-0 ${
                                         state.selectedMusicTrackId === track.id ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-400'
                                    }`}>
                                        <Music className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-sm font-medium text-slate-200 truncate">{track.name}</div>
                                        <div className="text-xs text-slate-500">{track.mood}</div>
                                    </div>
                                </div>
                                <button
                                    onClick={(e) => handlePlayMusicPreview(track, e)}
                                    className={`p-2 rounded-full flex-shrink-0 ${
                                        playingMusicPreview === track.id 
                                        ? 'bg-indigo-500 text-white' 
                                        : 'bg-slate-700 text-slate-400 hover:text-white'
                                    }`}
                                >
                                    {playingMusicPreview === track.id ? <Square className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
                                </button>
                            </div>
                        ))}
                    </div>

                     <div className="mt-4 pt-4 border-t border-slate-700/50">
                        <div className="flex items-center gap-4">
                            <input 
                                type="file" 
                                accept="audio/*" 
                                id="music-upload" 
                                className="hidden"
                                onChange={handleMusicUpload}
                            />
                            <label 
                                htmlFor="music-upload"
                                className={`flex-1 p-3 rounded-lg border border-dashed flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                                    state.selectedMusicTrackId === 'custom' 
                                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300' 
                                    : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800'
                                }`}
                            >
                                <Upload className="w-4 h-4" />
                                <span className="text-sm font-medium">
                                    {state.selectedMusicTrackId === 'custom' ? 'Custom Track Selected' : 'Upload Custom Music (MP3)'}
                                </span>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-300 flex items-center gap-2">
                        <Activity className="w-5 h-5" /> Mix Intensity
                    </h3>
                    <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                        <div className="space-y-6">
                            <p className="text-sm text-slate-400">
                                Adjust how dominant the music is compared to the voice narration.
                            </p>
                            
                            <div className="space-y-3">
                                {['Low', 'Medium', 'High'].map((level) => (
                                    <button
                                        key={level}
                                        onClick={() => updateState({ bgMusicIntensity: level as any })}
                                        className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${
                                            state.bgMusicIntensity === level
                                            ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-900/20'
                                            : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'
                                        }`}
                                    >
                                        <span className="font-medium text-sm">{level} Intensity</span>
                                        <div className="flex gap-0.5">
                                            <div className={`w-1 h-3 rounded-full ${state.bgMusicIntensity === level ? 'bg-white' : 'bg-slate-600'}`} />
                                            <div className={`w-1 h-3 rounded-full ${state.bgMusicIntensity === level && level !== 'Low' ? 'bg-white' : 'bg-slate-700'}`} />
                                            <div className={`w-1 h-3 rounded-full ${state.bgMusicIntensity === level && level === 'High' ? 'bg-white' : 'bg-slate-700'}`} />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div className="flex justify-between pt-8 border-t border-slate-700">
            <button 
                onClick={onBack}
                className="px-6 py-3 text-slate-400 hover:text-white transition-colors font-medium"
            >
                Back
            </button>
            <button
                onClick={onNext}
                disabled={!state.selectedVoiceId}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-3 rounded-lg font-bold shadow-lg shadow-emerald-900/20 transition-all flex items-center gap-2"
            >
                Confirm Audio <Check className="w-5 h-5" />
            </button>
        </div>
    </div>
  );
};
