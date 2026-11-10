import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import {
  getAuthUserFromUserCredentials,
  getServiceRoleUser,
  getTestApp,
  getTestDatabase,
} from '@tet/backend/test';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import type { TrackedEvent } from '@tet/backend/utils/tracking/event-tracker.interface';
import { TrackingService } from '@tet/backend/utils/tracking/tracking.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { CollectiviteRole } from '@tet/domain/users';
import { onTestFinished, vi } from 'vitest';
import { completeTestDossierPcaet } from '../demarches-pcaet.test-fixture';

describe('Photo quotidienne du stock PCAET', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let db: DatabaseService;

  beforeAll(async () => {
    app = await getTestApp();
    router = app.get(TrpcRouter);
    db = await getTestDatabase(app);
    return async () => {
      await app.close();
    };
  });

  const snapshotOf = (calls: TrackedEvent[], demarcheId: number) =>
    calls.find(
      ({ event, properties }) =>
        event === 'demarches:pcaet:snapshot' &&
        properties?.demarche_id === demarcheId
    );

  test('une ligne par démarche, avec ce qui la retient', async () => {
    const spy = vi
      .spyOn(app.get(TrackingService), 'capture')
      .mockImplementation(() => undefined);
    onTestFinished(() => spy.mockRestore());

    const { collectivite, user } = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.EDITION },
    });
    const caller = router.createCaller({
      user: getAuthUserFromUserCredentials(user),
    });
    const enElaboration = await caller.demarches.pcaet.create({
      collectiviteId: collectivite.id,
    });

    const serviceRole = router.createCaller({ user: getServiceRoleUser() });
    const result = await serviceRole.demarches.pcaet.trackSnapshot({});
    expect(result.echecs).toBe(0);

    const photo = snapshotOf(
      spy.mock.calls.map(([params]) => params),
      enElaboration.id
    );
    expect(photo).toMatchObject({
      distinctId: `demarche:${enElaboration.id}`,
      groups: { collectivite: String(collectivite.id) },
      properties: {
        demarche_status: 'en_elaboration',
        acteur: 'systeme',
        jours_dans_statut: 0,
        nb_plans: 0,
        avis_attendus: 0,
        transitions_atteignables: ['transmettre_pour_avis'],
        bloque_par: ['dossierComplet'],
        $process_person_profile: false,
      },
    });

    // Complété, le dossier n'est plus retenu par rien.
    await completeTestDossierPcaet(db, {
      collectiviteId: collectivite.id,
      demarcheId: enElaboration.id,
    });
    spy.mockClear();
    await serviceRole.demarches.pcaet.trackSnapshot({});
    expect(
      snapshotOf(
        spy.mock.calls.map(([params]) => params),
        enElaboration.id
      )?.properties
    ).toMatchObject({ bloque_par: [], nb_plans: 1, diagnostic_complet: true });
  });

  test('réservée au service role', async () => {
    const { user } = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN },
    });
    const caller = router.createCaller({
      user: getAuthUserFromUserCredentials(user),
    });
    await expect(caller.demarches.pcaet.trackSnapshot({})).rejects.toThrow();
  });
});
