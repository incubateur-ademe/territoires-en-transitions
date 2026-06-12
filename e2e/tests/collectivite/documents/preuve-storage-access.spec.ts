import { expect } from '@playwright/test';
import { ReferentielId } from '@tet/domain/referentiels';
import { CollectiviteRole } from '@tet/domain/users';
import { CollectiviteFixture } from 'tests/collectivite/collectivites.fixture';
import { getCollectivitePreuveFileInfo } from 'tests/shared/preuve-file.utils';
import { attemptSupabaseStorageDownload } from 'tests/shared/storage-download.utils';
import { ReferentielScoresPom } from 'tests/referentiels/scores/referentiel-scores.pom';
import { testWithReferentiels as test } from 'tests/referentiels/referentiels.fixture';

const referentiel: ReferentielId = 'cae';
const preuveReglementaireId = 'agenda21';

async function gotoActionWithDocuments(
  referentielScoresPom: ReferentielScoresPom
) {
  await referentielScoresPom.goto(referentiel);
  await referentielScoresPom.goToActionPage(
    '1 - Planification',
    '1.1 Stratégie globale',
    '1.1.1 Définir la vision, les'
  );
  await referentielScoresPom.expandSousAction('1.1.1.3');
}

test.describe('Accès aux preuves privées (storage bucket RLS)', () => {
  test.beforeEach(async ({ page, collectivites }) => {
    const { collectivite, user } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
      collectiviteArgs: { isCOT: true },
    });
    await user.precomputeReferentielSnapshot(collectivite.data.id, referentiel);
    await page.goto('/');
  });

  test('Un membre de la collectivité peut télécharger la preuve de sa collectivité', async ({
    referentielScoresPom,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    referentiels,
    collectivites,
  }) => {
    const collectivite = collectivites.getCollectivite();

    await gotoActionWithDocuments(referentielScoresPom);
    await referentielScoresPom.uploadPreuveReglementaire(preuveReglementaireId);

    await expect(referentielScoresPom.documentsPom.documentCard).toBeVisible();

    const download =
      await referentielScoresPom.documentsPom.downloadDocument();
    expect(download.suggestedFilename()).toBe('document_test.pdf');

    const fileInfo = await getCollectivitePreuveFileInfo(collectivite.data.id);
    expect(fileInfo.hash).toMatch(/^[a-f0-9]{64}$/);
  });

  test('Un utilisateur d\'une autre collectivité ne peut pas télécharger via bucket_id/hash', async ({
    referentielScoresPom,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    referentiels,
    collectivites,
    page,
  }) => {
    const collectiviteA: CollectiviteFixture = collectivites.getCollectivite();

    await gotoActionWithDocuments(referentielScoresPom);
    await referentielScoresPom.uploadPreuveReglementaire(preuveReglementaireId);

    const { bucketId, hash } = await getCollectivitePreuveFileInfo(
      collectiviteA.data.id
    );

    const { collectivite: collectiviteB, user: userB } =
      await collectivites.addCollectiviteAndUser({
        userArgs: { autoLogin: true },
        collectiviteArgs: { isCOT: true },
      });
    await userB.precomputeReferentielSnapshot(
      collectiviteB.data.id,
      referentiel
    );
    await page.goto('/');

    const { accessToken } = await userB.supabaseClient.authenticateUser(
      userB.data.email,
      userB.data.password
    );

    const result = await attemptSupabaseStorageDownload(
      accessToken,
      bucketId,
      hash
    );

    expect(result.ok).toBe(false);
    expect(result.errorMessage).toBeTruthy();
  });

  test('Un auditeur conserve l\'accès aux preuves de la collectivité auditée', async ({
    referentielScoresPom,
    referentiels,
    collectivites,
    page,
  }) => {
    const collectivite: CollectiviteFixture = collectivites.getCollectivite();
    const editeurUser = collectivite.getUser();

    await gotoActionWithDocuments(referentielScoresPom);
    await referentielScoresPom.uploadPreuveReglementaire(preuveReglementaireId);

    await referentiels.requestCotAudit(
      editeurUser,
      collectivite.data.id,
      referentiel
    );

    const auditeurUser = await collectivite.addUser({
      autoLogin: true,
      role: CollectiviteRole.LECTURE,
    });

    await referentiels.addAuditeur({
      user: auditeurUser,
      collectiviteId: collectivite.data.id,
      referentielId: referentiel,
    });

    await referentiels.startAudit(
      auditeurUser,
      collectivite.data.id,
      referentiel
    );

    await page.reload();
    await expect(
      page.getByRole('link', { name: `${collectivite.data.nom} audit` })
    ).toBeVisible();

    await gotoActionWithDocuments(referentielScoresPom);
    await referentielScoresPom.documentsExpandButton.click();

    await expect(referentielScoresPom.documentsPom.documentCard).toBeVisible();

    const download =
      await referentielScoresPom.documentsPom.downloadDocument();
    expect(download.suggestedFilename()).toBe('document_test.pdf');
  });
});
