import { inferProcedureInput } from '@trpc/server';
import { getTestRouter } from '../../../test/app-utils';
import { getAuthUser } from '../../../test/auth-utils';
import { getCollectiviteIdBySiren } from '../../../test/collectivites-utils';
import { AppRouter, TrpcRouter } from '../../utils/trpc/trpc.router';
import { ActionScoreType } from '../models/action-score.dto';
import { referentielIdEnumSchema } from '../models/referentiel.enum';
import { AuthenticatedUser } from './../../auth/models/auth.models';

type Input = inferProcedureInput<
  AppRouter['referentiels']['actions']['updateStatut']
>;

describe('UpdateActionStatutRouter', () => {
  let router: TrpcRouter;
  let yoloDodoUser: AuthenticatedUser;
  let rhoneAggloCollectiviteId: number;

  beforeAll(async () => {
    router = await getTestRouter();
    yoloDodoUser = await getAuthUser();
    rhoneAggloCollectiviteId = await getCollectiviteIdBySiren('200072015');
  });

  test('not authenticated', async () => {
    const caller = router.createCaller({ user: null });

    const input: Input = {
      actionStatut: {
        collectiviteId: 1,
        actionId: 'cae_1.1.1.2',
        avancement: 'detaille',
        avancementDetaille: [1, 0, 0],
        concerne: true,
      },
    };

    // `rejects` is necessary to handle exception in async function
    // See https://vitest.dev/api/expect.html#tothrowerror
    await expect(() =>
      caller.referentiels.actions.updateStatut(input)
    ).rejects.toThrowError(/not authenticated/i);
  });

  test('not authorized: accès en lecture uniquement', async () => {
    const caller = router.createCaller({ user: yoloDodoUser });

    const input: Input = {
      actionStatut: {
        collectiviteId: rhoneAggloCollectiviteId,
        actionId: 'cae_1.1.1.2',
        avancement: 'detaille',
        avancementDetaille: [1, 0, 0],
        concerne: true,
      },
    };

    // `rejects` is necessary to handle exception in async function
    // See https://vitest.dev/api/expect.html#tothrowerror
    await expect(() =>
      caller.referentiels.actions.updateStatut(input)
    ).rejects.toThrowError(/Droits insuffisants/i);
  });

  test('Action inexistante', async () => {
    const caller = router.createCaller({ user: yoloDodoUser });

    const input: Input = {
      actionStatut: {
        collectiviteId: 1,
        actionId: 'cae_1.1.1.11',
        avancement: 'detaille',
        avancementDetaille: [1, 0, 0],
        concerne: true,
      },
    };

    // `rejects` is necessary to handle exception in async function
    // See https://vitest.dev/api/expect.html#tothrowerror
    await expect(() =>
      caller.referentiels.actions.updateStatut(input)
    ).rejects.toThrowError(
      "L'action cae_1.1.1.11 n'existe pas pour le referentiel cae"
    );
  });

  test("Mise à jour du score courant lors de la mise à jour du statut d'une action", async () => {
    const caller = router.createCaller({ user: yoloDodoUser });

    const input: Input = {
      actionStatut: {
        collectiviteId: 1,
        actionId: 'cae_1.1.1.1.2',
        avancement: 'detaille',
        avancementDetaille: [1, 0, 0],
        concerne: true,
      },
    };

    const currentFullScoreStatutUpdateResponse =
      await caller.referentiels.actions.updateStatut(input);

    const expectedCaeRootScoreAfterStatutUpdate: ActionScoreType = {
      actionId: 'cae',
      etoiles: 1,
      pointReferentiel: 500,
      pointPotentiel: 490.9,
      pointPotentielPerso: null,
      pointFait: 0.6,
      pointPasFait: 0,
      pointNonRenseigne: 490.3,
      pointProgramme: 0,
      concerne: true,
      completedTachesCount: 2,
      totalTachesCount: 1111,
      faitTachesAvancement: 2,
      programmeTachesAvancement: 0,
      pasFaitTachesAvancement: 0,
      pasConcerneTachesAvancement: 0,
      desactive: false,
      renseigne: false,
    };
    expect(currentFullScoreStatutUpdateResponse.scores.score).toEqual(
      expectedCaeRootScoreAfterStatutUpdate
    );

    // Check that the current score has been correctly updated & saved
    const currentFullCurentScore =
      await caller.referentiels.snapshots.getCurrentFullScore({
        referentielId: referentielIdEnumSchema.enum.cae,
        collectiviteId: 1,
      });
    expect(currentFullCurentScore.scores.score).toEqual(
      expectedCaeRootScoreAfterStatutUpdate
    );

    // Restore the previous state
    const actionNonFaite: Input = {
      actionStatut: {
        collectiviteId: 1,
        actionId: 'cae_1.1.1.1.2',
        avancement: 'detaille',
        avancementDetaille: [0.2, 0.7, 0.1],
        concerne: true,
      },
    };

    const currentFullScoreStatutRestoreResponse =
      await caller.referentiels.actions.updateStatut(actionNonFaite);

    const expectedCaeRootScoreAfterStatutRestore: ActionScoreType = {
      actionId: 'cae',
      etoiles: 1,
      pointReferentiel: 500,
      pointPotentiel: 490.9,
      pointPotentielPerso: null,
      pointFait: 0.36,
      pointPasFait: 0.03,
      pointNonRenseigne: 490.3,
      pointProgramme: 0.21,
      concerne: true,
      completedTachesCount: 2,
      totalTachesCount: 1111,
      faitTachesAvancement: 1.2,
      programmeTachesAvancement: 0.7,
      pasFaitTachesAvancement: 0.1,
      pasConcerneTachesAvancement: 0,
      desactive: false,
      renseigne: false,
    };
    expect(currentFullScoreStatutRestoreResponse.scores.score).toEqual(
      expectedCaeRootScoreAfterStatutRestore
    );
  });
});
