import { expect } from '@playwright/test';
import { ReferentielId } from '@tet/domain/referentiels';
import { enableOidcFront } from 'tests/users/authentications/login-user-with-oidc.helpers';
import { testWithReferentiels as test } from '../referentiels.fixture';

const referentiel: ReferentielId = 'eci';

test.describe('Checklist audit et labellisation — téléchargement des documents', () => {
  test("télécharge l'acte d'engagement déposé depuis la checklist", async ({
    collectivites,
    referentiels,
    auditLabellisationPom,
    page,
  }) => {
    await enableOidcFront(page, { hasLinkedIdentity: true });

    const { collectivite, user: editeurUser } =
      await collectivites.addCollectiviteAndUser({
        userArgs: { autoLogin: true },
      });
    const collectiviteId = collectivite.data.id;
    await editeurUser.precomputeReferentielSnapshot(
      collectiviteId,
      referentiel
    );
    await referentiels.updateAllReferentielStatutsToFait(
      editeurUser,
      collectiviteId,
      referentiel
    );
    await referentiels.seedRolePilotes(editeurUser, collectiviteId, referentiel);

    await auditLabellisationPom.goto(collectiviteId, referentiel);
    await auditLabellisationPom.uploadActeEngagement();

    await expect(
      auditLabellisationPom.acteEngagementRow.getByText('document_test.pdf')
    ).toBeVisible();

    const download = await auditLabellisationPom.downloadActeEngagement();

    expect(download.suggestedFilename()).toBe('document_test.pdf');
  });
});
