import { Test } from '@nestjs/testing';
import { FicheWithRelations } from '@tet/domain/plans';
import { PptBuilderService } from './ppt-builder.service';

describe('PptBuilderService', () => {
  let pptBuilderService: PptBuilderService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [PptBuilderService],
    })
      .useMocker(() => ({}))
      .compile();

    pptBuilderService = moduleRef.get(PptBuilderService);
  });

  describe('sortFichesForReport', () => {
    const fiche = (
      overrides: Partial<FicheWithRelations>
    ): FicheWithRelations =>
      ({
        titre: null,
        parentId: null,
        createdAt: '2024-01-01T00:00:00.000Z',
        ...overrides,
      } as FicheWithRelations);

    it('trie les actions de premier niveau par titre, alphabétiquement', () => {
      const fiches = [
        fiche({ id: 1, titre: 'Action C' }),
        fiche({ id: 2, titre: 'Action A' }),
        fiche({ id: 3, titre: 'Action B' }),
      ];

      const result = (pptBuilderService as any).sortFichesForReport(fiches);

      expect(result.map((f: FicheWithRelations) => f.id)).toEqual([2, 3, 1]);
    });

    it("place chaque sous-action juste après sa fiche parente, triées par date de création (pas par titre)", () => {
      const fiches = [
        fiche({ id: 1, titre: 'Action A' }),
        fiche({ id: 2, titre: 'Action B' }),
        // Sous-actions de l'action B, volontairement pas dans l'ordre alphabétique ni d'insertion
        fiche({
          id: 21,
          titre: 'Z sous-action',
          parentId: 2,
          createdAt: '2024-01-02T00:00:00.000Z',
        }),
        fiche({
          id: 22,
          titre: 'A sous-action',
          parentId: 2,
          createdAt: '2024-01-01T00:00:00.000Z',
        }),
      ];

      const result = (pptBuilderService as any).sortFichesForReport(fiches);

      expect(result.map((f: FicheWithRelations) => f.id)).toEqual([
        1, 2, 22, 21,
      ]);
    });

    it('inclut les sous-actions orphelines (dont la fiche parente est absente de la liste)', () => {
      const fiches = [
        fiche({ id: 1, titre: 'Action A' }),
        fiche({ id: 99, titre: 'Sous-action orpheline', parentId: 999 }),
      ];

      const result = (pptBuilderService as any).sortFichesForReport(fiches);

      expect(result.map((f: FicheWithRelations) => f.id)).toEqual([1, 99]);
    });
  });
});
