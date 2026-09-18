import { describe, expect, it } from 'vitest';
import {
  canDeleteDemarchePcaet,
  getDemarchePcaetInitialStatus,
  getEtapeDemarchePcaet,
  isDemarchePcaetEnCours,
  isDepotAvisOuvrable,
} from './demarche-pcaet-state';

describe('statuts d’une démarche en cours', () => {
  it('en cours : jusqu’à l’instruction, un nouveau dépôt est bloqué', () => {
    expect(isDemarchePcaetEnCours('en_elaboration')).toBe(true);
    expect(isDemarchePcaetEnCours('transmis_pour_avis')).toBe(true);
    expect(isDemarchePcaetEnCours('instruit')).toBe(true);
    // Un dépôt hors plateforme occupe la place au même titre : il bloque la
    // création d'un second dossier et retient son plan d'actions.
    expect(isDemarchePcaetEnCours('instruit_hors_plateforme')).toBe(true);
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
    // Le circuit d'avis ne s'ouvre jamais pour un dépôt hors plateforme.
    expect(isDepotAvisOuvrable('instruit_hors_plateforme')).toBe(false);
    expect(isDepotAvisOuvrable('publie')).toBe(false);
    expect(isDepotAvisOuvrable('archive')).toBe(false);
  });
});

describe('étapes du parcours', () => {
  it('une étape par statut', () => {
    expect(getEtapeDemarchePcaet('en_elaboration')).toBe('elaboration');
    expect(getEtapeDemarchePcaet('transmis_pour_avis')).toBe('transmis');
    expect(getEtapeDemarchePcaet('instruit')).toBe('finalisation');
    // Les deux entrées de la finalisation mènent à la même étape affichée.
    expect(getEtapeDemarchePcaet('instruit_hors_plateforme')).toBe(
      'finalisation'
    );
    expect(getEtapeDemarchePcaet('publie')).toBe('publie');
    expect(getEtapeDemarchePcaet('archive')).toBe('archive');
  });
});

describe('statut de départ', () => {
  it('une démarche ordinaire démarre en élaboration', () => {
    expect(getDemarchePcaetInitialStatus({})).toBe('en_elaboration');
    expect(
      getDemarchePcaetInitialStatus({ transmittedOffPlatform: false })
    ).toBe('en_elaboration');
  });

  // L'élaboration et la transmission ont eu lieu ailleurs : il n'y a rien à y
  // rejouer, le dossier démarre à l'étape de finalisation.
  it('un dépôt hors plateforme démarre à la finalisation', () => {
    expect(
      getDemarchePcaetInitialStatus({ transmittedOffPlatform: true })
    ).toBe('instruit_hors_plateforme');
  });
});

describe('suppression d’une démarche', () => {
  it('un dossier en élaboration est supprimable', () => {
    expect(canDeleteDemarchePcaet({ status: 'en_elaboration' })).toBe(true);
  });

  // Aucune instance consultative n'a été saisie sur la plateforme, et aucune ne
  // le sera : supprimer ne défait rien aux yeux de personne. C'est aussi la
  // seule issue d'une case cochée par erreur, le choix étant figé.
  it('un dépôt hors plateforme l’est tant qu’il n’est pas publié', () => {
    expect(canDeleteDemarchePcaet({ status: 'instruit_hors_plateforme' })).toBe(
      true
    );
  });

  /**
   * Dès la transmission, le dossier est engagé dans le circuit d'avis : des
   * demandes le visent, et rien ne le ramène à l'élaboration.
   */
  it('aucun statut engagé dans le circuit d’avis ne l’est', () => {
    for (const status of [
      'transmis_pour_avis',
      'instruit',
      'publie',
      'archive',
    ] as const) {
      expect(canDeleteDemarchePcaet({ status })).toBe(false);
    }
  });
});
