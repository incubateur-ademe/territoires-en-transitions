import { addDays, subDays } from 'date-fns';
import { Fiche } from '../fiche.schema';
import { Statut, StatutEnum, statutEnumValues } from '../statut.enum.schema';
import { isFicheOnTime } from './fiche.rule';

const createMockFiche = (
  statut: Statut,
  dateFin?: Date | null
): Partial<Fiche> => ({
  statut,
  dateFin: dateFin ? new Date(dateFin).toISOString() : null,
});

describe('isFicheOnTime', () => {
  const allStatuses = statutEnumValues;
  const endedStatuses: Statut[] = [StatutEnum.REALISE, StatutEnum.ABANDONNE];
  const onGoingStatuses = allStatuses.filter((s) => !endedStatuses.includes(s));

  describe('when dateFin is not set', () => {
    it('returns true for all statuses', () => {
      allStatuses.forEach((statut: Statut) => {
        const fiche = createMockFiche(statut, null);
        expect(isFicheOnTime(fiche as Fiche)).toBe(true);
      });
    });
  });

  describe('when dateFin is yesterday', () => {
    it('returns true for REALISE and ABANDONNE, false for others', () => {
      const yesterday = subDays(new Date(), 1);

      endedStatuses.forEach((statut) => {
        const fiche = createMockFiche(statut, yesterday);
        expect(isFicheOnTime(fiche as Fiche)).toBe(true);
      });

      onGoingStatuses.forEach((statut) => {
        const fiche = createMockFiche(statut, yesterday);
        expect(isFicheOnTime(fiche as Fiche)).toBe(false);
      });
    });
  });

  describe('when dateFin is tomorrow', () => {
    it('returns true for all statuses', () => {
      const tomorrow = addDays(new Date(), 1);

      allStatuses.forEach((statut) => {
        const fiche = createMockFiche(statut, tomorrow);
        expect(isFicheOnTime(fiche as Fiche)).toBe(true);
      });
    });
  });
});
