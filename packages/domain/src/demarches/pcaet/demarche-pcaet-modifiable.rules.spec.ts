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
    expect(isDemarchePcaetAmontModifiable('instruit')).toBe(false);
    expect(isDemarchePcaetAmontModifiable('publie')).toBe(false);
  });

  it('l’aval s’ouvre à la clôture de l’instruction et ne se referme plus', () => {
    expect(isDemarchePcaetAvalModifiable('en_elaboration')).toBe(false);
    expect(isDemarchePcaetAvalModifiable('transmis_pour_avis')).toBe(false);
    // Avant la publication : c'est le dépôt de la délibération d'adoption qui
    // rend le dossier publiable, il faut donc pouvoir la verser ici.
    expect(isDemarchePcaetAvalModifiable('instruit')).toBe(true);
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
    expect(isDemarchePcaetEtapeModifiable('instruit', 'aval')).toBe(true);
  });
});
