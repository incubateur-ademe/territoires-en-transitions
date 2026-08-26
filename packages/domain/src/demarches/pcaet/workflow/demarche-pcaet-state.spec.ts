import { describe, expect, it } from 'vitest';
import {
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
