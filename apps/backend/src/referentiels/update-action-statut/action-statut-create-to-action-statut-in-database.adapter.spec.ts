import { StatutAvancementEnum } from '@tet/domain/referentiels';
import { actionStatutCreateToActionStatutInDatabase } from './action-statut-create-to-action-statut-in-database.adapter';

describe('actionStatutCreateToActionStatutInDatabase', () => {
  it('maps NON_CONCERNE to non_renseigne with concerne false', () => {
    const result = actionStatutCreateToActionStatutInDatabase({
      statut: StatutAvancementEnum.NON_CONCERNE,
    });

    expect(result).toEqual({
      avancement: StatutAvancementEnum.NON_RENSEIGNE,
      avancementDetaille: null,
      concerne: false,
    });
  });

  it('maps DETAILLE_A_LA_TACHE to non_renseigne with concerne true', () => {
    const result = actionStatutCreateToActionStatutInDatabase({
      statut: StatutAvancementEnum.DETAILLE_A_LA_TACHE,
    });

    expect(result).toEqual({
      avancement: StatutAvancementEnum.NON_RENSEIGNE,
      avancementDetaille: null,
      concerne: true,
    });
  });

  it('keeps detaille value when DETAILLE_AU_POURCENTAGE does not collapse', () => {
    const result = actionStatutCreateToActionStatutInDatabase({
      statut: StatutAvancementEnum.DETAILLE_AU_POURCENTAGE,
      statutDetailleAuPourcentage: [0.2, 0.5, 0.3],
    });

    expect(result).toEqual({
      avancement: StatutAvancementEnum.DETAILLE_AU_POURCENTAGE,
      avancementDetaille: [0.2, 0.5, 0.3],
      concerne: true,
    });
  });

  it('collapses DETAILLE_AU_POURCENTAGE [1,0,0] to fait and drops detail', () => {
    const result = actionStatutCreateToActionStatutInDatabase({
      statut: StatutAvancementEnum.DETAILLE_AU_POURCENTAGE,
      statutDetailleAuPourcentage: [1, 0, 0],
    });

    expect(result).toEqual({
      avancement: StatutAvancementEnum.FAIT,
      avancementDetaille: null,
      concerne: true,
    });
  });

  it('collapses DETAILLE_AU_POURCENTAGE [0,1,0] to programme and drops detail', () => {
    const result = actionStatutCreateToActionStatutInDatabase({
      statut: StatutAvancementEnum.DETAILLE_AU_POURCENTAGE,
      statutDetailleAuPourcentage: [0, 1, 0],
    });

    expect(result).toEqual({
      avancement: StatutAvancementEnum.PROGRAMME,
      avancementDetaille: null,
      concerne: true,
    });
  });

  it('collapses DETAILLE_AU_POURCENTAGE [0,0,1] to pas_fait and drops detail', () => {
    const result = actionStatutCreateToActionStatutInDatabase({
      statut: StatutAvancementEnum.DETAILLE_AU_POURCENTAGE,
      statutDetailleAuPourcentage: [0, 0, 1],
    });

    expect(result).toEqual({
      avancement: StatutAvancementEnum.PAS_FAIT,
      avancementDetaille: null,
      concerne: true,
    });
  });

  it('resets detaille to default tuple when status changes to PAS_FAIT', () => {
    const result = actionStatutCreateToActionStatutInDatabase({
      statut: StatutAvancementEnum.PAS_FAIT,
      statutDetailleAuPourcentage: [0.9, 0.1, 0],
    });

    expect(result).toEqual({
      avancement: StatutAvancementEnum.PAS_FAIT,
      avancementDetaille: [0, 0, 1],
      concerne: true,
    });
  });
});
