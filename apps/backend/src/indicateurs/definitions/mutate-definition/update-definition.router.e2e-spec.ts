import { INestApplication } from '@nestjs/common';
import {
  createPersonneTag,
  createServiceTag,
} from '@tet/backend/collectivites/collectivites.test-fixture';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { groupementCollectiviteTable } from '@tet/backend/collectivites/shared/models/groupement-collectivite.table';
import { createGroupement } from '@tet/backend/collectivites/shared/models/groupement.test-fixture';
import { serviceTagTable } from '@tet/backend/collectivites/tags/service-tag.table';
import { indicateurServiceTagTable } from '@tet/backend/indicateurs/indicateurs/handle-definition-services/indicateur-service-tag.table';
import { indicateurPiloteTable } from '@tet/backend/indicateurs/shared/models/indicateur-pilote.table';
import { createFiche } from '@tet/backend/plans/fiches/fiches.test-fixture';
import { ficheActionIndicateurTable } from '@tet/backend/plans/fiches/shared/models/fiche-action-indicateur.table';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { addTestUser } from '@tet/backend/users/users/users.test-fixture';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { createFiche } from '@tet/backend/plans/fiches/fiches.test-fixture';
import { createThematique } from '@tet/backend/shared/shared.test-fixture';
import { Collectivite } from '@tet/domain/collectivites';
import { CollectiviteRole } from '@tet/domain/users';
import { and, eq, isNull } from 'drizzle-orm';
import { describe, expect, onTestFinished, test } from 'vitest';
import { createIndicateurPerso } from '../definitions.test-fixture';
import { indicateurCollectiviteTable } from '../indicateur-collectivite.table';
import { indicateurDefinitionTable } from '../indicateur-definition.table';
import { UpdateIndicateurDefinitionInput } from './mutate-definition.input';
import { UpdateDefinitionService } from './update-definition.service';

