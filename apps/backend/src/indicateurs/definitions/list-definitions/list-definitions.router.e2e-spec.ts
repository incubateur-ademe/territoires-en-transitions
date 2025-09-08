import {
  createCategorieTag,
  createPersonneTag,
  createServiceTag,
} from '@/backend/collectivites/collectivites.test-fixture';
import {
  createFiche,
  createPlan,
} from '@/backend/plans/fiches/fiches.test-fixture';
import { createThematique } from '@/backend/shared/shared.test-fixture';
import { getAuthUser, getTestApp } from '@/backend/test';
import { DatabaseService } from '@/backend/utils';
import { INestApplication } from '@nestjs/common';
import { inferProcedureInput } from '@trpc/server';
import z from 'zod';
import { AuthenticatedUser } from '../../../users/models/auth.models';
import { AppRouter, TrpcRouter } from '../../../utils/trpc/trpc.router';
import { indicateurValeurTable } from '../../valeurs/indicateur-valeur.table';
import { createIndicateurPerso } from '../definitions.test-fixture';
import { indicateurCategorieTagTable } from '../indicateur-categorie-tag.table';
import { definitionListItemSchema } from './list-definitions.output';

type Input = inferProcedureInput<
  AppRouter['indicateurs']['definitions']['list']
>;

