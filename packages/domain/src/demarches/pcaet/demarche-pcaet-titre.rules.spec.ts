import { describe, expect, it } from 'vitest';
import {
  buildDemarchePcaetTitre,
  DEMARCHE_PCAET_DEFAULT_TITRE,
} from './demarche-pcaet.schema';

describe('titre proposé à la création', () => {
  it('prend l’année du lancement saisi, pas celle du jour', () => {
    expect(buildDemarchePcaetTitre('2018-06-15')).toBe(
      'PCAET réglementaire 2018'
    );
  });

  // Le piège : `new Date('2018-01-01')` vaut minuit UTC, donc 2017 à l'ouest de
  // Greenwich. Lire la date civile évite de perdre une année sur ce jour-là.
  it('tient le 1er janvier, quel que soit le fuseau', () => {
    expect(buildDemarchePcaetTitre('2018-01-01')).toBe(
      'PCAET réglementaire 2018'
    );
    expect(buildDemarchePcaetTitre('2018-12-31')).toBe(
      'PCAET réglementaire 2018'
    );
  });

  it('retombe sur le terme seul tant qu’aucune date n’est saisie', () => {
    expect(buildDemarchePcaetTitre('')).toBe(DEMARCHE_PCAET_DEFAULT_TITRE);
    expect(buildDemarchePcaetTitre(null)).toBe(DEMARCHE_PCAET_DEFAULT_TITRE);
    expect(buildDemarchePcaetTitre(undefined)).toBe(
      DEMARCHE_PCAET_DEFAULT_TITRE
    );
    expect(buildDemarchePcaetTitre('pas-une-date')).toBe(
      DEMARCHE_PCAET_DEFAULT_TITRE
    );
  });
});
