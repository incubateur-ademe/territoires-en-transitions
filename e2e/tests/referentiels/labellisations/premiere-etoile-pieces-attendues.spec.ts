import { expect } from '@playwright/test';
import { ObjetPreuveEnum, ReferentielId } from '@tet/domain/referentiels';
import { testWithReferentiels as test } from '../referentiels.fixture';

const referentiel: ReferentielId = 'cae';

test.describe('Demande de premiere etoile — pieces attendues', () => {
  test.beforeEach(async ({ collectivites, referentiels }) => {
    const { collectivite, user } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });
    await user.precomputeReferentielSnapshot(collectivite.data.id, referentiel);
    await referentiels.updateAllReferentielStatutsToFait(
      user,
      collectivite.data.id,
      referentiel
    );
    await referentiels.seedRolePilotes(user, collectivite.data.id, referentiel);
  });

  test("l'acte seul suffit, meme quand le score rend la labellisation accessible", async ({
    auditLabellisationPom,
    collectivites,
    referentiels,
  }) => {
    const collectivite = collectivites.getCollectivite();
    await referentiels.seedLabellisationPreuve(
      collectivite.getUser(0),
      collectivite.data.id,
      referentiel,
      ObjetPreuveEnum.ACTE_ENGAGEMENT
    );

    await auditLabellisationPom.goto(collectivite.data.id, referentiel);

    await expect(
      auditLabellisationPom.demanderPremiereEtoileButton
    ).toBeEnabled();
  });

  test('le seul dossier de candidature ne suffit pas', async ({
    auditLabellisationPom,
    collectivites,
    referentiels,
  }) => {
    const collectivite = collectivites.getCollectivite();
    await referentiels.seedLabellisationPreuve(
      collectivite.getUser(0),
      collectivite.data.id,
      referentiel,
      ObjetPreuveEnum.CANDIDATURE
    );

    await auditLabellisationPom.goto(collectivite.data.id, referentiel);

    await expect(
      auditLabellisationPom.demanderPremiereEtoileButton
    ).toBeDisabled();
  });

  test('les deux pieces deposees ouvrent aussi la demande', async ({
    auditLabellisationPom,
    collectivites,
    referentiels,
  }) => {
    const collectivite = collectivites.getCollectivite();
    await referentiels.seedLabellisationPreuve(
      collectivite.getUser(0),
      collectivite.data.id,
      referentiel,
      ObjetPreuveEnum.ACTE_ENGAGEMENT
    );
    await referentiels.seedLabellisationPreuve(
      collectivite.getUser(0),
      collectivite.data.id,
      referentiel,
      ObjetPreuveEnum.CANDIDATURE
    );

    await auditLabellisationPom.goto(collectivite.data.id, referentiel);

    await expect(
      auditLabellisationPom.demanderPremiereEtoileButton
    ).toBeEnabled();
  });
});