describe('ListDefinitionsRouter', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let yoloDodoUser: AuthenticatedUser;
  let database: DatabaseService;

  beforeAll(async () => {
    app = await getTestApp();
    router = app.get(TrpcRouter);
    database = app.get(DatabaseService);
    yoloDodoUser = await getAuthUser();
  });

  describe('structure et règles métier', () => {
    test(`vérifie la structure du résultat`, async () => {
      const caller = router.createCaller({ user: yoloDodoUser });

      const input: Input = {
        collectiviteId: 1,
      };

      const { data: result } = await caller.indicateurs.definitions.list(input);

      expect(result.length).toBeGreaterThan(0);

      const parsedResult = z.array(definitionListItemSchema).safeParse(result);

      expect(parsedResult.error).toBeUndefined();
      expect(parsedResult.success).toBeTruthy();
    });

    test('renvoie uniquement les parents par défaut', async () => {
      const caller = router.createCaller({ user: yoloDodoUser });

      const { data: result } = await caller.indicateurs.definitions.list({
        collectiviteId: 1,
      });

      expect(result.length).toBeGreaterThan(0);

      result.forEach((indicateur) => {
        expect(indicateur.parent).toBeNull();
      });
    });

    test("renvoie bien tous les parents d'un indicateur", async () => {
      const caller = router.createCaller({ user: yoloDodoUser });

      const { data: result } = await caller.indicateurs.definitions.list({
        collectiviteId: 1,
        filters: {
          identifiantsReferentiel: ['cae_1.ca'],
        },
      });

      const [indicateur] = result;

      expect(indicateur).toBeDefined();

      // Parents de l'indicateur `cae_1.ca` (définis en dur d'un point de vue métier)
      expect(indicateur.parent).toEqual({
        id: expect.any(Number),
        titre: expect.any(String),
        titreCourt: 'Résidentiel',
        identifiantReferentiel: 'cae_1.c',
        parent: expect.any(Object),
      });

      expect(indicateur.parent?.parent).toEqual({
        id: expect.any(Number),
        titre: 'Émissions de gaz à effet de serre',
        titreCourt: null,
        identifiantReferentiel: 'cae_1.a',
        parent: null,
      });
    });
  });

  describe('avec filtres', () => {
    test(`filtre par identifiantReferentiel`, async () => {
      const caller = router.createCaller({ user: yoloDodoUser });

      const input: Input = {
        collectiviteId: 1,
        filters: {
          identifiantsReferentiel: ['cae_13.a'],
        },
      };
      const { data: result } = await caller.indicateurs.definitions.list(input);

      expect(result.length).toBe(1);

      const toCheck1 = definitionListItemSchema.safeParse(result[0]);
      expect(toCheck1.success).toBeTruthy();

      const [indicateur] = result;

      expect(indicateur.identifiantReferentiel).toBe('cae_13.a');

      expect(indicateur.enfants?.length).toBeGreaterThan(2);
    });

    test('filtre par estRempli (user values)', async () => {
      const caller = router.createCaller({ user: yoloDodoUser });

      const indicateurId = await createIndicateurPerso({
        caller,
        indicateurData: {
          collectiviteId: 1,
          titre: 'Indicateur rempli utilisateur',
          valeurs: [
            {
              resultat: 10,
              dateValeur: new Date().toISOString().slice(0, 10),
            },
          ],
        },
      });

      const { data: remplis } = await caller.indicateurs.definitions.list({
        collectiviteId: 1,
        filters: { estRempli: true },
      });

      expect(remplis).toEqual(
        expect.arrayContaining([expect.objectContaining({ id: indicateurId })])
      );

      remplis.forEach((indicateur) => {
        expect(indicateur.estRempli).toBe(true);
      });

      const { data: nonRemplis } = await caller.indicateurs.definitions.list({
        collectiviteId: 1,
        filters: { estRempli: false },
      });

      expect(nonRemplis).not.toEqual(
        expect.arrayContaining([expect.objectContaining({ id: indicateurId })])
      );

      nonRemplis.forEach((indicateur) => {
        expect(indicateur.estRempli).toBe(false);
      });
    });

    test('filtre par indicateurIds', async () => {
      const caller = router.createCaller({ user: yoloDodoUser });

      const input = {
        collectiviteId: 1,
        filters: {
          indicateurIds: [1, 2, 3],
        },
      } satisfies Input;

      const { data: result } = await caller.indicateurs.definitions.list(input);

      expect(result.length).toEqual(input.filters.indicateurIds.length);

      result.forEach((indicateur) => {
        expect(input.filters.indicateurIds).toContain(indicateur.id);
      });
    });

    test('filtre par ficheIds', async () => {
      const caller = router.createCaller({ user: yoloDodoUser });

      const indicateurId1 = await createIndicateurPerso({
        caller,
        indicateurData: {
          collectiviteId: 1,
          titre: 'Indicateur 1 avec fiches',
          ficheId: 1,
        },
      });

      const indicateurId2 = await createIndicateurPerso({
        caller,
        indicateurData: {
          collectiviteId: 1,
          titre: 'Indicateur 2 avec fiches',
          ficheId: 2,
        },
      });

      const input = {
        collectiviteId: 1,
        filters: {
          ficheIds: [1, 2],
        },
      } satisfies Input;

      const { data } = await caller.indicateurs.definitions.list(input);

      expect(data.length).toBeGreaterThan(0);
      expect(data).toContainEqual(
        expect.objectContaining({ id: indicateurId1 })
      );
      expect(data).toContainEqual(
        expect.objectContaining({ id: indicateurId2 })
      );
    });

    test('filtre par thematiqueIds', async () => {
      const caller = router.createCaller({ user: yoloDodoUser });

      const thematique1 = await createThematique({
        database,
        thematiqueData: {
          nom: 'Thematique 1',
        },
      });

      const input: Input = {
        collectiviteId: 1,
        filters: {
          thematiqueIds: [thematique1.id],
        },
      };

      const { data } = await caller.indicateurs.definitions.list(input);

      expect(data.length).toEqual(0);

      const indicateurId = await createIndicateurPerso({
        caller,
        indicateurData: {
          collectiviteId: 1,
          titre: 'Indicateur 1 avec thematique',
          thematiques: [{ id: thematique1.id }],
        },
      });

      const { data: indicateurs } = await caller.indicateurs.definitions.list(
        input
      );

      expect(indicateurs.length).toEqual(1);

      expect(indicateurs[0].id).toEqual(indicateurId);
      expect(indicateurs[0].thematiques).toContainEqual(
        expect.objectContaining({ id: thematique1.id })
      );
    });

    test('filtre par utilisateurPiloteIds', async () => {
      const caller = router.createCaller({ user: yoloDodoUser });

      const indicateurId = await createIndicateurPerso({
        caller,
        indicateurData: {
          collectiviteId: 1,
          titre: 'Indicateur 1 avec utilisateur pilote',
          pilotes: [{ userId: yoloDodoUser.id }],
        },
      });

      const input: Input = {
        collectiviteId: 1,
        filters: {
          utilisateurPiloteIds: [yoloDodoUser.id],
        },
      };

      const { data: result } = await caller.indicateurs.definitions.list(input);

      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result).toContainEqual(
        expect.objectContaining({ id: indicateurId })
      );
    });

    test('filtre par personnePiloteIds', async () => {
      const caller = router.createCaller({ user: yoloDodoUser });

      const tag = await createPersonneTag({
        database,
        tagData: {
          collectiviteId: 1,
        },
      });

      const indicateurId = await createIndicateurPerso({
        caller,
        indicateurData: {
          collectiviteId: 1,
          pilotes: [{ tagId: tag.id }],
        },
      });

      const input: Input = {
        collectiviteId: 1,
        filters: {
          personnePiloteIds: [tag.id],
        },
      };

      const { data: result } = await caller.indicateurs.definitions.list(input);

      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result).toContainEqual(
        expect.objectContaining({ id: indicateurId })
      );
    });

    test('filtre par serviceIds', async () => {
      const caller = router.createCaller({ user: yoloDodoUser });

      const serviceTag = await createServiceTag({
        database,
        tagData: {
          collectiviteId: 1,
        },
      });

      const indicateurId = await createIndicateurPerso({
        caller,
        indicateurData: {
          collectiviteId: 1,
          titre: 'Indicateur avec service',
          services: [{ id: serviceTag.id }],
        },
      });

      const input: Input = {
        collectiviteId: 1,
        filters: {
          serviceIds: [serviceTag.id],
        },
      };

      const { data: result } = await caller.indicateurs.definitions.list(input);

      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result).toContainEqual(
        expect.objectContaining({ id: indicateurId })
      );
    });

    test('filtre par planIds', async () => {
      const caller = router.createCaller({ user: yoloDodoUser });

      const plan = await createPlan({
        caller,
        planData: {
          collectiviteId: 1,
          nom: 'Plan Test',
        },
      });

      const ficheInPlanId = await createFiche({
        caller,
        ficheInput: {
          collectiviteId: 1,
          titre: 'Fiche Test',
          planId: plan.id,
        },
      });

      const indicateurId = await createIndicateurPerso({
        caller,
        indicateurData: {
          collectiviteId: 1,
          titre: 'Indicateur avec plan',
          ficheId: ficheInPlanId,
        },
      });

      const input: Input = {
        collectiviteId: 1,
        filters: {
          planIds: [plan.id],
        },
      };

      const { data: result } = await caller.indicateurs.definitions.list(input);

      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result).toContainEqual(
        expect.objectContaining({ id: indicateurId })
      );
    });

    test('filtre par mesureId', async () => {
      const caller = router.createCaller({ user: yoloDodoUser });

      // Mesure spécifique possédant des indicateurs associés
      // (data métier en dur dans la BDD)
      const mesureId = 'cae_1.1.1';

      const input: Input = {
        collectiviteId: 1,
        filters: {
          mesureId,
        },
      };

      const { data: result } = await caller.indicateurs.definitions.list(input);

      expect(result.length).toBeGreaterThanOrEqual(1);

      // Verify that returned indicateurs have mesures array
      result.forEach((indicateur) => {
        expect(indicateur.mesures).toContainEqual(
          expect.objectContaining({ id: mesureId })
        );
      });

      const { data: resultEmpty } = await caller.indicateurs.definitions.list({
        collectiviteId: 1,
        filters: {
          // Mesure spécifique ne possédant pas d'indicateur associé
          mesureId: 'cae_1.1.2',
        },
      });

      expect(resultEmpty.length).toBe(0);
    });

    test('filtre par categorieNoms', async () => {
      const caller = router.createCaller({ user: yoloDodoUser });

      const categorieTag = await createCategorieTag({
        database,
        tagData: {
          collectiviteId: 1,
          nom: 'filtre par categorieNoms',
        },
      });

      const indicateurId = await createIndicateurPerso({
        caller,
        indicateurData: {
          collectiviteId: 1,
          titre: 'Indicateur avec categorie',
        },
      });

      // Link the category to the indicateur
      await database.db.insert(indicateurCategorieTagTable).values({
        indicateurId,
        categorieTagId: categorieTag.id,
      });

      const input: Input = {
        collectiviteId: 1,
        filters: {
          categorieNoms: [categorieTag.nom],
        },
      };

      const { data: result } = await caller.indicateurs.definitions.list(input);

      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result).toContainEqual(
        expect.objectContaining({ id: indicateurId })
      );

      result.forEach((indicateur) => {
        expect(indicateur.categories).toContainEqual(
          expect.objectContaining({ id: categorieTag.id })
        );
      });
    });

    test('filtre par participationScore', async () => {
      const caller = router.createCaller({ user: yoloDodoUser });

      const input: Input = {
        collectiviteId: 1,
        filters: {
          participationScore: true,
        },
      };

      const { data: result } = await caller.indicateurs.definitions.list(input);

      expect(result.length).toBeGreaterThan(0);

      result.forEach((indicateur) => {
        expect(indicateur.participationScore).toBe(true);
        expect(indicateur.mesures.length).toBeGreaterThan(0);
      });
    });

    test('filtre par estConfidentiel', async () => {
      const caller = router.createCaller({ user: yoloDodoUser });

      const indicateurId = await createIndicateurPerso({
        caller,
        indicateurData: {
          collectiviteId: 1,
          titre: 'Indicateur confidentiel',
          estConfidentiel: true,
        },
      });

      const input: Input = {
        collectiviteId: 1,
        filters: {
          estConfidentiel: true,
        },
      };

      const { data: result } = await caller.indicateurs.definitions.list(input);

      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result).toContainEqual(
        expect.objectContaining({ id: indicateurId })
      );

      result.forEach((indicateur) => {
        expect(indicateur.estConfidentiel).toBe(true);
      });

      const { data: resultSansConfidentiel } =
        await caller.indicateurs.definitions.list({
          collectiviteId: 1,
          filters: {
            estConfidentiel: false,
          },
        });

      expect(resultSansConfidentiel).not.toContainEqual(
        expect.objectContaining({ id: indicateurId })
      );

      resultSansConfidentiel.forEach((indicateur) => {
        expect(indicateur.estConfidentiel).toBe(false);
      });
    });

    test('filtre par estFavori', async () => {
      const caller = router.createCaller({ user: yoloDodoUser });

      const indicateurId = await createIndicateurPerso({
        caller,
        indicateurData: {
          collectiviteId: 1,
          titre: 'Indicateur favori',
          estFavori: true,
        },
      });

      const input: Input = {
        collectiviteId: 1,
        filters: {
          estFavori: true,
        },
      };

      const { data: result } = await caller.indicateurs.definitions.list(input);

      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result).toContainEqual(
        expect.objectContaining({ id: indicateurId })
      );

      result.forEach((indicateur) => {
        expect(indicateur.estFavori).toBe(true);
      });
    });

    // test('filtre par fichesNonClassees', async () => {
    //   const caller = router.createCaller({ user: yoloDodoUser });

    //   const ficheId = await createFiche({
    //     caller,
    //     ficheInput: {
    //       collectiviteId: 1,
    //       titre: 'Fiche non classées',
    //     },
    //   });

    //   const indicateurId = await createIndicateurPerso({
    //     caller,
    //     indicateurData: {
    //       collectiviteId: 1,
    //       ficheId: ficheId,
    //     },
    //   });

    //   const input: Input = {
    //     collectiviteId: 1,
    //     filters: {
    //       fichesNonClassees: true,
    //     },
    //   };

    //   const { data: result } = await caller.indicateurs.definitions.list(input);

    //   expect(result.length).toBeGreaterThanOrEqual(1);
    //   console.log(result);
    //   expect(result).toContainEqual(
    //     expect.objectContaining({ id: indicateurId })
    //   );

    //   result.forEach((indicateur) => {
    //     expect(indicateur.fiches.length).toBeGreaterThan(0);
    //     expect(indicateur.fiches).toContainEqual(
    //       expect.objectContaining({ id: ficheId })
    //     );
    //   });
    // });

    test('filtre par estPerso', async () => {
      const caller = router.createCaller({ user: yoloDodoUser });

      const indicateurId = await createIndicateurPerso({
        caller,
        indicateurData: {
          collectiviteId: 1,
          titre: 'Indicateur personnel',
        },
      });

      const uniquementPerso: Input = {
        collectiviteId: 1,
        filters: {
          estPerso: true,
        },
      };

      const { data: result } = await caller.indicateurs.definitions.list(
        uniquementPerso
      );

      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result).toContainEqual(
        expect.objectContaining({ id: indicateurId })
      );

      result.forEach((indicateur) => {
        expect(indicateur.estPerso).toBe(true);
        expect(indicateur.identifiantReferentiel).toBeNull();
      });

      const sansPerso: Input = {
        collectiviteId: 1,
        filters: {
          estPerso: false,
        },
      };

      const { data: resultSansPerso } =
        await caller.indicateurs.definitions.list(sansPerso);

      expect(resultSansPerso.length).toBeGreaterThanOrEqual(1);
      expect(resultSansPerso).not.toContainEqual(
        expect.objectContaining({ id: indicateurId })
      );

      resultSansPerso.forEach((indicateur) => {
        expect(indicateur.estPerso).toBe(false);
        expect(indicateur.identifiantReferentiel).not.toBeNull();
      });
    });

    test('filtre par hasOpenData', async () => {
      const caller = router.createCaller({ user: yoloDodoUser });

      const indicateurId = await createIndicateurPerso({
        caller,
        indicateurData: {
          collectiviteId: 1,
          titre: 'Indicateur sans open data',
        },
      });

      // On insert artificiellement une valeur avec un lien à une métadonnée
      // quand même l'indicateur est personnalisé
      await database.db.insert(indicateurValeurTable).values({
        indicateurId,
        collectiviteId: 1,
        dateValeur: new Date().toISOString().slice(0, 10),
        metadonneeId: 1,
      });

      const sansOpenData: Input = {
        collectiviteId: 1,
        filters: {
          hasOpenData: true,
        },
        queryOptions: {
          limit: 1000,
        },
      };

      const { data: result } = await caller.indicateurs.definitions.list(
        sansOpenData
      );

      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result).toContainEqual(
        expect.objectContaining({ id: indicateurId })
      );

      result.forEach((indicateur) => {
        expect(indicateur.hasOpenData).toBe(true);
      });
    });

    test('filtre par text (recherche textuelle)', async () => {
      const caller = router.createCaller({ user: yoloDodoUser });

      const searchText = 'unique-search-term';
      const indicateurId = await createIndicateurPerso({
        caller,
        indicateurData: {
          collectiviteId: 1,
          titre: `Indicateur avec ${searchText} dans le titre`,
        },
      });

      const input: Input = {
        collectiviteId: 1,
        filters: {
          text: searchText,
        },
      };

      const { data: result } = await caller.indicateurs.definitions.list(input);

      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result).toContainEqual(
        expect.objectContaining({ id: indicateurId })
      );

      // Verify that all returned indicateurs contain the search text
      result.forEach((indicateur) => {
        const toCheck = definitionListItemSchema.safeParse(indicateur);

        expect(toCheck.success).toBeTruthy();

        const hasTextInTitle = indicateur.titre
          .toLowerCase()
          .includes(searchText);
        const hasTextInDescription =
          indicateur.description?.toLowerCase().includes(searchText) || false;
        expect(hasTextInTitle || hasTextInDescription).toBeTruthy();
      });
    });

    test('filtre combiné - identifiantsReferentiel et estFavori', async () => {
      const caller = router.createCaller({ user: yoloDodoUser });

      const {
        data: [cae11a],
      } = await caller.indicateurs.definitions.list({
        collectiviteId: 1,
        filters: {
          identifiantsReferentiel: ['cae_11.a'],
        },
      });

      await caller.indicateurs.definitions.update({
        collectiviteId: 1,
        indicateurId: cae11a.id,
        indicateurFields: {
          estFavori: false,
        },
      });

      const input: Input = {
        collectiviteId: 1,
        filters: {
          identifiantsReferentiel: ['cae_11.a'],
          estFavori: false,
        },
      };

      const { data: result } = await caller.indicateurs.definitions.list(input);

      expect(result.length).toEqual(1);
      expect(result).toContainEqual(
        expect.objectContaining({ identifiantReferentiel: 'cae_11.a' })
      );

      await caller.indicateurs.definitions.update({
        collectiviteId: 1,
        indicateurId: result[0].id,
        indicateurFields: {
          estFavori: true,
        },
      });

      onTestFinished(async () => {
        await caller.indicateurs.definitions.update({
          collectiviteId: 1,
          indicateurId: result[0].id,
          indicateurFields: {
            estFavori: false,
          },
        });
      });

      const { data: resultEmpty } = await caller.indicateurs.definitions.list(
        input
      );

      expect(resultEmpty.length).toEqual(0);

      const { data: resultAvecFavori } =
        await caller.indicateurs.definitions.list({
          ...input,
          filters: {
            ...input.filters,
            estFavori: true,
          },
        });

      expect(resultAvecFavori.length).toEqual(1);
      expect(resultAvecFavori).toContainEqual(
        expect.objectContaining({ identifiantReferentiel: 'cae_11.a' })
      );
    });
  });

  describe('tri', () => {
    test('tri par complétude (estRempli desc)', async () => {
      const caller = router.createCaller({ user: yoloDodoUser });

      const indicateurIdRempli = await createIndicateurPerso({
        caller,
        indicateurData: {
          collectiviteId: 1,
          titre: 'A - rempli utilisateur',
          valeurs: [
            {
              resultat: 1,
              dateValeur: new Date().toISOString().slice(0, 10),
            },
          ],
        },
      });

      const indicateurIdVide = await createIndicateurPerso({
        caller,
        indicateurData: {
          collectiviteId: 1,
          titre: 'B - vide',
        },
      });

      const { data } = await caller.indicateurs.definitions.list({
        collectiviteId: 1,
        filters: { indicateurIds: [indicateurIdRempli, indicateurIdVide] },
        queryOptions: { sort: [{ field: 'estRempli', direction: 'desc' }] },
      });

      expect(data[0].id).toBe(indicateurIdRempli);
      expect(data[1].id).toBe(indicateurIdVide);
    });

    test('tri alphabétique par titre', async () => {
      const caller = router.createCaller({ user: yoloDodoUser });

      const aId = await createIndicateurPerso({
        caller,
        indicateurData: { collectiviteId: 1, titre: 'AAA' },
      });
      const zId = await createIndicateurPerso({
        caller,
        indicateurData: { collectiviteId: 1, titre: 'zzz' },
      });

      const { data: asc } = await caller.indicateurs.definitions.list({
        collectiviteId: 1,
        filters: { indicateurIds: [aId, zId] },
        queryOptions: { sort: [{ field: 'titre', direction: 'asc' }] },
      });
      expect(asc.map((i) => i.id)).toEqual([aId, zId]);

      const { data: descData } = await caller.indicateurs.definitions.list({
        collectiviteId: 1,
        filters: { indicateurIds: [aId, zId] },
        queryOptions: { sort: [{ field: 'titre', direction: 'desc' }] },
      });
      expect(descData.map((i) => i.id)).toEqual([zId, aId]);
    });
  });

  describe('Payload structure and linked entities tests', () => {
    test('vérifie la structure complète du résultat avec pagination', async () => {
      const caller = router.createCaller({ user: yoloDodoUser });

      const input: Input = {
        collectiviteId: 1,
        filters: {
          identifiantsReferentiel: ['cae_13.a'],
        },
        queryOptions: {
          page: 1,
          limit: 10,
        },
      };
      const { data: result } = await caller.indicateurs.definitions.list(input);

      // Le router retourne seulement le tableau de données, pas les métadonnées de pagination
      expect(Array.isArray(result)).toBeTruthy();

      // Vérifie que chaque élément respecte le schéma
      result.forEach((indicateur) => {
        const toCheck = definitionListItemSchema.safeParse(indicateur);
        expect(toCheck.success).toBeTruthy();
      });
    });

    test('pilotes associés à un indicateur doivent être filtrés par collectiviteId', async () => {
      const caller = router.createCaller({ user: yoloDodoUser });

      // Create person tags for two different collectivites
      const piloteCollectivite1 = await createPersonneTag({
        database,
        tagData: {
          collectiviteId: 1,
          nom: 'Pilote Collectivité 1',
        },
      });

      const piloteCollectivite2 = await createPersonneTag({
        database,
        tagData: {
          collectiviteId: 2,
          nom: 'Pilote Collectivité 2',
        },
      });

      // Get a referentiel indicateur that both collectivites can access
      const { data: indicateurs } = await caller.indicateurs.definitions.list({
        collectiviteId: 1,
        filters: {
          identifiantsReferentiel: ['cae_1.a'],
        },
      });

      const indicateurReferentiel = indicateurs[0];
      expect(indicateurReferentiel).toBeDefined();

      // Associate the referentiel indicateur with pilote from collectivite 1
      await caller.indicateurs.definitions.update({
        collectiviteId: 1,
        indicateurId: indicateurReferentiel.id,
        indicateurFields: {
          pilotes: [{ tagId: piloteCollectivite1.id }],
        },
      });

      // Associate the same referentiel indicateur with pilote from collectivite 2
      await caller.indicateurs.definitions.update({
        collectiviteId: 2,
        indicateurId: indicateurReferentiel.id,
        indicateurFields: {
          pilotes: [{ tagId: piloteCollectivite2.id }],
        },
      });

      // List indicateurs for collectivite 1
      const { data: resultCollectivite1 } =
        await caller.indicateurs.definitions.list({
          collectiviteId: 1,
          filters: {
            identifiantsReferentiel: ['cae_1.a'],
          },
        });

      const indicateur1 = resultCollectivite1.find(
        (i) => i.id === indicateurReferentiel.id
      );

      if (!indicateur1) {
        expect.fail('Indicateur 1 not found');
      }

      // Should only contain pilote from collectivite 1
      expect(indicateur1.pilotes).toHaveLength(1);
      expect(indicateur1.pilotes[0].tagId).toBe(piloteCollectivite1.id);
      expect(indicateur1.pilotes[0].nom).toBe(piloteCollectivite1.nom);

      // Should NOT contain pilote from collectivite 2
      expect(indicateur1.pilotes).not.toContainEqual(
        expect.objectContaining({ tagId: piloteCollectivite2.id })
      );

      // List indicateurs for collectivite 2
      const { data: resultCollectivite2 } =
        await caller.indicateurs.definitions.list({
          collectiviteId: 2,
          filters: {
            identifiantsReferentiel: ['cae_1.a'],
          },
        });

      const indicateur2 = resultCollectivite2.find(
        (i) => i.id === indicateurReferentiel.id
      );

      if (!indicateur2) {
        expect.fail('Indicateur 2 not found');
      }

      // Should only contain pilote from collectivite 2
      expect(indicateur2.pilotes).toHaveLength(1);
      expect(indicateur2.pilotes[0].tagId).toBe(piloteCollectivite2.id);
      expect(indicateur2.pilotes[0].nom).toBe(piloteCollectivite2.nom);

      // Should NOT contain pilote from collectivite 1
      expect(indicateur2.pilotes).not.toContainEqual(
        expect.objectContaining({ tagId: piloteCollectivite1.id })
      );
    });

    test('services associés à un indicateur doivent être filtrés par collectiviteId', async () => {
      const caller = router.createCaller({ user: yoloDodoUser });

      // Create service tags for two different collectivites
      const serviceCollectivite1 = await createServiceTag({
        database,
        tagData: {
          collectiviteId: 1,
          nom: 'Service Collectivité 1',
        },
      });

      const serviceCollectivite2 = await createServiceTag({
        database,
        tagData: {
          collectiviteId: 2,
          nom: 'Service Collectivité 2',
        },
      });

      // Get a referentiel indicateur that both collectivites can access
      const { data: indicateurs } = await caller.indicateurs.definitions.list({
        collectiviteId: 1,
        filters: {
          identifiantsReferentiel: ['cae_1.a'],
        },
      });

      const indicateurReferentiel = indicateurs[0];
      expect(indicateurReferentiel).toBeDefined();

      // Associate the referentiel indicateur with service from collectivite 1
      await caller.indicateurs.definitions.update({
        collectiviteId: 1,
        indicateurId: indicateurReferentiel.id,
        indicateurFields: {
          services: [{ id: serviceCollectivite1.id }],
        },
      });

      // Associate the same referentiel indicateur with service from collectivite 2
      await caller.indicateurs.definitions.update({
        collectiviteId: 2,
        indicateurId: indicateurReferentiel.id,
        indicateurFields: {
          services: [{ id: serviceCollectivite2.id }],
        },
      });

      // List indicateurs for collectivite 1
      const { data: resultCollectivite1 } =
        await caller.indicateurs.definitions.list({
          collectiviteId: 1,
          filters: {
            identifiantsReferentiel: ['cae_1.a'],
          },
        });

      const indicateur1 = resultCollectivite1.find(
        (i) => i.id === indicateurReferentiel.id
      );

      if (!indicateur1) {
        expect.fail('Indicateur 1 not found');
      }

      // Should only contain service from collectivite 1
      expect(indicateur1.services).toHaveLength(1);
      expect(indicateur1.services[0].id).toBe(serviceCollectivite1.id);
      expect(indicateur1.services[0].nom).toBe('Service Collectivité 1');

      // Should NOT contain service from collectivite 2
      expect(indicateur1.services).not.toContainEqual(
        expect.objectContaining({ id: serviceCollectivite2.id })
      );

      // List indicateurs for collectivite 2
      const { data: resultCollectivite2 } =
        await caller.indicateurs.definitions.list({
          collectiviteId: 2,
          filters: {
            identifiantsReferentiel: ['cae_1.a'],
          },
        });

      const indicateur2 = resultCollectivite2.find(
        (i) => i.id === indicateurReferentiel.id
      );
      if (!indicateur2) {
        expect.fail('Indicateur 2 not found');
      }

      // Should only contain service from collectivite 2
      expect(indicateur2.services).toHaveLength(1);
      expect(indicateur2.services[0].id).toBe(serviceCollectivite2.id);
      expect(indicateur2.services[0].nom).toBe('Service Collectivité 2');

      // Should NOT contain service from collectivite 1
      expect(indicateur2.services).not.toContainEqual(
        expect.objectContaining({ id: serviceCollectivite1.id })
      );
    });

    test('fiches associées à un indicateur doivent être filtrées par collectiviteId', async () => {
      const caller = router.createCaller({ user: yoloDodoUser });

      // Get a referentiel indicateur that both collectivites can access
      const { data: indicateurs } = await caller.indicateurs.definitions.list({
        collectiviteId: 1,
        filters: {
          identifiantsReferentiel: ['cae_1.a'],
        },
      });

      const indicateurReferentiel = indicateurs[0];
      expect(indicateurReferentiel).toBeDefined();

      // Create a fiche for collectivite 1 and associate it with the indicateur
      const ficheCollectivite1Id = await createFiche({
        caller,
        ficheInput: {
          collectiviteId: 1,
          titre: 'Fiche Collectivité 1',
        },
      });

      await caller.indicateurs.definitions.update({
        collectiviteId: 1,
        indicateurId: indicateurReferentiel.id,
        indicateurFields: {
          ficheIds: [ficheCollectivite1Id],
        },
      });

      // Create a fiche for collectivite 2 and associate it with the same indicateur
      const ficheCollectivite2Id = await createFiche({
        caller,
        ficheInput: {
          collectiviteId: 2,
          titre: 'Fiche Collectivité 2',
        },
      });

      await caller.indicateurs.definitions.update({
        collectiviteId: 2,
        indicateurId: indicateurReferentiel.id,
        indicateurFields: {
          ficheIds: [ficheCollectivite2Id],
        },
      });

      // List indicateurs for collectivite 1
      const { data: resultCollectivite1 } =
        await caller.indicateurs.definitions.list({
          collectiviteId: 1,
          filters: {
            identifiantsReferentiel: ['cae_1.a'],
          },
        });

      const indicateur1 = resultCollectivite1.find(
        (i) => i.id === indicateurReferentiel.id
      );

      if (!indicateur1) {
        expect.fail('Indicateur 1 not found');
      }

      // Should only contain fiche from collectivite 1
      expect(indicateur1.fiches).toHaveLength(1);
      expect(indicateur1.fiches[0].id).toBe(ficheCollectivite1Id);
      expect(indicateur1.fiches[0].titre).toBe('Fiche Collectivité 1');

      // Should NOT contain fiche from collectivite 2
      expect(indicateur1.fiches).not.toContainEqual(
        expect.objectContaining({ id: ficheCollectivite2Id })
      );

      // List indicateurs for collectivite 2
      const { data: resultCollectivite2 } =
        await caller.indicateurs.definitions.list({
          collectiviteId: 2,
          filters: {
            identifiantsReferentiel: ['cae_1.a'],
          },
        });

      const indicateur2 = resultCollectivite2.find(
        (i) => i.id === indicateurReferentiel.id
      );

      if (!indicateur2) {
        expect.fail('Indicateur 2 not found');
      }

      // Should only contain fiche from collectivite 2
      expect(indicateur2.fiches).toHaveLength(1);
      expect(indicateur2.fiches[0].id).toBe(ficheCollectivite2Id);
      expect(indicateur2.fiches[0].titre).toBe('Fiche Collectivité 2');

      // Should NOT contain fiche from collectivite 1
      expect(indicateur2.fiches).not.toContainEqual(
        expect.objectContaining({ id: ficheCollectivite1Id })
      );
    });
  });

  describe('Edge cases and error handling', () => {
    test('gère les filtres avec des valeurs vides', async () => {
      const caller = router.createCaller({ user: yoloDodoUser });

      const input: Input = {
        collectiviteId: 1,
        filters: {
          indicateurIds: [],
          thematiqueIds: [],
          serviceIds: [],
          text: '',
        },
      };
      const { data: result } = await caller.indicateurs.definitions.list(input);

      expect(result.length).toBeGreaterThan(0);
    });

    test('gère la pagination', async () => {
      const caller = router.createCaller({ user: yoloDodoUser });

      const { data: result } = await caller.indicateurs.definitions.list({
        collectiviteId: 1,
        queryOptions: {
          page: 1,
          limit: 1,
        },
      });
      expect(result.length).toBe(1);

      const { data: result2 } = await caller.indicateurs.definitions.list({
        collectiviteId: 1,
        queryOptions: {
          page: 2,
          limit: 1,
        },
      });
      expect(result2.length).toBe(1);
      expect(result2[0].id).not.toBe(result[0].id);
    });

    test('gère la recherche textuelle avec des caractères spéciaux', async () => {
      const caller = router.createCaller({ user: yoloDodoUser });

      const input: Input = {
        collectiviteId: 1,
        filters: {
          text: 'émissions co₂',
        },
      };
      const { data: result } = await caller.indicateurs.definitions.list(input);

      result.forEach((indicateur) => {
        const toCheck = definitionListItemSchema.safeParse(indicateur);
        expect(toCheck.success).toBeTruthy();
      });
    });

    test('gère les filtres multiples avec des valeurs contradictoires', async () => {
      const caller = router.createCaller({ user: yoloDodoUser });

      const input: Input = {
        collectiviteId: 1,
        filters: {
          // Contradiction : cae_13.a est référentiel, donc estPerso devrait être false
          identifiantsReferentiel: ['cae_13.a'],
          estPerso: true,
        },
      };

      const { data: result } = await caller.indicateurs.definitions.list(input);

      expect(result.length).toBe(0);
    });

    test('gère les filtres avec des IDs inexistants', async () => {
      const caller = router.createCaller({ user: yoloDodoUser });

      const input: Input = {
        collectiviteId: 1,
        filters: {
          indicateurIds: [99999, 99998, 99997],
        },
      };
      const { data: result } = await caller.indicateurs.definitions.list(input);

      expect(result.length).toBe(0);
    });
  });
});
