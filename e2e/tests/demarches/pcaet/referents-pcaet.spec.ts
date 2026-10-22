import { expect } from '@playwright/test';
import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import { pickFreeRegionCode } from '@tet/backend/demarches/pcaet/demarches-pcaet.test-fixture';
import { demarcheTable } from '@tet/backend/demarches/shared/models/demarche.table';
import { DGEC_SIREN } from '@tet/domain/demarches';
import { CollectiviteRole } from '@tet/domain/users';
import { and, eq } from 'drizzle-orm';
import { test } from 'tests/main.fixture';
import { databaseService } from 'tests/shared/database.service';

const getDgecId = async () => {
  const [dgec] = await databaseService.db
    .select({ id: collectiviteTable.id })
    .from(collectiviteTable)
    .where(
      and(
        eq(collectiviteTable.type, 'service_national'),
        eq(collectiviteTable.siren, DGEC_SIREN)
      )
    );
  return dgec.id;
};

test.describe('Démarche PCAET - référents désignés par la DGEC', () => {
  test('la DGEC désigne les référents, la collectivité déposante les voit dans ses contacts', async ({
    collectivites,
    users,
    page,
  }) => {
    const REGION = await pickFreeRegionCode(databaseService, 'dreal');
    const DEPARTEMENT = `${REGION}A`;

    const { collectivite: dreal, user: agentDreal } =
      await collectivites.addCollectiviteAndUser({
        collectiviteArgs: {
          type: 'dreal',
          regionCode: REGION,
          nom: 'DREAL e2e référents',
        },
        userArgs: { role: CollectiviteRole.EDITION },
      });
    const conseilRegional = await collectivites.addCollectivite({
      type: 'region',
      regionCode: REGION,
      nom: 'Région e2e référents',
    });
    const ddt = await collectivites.addCollectivite({
      type: 'ddt',
      regionCode: REGION,
      departementCode: DEPARTEMENT,
      nom: 'DDT e2e référents',
    });

    const dgecId = await getDgecId();
    const agentDgec = await users.addUser({
      collectiviteId: dgecId,
      role: CollectiviteRole.EDITION,
    });
    await agentDgec.login();

    // Le menu de configuration, à côté du sélecteur de collectivité.
    await page.goto(`/collectivite/${dgecId}/demandes-avis`);
    await page.getByTestId('nav-configuration').click();
    await page.getByTestId('nav-referents-pcaet').click();
    await expect(page).toHaveURL(`/collectivite/${dgecId}/referents-pcaet`);

    await page.goto(`/collectivite/${dgecId}/referents-pcaet?region=${REGION}`);

    const carteDreal = page.getByTestId(
      `demarches.referents-pcaet.organisme-${dreal.data.id}`
    );
    const selectMembre = `demarches.referents-pcaet.ajouter-membre-${dreal.data.id}`;
    await carteDreal.getByTestId(selectMembre).click();
    await page
      .getByTestId(`${selectMembre}-options`)
      .getByTestId(agentDreal.data.id)
      .click();
    await expect(carteDreal).toContainText(agentDreal.data.email);

    const carteRegion = page.getByTestId(
      `demarches.referents-pcaet.organisme-${conseilRegional.data.id}`
    );
    const crId = conseilRegional.data.id;
    await carteRegion
      .getByTestId(`demarches.referents-pcaet.ajouter-contact-${crId}`)
      .click();
    await carteRegion
      .getByTestId(`demarches.referents-pcaet.contact-libelle-${crId}`)
      .fill('Service climat région');
    await carteRegion
      .getByTestId(`demarches.referents-pcaet.contact-email-${crId}`)
      .fill('climat@region-e2e.fr');
    await carteRegion
      .getByTestId(`demarches.referents-pcaet.contact-ajouter-${crId}`)
      .click();
    await expect(carteRegion).toContainText('climat@region-e2e.fr');

    await expect(
      page.getByTestId(`demarches.referents-pcaet.organisme-${ddt.data.id}`)
    ).toContainText('Aucun référent renseigné');

    // Côté collectivité déposante.
    const { collectivite: deposante, user: agentDeposante } =
      await collectivites.addCollectiviteAndUser({
        collectiviteArgs: {
          regionCode: REGION,
          departementCode: DEPARTEMENT,
          nom: 'EPCI e2e référents',
        },
        userArgs: { role: CollectiviteRole.ADMIN },
      });
    const [demarche] = await databaseService.db
      .insert(demarcheTable)
      .values({
        collectiviteId: deposante.data.id,
        type: 'pcaet',
        titre: 'PCAET e2e référents',
        launchedAt: new Date('2026-01-15').toISOString(),
      })
      .returning({ id: demarcheTable.id });

    await agentDgec.logout();
    await agentDeposante.login();
    await page.goto(
      `/collectivite/${deposante.data.id}/demarche-pcaet/${demarche.id}`
    );
    await page.getByTestId('demarches.pcaet.voir-contacts-button').click();

    const modale = page.getByRole('dialog');
    await expect(
      modale.getByTestId(`demarches.pcaet.contacts.organisme-${dreal.data.id}`)
    ).toContainText(agentDreal.data.email);
    await expect(
      modale.getByTestId(`demarches.pcaet.contacts.organisme-${crId}`)
    ).toContainText('climat@region-e2e.fr');
    await expect(
      modale.getByTestId(`demarches.pcaet.contacts.organisme-${ddt.data.id}`)
    ).toContainText('Aucun référent renseigné');
  });
});
