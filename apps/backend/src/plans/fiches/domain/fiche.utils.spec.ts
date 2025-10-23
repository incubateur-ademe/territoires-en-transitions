import { addDays, subDays } from 'date-fns';
import {
  Fiche,
  StatutEnum,
  statutsEnumValues,
} from '../shared/models/fiche-action.table';
import { isActionOnTime } from './fiche.utils';

const createMockFiche = (
  statut: Fiche['statut'],
  dateFin?: Date | null
): Partial<Fiche> => ({
  statut,
  dateFin: dateFin ? new Date(dateFin).toISOString() : null,
});

describe('isActionOnTime', () => {
  const allStatuses = statutsEnumValues;
  const endedStatuses: Fiche['statut'][] = [
    StatutEnum.REALISE,
    StatutEnum.ABANDONNE,
  ];
  const onGoingStatuses = allStatuses.filter((s) => !endedStatuses.includes(s));

  describe('when dateFin is not set', () => {
    it('returns true for all statuses', () => {
      allStatuses.forEach((statut) => {
        const fiche = createMockFiche(statut, null);
        expect(isActionOnTime(fiche as Fiche)).toBe(true);
      });
    });
  });

  describe('when dateFin is yesterday', () => {
    it('returns true for REALISE and ABANDONNE, false for others', () => {
      const yesterday = subDays(new Date(), 1);

      endedStatuses.forEach((statut) => {
        const fiche = createMockFiche(statut, yesterday);
        expect(isActionOnTime(fiche as Fiche)).toBe(true);
      });

      onGoingStatuses.forEach((statut) => {
        const fiche = createMockFiche(statut, yesterday);
        expect(isActionOnTime(fiche as Fiche)).toBe(false);
      });
    });
  });

  describe('when dateFin is tomorrow', () => {
    it('returns true for all statuses', () => {
      const tomorrow = addDays(new Date(), 1);

      allStatuses.forEach((statut) => {
        const fiche = createMockFiche(statut, tomorrow);
        expect(isActionOnTime(fiche as Fiche)).toBe(true);
      });
    });
  });
});
