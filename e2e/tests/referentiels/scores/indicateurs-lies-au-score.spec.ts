import { expect } from '@playwright/test';
import type { CollectiviteReferentielPreferences } from '@tet/domain/collectivites';
import { IndicateurValeursPom } from 'tests/indicateurs/indicateur-detail/indicateur-valeurs.pom';
import { test } from 'tests/main.fixture';
import { UserFixture } from 'tests/users/users.fixture';

/** Sous-mesure TE dont le score est calculé à partir de l'indicateur `cae_18` */
const SOUS_MESURE = '2.2.4.4';
const INDICATEUR_IDENTIFIANT = 'cae_18';
const INDICATEUR_TITRE =
  'Taux d’achat d’électricité renouvelable pour les bâtiments et équipements de la collectivité';

/** Sous-mesure TE dont les deux tâches portent chacune une formule de score */
const SOUS_MESURE_AVEC_TACHES = '2.3.1.5';

const SOURCE_COLLECTIVITE = 'Données de la collectivité';

const TE_WRITE: CollectiviteReferentielPreferences = {
  cae: { display: true, mode: 'write' },
  eci: { display: false, mode: 'archived' },
  te: { display: true, mode: 'write' },
};

test.describe('Indicateurs liés au score (référentiel CR)', () => {
  let collectiviteId: number;

  test.describe('en écriture', () => {
    let user: UserFixture;

    test.beforeEach(async ({
      page,
      collectivites,
      referentiels,
      // enregistre le nettoyage des valeurs saisies depuis l'UI
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      indicateurs,
    }) => {
      const created = await collectivites.addCollectiviteAndUser({
        userArgs: { autoLogin: true },
      });
      const { collectivite } = created;
      user = created.user;
      collectiviteId = collectivite.data.id;

      // le référentiel CR est en lecture seule par défaut
      const supportUser = await collectivite.addUser({
        isSupport: true,
        isSuperAdminRoleEnabled: true,
      });
      await referentiels.setReferentielPreferences(
        supportUser,
        collectiviteId,
        TE_WRITE
      );

      await user.precomputeReferentielSnapshot(collectiviteId, 'te');
      await page.goto('/');
    });

    test('affiche les indicateurs liés au score des sous-mesures concernées', async ({
      page,
      referentielScoresPom,
      indicateursLiesAuScorePom: pom,
    }) => {
      await referentielScoresPom.goto('te');
      await referentielScoresPom.goToActionPage('2.2.4');

      const sousMesure = pom.getSousActionCard(`te_${SOUS_MESURE}`);
      await expect(
        sousMesure.getByText('Indicateur lié au score')
      ).toBeVisible();

      const carte = pom.getCarte(SOUS_MESURE);
      await expect(carte).toContainText(INDICATEUR_TITRE);
      await expect(carte).toContainText('--');
      await expect(carte).toContainText('0 / 1 point');
      await expect(carte).toContainText('Cible : 100 %');

      // une sous-mesure sans formule de score n'affiche pas la liste
      await expect(
        page.locator(
          referentielScoresPom.getSousActionLocationExpression('2.2.4.1')
        )
      ).toBeVisible();
      await expect(pom.getList('2.2.4.1')).toHaveCount(0);

      // une sous-mesure dont les tâches portent les formules liste un
      // indicateur par tâche
      await referentielScoresPom.goto('te');
      await referentielScoresPom.goToActionPage('2.3.1');
      await expect(
        pom
          .getSousActionCard(`te_${SOUS_MESURE_AVEC_TACHES}`)
          .getByText('Indicateurs liés au score')
      ).toBeVisible();
      await expect(pom.getCarte(`${SOUS_MESURE_AVEC_TACHES}.a`)).toBeVisible();
      await expect(pom.getCarte(`${SOUS_MESURE_AVEC_TACHES}.b`)).toBeVisible();
    });

    test("ouvre la modale d'un indicateur sans résultat", async ({
      referentielScoresPom,
      indicateursLiesAuScorePom: pom,
    }) => {
      await referentielScoresPom.goto('te');
      await referentielScoresPom.goToActionPage('2.2.4');
      await pom.openModal(SOUS_MESURE);

      await expect(pom.modal).toContainText(`${INDICATEUR_TITRE} (%)`);
      await expect(pom.resultatsTab).toBeVisible();
      await expect(pom.descriptionTab).toBeVisible();
      await expect(pom.methodeCalculTab).toBeVisible();

      await expect(pom.aucunResultatMessage).toBeVisible();
      await expect(pom.getFooterLink('Ajouter un résultat')).toBeVisible();
    });

    test('sélectionne, change puis désélectionne le résultat utilisé pour le score', async ({
      indicateurs,
      referentielScoresPom,
      indicateursLiesAuScorePom: pom,
    }) => {
      await indicateurs.addResultats(user, {
        collectiviteId,
        identifiantReferentiel: INDICATEUR_IDENTIFIANT,
        valeurs: [
          { dateValeur: '2023-01-01', resultat: 100 },
          { dateValeur: '2024-01-01', resultat: 50 },
        ],
      });

      await referentielScoresPom.goto('te');
      await referentielScoresPom.goToActionPage('2.2.4');
      await pom.openModal(SOUS_MESURE);

      await expect(pom.selectionnerResultatMessage).toBeVisible();
      await expect(
        pom.getFooterLink('Ajouter ou modifier un résultat')
      ).toBeVisible();

      // résultats triés par année décroissante
      const rows = pom.resultatsTable.locator('tbody').getByRole('row');
      await expect(rows).toHaveCount(2);
      await expect(rows.nth(0)).toContainText('2024');
      await expect(rows.nth(1)).toContainText('2023');

      // sélection du résultat 2024 (50 % → 0,5 point sur 1)
      await pom.clickResultatRow(pom.getResultatRow('2024'));
      await expect(
        pom.getSourceSelectionneeMessage(SOURCE_COLLECTIVITE, 2024)
      ).toBeVisible();
      await expect(pom.modal).toContainText('0,5 / 1 point');

      // changement pour le résultat 2023 (100 % → 1 point sur 1)
      await pom.clickResultatRow(pom.getResultatRow('2023'));
      await expect(
        pom.getSourceSelectionneeMessage(SOURCE_COLLECTIVITE, 2023)
      ).toBeVisible();
      await expect(pom.modal).toContainText('1 / 1 point');

      // la carte et le score de la sous-mesure reflètent la sélection
      await pom.closeModal();
      const carte = pom.getCarte(SOUS_MESURE);
      await expect(carte).toContainText('100');
      await expect(carte).toContainText('1 / 1 point');
      await expect(
        referentielScoresPom.getScoreRatioLocator('te', SOUS_MESURE)
      ).toContainText('1 / 1');

      // désélection : re-cliquer sur la ligne sélectionnée
      await pom.openModal(SOUS_MESURE);
      await pom.clickResultatRow(pom.getResultatRow('2023'));
      await expect(pom.selectionnerResultatMessage).toBeVisible();
      await pom.closeModal();
      await expect(carte).toContainText('--');
    });

    test('regroupe par année les résultats issus de plusieurs sources', async ({
      indicateurs,
      referentielScoresPom,
      indicateursLiesAuScorePom: pom,
    }) => {
      await indicateurs.addResultats(user, {
        collectiviteId,
        identifiantReferentiel: INDICATEUR_IDENTIFIANT,
        valeurs: [
          { dateValeur: '2024-01-01', resultat: 40 },
          { dateValeur: '2024-01-01', resultat: 60, sourceId: 'citepa' },
        ],
      });

      await referentielScoresPom.goto('te');
      await referentielScoresPom.goToActionPage('2.2.4');
      await pom.openModal(SOUS_MESURE);

      // groupe replié par défaut quand aucune valeur n'est sélectionnée
      const rows = pom.resultatsTable.locator('tbody').getByRole('row');
      await expect(rows).toHaveCount(1);
      await expect(rows.first()).toContainText('2 sources');

      await rows.first().click();
      await expect(rows).toHaveCount(3);

      await pom.clickResultatRow(pom.getResultatRow('CITEPA'));
      await expect(
        pom.getSourceSelectionneeMessage('CITEPA', 2024)
      ).toBeVisible();
      await expect(pom.modal).toContainText('0,6 / 1 point');

      // à la réouverture, le groupe contenant la sélection est déplié
      await pom.closeModal();
      await pom.openModal(SOUS_MESURE);
      await expect(rows).toHaveCount(3);
      await expect(
        pom.getSourceSelectionneeMessage('CITEPA', 2024)
      ).toBeVisible();
    });

    test('déclarer l’indicateur non suivi retire la sélection et désactive la liste', async ({
      indicateurs,
      referentielScoresPom,
      indicateursLiesAuScorePom: pom,
    }) => {
      await indicateurs.addResultats(user, {
        collectiviteId,
        identifiantReferentiel: INDICATEUR_IDENTIFIANT,
        valeurs: [{ dateValeur: '2024-01-01', resultat: 50 }],
      });

      await referentielScoresPom.goto('te');
      await referentielScoresPom.goToActionPage('2.2.4');
      await pom.openModal(SOUS_MESURE);

      await pom.clickResultatRow(pom.getResultatRow('2024'));
      await expect(
        pom.getSourceSelectionneeMessage(SOURCE_COLLECTIVITE, 2024)
      ).toBeVisible();

      // cocher « non suivi » désélectionne la valeur et recalcule le score
      await pom.clickNonSuiviCheckbox();
      await expect(pom.nonSuiviCheckbox).toBeChecked();
      await expect(pom.selectionnerResultatMessage).toBeVisible();
      await expect(pom.modal).toContainText('0 / 1 point');
      await expect(pom.resultatsTable).toHaveCSS('pointer-events', 'none');

      // décocher permet à nouveau de sélectionner une valeur dans la liste
      await pom.clickNonSuiviCheckbox();
      await expect(pom.nonSuiviCheckbox).not.toBeChecked();
      await expect(pom.resultatsTable).toHaveCSS('pointer-events', 'auto');

      // sélectionne une valeur
      await pom.clickResultatRow(pom.getResultatRow('2024'));
      await expect(
        pom.getSourceSelectionneeMessage(SOURCE_COLLECTIVITE, 2024)
      ).toBeVisible();
    });

    test("un résultat saisi dans l'onglet de la fiche indicateur est sélectionnable sans recharger la page", async ({
      page,
      referentielScoresPom,
      indicateursLiesAuScorePom: pom,
    }) => {
      await referentielScoresPom.goto('te');
      await referentielScoresPom.goToActionPage('2.2.4');
      await pom.openModal(SOUS_MESURE);
      await expect(pom.aucunResultatMessage).toBeVisible();

      // le nouvel onglet ne partage pas le sessionStorage : on y neutralise
      // aussi la modale d'incitation MonCompteAdeme (cf main.fixture)
      await page
        .context()
        .addInitScript(() =>
          window.sessionStorage.setItem('oidc-modal-seen', '1')
        );

      // le lien ouvre la fiche de l'indicateur dans un nouvel onglet
      const [fichePage] = await Promise.all([
        page.context().waitForEvent('page'),
        pom.getFooterLink('Ajouter un résultat').click(),
      ]);
      await fichePage.waitForLoadState();

      await new IndicateurValeursPom(fichePage).addResultat(2024, 42);

      // retour sur l'onglet de la mesure : la modale toujours ouverte reçoit
      // l'invalidation émise par l'autre onglet
      await page.bringToFront();
      await expect(pom.aucunResultatMessage).toBeHidden();
      await expect(
        pom.getResultatRow('2024', SOURCE_COLLECTIVITE)
      ).toBeVisible();
      await expect(
        pom.getFooterLink('Ajouter ou modifier un résultat')
      ).toBeVisible();

      await pom.clickResultatRow(pom.getResultatRow('2024'));
      await expect(
        pom.getSourceSelectionneeMessage(SOURCE_COLLECTIVITE, 2024)
      ).toBeVisible();
      await expect(pom.modal).toContainText('0,4 / 1 point');

      await pom.closeModal();
      await expect(pom.getCarte(SOUS_MESURE)).toContainText('42');
    });
  });

  test.describe('en lecture seule', () => {
    test.beforeEach(async ({ page, collectivites }) => {
      const { collectivite, user } = await collectivites.addCollectiviteAndUser(
        { userArgs: { autoLogin: true } }
      );
      collectiviteId = collectivite.data.id;
      await user.precomputeReferentielSnapshot(collectiviteId, 'te');
      await page.goto('/');
    });

    test("la modale n'affiche pas les résultats et renvoie vers la fiche indicateur", async ({
      referentielScoresPom,
      indicateursLiesAuScorePom: pom,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      referentiels,
    }) => {
      await referentielScoresPom.goto('te');
      await referentielScoresPom.goToActionPage('2.2.4');
      await pom.openModal(SOUS_MESURE);

      await expect(pom.descriptionTab).toBeVisible();
      await expect(pom.resultatsTab).toHaveCount(0);
      await expect(
        pom.getFooterLink("Voir la fiche de l'indicateur")
      ).toBeVisible();
    });
  });
});
