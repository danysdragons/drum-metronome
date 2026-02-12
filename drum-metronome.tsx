import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Plus, Trash2, Volume2, Save, X } from 'lucide-react';

const InteractiveMetronome = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(117);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [visualPulse, setVisualPulse] = useState(false);
  const [visualShape, setVisualShape] = useState('circle');
  const [masterVolume, setMasterVolume] = useState(0.7);
  const [subdivisionsPerBeat, setSubdivisionsPerBeat] = useState(2);
  const [numMainBeats, setNumMainBeats] = useState(4);
  
  const [beatPatterns, setBeatPatterns] = useState([
    { beat: '1', isMainBeat: true, sounds: [{ type: 'kick', volume: 1.0 }, { type: 'hihat', volume: 0.6 }], color: 'bg-blue-500' },
    { beat: '&', isMainBeat: false, sounds: [{ type: 'hihat', volume: 0.6 }], color: 'bg-blue-500' },
    { beat: '2', isMainBeat: true, sounds: [{ type: 'hihat', volume: 0.6 }], color: 'bg-blue-500' },
    { beat: '&', isMainBeat: false, sounds: [{ type: 'hihat', volume: 0.6 }], color: 'bg-blue-500' },
    { beat: '3', isMainBeat: true, sounds: [{ type: 'snare', volume: 0.9 }, { type: 'hihat', volume: 0.6 }], color: 'bg-blue-500' },
    { beat: '&', isMainBeat: false, sounds: [{ type: 'hihat', volume: 0.6 }], color: 'bg-blue-500' },
    { beat: '4', isMainBeat: true, sounds: [{ type: 'hihat', volume: 0.6 }], color: 'bg-blue-500' },
    { beat: '&', isMainBeat: false, sounds: [{ type: 'hihat', volume: 0.6 }], color: 'bg-blue-500' }
  ]);
  
  const [presets, setPresets] = useState([]);
  const [selectedPreset, setSelectedPreset] = useState('');
  const [newPresetName, setNewPresetName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  const audioContextRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  const playSound = (soundType, beatVolume) => {
    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    const finalVolume = masterVolume * beatVolume;

    switch (soundType) {
      case 'kick':
        oscillator.frequency.value = 60;
        gainNode.gain.setValueAtTime(0.6 * finalVolume, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01 * finalVolume, ctx.currentTime + 0.2);
        oscillator.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.05);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.2);
        break;
      case 'snare':
        oscillator.frequency.value = 200;
        oscillator.type = 'triangle';
        gainNode.gain.setValueAtTime(0.4 * finalVolume, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01 * finalVolume, ctx.currentTime + 0.08);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.08);
        break;
      case 'hihat':
        oscillator.frequency.value = 8000;
        oscillator.type = 'square';
        gainNode.gain.setValueAtTime(0.15 * finalVolume, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01 * finalVolume, ctx.currentTime + 0.03);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.03);
        break;
      case 'tom':
        oscillator.frequency.value = 120;
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.5 * finalVolume, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01 * finalVolume, ctx.currentTime + 0.15);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.15);
        break;
      case 'clap':
        oscillator.frequency.value = 1200;
        oscillator.type = 'square';
        gainNode.gain.setValueAtTime(0.35 * finalVolume, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01 * finalVolume, ctx.currentTime + 0.05);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.05);
        break;
      case 'click':
        oscillator.frequency.value = 1000;
        gainNode.gain.setValueAtTime(0.3 * finalVolume, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01 * finalVolume, ctx.currentTime + 0.05);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.05);
        break;
      case 'drum':
        oscillator.frequency.value = 80;
        gainNode.gain.setValueAtTime(0.5 * finalVolume, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01 * finalVolume, ctx.currentTime + 0.1);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.1);
        break;
      case 'chime':
        oscillator.frequency.value = 1500;
        gainNode.gain.setValueAtTime(0.2 * finalVolume, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01 * finalVolume, ctx.currentTime + 0.3);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.3);
        break;
      case 'wood':
        oscillator.frequency.value = 500;
        oscillator.type = 'square';
        gainNode.gain.setValueAtTime(0.3 * finalVolume, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01 * finalVolume, ctx.currentTime + 0.04);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.04);
        break;
      case 'cowbell':
        oscillator.frequency.value = 800;
        oscillator.type = 'square';
        gainNode.gain.setValueAtTime(0.4 * finalVolume, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01 * finalVolume, ctx.currentTime + 0.15);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.15);
        break;
      case 'bell':
        oscillator.frequency.value = 2000;
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.25 * finalVolume, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01 * finalVolume, ctx.currentTime + 0.4);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.4);
        break;
      case 'beep':
        oscillator.frequency.value = 440;
        oscillator.type = 'square';
        gainNode.gain.setValueAtTime(0.2 * finalVolume, ctx.currentTime);
        gainNode.gain.setValueAtTime(0.2 * finalVolume, ctx.currentTime + 0.08);
        gainNode.gain.exponentialRampToValueAtTime(0.01 * finalVolume, ctx.currentTime + 0.1);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.1);
        break;
    }
  };

  const generateBeatPattern = (mainBeats, subdivisions) => {
    const pattern = [];
    const subdivisionLabels = {
      1: [''],
      2: ['', '&'],
      3: ['', '&', 'a'],
      4: ['', 'e', '&', 'a']
    };
    
    for (let i = 1; i <= mainBeats; i++) {
      for (let j = 0; j < subdivisions; j++) {
        const isMain = j === 0;
        const label = isMain ? String(i) : subdivisionLabels[subdivisions][j];
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

  const updateSubdivisions = (newSubdivisions) => {
    setSubdivisionsPerBeat(newSubdivisions);
    setBeatPatterns(generateBeatPattern(numMainBeats, newSubdivisions));
  };

  const updateMainBeats = (newMainBeats) => {
    setNumMainBeats(newMainBeats);
    setBeatPatterns(generateBeatPattern(newMainBeats, subdivisionsPerBeat));
  };

  useEffect(() => {
    if (isPlaying) {
      const interval = 60000 / bpm / subdivisionsPerBeat;
      let beatIndex = 0;

      intervalRef.current = setInterval(() => {
        setCurrentBeat(beatIndex);
        setVisualPulse(true);
        setTimeout(() => setVisualPulse(false), 50);
        beatPatterns[beatIndex].sounds.forEach(sound => {
          playSound(sound.type, sound.volume);
        });
        beatIndex = (beatIndex + 1) % beatPatterns.length;
      }, interval);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        setCurrentBeat(0);
      }
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, bpm, beatPatterns, masterVolume, subdivisionsPerBeat]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const addSoundToBeat = (beatIndex) => {
    const newPatterns = [...beatPatterns];
    newPatterns[beatIndex].sounds.push({ type: 'click', volume: 0.7 });
    setBeatPatterns(newPatterns);
  };

  const removeSoundFromBeat = (beatIndex, soundIndex) => {
    const newPatterns = [...beatPatterns];
    if (newPatterns[beatIndex].sounds.length > 1) {
      newPatterns[beatIndex].sounds.splice(soundIndex, 1);
      setBeatPatterns(newPatterns);
    }
  };

  const updateBeatSoundType = (beatIndex, soundIndex, newType) => {
    const newPatterns = [...beatPatterns];
    newPatterns[beatIndex].sounds[soundIndex].type = newType;
    setBeatPatterns(newPatterns);
  };

  const updateBeatSoundVolume = (beatIndex, soundIndex, newVolume) => {
    const newPatterns = [...beatPatterns];
    newPatterns[beatIndex].sounds[soundIndex].volume = newVolume;
    setBeatPatterns(newPatterns);
  };

  const updateBeatColor = (index, color) => {
    const newPatterns = [...beatPatterns];
    newPatterns[index].color = color;
    setBeatPatterns(newPatterns);
  };

  const savePreset = () => {
    if (newPresetName.trim()) {
      const preset = {
        name: newPresetName.trim(),
        beatPatterns: JSON.parse(JSON.stringify(beatPatterns)),
        subdivisionsPerBeat,
        numMainBeats
      };
      setPresets([...presets, preset]);
      setNewPresetName('');
      setShowSaveDialog(false);
      setSelectedPreset(preset.name);
    }
  };

  const loadPreset = (presetName) => {
    if (presetName === '') {
      setSelectedPreset('');
      return;
    }
    const preset = presets.find(p => p.name === presetName);
    if (preset) {
      setBeatPatterns(JSON.parse(JSON.stringify(preset.beatPatterns)));
      setSubdivisionsPerBeat(preset.subdivisionsPerBeat);
      setNumMainBeats(preset.numMainBeats);
      setSelectedPreset(presetName);
    }
  };

  const deletePreset = (presetName) => {
    setPresets(presets.filter(p => p.name !== presetName));
    if (selectedPreset === presetName) {
      setSelectedPreset('');
    }
  };

  const soundOptions = [
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

  const colorOptions = [
    { value: 'bg-blue-500', label: 'Blue' },
    { value: 'bg-red-500', label: 'Red' },
    { value: 'bg-green-500', label: 'Green' },
    { value: 'bg-yellow-500', label: 'Yellow' },
    { value: 'bg-purple-500', label: 'Purple' },
    { value: 'bg-gray-400', label: 'Gray' },
    { value: 'bg-orange-500', label: 'Orange' },
    { value: 'bg-pink-500', label: 'Pink' }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8">Interactive Metronome</h1>
        
        <div className="bg-slate-800 rounded-lg p-6 shadow-xl mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="flex flex-col items-center justify-center">
              <button
                onClick={togglePlay}
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
                onChange={(e) => setBpm(Math.max(0.1, Math.min(300, parseFloat(e.target.value) || 120)))}
                className="bg-slate-700 text-white px-4 py-2 rounded w-24 text-center text-xl font-bold mb-2"
                min="0.1"
                max="300"
                step="0.1"
              />
              <input
                type="range"
                value={bpm}
                onChange={(e) => setBpm(parseFloat(e.target.value))}
                min="0.1"
                max="300"
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
                onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
                min="0"
                max="1"
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
              onChange={(e) => updateMainBeats(Math.max(1, Math.min(16, parseInt(e.target.value) || 4)))}
              className="bg-slate-700 text-white px-3 py-2 rounded w-16 text-center"
              min="1"
              max="16"
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
                  value={selectedPreset}
                  onChange={(e) => loadPreset(e.target.value)}
                  className="bg-slate-700 text-white px-3 py-2 rounded"
                >
                  <option value="">No preset selected</option>
                  {presets.map(preset => (
                    <option key={preset.name} value={preset.name}>{preset.name}</option>
                  ))}
                </select>
                {selectedPreset && (
                  <button
                    onClick={() => deletePreset(selectedPreset)}
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
                            onChange={(e) => updateBeatSoundType(beatIndex, soundIndex, e.target.value)}
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