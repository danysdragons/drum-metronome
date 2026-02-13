import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Plus, Trash2, Volume2, Save, X } from 'lucide-react';

type SoundType =
  | 'kick'
  | 'snare'
  | 'hihat'
  | 'tom'
  | 'clap'
  | 'click'
  | 'drum'
  | 'chime'
  | 'wood'
  | 'cowbell'
  | 'bell'
  | 'beep';

type VisualShape = 'circle' | 'square';

interface BeatSound {
  type: SoundType;
  volume: number;
}

interface BeatPattern {
  beat: string;
  isMainBeat: boolean;
  sounds: BeatSound[];
  color: string;
}

interface Preset {
  id: string;
  name: string;
  beatPatterns: BeatPattern[];
  subdivisionsPerBeat: number;
  numMainBeats: number;
}

export interface PersistedMetronomeState {
  version: number;
  bpm: number;
  masterVolume: number;
  visualShape: VisualShape;
  subdivisionsPerBeat: number;
  numMainBeats: number;
  beatPatterns: BeatPattern[];
  presets: Preset[];
  selectedPresetId: string;
}

export const PERSISTENCE_VERSION = 1;
const STORAGE_KEY = 'drum-metronome/state/v1';
const MIN_BPM = 0.1;
const MAX_BPM = 300;
const MIN_MAIN_BEATS = 1;
const MAX_MAIN_BEATS = 16;
const MAX_MASTER_VOLUME = 1;
const DEFAULT_BPM = 117;
const DEFAULT_MASTER_VOLUME = 0.7;
const DEFAULT_VISUAL_SHAPE: VisualShape = 'circle';
const DEFAULT_SUBDIVISIONS = 2;
const DEFAULT_MAIN_BEATS = 4;
const DEFAULT_COLOR = 'bg-blue-500';
const MASTER_OUTPUT_BOOST = 2.5;

const DEFAULT_BEAT_PATTERNS: BeatPattern[] = [
  {
    beat: '1',
    isMainBeat: true,
    sounds: [
      { type: 'kick', volume: 1.0 },
      { type: 'hihat', volume: 0.6 }
    ],
    color: DEFAULT_COLOR
  },
  {
    beat: '&',
    isMainBeat: false,
    sounds: [{ type: 'hihat', volume: 0.6 }],
    color: DEFAULT_COLOR
  },
  {
    beat: '2',
    isMainBeat: true,
    sounds: [{ type: 'hihat', volume: 0.6 }],
    color: DEFAULT_COLOR
  },
  {
    beat: '&',
    isMainBeat: false,
    sounds: [{ type: 'hihat', volume: 0.6 }],
    color: DEFAULT_COLOR
  },
  {
    beat: '3',
    isMainBeat: true,
    sounds: [
      { type: 'snare', volume: 0.9 },
      { type: 'hihat', volume: 0.6 }
    ],
    color: DEFAULT_COLOR
  },
  {
    beat: '&',
    isMainBeat: false,
    sounds: [{ type: 'hihat', volume: 0.6 }],
    color: DEFAULT_COLOR
  },
  {
    beat: '4',
    isMainBeat: true,
    sounds: [{ type: 'hihat', volume: 0.6 }],
    color: DEFAULT_COLOR
  },
  {
    beat: '&',
    isMainBeat: false,
    sounds: [{ type: 'hihat', volume: 0.6 }],
    color: DEFAULT_COLOR
  }
];

const SOUND_TYPES: SoundType[] = [
  'kick',
  'snare',
  'hihat',
  'tom',
  'clap',
  'click',
  'drum',
  'chime',
  'wood',
  'cowbell',
  'bell',
  'beep'
];

const SOUND_TYPE_SET = new Set<SoundType>(SOUND_TYPES);

const clampBpm = (value: number): number => Math.max(MIN_BPM, Math.min(MAX_BPM, value));
const clampMainBeats = (value: number): number =>
  Math.max(MIN_MAIN_BEATS, Math.min(MAX_MAIN_BEATS, value));
const clampVolume = (value: number): number => Math.max(0, Math.min(1, value));
const clampMasterVolume = (value: number): number =>
  Math.max(0, Math.min(MAX_MASTER_VOLUME, value));
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const clonePatterns = (patterns: BeatPattern[]): BeatPattern[] =>
  JSON.parse(JSON.stringify(patterns)) as BeatPattern[];

const clonePresets = (items: Preset[]): Preset[] =>
  items.map((preset) => ({
    ...preset,
    beatPatterns: clonePatterns(preset.beatPatterns)
  }));

const parseBeatSound = (value: unknown): BeatSound | null => {
  if (!isRecord(value)) {
    return null;
  }

  const { type, volume } = value;
  if (typeof type !== 'string' || !SOUND_TYPE_SET.has(type as SoundType)) {
    return null;
  }
  if (typeof volume !== 'number' || !Number.isFinite(volume)) {
    return null;
  }

  return {
    type: type as SoundType,
    volume: clampVolume(volume)
  };
};

