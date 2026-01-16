import { INestApplication } from '@nestjs/common';
import { getAuthUser, getTestApp, YOLO_DODO } from '@tet/backend/test';
import { UsersRouter } from '@tet/backend/users/users.router';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { AppRouter } from '@tet/backend/utils/trpc/trpc.router';
import { inferProcedureInput } from '@trpc/server';
import { eq } from 'drizzle-orm';
import { AuthenticatedUser } from '../../models/auth.models';
import { dcpTable } from '../../models/dcp.table';

type Input = inferProcedureInput<AppRouter['users']['users']['update']>;

describe('UserRouter', () => {
  let app: INestApplication;
  let userRouter: UsersRouter;
  let databaseService: DatabaseService;
  let yoloDodoUser: AuthenticatedUser;

  async function getUserFromDb(userId: string) {
    return databaseService.db
      .select()
      .from(dcpTable)
      .where(eq(dcpTable.id, userId))
      .then((res) => res[0]);
  }

  beforeAll(async () => {
    app = await getTestApp();
    userRouter = app.get(UsersRouter);
    yoloDodoUser = await getAuthUser(YOLO_DODO);
    databaseService = app.get<DatabaseService>(DatabaseService);
  });

  afterAll(async () => {
    await app.close();
  });

  test("Modification email et autres informations de l'utilisateur", async () => {
    const caller = userRouter.createCaller({ user: yoloDodoUser });

    const initialUserInfo = await getUserFromDb(yoloDodoUser.id);

    const input: Input = {
      prenom: 'Bernard',
      nom: 'Dupont',
      telephone: '+33666666666',
    };

    // change les infos une première fois
    await caller.users.update(input);

    const user = await getUserFromDb(yoloDodoUser.id);

    expect(user).toBeDefined();
    expect(user.prenom).toBe(input.prenom);
    expect(user.nom).toBe(input.nom);
    expect(user.telephone).toBe(input.telephone);

    // reset les infos
    await caller.users.update({
      prenom: initialUserInfo.prenom,
      nom: initialUserInfo.nom,
      telephone: initialUserInfo.telephone as string,
    });

    const userReseted = await getUserFromDb(yoloDodoUser.id);

    expect(userReseted.prenom).toBe(initialUserInfo.prenom);
    expect(userReseted.nom).toBe(initialUserInfo.nom);
    expect(userReseted.telephone).toBe(initialUserInfo.telephone);
  });
});
