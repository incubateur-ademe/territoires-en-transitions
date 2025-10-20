import { PermissionLevelEnum } from '@/backend/users/authorizations/roles/permission-level.enum';
import { INestApplication } from '@nestjs/common';
import { inferProcedureInput } from '@trpc/server';
import { sql } from 'drizzle-orm';
import { getTestApp } from '../../../test/app-utils';
import { getAuthUser } from '../../../test/auth-utils';
import { YOLO_DODO } from '../../../test/test-users.samples';
import { AuthenticatedUser } from '../../users/models/auth.models';
import { invitationTable } from '../../users/models/invitation.table';
import { DatabaseService } from '../../utils/database/database.service';
import { AppRouter, TrpcRouter } from '../../utils/trpc/trpc.router';
import { MembreFonctionEnum } from '../shared/models/membre-fonction.enum';

type Input = inferProcedureInput<AppRouter['collectivites']['membres']['list']>;

describe('CollectiviteMembresRouter', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let databaseService: DatabaseService;
  let yoloDodoUser: AuthenticatedUser;

  beforeAll(async () => {
    app = await getTestApp();
    router = app.get(TrpcRouter);
    yoloDodoUser = await getAuthUser(YOLO_DODO);

    databaseService = app.get<DatabaseService>(DatabaseService);

    // reset les données avant de commencer les tests
    await databaseService.db.execute(sql`select test_reset_droits()`);
    await databaseService.db.execute(sql`select test_reset_membres()`);
  });

  afterEach(async () => {
    // Réinitialise l'état après chaque test pour éviter les effets de bord
    await databaseService.db.execute(sql`select test_reset_droits()`);
    await databaseService.db.execute(sql`select test_reset_membres()`);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('list', () => {
    test('peut lister les membres de la collectivité et les invitations', async () => {
      const caller = router.createCaller({ user: yoloDodoUser });

      const input: Input = {
        collectiviteId: 1,
        inclureInvitations: true,
      };

      // vérifie le retour avant d'insérer une invitation
      const response = await caller.collectivites.membres.list(input);
      assert(response);
      const result = response.data;
      expect(result).toHaveLength(4); // 4 utilisateurs rattachés à la collectivité
      // et qui ont tous un userId
      expect(result.map((m) => m.userId).filter(Boolean)).toHaveLength(4);
      // et pas de invitationId
      expect(result.map((m) => m.invitationId).filter(Boolean)).toHaveLength(0);

      // ajoute une invitation
      await databaseService.db.insert(invitationTable).values({
        collectiviteId: 1,
        email: 'test@test.com',
        permissionLevel: PermissionLevelEnum.EDITION,
        createdBy: yoloDodoUser.id,
      });

      // refait l'appel
      const response2 = await caller.collectivites.membres.list(input);
      assert(response2);
      const result2 = response2.data;
      expect(result2).toHaveLength(5); // 5 utilisateurs rattachés à la collectivité
      // dont 4 avec un userId
      expect(result2.map((m) => m.userId).filter(Boolean)).toHaveLength(4);
      // et un avec un invitationId
      expect(result2.map((m) => m.invitationId).filter(Boolean)).toHaveLength(
        1
      );
      // la ligne correspondant à l'invitation est en début de liste
      expect(result2[0].invitationId).to.not.be.null;
      expect(result2[0].userId).toBeNull();
      expect(result2[0].niveauAcces).toEqual(PermissionLevelEnum.EDITION);
    });

    test("ne peut pas lister les membres si on n'est pas authentifié", async () => {
      const caller = router.createCaller({ user: null });

      const input: Input = {
        collectiviteId: 1,
      };

      // `rejects` is necessary to handle exception in async function
      // See https://vitest.dev/api/expect.html#tothrowerror
      await expect(() =>
        caller.collectivites.membres.list(input)
      ).rejects.toThrowError(/not authenticated/i);
    });
  });

  describe('update', () => {
    test("en tant qu'admin, peut mettre à jour un utilisateur membre de la collectivité", async () => {
      const caller = router.createCaller({ user: yoloDodoUser });

      const input: Input = {
        collectiviteId: 1,
      };

      // vérifie l'état avant de modifier
      const response = await caller.collectivites.membres.list(input);
      assert(response);
      const result = response.data;
      const yili = result?.find((r) => r.prenom === 'Yili');
      assert(yili);
      expect(yili).toMatchObject({
        prenom: 'Yili',
        nom: 'Didi',
        email: 'yili@didi.com',
        telephone: null,
        niveauAcces: 'edition',
        fonction: 'politique',
        detailsFonction: 'Politique YILI de cette collectivité',
        champIntervention: ['eci', 'cae'],
        invitationId: null,
      });

      // met à jour la fonction et l'intitulé de poste
      await caller.collectivites.membres.update([
        {
          collectiviteId: 1,
          userId: yili.userId,
          fonction: MembreFonctionEnum.CONSEILLER,
          detailsFonction: 'Yili le conseiller',
        },
      ]);

      // vérifie le résultat
      const response3 = await caller.collectivites.membres.list(input);
      assert(response3);
      const result3 = response3.data;
      const yiliModifie = result3?.find((r) => r.prenom === 'Yili');
      expect(yiliModifie).toMatchObject({
        prenom: 'Yili',
        nom: 'Didi',
        email: 'yili@didi.com',
        telephone: null,
        niveauAcces: 'edition',
        fonction: 'conseiller',
        detailsFonction: 'Yili le conseiller',
        champIntervention: ['eci', 'cae'],
        invitationId: null,
      });
    });

    test("ne peut pas modifier le niveau d'accès d'un autre utilisateur sans être admin", async () => {
      const caller = router.createCaller({ user: yoloDodoUser });

      const input: Input = {
        collectiviteId: 2, // yolo n'est pas admin de la collectivité 2
      };

      // vérifie l'état avant de modifier
      const response = await caller.collectivites.membres.list(input);
      assert(response);
      const result = response.data;
      const firstMembre = result?.[0];
      assert(firstMembre);

      // Essaie de modifier le niveau d'accès d'un autre utilisateur
      // yolo n'est pas admin de la collectivité 2, donc il ne peut pas modifier le niveau d'accès
      await expect(
        caller.collectivites.membres.update([
          {
            collectiviteId: 2,
            userId: firstMembre.userId,
            niveauAcces: 'lecture',
          },
        ])
      ).rejects.toThrowError(
        "Vous n'avez pas les droits admin, vous ne pouvez pas éditer le niveau d'accès de ce membre."
      );
    });

    test("ne peut pas modifier les données membre d'un autre utilisateur sans être admin", async () => {
      const caller = router.createCaller({ user: yoloDodoUser });

      const input: Input = {
        collectiviteId: 2, // yolo n'est pas admin de la collectivité 2
      };

      // vérifie l'état avant de modifier
      const response = await caller.collectivites.membres.list(input);
      assert(response);
      const result = response.data;
      const firstMembre = result?.[0];
      assert(firstMembre);

      // Essaie de modifier les données membre d'un autre utilisateur
      // yolo n'est pas admin de la collectivité 2, donc il ne peut pas modifier les données d'un autre membre
      await expect(
        caller.collectivites.membres.update([
          {
            collectiviteId: 2,
            userId: firstMembre.userId,
            fonction: MembreFonctionEnum.CONSEILLER,
            detailsFonction: 'Modification non autorisée',
          },
        ])
      ).rejects.toThrowError(
        "Vous n'avez pas les droits pour modifier les informations de ce membre."
      );
    });

    test("peut modifier ses propres données membre mais pas son niveau d'accès", async () => {
      const caller = router.createCaller({ user: yoloDodoUser });

      const input: Input = {
        collectiviteId: 2, // utilise la collectivité 2 pour tester l'auto-modification
      };

      // vérifie l'état avant de modifier
      const response = await caller.collectivites.membres.list(input);
      assert(response);
      const result = response.data;
      const yolo = result?.find((r) => r.prenom === 'Yolo');
      assert(yolo);

      // Modifie ses propres données membre (cela devrait fonctionner)
      await caller.collectivites.membres.update([
        {
          collectiviteId: 2,
          userId: yolo.userId,
          fonction: MembreFonctionEnum.CONSEILLER,
          detailsFonction: 'Yolo le conseiller',
        },
      ]);

      // vérifie le résultat
      const response2 = await caller.collectivites.membres.list(input);
      assert(response2);
      const result2 = response2.data;
      const yoloModifie = result2?.find((r) => r.prenom === 'Yolo');
      expect(yoloModifie).toMatchObject({
        prenom: 'Yolo',
        nom: 'Dodo',
        email: 'yolo@dodo.com',
        fonction: 'conseiller',
        detailsFonction: 'Yolo le conseiller',
      });

      // Essaie de modifier son propre niveau d'accès (cela devrait échouer)
      await expect(
        caller.collectivites.membres.update([
          {
            collectiviteId: 2,
            userId: yolo.userId,
            niveauAcces: 'lecture',
          },
        ])
      ).rejects.toThrowError(
        "Vous n'avez pas les droits admin, vous ne pouvez pas éditer le niveau d'accès de ce membre."
      );
    });

    test("en tant qu'admin, peut modifier le niveau d'accès et les données membre", async () => {
      const caller = router.createCaller({ user: yoloDodoUser });

      const input: Input = {
        collectiviteId: 1, // yolo est admin de la collectivité 1
      };

      // vérifie l'état avant de modifier
      const response = await caller.collectivites.membres.list(input);
      assert(response);
      const result = response.data;
      const yili = result?.find((r) => r.prenom === 'Yili');
      assert(yili);

      // Modifie à la fois le niveau d'accès et les données membre
      await caller.collectivites.membres.update([
        {
          collectiviteId: 1,
          userId: yili.userId,
          niveauAcces: 'lecture',
          fonction: MembreFonctionEnum.CONSEILLER,
          detailsFonction: 'Modification par admin',
        },
      ]);

      // vérifie le résultat
      const response2 = await caller.collectivites.membres.list(input);
      assert(response2);
      const result2 = response2.data;
      const yiliModifie = result2?.find((r) => r.prenom === 'Yili');
      expect(yiliModifie).toMatchObject({
        prenom: 'Yili',
        nom: 'Didi',
        email: 'yili@didi.com',
        niveauAcces: 'lecture',
        fonction: 'conseiller',
        detailsFonction: 'Modification par admin',
      });
    });
  });

  describe('remove', () => {
    test("peut supprimer un membre en tant qu'admin", async () => {
      const caller = router.createCaller({ user: yoloDodoUser });

      // Vérifie l'état avant suppression
      const responseBefore = await caller.collectivites.membres.list({
        collectiviteId: 1,
      });
      assert(responseBefore);
      const resultBefore = responseBefore.data;
      const yili = resultBefore?.find((r) => r.prenom === 'Yili');
      assert(yili);
      expect(yili).toBeDefined();

      // Supprime le membre
      const removeResult = await caller.collectivites.membres.remove({
        collectiviteId: 1,
        email: 'yili@didi.com',
      });

      expect(removeResult).toEqual({
        message: "Les accès de l'utilisateur ont été supprimés.",
      });

      // Vérifie que le membre n'apparaît plus dans la liste
      const responseAfter = await caller.collectivites.membres.list({
        collectiviteId: 1,
      });
      assert(responseAfter);
      const resultAfter = responseAfter.data;
      const yiliAfter = resultAfter?.find((r) => r.prenom === 'Yili');
      expect(yiliAfter).toBeUndefined();

      // Vérifie que le nombre total de membres a diminué
      expect(resultAfter).toHaveLength(resultBefore.length - 1);

      // onTestFinished(async () => {
      //   await unsetActive(databaseService, yoloDodoUser.id, 1);
      // });
    });

    test("peut supprimer l'invitation qu'il a créée en tant qu'utilisateur non-admin", async () => {
      const caller = router.createCaller({ user: yoloDodoUser });

      // Un utilisateur non-admin crée une invitation
      await databaseService.db.insert(invitationTable).values({
        collectiviteId: 1,
        email: 'test-self-removal@test.com',
        permissionLevel: PermissionLevelEnum.LECTURE,
        createdBy: yoloDodoUser.id,
      });

      // Vérifie que l'invitation existe
      const responseBefore = await caller.collectivites.membres.list({
        collectiviteId: 1,
        inclureInvitations: true,
      });
      assert(responseBefore);
      const resultBefore = responseBefore.data;
      const invitation = resultBefore?.find(
        (r) => r.email === 'test-self-removal@test.com'
      );
      expect(invitation).toBeDefined();
      expect(invitation?.invitationId).toBeDefined();

      // Supprime l'invitation (simulation d'un utilisateur qui supprime l'invitation qu'il a créée)
      const removeResult = await caller.collectivites.membres.remove({
        collectiviteId: 1,
        email: 'test-self-removal@test.com',
      });

      expect(removeResult).toEqual({
        message: "L'invitation a été supprimée.",
      });

      // Vérifie que l'invitation n'apparaît plus dans la liste
      const responseAfter = await caller.collectivites.membres.list({
        collectiviteId: 1,
        inclureInvitations: true,
      });
      assert(responseAfter);
      const resultAfter = responseAfter.data;
      const invitationAfter = resultAfter?.find(
        (r) => r.email === 'test-self-removal@test.com'
      );
      expect(invitationAfter).toBeUndefined();
    });

    test('ne peut pas supprimer un membre sans être admin ou le membre lui-même', async () => {
      const caller = router.createCaller({ user: yoloDodoUser });

      // yolo n'est pas admin de la collectivité 2
      await expect(
        caller.collectivites.membres.remove({
          collectiviteId: 2,
          email: 'yili@didi.com',
        })
      ).rejects.toThrowError(
        "Vous n'avez pas les droits admin, vous ne pouvez pas retirer les droits d'accès d'un utilisateur"
      );
    });

    test("lève une erreur si l'utilisateur n'existe pas dans la collectivité", async () => {
      const caller = router.createCaller({ user: yoloDodoUser });

      // Essaie de supprimer un utilisateur qui n'existe pas
      await expect(
        caller.collectivites.membres.remove({
          collectiviteId: 1,
          email: 'nonexistent@test.com',
        })
      ).rejects.toThrowError(
        "Cet utilisateur n'est pas membre de la collectivité ou n'a pas d'invitation en attente."
      );
    });

    test('peut supprimer se supprimer en tant que membre', async () => {
      const caller = router.createCaller({ user: yoloDodoUser });

      // Vérifie l'état avant suppression d'un membre avec des données complètes
      const responseBefore = await caller.collectivites.membres.list({
        collectiviteId: 1,
      });
      assert(responseBefore);
      const resultBefore = responseBefore.data;
      const yolo = resultBefore?.find((r) => r.prenom === 'Yolo');
      assert(yolo);
      expect(yolo).toMatchObject({
        prenom: 'Yolo',
        nom: 'Dodo',
        email: 'yolo@dodo.com',
      });

      // Supprime le membre
      const removeResult = await caller.collectivites.membres.remove({
        collectiviteId: 1,
        email: 'yolo@dodo.com',
      });

      expect(removeResult).toEqual({
        message: "Les accès de l'utilisateur ont été supprimés.",
      });

      // Vérifie que le membre n'apparaît plus dans la liste
      const responseAfter = await caller.collectivites.membres.list({
        collectiviteId: 1,
      });
      assert(responseAfter);
      const resultAfter = responseAfter.data;
      const yoloAfter = resultAfter?.find((r) => r.prenom === 'Yolo');
      expect(yoloAfter).toBeUndefined();
    });

    test('peut supprimer une invitation en attente', async () => {
      const caller = router.createCaller({ user: yoloDodoUser });

      // Crée une invitation
      await databaseService.db.insert(invitationTable).values({
        collectiviteId: 1,
        email: 'invitation-to-remove@test.com',
        permissionLevel: PermissionLevelEnum.EDITION,
        createdBy: yoloDodoUser.id,
      });

      // Vérifie que l'invitation existe
      const responseBefore = await caller.collectivites.membres.list({
        collectiviteId: 1,
        inclureInvitations: true,
      });
      assert(responseBefore);
      const resultBefore = responseBefore.data;
      const invitation = resultBefore?.find(
        (r) => r.email === 'invitation-to-remove@test.com'
      );
      expect(invitation).toBeDefined();
      expect(invitation?.invitationId).toBeDefined();

      // Supprime l'invitation
      const removeResult = await caller.collectivites.membres.remove({
        collectiviteId: 1,
        email: 'invitation-to-remove@test.com',
      });

      expect(removeResult).toEqual({
        message: "L'invitation a été supprimée.",
      });

      // Vérifie que l'invitation n'apparaît plus dans la liste
      const responseAfter = await caller.collectivites.membres.list({
        collectiviteId: 1,
        inclureInvitations: true,
      });
      assert(responseAfter);
      const resultAfter = responseAfter.data;
      const invitationAfter = resultAfter?.find(
        (r) => r.email === 'invitation-to-remove@test.com'
      );
      expect(invitationAfter).toBeUndefined();
    });
  });
});