const parseBeatPattern = (value: unknown): BeatPattern | null => {
  if (!isRecord(value)) {
    return null;
  }

  const { beat, isMainBeat, sounds, color } = value;
  if (typeof beat !== 'string' || typeof isMainBeat !== 'boolean' || !Array.isArray(sounds)) {
    return null;
  }

  const parsedSounds = sounds
    .map(parseBeatSound)
    .filter((sound): sound is BeatSound => sound !== null);
  if (parsedSounds.length === 0) {
    parsedSounds.push({ type: 'click', volume: DEFAULT_MASTER_VOLUME });
  }

  return {
    beat,
    isMainBeat,
    sounds: parsedSounds,
    color: typeof color === 'string' && color.trim() ? color : DEFAULT_COLOR
  };
};

const parseBeatPatterns = (value: unknown): BeatPattern[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(parseBeatPattern)
    .filter((pattern): pattern is BeatPattern => pattern !== null);
};

const parsePreset = (value: unknown): Preset | null => {
  if (!isRecord(value)) {
    return null;
  }

  const { id, name, beatPatterns, subdivisionsPerBeat, numMainBeats } = value;
  if (typeof id !== 'string' || typeof name !== 'string' || !id.trim() || !name.trim()) {
    return null;
  }
  if (typeof subdivisionsPerBeat !== 'number' || typeof numMainBeats !== 'number') {
    return null;
  }

  const safeSubdivisions = clampSubdivisions(subdivisionsPerBeat);
  const safeMainBeats = clampMainBeats(numMainBeats);
  const parsedPatterns = parseBeatPatterns(beatPatterns);

  return {
    id,
    name,
    beatPatterns:
      parsedPatterns.length > 0
        ? parsedPatterns
        : generateBeatPattern(safeMainBeats, safeSubdivisions),
    subdivisionsPerBeat: safeSubdivisions,
    numMainBeats: safeMainBeats
  };
};

const parsePresets = (value: unknown): Preset[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map(parsePreset).filter((preset): preset is Preset => preset !== null);
};

export const serializePersistedMetronomeState = (state: PersistedMetronomeState): string =>
  JSON.stringify({
    ...state,
    version: PERSISTENCE_VERSION
  });

export const deserializePersistedMetronomeState = (
  rawState: string | null
): PersistedMetronomeState | null => {
  if (!rawState) {
    return null;
  }

  try {
    const parsedValue = JSON.parse(rawState) as unknown;
    if (!isRecord(parsedValue)) {
      return null;
    }

    const { version } = parsedValue;
    if (
      version !== undefined &&
      (typeof version !== 'number' || version !== PERSISTENCE_VERSION)
    ) {
      return null;
    }

    const safeSubdivisions =
      typeof parsedValue.subdivisionsPerBeat === 'number'
        ? clampSubdivisions(parsedValue.subdivisionsPerBeat)
        : DEFAULT_SUBDIVISIONS;
    const safeMainBeats =
      typeof parsedValue.numMainBeats === 'number'
        ? clampMainBeats(parsedValue.numMainBeats)
        : DEFAULT_MAIN_BEATS;

    const parsedPatterns = parseBeatPatterns(parsedValue.beatPatterns);
    const presets = parsePresets(parsedValue.presets);
    const selectedPresetId =
      typeof parsedValue.selectedPresetId === 'string' &&
      presets.some((preset) => preset.id === parsedValue.selectedPresetId)
        ? parsedValue.selectedPresetId
        : '';

    return {
      version: PERSISTENCE_VERSION,
      bpm:
        typeof parsedValue.bpm === 'number' ? clampBpm(parsedValue.bpm) : DEFAULT_BPM,
      masterVolume:
        typeof parsedValue.masterVolume === 'number'
          ? clampMasterVolume(parsedValue.masterVolume)
          : DEFAULT_MASTER_VOLUME,
      visualShape:
        parsedValue.visualShape === 'square' ? 'square' : DEFAULT_VISUAL_SHAPE,
      subdivisionsPerBeat: safeSubdivisions,
      numMainBeats: safeMainBeats,
      beatPatterns:
        parsedPatterns.length > 0
          ? parsedPatterns
          : generateBeatPattern(safeMainBeats, safeSubdivisions),
      presets,
      selectedPresetId
    };
  } catch {
    return null;
  }
};

export const clampSubdivisions = (value: number): number => Math.max(1, Math.min(4, value));

export const generateBeatPattern = (mainBeats: number, subdivisions: number): BeatPattern[] => {
  const pattern: BeatPattern[] = [];
  const subdivisionLabels: Record<number, string[]> = {
    1: [''],
    2: ['', '&'],
    3: ['', '&', 'a'],
    4: ['', 'e', '&', 'a']
  };
  const safeSubdivisions = clampSubdivisions(subdivisions);
  const labels = subdivisionLabels[safeSubdivisions] ?? subdivisionLabels[2];
  
  for (let i = 1; i <= mainBeats; i++) {
    for (let j = 0; j < safeSubdivisions; j++) {
      const isMain = j === 0;
      const label = isMain ? String(i) : labels[j] ?? '&';
      pattern.push({
        beat: label,
        isMainBeat: isMain,
        sounds: [{ type: 'click', volume: 0.7 }],
        color: 'bg-blue-500'
      });
    }
  }
  return pattern;
};

