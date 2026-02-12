import { INestApplication } from '@nestjs/common';
import {
  getAuthUserFromDcp,
  getTestApp,
  getTestDatabase,
} from '@tet/backend/test';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { CollectiviteRole, defaultUserPreferences } from '@tet/domain/users';
import { addTestUser } from '../users/users.test-fixture';
import { UserPreferencesRouter } from './user-preferences.router';

describe('UserPreferencesRouter', () => {
  let app: INestApplication;
  let userPreferencesRouter: UserPreferencesRouter;
  let dbService: DatabaseService;

  beforeAll(async () => {
    app = await getTestApp();
    dbService = await getTestDatabase(app);
    userPreferencesRouter = app.get(UserPreferencesRouter);
  });

  afterAll(async () => {
    await app.close();
  });

  test("Lire et mettre à jour les préférences de l'utilisateur", async () => {
    const { user, cleanup } = await addTestUser(dbService, {
      accessLevel: CollectiviteRole.EDITION,
    });
    onTestFinished(() => cleanup());

    const authUser = getAuthUserFromDcp(user);
    const caller = userPreferencesRouter.router.createCaller({
      user: authUser,
    });

    // les préférences par défaut sont retournées pour un nouvel utilisateur
    const initialPreferences = await caller.get();
    expect(initialPreferences).toBeDefined();
    expect(initialPreferences).toMatchObject(defaultUserPreferences);

    // met à jour les préférences (différentes des prefs par défaut)
    const input = {
      utils: {
        notifications: {
          isNotifyPiloteActionEnabled: false,
          isNotifyPiloteSousActionEnabled: false,
        },
      },
    };
    expect(input).not.toMatchObject(defaultUserPreferences);
    const result = await caller.update(input);
    expect(result).toMatchObject(input);

    // vérifie que les préférences ont bien été mises à jour
    const preferences = await caller.get();
    expect(preferences).toBeDefined();
    expect(preferences).toMatchObject(input);

    // restaure les préférences par défaut
    await caller.update(defaultUserPreferences);
    const resetedPrefs = await caller.get();
    expect(resetedPrefs).toMatchObject(defaultUserPreferences);
  });

  test("Mettre à jour une seule préférence de l'utilisateur", async () => {
    const { user, cleanup } = await addTestUser(dbService, {
      accessLevel: CollectiviteRole.EDITION,
    });
    onTestFinished(() => cleanup());

    const authUser = getAuthUserFromDcp(user);
    const caller = userPreferencesRouter.router.createCaller({
      user: authUser,
    });

    // les préférences par défaut sont retournées pour un nouvel utilisateur
    const initialPreferences = await caller.get();
    expect(initialPreferences).toBeDefined();
    expect(
      initialPreferences.utils.notifications.isNotifyPiloteActionEnabled
    ).toBe(true);

    await caller.updateFlat({
      'utils.notifications.isNotifyPiloteActionEnabled': false,
    });

    const preferences = await caller.get();
    expect(preferences).toBeDefined();
    expect(preferences.utils.notifications.isNotifyPiloteActionEnabled).toBe(
      false
    );
  });

  test('Essayer de mettre à jour une préférence avec une valeur du mauvais type déclenche une erreur', async () => {
    const { user, cleanup } = await addTestUser(dbService, {
      accessLevel: CollectiviteRole.EDITION,
    });
    onTestFinished(() => cleanup());

    const authUser = getAuthUserFromDcp(user);
    const caller = userPreferencesRouter.router.createCaller({
      user: authUser,
    });

    await expect(() =>
      caller.updateFlat({
        'utils.notifications.isNotifyPiloteActionEnabled': null,
      })
    ).rejects.toThrowError();
  });

  test('Essayer de mettre à jour une préférence avec une clé inconnue déclenche une erreur', async () => {
    const { user, cleanup } = await addTestUser(dbService, {
      accessLevel: CollectiviteRole.EDITION,
    });
    onTestFinished(() => cleanup());

    const authUser = getAuthUserFromDcp(user);
    const caller = userPreferencesRouter.router.createCaller({
      user: authUser,
    });

    await expect(() =>
      caller.updateFlat({
        // @ts-expect-error ignore l'erreur de typage sur la clé non valide
        'unknown.key.path': false,
      })
    ).rejects.toThrowError();
  });
});
