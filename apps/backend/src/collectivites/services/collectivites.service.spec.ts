import { CollectivitePopulationTypeEnum } from '@tet/domain/collectivites';
import CollectivitesService from './collectivites.service';

/**
 * `getPopulationTags` est une fonction pure : elle ne touche pas la base, d'où
 * l'instanciation directe plutôt qu'un module de test.
 */
const service = new CollectivitesService(
  null as unknown as ConstructorParameters<typeof CollectivitesService>[0]
);

describe('CollectivitesService.getPopulationTags', () => {
  it('ne produit aucune tranche quand la population est inconnue', () => {
    expect(service.getPopulationTags(undefined)).toEqual([]);
  });

  describe('seuil des 45 000 habitants (plan local de chaleur et de froid)', () => {
    // Les bornes `plus_de_*` sont strictes : « plus de 45 000 » exclut 45 000.
    it.each([
      [44999, false],
      [45000, false],
      [45001, true],
      [684371, true],
    ])('%i habitants → plus_de_45000 = %s', (population, attendu) => {
      expect(
        service
          .getPopulationTags(population)
          .includes(CollectivitePopulationTypeEnum.PLUS_DE_45000)
      ).toBe(attendu);
    });
  });

  it('conserve les tranches existantes autour de la nouvelle borne', () => {
    // 46 000 habitants : au-dessus de 45 000 mais toujours sous les 50 000.
    const tags = service.getPopulationTags(46000);
    expect(tags).toContain(CollectivitePopulationTypeEnum.PLUS_DE_20000);
    expect(tags).toContain(CollectivitePopulationTypeEnum.PLUS_DE_45000);
    expect(tags).not.toContain(CollectivitePopulationTypeEnum.PLUS_DE_50000);
    expect(tags).toContain(CollectivitePopulationTypeEnum.MOINS_DE_50000);
  });
});
