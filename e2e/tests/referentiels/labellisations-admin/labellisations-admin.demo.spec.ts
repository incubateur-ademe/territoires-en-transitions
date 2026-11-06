import { Page } from '@playwright/test';
import { setCollectiviteCotStatus } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { buildRandomDocumentHash } from '@tet/backend/collectivites/documents/documents.test-fixture';
import { bibliothequeFichierTable } from '@tet/backend/collectivites/documents/models/bibliotheque-fichier.table';
import { preuveLabellisationTable } from '@tet/backend/collectivites/documents/models/preuve-labellisation.table';
import { auditTable } from '@tet/backend/referentiels/labellisations/audit.table';
import { auditeurTable } from '@tet/backend/referentiels/labellisations/auditeur.table';
import { labellisationDemandeTable } from '@tet/backend/referentiels/labellisations/labellisation-demande.table';
import { labellisationTable } from '@tet/backend/referentiels/labellisations/labellisation.table';
import { addUserRoleSupport } from '@tet/backend/users/users/users.test-fixture';
import { EtoileAsString, ReferentielIdEnum } from '@tet/domain/referentiels';
import { eq, inArray } from 'drizzle-orm';
import { test } from 'tests/main.fixture';
import { databaseService } from 'tests/shared/database.service';

/**
 * Vidéo de démo de l'outil « Gestion des labellisations » — pas un test.
 * Ignorée hors démo ; pour la générer :
 *   DEMO=1 pnpm exec playwright test --config ./e2e/playwright.config.mjs labellisations-admin.demo
 * La vidéo (.webm) atterrit dans e2e/test-results/.
 */
test.skip(!process.env.DEMO, 'Démo vidéo : lancer avec DEMO=1');

test.use({
  viewport: { width: 1440, height: 900 },
  video: { mode: 'on', size: { width: 1440, height: 900 } },
  launchOptions: { slowMo: 400 },
});

const { db } = databaseService;

/** Bandeau de sous-titre, incrusté dans la page (et donc dans la vidéo). */
async function caption(page: Page, text: string, ms = 3500) {
  await page.evaluate((text) => {
    let el = document.getElementById('demo-caption');
    if (!el) {
      el = document.createElement('div');
      el.id = 'demo-caption';
      el.style.cssText =
        'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:99999;' +
        'background:rgba(0,0,145,.92);color:#fff;font:600 20px/1.4 Marianne,sans-serif;' +
        'padding:12px 24px;border-radius:8px;pointer-events:none;max-width:80vw;text-align:center';
      document.body.appendChild(el);
    }
    el.textContent = text;
  }, text);
  await page.waitForTimeout(ms);
}

/** La vidéo Playwright ne montre pas la souris : on en dessine une. */
const fakeCursor = () => {
  window.addEventListener('DOMContentLoaded', () => {
    const dot = document.createElement('div');
    dot.style.cssText =
      'position:fixed;top:0;left:0;width:22px;height:22px;margin:-11px 0 0 -11px;z-index:100000;' +
      'border-radius:50%;background:rgba(225,0,15,.35);border:2px solid #e1000f;' +
      'pointer-events:none;transition:transform .35s ease-out';
    document.body.appendChild(dot);
    document.addEventListener(
      'mousemove',
      (e) => (dot.style.transform = `translate(${e.clientX}px,${e.clientY}px)`),
      true
    );
  });
};

const pause = (page: Page, ms = 2000) => page.waitForTimeout(ms);

const T = 'referentiels.labellisations-admin';

