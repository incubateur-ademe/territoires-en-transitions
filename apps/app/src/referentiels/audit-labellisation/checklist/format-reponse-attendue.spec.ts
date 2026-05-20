import { describe, expect, it } from 'vitest';
import { formatReponseAttendue } from './format-reponse-attendue';

describe('formatReponseAttendue', () => {
  it('renvoie « Avoir au moins une personne renseignée » quand la formulation commence par « Identifier »', () => {
    expect(
      formatReponseAttendue({
        formulation: 'Identifier une personne technique',
        minRealisePercentage: 100,
        minProgrammePercentage: null,
      })
    ).toBe('Avoir au moins une personne renseignée');
  });

  it('renvoie « Avoir le statut à Fait ou Programmé » quand la formulation commence par « Être en conformité »', () => {
    expect(
      formatReponseAttendue({
        formulation:
          'Être en conformité ou programmer la mise en conformité PCAET',
        minRealisePercentage: 100,
        minProgrammePercentage: null,
      })
    ).toBe('Avoir le statut à Fait ou Programmé');
  });

  it('renvoie « Avoir le statut à Fait » quand seul le statut Fait est exigé', () => {
    expect(
      formatReponseAttendue({
        formulation: 'Mettre en place une équipe projet',
        minRealisePercentage: 100,
        minProgrammePercentage: null,
      })
    ).toBe('Avoir le statut à Fait');
  });

  it('renvoie « Avoir le statut à Fait ou Programmé » quand le statut Programmé suffit aussi', () => {
    expect(
      formatReponseAttendue({
        formulation: 'Mettre en place une équipe projet',
        minRealisePercentage: 100,
        minProgrammePercentage: 100,
      })
    ).toBe('Avoir le statut à Fait ou Programmé');
  });

  it('renvoie un seuil en pourcentage minimal quand minRealise est < 100 sans programmé', () => {
    expect(
      formatReponseAttendue({
        formulation: 'Engager un diagnostic territorial',
        minRealisePercentage: 20,
        minProgrammePercentage: null,
      })
    ).toBe('20% fait minimum');
  });

  it('renvoie le seuil minRealise quand un seuil minProgramme partiel (non 100) est fourni', () => {
    expect(
      formatReponseAttendue({
        formulation: 'Autre mesure',
        minRealisePercentage: 50,
        minProgrammePercentage: 75,
      })
    ).toBe('50% fait minimum');
  });

  it('renvoie « Fait ou Programmé » dès que minProgramme = 100, même si minRealise < 100', () => {
    expect(
      formatReponseAttendue({
        formulation: 'Autre mesure',
        minRealisePercentage: 80,
        minProgrammePercentage: 100,
      })
    ).toBe('Avoir le statut à Fait ou Programmé');
  });
});
