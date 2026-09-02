import { expect } from '@playwright/test';
import { randomRegionCode } from '@tet/backend/demarches/pcaet/demarches-pcaet.test-fixture';
import { pcaetDemandeAvisTable } from '@tet/backend/demarches/pcaet/shared/models/pcaet-demande-avis.table';
import { demarcheTable } from '@tet/backend/demarches/shared/models/demarche.table';
import { CollectiviteRole } from '@tet/domain/users';
import { test } from 'tests/main.fixture';
import { databaseService } from 'tests/shared/database.service';
import { InstructionPom } from './instruction.pom';

/**
 * Ouvrir un dossier depuis la liste d'un service bascule le contexte sur la
 * collectivité instruite : l'agent s'y retrouve sans en être membre, et la
 * bannière lui rend le chemin de sa liste.
 */
test.describe('Démarche PCAET - contexte d’instruction', () => {
  const creerDossierTransmis = async ({
    collectiviteId,
    serviceId,
  }: {
    collectiviteId: number;
    serviceId: number;
  }) => {
    const [demarche] = await databaseService.db
      .insert(demarcheTable)
      .values({
        collectiviteId,
        type: 'pcaet',
        titre: 'PCAET transmis pour instruction',
        status: 'transmis_pour_avis',
        transmittedAt: new Date().toISOString(),
      })
      .returning({ id: demarcheTable.id });

    const [demande] = await databaseService.db
      .insert(pcaetDemandeAvisTable)
      .values({
        demarcheId: demarche.id,
        instructeurCollectiviteId: serviceId,
        source: 'seed',
      })
      .returning({ id: pcaetDemandeAvisTable.id });

    return demande.id;
  };

  test('un agent DREAL ouvre un dossier, arrive sur la collectivité, et revient par la bannière', async ({
    collectivites,
    page,
  }) => {
    // Un index unique interdit deux DREAL sur la même région : un code tiré par
    // test évite de buter sur celle d'une exécution précédente, et laisse les
    // tests tourner en parallèle.
    const REGION = randomRegionCode();

    const { collectivite: dreal } = await collectivites.addCollectiviteAndUser({
      collectiviteArgs: {
        type: 'dreal',
        regionCode: REGION,
        nom: 'DREAL e2e contexte',
      },
      userArgs: { role: CollectiviteRole.ADMIN, autoLogin: true },
    });

    // Aucun utilisateur sur la déposante : l'agent n'en est surtout pas membre.
    const deposante = await collectivites.addCollectivite({
      regionCode: REGION,
      departementCode: '54',
      nom: 'Deposante e2e contexte',
    });

    const demandeAvisId = await creerDossierTransmis({
      collectiviteId: deposante.data.id,
      serviceId: dreal.data.id,
    });

    const pom = new InstructionPom(page);
    await pom.masquerModaleOidc();

    await pom.gotoListe(dreal.data.id);
    await expect(pom.ligne(demandeAvisId)).toBeVisible();

    await pom.ouvrirDossier({
      collectiviteInstruiteId: deposante.data.id,
      demandeAvisId,
    });
    await pom.expectContexte({
      collectiviteInstruiteId: deposante.data.id,
      demandeAvisId,
      serviceNom: dreal.data.nom,
    });
    await pom.expectNavigationDeLaCollectivite();

    // Parti dans les plans du territoire, l'agent garde ses deux retours.
    await page.goto(`/collectivite/${deposante.data.id}/plans`);
    await expect(pom.banniere).toBeVisible();
    await pom.retourDossier({
      collectiviteInstruiteId: deposante.data.id,
      demandeAvisId,
    });

    await pom.retourListe(dreal.data.id);
  });

  test('une saisine qui porte sur une autre collectivité est refusée', async ({
    collectivites,
    page,
  }) => {
    const REGION = randomRegionCode();

    const { collectivite: dreal } = await collectivites.addCollectiviteAndUser({
      collectiviteArgs: {
        type: 'dreal',
        regionCode: REGION,
        nom: 'DREAL e2e contexte forge',
      },
      userArgs: { role: CollectiviteRole.ADMIN, autoLogin: true },
    });

    const deposante = await collectivites.addCollectivite({
      regionCode: REGION,
      departementCode: '54',
      nom: 'Deposante e2e forge',
    });
    const autreDeposante = await collectivites.addCollectivite({
      regionCode: REGION,
      departementCode: '55',
      nom: 'Autre deposante e2e forge',
    });

    const demandeAvisId = await creerDossierTransmis({
      collectiviteId: deposante.data.id,
      serviceId: dreal.data.id,
    });
    // L'autre collectivité a sa propre saisine vers la même DREAL : sans elle,
    // l'accès serait refusé faute de tout contexte, et le test ne prouverait
    // rien du recoupement entre la saisine et la collectivité de l'URL.
    await creerDossierTransmis({
      collectiviteId: autreDeposante.data.id,
      serviceId: dreal.data.id,
    });

    const pom = new InstructionPom(page);
    await pom.masquerModaleOidc();

    // La saisine est bien celle de l'agent, mais elle ne porte pas sur la
    // collectivité dont l'URL afficherait le nom.
    await page.goto(
      `/collectivite/${autreDeposante.data.id}/instruction/${demandeAvisId}`
    );

    await expect(pom.erreurAcces).toBeVisible();
    await expect(pom.dossier).toBeHidden();
  });
});