test('démo : gestion des labellisations par le programme TETE', async ({
  page,
  users,
  collectivites,
}) => {
  test.setTimeout(10 * 60_000);
  await page.addInitScript(fakeCursor);

  // --- Données de démo -------------------------------------------------
  const programmeTete = await users.addUser({
    collectiviteId: null,
    prenom: 'Claire',
    nom: 'Dubois',
  });
  await addUserRoleSupport({
    databaseService,
    userId: programmeTete.data.id,
    isSupport: false,
    hasRoleTeteAdmin: true,
  });
  const auditeur = await users.addUser({
    collectiviteId: null,
    prenom: 'Camille',
    nom: 'Martin',
  });
  await addUserRoleSupport({
    databaseService,
    userId: auditeur.data.id,
    isSupport: false,
    hasRoleTeteAuditeur: true,
  });

  collectivites.registerCleanupFunc({
    cleanupByCollectiviteId: async (collectiviteId) => {
      const audits = await db
        .select({ id: auditTable.id })
        .from(auditTable)
        .where(eq(auditTable.collectiviteId, collectiviteId));
      const auditIds = audits.map((a) => a.id);
      if (auditIds.length) {
        await db
          .delete(auditeurTable)
          .where(inArray(auditeurTable.auditId, auditIds));
      }
      await db
        .delete(labellisationTable)
        .where(eq(labellisationTable.collectiviteId, collectiviteId));
      await db
        .delete(preuveLabellisationTable)
        .where(eq(preuveLabellisationTable.collectiviteId, collectiviteId));
      await db
        .delete(bibliothequeFichierTable)
        .where(eq(bibliothequeFichierTable.collectiviteId, collectiviteId));
      await db
        .delete(auditTable)
        .where(eq(auditTable.collectiviteId, collectiviteId));
      await db
        .delete(labellisationDemandeTable)
        .where(eq(labellisationDemandeTable.collectiviteId, collectiviteId));
      await setCollectiviteCotStatus(databaseService, collectiviteId, 'none');
    },
  });

  const ilYa = (jours: number) =>
    new Date(Date.now() - jours * 86_400_000).toISOString();

  const addDossier = async (
    nom: string,
    {
      envoyeeLe,
      etoiles = '2',
      dateDebut = null,
      valide = false,
      avecAuditeur = false,
    }: {
      envoyeeLe: string;
      etoiles?: EtoileAsString;
      dateDebut?: string | null;
      valide?: boolean;
      avecAuditeur?: boolean;
    }
  ) => {
    const { data: collectivite } = await collectivites.addCollectivite({ nom });
    const [demande] = await db
      .insert(labellisationDemandeTable)
      .values({
        collectiviteId: collectivite.id,
        referentiel: ReferentielIdEnum.CAE,
        enCours: false,
        envoyeeLe,
        sujet: 'labellisation',
        etoiles,
        demandeur: programmeTete.data.id,
      })
      .returning();
    const [audit] = await db
      .insert(auditTable)
      .values({
        collectiviteId: collectivite.id,
        referentielId: ReferentielIdEnum.CAE,
        demandeId: demande.id,
        dateDebut,
        valide,
        dateFin: valide ? new Date().toISOString() : null,
      })
      .returning();
    if (avecAuditeur) {
      await db
        .insert(auditeurTable)
        .values({ auditId: audit.id, auditeur: auditeur.data.id });
    }
    return { collectivite, demande, audit };
  };

  const valVert = await addDossier('CC du Val Vert', { envoyeeLe: ilYa(2) });
  const riveSud = await addDossier('Métropole Rive Sud', {
    envoyeeLe: ilYa(5),
    etoiles: '1',
  });
  // Pièce jointe d'une demande de 1ère étoile, que le programme TETE vérifie
  const [acteEngagement] = await db
    .insert(bibliothequeFichierTable)
    .values({
      collectiviteId: riveSud.collectivite.id,
      hash: buildRandomDocumentHash(),
      filename: 'acte-engagement-rive-sud.pdf',
    })
    .returning();
  await db.insert(preuveLabellisationTable).values({
    collectiviteId: riveSud.collectivite.id,
    demandeId: riveSud.demande.id,
    fichierId: acteEngagement.id,
    objet: 'acte_engagement',
    modifiedBy: programmeTete.data.id,
  });
  await addDossier('Agglomération des Trois Lacs', {
    envoyeeLe: ilYa(35),
    etoiles: '3',
    dateDebut: ilYa(20),
    avecAuditeur: true,
  });
  const beaumont = await addDossier('Ville de Beaumont', {
    envoyeeLe: ilYa(90),
    etoiles: '3',
    dateDebut: ilYa(60),
    valide: true,
    avecAuditeur: true,
  });

  const addCot = async (nom: string) => {
    const { data } = await collectivites.addCollectivite({ nom });
    await setCollectiviteCotStatus(databaseService, data.id, 'active');
    return data;
  };
  const paysBocager = await addCot('CA du Pays Bocager');
  await addCot('CC des Monts du Sud');

  await programmeTete.login();

  const panneau = page.getByTestId(`${T}.dossier`);
  // Pour la démo, on referme le panneau avant d'en ouvrir un autre : la
  // fermeture rend le changement de dossier plus lisible à l'écran (un clic
  // sur une autre ligne, panneau ouvert, remplace aussi son contenu).
  const openDossier = async (auditId: number) => {
    const ouvert = page.getByRole('complementary');
    if (await ouvert.isVisible().catch(() => false)) {
      await ouvert.getByRole('button').first().click();
      await pause(page, 800);
    }
    await page.getByTestId(`${T}.dossier-${auditId}`).click();
  };

  // --- 1. Nouveau menu Administration ----------------------------------
  await page.goto('/');
  // Bandeau d'incitation ProConnect, hors sujet pour la démo
  const proConnect = page.getByRole('link', { name: 'Rattacher mon compte' });
  if (await proConnect.isVisible().catch(() => false)) {
    await proConnect.locator('xpath=following-sibling::button[1]').click();
  }
  await pause(page);
  await caption(
    page,
    'Nouveau : un menu « Administration », réservé aux admins du programme TETE et aux super-admins'
  );
  await page.getByTestId('nav-user').click();
  await pause(page, 1000);
  await page.getByRole('link', { name: 'Administration' }).hover();
  await pause(page, 2500);
  await page.getByRole('link', { name: 'Administration' }).click();
  await page.waitForURL(/\/admin$/);
  await caption(
    page,
    'Le programme TETE y trouve l’outil « Gestion des labellisations »'
  );
  await page.getByText('Gestion des labellisations').first().hover();
  await pause(page, 1500);
  await page.getByText('Gestion des labellisations').first().click();
  await page.getByTestId(`${T}.onglet-en-attente`).waitFor();

  // --- 2. Vue d'ensemble ---------------------------------------------
  await caption(
    page,
    'Les dossiers d’audit et de labellisation, répartis en 3 onglets, plus les COT'
  );
  await caption(
    page,
    '« En attente » : les dossiers qui attendent une action du programme TETE'
  );

  // --- 3. Recherche synchronisée avec l'URL ---------------------------
  const recherche = page.getByPlaceholder('Nom ou identifiant');
  await caption(
    page,
    'Recherche par nom ou identifiant, gardée dans l’URL',
    1500
  );
  await recherche.click();
  await recherche.pressSequentially('Val Vert', { delay: 120 });
  await recherche.press('Enter');
  await page.waitForURL(/\$q=/);
  await pause(page, 3000);
  await recherche.fill('');
  await recherche.press('Enter');
  await pause(page);

  // --- 4. Détail d'un dossier : infos éditables -----------------------
  await caption(page, 'Un clic ouvre le dossier dans un panneau latéral', 1500);
  await openDossier(valVert.audit.id);
  await panneau.waitFor();
  await caption(
    page,
    'Le détail du dossier : statut, demande, auditeurs, historique'
  );
  await caption(
    page,
    'Le sujet et l’étoile demandée se corrigent directement dans le panneau',
    1500
  );
  await panneau.getByText('Sujet :').click();
  await pause(page, 2500);
  await page.keyboard.press('Escape');
  await pause(page, 1000);
  await panneau.getByText('Étoile demandée :').click();
  await pause(page, 2000);
  await page.getByRole('button', { name: 'troisième étoile' }).last().click();
  await pause(page, 3000);

  // --- 5. Attribution d'un auditeur -----------------------------------
  await caption(
    page,
    'Attribution d’un auditeur, parmi les comptes ayant le rôle auditeur',
    1500
  );
  await panneau.getByText('Audité par :').click();
  await pause(page, 1500);
  await page
    .getByPlaceholder('Rechercher par mots-clés')
    .pressSequentially('Camille Mar', { delay: 120 });
  await pause(page, 1000);
  await page.getByRole('button', { name: 'Camille Martin' }).click();
  await page.keyboard.press('Escape');
  await pause(page, 3000);
  await caption(
    page,
    'Avec un auditeur, le dossier passe dans « En cours »',
    1500
  );
  await page.getByTestId(`${T}.onglet-en-cours`).click();
  await pause(page, 3500);

  // --- 6. Validation d'une 1ère étoile --------------------------------
  await page.getByTestId(`${T}.onglet-en-attente`).click();
  await pause(page, 1500);
  await caption(page, 'Cas d’une demande de 1ère étoile', 1500);
  await openDossier(riveSud.audit.id);
  await panneau.waitFor();
  await pause(page, 1500);
  await caption(
    page,
    'Pas d’audit pour la 1ère étoile : le panneau affiche l’acte d’engagement à vérifier, à la place des auditeurs',
    5000
  );
  await panneau.getByText("Acte d'engagement").hover();
  await pause(page, 1500);
  await caption(
    page,
    'Si les pièces sont conformes, on valide la 1ère étoile',
    1500
  );
  await panneau.getByTestId(`${T}.decision-valider-premiere-etoile`).click();
  await pause(page, 1500);
  await caption(page, 'On confirme la date d’obtention', 2500);
  await page.getByRole('button', { name: 'Confirmer' }).click();
  await pause(page, 1500);
  await caption(
    page,
    'Le dossier est clos et la collectivité obtient sa 1ère étoile',
    4500
  );

  // --- 7. Labellisation après audit (étoile > 1) ----------------------
  await caption(
    page,
    'Cas d’un audit validé par l’auditeur, pour une 3e étoile',
    1500
  );
  await openDossier(beaumont.audit.id);
  await panneau.waitFor();
  await pause(page, 1500);
  await caption(
    page,
    'L’audit est validé : il reste au programme TETE à labelliser',
    2500
  );
  await panneau.getByTestId(`${T}.decision-labelliser`).click();
  await pause(page, 1500);
  await caption(
    page,
    'L’étoile obtenue (reprise de la demande, modifiable) et la date du CRA',
    4000
  );
  await page.getByRole('button', { name: 'Confirmer' }).click();
  await pause(page, 1500);
  await caption(
    page,
    'La labellisation est créée et le dossier est clos',
    4000
  );

  // --- 8. Dossiers clos -----------------------------------------------
  await page.getByTestId(`${T}.onglet-clos`).click();
  await caption(
    page,
    'Les deux dossiers se retrouvent dans « Dossiers clos »',
    4000
  );

  // --- 9. COT ---------------------------------------------------------
  await page.getByTestId(`${T}.onglet-cot`).click();
  await caption(
    page,
    'Les COT existantes : on peut seulement les désactiver',
    1500
  );
  await page
    .getByTestId(`${T}.cot-actif-${paysBocager.id}`)
    .scrollIntoViewIfNeeded();
  await pause(page, 1500);
  await page.getByTestId(`${T}.cot-actif-${paysBocager.id}`).click();
  await pause(page, 4000);
});

