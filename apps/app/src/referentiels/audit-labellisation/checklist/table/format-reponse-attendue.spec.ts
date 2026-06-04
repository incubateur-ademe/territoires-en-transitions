import { describe, expect, it } from 'vitest';
import { formatReponseAttendue } from './format-reponse-attendue';

describe('formatReponseAttendue', () => {
  it('renvoie « personne-renseignee » quand la formulation commence par « Identifier »', () => {
    expect(
      formatReponseAttendue({
        formulation: 'Identifier une personne technique',
        minRealisePercentage: 100,
        minProgrammePercentage: null,
      })
    ).toEqual({ kind: 'personne-renseignee' });
  });

  it('renvoie « statut-fait-ou-programme » quand la formulation commence par « Être en conformité »', () => {
    expect(
      formatReponseAttendue({
        formulation:
          'Être en conformité ou programmer la mise en conformité PCAET',
        minRealisePercentage: 100,
        minProgrammePercentage: null,
      })
    ).toEqual({ kind: 'statut-fait-ou-programme' });
  });

  it('renvoie « statut-fait » quand seul le statut Fait est exigé', () => {
    expect(
      formatReponseAttendue({
        formulation: 'Mettre en place une équipe projet',
        minRealisePercentage: 100,
        minProgrammePercentage: null,
      })
    ).toEqual({ kind: 'statut-fait' });
  });

  it('renvoie « statut-fait-ou-programme » quand le statut Programmé suffit aussi', () => {
    expect(
      formatReponseAttendue({
        formulation: 'Mettre en place une équipe projet',
        minRealisePercentage: 100,
        minProgrammePercentage: 100,
      })
    ).toEqual({ kind: 'statut-fait-ou-programme' });
  });

  it('renvoie « pourcentage-fait-minimum » quand minRealise est < 100 sans programmé', () => {
    expect(
      formatReponseAttendue({
        formulation: 'Engager un diagnostic territorial',
        minRealisePercentage: 20,
        minProgrammePercentage: null,
      })
    ).toEqual({ kind: 'pourcentage-fait-minimum', percent: 20 });
  });

  it('renvoie le seuil minRealise quand un seuil minProgramme partiel (non 100) est fourni', () => {
    expect(
      formatReponseAttendue({
        formulation: 'Autre mesure',
        minRealisePercentage: 50,
        minProgrammePercentage: 75,
      })
    ).toEqual({ kind: 'pourcentage-fait-minimum', percent: 50 });
  });

  it('renvoie « statut-fait-ou-programme » dès que minProgramme = 100, même si minRealise < 100', () => {
    expect(
      formatReponseAttendue({
        formulation: 'Autre mesure',
        minRealisePercentage: 80,
        minProgrammePercentage: 100,
      })
    ).toEqual({ kind: 'statut-fait-ou-programme' });
  });
});
