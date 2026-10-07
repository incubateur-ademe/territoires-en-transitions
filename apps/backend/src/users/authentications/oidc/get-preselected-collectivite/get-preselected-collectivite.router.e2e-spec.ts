import { INestApplication } from '@nestjs/common';
import {
  addTestCollectivite,
  addTestCollectiviteAndUser,
} from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '@tet/backend/test';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { eq } from 'drizzle-orm';
import { onTestFinished } from 'vitest';
import { utilisateurIdentiteOidcTable } from '../models/utilisateur-identite-oidc.table';

describe('GetPreselectedCollectiviteRouter — pré-sélection par SIRET ProConnect (U5)', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let databaseService: DatabaseService;

  beforeAll(async () => {
    app = await getTestApp();
    router = await getTestRouter(app);
    databaseService = await getTestDatabase(app);

    return async () => {
      await app.close();
    };
  });

  /**
   * Une seconde collectivité sur le même SIREN, distinguée par son NIC : le cas
   * des directions régionales de l'ADEME, qui partagent celui de l'ADEME.
   */
  async function addCollectiviteAvecSiret(siren: string, nic: string) {
    const { collectivite, cleanup } = await addTestCollectivite(
      databaseService,
      { siren, nic }
    );
    onTestFinished(cleanup);
    return collectivite;
  }

  async function creerContexte(siren: string | null, nic?: string) {
    const { user, collectivite, cleanup } = await addTestCollectiviteAndUser(
      databaseService
    );
    onTestFinished(cleanup);

    // Fixe le SIREN de la collectivité de test à une valeur connue (ou null).
    await databaseService.db
      .update(collectiviteTable)
      .set({ siren, nic: nic ?? null })
      .where(eq(collectiviteTable.id, collectivite.id));

    return {
      user,
      collectivite,
      authUser: getAuthUserFromUserCredentials(user),
    };
  }

  async function lierIdentiteAvecSiret(userId: string, siret: string | null) {
    await databaseService.db.insert(utilisateurIdentiteOidcTable).values({
      provider: 'proconnect',
      sub: `sub-${crypto.randomUUID()}`,
      userId,
      email: 'agent@collectivite.fr',
      siret,
    });
  }

  test('siret ProConnect correspondant à une collectivité unique → pré-sélection', async () => {
    const siren = '210900011';
    const { user, collectivite, authUser } = await creerContexte(siren);
    await lierIdentiteAvecSiret(user.id, `${siren}00019`);

    const caller = router.createCaller({ user: authUser });
    const preselection =
      await caller.users.authentications.oidc.getPreselectedCollectivite();

    expect(preselection).toMatchObject({
      collectiviteId: collectivite.id,
      siret: `${siren}00019`,
    });
  });

  /**
   * Le rapprochement va au plus précis : sur le SIREN seul, ces deux
   * collectivités seraient deux réponses et il n'y en aurait aucune.
   */
  test('siren partagé par deux collectivités → le NIC tranche', async () => {
    // Un SIREN fictif : celui de l'ADEME, que ce cas décrit, est en base — les
    // dix-sept DR ADEME le portent, et le rapprochement les trouverait.
    const siren = '999888777';
    const { user, collectivite, authUser } = await creerContexte(
      siren,
      '00397'
    );
    const soeur = await addCollectiviteAvecSiret(siren, '00504');
    await lierIdentiteAvecSiret(user.id, `${siren}00397`);

    const caller = router.createCaller({ user: authUser });
    const preselection =
      await caller.users.authentications.oidc.getPreselectedCollectivite();

    expect(preselection).toMatchObject({ collectiviteId: collectivite.id });
    expect(preselection?.collectiviteId).not.toBe(soeur.id);
  });

  /** Le NIC ne correspond à personne, et le SIREN à plus d'une : on renonce. */
  test('siren partagé et NIC inconnu → pas de pré-sélection', async () => {
    const siren = '999888666';
    const { user, authUser } = await creerContexte(siren, '00397');
    await addCollectiviteAvecSiret(siren, '00504');
    await lierIdentiteAvecSiret(user.id, `${siren}00611`);

    const caller = router.createCaller({ user: authUser });
    expect(
      await caller.users.authentications.oidc.getPreselectedCollectivite()
    ).toBeNull();
  });

  /**
   * Le classeur de l'ADEME donne le NIC du siège : un agent dont ProConnect
   * renvoie une autre implantation de la même DREAL doit quand même la
   * retrouver.
   */
  test('NIC inconnu mais SIREN unique → pré-sélection par le SIREN', async () => {
    const siren = '999888555';
    const { user, collectivite, authUser } = await creerContexte(
      siren,
      '00011'
    );
    await lierIdentiteAvecSiret(user.id, `${siren}00078`);

    const caller = router.createCaller({ user: authUser });
    expect(
      await caller.users.authentications.oidc.getPreselectedCollectivite()
    ).toMatchObject({ collectiviteId: collectivite.id });
  });

  test('siret mal formé → pas de pré-sélection', async () => {
    const { user, authUser } = await creerContexte('210900011');
    await lierIdentiteAvecSiret(user.id, '210900011');

    const caller = router.createCaller({ user: authUser });
    expect(
      await caller.users.authentications.oidc.getPreselectedCollectivite()
    ).toBeNull();
  });

  test('aucune identité avec siret → pas de pré-sélection', async () => {
    const { user, authUser } = await creerContexte('210900011');
    await lierIdentiteAvecSiret(user.id, null);

    const caller = router.createCaller({ user: authUser });
    expect(
      await caller.users.authentications.oidc.getPreselectedCollectivite()
    ).toBeNull();
  });

  test('siret sans collectivité correspondante → pas de pré-sélection', async () => {
    const { user, authUser } = await creerContexte('210900011');
    // SIREN du siret différent de celui de la collectivité.
    await lierIdentiteAvecSiret(user.id, '99999999900019');

    const caller = router.createCaller({ user: authUser });
    expect(
      await caller.users.authentications.oidc.getPreselectedCollectivite()
    ).toBeNull();
  });
});