test('captures : menu Administration et outils du super-admin', async ({
  page,
  collectivites,
}) => {
  const { user } = await collectivites.addCollectiviteAndUser({
    collectiviteArgs: { nom: 'Ville de Beaumont' },
    userArgs: {
      prenom: 'Claire',
      nom: 'Dubois',
      isSupport: true,
      isSuperAdminRoleEnabled: true,
    },
  });
  await user.login();
  const dir = process.env.DEMO_SCREENSHOTS_DIR ?? 'test-results';

  await page.goto('/');
  const proConnect = page.getByRole('link', { name: 'Rattacher mon compte' });
  if (await proConnect.isVisible().catch(() => false)) {
    await proConnect.locator('xpath=following-sibling::button[1]').click();
  }
  // Masque l'indicateur de dev de Next et les widgets flottants en bas d'écran
  const masquerFlottants = () =>
    page.evaluate(() => {
      document.querySelectorAll('nextjs-portal').forEach((el) => el.remove());
      document.querySelectorAll<HTMLElement>('body *').forEach((el) => {
        const { position } = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        if (
          position === 'fixed' &&
          r.bottom > window.innerHeight - 120 &&
          r.width < 200
        ) {
          el.style.visibility = 'hidden';
        }
      });
    });

  await page.getByTestId('nav-user').click();
  await page.getByRole('link', { name: 'Administration' }).hover();
  await page.waitForTimeout(800);
  await masquerFlottants();
  await page.screenshot({ path: `${dir}/menu-administration.png` });

  await page.getByRole('link', { name: 'Administration' }).click();
  await page.waitForURL(/\/admin$/);
  await page.getByText('Gestion des labellisations').first().waitFor();
  await page.waitForTimeout(800);
  await masquerFlottants();
  await page.screenshot({
    path: `${dir}/outils-administration-super-admin.png`,
    fullPage: true,
  });
});
