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
import { AuthenticatedUser } from '../../../users/models/auth.models';
import { AppRouter, TrpcRouter } from '../../../utils/trpc/trpc.router';
import { createIndicateurPerso } from '../definitions.test-fixture';
import { indicateurCategorieTagTable } from '../indicateur-categorie-tag.table';
import { indicateurDefinitionDetailleeSchema } from './list-definitions.response';

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

  test(`list par identifiant referentiel`, async () => {
    const caller = router.createCaller({ user: yoloDodoUser });

    const input: Input = {
      collectiviteId: 1,
      filters: {
        identifiantsReferentiel: ['cae_13.a'],
      },
    };
    const { data: result } = await caller.indicateurs.definitions.list(input);

    expect(result.length).toBe(1);

    const toCheck1 = indicateurDefinitionDetailleeSchema.safeParse(result[0]);
    expect(toCheck1.success).toBeTruthy();

    const [indicateur] = result;

    expect(indicateur.identifiantReferentiel).toBe('cae_13.a');

    expect(indicateur.enfants?.length).toBeGreaterThan(2);

    expect(Array.isArray(indicateur.thematiques)).toBeTruthy();
    expect(Array.isArray(indicateur.pilotes)).toBeTruthy();
    expect(Array.isArray(indicateur.services)).toBeTruthy();
  });

  test('renvoie bien les parents de chaque indicateur', async () => {
    const caller = router.createCaller({ user: yoloDodoUser });

    const { data: result } = await caller.indicateurs.definitions.list({
      collectiviteId: 1,
      filters: {
        identifiantsReferentiel: ['cae_1.ca'],
      },
    });

    const [indicateur] = result;

    expect(indicateur.parents).toContainEqual([
      {
        id: expect.any(Number),
        titre: expect.any(String),
        titreCourt: 'Émissions de gaz à effet de serre',
        identifiantReferentiel: 'cae_1.a',
      },
      {
        id: expect.any(Number),
        titre: expect.any(String),
        titreCourt: 'Résidentiel',
        identifiantReferentiel: 'cae_1.c',
      },
    ]);

    expect(indicateur.parents).toHaveLength(2);
  });

  describe('Input filters tests', () => {
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

      const indicateurId = await createIndicateurPerso({
        caller,
        indicateurData: {
          collectiviteId: 1,
          titre: 'Indicateur avec participation score',
        },
      });

      const input: Input = {
        collectiviteId: 1,
        filters: {
          participationScore: true,
        },
      };

      const { data: result } = await caller.indicateurs.definitions.list(input);

      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result).toContainEqual(
        expect.objectContaining({ id: indicateurId })
      );
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
    });

    test('filtre par fichesNonClassees', async () => {
      const caller = router.createCaller({ user: yoloDodoUser });

      const ficheId = await createFiche({
        caller,
        ficheInput: {
          collectiviteId: 1,
          titre: 'Fiche non classées',
        },
      });

      // Create an indicateur without any fiche (fichesNonClassees: true)
      const indicateurId = await createIndicateurPerso({
        caller,
        indicateurData: {
          collectiviteId: 1,
          ficheId: ficheId,
        },
      });

      const input: Input = {
        collectiviteId: 1,
        filters: {
          fichesNonClassees: true,
        },
      };

      const { data: result } = await caller.indicateurs.definitions.list(input);

      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result).toContainEqual(
        expect.objectContaining({ id: indicateurId })
      );
    });

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

      const sansOpenData: Input = {
        collectiviteId: 1,
        filters: {
          // Test with false since new indicateurs won't have open data
          hasOpenData: false,
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
        expect(indicateur.hasOpenData).toBe(false);
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
        const toCheck =
          indicateurDefinitionDetailleeSchema.safeParse(indicateur);

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

      const input: Input = {
        collectiviteId: 1,
        filters: {
          identifiantsReferentiel: ['cae_13.a'],
          estFavori: false,
        },
      };

      const { data: result } = await caller.indicateurs.definitions.list(input);

      expect(result.length).toEqual(1);
      expect(result).toContainEqual(
        expect.objectContaining({ identifiantReferentiel: 'cae_13.a' })
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
        expect.objectContaining({ identifiantReferentiel: 'cae_13.a' })
      );
    });
  });

  describe('Payload structure and linked entities tests', () => {
    test('vérifie que le payload contient tous les champs attendus', async () => {
      const caller = router.createCaller({ user: yoloDodoUser });

      const input: Input = {
        collectiviteId: 1,
        filters: {
          identifiantsReferentiel: ['cae_13.a'],
        },
      };
      const { data: result } = await caller.indicateurs.definitions.list(input);

      expect(result.length).toBeGreaterThan(0);
      const [indicateur] = result;

      console.log(indicateur);

      // Vérifie la structure de base de l'indicateur
      expect(indicateur).toHaveProperty('id');
      expect(indicateur).toHaveProperty('titre');
      expect(indicateur).toHaveProperty('description');
      expect(indicateur).toHaveProperty('identifiantReferentiel');
      expect(indicateur).toHaveProperty('unite');
      expect(indicateur).toHaveProperty('createdAt');
      expect(indicateur).toHaveProperty('modifiedAt');
      expect(indicateur).toHaveProperty('modifiedBy');

      // Vérifie les champs de la collectivité
      expect(indicateur).toHaveProperty('commentaire');
      expect(indicateur).toHaveProperty('estConfidentiel');
      expect(indicateur).toHaveProperty('estFavori');

      // Vérifie les champs calculés
      expect(indicateur).toHaveProperty('estPerso');
      expect(indicateur).toHaveProperty('hasOpenData');
      expect(indicateur).toHaveProperty('estAgregation');

      // Vérifie la validation avec le schéma
      const toCheck = indicateurDefinitionDetailleeSchema.safeParse(indicateur);
      console.log(toCheck.error);
      expect(toCheck.success).toBeTruthy();
    });

    test('vérifie les propriétés des entités liées - thematiques', async () => {
      const caller = router.createCaller({ user: yoloDodoUser });

      const { data: result } = await caller.indicateurs.definitions.list({
        collectiviteId: 1,
        filters: { identifiantsReferentiel: ['cae_13.a'] },
      });

      const [indicateur] = result;

      expect(Array.isArray(indicateur.thematiques)).toBeTruthy();
      indicateur.thematiques.forEach((thematique) => {
        expect(thematique).toHaveProperty('id');
        expect(thematique).toHaveProperty('nom');
        expect(typeof thematique.id).toBe('number');
        expect(typeof thematique.nom).toBe('string');
      });
    });

    test('vérifie les propriétés des entités liées - pilotes', async () => {
      const caller = router.createCaller({ user: yoloDodoUser });

      const { data: result } = await caller.indicateurs.definitions.list({
        collectiviteId: 1,
        filters: { identifiantsReferentiel: ['cae_13.a'] },
      });

      const [indicateur] = result;

      expect(Array.isArray(indicateur.pilotes)).toBeTruthy();
      indicateur.pilotes.forEach((pilote) => {
        expect(pilote).toHaveProperty('nom');
        expect(typeof pilote.nom).toBe('string');
        // Un pilote peut être soit un utilisateur (userId) soit une personne tag (tagId)
        expect(pilote.userId || pilote.tagId).toBeTruthy();
      });
    });

    test('vérifie les propriétés des entités liées - services', async () => {
      const caller = router.createCaller({ user: yoloDodoUser });

      const { data: result } = await caller.indicateurs.definitions.list({
        collectiviteId: 1,
        filters: { identifiantsReferentiel: ['cae_13.a'] },
      });

      const [indicateur] = result;

      expect(Array.isArray(indicateur.services)).toBeTruthy();
      indicateur.services.forEach((service) => {
        expect(service).toHaveProperty('id');
        expect(service).toHaveProperty('nom');
        expect(typeof service.id).toBe('number');
        expect(typeof service.nom).toBe('string');
      });
    });

    test('vérifie les propriétés des entités liées - enfants', async () => {
      const caller = router.createCaller({ user: yoloDodoUser });

      const { data: result } = await caller.indicateurs.definitions.list({
        collectiviteId: 1,
        filters: { identifiantsReferentiel: ['cae_13.a'] },
      });

      const [indicateur] = result;

      if (indicateur.enfants) {
        expect(Array.isArray(indicateur.enfants)).toBeTruthy();
        indicateur.enfants.forEach((enfant) => {
          expect(enfant).toHaveProperty('id');
          expect(enfant).toHaveProperty('identifiantReferentiel');
          expect(enfant).toHaveProperty('titre');
          expect(typeof enfant.id).toBe('number');
          expect(typeof enfant.identifiantReferentiel).toBe('string');
          expect(typeof enfant.titre).toBe('string');
        });
      }
    });

    test('vérifie les propriétés des entités liées - parents', async () => {
      const caller = router.createCaller({ user: yoloDodoUser });

      const { data: result } = await caller.indicateurs.definitions.list({
        collectiviteId: 1,
        filters: { identifiantsReferentiel: ['cae_1.ca'] },
      });

      const [indicateur] = result;

      if (indicateur.parents) {
        expect(Array.isArray(indicateur.parents)).toBeTruthy();
        indicateur.parents.forEach((parent) => {
          expect(parent).toHaveProperty('id');
          expect(parent).toHaveProperty('titre');
          expect(typeof parent.id).toBe('number');
          expect(typeof parent.titre).toBe('string');
        });
      }
    });

    test('vérifie les propriétés des entités liées - fiches', async () => {
      const caller = router.createCaller({ user: yoloDodoUser });

      const { data: result } = await caller.indicateurs.definitions.list({
        collectiviteId: 1,
        filters: { identifiantsReferentiel: ['cae_13.a'] },
      });

      const [indicateur] = result;

      expect(Array.isArray(indicateur.fiches)).toBeTruthy();
      indicateur.fiches.forEach((fiche) => {
        expect(fiche).toHaveProperty('id');
        expect(fiche).toHaveProperty('titre');
        expect(typeof fiche.id).toBe('string');
        expect(typeof fiche.titre).toBe('string');
      });
    });

    test('vérifie les propriétés des entités liées - mesures', async () => {
      const caller = router.createCaller({ user: yoloDodoUser });

      const { data: result } = await caller.indicateurs.definitions.list({
        collectiviteId: 1,
        filters: { identifiantsReferentiel: ['cae_13.a'] },
      });

      const [indicateur] = result;

      expect(Array.isArray(indicateur.mesures)).toBeTruthy();
      indicateur.mesures.forEach((mesure) => {
        expect(mesure).toHaveProperty('id');
        expect(mesure).toHaveProperty('nom');
        expect(typeof mesure.id).toBe('string');
        expect(typeof mesure.nom).toBe('string');
      });
    });

    test('vérifie les propriétés des entités liées - categories', async () => {
      const caller = router.createCaller({ user: yoloDodoUser });

      const { data: result } = await caller.indicateurs.definitions.list({
        collectiviteId: 1,
        filters: { identifiantsReferentiel: ['cae_13.a'] },
      });

      const [indicateur] = result;

      expect(Array.isArray(indicateur.categories)).toBeTruthy();
      indicateur.categories.forEach((categorie) => {
        expect(categorie).toHaveProperty('id');
        expect(categorie).toHaveProperty('nom');
        expect(typeof categorie.id).toBe('number');
        expect(typeof categorie.nom).toBe('string');
      });
    });

    test('vérifie les propriétés des entités liées - groupementCollectivites', async () => {
      const caller = router.createCaller({ user: yoloDodoUser });

      const { data: result } = await caller.indicateurs.definitions.list({
        collectiviteId: 1,
        filters: { identifiantsReferentiel: ['cae_13.a'] },
      });

      const [indicateur] = result;

      expect(Array.isArray(indicateur.groupementCollectivites)).toBeTruthy();
      indicateur.groupementCollectivites.forEach((collectivite) => {
        expect(collectivite).toHaveProperty('id');
        expect(collectivite).toHaveProperty('nom');
        expect(typeof collectivite.id).toBe('number');
        expect(typeof collectivite.nom).toBe('string');
      });
    });

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
        const toCheck =
          indicateurDefinitionDetailleeSchema.safeParse(indicateur);
        expect(toCheck.success).toBeTruthy();
      });
    });
  });

  describe('Edge cases and error handling', () => {
    test('gère les filtres vides', async () => {
      const caller = router.createCaller({ user: yoloDodoUser });

      const input: Input = {
        collectiviteId: 1,
        filters: {},
      };
      const { data: result } = await caller.indicateurs.definitions.list(input);

      expect(Array.isArray(result)).toBeTruthy();
      result.forEach((indicateur) => {
        const toCheck =
          indicateurDefinitionDetailleeSchema.safeParse(indicateur);
        expect(toCheck.success).toBeTruthy();
      });
    });

    test('gère les filtres avec des valeurs nulles ou undefined', async () => {
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

      expect(Array.isArray(result)).toBeTruthy();
      result.forEach((indicateur) => {
        const toCheck =
          indicateurDefinitionDetailleeSchema.safeParse(indicateur);
        expect(toCheck.success).toBeTruthy();
      });
    });

    test('gère la pagination avec des limites extrêmes', async () => {
      const caller = router.createCaller({ user: yoloDodoUser });

      const input: Input = {
        collectiviteId: 1,
        filters: {
          identifiantsReferentiel: ['cae_13.a'],
        },
        queryOptions: {
          page: 1,
          limit: 1,
        },
      };
      const { data: result } = await caller.indicateurs.definitions.list(input);

      // Le router retourne seulement le tableau de données
      expect(Array.isArray(result)).toBeTruthy();
      expect(result.length).toBeLessThanOrEqual(1);
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
        const toCheck =
          indicateurDefinitionDetailleeSchema.safeParse(indicateur);
        expect(toCheck.success).toBeTruthy();
      });
    });

    test('gère les filtres multiples avec des valeurs contradictoires', async () => {
      const caller = router.createCaller({ user: yoloDodoUser });

      const input: Input = {
        collectiviteId: 1,
        filters: {
          identifiantsReferentiel: ['cae_13.a'],
          estPerso: true, // Contradiction : cae_13.a est référentiel, donc estPerso devrait être false
        },
      };
      const { data: result } = await caller.indicateurs.definitions.list(input);

      // Devrait retourner un résultat vide car les conditions sont contradictoires
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

    test('vérifie la cohérence des données entre les filtres et les résultats', async () => {
      const caller = router.createCaller({ user: yoloDodoUser });

      const input: Input = {
        collectiviteId: 1,
        filters: {
          estFavori: true,
        },
      };
      const { data: result } = await caller.indicateurs.definitions.list(input);

      result.forEach((indicateur) => {
        const toCheck =
          indicateurDefinitionDetailleeSchema.safeParse(indicateur);
        expect(toCheck.success).toBeTruthy();
        expect(indicateur.estFavori).toBe(true);
      });
    });

    test('vérifie que les entités liées ne sont pas null ou undefined', async () => {
      const caller = router.createCaller({ user: yoloDodoUser });

      const { data: result } = await caller.indicateurs.definitions.list({
        collectiviteId: 1,
        filters: { identifiantsReferentiel: ['cae_13.a'] },
      });

      const [indicateur] = result;

      // Vérifie que les tableaux ne sont pas null/undefined
      expect(indicateur.thematiques).toBeDefined();
      expect(indicateur.pilotes).toBeDefined();
      expect(indicateur.services).toBeDefined();
      expect(indicateur.categories).toBeDefined();
      expect(indicateur.fiches).toBeDefined();
      expect(indicateur.mesures).toBeDefined();
      expect(indicateur.groupementCollectivites).toBeDefined();

      // Vérifie que ce sont bien des tableaux
      expect(Array.isArray(indicateur.thematiques)).toBeTruthy();
      expect(Array.isArray(indicateur.pilotes)).toBeTruthy();
      expect(Array.isArray(indicateur.services)).toBeTruthy();
      expect(Array.isArray(indicateur.categories)).toBeTruthy();
      expect(Array.isArray(indicateur.fiches)).toBeTruthy();
      expect(Array.isArray(indicateur.mesures)).toBeTruthy();
      expect(Array.isArray(indicateur.groupementCollectivites)).toBeTruthy();
    });

    test('vérifie que les champs obligatoires sont présents', async () => {
      const caller = router.createCaller({ user: yoloDodoUser });

      const { data: result } = await caller.indicateurs.definitions.list({
        collectiviteId: 1,
        queryOptions: {
          page: 1,
          limit: 100,
        },
      });

      result.forEach((indicateur) => {
        // Champs obligatoires de base
        expect(indicateur.id).toBeDefined();
        expect(indicateur.titre).toBeDefined();
        expect(indicateur.createdAt).toBeDefined();
        expect(indicateur.modifiedAt).toBeDefined();

        // Champs calculés obligatoires
        expect(indicateur.estPerso).toBeDefined();
        expect(indicateur.hasOpenData).toBeDefined();
        expect(indicateur.estAgregation).toBeDefined();

        // Vérifie les types
        expect(typeof indicateur.id).toBe('number');
        expect(typeof indicateur.titre).toBe('string');
        expect(typeof indicateur.estPerso).toBe('boolean');
        expect(typeof indicateur.hasOpenData).toBe('boolean');
        expect(typeof indicateur.estAgregation).toBe('boolean');
      });
    });
  });
});
