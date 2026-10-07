import { expect } from '@playwright/test';
import { DocumentsPom } from 'tests/collectivite/documents/documents.pom';
import { test } from 'tests/main.fixture';
import { DemarchePcaetPom } from './demarche-pcaet.pom';

const SAISIR_NOM = 'Saisissez un nom pour ce document';

test.describe('Démarche PCAET - documents additionnels', () => {
  test('la collectivité ouvre une pièce hors catalogue, y dépose un PDF sans l’avoir nommée, puis la nomme et la retire', async ({
    collectivites,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    plans, // requis pour cleanup auto
    page,
  }) => {
    const { collectivite } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });
    const demarchePcaetPom = new DemarchePcaetPom(page);
    const documentsPom = new DocumentsPom(page);

    await demarchePcaetPom.gotoCreatePage(collectivite.data.id);
    await demarchePcaetPom.createDemarche(collectivite.data.id);
    await demarchePcaetPom.gotoDocuments();
    await expect(demarchePcaetPom.documentsTable('amont')).toBeVisible();

    // Un clic ouvre la ligne : champ de nom au focus (vérifié par le POM) et
    // dépôt déjà disponible, sans rien avoir à valider.
    const row = await demarchePcaetPom.createDocumentAdditional('amont');
    await expect(row).toContainText('Optionnel');

    await demarchePcaetPom.openDocumentAdditionalUpload(row);
    await documentsPom.setTestDocument();
    await expect(row).toContainText('document_test.pdf');
    // Déposée sans avoir été nommée, la pièce invite à se faire nommer.
    await expect(row).toContainText(SAISIR_NOM);

    // Le champ s'est refermé en partant déposer : le nommage le rouvre.
    await demarchePcaetPom.nameDocumentAdditional(row, 'Étude acoustique');
    // Nommer ne touche pas au fichier déposé.
    await expect(row).toContainText('document_test.pdf');
    await expect(row).not.toContainText(SAISIR_NOM);

    await demarchePcaetPom.removeDocumentAdditional(row);
  });
});
