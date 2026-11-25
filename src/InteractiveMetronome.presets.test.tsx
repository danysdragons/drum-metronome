import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import InteractiveMetronome from './InteractiveMetronome';

const click = (name: string) => fireEvent.click(screen.getByRole('button', { name }));
const namePreset = (name: string) =>
  fireEvent.change(screen.getByRole('textbox', { name: 'Preset name' }), { target: { value: name } });
const presetPicker = () => screen.getByRole<HTMLSelectElement>('combobox', { name: 'Preset' });
const subdivisions = () => screen.getByRole('combobox', { name: 'Subdivisions' });
const setSubdivisions = (value: string) => fireEvent.change(subdivisions(), { target: { value } });
const selectPreset = (name: string) => {
  const option = Array.from(presetPicker().options).find((item) => item.text === name);
  expect(option).toBeDefined();
  fireEvent.change(presetPicker(), { target: { value: option!.value } });
};

const createInitialPreset = () => {
  click('Save New Preset…');
  namePreset('Rock');
  click('Create Preset');
};

it('updates the selected preset in place and can undo the update', () => {
  render(<InteractiveMetronome />);
  createInitialPreset();
  const presetId = presetPicker().value;

  click('Sunset');
  expect(screen.getByRole('button', { name: 'Update Preset' })).toBeDisabled();
  expect(screen.queryByText('Unsaved preset changes')).not.toBeInTheDocument();

  setSubdivisions('4');
  expect(screen.getByText('Unsaved preset changes')).toBeInTheDocument();
  click('Update “Rock”');
  expect(presetPicker()).toHaveValue(presetId);
  expect(presetPicker().options).toHaveLength(2);
  expect(screen.queryByText('Unsaved preset changes')).not.toBeInTheDocument();
  expect(screen.getByText('Updated “Rock”')).toBeInTheDocument();

  click('Undo preset update');
  expect(presetPicker()).toHaveValue(presetId);
  expect(subdivisions()).toHaveValue('4');
  expect(screen.getByText('Unsaved preset changes')).toBeInTheDocument();
});

it('suggests a distinct copy name and protects edits when switching presets', () => {
  render(<InteractiveMetronome />);
  createInitialPreset();
  setSubdivisions('4');
  click('Save as New…');
  expect(screen.getByRole('button', { name: 'Create Preset' })).toBeDisabled();
  click('Use “Rock (2)”');
  expect(screen.getByRole('textbox', { name: 'Preset name' })).toHaveValue('Rock (2)');
  click('Create Preset');

  setSubdivisions('3');
  selectPreset('Rock');
  click('Cancel');
  expect(subdivisions()).toHaveValue('3');

  selectPreset('Rock');
  click('Save and Switch');
  expect(subdivisions()).toHaveValue('2');
  selectPreset('Rock (2)');
  expect(subdivisions()).toHaveValue('3');

  setSubdivisions('1');
  selectPreset('Rock');
  click('Discard and Switch');
  selectPreset('Rock (2)');
  expect(subdivisions()).toHaveValue('3');
});

it('saves an unattached draft before switching and supports rename and confirmed deletion', () => {
  render(<InteractiveMetronome />);
  createInitialPreset();
  selectPreset('No preset selected');
  setSubdivisions('3');
  selectPreset('Rock');
  click('Save and Switch');
  namePreset('Triplets');
  click('Save and Switch');
  expect(subdivisions()).toHaveValue('2');

  selectPreset('Triplets');
  expect(subdivisions()).toHaveValue('3');
  fireEvent.click(screen.getByText('Preset options'));
  click('Rename…');
  namePreset('Practice');
  click('Rename Preset');
  expect(presetPicker().selectedOptions[0].text).toBe('Practice');

  fireEvent.click(screen.getByText('Preset options'));
  click('Delete…');
  expect(screen.getByText('Delete “Practice” from your presets?')).toBeInTheDocument();
  click('Delete Preset');
  expect(presetPicker()).toHaveValue('');
  expect(subdivisions()).toHaveValue('3');
  expect(screen.queryByRole('option', { name: 'Practice' })).not.toBeInTheDocument();
});
