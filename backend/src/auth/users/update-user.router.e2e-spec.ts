import { dcpTable } from '@/backend/auth/index-domain';
import { EmailAlreadyUsedError } from '@/backend/auth/users/update-user.service';
import { UsersRouter } from '@/backend/auth/users/users.router';
import { INestApplication } from '@nestjs/common';
import { inferProcedureInput } from '@trpc/server';
import { eq } from 'drizzle-orm';
import { getTestApp } from '../../../test/app-utils';
import { getAuthUser } from '../../../test/auth-utils';
import { YOLO_DODO } from '../../../test/test-users.samples';
import { DatabaseService } from '../../utils/database/database.service';
import { AppRouter } from '../../utils/trpc/trpc.router';
import { AuthenticatedUser } from '../models/auth.models';

type Input = inferProcedureInput<AppRouter['utilisateurs']['update']>;

describe('UserRouter', () => {
  let app: INestApplication;
  let userRouter: UsersRouter;
  let databaseService: DatabaseService;
  let yoloDodoUser: AuthenticatedUser;

  async function getUserFromDb(userId: string) {
    return databaseService.db
      .select()
      .from(dcpTable)
      .where(eq(dcpTable.userId, userId))
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
      email: 'bernard@dupont.com',
      prenom: 'Bernard',
      nom: 'Dupont',
      telephone: '+33666666666',
    };

    // change les infos une première fois
    await caller.update(input);

    const user = await getUserFromDb(yoloDodoUser.id);

    expect(user).toBeDefined();
    expect(user.email).toBe(input.email);
    expect(user.prenom).toBe(input.prenom);
    expect(user.nom).toBe(input.nom);
    expect(user.telephone).toBe(input.telephone);

    // reset les infos
    await caller.update({
      email: initialUserInfo.email,
      prenom: initialUserInfo.prenom,
      nom: initialUserInfo.nom,
      telephone: initialUserInfo.telephone as string,
    });

    const userReseted = await getUserFromDb(yoloDodoUser.id);

    expect(userReseted.email).toBe(initialUserInfo.email);
    expect(userReseted.prenom).toBe(initialUserInfo.prenom);
    expect(userReseted.nom).toBe(initialUserInfo.nom);
    expect(userReseted.telephone).toBe(initialUserInfo.telephone);
  });

  test('Modification email avec un email déjà utilisé', async () => {
    const caller = userRouter.createCaller({ user: yoloDodoUser });

    const input: Input = {
      email: 'yulu@dudu.com',
    };

    await expect(caller.update(input)).rejects.toThrow(
      new EmailAlreadyUsedError().message
    );
  });
});
