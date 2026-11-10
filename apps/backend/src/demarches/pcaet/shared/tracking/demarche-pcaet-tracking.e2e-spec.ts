import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
} from '@tet/backend/test';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import type { TrackedEvent } from '@tet/backend/utils/tracking/event-tracker.interface';
import { TrackingService } from '@tet/backend/utils/tracking/tracking.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { CollectiviteRole } from '@tet/domain/users';
import { onTestFinished, vi } from 'vitest';
import {
  completeTestDossierPcaet,
  publierTestDemarchePcaet,
} from '../../demarches-pcaet.test-fixture';
import { DemarchePcaetEventEnum } from './demarche-pcaet-tracking.constants';

describe('Événements PostHog du dépôt PCAET', () => {
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

  const spyCaptures = () => {
    const spy = vi
      .spyOn(app.get(TrackingService), 'capture')
      .mockImplementation(() => undefined);
    onTestFinished(() => spy.mockRestore());
    return (event: string): TrackedEvent[] =>
      spy.mock.calls
        .map(([params]) => params)
        .filter((params) => params.event === event);
  };

  test('le cycle complet émet ses événements, rattachés à la collectivité', async () => {
    const captured = spyCaptures();
    const { collectivite, user: credentials } =
      await addTestCollectiviteAndUser(db, {
        user: { role: CollectiviteRole.EDITION },
      });
    const user = getAuthUserFromUserCredentials(credentials);
    const caller = router.createCaller({ user });
    const ids = { collectiviteId: collectivite.id };

    const demarche = await caller.demarches.pcaet.create(ids);
    const [creee] = captured(DemarchePcaetEventEnum.CREEE);
    expect(creee).toMatchObject({
      distinctId: user.id,
      groups: { collectivite: String(collectivite.id) },
      properties: {
        demarche_id: demarche.id,
        collectivite_id: collectivite.id,
        demarche_status: 'en_elaboration',
        demarche_obligation: demarche.obligation,
        transmitted_off_platform: false,
        acteur: 'collectivite',
        nb_pilotes: 0,
      },
    });

    // Un dossier incomplet : le refus est capté, avec le guard qui bloque.
    await expect(
      caller.demarches.pcaet.transmettrePourAvis({
        ...ids,
        demarcheId: demarche.id,
      })
    ).rejects.toThrow();
    const [refus] = captured(DemarchePcaetEventEnum.TRANSITION_REFUSEE);
    expect(refus.properties).toMatchObject({
      transition: 'transmettre_pour_avis',
      blocked_by: 'dossierComplet',
      blocked_by_all: ['dossierComplet'],
    });

    await completeTestDossierPcaet(db, { ...ids, demarcheId: demarche.id });
    await caller.demarches.pcaet.transmettrePourAvis({
      ...ids,
      demarcheId: demarche.id,
    });
    expect(captured(DemarchePcaetEventEnum.TRANSITION)[0]).toMatchObject({
      distinctId: user.id,
      properties: {
        transition: 'transmettre_pour_avis',
        from_status: 'en_elaboration',
        to_status: 'transmis_pour_avis',
        demarche_status: 'transmis_pour_avis',
        acteur: 'collectivite',
        jours_dans_statut_precedent: 0,
      },
    });
    expect(
      captured(DemarchePcaetEventEnum.TRANSMISE)[0].properties
    ).toMatchObject({ nb_saisines: expect.any(Number) });

    await publierTestDemarchePcaet(app, db, caller, {
      ...ids,
      demarcheId: demarche.id,
    });

    // La bascule en instruit n'est l'acte de personne : rattachée à la
    // démarche, sans profil de personne.
    const [instruction] = captured(DemarchePcaetEventEnum.INSTRUCTION_CLOSE);
    expect(instruction).toMatchObject({
      distinctId: `demarche:${demarche.id}`,
      groups: { collectivite: String(collectivite.id) },
      properties: {
        raison: 'delai_avis_echu',
        acteur: 'systeme',
        $process_person_profile: false,
      },
    });

    expect(
      captured(DemarchePcaetEventEnum.DOCUMENT_DEPOSE).map(
        ({ properties }) => properties?.document_id
      )
    ).toContain('pcaet_deliberation_adoption');

    expect(
      captured(DemarchePcaetEventEnum.TRANSITION).map(
        ({ properties }) => properties?.transition
      )
    ).toEqual(['transmettre_pour_avis', 'delai_avis_echu', 'publier']);

    expect(captured(DemarchePcaetEventEnum.PUBLIEE)[0]).toMatchObject({
      distinctId: user.id,
      properties: {
        demarche_status: 'publie',
        adopted_year: 2026,
        nb_plans: 1,
      },
    });
  });
});
