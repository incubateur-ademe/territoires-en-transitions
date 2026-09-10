import { expect } from '@playwright/test';
import { ReferentielId } from '@tet/domain/referentiels';
import { testWithReferentiels as test } from 'tests/referentiels/referentiels.fixture';
import { ReferentielScoresPom } from 'tests/referentiels/scores/referentiel-scores.pom';

const referentiel: ReferentielId = 'cae';
const preuveReglementaireId = 'agenda21';

const RESUMABLE_SIGNED_PATH = '/storage/v1/upload/resumable/sign';
const DIRECT_OBJECT_PATH = '/storage/v1/object/';
const UPLOAD_TOKEN_PROCEDURE = 'createUploadToken';
const WRITING_METHODS = ['POST', 'PUT', 'PATCH'];

type ObservedRequest = {
  url: string;
  method: string;
  headers: Record<string, string>;
};

async function gotoActionWithDocuments(
  referentielScoresPom: ReferentielScoresPom
) {
  await referentielScoresPom.goto(referentiel);
  await referentielScoresPom.goToActionPage('1.1.1');
  await referentielScoresPom.expandSousAction('1.1.1.3');
}

test.describe("Dépôt d'un document par jeton signé", () => {
  test.beforeEach(async ({ page, collectivites }) => {
    const { collectivite, user } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
      collectiviteArgs: { isCOT: true },
    });
    await user.precomputeReferentielSnapshot(collectivite.data.id, referentiel);
    await page.goto('/');
  });

  test("le transfert emprunte le point d'entrée résumable signé, sans credential de l'utilisateur", async ({
    page,
    referentielScoresPom,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    referentiels,
  }) => {
    const storageRequests: ObservedRequest[] = [];
    const uploadTokenRequests: ObservedRequest[] = [];

    page.on('request', (request) => {
      const observed: ObservedRequest = {
        url: request.url(),
        method: request.method(),
        headers: request.headers(),
      };
      if (observed.url.includes('/storage/v1/')) {
        storageRequests.push(observed);
      }
      if (observed.url.includes(UPLOAD_TOKEN_PROCEDURE)) {
        uploadTokenRequests.push(observed);
      }
    });

    await gotoActionWithDocuments(referentielScoresPom);
    await referentielScoresPom.uploadPreuveReglementaire(preuveReglementaireId);

    await expect(referentielScoresPom.documentsPom.documentCard).toBeVisible();

    const creation = storageRequests.find(({ url }) =>
      url.includes(RESUMABLE_SIGNED_PATH)
    );
    expect(
      creation,
      `aucune requête vers ${RESUMABLE_SIGNED_PATH} ; observées : ${storageRequests
        .map(({ method, url }) => `${method} ${url}`)
        .join(', ')}`
    ).toBeDefined();

    expect(creation?.headers['x-signature']).toBeTruthy();
    expect(creation?.headers['authorization']).toBeUndefined();

    const directWrites = storageRequests.filter(
      ({ url, method }) =>
        url.includes(DIRECT_OBJECT_PATH) && WRITING_METHODS.includes(method)
    );
    expect(
      directWrites,
      'le dépôt ne doit plus écrire sur le chemin objet direct'
    ).toHaveLength(0);

    expect(
      uploadTokenRequests,
      "un fichier déposé ne doit demander qu'un seul jeton"
    ).toHaveLength(1);
  });

  test('un fichier déjà dans la bibliothèque est signalé sans repartir sur le réseau', async ({
    page,
    referentielScoresPom,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    referentiels,
  }) => {
    await gotoActionWithDocuments(referentielScoresPom);
    await referentielScoresPom.uploadPreuveReglementaire(preuveReglementaireId);
    await expect(referentielScoresPom.documentsPom.documentCard).toBeVisible();

    const transfers: ObservedRequest[] = [];
    const uploadTokenRequests: ObservedRequest[] = [];

    page.on('request', (request) => {
      const observed: ObservedRequest = {
        url: request.url(),
        method: request.method(),
        headers: request.headers(),
      };
      if (observed.url.includes(RESUMABLE_SIGNED_PATH)) {
        transfers.push(observed);
      }
      if (
        observed.url.includes(DIRECT_OBJECT_PATH) &&
        WRITING_METHODS.includes(observed.method)
      ) {
        transfers.push(observed);
      }
      if (observed.url.includes(UPLOAD_TOKEN_PROCEDURE)) {
        uploadTokenRequests.push(observed);
      }
    });

    await referentielScoresPom
      .getPreuveReglementaireButtonLocator(preuveReglementaireId)
      .click();
    await referentielScoresPom.documentsPom.chooseTestDocument();

    await expect(
      referentielScoresPom.documentsPom.duplicateNotice
    ).toBeVisible();

    expect(
      uploadTokenRequests,
      'le doublon est reconnu par la demande de jeton, qui doit donc partir'
    ).toHaveLength(1);
    expect(
      transfers,
      `aucun octet ne doit repartir pour un doublon ; observées : ${transfers
        .map(({ method, url }) => `${method} ${url}`)
        .join(', ')}`
    ).toHaveLength(0);
  });
});
