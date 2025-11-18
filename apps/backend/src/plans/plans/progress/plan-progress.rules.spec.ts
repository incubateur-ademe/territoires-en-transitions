import { Test } from '@nestjs/testing';
import { FicheWithRelations, StatutEnum } from '@tet/domain/plans';
import { PlanProgressRules } from './plan-progress.rules';

describe('PlanProgressRules', () => {
  let planProgressRules: PlanProgressRules;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [PlanProgressRules],
    }).compile();

    planProgressRules = moduleRef.get(PlanProgressRules);
  });

  describe('computeProgress', () => {
    it('should return 0 when there are no fiches', () => {
      const fiches: FicheWithRelations[] = [];
      const result = planProgressRules.computeProgress(fiches);
      expect(result).toBe(0);
    });

    it('should only count fiches (no sub-fiches) with REALISE status', () => {
      const fiches: FicheWithRelations[] = [
        { statut: StatutEnum.REALISE } as FicheWithRelations,
        { parentId: 1, statut: StatutEnum.REALISE } as FicheWithRelations,
        { statut: StatutEnum.EN_COURS } as FicheWithRelations,
        { statut: StatutEnum.EN_PAUSE } as FicheWithRelations,
        { statut: StatutEnum.ABANDONNE } as FicheWithRelations,
        { statut: StatutEnum.BLOQUE } as FicheWithRelations,
        { statut: StatutEnum.EN_RETARD } as FicheWithRelations,
        { statut: StatutEnum.A_DISCUTER } as FicheWithRelations,
        { statut: StatutEnum.A_VENIR } as FicheWithRelations,
      ];
      const result = planProgressRules.computeProgress(fiches);
      expect(result).toBe(12.5);
    });
  });
});
