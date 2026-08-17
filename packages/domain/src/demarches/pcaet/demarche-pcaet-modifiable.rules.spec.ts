import { describe, expect, it } from 'vitest';
import {
  isDemarchePcaetAmontModifiable,
  isDemarchePcaetAvalModifiable,
  isDemarchePcaetEtapeModifiable,
} from './demarche-pcaet-modifiable.rules';

describe('ce qui reste modifiable', () => {
  it('la transmission ferme le dossier d’élaboration', () => {
    expect(isDemarchePcaetAmontModifiable('en_elaboration')).toBe(true);
    expect(isDemarchePcaetAmontModifiable('transmis_pour_avis')).toBe(false);
    expect(isDemarchePcaetAmontModifiable('adopte')).toBe(false);
  });

  it('l’aval s’ouvre à l’adoption et ne se referme plus', () => {
    expect(isDemarchePcaetAvalModifiable('en_elaboration')).toBe(false);
    expect(isDemarchePcaetAvalModifiable('transmis_pour_avis')).toBe(false);
    expect(isDemarchePcaetAvalModifiable('adopte')).toBe(true);
    expect(isDemarchePcaetAvalModifiable('publie')).toBe(true);
    // L'archivage n'interdit pas d'y déposer les pièces attendues.
    expect(isDemarchePcaetAvalModifiable('archive')).toBe(true);
  });

  it('l’étape d’une pièce désigne le temps du dossier', () => {
    expect(isDemarchePcaetEtapeModifiable('en_elaboration', 'amont')).toBe(
      true
    );
    expect(isDemarchePcaetEtapeModifiable('en_elaboration', 'aval')).toBe(
      false
    );
    expect(isDemarchePcaetEtapeModifiable('adopte', 'aval')).toBe(true);
  });
});
