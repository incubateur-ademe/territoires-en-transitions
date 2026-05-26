import { expect } from '@playwright/test';
import { PersonnalisationPom } from '../../collectivite/personnalisations/personnalisation.pom';
import { testWithReferentiels as test } from '../referentiels.fixture';

test.describe('Mesures désactivées par la personnalisation', () => {
  let collectiviteId: number;

  test.beforeEach(async ({ page, collectivites }) => {
    const { collectivite } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
      collectiviteArgs: { isCOT: true, population: 10000 },
    });
    collectiviteId = collectivite.data.id;
    await page.goto('/');
  });

  test('Sous-mesure CAE 3.1.2.2 reste visible quand fournisseur_energie est NON', async ({
    page,
    referentielScoresPom,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    referentiels,
  }) => {
    await referentielScoresPom.goto('cae');
    await referentielScoresPom.goToActionPage(
      '3 - Approvisionnement énergie, eau, assainissement',
      "3.1 Organisation de la distribution d'énergie et services associés",
      '3.1.2 Inciter à la réduction des consommations et à l\u2019achat d\u2019électricité verte avec les fournisseurs et syndicats d\u2019énergie'
    );

    await expect(
      page.locator('[data-test="SousActionHeader-3.1.2.2"]')
    ).toBeVisible();

    await page.getByRole('link', { name: 'Répondre aux questions' }).click();

    const persoPom = new PersonnalisationPom(page);
    await persoPom.expectThematiquesVisible();
    await persoPom.openThematique('Énergie');
    await persoPom.repondreQuestionBinaire('fournisseur_energie', 'Non');

    await page.goBack();

    await expect(
      page.locator('[data-test="SousActionHeader-3.1.2.1"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-test="SousActionHeader-3.1.2.2"]')
    ).toBeVisible();
  });

  test('Tâche CAE 1.1.2.0.1 reste visible pour EPCI de moins de 20 000 habitants', async ({
    page,
    referentielScoresPom,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    referentiels,
  }) => {
    await referentielScoresPom.goto('cae');
    await referentielScoresPom.goToActionPage(
      '1 - Planification territoriale',
      '1.1 Stratégie globale climat-air-énergie',
      '1.1.2 Réaliser le diagnostic Climat-Air-Énergie du territoire'
    );

    await referentielScoresPom.expandSousAction('1.1.2.0');

    await expect(page.locator('[data-test="Tache-1.1.2.0.1"]')).toBeVisible();
  });

  test('Action ECI 2.2 reste visible quand dechets_1 est NON', async ({
    page,
    referentielScoresPom,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    referentiels,
  }) => {
    await referentielScoresPom.goto('eci');
    await referentielScoresPom.goToActionPage(
      '2 - Développement des services de réduction, collecte et valorisation des déchets',
      null,
      "2.2 Améliorer l'efficience du système de collecte"
    );

    await page.getByRole('link', { name: 'Répondre aux questions' }).click();

    const persoPom = new PersonnalisationPom(page);
    await persoPom.expectThematiquesVisible();
    await persoPom.openThematique('Déchets');
    await persoPom.repondreQuestionBinaire('dechets_1', 'Non');

    await referentielScoresPom.goto('eci');

    await referentielScoresPom.expandAxe(
      '2 - Développement des services de réduction, collecte et valorisation des déchets'
    );

    await expect(
      referentielScoresPom.getActionCardLocator(
        "2.2 Améliorer l'efficience du système de collecte"
      )
    ).toBeVisible();

    await referentielScoresPom.goToActionPage(
      '2 - Développement des services de réduction, collecte et valorisation des déchets',
      null,
      "2.2 Améliorer l'efficience du système de collecte",
      true
    );

    await expect(
      page.getByRole('heading', {
        name: "2.2 Améliorer l'efficience du système de collecte",
      })
    ).toBeVisible();
  });

  test('Mesure TE 4.1.4 est masquée quand AOM_1 est NON', async ({
    page,
    referentielScoresPom,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    referentiels,
  }) => {
    const persoPom = new PersonnalisationPom(page);
    await persoPom.goto(collectiviteId);
    await persoPom.expectThematiquesVisible();
    await persoPom.openThematique('Se déplacer');
    await persoPom.repondreQuestionBinaire('AOM_1', 'Oui');

    await referentielScoresPom.goto('te');
    await referentielScoresPom.goToActionPage(
      '4 - Mobilités',
      "4.1 Organisation des mobilités sur le territoire et développement d'une offre de transport intégrée et diversifiée",
      "4.1.4 Développer l'offre de mobilités partagées et de transports à la demande"
    );
    await expect(page.locator('[data-test="Action-4.1.4"]')).toBeVisible();

    await page.getByRole('link', { name: 'Voir les questions' }).click();

    await persoPom.expectThematiquesVisible();
    await persoPom.openThematique('Se déplacer');
    await persoPom.repondreQuestionBinaire('AOM_1', 'Non');

    await page.goBack();

    await expect(page.getByTestId('ActionHidden')).toBeVisible();
    await expect(
      page.getByText('Mesure masquée par la personnalisation')
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Retour au référentiel' })
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Voir les questions' })
    ).toBeVisible();

    await referentielScoresPom.goto('te');
    await referentielScoresPom.expandAxe('4 - Mobilités');
    await referentielScoresPom.expandAxe(
      "4.1 Organisation des mobilités sur le territoire et développement d'une offre de transport intégrée et diversifiée"
    );

    await expect(
      referentielScoresPom.getActionCardLocator(
        "4.1.4 Développer l'offre de mobilités partagées et de transports à la demande"
      )
    ).toHaveCount(0);
    await expect(
      referentielScoresPom.getActionCardLocator(
        "4.1.4alter Participer au développement de l'offre de mobilités partagées et de transport à la demande"
      )
    ).toHaveCount(1);
  });

  test('Navigation TE 2.2 saute les mesures 2.2.3 et 2.2.4 quand Bat_1 est NON', async ({
    page,
    referentielScoresPom,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    referentiels,
  }) => {
    const axePatrimoine = '2 - Patrimoine de la collectivité';
    const mesure222 =
      "2.2.2 Augmenter la sobriété et l'efficacité énergétique pour l'électricité des bâtiments publics";
    const mesure223 =
      '2.2.3 Augmenter la part de consommation en énergies renouvelables et de récupération pour la chaleur et le rafraîchissement des bâtiments publics';
    const mesure224 =
      "2.2.4 Augmenter la part de consommation en énergies renouvelables pour l'électricité du patrimoine public";
    const mesure225 =
      "2.2.5 Limiter les émissions de gaz à effet de serre et améliorer la qualité de l'air intérieur des bâtiments publics";

    const persoPom = new PersonnalisationPom(page);
    await persoPom.goto(collectiviteId);
    await persoPom.expectThematiquesVisible();
    await persoPom.openThematique('patrimoine');
    await persoPom.repondreQuestionBinaire('Bat_1', 'Non');

    await referentielScoresPom.goto('te');
    await referentielScoresPom.expandAxe(axePatrimoine);
    await referentielScoresPom.expandAxeByIdentifiant('2.2');

    await expect(
      referentielScoresPom.getActionCardLocator(mesure223)
    ).toHaveCount(0);
    await expect(
      referentielScoresPom.getActionCardLocator(mesure224)
    ).toHaveCount(0);

    await referentielScoresPom.goToActionPage(
      axePatrimoine,
      null,
      mesure222,
      true
    );

    const nextLink = page.getByRole('link', { name: 'Mesure suivante' });
    await expect(nextLink).toBeVisible();
    await expect(nextLink).toHaveAttribute('href', /te_2\.2\.5/);
    await nextLink.click();
    await expect(page.getByRole('heading', { name: mesure225 })).toBeVisible();

    await referentielScoresPom.goto('te');
    await referentielScoresPom.expandAxe(axePatrimoine);
    await referentielScoresPom.expandAxeByIdentifiant('2.2');
    await referentielScoresPom.goToActionPage(
      axePatrimoine,
      null,
      mesure225,
      true
    );

    const prevLink = page.getByRole('link', { name: 'Mesure précédente' });
    await expect(prevLink).toBeVisible();
    await expect(prevLink).toHaveAttribute('href', /te_2\.2\.2/);
    await prevLink.click();
    await expect(page.getByRole('heading', { name: mesure222 })).toBeVisible();
  });
});
