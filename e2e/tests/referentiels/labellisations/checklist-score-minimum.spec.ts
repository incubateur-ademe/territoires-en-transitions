import { expect } from '@playwright/test';
import { Etoile, ReferentielId } from '@tet/domain/referentiels';
import { testWithReferentiels as test } from '../referentiels.fixture';

const referentielIds: ReferentielId[] = ['cae', 'eci'];

// `labellisation.etoile_meta` a `etoile` pour clé primaire seule : le seuil est
// défini par étoile, identique pour tous les référentiels.
const casPresents: Array<{ etoileDemandee: Etoile; seuilPercent: number }> = [
  { etoileDemandee: 2, seuilPercent: 35 },
  { etoileDemandee: 3, seuilPercent: 50 },
  { etoileDemandee: 4, seuilPercent: 65 },
  { etoileDemandee: 5, seuilPercent: 75 },
];

test.describe('Checklist audit-labellisation — ligne score minimum', () => {
  test.beforeEach(async ({ page, collectivites }) => {
    const { collectivite, user } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });
    // Sans pré-calcul, le premier `getParcours` côté checklist déclenche
    // `SnapshotsService.computeAndUpsert` (calcul de scores sur tout le
    // référentiel) et fait flaker l'attente du heading.
    for (const referentielId of referentielIds) {
      await user.precomputeReferentielSnapshot(
        collectivite.data.id,
        referentielId
      );
    }
    await page.goto('/');
  });

  for (const referentielId of referentielIds) {
    test(`${referentielId.toUpperCase()} — 1ʳᵉ étoile : la ligne score minimum affiche le seuil de la 2ᵉ étoile (35 %)`, async ({
      newAuditLabellisationPom,
      collectivites,
    }) => {
      const collectivite = collectivites.getCollectivite();

      await newAuditLabellisationPom.goto(collectivite.data.id, referentielId);

      const row = newAuditLabellisationPom.scoreMinimumRow;
      await expect(row).toContainText(
        `Atteindre un score réalisé (statut Fait) d'au moins 35 % et le prouver (via les documents preuves ou un texte justificatif)`
      );
      await expect(row).toContainText(`35% fait minimum`);
    });

    for (const { etoileDemandee, seuilPercent } of casPresents) {
      test(`${referentielId.toUpperCase()} — ${etoileDemandee}ᵉ étoile : critère et réponse affichent ${seuilPercent} %`, async ({
        newAuditLabellisationPom,
        referentiels,
        collectivites,
      }) => {
        const collectivite = collectivites.getCollectivite();

        await referentiels.seedLabellisationObtenue({
          collectiviteId: collectivite.data.id,
          referentielId,
          etoiles: (etoileDemandee - 1) as Etoile,
        });

        await newAuditLabellisationPom.goto(collectivite.data.id, referentielId);

        const row = newAuditLabellisationPom.scoreMinimumRow;
        await expect(row).toContainText(
          `Atteindre un score réalisé (statut Fait) d'au moins ${seuilPercent} % et le prouver (via les documents preuves ou un texte justificatif)`
        );
        await expect(row).toContainText(`${seuilPercent}% fait minimum`);
      });
    }
  }
});
