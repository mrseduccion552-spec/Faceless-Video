
import React, { useState } from 'react';
import { ProjectState, AppStep, AspectRatio } from './types';
import { StepIndicator } from './components/StepIndicator';
import { ScriptEditor } from './features/ScriptEditor';
import { VoiceSelector } from './features/VoiceSelector';
import { StoryboardGenerator } from './features/StoryboardGenerator';
import { VideoPreview } from './features/VideoPreview';

const INITIAL_STATE: ProjectState = {
  topic: '',
  rawScript: '',
  language: 'English US',
  targetRatio: AspectRatio.PORTRAIT,
  targetDuration: '1min',
  scenes: [],
  selectedVoiceId: '', 
  isGeneratingScript: false,
  bgMusicIntensity: 'Medium',
  selectedStyles: [],
  styleIntensity: 'Medium'
};

const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<AppStep>(AppStep.SCRIPT);
  const [projectState, setProjectState] = useState<ProjectState>(INITIAL_STATE);

  const updateState = (updates: Partial<ProjectState>) => {
    setProjectState(prev => ({ ...prev, ...updates }));
  };

  const canNavigate = (target: AppStep): boolean => {
    if (target === AppStep.SCRIPT) return true;
    if (target === AppStep.VOICE) return projectState.scenes.length > 0;
    if (target === AppStep.VISUALS) return projectState.scenes.length > 0 && !!projectState.selectedVoiceId;
    if (target === AppStep.PREVIEW) {
        return projectState.scenes.length > 0 && 
               projectState.scenes.every(s => !!s.imageUrl && !!s.audioUrl);
    }
    return false;
  };

  const handleStepChange = (step: AppStep) => {
    if (canNavigate(step)) {
      setCurrentStep(step);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-50 flex flex-col font-sans">
      <header className="bg-slate-950 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
               <div className="w-4 h-4 bg-white rounded-full" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">AI Faceless Engine <span className="text-xs font-normal text-indigo-400 ml-2 border border-indigo-900 bg-indigo-900/30 px-2 py-0.5 rounded-full">v2.0 PRO</span></h1>
          </div>
          <div className="text-xs text-slate-500 font-mono hidden sm:block">
            AUTO-PRODUCTION PIPELINE
          </div>
        </div>
      </header>

      <StepIndicator 
        currentStep={currentStep} 
        setStep={handleStepChange}
        canNavigate={canNavigate}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
        {currentStep === AppStep.SCRIPT && (
          <ScriptEditor 
            state={projectState} 
            updateState={updateState} 
            onNext={() => handleStepChange(AppStep.VOICE)} 
          />
        )}
        
        {currentStep === AppStep.VOICE && (
          <VoiceSelector 
            state={projectState} 
            updateState={updateState} 
            onNext={() => handleStepChange(AppStep.VISUALS)}
            onBack={() => handleStepChange(AppStep.SCRIPT)}
          />
        )}

        {currentStep === AppStep.VISUALS && (
          <StoryboardGenerator 
            state={projectState} 
            updateState={updateState} 
            onNext={() => handleStepChange(AppStep.PREVIEW)}
            onBack={() => handleStepChange(AppStep.VOICE)}
          />
        )}

        {currentStep === AppStep.PREVIEW && (
          <VideoPreview 
            state={projectState}
            updateState={updateState}
            onBack={() => handleStepChange(AppStep.VISUALS)}
          />
        )}
      </main>
      
      <footer className="py-6 text-center text-slate-600 text-sm">
        AI Faceless Engine © 2024. Production Ready System.
      </footer>
    </div>
  );
};

export default App;
