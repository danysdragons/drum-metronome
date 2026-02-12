import { describe, expect, it } from 'vitest';
import {
  buildUniquePresetName,
  clampSubdivisions,
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
});
