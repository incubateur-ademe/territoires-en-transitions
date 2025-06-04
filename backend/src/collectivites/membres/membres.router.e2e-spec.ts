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

  afterAll(async () => {
    await app.close();
  });

  test('peut lister les membres de la collectivité et les invitations', async () => {
    const caller = router.createCaller({ user: yoloDodoUser });

    const input: Input = {
      collectiviteId: 1,
      inclureInvitations: true,
    };

    // vérifie le retour avant d'insérer une invitation
    const result = await caller.collectivites.membres.list(input);
    assert(result);
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
    const result2 = await caller.collectivites.membres.list(input);
    assert(result2);
    expect(result2).toHaveLength(5); // 5 utilisateurs rattachés à la collectivité
    // dont 4 avec un userId
    expect(result2.map((m) => m.userId).filter(Boolean)).toHaveLength(4);
    // et un avec un invitationId
    expect(result2.map((m) => m.invitationId).filter(Boolean)).toHaveLength(1);
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

  test('peut mettre à jour un utilisateur', async () => {
    const caller = router.createCaller({ user: yoloDodoUser });

    const input: Input = {
      collectiviteId: 1,
    };

    // vérifie l'état avant de modifier
    const result = await caller.collectivites.membres.list(input);
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
    const result3 = await caller.collectivites.membres.list(input);
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
});
