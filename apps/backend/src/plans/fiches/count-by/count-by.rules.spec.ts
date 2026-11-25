import {
  FicheWithRelations,
  SANS_STATUT_LABEL,
  StatutEnum,
} from '@tet/domain/plans';
import { DateTime } from 'luxon';
import { getDataOrThrow } from '@tet/backend/utils/result.type';
import { CountByRules } from './count-by.rules';

describe('CountByRules', () => {
  const now = DateTime.fromISO('2030-01-15T12:00:00Z');
  const rules = new CountByRules(now);

  it('classe les dates par rapport à la date fournie et conserve les catégories sans échéance', () => {
    const fiches = [
      { dateFin: now.plus({ months: 3 }).toISO() },
      { dateFin: now.plus({ months: 3 }).minus({ seconds: 1 }).toISO() },
      { dateFin: null, ameliorationContinue: true },
      { dateFin: null, ameliorationContinue: false },
    ] as FicheWithRelations[];

    const { counts, invalidDates } = getDataOrThrow(
      rules.countByPropertyWithFiches(fiches, 'dateFin', {})
    );

    expect(counts).toMatchObject({
      total: 4,
      countByResult: {
        between_3_month_and_6_month: { count: 1 },
        inferior_to_3_month: { count: 1 },
        ameliorationContinue: { count: 1 },
        null: { count: 1 },
      },
    });
    expect(invalidDates).toEqual([]);
  });

  it('signale une date invalide sans interrompre le comptage des autres fiches', () => {
    const fiches = [
      { id: 1, collectiviteId: 10, dateDebut: 'date invalide' },
      { id: 2, collectiviteId: 10, dateDebut: now.toISO() },
    ] as FicheWithRelations[];

    const { counts, invalidDates } = getDataOrThrow(
      rules.countByPropertyWithFiches(fiches, 'dateDebut', {})
    );

    expect(counts).toMatchObject({
      total: 2,
      countByResult: { inferior_to_3_month: { count: 1 }, null: { count: 0 } },
    });
    expect(invalidDates).toEqual([
      {
        ficheId: 1,
        collectiviteId: 10,
        countByProperty: 'dateDebut',
        value: 'date invalide',
      },
    ]);
  });

  describe('countByPropertyForEachAxeWithFiches', () => {
    it('should return empty array when there are no fiches', () => {
      const planId = 1;
      const fiches: FicheWithRelations[] = [];
      const countByProperty = 'statut';
      const filters = {};

      const { counts: result } = getDataOrThrow(
        rules.countByPropertyForEachAxeWithFiches(
          planId,
          fiches,
          countByProperty,
          filters
        )
      );

      expect(result).toEqual([]);
    });

    it('should group fiches by axe and count by property', () => {
      const planId = 1;
      const fiches: FicheWithRelations[] = [
        {
          id: 1,
          statut: StatutEnum.REALISE,
          axes: [{ id: 10, nom: 'Axe 1', parentId: planId } as any],
        } as FicheWithRelations,
        {
          id: 2,
          statut: StatutEnum.EN_COURS,
          axes: [{ id: 10, nom: 'Axe 1', parentId: planId } as any],
        } as FicheWithRelations,
        {
          id: 3,
          statut: StatutEnum.REALISE,
          axes: [{ id: 20, nom: 'Axe 2', parentId: planId } as any],
        } as FicheWithRelations,
        {
          id: 4,
          statut: StatutEnum.REALISE,
          axes: [{ id: planId, nom: 'Plan', parentId: null } as any],
          // No axes - should go to "Actions sans axe"
        } as FicheWithRelations,
      ];
      const countByProperty = 'statut';
      const filters = {};

      const { counts: result } = getDataOrThrow(
        rules.countByPropertyForEachAxeWithFiches(
          planId,
          fiches,
          countByProperty,
          filters
        )
      );

      expect(result).toHaveLength(3);

      // Check Axe 1
      const axe1 = result.find((r) => r.id === 10);
      expect(axe1).toMatchObject({
        id: 10,
        nom: 'Axe 1',
        countByProperty: 'statut',
        total: 2,
        countByResult: {
          [StatutEnum.REALISE]: {
            count: 1,
            value: StatutEnum.REALISE,
            label: StatutEnum.REALISE,
          },
          [StatutEnum.EN_COURS]: {
            count: 1,
            value: StatutEnum.EN_COURS,
            label: StatutEnum.EN_COURS,
          },
          [StatutEnum.A_VENIR]: {
            count: 0,
            value: StatutEnum.A_VENIR,
            label: StatutEnum.A_VENIR,
          },
          [StatutEnum.EN_PAUSE]: {
            count: 0,
            value: StatutEnum.EN_PAUSE,
            label: StatutEnum.EN_PAUSE,
          },
          [StatutEnum.ABANDONNE]: {
            count: 0,
            value: StatutEnum.ABANDONNE,
            label: StatutEnum.ABANDONNE,
          },
          [StatutEnum.BLOQUE]: {
            count: 0,
            value: StatutEnum.BLOQUE,
            label: StatutEnum.BLOQUE,
          },
          [StatutEnum.EN_RETARD]: {
            count: 0,
            value: StatutEnum.EN_RETARD,
            label: StatutEnum.EN_RETARD,
          },
          [StatutEnum.A_DISCUTER]: {
            count: 0,
            value: StatutEnum.A_DISCUTER,
            label: StatutEnum.A_DISCUTER,
          },
          ['null']: {
            count: 0,
            value: null,
            label: SANS_STATUT_LABEL,
          },
        },
      });

      // Check Axe 2
      const axe2 = result.find((r) => r.id === 20);
      expect(axe2).toMatchObject({
        id: 20,
        nom: 'Axe 2',
        countByProperty: 'statut',
        total: 1,
        countByResult: {
          [StatutEnum.REALISE]: {
            count: 1,
            value: StatutEnum.REALISE,
            label: StatutEnum.REALISE,
          },
          [StatutEnum.EN_COURS]: {
            count: 0,
            value: StatutEnum.EN_COURS,
            label: StatutEnum.EN_COURS,
          },
          [StatutEnum.A_VENIR]: {
            count: 0,
            value: StatutEnum.A_VENIR,
            label: StatutEnum.A_VENIR,
          },
          [StatutEnum.EN_PAUSE]: {
            count: 0,
            value: StatutEnum.EN_PAUSE,
            label: StatutEnum.EN_PAUSE,
          },
          [StatutEnum.ABANDONNE]: {
            count: 0,
            value: StatutEnum.ABANDONNE,
            label: StatutEnum.ABANDONNE,
          },
          [StatutEnum.BLOQUE]: {
            count: 0,
            value: StatutEnum.BLOQUE,
            label: StatutEnum.BLOQUE,
          },
          [StatutEnum.EN_RETARD]: {
            count: 0,
            value: StatutEnum.EN_RETARD,
            label: StatutEnum.EN_RETARD,
          },
          [StatutEnum.A_DISCUTER]: {
            count: 0,
            value: StatutEnum.A_DISCUTER,
            label: StatutEnum.A_DISCUTER,
          },
          ['null']: {
            count: 0,
            value: null,
            label: SANS_STATUT_LABEL,
          },
        },
      });

      // Check "Actions sans axe"
      const noAxe = result.find((r) => r.id === -1);
      expect(noAxe).toMatchObject({
        id: -1,
        nom: 'Actions sans axe',
        countByProperty: 'statut',
        total: 1,
        countByResult: {
          [StatutEnum.REALISE]: {
            count: 1,
            value: StatutEnum.REALISE,
            label: StatutEnum.REALISE,
          },
          [StatutEnum.EN_COURS]: {
            count: 0,
            value: StatutEnum.EN_COURS,
            label: StatutEnum.EN_COURS,
          },
          [StatutEnum.A_VENIR]: {
            count: 0,
            value: StatutEnum.A_VENIR,
            label: StatutEnum.A_VENIR,
          },
          [StatutEnum.EN_PAUSE]: {
            count: 0,
            value: StatutEnum.EN_PAUSE,
            label: StatutEnum.EN_PAUSE,
          },
          [StatutEnum.ABANDONNE]: {
            count: 0,
            value: StatutEnum.ABANDONNE,
            label: StatutEnum.ABANDONNE,
          },
          [StatutEnum.BLOQUE]: {
            count: 0,
            value: StatutEnum.BLOQUE,
            label: StatutEnum.BLOQUE,
          },
          [StatutEnum.EN_RETARD]: {
            count: 0,
            value: StatutEnum.EN_RETARD,
            label: StatutEnum.EN_RETARD,
          },
          [StatutEnum.A_DISCUTER]: {
            count: 0,
            value: StatutEnum.A_DISCUTER,
            label: StatutEnum.A_DISCUTER,
          },
          ['null']: {
            count: 0,
            value: null,
            label: SANS_STATUT_LABEL,
          },
        },
      });
    });
  });
});
