import { expect } from '@playwright/test';
import { pickFreeRegionCode } from '@tet/backend/demarches/pcaet/demarches-pcaet.test-fixture';
import { pcaetDemandeAvisTable } from '@tet/backend/demarches/pcaet/shared/models/pcaet-demande-avis.table';
import { demarcheTable } from '@tet/backend/demarches/shared/models/demarche.table';
import {
  DemarchePcaetStatus,
  SEUIL_POPULATION_PCAET,
} from '@tet/domain/demarches';
import { CollectiviteRole } from '@tet/domain/users';
import { test } from 'tests/main.fixture';
import { databaseService } from 'tests/shared/database.service';
import { InstructionPom } from './instruction.pom';

/**
 * La liste d'un service ne montre plus seulement les avis qu'on lui demande,
 * mais l'état du PCAET de chaque collectivité de son territoire — y compris
 * celles qui n'ont rien déposé, qui sont précisément celles à relancer.
 */
test.describe('Démarche PCAET - liste d’instruction', () => {
  const createDepot = async ({
    collectiviteId,
    serviceId,
    status = 'transmis_pour_avis',
    saisi = true,
  }: {
    collectiviteId: number;
    serviceId: number;
    status?: DemarchePcaetStatus;
    /** Un dépôt en élaboration n'a encore saisi personne. */
    saisi?: boolean;
  }) => {
    const [demarche] = await databaseService.db
      .insert(demarcheTable)
      .values({
        collectiviteId,
        type: 'pcaet',
        titre: 'PCAET e2e liste',
        status,
        launchedAt: new Date('2026-01-15').toISOString(),
        transmittedAt: saisi ? new Date().toISOString() : null,
      })
      .returning({ id: demarcheTable.id });

    if (!saisi) {
      return { demarcheId: demarche.id, demandeAvisId: null };
    }

    const [demande] = await databaseService.db
      .insert(pcaetDemandeAvisTable)
      .values({
        demarcheId: demarche.id,
        instructeurCollectiviteId: serviceId,
        source: 'seed',
      })
      .returning({ id: pcaetDemandeAvisTable.id });

    return { demarcheId: demarche.id, demandeAvisId: demande.id };
  };

  test('le service voit son territoire, et le filtre de statut lui ouvre ce que le défaut masque', async ({
    collectivites,
    page,
  }) => {
    // Un index unique interdit deux DREAL sur la même région : le code est
    // choisi parmi ceux que la base n'utilise pas.
    const REGION = await pickFreeRegionCode(databaseService, 'dreal');

    const { collectivite: dreal } = await collectivites.addCollectiviteAndUser({
      collectiviteArgs: {
        type: 'dreal',
        regionCode: REGION,
        nom: 'DREAL e2e liste',
      },
      userArgs: { role: CollectiviteRole.ADMIN, autoLogin: true },
    });

    const transmise = await collectivites.addCollectivite({
      regionCode: REGION,
      nom: 'Deposante e2e transmise',
    });

    const enChantier = await collectivites.addCollectivite({
      regionCode: REGION,
      nom: 'Deposante e2e en chantier',
    });

    // Porteuse et assujettie, mais elle n'a jamais rien déposé.
    const sansDepot = await collectivites.addCollectivite({
      regionCode: REGION,
      nom: 'Deposante e2e sans depot',
      natureInsee: 'CA',
      population: SEUIL_POPULATION_PCAET + 5_000,
    });

    const { demandeAvisId } = await createDepot({
      collectiviteId: transmise.data.id,
      serviceId: dreal.data.id,
    });
    const { demarcheId: demarcheEnChantier } = await createDepot({
      collectiviteId: enChantier.data.id,
      serviceId: dreal.data.id,
      status: 'en_elaboration',
      saisi: false,
    });

    const pom = new InstructionPom(page);
    await pom.goToDemandesAvis(dreal.data.id);

    // Par défaut, l'écran s'en tient aux dossiers dont le service a la charge.
    await expect(pom.row(demandeAvisId as number)).toBeVisible();
    await expect(pom.rowDemarche(demarcheEnChantier)).toBeHidden();
    await expect(pom.rowSansDepot(sansDepot.data.id)).toBeHidden();

    // Le filtre ouvre ce que le défaut masque, sans quoi ces deux populations
    // resteraient invisibles.
    await pom.selectAllStatuts();

    await expect(pom.rowDemarche(demarcheEnChantier)).toBeVisible();
    await expect(pom.rowSansDepot(sansDepot.data.id)).toBeVisible();

    // Ni l'une ni l'autre n'ouvre de dossier : rien n'a été transmis au
    // service, qui n'a là qu'un motif de relance.
    await expect(pom.rowDemarche(demarcheEnChantier).locator('a')).toHaveCount(
      0
    );
    await expect(
      pom.rowSansDepot(sansDepot.data.id).locator('a')
    ).toHaveCount(0);

    // Le filtre voyage dans l'URL : la vue se partage et se recharge.
    await page.reload();
    await expect(pom.rowSansDepot(sansDepot.data.id)).toBeVisible();
  });

  /**
   * La DGEC est une instance de la famille `service_national` : son périmètre
   * est le pays, sans code géographique à confronter. C'est le seul cas où la
   * colonne « Région » a un sens, et celui où la pagination devient
   * indispensable.
   */
  test('un service national voit une liste nationale, avec sa colonne Région', async ({
    collectivites,
    page,
  }) => {
    const { collectivite: dgec } = await collectivites.addCollectiviteAndUser({
      collectiviteArgs: {
        type: 'service_national',
        nom: 'Service national e2e liste',
      },
      userArgs: { role: CollectiviteRole.ADMIN, autoLogin: true },
    });

    const pom = new InstructionPom(page);
    await pom.goToDemandesAvis(dgec.data.id);

    // La navigation est réduite à l'instruction : pas de plans d'action ici.
    await expect(
      page.getByRole('link', { name: 'Suivi des demandes d’avis' })
    ).toBeVisible();
    await expect(page.getByTestId('nav-pa')).toBeHidden();

    // Le service couvre plusieurs régions, donc la colonne apparaît — elle
    // reste masquée pour une DREAL, qui n'en a qu'une.
    await pom.selectAllStatuts();
    await expect(
      page.getByRole('columnheader', { name: /Région/ })
    ).toBeVisible();

    // Le territoire national dépasse largement une page : sans pagination, la
    // liste serait illisible. On vise un numéro de page — en mode compact, les
    // boutons précédent/suivant du design-system n'ont pas de nom accessible.
    await expect(
      page.getByRole('button', { name: '2', exact: true })
    ).toBeVisible();
  });

  /**
   * Un filtre qui ne rend rien ne doit pas escamoter le tableau : l'en-tête
   * porte les filtres, et c'est là que l'agent va corriger sa sélection.
   */
  test('un filtre sans résultat garde l’en-tête, et propose de le desserrer', async ({
    collectivites,
    page,
  }) => {
    const REGION = await pickFreeRegionCode(databaseService, 'dreal');

    const { collectivite: dreal } = await collectivites.addCollectiviteAndUser({
      collectiviteArgs: {
        type: 'dreal',
        regionCode: REGION,
        nom: 'DREAL e2e liste vide',
      },
      userArgs: { role: CollectiviteRole.ADMIN, autoLogin: true },
    });

    const deposante = await collectivites.addCollectivite({
      regionCode: REGION,
      nom: 'Deposante e2e liste vide',
    });

    await createDepot({
      collectiviteId: deposante.data.id,
      serviceId: dreal.data.id,
    });

    const pom = new InstructionPom(page);

    // Un filtre que rien ne satisfait : le dossier est transmis, pas archivé.
    await page.goto(
      `/collectivite/${dreal.data.id}/demandes-avis?$st=archive`
    );

    await expect(
      page.getByRole('columnheader', { name: /Statut/ })
    ).toBeVisible();
    await expect(pom.filtreStatut).toBeVisible();
    await expect(
      page.getByText('Aucun dossier ne correspond à ces filtres')
    ).toBeVisible();

    // Et le desserrage ramène le dossier.
    await page.getByRole('button', { name: 'Réinitialiser les filtres' }).click();
    await expect(page.getByText('Deposante e2e liste vide')).toBeVisible();
  });

  /**
   * « Désélectionner les options » vide le filtre. Un filtre vide n'est pas un
   * filtre qui ne laisse rien passer : c'est l'absence de filtre.
   */
  test('désélectionner tous les statuts montre tout, et le rechargement s’en souvient', async ({
    collectivites,
    page,
  }) => {
    const REGION = await pickFreeRegionCode(databaseService, 'dreal');

    const { collectivite: dreal } = await collectivites.addCollectiviteAndUser({
      collectiviteArgs: {
        type: 'dreal',
        regionCode: REGION,
        nom: 'DREAL e2e deselection',
      },
      userArgs: { role: CollectiviteRole.ADMIN, autoLogin: true },
    });

    // Une collectivité que le filtre par défaut masque : elle n'a rien déposé.
    const sansDepot = await collectivites.addCollectivite({
      regionCode: REGION,
      nom: 'Deposante e2e deselection',
      natureInsee: 'CA',
      population: SEUIL_POPULATION_PCAET + 5_000,
    });

    const pom = new InstructionPom(page);
    await pom.goToDemandesAvis(dreal.data.id);

    await expect(pom.rowSansDepot(sansDepot.data.id)).toBeHidden();

    await pom.deselectAllStatuts();
    await expect(pom.rowSansDepot(sansDepot.data.id)).toBeVisible();

    // Le rechargement doit retrouver « aucun filtre », et non retomber sur le
    // défaut : c'est l'URL qui doit porter la différence.
    await page.reload();
    await expect(pom.rowSansDepot(sansDepot.data.id)).toBeVisible();
  });
});
