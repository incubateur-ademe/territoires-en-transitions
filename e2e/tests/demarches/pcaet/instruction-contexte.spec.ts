import { expect } from '@playwright/test';
import { pickFreeRegionCode } from '@tet/backend/demarches/pcaet/demarches-pcaet.test-fixture';
import { pcaetDemandeAvisTable } from '@tet/backend/demarches/pcaet/shared/models/pcaet-demande-avis.table';
import { utilisateurCollectiviteAccessTable } from '@tet/backend/users/authorizations/utilisateur-collectivite-access.table';
import { demarcheTable } from '@tet/backend/demarches/shared/models/demarche.table';
import { DemarchePcaetStatus } from '@tet/domain/demarches';
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
  /**
   * `demarche_active_unique` n'autorise qu'un seul dossier PCAET *actif* par
   * collectivité — `en_elaboration` ou `transmis_pour_avis`. Un second dossier
   * transmis suppose donc que le précédent soit sorti de ces statuts, d'où le
   * `status` paramétrable : c'est ainsi que se présente un renouvellement, à
   * côté de l'archive du PCAET précédent.
   */
  const createDossierTransmis = async ({
    collectiviteId,
    serviceId,
    transmittedAt = new Date(),
    titre = 'PCAET transmis pour instruction',
    status = 'transmis_pour_avis',
  }: {
    collectiviteId: number;
    serviceId: number;
    transmittedAt?: Date;
    titre?: string;
    status?: DemarchePcaetStatus;
  }) => {
    const [demarche] = await databaseService.db
      .insert(demarcheTable)
      .values({
        collectiviteId,
        type: 'pcaet',
        titre,
        status,
        transmittedAt: transmittedAt.toISOString(),
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
    // Un index unique interdit deux DREAL sur la même région : le code est
    // choisi parmi ceux que la base n'utilise pas, ce qui évite de buter sur la
    // DREAL d'une exécution précédente.
    const REGION = await pickFreeRegionCode(databaseService, 'dreal');

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

    const demandeAvisId = await createDossierTransmis({
      collectiviteId: deposante.data.id,
      serviceId: dreal.data.id,
    });

    const pom = new InstructionPom(page);
    await pom.hideOidcModal();

    await pom.goToDemandesAvis(dreal.data.id);
    await expect(pom.row(demandeAvisId)).toBeVisible();

    await pom.openDossier({
      collectiviteInstruiteId: deposante.data.id,
      demandeAvisId,
    });
    await pom.expectContexte({
      collectiviteInstruiteId: deposante.data.id,
      demandeAvisId,
      serviceNom: dreal.data.nom,
    });
    await pom.expectCollectiviteNavigation();

    // Parti dans les plans du territoire, l'agent garde ses deux retours.
    await page.goto(`/collectivite/${deposante.data.id}/plans`);
    await expect(pom.banner).toBeVisible();
    await pom.goBackToDossier({
      collectiviteInstruiteId: deposante.data.id,
      demandeAvisId,
    });

    await pom.goBackToDemandesAvis(dreal.data.id, demandeAvisId);
  });

  /**
   * Le droit d'ouvrir un dossier vient de la saisine, pas de la non-appartenance
   * à la collectivité déposante. Un agent peut porter deux casquettes — membre
   * d'un EPCI et correspondant d'un service instructeur — et la seconde ne doit
   * pas s'effacer devant la première.
   */
  test('un agent membre de la collectivité déposante ouvre quand même le dossier', async ({
    collectivites,
    page,
  }) => {
    const REGION = await pickFreeRegionCode(databaseService, 'dreal');

    const { collectivite: service, user: agent } =
      await collectivites.addCollectiviteAndUser({
        collectiviteArgs: {
          type: 'dreal',
          regionCode: REGION,
          nom: 'DREAL e2e deux casquettes',
        },
        userArgs: { role: CollectiviteRole.ADMIN, autoLogin: true },
      });

    const deposante = await collectivites.addCollectivite({
      regionCode: REGION,
      departementCode: '54',
      nom: 'Deposante e2e deux casquettes',
    });

    // La seconde casquette : le même agent est aussi membre de la déposante,
    // ce qui reproduit le compte de développement du seed.
    await databaseService.db.insert(utilisateurCollectiviteAccessTable).values({
      userId: agent.data.id,
      collectiviteId: deposante.data.id,
      role: CollectiviteRole.ADMIN,
      isActive: true,
    });

    const demandeAvisId = await createDossierTransmis({
      collectiviteId: deposante.data.id,
      serviceId: service.data.id,
    });

    const pom = new InstructionPom(page);
    await pom.hideOidcModal();

    await page.goto(
      `/collectivite/${deposante.data.id}/instruction/${demandeAvisId}`
    );

    await pom.expectContexte({
      collectiviteInstruiteId: deposante.data.id,
      demandeAvisId,
      serviceNom: service.data.nom,
    });
    await expect(pom.accessError).toBeHidden();
  });

  test('une saisine qui porte sur une autre collectivité est refusée', async ({
    collectivites,
    page,
  }) => {
    const REGION = await pickFreeRegionCode(databaseService, 'dreal');

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

    const demandeAvisId = await createDossierTransmis({
      collectiviteId: deposante.data.id,
      serviceId: dreal.data.id,
    });
    // L'autre collectivité a sa propre saisine vers la même DREAL : sans elle,
    // l'accès serait refusé faute de tout contexte, et le test ne prouverait
    // rien du recoupement entre la saisine et la collectivité de l'URL.
    await createDossierTransmis({
      collectiviteId: autreDeposante.data.id,
      serviceId: dreal.data.id,
    });

    const pom = new InstructionPom(page);
    await pom.hideOidcModal();

    // La saisine est bien celle de l'agent, mais elle ne porte pas sur la
    // collectivité dont l'URL afficherait le nom.
    await page.goto(
      `/collectivite/${autreDeposante.data.id}/instruction/${demandeAvisId}`
    );

    await expect(pom.accessError).toBeVisible();
    await expect(pom.dossier).toBeHidden();
  });

  test('ouvrir un dossier plus ancien affiche son propre contexte', async ({
    collectivites,
    page,
  }) => {
    const REGION = await pickFreeRegionCode(databaseService, 'dreal');

    const { collectivite: dreal } = await collectivites.addCollectiviteAndUser({
      collectiviteArgs: {
        type: 'dreal',
        regionCode: REGION,
        nom: 'DREAL e2e deux saisines',
      },
      userArgs: { role: CollectiviteRole.ADMIN, autoLogin: true },
    });

    const deposante = await collectivites.addCollectivite({
      regionCode: REGION,
      departementCode: '54',
      nom: 'Deposante e2e deux saisines',
    });

    // Deux dossiers transmis pour la même collectivité : le PCAET précédent,
    // archivé, et le renouvellement en cours. Le plus récent fait le contexte
    // par défaut ; ouvrir l'ancien doit malgré tout afficher le sien, sans quoi
    // la bannière nommerait le service de l'autre saisine et son bouton
    // « dossier » y renverrait.
    const ancienneDemandeAvisId = await createDossierTransmis({
      collectiviteId: deposante.data.id,
      serviceId: dreal.data.id,
      transmittedAt: new Date('2020-01-01'),
      titre: 'PCAET precedent',
      status: 'archive',
    });
    await createDossierTransmis({
      collectiviteId: deposante.data.id,
      serviceId: dreal.data.id,
    });

    const pom = new InstructionPom(page);
    await pom.hideOidcModal();

    await page.goto(
      `/collectivite/${deposante.data.id}/instruction/${ancienneDemandeAvisId}`
    );

    await pom.expectContexte({
      collectiviteInstruiteId: deposante.data.id,
      demandeAvisId: ancienneDemandeAvisId,
      serviceNom: dreal.data.nom,
    });
  });
});