export const buildUniquePresetName = (
  requestedName: string,
  existingPresetNames: string[]
): string => {
  const normalizedRequestedName = requestedName.trim();
  if (!normalizedRequestedName) {
    return '';
  }

  const existingNames = new Set(existingPresetNames.map((name) => name.toLowerCase()));
  if (!existingNames.has(normalizedRequestedName.toLowerCase())) {
    return normalizedRequestedName;
  }

  let suffix = 2;
  let candidateName = `${normalizedRequestedName} (${suffix})`;
  while (existingNames.has(candidateName.toLowerCase())) {
    suffix += 1;
    candidateName = `${normalizedRequestedName} (${suffix})`;
  }

  return candidateName;
};

const InteractiveMetronome = () => {
  const LOOKAHEAD_MS = 25;
  const SCHEDULE_AHEAD_TIME_SECONDS = 0.12;
  const PERSIST_DEBOUNCE_MS = 150;

  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(DEFAULT_BPM);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [visualPulse, setVisualPulse] = useState(false);
  const [visualShape, setVisualShape] = useState<VisualShape>(DEFAULT_VISUAL_SHAPE);
  const [masterVolume, setMasterVolume] = useState(DEFAULT_MASTER_VOLUME);
  const [subdivisionsPerBeat, setSubdivisionsPerBeat] = useState(DEFAULT_SUBDIVISIONS);
  const [numMainBeats, setNumMainBeats] = useState(DEFAULT_MAIN_BEATS);
  const [audioError, setAudioError] = useState<string | null>(null);

  const [beatPatterns, setBeatPatterns] = useState<BeatPattern[]>(() =>
    clonePatterns(DEFAULT_BEAT_PATTERNS)
  );

  const [presets, setPresets] = useState<Preset[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState('');
  const [newPresetName, setNewPresetName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [hasLoadedPersistedState, setHasLoadedPersistedState] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const schedulerIntervalRef = useRef<number | null>(null);
  const beatIndexRef = useRef(0);
  const nextNoteTimeRef = useRef(0);
  const scheduledVisualTimersRef = useRef<Set<number>>(new Set());
  const pulseTimeoutRef = useRef<number | null>(null);
  const noiseBufferRef = useRef<AudioBuffer | null>(null);
  const beatPatternsRef = useRef(beatPatterns);
  const bpmRef = useRef(bpm);
  const masterVolumeRef = useRef(masterVolume);
  const subdivisionsPerBeatRef = useRef(subdivisionsPerBeat);

  useEffect(() => {
    beatPatternsRef.current = beatPatterns;
  }, [beatPatterns]);

  useEffect(() => {
    bpmRef.current = bpm;
  }, [bpm]);

  useEffect(() => {
    masterVolumeRef.current = masterVolume;
  }, [masterVolume]);

  useEffect(() => {
    subdivisionsPerBeatRef.current = subdivisionsPerBeat;
  }, [subdivisionsPerBeat]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      setHasLoadedPersistedState(true);
      return;
    }

    try {
      const restoredState = deserializePersistedMetronomeState(
        window.localStorage.getItem(STORAGE_KEY)
      );

      if (restoredState) {
        setBpm(restoredState.bpm);
        setMasterVolume(restoredState.masterVolume);
        setVisualShape(restoredState.visualShape);
        setSubdivisionsPerBeat(restoredState.subdivisionsPerBeat);
        setNumMainBeats(restoredState.numMainBeats);
        setBeatPatterns(clonePatterns(restoredState.beatPatterns));
        setPresets(clonePresets(restoredState.presets));
        setSelectedPresetId(restoredState.selectedPresetId);
      }
    } catch {
      // Best effort restore only.
    } finally {
      setHasLoadedPersistedState(true);
    }
  }, []);

  useEffect(() => {
    if (!hasLoadedPersistedState || typeof window === 'undefined') {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      const persistedState: PersistedMetronomeState = {
        version: PERSISTENCE_VERSION,
        bpm,
        masterVolume,
        visualShape,
        subdivisionsPerBeat,
        numMainBeats,
        beatPatterns: clonePatterns(beatPatterns),
        presets: clonePresets(presets),
        selectedPresetId
      };

      try {
        window.localStorage.setItem(
          STORAGE_KEY,
          serializePersistedMetronomeState(persistedState)
        );
      } catch {
        // localStorage may be blocked/full; keep app functional.
      }
    }, PERSIST_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    hasLoadedPersistedState,
    bpm,
    masterVolume,
    visualShape,
    subdivisionsPerBeat,
    numMainBeats,
    beatPatterns,
    presets,
    selectedPresetId
  ]);

  const getNoiseBuffer = (ctx: AudioContext): AudioBuffer => {
    if (noiseBufferRef.current) {
      return noiseBufferRef.current;
    }

    const buffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const channel = buffer.getChannelData(0);
    for (let i = 0; i < channel.length; i += 1) {
      channel[i] = Math.random() * 2 - 1;
    }

    noiseBufferRef.current = buffer;
    return buffer;
  };

  const ensureAudioContext = (): AudioContext | null => {
    if (audioContextRef.current) {
      return audioContextRef.current;
    }

    const AudioContextClass =
      window.AudioContext ||
      (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

    if (!AudioContextClass) {
      setAudioError('Audio is not supported in this browser.');
      return null;
    }

    audioContextRef.current = new AudioContextClass();
    return audioContextRef.current;
  };

  const clearScheduledVisualTimers = () => {
    for (const timerId of scheduledVisualTimersRef.current) {
      window.clearTimeout(timerId);
    }
    scheduledVisualTimersRef.current.clear();
  };

  const playSound = (soundType: SoundType, beatVolume: number, startTime?: number) => {
    const ctx = ensureAudioContext();
    if (!ctx) {
      return;
    }

    const finalVolume = masterVolumeRef.current * beatVolume * MASTER_OUTPUT_BOOST;
    if (finalVolume <= 0.0001) {
      return;
    }

    const now = startTime ?? ctx.currentTime;
    const floorGain = 0.0001;
    const minFreq = 20;

    const tone = (
      type: OscillatorType,
      startFrequency: number,
      endFrequency: number,
      gain: number,
      duration: number,
      offset = 0,
      attack = 0.002
    ) => {
      const startAt = now + offset;
      const osc = ctx.createOscillator();
      const env = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(Math.max(minFreq, startFrequency), startAt);
      osc.frequency.exponentialRampToValueAtTime(
        Math.max(minFreq, endFrequency),
        startAt + duration
      );

      env.gain.setValueAtTime(floorGain, startAt);
      env.gain.exponentialRampToValueAtTime(Math.max(floorGain, gain), startAt + attack);
      env.gain.exponentialRampToValueAtTime(floorGain, startAt + duration);

      osc.connect(env);
      env.connect(ctx.destination);
      osc.start(startAt);
      osc.stop(startAt + duration + 0.01);
    };

    const noise = (
      gain: number,
      duration: number,
      filterType: BiquadFilterType,
      frequency: number,
      q = 1,
      offset = 0
    ) => {
      const startAt = now + offset;
      const source = ctx.createBufferSource();
      const filter = ctx.createBiquadFilter();
      const env = ctx.createGain();

      source.buffer = getNoiseBuffer(ctx);
      filter.type = filterType;
      filter.frequency.setValueAtTime(Math.max(minFreq, frequency), startAt);
      filter.Q.setValueAtTime(Math.max(0.0001, q), startAt);

      env.gain.setValueAtTime(Math.max(floorGain, gain), startAt);
      env.gain.exponentialRampToValueAtTime(floorGain, startAt + duration);

      source.connect(filter);
      filter.connect(env);
      env.connect(ctx.destination);
      source.start(startAt);
      source.stop(startAt + duration + 0.01);
    };

    switch (soundType) {
      case 'kick':
        tone('sine', 150, 44, 0.95 * finalVolume, 0.24);
        tone('triangle', 75, 38, 0.35 * finalVolume, 0.19);
        noise(0.16 * finalVolume, 0.015, 'highpass', 1900, 0.7);
        break;
      case 'snare':
        noise(0.62 * finalVolume, 0.17, 'bandpass', 1800, 0.75);
        noise(0.28 * finalVolume, 0.1, 'highpass', 3500, 0.9);
        tone('triangle', 220, 145, 0.28 * finalVolume, 0.12);
        break;
      case 'hihat':
        noise(0.32 * finalVolume, 0.055, 'highpass', 7200, 0.7);
        noise(0.16 * finalVolume, 0.045, 'bandpass', 9800, 3.2);
        tone('square', 6200, 4200, 0.07 * finalVolume, 0.03, 0.002, 0.001);
        break;
      case 'tom':
        tone('sine', 185, 88, 0.78 * finalVolume, 0.22);
        tone('triangle', 240, 130, 0.22 * finalVolume, 0.18);
        noise(0.05 * finalVolume, 0.03, 'bandpass', 1200, 1);
        break;
      case 'clap':
        noise(0.26 * finalVolume, 0.018, 'bandpass', 1700, 0.6);
        noise(0.22 * finalVolume, 0.018, 'bandpass', 1700, 0.6, 0.012);
        noise(0.18 * finalVolume, 0.018, 'bandpass', 1700, 0.6, 0.024);
        noise(0.2 * finalVolume, 0.11, 'highpass', 1200, 0.8, 0.03);
        break;
      case 'click':
        tone('square', 2400, 1450, 0.23 * finalVolume, 0.025, 0, 0.001);
        noise(0.12 * finalVolume, 0.012, 'highpass', 5000, 1.2);
        break;
      case 'drum':
        tone('sine', 120, 52, 0.75 * finalVolume, 0.2);
        noise(0.14 * finalVolume, 0.06, 'lowpass', 900, 0.8);
        break;
      case 'chime':
        tone('sine', 1420, 1390, 0.23 * finalVolume, 0.46);
        tone('sine', 2130, 2090, 0.14 * finalVolume, 0.35);
        tone('sine', 2840, 2800, 0.1 * finalVolume, 0.25);
        break;
      case 'wood':
        tone('triangle', 720, 430, 0.25 * finalVolume, 0.06, 0, 0.001);
        noise(0.11 * finalVolume, 0.03, 'bandpass', 2300, 1.2);
        break;
      case 'cowbell':
        tone('square', 560, 520, 0.22 * finalVolume, 0.22, 0, 0.001);
        tone('square', 845, 810, 0.2 * finalVolume, 0.18, 0, 0.001);
        noise(0.07 * finalVolume, 0.05, 'bandpass', 2200, 1.5);
        break;
      case 'bell':
        tone('sine', 1000, 995, 0.24 * finalVolume, 0.64);
        tone('sine', 1490, 1470, 0.16 * finalVolume, 0.5);
        tone('sine', 2210, 2190, 0.09 * finalVolume, 0.38);
        break;
      case 'beep':
        tone('square', 440, 432, 0.22 * finalVolume, 0.11, 0, 0.002);
        tone('sine', 880, 865, 0.08 * finalVolume, 0.08, 0.01, 0.002);
        break;
    }
  };

  const scheduleVisualPulse = (beatIndex: number, beatTime: number, currentAudioTime: number) => {
    const delayMs = Math.max(0, (beatTime - currentAudioTime) * 1000);
    const timerId = window.setTimeout(() => {
      scheduledVisualTimersRef.current.delete(timerId);
      setCurrentBeat(beatIndex);
      setVisualPulse(true);

      if (pulseTimeoutRef.current) {
        window.clearTimeout(pulseTimeoutRef.current);
      }

      pulseTimeoutRef.current = window.setTimeout(() => {
        setVisualPulse(false);
        pulseTimeoutRef.current = null;
      }, 50);
    }, delayMs);

    scheduledVisualTimersRef.current.add(timerId);
  };

  const stopTransport = () => {
    if (schedulerIntervalRef.current) {
      window.clearInterval(schedulerIntervalRef.current);
      schedulerIntervalRef.current = null;
    }

    clearScheduledVisualTimers();

    if (pulseTimeoutRef.current) {
      window.clearTimeout(pulseTimeoutRef.current);
      pulseTimeoutRef.current = null;
    }

    beatIndexRef.current = 0;
    nextNoteTimeRef.current = 0;
    setCurrentBeat(0);
    setVisualPulse(false);
  };

  const scheduleAudioTick = () => {
    const ctx = audioContextRef.current;
    if (!ctx) {
      return;
    }

    const activePatterns = beatPatternsRef.current;
    if (!activePatterns.length) {
      return;
    }

    while (nextNoteTimeRef.current < ctx.currentTime + SCHEDULE_AHEAD_TIME_SECONDS) {
      const beatIndex = beatIndexRef.current % activePatterns.length;
      const beat = activePatterns[beatIndex];
      beat.sounds.forEach((sound) => {
        playSound(sound.type, sound.volume, nextNoteTimeRef.current);
      });
      scheduleVisualPulse(beatIndex, nextNoteTimeRef.current, ctx.currentTime);

      const safeBpm = Math.max(0.1, bpmRef.current);
      const safeSubdivisions = Math.max(1, subdivisionsPerBeatRef.current);
      const secondsPerSubdivision = 60 / safeBpm / safeSubdivisions;

      nextNoteTimeRef.current += secondsPerSubdivision;
      beatIndexRef.current = (beatIndexRef.current + 1) % activePatterns.length;
    }
  };

  const startTransport = () => {
    const ctx = audioContextRef.current;
    if (!ctx) {
      return;
    }

    stopTransport();
    beatIndexRef.current = 0;
    nextNoteTimeRef.current = ctx.currentTime + 0.03;
    schedulerIntervalRef.current = window.setInterval(scheduleAudioTick, LOOKAHEAD_MS);
    scheduleAudioTick();
  };

  const updateSubdivisions = (newSubdivisions: number) => {
    const safeSubdivisions = clampSubdivisions(newSubdivisions);
    setSubdivisionsPerBeat(safeSubdivisions);
    setBeatPatterns(generateBeatPattern(numMainBeats, safeSubdivisions));
  };

  const updateMainBeats = (newMainBeats: number) => {
    setNumMainBeats(newMainBeats);
    setBeatPatterns(generateBeatPattern(newMainBeats, subdivisionsPerBeat));
  };

  useEffect(() => {
    if (!isPlaying) {
      stopTransport();
      return;
    }

    startTransport();
    return () => {
      stopTransport();
    };
  }, [isPlaying]);

  useEffect(() => {
    return () => {
      stopTransport();
      if (audioContextRef.current) {
        void audioContextRef.current.close();
      }
    };
  }, []);

  const togglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      return;
    }

    const ctx = ensureAudioContext();
    if (!ctx) {
      setIsPlaying(false);
      return;
    }

    const resumePromise = ctx.state === 'suspended' ? ctx.resume() : Promise.resolve();
    void resumePromise
      .then(() => {
        setAudioError(null);
        setIsPlaying(true);
      })
      .catch(() => {
        setAudioError('Unable to start audio. Check autoplay/browser audio settings.');
        setIsPlaying(false);
      });
  };

  const addSoundToBeat = (beatIndex: number) => {
    setBeatPatterns((previousPatterns) =>
      previousPatterns.map((pattern, index) =>
        index === beatIndex
          ? { ...pattern, sounds: [...pattern.sounds, { type: 'click', volume: 0.7 }] }
          : pattern
      )
    );
  };

  const removeSoundFromBeat = (beatIndex: number, soundIndex: number) => {
    setBeatPatterns((previousPatterns) =>
      previousPatterns.map((pattern, index) => {
        if (index !== beatIndex || pattern.sounds.length <= 1) {
          return pattern;
        }

        return {
          ...pattern,
          sounds: pattern.sounds.filter((_, indexToRemove) => indexToRemove !== soundIndex)
        };
      })
    );
  };

  const updateBeatSoundType = (beatIndex: number, soundIndex: number, newType: SoundType) => {
    setBeatPatterns((previousPatterns) =>
      previousPatterns.map((pattern, index) =>
        index === beatIndex
          ? {
              ...pattern,
              sounds: pattern.sounds.map((sound, currentSoundIndex) =>
                currentSoundIndex === soundIndex ? { ...sound, type: newType } : sound
              )
            }
          : pattern
      )
    );
  };

  const updateBeatSoundVolume = (beatIndex: number, soundIndex: number, newVolume: number) => {
    setBeatPatterns((previousPatterns) =>
      previousPatterns.map((pattern, index) =>
        index === beatIndex
          ? {
              ...pattern,
              sounds: pattern.sounds.map((sound, currentSoundIndex) =>
                currentSoundIndex === soundIndex ? { ...sound, volume: newVolume } : sound
              )
            }
          : pattern
      )
    );
  };

  const updateBeatColor = (index: number, color: string) => {
    setBeatPatterns((previousPatterns) =>
      previousPatterns.map((pattern, patternIndex) =>
        patternIndex === index ? { ...pattern, color } : pattern
      )
    );
  };

  const createPresetId = (): string => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  };

  const savePreset = () => {
    const uniquePresetName = buildUniquePresetName(
      newPresetName,
      presets.map((preset) => preset.name)
    );
    if (uniquePresetName) {
      const preset: Preset = {
        id: createPresetId(),
        name: uniquePresetName,
        beatPatterns: clonePatterns(beatPatterns),
        subdivisionsPerBeat,
        numMainBeats
      };
      setPresets((previousPresets) => [...previousPresets, preset]);
      setNewPresetName('');
      setShowSaveDialog(false);
      setSelectedPresetId(preset.id);
    }
  };

  const loadPreset = (presetId: string) => {
    if (presetId === '') {
      setSelectedPresetId('');
      return;
    }
    const preset = presets.find((p) => p.id === presetId);
    if (preset) {
      setBeatPatterns(clonePatterns(preset.beatPatterns));
      setSubdivisionsPerBeat(preset.subdivisionsPerBeat);
      setNumMainBeats(preset.numMainBeats);
      setSelectedPresetId(preset.id);
    }
  };

  const deletePreset = (presetId: string) => {
    setPresets((previousPresets) => previousPresets.filter((preset) => preset.id !== presetId));
    if (selectedPresetId === presetId) {
      setSelectedPresetId('');
    }
  };

  const soundOptions: { value: SoundType; label: string }[] = [
    { value: 'kick', label: 'Kick (BD)' },
    { value: 'snare', label: 'Snare (SD)' },
    { value: 'hihat', label: 'Hi-Hat (HH)' },
    { value: 'tom', label: 'Tom' },
    { value: 'clap', label: 'Clap' },
    { value: 'click', label: 'Click' },
    { value: 'drum', label: 'Drum' },
    { value: 'chime', label: 'Chime' },
    { value: 'wood', label: 'Wood' },
    { value: 'cowbell', label: 'Cowbell' },
    { value: 'bell', label: 'Bell' },
    { value: 'beep', label: 'Beep' }
  ];

  const colorOptions: { value: string; label: string }[] = [
    { value: 'bg-blue-500', label: 'Blue' },
    { value: 'bg-red-500', label: 'Red' },
    { value: 'bg-green-500', label: 'Green' },
    { value: 'bg-yellow-500', label: 'Yellow' },
    { value: 'bg-purple-500', label: 'Purple' },
    { value: 'bg-gray-400', label: 'Gray' },
    { value: 'bg-orange-500', label: 'Orange' },
    { value: 'bg-pink-500', label: 'Pink' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8">Interactive Metronome</h1>
        {audioError && (
          <div
            role="alert"
            className="mb-4 rounded border border-red-400/50 bg-red-500/10 px-4 py-2 text-sm text-red-200"
          >
            {audioError}
          </div>
        )}
        
        <div className="bg-slate-800 rounded-lg p-6 shadow-xl mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="flex flex-col items-center justify-center">
              <button
                onClick={togglePlay}
                aria-label={isPlaying ? 'Pause metronome' : 'Start metronome'}
                className="bg-blue-600 hover:bg-blue-700 rounded-full p-6 transition-colors mb-2"
              >
                {isPlaying ? <Pause size={32} /> : <Play size={32} />}
              </button>
              <span className="text-sm text-gray-400">Play / Pause</span>
            </div>
            
            <div className="flex flex-col items-center">
              <label className="text-sm text-gray-400 mb-2">Tempo (BPM)</label>
              <input
                type="number"
                value={bpm}
                onChange={(e) => setBpm(clampBpm(parseFloat(e.target.value) || 120))}
                className="bg-slate-700 text-white px-4 py-2 rounded w-24 text-center text-xl font-bold mb-2"
                min={MIN_BPM}
                max={MAX_BPM}
                step="0.1"
              />
              <input
                type="range"
                value={bpm}
                onChange={(e) => setBpm(clampBpm(parseFloat(e.target.value)))}
                min={MIN_BPM}
                max={MAX_BPM}
                step="0.1"
                className="w-full max-w-xs"
              />
            </div>

            <div className="flex flex-col items-center">
              <label className="text-sm text-gray-400 mb-2">Subdivisions</label>
              <select
                value={subdivisionsPerBeat}
                onChange={(e) => updateSubdivisions(parseInt(e.target.value))}
                className="bg-slate-700 text-white px-4 py-2 rounded text-center text-xl font-bold mb-2 w-32"
              >
                <option value="1">None (1)</option>
                <option value="2">Eighths (2)</option>
                <option value="3">Triplets (3)</option>
                <option value="4">Sixteenths (4)</option>
              </select>
              <span className="text-xs text-gray-500">per beat</span>
            </div>

            <div className="flex flex-col items-center">
              <label className="text-sm text-gray-400 mb-2 flex items-center gap-2">
                <Volume2 size={16} /> Master Volume
              </label>
              <div className="text-xl font-bold mb-2">{Math.round(masterVolume * 100)}%</div>
              <input
                type="range"
                value={masterVolume}
                onChange={(e) => setMasterVolume(clampMasterVolume(parseFloat(e.target.value)))}
                min="0"
                max={MAX_MASTER_VOLUME}
                step="0.01"
                className="w-full max-w-xs"
              />
            </div>
          </div>

          <div className="flex justify-center gap-1 flex-wrap mb-4">
            {beatPatterns.map((pattern, index) => (
              <div
                key={index}
                className={`${pattern.isMainBeat ? 'w-16 h-16' : 'w-12 h-12'} ${visualShape === 'circle' ? 'rounded-full' : 'rounded-lg'} flex items-center justify-center font-bold ${pattern.isMainBeat ? 'text-xl' : 'text-sm'} transition-all ${
                  pattern.color
                } ${currentBeat === index && isPlaying ? 'scale-125 ring-4 ring-white' : 'scale-100'}`}
              >
                {pattern.beat}
              </div>
            ))}
          </div>

          <div className="flex justify-center mb-4">
            <div className={`w-32 h-32 ${visualShape === 'circle' ? 'rounded-full' : 'rounded-lg'} transition-all duration-100 shadow-2xl ${
              isPlaying && visualPulse ? 'bg-blue-400 scale-110 shadow-blue-500/50' : isPlaying ? 'bg-blue-500 scale-100' : 'bg-blue-900 scale-75 opacity-50'
            }`}></div>
          </div>

          <div className="flex justify-center gap-3 items-center mb-4">
            <label className="text-sm text-gray-400">Shape:</label>
            <button
              onClick={() => setVisualShape('circle')}
              className={`px-4 py-2 rounded transition-colors ${
                visualShape === 'circle' ? 'bg-blue-600' : 'bg-slate-700 hover:bg-slate-600'
              }`}
            >
              Circles
            </button>
            <button
              onClick={() => setVisualShape('square')}
              className={`px-4 py-2 rounded transition-colors ${
                visualShape === 'square' ? 'bg-blue-600' : 'bg-slate-700 hover:bg-slate-600'
              }`}
            >
              Squares
            </button>
          </div>

          <div className="flex justify-center gap-3 items-center">
            <label className="text-sm text-gray-400">Main Beats:</label>
            <input
              type="number"
              value={numMainBeats}
              onChange={(e) => updateMainBeats(clampMainBeats(parseInt(e.target.value) || 4))}
              className="bg-slate-700 text-white px-3 py-2 rounded w-16 text-center"
              min={MIN_MAIN_BEATS}
              max={MAX_MAIN_BEATS}
            />
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg p-6 shadow-xl">
          <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
            <h2 className="text-xl font-semibold">Beat Configuration</h2>
            <div className="flex gap-3 items-center flex-wrap">
              <div className="flex gap-2 items-center">
                <label className="text-sm text-gray-400">Preset:</label>
                <select
                  value={selectedPresetId}
                  onChange={(e) => loadPreset(e.target.value)}
                  className="bg-slate-700 text-white px-3 py-2 rounded"
                >
                  <option value="">No preset selected</option>
                  {presets.map((preset) => (
                    <option key={preset.id} value={preset.id}>
                      {preset.name}
                    </option>
                  ))}
                </select>
                {selectedPresetId && (
                  <button
                    onClick={() => deletePreset(selectedPresetId)}
                    aria-label="Delete selected preset"
                    className="bg-red-600 hover:bg-red-700 rounded p-2 transition-colors"
                    title="Delete preset"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
              <button
                onClick={() => setShowSaveDialog(true)}
                className="bg-purple-600 hover:bg-purple-700 rounded px-4 py-2 flex items-center gap-2 transition-colors"
              >
                <Save size={20} /> Save Preset
              </button>
            </div>
          </div>

          {showSaveDialog && (
            <div className="mb-4 bg-slate-700 rounded p-4 flex items-center gap-3 flex-wrap">
              <label className="text-sm text-gray-400">Preset Name:</label>
              <input
                type="text"
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && savePreset()}
                placeholder="Enter preset name..."
                className="bg-slate-600 text-white px-3 py-2 rounded flex-1 min-w-[200px]"
                autoFocus
              />
              <button
                onClick={savePreset}
                className="bg-green-600 hover:bg-green-700 rounded px-4 py-2 transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setShowSaveDialog(false);
                  setNewPresetName('');
                }}
                aria-label="Close save preset dialog"
                className="bg-gray-600 hover:bg-gray-700 rounded p-2 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          )}

          <div className="space-y-4">
            {beatPatterns.map((pattern, beatIndex) => (
              <div key={beatIndex} className={`bg-slate-700 rounded p-4 ${pattern.isMainBeat ? 'border-l-4 border-blue-500' : ''}`}>
                <div className="flex items-center gap-4 mb-3 flex-wrap">
                  <div className={`font-bold ${pattern.isMainBeat ? 'text-xl w-20' : 'text-lg w-16'}`}>
                    {pattern.isMainBeat ? `Beat ${pattern.beat}` : `${pattern.beat}`}
                  </div>
                  
                  <div className="flex-1 min-w-[150px]">
                    <label className="text-sm text-gray-400 block mb-1">Color</label>
                    <select
                      value={pattern.color}
                      onChange={(e) => updateBeatColor(beatIndex, e.target.value)}
                      className="bg-slate-600 text-white px-3 py-2 rounded w-full"
                    >
                      {colorOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={() => addSoundToBeat(beatIndex)}
                    className="bg-green-600 hover:bg-green-700 rounded px-3 py-2 flex items-center gap-2 transition-colors mt-5"
                  >
                    <Plus size={16} /> Add Sound
                  </button>
                </div>

                <div className="space-y-2 ml-4 border-l-2 border-slate-600 pl-4">
                  {pattern.sounds.map((sound, soundIndex) => (
                    <div key={soundIndex} className="bg-slate-600 rounded p-3">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <div className="flex-1 min-w-[150px]">
                          <label className="text-xs text-gray-400 block mb-1">Sound {soundIndex + 1}</label>
                          <select
                            value={sound.type}
                            onChange={(e) =>
                              updateBeatSoundType(beatIndex, soundIndex, e.target.value as SoundType)
                            }
                            className="bg-slate-700 text-white px-3 py-2 rounded w-full"
                          >
                            {soundOptions.map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </div>

                        {pattern.sounds.length > 1 && (
                          <button
                            onClick={() => removeSoundFromBeat(beatIndex, soundIndex)}
                            aria-label={`Remove sound ${soundIndex + 1} from beat ${pattern.beat}`}
                            className="bg-red-600 hover:bg-red-700 rounded p-2 transition-colors mt-4"
                            title="Remove sound"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <Volume2 size={14} className="text-gray-400" />
                        <label className="text-xs text-gray-400 w-20">Vol: {Math.round(sound.volume * 100)}%</label>
                        <input
                          type="range"
                          value={sound.volume}
                          onChange={(e) => updateBeatSoundVolume(beatIndex, soundIndex, parseFloat(e.target.value))}
                          min="0"
                          max="1"
                          step="0.01"
                          className="flex-1"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-gray-400">
          Main beats shown larger. Subdivisions: 2 = eighth notes (&), 3 = triplets (& a), 4 = sixteenth notes (e & a)
        </div>
      </div>
    </div>
  );
};

export default InteractiveMetronome;
