import {
  ActionStatutCreate,
  StatutAvancementEnum,
} from '@tet/domain/referentiels';
import { cloneDeep } from 'es-toolkit';
import { deeperReferentielScoring } from '../models/samples/deeper-referentiel-scoring.sample';
import { simpleReferentielScoring } from '../models/samples/simple-referentiel-scoring.sample';
import { getActionStatusCreateForAction } from './referentiel-action-statut.test-fixture';

describe('getActionStatusCreateForAction', () => {
  describe('with simple referentiel', () => {
    it('should return statuses for non-renseigné sous-actions', () => {
      const result = getActionStatusCreateForAction(
        simpleReferentielScoring,
        StatutAvancementEnum.FAIT
      );

      // eci_1.1 is renseigné with the same statut, so it should not be included
      // eci_1.2 is not renseigné (aStatut: false), so it should be included
      // eci_2.0 is not renseigné (aStatut: false), so it should be included
      // eci_2.1 is not renseigné (aStatut: false), so it should be included
      // eci_2.2 is not renseigné (aStatut: false), so it should be included

      expect(result).toHaveLength(4);
      expect(result).toEqual(
        expect.arrayContaining([
          {
            actionId: 'eci_1.2',
            avancement: 'fait',
            concerne: true,
          },
          {
            actionId: 'eci_2.0',
            avancement: 'fait',
            concerne: true,
          },
          {
            actionId: 'eci_2.1',
            avancement: 'fait',
            concerne: true,
          },
          {
            actionId: 'eci_2.2',
            avancement: 'fait',
            concerne: true,
          },
        ])
      );
    });

    it('should not return statuses for non-concerné actions', () => {
      // Create a modified version where eci_1.2 is non-concerné
      const simpleReferentielScoringCloned = cloneDeep(
        simpleReferentielScoring
      );
      simpleReferentielScoringCloned.actionsEnfant[0].actionsEnfant[1].score.concerne =
        false;

      const result = getActionStatusCreateForAction(
        simpleReferentielScoringCloned,
        StatutAvancementEnum.PAS_FAIT
      );

      // eci_1.2 is non-concerné, so it should not be in the result
      expect(
        result.find(
          (r: Omit<ActionStatutCreate, 'collectiviteId'>) =>
            r.actionId === 'eci_1.2'
        )
      ).toBeUndefined();
      // But other non-renseigné actions should still be included
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('with deeper referentiel', () => {
    it('should return statuses for non-renseigné taches', () => {
      const result = getActionStatusCreateForAction(
        deeperReferentielScoring,
        StatutAvancementEnum.PAS_FAIT
      );

      // eci_1.1 is non-concerné (concerne: false), so it should NOT be included
      // eci_1.2 is not renseigné (aStatut: false), so it should be included
      // eci_2.1 is renseigné (aStatut: true), so it should NOT be included and its children should not be included
      // eci_2.2.1 is not renseigné (aStatut: false), so it should be included
      // eci_2.2.2 is renseigné (aStatut: true, same statut), so it should NOT be included
      // eci_2.2.3 is not renseigné (aStatut: false), so it should be included

      expect(result.length).toBeGreaterThan(0);
      expect(result).toEqual(
        expect.arrayContaining([
          {
            actionId: 'eci_1.2',
            avancement: 'pas_fait',
            concerne: true,
          },
          {
            actionId: 'eci_2.0',
            avancement: 'pas_fait',
            concerne: true,
          },
          {
            actionId: 'eci_2.2.1',
            avancement: 'pas_fait',
            concerne: true,
          },
          {
            actionId: 'eci_2.2.3',
            avancement: 'pas_fait',
            concerne: true,
          },
        ])
      );
    });

    it('should not return statuses for renseigné with the same statut', () => {
      const result = getActionStatusCreateForAction(
        deeperReferentielScoring,
        StatutAvancementEnum.FAIT
      );

      // eci_2.1 has the same statut, so it should not be in the result
      expect(
        result.find(
          (r: Omit<ActionStatutCreate, 'collectiviteId'>) =>
            r.actionId === 'eci_2.1'
        )
      ).toBeUndefined();
    });

    it('should not return statuses for non-concerné actions', () => {
      const result = getActionStatusCreateForAction(
        deeperReferentielScoring,
        StatutAvancementEnum.PAS_FAIT
      );

      // eci_1.1 is non-concerné (concerne: false), so it should not be in the result
      expect(
        result.find(
          (r: Omit<ActionStatutCreate, 'collectiviteId'>) =>
            r.actionId === 'eci_1.1'
        )
      ).toBeUndefined();
    });
  });
});
