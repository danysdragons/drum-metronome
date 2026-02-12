import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import InteractiveMetronome from './InteractiveMetronome';

describe('InteractiveMetronome accessibility', () => {
  it('renders a clearly named start control', () => {
    render(<InteractiveMetronome />);

    expect(screen.getByRole('button', { name: /start metronome/i })).toBeInTheDocument();
  });

  it('labels dynamically added remove-sound controls', () => {
    render(<InteractiveMetronome />);

    fireEvent.click(screen.getAllByRole('button', { name: /add sound/i })[0]);

    expect(screen.getAllByRole('button', { name: /remove sound 2 from beat 1/i }).length).toBe(1);
  });
});
