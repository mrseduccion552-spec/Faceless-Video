
export enum AppStep {
  SCRIPT = 'SCRIPT',
  VOICE = 'VOICE',
  VISUALS = 'VISUALS',
  PREVIEW = 'PREVIEW'
}

export enum AspectRatio {
  LANDSCAPE = '16:9',
  PORTRAIT = '9:16',
  SQUARE = '1:1'
}

export interface ScriptScene {
  id: number;
  text: string;
  visualPrompt: string;
  durationEstimates: number;
  imageUrl?: string;
  audioUrl?: string;
  isGeneratingImage?: boolean;
  isGeneratingAudio?: boolean;
}

export interface VoiceProfile {
  id: string;
  name: string;
  gender: 'Male' | 'Female';
  style: string;
  previewUrl?: string; 
  apiVoiceName: string; 
  isCloned?: boolean;
}

export interface MusicTrack {
  id: string;
  name: string;
  mood: string;
  url: string; 
}

export interface VideoStyle {
  id: string;
  name: string;
  description: string;
}

export const VIDEO_DURATIONS = [
  "30s", "1min", "2min", "3min", "4min", "5min", "7min", "8min", "10min", 
  "12min", "15min", "20min", "25min", "30min", "35min", "40min", "45min", 
  "50min", "55min", "60min", "90min", "2h", "2h 30min"
] as const;

export type VideoDuration = typeof VIDEO_DURATIONS[number];

export interface ProjectState {
  topic: string;
  rawScript: string;
  language: string;
  targetRatio: AspectRatio;
  targetDuration: VideoDuration;
  scenes: ScriptScene[];
  selectedVoiceId: string;
  clonedVoiceBlob?: Blob | null;
  selectedMusicTrackId?: string;
  customMusicBlob?: Blob | null;
  isGeneratingScript: boolean;
  bgMusicIntensity: 'Low' | 'Medium' | 'High';
  // Style Engine
  selectedStyles: string[]; // Max 3
  styleIntensity: 'Soft' | 'Medium' | 'Extreme';
}

export const SUPPORTED_LANGUAGES = [
  "Español (Global)", "Español México", "Español España", "Español Latinoamérica", 
  "Español Ecuador", "Español Colombia", "Español Argentina", "Español Chile", 
  "Español Perú", "Español Venezuela",
  "English US", "English UK", "English Australia", "English Canada",
  "German", "French", "Italian", "Portuguese (Portugal)", "Portuguese (Brazil)",
  "Dutch", "Russian", "Ukrainian", "Japanese", "Korean", "Mandarin", "Cantonese",
  "Arabic", "Turkish", "Hindi", "Indonesian", "Vietnamese", "Hungarian", "Czech", "Polish", "Romanian", "Slovak"
];

export const PREBUILT_VOICES: VoiceProfile[] = [
  { id: 'v2', name: 'Fenrir', gender: 'Male', style: 'Deep, Narrative', apiVoiceName: 'Fenrir' },
  { id: 'v3', name: 'Puck', gender: 'Male', style: 'Energetic, Clear', apiVoiceName: 'Puck' },
  { id: 'v4', name: 'Charon', gender: 'Male', style: 'Deep, Authoritative', apiVoiceName: 'Charon' },
  { id: 'v5', name: 'Zephyr', gender: 'Female', style: 'Balanced, Standard', apiVoiceName: 'Zephyr' },
];

// Replaced with reliable test streams to prevent "no supported sources" error
export const PREBUILT_MUSIC: MusicTrack[] = [
  { id: 'm1', name: 'Corporate Uplifting', mood: 'Professional', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { id: 'm2', name: 'Cinematic Ambient', mood: 'Emotional', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3' },
  { id: 'm3', name: 'Tech Lo-Fi', mood: 'Modern', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3' },
  { id: 'm4', name: 'Dark Tension', mood: 'Mystery', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3' },
];

export const VIDEO_STYLES: VideoStyle[] = [
  { id: 'realistic-film', name: 'Realistic Film', description: 'Cinematic lighting, realistic textures' },
  { id: '3d-cartoon', name: '3D Cartoon', description: 'Pixar-style animation, vibrant colors' },
  { id: 'cinematic', name: 'Cinematic Film', description: 'Wide aspect ratio, dramatic lighting' },
  { id: 'photographic', name: 'Photographic', description: 'High-res photography style' },
  { id: 'fantasy', name: 'Fantasy', description: 'Magical atmosphere, soft glow' },
  { id: 'futuristic', name: 'Futuristic', description: 'Sci-fi elements, neon lights' },
  { id: 'sports-gaming', name: 'Sports Gaming', description: 'High energy, sharp focus' },
  { id: 'portrait', name: 'Portrait', description: 'Focus on characters, shallow depth of field' },
  { id: 'noir-comic', name: 'Dark Comic / Noir', description: 'High contrast, black and white accents' },
  { id: 'modern-realism', name: 'Modern Realism', description: 'Clean lines, contemporary look' },
  { id: 'biblical', name: 'Biblical Style', description: 'Epic scale, historical tones' },
  { id: 'miniature', name: 'Miniature World', description: 'Tilt-shift effect, macro details' },
  { id: 'clay-animation', name: 'Clay Animation', description: 'Stop motion look, clay textures' },
  { id: '90s-pixel', name: '90s Pixel Art', description: 'Retro gaming aesthetic' },
  { id: 'disney', name: 'Disney Style', description: 'Classic hand-drawn animation style' },
  { id: 'anime', name: 'Anime', description: 'Japanese animation style' },
  { id: 'jurassic', name: 'Jurassic Theme', description: 'Prehistoric nature, earthy tones' },
  { id: 'clay-static', name: 'Clay Style', description: 'Artistic clay sculpture look' },
  { id: 'epic-fantasy', name: 'Epic Fantasy', description: 'Grand landscapes, heroic lighting' },
  { id: 'impressionist', name: 'Impressionist', description: 'Painterly strokes, light focus' },
  { id: 'horror', name: 'Horror', description: 'Dark shadows, unsettling atmosphere' },
  { id: 'cyberpunk', name: 'Cyberpunk', description: 'High tech, low life, neon colors' },
  { id: 'neoclassical', name: 'Neoclassical', description: 'Elegant, classical art style' },
  { id: 'prehistoric', name: 'Prehistoric', description: 'Raw nature, ancient setting' },
  { id: 'roman-art', name: 'Roman Art', description: 'Mosaic and fresco styles' },
  { id: 'bw-film', name: 'B&W Film', description: 'Classic noir, grainy texture' },
  { id: 'comic', name: 'Comic Style', description: 'Bold outlines, comic book colors' },
];
