import { expect } from '@playwright/test';
import {
  AuditLabellisationReferentielId,
  ObjetPreuveEnum,
  ROLE_IDENTIFIANTS,
  toActionId,
} from '@tet/domain/referentiels';
import { testWithReferentiels as test } from '../referentiels.fixture';

const referentiel: AuditLabellisationReferentielId = 'cae';

const ELU_REFERENT_TACHE = toActionId(
  referentiel,
  ROLE_IDENTIFIANTS[referentiel].eluReferent
);

test.describe("Demande 1ère étoile — l'API exige la désignation des référents", () => {
  test.beforeEach(async ({ collectivites }) => {
    const { collectivite, user } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });
    await user.precomputeReferentielSnapshot(collectivite.data.id, referentiel);
  });

  test('rejette la demande envoyée hors interface tant que les référents sont sans pilote', async ({
    collectivites,
    referentiels,
  }) => {
    const collectivite = collectivites.getCollectivite();
    const user = collectivite.getUser(0);
    const collectiviteId = collectivite.data.id;

    await referentiels.updateAllNeedReferentielStatutsToCompleteReferentiel(
      user,
      collectiviteId,
      referentiel
    );
    await referentiels.updateAllNeedReferentielStatutsToMatchReferentielScoreCriteria(
      user,
      collectiviteId,
      referentiel
    );
    await referentiels.updateActionStatut(user, {
      collectiviteId,
      actionId: ELU_REFERENT_TACHE,
      statut: 'fait',
    });
    await referentiels.seedLabellisationPreuve(
      user,
      collectiviteId,
      referentiel,
      ObjetPreuveEnum.ACTE_ENGAGEMENT
    );

    await expect(
      referentiels.requestLabellisationAudit(user, collectiviteId, referentiel)
    ).rejects.toThrow(/référent/i);

    await referentiels.seedRolePilotes(user, collectiviteId, referentiel);

    await expect(
      referentiels.requestLabellisationAudit(user, collectiviteId, referentiel)
    ).resolves.toBeUndefined();
  });
});
