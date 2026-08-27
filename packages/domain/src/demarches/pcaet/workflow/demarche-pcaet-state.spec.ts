import { describe, expect, it } from 'vitest';
import {
  canDeleteDemarchePcaet,
  getEtapeDemarchePcaet,
  isDemarchePcaetEnCours,
  isDepotAvisOuvrable,
} from './demarche-pcaet-state';

describe('statuts d’une démarche en cours', () => {
  it('en cours : jusqu’à l’instruction, un nouveau dépôt est bloqué', () => {
    expect(isDemarchePcaetEnCours('en_elaboration')).toBe(true);
    expect(isDemarchePcaetEnCours('transmis_pour_avis')).toBe(true);
    expect(isDemarchePcaetEnCours('instruit')).toBe(true);
    expect(isDemarchePcaetEnCours('publie')).toBe(false);
    expect(isDemarchePcaetEnCours('archive')).toBe(false);
  });
});

describe('ouverture du dépôt d’avis', () => {
  // La distinction porte tout le verrouillage côté instructeur : un dossier
  // instruit reste « en cours » pour la collectivité, mais son circuit d'avis
  // est clos.
  it('un dossier instruit n’accepte plus d’avis, bien qu’il soit en cours', () => {
    expect(isDepotAvisOuvrable('en_elaboration')).toBe(true);
    expect(isDepotAvisOuvrable('transmis_pour_avis')).toBe(true);
    expect(isDepotAvisOuvrable('instruit')).toBe(false);
    expect(isDepotAvisOuvrable('publie')).toBe(false);
    expect(isDepotAvisOuvrable('archive')).toBe(false);
  });
});

describe('étapes du parcours', () => {
  it('une étape par statut', () => {
    expect(getEtapeDemarchePcaet('en_elaboration')).toBe('elaboration');
    expect(getEtapeDemarchePcaet('transmis_pour_avis')).toBe('transmis');
    expect(getEtapeDemarchePcaet('instruit')).toBe('finalisation');
    expect(getEtapeDemarchePcaet('publie')).toBe('publie');
    expect(getEtapeDemarchePcaet('archive')).toBe('archive');
  });
});

describe('suppression d’une démarche', () => {
  it('un dossier en élaboration jamais transmis est supprimable', () => {
    expect(
      canDeleteDemarchePcaet({
        status: 'en_elaboration',
        transmittedAt: null,
      })
    ).toBe(true);
  });

  /**
   * Le cycle de vie ne ramène plus un dossier transmis à l'élaboration, mais
   * des dossiers y sont revenus du temps où il le permettait. La transmission
   * les a engagés dans le circuit d'avis : ils ne redeviennent pas supprimables
   * parce que la transition qui les y a menés a disparu.
   */
  it('un dossier revenu en élaboration après transmission ne l’est pas', () => {
    expect(
      canDeleteDemarchePcaet({
        status: 'en_elaboration',
        transmittedAt: '2026-08-01T10:00:00.000Z',
      })
    ).toBe(false);
  });

  it('aucun statut au-delà de l’élaboration ne l’est', () => {
    for (const status of ['transmis_pour_avis', 'instruit', 'publie', 'archive'] as const) {
      expect(
        canDeleteDemarchePcaet({ status, transmittedAt: null })
      ).toBe(false);
    }
  });
});
