import { describe, expect, it } from 'vitest';
import {
  buildUniquePresetName,
  clampSubdivisions,
  deserializePersistedMetronomeState,
  generateBeatPattern
} from './InteractiveMetronome';

describe('metronome helpers', () => {
  it('clamps subdivisions to supported range', () => {
    expect(clampSubdivisions(0)).toBe(1);
    expect(clampSubdivisions(2)).toBe(2);
    expect(clampSubdivisions(8)).toBe(4);
  });

  it('generates safe fallback labels for out-of-range subdivision input', () => {
    const pattern = generateBeatPattern(2, 99);

    expect(pattern).toHaveLength(8);
    expect(pattern.map((beat) => beat.beat)).toEqual(['1', 'e', '&', 'a', '2', 'e', '&', 'a']);
  });

  it('returns unique preset names with numeric suffixes', () => {
    const existingNames = ['Rock', 'Rock (2)', 'jazz'];

    expect(buildUniquePresetName('Rock', existingNames)).toBe('Rock (3)');
    expect(buildUniquePresetName('JAZZ', existingNames)).toBe('JAZZ (2)');
    expect(buildUniquePresetName('Funk', existingNames)).toBe('Funk');
  });

  it('returns null when persisted state JSON is invalid', () => {
    expect(deserializePersistedMetronomeState('{not valid json')).toBeNull();
  });

  it('deserializes persisted state while sanitizing invalid values', () => {
    const parsed = deserializePersistedMetronomeState(
      JSON.stringify({
        bpm: 1000,
        masterVolume: -2,
        visualShape: 'triangle',
        subdivisionsPerBeat: 8,
        numMainBeats: 0,
        beatPatterns: [
          {
            beat: '1',
            isMainBeat: true,
            sounds: [{ type: 'kick', volume: 1.2 }],
            color: 'bg-red-500'
          }
        ],
        presets: [
          {
            id: 'p1',
            name: 'Test',
            subdivisionsPerBeat: 4,
            numMainBeats: 3,
            beatPatterns: [
              {
                beat: '1',
                isMainBeat: true,
                sounds: [{ type: 'snare', volume: -0.5 }],
                color: 'bg-blue-500'
              }
            ]
          }
        ],
        selectedPresetId: 'does-not-exist'
      })
    );

    expect(parsed).not.toBeNull();
    expect(parsed?.bpm).toBe(300);
    expect(parsed?.masterVolume).toBe(0);
    expect(parsed?.visualShape).toBe('circle');
    expect(parsed?.subdivisionsPerBeat).toBe(4);
    expect(parsed?.numMainBeats).toBe(1);
    expect(parsed?.beatPatterns[0]?.sounds[0]?.volume).toBe(1);
    expect(parsed?.presets[0]?.beatPatterns[0]?.sounds[0]?.volume).toBe(0);
    expect(parsed?.selectedPresetId).toBe('');
  });

  it('returns null for unsupported persisted schema version', () => {
    const parsed = deserializePersistedMetronomeState(
      JSON.stringify({
        version: 999,
        bpm: 120
      })
    );

    expect(parsed).toBeNull();
  });
});
