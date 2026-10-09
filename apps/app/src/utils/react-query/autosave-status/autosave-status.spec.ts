import { describe, expect, it } from 'vitest';
import {
  AutosaveEvent,
  initialAutosaveState,
  reduceAutosaveState,
  toAutosaveStatus,
} from './autosave-status';

const statusAfter = (events: AutosaveEvent[]) =>
  toAutosaveStatus(events.reduce(reduceAutosaveState, initialAutosaveState));

describe('useAutosaveStatus — réduction des événements', () => {
  it('reste au repos tant que rien n’a été écrit', () => {
    expect(statusAfter([])).toBe('idle');
  });

  it('confirme l’enregistrement une fois l’écriture aboutie', () => {
    expect(
      statusAfter([
        { mutationId: 1, status: 'pending' },
        { mutationId: 1, status: 'success' },
      ])
    ).toBe('saved');
  });

  it('reste en cours tant qu’une écriture est en vol', () => {
    expect(
      statusAfter([
        { mutationId: 1, status: 'pending' },
        { mutationId: 2, status: 'pending' },
        { mutationId: 2, status: 'success' },
      ])
    ).toBe('saving');
  });

  it('garde l’échec d’une écriture partie avant mais aboutie après une réussite', () => {
    expect(
      statusAfter([
        { mutationId: 1, status: 'pending' },
        { mutationId: 2, status: 'pending' },
        { mutationId: 2, status: 'success' },
        { mutationId: 1, status: 'error' },
      ])
    ).toBe('error');
  });

  it('efface l’échec dès qu’une écriture suivante aboutit', () => {
    expect(
      statusAfter([
        { mutationId: 1, status: 'pending' },
        { mutationId: 1, status: 'error' },
        { mutationId: 2, status: 'pending' },
        { mutationId: 2, status: 'success' },
      ])
    ).toBe('saved');
  });

  it('prend en compte une écriture partie avant le montage', () => {
    expect(statusAfter([{ mutationId: 1, status: 'success' }])).toBe('saved');
  });
});