describe('UpdateIndicateurDefinitionRouter', () => {
  let app: INestApplication;
  let databaseService: DatabaseService;
  let router: TrpcRouter;
  let authenticatedUser: AuthenticatedUser;
  let collectivite: Collectivite;

  beforeAll(async () => {
    app = await getTestApp();
    router = app.get(TrpcRouter);
    databaseService = await getTestDatabase(app);

    const testResult = await addTestCollectiviteAndUser(databaseService, {
      user: { role: CollectiviteRole.ADMIN },
    });
    collectivite = testResult.collectivite;
    authenticatedUser = getAuthUserFromUserCredentials(testResult.user);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('indicateur perso', () => {
    test('annule la modification du suivi si la transaction appelante échoue', async () => {
      const caller = router.createCaller({ user: authenticatedUser });
      const indicateurId = await createIndicateurPerso({
        caller,
        indicateurData: {
          collectiviteId: collectivite.id,
          titre: 'Suivi dans une transaction partagée',
        },
      });
      const updateDefinitionService = app.get(UpdateDefinitionService);
      const rollbackError = new Error('Échec après modification du suivi');

      await expect(
        databaseService.db.transaction(async (tx) => {
          await updateDefinitionService.updateDefinition(
            {
              indicateurId,
              collectiviteId: collectivite.id,
              indicateurFields: { isSuivi: false },
            },
            { user: authenticatedUser, tx }
          );
          const [indicateur] = await tx
            .select({ isSuivi: indicateurCollectiviteTable.isSuivi })
            .from(indicateurCollectiviteTable)
            .where(
              and(
                eq(indicateurCollectiviteTable.indicateurId, indicateurId),
                eq(indicateurCollectiviteTable.collectiviteId, collectivite.id)
              )
            );
          expect(indicateur.isSuivi).toBe(false);
          throw rollbackError;
        })
      ).rejects.toBe(rollbackError);

      const { data } = await caller.indicateurs.indicateurs.list({
        collectiviteId: collectivite.id,
        filters: { indicateurIds: [indicateurId] },
      });
      expect(data).toMatchObject([{ id: indicateurId, isSuivi: true }]);
    });

    test('should update basic fields for perso indicator', async () => {
      const caller = router.createCaller({ user: authenticatedUser });

      const indicateurId = await createIndicateurPerso({
        caller,
        indicateurData: {
          collectiviteId: collectivite.id,
          titre: 'Test Personal Indicator',
        },
      });

      const updateData: UpdateIndicateurDefinitionInput = {
        indicateurId,
        collectiviteId: collectivite.id,
        indicateurFields: {
          commentaire: 'Updated commentaire for test indicator',
          estFavori: true,
          estConfidentiel: true,
        },
      };

      await caller.indicateurs.indicateurs.update(updateData);

      const {
        data: [updatedIndicateur],
      } = await caller.indicateurs.indicateurs.list({
        collectiviteId: collectivite.id,
        filters: {
          indicateurIds: [indicateurId],
        },
      });

      expect(updatedIndicateur).toBeDefined();
      expect(updatedIndicateur.id).toBe(indicateurId);
      expect(updatedIndicateur.commentaire).toBe(
        updateData.indicateurFields.commentaire
      );
      expect(updatedIndicateur.estFavori).toBe(
        updateData.indicateurFields.estFavori
      );
      expect(updatedIndicateur.estConfidentiel).toBe(
        updateData.indicateurFields.estConfidentiel
      );
      expect(updatedIndicateur.modifiedBy).toEqual(
        expect.objectContaining({ id: authenticatedUser.id })
      );
      expect(updatedIndicateur.modifiedAt).toBeDefined();
    });

    test('should update titre and unite for perso indicator', async () => {
      const caller = router.createCaller({ user: authenticatedUser });

      const indicateurId = await createIndicateurPerso({
        caller,
        indicateurData: {
          collectiviteId: collectivite.id,
          titre: 'Test Personal Indicator',
        },
      });

      const updateData: UpdateIndicateurDefinitionInput = {
        indicateurId,
        collectiviteId: collectivite.id,
        indicateurFields: {
          titre: 'Updated Test Indicateur Title',
          unite: 'kg CO2',
        },
      };

      await caller.indicateurs.indicateurs.update(updateData);

      const {
        data: [updatedIndicateur],
      } = await caller.indicateurs.indicateurs.list({
        collectiviteId: collectivite.id,
        filters: {
          indicateurIds: [indicateurId],
        },
      });

      expect(updatedIndicateur).toBeDefined();
      expect(updatedIndicateur.id).toBe(indicateurId);
      expect(updatedIndicateur.titre).toBe(updateData.indicateurFields.titre);
      expect(updatedIndicateur.unite).toBe(updateData.indicateurFields.unite);

      // Verify the update in the database
      const dbIndicateur = await databaseService.db
        .select()
        .from(indicateurDefinitionTable)
        .where(eq(indicateurDefinitionTable.id, indicateurId))
        .limit(1);

      expect(dbIndicateur).toHaveLength(1);
      expect(dbIndicateur[0].titre).toBe(updateData.indicateurFields.titre);
      expect(dbIndicateur[0].unite).toBe(updateData.indicateurFields.unite);
    });

    test('rejects a periodicity change before the first value', async () => {
      const caller = router.createCaller({ user: authenticatedUser });
      const indicateurId = await createIndicateurPerso({
        caller,
        indicateurData: {
          collectiviteId: collectivite.id,
          titre: 'Fixed declaration cadence',
        },
      });
      await expect(
        caller.indicateurs.indicateurs.update({
          indicateurId,
          collectiviteId: collectivite.id,
          indicateurFields: { periodicite: 'mensuelle' } as never,
        })
      ).rejects.toThrow();
      const [definition] = await databaseService.db
        .select()
        .from(indicateurDefinitionTable)
        .where(eq(indicateurDefinitionTable.id, indicateurId));
      expect(definition.periodicite).toBe('annuelle');
    });

    test('should atomically update fiches and thematiques', async () => {
      const caller = router.createCaller({ user: authenticatedUser });
      const indicateurId = await createIndicateurPerso({
        caller,
        indicateurData: {
          collectiviteId: collectivite.id,
          titre: 'Test Atomic Personal Indicator Update',
        },
      });
      const ficheId = await createFiche({
        caller,
        ficheInput: {
          collectiviteId: collectivite.id,
          titre: 'Fiche linked in atomic update',
        },
      });
      const thematique = await createThematique({
        database: databaseService,
        thematiqueData: { nom: 'Thématique linked in atomic update' },
      });

      await caller.indicateurs.indicateurs.update({
        indicateurId,
        collectiviteId: collectivite.id,
        indicateurFields: {
          ficheIds: [ficheId],
          thematiques: [{ id: thematique.id }],
        },
      });

      const {
        data: [updatedIndicateur],
      } = await caller.indicateurs.indicateurs.list({
        collectiviteId: collectivite.id,
        filters: { indicateurIds: [indicateurId] },
      });
      const linkedFiches = await caller.plans.fiches.listFiches({
        collectiviteId: collectivite.id,
        filters: { indicateurIds: [indicateurId] },
      });

      expect(updatedIndicateur?.periodicite).toBe('annuelle');
      expect(updatedIndicateur?.thematiques).toContainEqual(
        expect.objectContaining({ id: thematique.id })
      );
      expect(linkedFiches.data).toContainEqual(
        expect.objectContaining({ id: ficheId })
      );
    });

    test('should reject a restricted API key before the pilot fallback while allowing the human pilot', async () => {
      const adminCaller = router.createCaller({ user: authenticatedUser });
      const { user, cleanup } = await addTestUser(databaseService, {
        collectiviteId: collectivite.id,
        role: CollectiviteRole.EDITION_FICHES_INDICATEURS,
      });
      onTestFinished(cleanup);
      // Register the indicator cleanup after the user cleanup. Vitest runs
      // onTestFinished callbacks in reverse order, so the foreign keys to the
      // pilot user and modifiedBy are removed before deleting that user.
      const indicateurId = await createIndicateurPerso({
        caller: adminCaller,
        indicateurData: {
          collectiviteId: collectivite.id,
          titre: 'Test Restricted API Key Definition Update',
        },
      });

      const pilotUser = getAuthUserFromUserCredentials(user);
      await adminCaller.indicateurs.indicateurs.update({
        indicateurId,
        collectiviteId: collectivite.id,
        indicateurFields: { pilotes: [{ userId: pilotUser.id }] },
      });

      const restrictedApiKeyCaller = router.createCaller({
        user: {
          ...pilotUser,
          jwtPayload: {
            ...pilotUser.jwtPayload,
            client_id: 'test-read-only-api-key',
            permissions: ['indicateurs.indicateurs.read'],
          },
        },
      });

      await expect(
        restrictedApiKeyCaller.indicateurs.indicateurs.update({
          indicateurId,
          collectiviteId: collectivite.id,
          indicateurFields: { commentaire: 'Updated by the pilot' },
        })
      ).rejects.toThrow(/clé d'api.*indicateurs\.indicateurs\.update/i);

      const [definitionAfterRejectedUpdate] = await databaseService.db
        .select({ periodicite: indicateurDefinitionTable.periodicite })
        .from(indicateurDefinitionTable)
        .where(eq(indicateurDefinitionTable.id, indicateurId));
      expect(definitionAfterRejectedUpdate?.periodicite).toBe('annuelle');

      const humanPilotCaller = router.createCaller({ user: pilotUser });
      await humanPilotCaller.indicateurs.indicateurs.update({
        indicateurId,
        collectiviteId: collectivite.id,
        indicateurFields: { commentaire: 'Updated by the pilot' },
      });

      const [definitionAfterHumanUpdate] = await databaseService.db
        .select({ periodicite: indicateurDefinitionTable.periodicite })
        .from(indicateurDefinitionTable)
        .where(eq(indicateurDefinitionTable.id, indicateurId));
      expect(definitionAfterHumanUpdate?.periodicite).toBe('annuelle');
      const {
        data: [localDefinition],
      } = await humanPilotCaller.indicateurs.indicateurs.list({
        collectiviteId: collectivite.id,
        filters: { indicateurIds: [indicateurId] },
      });
      expect(localDefinition.commentaire).toBe('Updated by the pilot');
    });

    test('rejects local values at a different cadence from the definition', async () => {
      const caller = router.createCaller({ user: authenticatedUser });
      const indicateurId = await createIndicateurPerso({
        caller,
        indicateurData: {
          collectiviteId: collectivite.id,
          titre: 'Fixed annual cadence',
        },
      });
      await expect(
        caller.indicateurs.valeurs.upsert({
          indicateurId,
          collectiviteId: collectivite.id,
          periodicite: 'mensuelle',
          dateValeur: '2026-02-01',
          resultat: 10,
        })
      ).rejects.toThrow(/périodicité de déclaration/);
    });

    test('should update multiple fields at once for perso indicator', async () => {
      const caller = router.createCaller({ user: authenticatedUser });

      const indicateurId = await createIndicateurPerso({
        caller,
        indicateurData: {
          collectiviteId: collectivite.id,
          titre: 'hophophop',
        },
      });

      const updateData: UpdateIndicateurDefinitionInput = {
        indicateurId,
        collectiviteId: collectivite.id,
        indicateurFields: {
          titre: 'Multi-field Updated Title',
          unite: 'tonnes',
          commentaire: 'Updated description with multiple fields',
          estFavori: true,
          estConfidentiel: true,
        },
      };

      await caller.indicateurs.indicateurs.update(updateData);

      const {
        data: [updatedIndicateur],
      } = await caller.indicateurs.indicateurs.list({
        collectiviteId: collectivite.id,
        filters: {
          indicateurIds: [indicateurId],
        },
      });

      expect(updatedIndicateur).toBeDefined();
      expect(updatedIndicateur.id).toBe(indicateurId);
      expect(updatedIndicateur.titre).toBe(updateData.indicateurFields.titre);
      expect(updatedIndicateur.unite).toBe(updateData.indicateurFields.unite);
      expect(updatedIndicateur.commentaire).toBe(
        updateData.indicateurFields.commentaire
      );
      expect(updatedIndicateur.estFavori).toBe(
        updateData.indicateurFields.estFavori
      );
      expect(updatedIndicateur.estConfidentiel).toBe(
        updateData.indicateurFields.estConfidentiel
      );
    });

    test('should preserve estFavori and estConfidentiel when updating unrelated fields', async () => {
      const caller = router.createCaller({ user: authenticatedUser });

      const indicateurId = await createIndicateurPerso({
        caller,
        indicateurData: {
          collectiviteId: collectivite.id,
          titre: 'Test Preserve Favori On Partial Update',
        },
      });

      await caller.indicateurs.indicateurs.update({
        indicateurId,
        collectiviteId: collectivite.id,
        indicateurFields: {
          estFavori: true,
          estConfidentiel: true,
        },
      });

      await caller.indicateurs.indicateurs.update({
        indicateurId,
        collectiviteId: collectivite.id,
        indicateurFields: {
          pilotes: [{ userId: authenticatedUser.id }],
        },
      });

      const {
        data: [updatedIndicateur],
      } = await caller.indicateurs.indicateurs.list({
        collectiviteId: collectivite.id,
        filters: {
          indicateurIds: [indicateurId],
        },
      });

      expect(updatedIndicateur).toBeDefined();
      expect(updatedIndicateur.estFavori).toBe(true);
      expect(updatedIndicateur.estConfidentiel).toBe(true);
    });

    test('should reset estFavori and estConfidentiel when explicitly set to false', async () => {
      const caller = router.createCaller({ user: authenticatedUser });

      const indicateurId = await createIndicateurPerso({
        caller,
        indicateurData: {
          collectiviteId: collectivite.id,
          titre: 'Test Reset Favori On Explicit False',
        },
      });

      await caller.indicateurs.indicateurs.update({
        indicateurId,
        collectiviteId: collectivite.id,
        indicateurFields: {
          estFavori: true,
          estConfidentiel: true,
        },
      });

      await caller.indicateurs.indicateurs.update({
        indicateurId,
        collectiviteId: collectivite.id,
        indicateurFields: {
          estFavori: false,
          estConfidentiel: false,
        },
      });

      const {
        data: [updatedIndicateur],
      } = await caller.indicateurs.indicateurs.list({
        collectiviteId: collectivite.id,
        filters: {
          indicateurIds: [indicateurId],
        },
      });

      expect(updatedIndicateur).toBeDefined();
      expect(updatedIndicateur.estFavori).toBe(false);
      expect(updatedIndicateur.estConfidentiel).toBe(false);
    });

    test('should throw error when updating non-existent indicator', async () => {
      const updateData: UpdateIndicateurDefinitionInput = {
        indicateurId: 99999,
        collectiviteId: collectivite.id,
        indicateurFields: {
          titre: 'This should fail',
        },
      };

      const caller = router.createCaller({ user: authenticatedUser });

      await expect(
        caller.indicateurs.indicateurs.update(updateData)
      ).rejects.toThrow();
    });

    test('should throw error when user lacks permission', async () => {
      const caller = router.createCaller({ user: authenticatedUser });

      const indicateurId = await createIndicateurPerso({
        caller,
        indicateurData: {
          collectiviteId: collectivite.id,
          titre: 'hophophop',
        },
      });

      const updateData: UpdateIndicateurDefinitionInput = {
        indicateurId,
        collectiviteId: 999,
        indicateurFields: {
          titre: 'Unauthorized update',
        },
      };

      await expect(
        caller.indicateurs.indicateurs.update(updateData)
      ).rejects.toThrow();
    });

    test('should hide and reject an indicator owned by another collectivite', async () => {
      const other = await addTestCollectiviteAndUser(databaseService, {
        user: { role: CollectiviteRole.ADMIN },
      });
      onTestFinished(other.cleanup);
      const otherCaller = router.createCaller({
        user: getAuthUserFromUserCredentials(other.user),
      });
      const foreignIndicateurId = await createIndicateurPerso({
        caller: otherCaller,
        indicateurData: {
          collectiviteId: other.collectivite.id,
          titre: 'Foreign personal indicator',
        },
      });

      const caller = router.createCaller({ user: authenticatedUser });
      await expect(
        caller.indicateurs.indicateurs.update({
          indicateurId: foreignIndicateurId,
          collectiviteId: collectivite.id,
          indicateurFields: { commentaire: 'Cross-tenant update' },
        })
      ).rejects.toThrow(/non trouvé pour la collectivité/i);

      const [definition] = await databaseService.db
        .select({ titre: indicateurDefinitionTable.titre })
        .from(indicateurDefinitionTable)
        .where(eq(indicateurDefinitionTable.id, foreignIndicateurId));
      expect(definition?.titre).toBe('Foreign personal indicator');
    });

    test('should reject fiche, service and pilote resources owned by another collectivite', async () => {
      const other = await addTestCollectiviteAndUser(databaseService, {
        user: { role: CollectiviteRole.ADMIN },
      });
      onTestFinished(other.cleanup);
      const otherUser = getAuthUserFromUserCredentials(other.user);
      const otherCaller = router.createCaller({ user: otherUser });
      const foreignFicheId = await createFiche({
        caller: otherCaller,
        ficheInput: {
          collectiviteId: other.collectivite.id,
          titre: 'Foreign fiche for indicator update',
        },
      });
      const foreignService = await createServiceTag({
        database: databaseService,
        tagData: {
          collectiviteId: other.collectivite.id,
          nom: 'Foreign service for indicator update',
        },
      });
      const foreignPersonne = await createPersonneTag({
        database: databaseService,
        tagData: {
          collectiviteId: other.collectivite.id,
          nom: 'Foreign personne for indicator update',
        },
      });
      const caller = router.createCaller({ user: authenticatedUser });
      const indicateurId = await createIndicateurPerso({
        caller,
        indicateurData: {
          collectiviteId: collectivite.id,
          titre: 'Indicator protected from foreign relations',
        },
      });

      await expect(
        caller.indicateurs.indicateurs.update({
          indicateurId,
          collectiviteId: collectivite.id,
          indicateurFields: { ficheIds: [foreignFicheId] },
        })
      ).rejects.toThrow(/fiches doivent appartenir/i);
      await expect(
        caller.indicateurs.indicateurs.update({
          indicateurId,
          collectiviteId: collectivite.id,
          indicateurFields: { services: [{ id: foreignService.id }] },
        })
      ).rejects.toThrow(/services doivent appartenir/i);
      await expect(
        caller.indicateurs.indicateurs.update({
          indicateurId,
          collectiviteId: collectivite.id,
          indicateurFields: { pilotes: [{ tagId: foreignPersonne.id }] },
        })
      ).rejects.toThrow(/pilotes doivent appartenir/i);
      await expect(
        caller.indicateurs.indicateurs.update({
          indicateurId,
          collectiviteId: collectivite.id,
          indicateurFields: { pilotes: [{ userId: otherUser.id }] },
        })
      ).rejects.toThrow(/pilotes doivent appartenir/i);
    });
  });

  describe('applicabilité', () => {
    const listIndicateur = async (
      caller: ReturnType<typeof router.createCaller>,
      indicateurId: number
    ) => {
      const {
        data: [indicateur],
      } = await caller.indicateurs.indicateurs.list({
        collectiviteId: collectivite.id,
        filters: { indicateurIds: [indicateurId] },
      });
      return indicateur;
    };

    test('un indicateur sans ligne indicateur_collectivite est applicable', async () => {
      const caller = router.createCaller({ user: authenticatedUser });

      // Un prédéfini que la collectivité n'a jamais touché : c'est le seul cas
      // où le LEFT JOIN rend `null`, celui que rattrape le `coalesce`.
      // `createIndicateurPerso` poserait une ligne et masquerait ce chemin.
      const [indicateurJamaisTouche] = await databaseService.db
        .select()
        .from(indicateurDefinitionTable)
        .where(
          and(
            eq(indicateurDefinitionTable.identifiantReferentiel, 'cae_1.c'),
            isNull(indicateurDefinitionTable.collectiviteId)
          )
        )
        .limit(1);
      expect(indicateurJamaisTouche).toBeDefined();

      const lignes = await databaseService.db
        .select()
        .from(indicateurCollectiviteTable)
        .where(
          and(
            eq(
              indicateurCollectiviteTable.indicateurId,
              indicateurJamaisTouche.id
            ),
            eq(indicateurCollectiviteTable.collectiviteId, collectivite.id)
          )
        );
      expect(lignes).toHaveLength(0);

      expect(
        (await listIndicateur(caller, indicateurJamaisTouche.id)).isApplicable
      ).toBe(true);
    });

    test('se déclare non applicable, puis redevient applicable', async () => {
      const caller = router.createCaller({ user: authenticatedUser });

      const indicateurId = await createIndicateurPerso({
        caller,
        indicateurData: {
          collectiviteId: collectivite.id,
          titre: 'Bascule applicabilité',
        },
      });

      await caller.indicateurs.indicateurs.update({
        indicateurId,
        collectiviteId: collectivite.id,
        indicateurFields: { isApplicable: false },
      });

      expect((await listIndicateur(caller, indicateurId)).isApplicable).toBe(
        false
      );

      await caller.indicateurs.indicateurs.update({
        indicateurId,
        collectiviteId: collectivite.id,
        indicateurFields: { isApplicable: true },
      });

      expect((await listIndicateur(caller, indicateurId)).isApplicable).toBe(
        true
      );
    });

    test('une mise à jour qui ne parle pas d’applicabilité ne la touche pas', async () => {
      const caller = router.createCaller({ user: authenticatedUser });

      const indicateurId = await createIndicateurPerso({
        caller,
        indicateurData: {
          collectiviteId: collectivite.id,
          titre: 'Applicabilité préservée',
        },
      });

      await caller.indicateurs.indicateurs.update({
        indicateurId,
        collectiviteId: collectivite.id,
        indicateurFields: { isApplicable: false },
      });

      // `estFavori` seul : le champ absent du payload ne doit pas être remis à
      // sa valeur par défaut par l'upsert.
      await caller.indicateurs.indicateurs.update({
        indicateurId,
        collectiviteId: collectivite.id,
        indicateurFields: { estFavori: true },
      });

      const indicateur = await listIndicateur(caller, indicateurId);
      expect(indicateur.isApplicable).toBe(false);
      expect(indicateur.estFavori).toBe(true);
    });

    test('le filtre isApplicable sépare les deux populations', async () => {
      const caller = router.createCaller({ user: authenticatedUser });

      const nonApplicableId = await createIndicateurPerso({
        caller,
        indicateurData: {
          collectiviteId: collectivite.id,
          titre: 'Filtre — non applicable',
        },
      });
      const applicableId = await createIndicateurPerso({
        caller,
        indicateurData: {
          collectiviteId: collectivite.id,
          titre: 'Filtre — applicable',
        },
      });

      await caller.indicateurs.indicateurs.update({
        indicateurId: nonApplicableId,
        collectiviteId: collectivite.id,
        indicateurFields: { isApplicable: false },
      });

      // La création insère toujours une ligne `indicateur_collectivite` : on la
      // supprime pour retrouver le cas — majoritaire en base — d'un indicateur
      // sans ligne du tout, que le filtre doit compter comme applicable.
      await databaseService.db
        .delete(indicateurCollectiviteTable)
        .where(
          and(
            eq(indicateurCollectiviteTable.indicateurId, applicableId),
            eq(indicateurCollectiviteTable.collectiviteId, collectivite.id)
          )
        );

      // Restreint aux deux indicateurs du test : la liste est paginée, et la
      // collectivité en porte bien plus que ça.
      const indicateurIds = [nonApplicableId, applicableId];

      const { data: nonApplicables } =
        await caller.indicateurs.indicateurs.list({
          collectiviteId: collectivite.id,
          filters: { indicateurIds, isApplicable: false },
        });
      expect(nonApplicables.map(({ id }) => id)).toEqual([nonApplicableId]);

      // `applicableId` n'a plus de ligne `indicateur_collectivite` : `NULL =
      // true` l'exclurait à tort, le filtre doit quand même le remonter.
      const { data: applicables } = await caller.indicateurs.indicateurs.list({
        collectiviteId: collectivite.id,
        filters: { indicateurIds, isApplicable: true },
      });
      expect(applicables.map(({ id }) => id)).toEqual([applicableId]);
    });
  });

  describe('groupement — personnalisations locales', () => {
    async function createSharedDefinition({
      withOwner = true,
      isMember = true,
    }: { withOwner?: boolean; isMember?: boolean } = {}) {
      const owner = await addTestCollectiviteAndUser(databaseService, {
        user: { role: CollectiviteRole.ADMIN },
      });
      const groupement = await createGroupement({
        database: databaseService,
        groupementData: {
          nom: 'Groupement de personnalisation',
          collectiviteIds: isMember ? [collectivite.id] : [],
        },
      });
      const [definition] = await databaseService.db
        .insert(indicateurDefinitionTable)
        .values({
          collectiviteId: withOwner ? owner.collectivite.id : null,
          groupementId: groupement.id,
          titre: 'Indicateur partagé historique',
          unite: 't',
          periodicite: 'annuelle',
        })
        .returning();
      const caller = router.createCaller({ user: authenticatedUser });
      const ownerCaller = router.createCaller({
        user: getAuthUserFromUserCredentials(owner.user),
      });
      const input = {
        indicateurId: definition.id,
        collectiviteId: collectivite.id,
      };
      const readLocalFields = () =>
        databaseService.db
          .select()
          .from(indicateurCollectiviteTable)
          .where(eq(indicateurCollectiviteTable.indicateurId, definition.id));
      return {
        definition,
        owner,
        groupement,
        caller,
        ownerCaller,
        input,
        readLocalFields,
      };
    }

    test.each([true, false])(
      'le membre personnalise les champs locaux et les relations, propriétaire : %s',
      async (withOwner) => {
        const h = await createSharedDefinition({ withOwner });
        const ficheId = await createFiche({
          caller: h.caller,
          ficheInput: {
            collectiviteId: collectivite.id,
            titre: 'Fiche du membre',
          },
        });
        const [service] = await databaseService.db
          .insert(serviceTagTable)
          .values({
            nom: `Service du membre ${h.definition.id}`,
            collectiviteId: collectivite.id,
          })
          .returning();
        await h.caller.indicateurs.indicateurs.update({
          ...h.input,
          indicateurFields: {
            commentaire: 'Méthode locale',
            estFavori: true,
            estConfidentiel: true,
            isApplicable: false,
            pilotes: [{ userId: authenticatedUser.id }],
            services: [{ id: service.id }],
            ficheIds: [ficheId],
          },
        });
        expect(await h.readLocalFields()).toEqual([
          expect.objectContaining({
            collectiviteId: collectivite.id,
            commentaire: 'Méthode locale',
            favoris: true,
            confidentiel: true,
            isApplicable: false,
            modifiedBy: authenticatedUser.id,
          }),
        ]);
        expect(
          await databaseService.db
            .select()
            .from(indicateurPiloteTable)
            .where(eq(indicateurPiloteTable.indicateurId, h.definition.id))
        ).toEqual([
          expect.objectContaining({
            collectiviteId: collectivite.id,
            userId: authenticatedUser.id,
          }),
        ]);
        expect(
          await databaseService.db
            .select()
            .from(indicateurServiceTagTable)
            .where(eq(indicateurServiceTagTable.indicateurId, h.definition.id))
        ).toEqual([
          {
            indicateurId: h.definition.id,
            collectiviteId: collectivite.id,
            serviceTagId: service.id,
          },
        ]);
        expect(
          await databaseService.db
            .select()
            .from(ficheActionIndicateurTable)
            .where(eq(ficheActionIndicateurTable.indicateurId, h.definition.id))
        ).toEqual([
          {
            indicateurId: h.definition.id,
            ficheId,
            createdBy: authenticatedUser.id,
            createdAt: expect.any(String),
          },
        ]);
        expect(
          await databaseService.db
            .select()
            .from(indicateurDefinitionTable)
            .where(eq(indicateurDefinitionTable.id, h.definition.id))
        ).toEqual([h.definition]);
      }
    );

    test.each([true, false])(
      'refuse un non-membre sans écrire de personnalisation, propriétaire : %s',
      async (withOwner) => {
        const h = await createSharedDefinition({ withOwner, isMember: false });
        await expect(
          h.caller.indicateurs.indicateurs.update({
            ...h.input,
            indicateurFields: { estFavori: true },
          })
        ).rejects.toThrow(/non trouvé/);
        expect(await h.readLocalFields()).toEqual([]);
      }
    );

    test.each([
      { titre: 'Titre non autorisé' },
      { unite: 'kg' },
      { thematiques: [] },
    ])(
      'refuse les champs globaux au membre sans changement partiel : %j',
      async (fields) => {
        const h = await createSharedDefinition();
        await expect(
          h.caller.indicateurs.indicateurs.update({
            ...h.input,
            indicateurFields: { ...fields, estFavori: true },
          })
        ).rejects.toThrow(/collectivité propriétaire/);
        expect(await h.readLocalFields()).toEqual([]);
        expect(
          await databaseService.db
            .select()
            .from(indicateurDefinitionTable)
            .where(eq(indicateurDefinitionTable.id, h.definition.id))
        ).toEqual([h.definition]);
      }
    );

    test('conserve les droits du propriétaire sur les champs globaux sans appartenance au groupement', async () => {
      const h = await createSharedDefinition();
      await h.ownerCaller.indicateurs.indicateurs.update({
        indicateurId: h.definition.id,
        collectiviteId: h.owner.collectivite.id,
        indicateurFields: {
          titre: 'Titre du propriétaire',
          unite: 'kg',
          thematiques: [],
        },
      });
      expect(
        await databaseService.db
          .select()
          .from(indicateurDefinitionTable)
          .where(eq(indicateurDefinitionTable.id, h.definition.id))
      ).toEqual([
        expect.objectContaining({
          collectiviteId: h.owner.collectivite.id,
          titre: 'Titre du propriétaire',
          unite: 'kg',
          periodicite: 'annuelle',
        }),
      ]);
    });

    test('refuse toujours un indicateur personnalisé sans partage appartenant à une autre collectivité', async () => {
      const h = await createSharedDefinition();
      await databaseService.db
        .update(indicateurDefinitionTable)
        .set({ groupementId: null })
        .where(eq(indicateurDefinitionTable.id, h.definition.id));
      await expect(
        h.caller.indicateurs.indicateurs.update({
          ...h.input,
          indicateurFields: { estFavori: true },
        })
      ).rejects.toThrow(/non trouvé/);
      expect(await h.readLocalFields()).toEqual([]);
    });

    test('le propriétaire ne peut pas personnaliser une autre collectivité sans permission locale', async () => {
      const h = await createSharedDefinition();
      await expect(
        h.ownerCaller.indicateurs.indicateurs.update({
          ...h.input,
          indicateurFields: { estFavori: true },
        })
      ).rejects.toThrow(/[Dd]roits insuffisants/);
      expect(await h.readLocalFields()).toEqual([]);
    });

    test('la périodicité du partage reste immuable', async () => {
      const h = await createSharedDefinition();
      await expect(
        h.caller.indicateurs.indicateurs.update({
          ...h.input,
          indicateurFields: {
            estFavori: true,
            periodicite: 'mensuelle',
          } as never,
        })
      ).rejects.toThrow();
      expect(await h.readLocalFields()).toEqual([]);
      expect(
        await databaseService.db
          .select()
          .from(indicateurDefinitionTable)
          .where(eq(indicateurDefinitionTable.id, h.definition.id))
      ).toEqual([h.definition]);
    });

    test('annule les personnalisations et les pilotes si un service appartient à une autre collectivité', async () => {
      const h = await createSharedDefinition();
      const [foreignService] = await databaseService.db
        .insert(serviceTagTable)
        .values({
          nom: 'Service réservé au propriétaire',
          collectiviteId: h.owner.collectivite.id,
        })
        .returning();
      await expect(
        h.caller.indicateurs.indicateurs.update({
          ...h.input,
          indicateurFields: {
            estFavori: true,
            pilotes: [{ userId: authenticatedUser.id }],
            services: [{ id: foreignService.id }],
          },
        })
      ).rejects.toThrow(/services doivent appartenir/);
      expect(await h.readLocalFields()).toEqual([]);
      expect(
        await databaseService.db
          .select()
          .from(indicateurPiloteTable)
          .where(eq(indicateurPiloteTable.indicateurId, h.definition.id))
      ).toEqual([]);
    });

    test('retirer une appartenance empêche la personnalisation suivante', async () => {
      const h = await createSharedDefinition();
      await h.caller.indicateurs.indicateurs.update({
        ...h.input,
        indicateurFields: { estFavori: true },
      });
      await databaseService.db
        .delete(groupementCollectiviteTable)
        .where(
          and(
            eq(groupementCollectiviteTable.groupementId, h.groupement.id),
            eq(groupementCollectiviteTable.collectiviteId, collectivite.id)
          )
        );
      await expect(
        h.caller.indicateurs.indicateurs.update({
          ...h.input,
          indicateurFields: { estFavori: false },
        })
      ).rejects.toThrow(/non trouvé/);
      expect(await h.readLocalFields()).toEqual([
        expect.objectContaining({ favoris: true }),
      ]);
    });
  });

  describe('indicateur prédéfini', () => {
    let indicateurPredefiniCae1a: typeof indicateurDefinitionTable.$inferSelect;

    beforeAll(async () => {
      const [indicateurPredefini] = await databaseService.db
        .select()
        .from(indicateurDefinitionTable)
        .where(
          and(
            eq(indicateurDefinitionTable.identifiantReferentiel, 'cae_1.a'),
            isNull(indicateurDefinitionTable.collectiviteId)
          )
        )
        .limit(1);

      expect(indicateurPredefini).toBeDefined();

      indicateurPredefiniCae1a = indicateurPredefini;
    });

    test('should update fields', async () => {
      const caller = router.createCaller({ user: authenticatedUser });

      const indicateurId = indicateurPredefiniCae1a.id;

      const updateData: UpdateIndicateurDefinitionInput = {
        indicateurId,
        collectiviteId: collectivite.id,
        indicateurFields: {
          commentaire: 'Updated commentaire for test indicator',
          estFavori: true,
          estConfidentiel: true,
        },
      };

      await caller.indicateurs.indicateurs.update(updateData);

      const {
        data: [updatedIndicateur],
      } = await caller.indicateurs.indicateurs.list({
        collectiviteId: collectivite.id,
        filters: {
          indicateurIds: [indicateurId],
        },
      });

      expect(updatedIndicateur).toBeDefined();
      expect(updatedIndicateur.id).toBe(indicateurId);
      expect(updatedIndicateur.commentaire).toBe(
        updateData.indicateurFields.commentaire
      );
      expect(updatedIndicateur.estFavori).toBe(
        updateData.indicateurFields.estFavori
      );
      expect(updatedIndicateur.estConfidentiel).toBe(
        updateData.indicateurFields.estConfidentiel
      );
      expect(updatedIndicateur.modifiedBy).toEqual(
        expect.objectContaining({ id: authenticatedUser.id })
      );
      expect(updatedIndicateur.modifiedAt).toBeDefined();
    });

    test('should not allow updating titre and unite for non-perso indicators', async () => {
      const [indicateurPredefini] = await databaseService.db
        .select()
        .from(indicateurDefinitionTable)
        .where(
          and(
            eq(indicateurDefinitionTable.identifiantReferentiel, 'cae_1.a'),
            isNull(indicateurDefinitionTable.collectiviteId)
          )
        )
        .limit(1);

      expect(indicateurPredefini).toBeDefined();

      // Try to update titre and unite for non-perso indicator
      const updateData: UpdateIndicateurDefinitionInput = {
        indicateurId: indicateurPredefini.id,
        collectiviteId: collectivite.id,
        indicateurFields: {
          titre: 'This should fail',
          unite: 'This should fail too',
        },
      };

      const caller = router.createCaller({ user: authenticatedUser });

      await expect(
        caller.indicateurs.indicateurs.update(updateData)
      ).rejects.toThrow();
    });
  });
});
