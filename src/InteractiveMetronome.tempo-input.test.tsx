import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import InteractiveMetronome from './InteractiveMetronome';

describe('InteractiveMetronome tempo input', () => {
  it('allows replacing the tempo value before committing it', () => {
    render(<InteractiveMetronome />);

    const input = screen.getByLabelText(/tempo \(bpm\)/i) as HTMLInputElement;

    expect(input.value).toBe('117');

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '' } });
    expect(input.value).toBe('');

    fireEvent.change(input, { target: { value: '240.5' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(input.value).toBe('240.5');
    expect(screen.getAllByText('241 BPM').length).toBeGreaterThan(0);
  });

  it('restores the last valid tempo when the draft is invalid', () => {
    render(<InteractiveMetronome />);

    const input = screen.getByLabelText(/tempo \(bpm\)/i) as HTMLInputElement;

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'abc' } });
    fireEvent.blur(input);

    expect(input.value).toBe('117');
  });

  it('supports arrow key tempo nudging while the field is focused', () => {
    render(<InteractiveMetronome />);

    const input = screen.getByLabelText(/tempo \(bpm\)/i) as HTMLInputElement;

    fireEvent.focus(input);
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    expect(input.value).toBe('118');

    fireEvent.keyDown(input, { key: 'ArrowDown', shiftKey: true });
    expect(input.value).toBe('113');
  });
});
