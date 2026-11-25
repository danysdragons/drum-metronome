import { fireEvent, render, screen, within } from '@testing-library/react';
import { expect, it } from 'vitest';
import InteractiveMetronome from './InteractiveMetronome';

it('preserves each numbered beat configuration when subdivisions change', () => {
  render(<InteractiveMetronome />);

  const beat = (number: number) =>
    within(screen.getByText(`Beat ${number}`).parentElement!.parentElement!);
  const subdivisions = screen.getByRole('combobox', { name: 'Subdivisions' });
  const [color, sound] = beat(1).getAllByRole('combobox');
  const [accent, volume] = beat(1).getAllByRole('slider');

  fireEvent.change(color, { target: { value: 'purple' } });
  fireEvent.change(sound, { target: { value: 'cowbell' } });
  fireEvent.change(accent, { target: { value: '1.5' } });
  fireEvent.change(volume, { target: { value: '0.4' } });

  for (const count of [4, 1, 3]) {
    fireEvent.change(subdivisions, { target: { value: String(count) } });

    expect(screen.getByText(`${4 * count} steps • 0 presets • detailed editor`)).toBeInTheDocument();
    expect(beat(1).getAllByRole('combobox').map((input) => (input as HTMLSelectElement).value))
      .toEqual(['purple', 'cowbell', 'hihat']);
    expect(beat(1).getByText('Accent 150%')).toBeInTheDocument();
    expect(beat(1).getByText('Vol: 40%')).toBeInTheDocument();
    expect(beat(3).getByDisplayValue('Snare (SD)')).toBeInTheDocument();
  }
});
