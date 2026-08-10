import { expect } from '@playwright/test';
import { test } from '../../main.fixture';
import { enableOidcFront } from './login-user-with-oidc.helpers';

/** URL de liaison volontaire posée par la bannière et la modale d'incitation. */
const OIDC_LINK_HREF = /\/api\/v1\/moncompteademe\/login\?.*mode=link/;

/**
 * Incitation « connexion unifiée » MonCompteAdeme (bannière + modale) et
 * boutons de connexion OIDC. MCA/ProConnect sont activés *à la volée* côté
 * client (`enableOidcFront`), sans dépendre des flags backend `*_ENABLED` :
 * le test reste vert que le provider soit activé (dev/local) ou non (CI).
 */
test.describe('Incitation « connexion unifiée » MonCompteAdeme', () => {
  test("la bannière d'annonce invite à lier MonCompteAdeme et se masque à la fermeture", async ({
    page,
    collectivites,
  }) => {
    const { collectivite } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });

    // On neutralise la MODALE (drapeau de session « déjà vue ») pour isoler la
    // bannière — sinon la modale s'ouvre par-dessus en overlay.
    await page.addInitScript(() =>
      window.sessionStorage.setItem('oidc-modal-seen', '1')
    );
    await enableOidcFront(page);

    await page.goto(`/collectivite/${collectivite.data.id}/accueil`, {
      waitUntil: 'domcontentloaded',
    });

    const banner = page.getByTestId('oidc.banner');
    await expect(banner).toBeVisible();
    await expect(banner.getByRole('link')).toHaveAttribute(
      'href',
      OIDC_LINK_HREF
    );

    // La croix masque durablement la bannière (préférence persistée côté
    // serveur → `showBanner` repasse à false après refetch).
    await page.getByTestId('oidc.banner.fermer').click();
    await expect(banner).toBeHidden();
  });

  test("la modale d'incitation post-connexion propose de lier MonCompteAdeme", async ({
    page,
    collectivites,
  }) => {
    const { collectivite } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });

    await enableOidcFront(page);

    await page.goto(`/collectivite/${collectivite.data.id}/accueil`, {
      waitUntil: 'domcontentloaded',
    });

    // Le bouton « Lier » de la modale prouve son ouverture automatique et pointe
    // vers le login OIDC en mode liaison volontaire.
    const modalLinkButton = page.getByTestId('oidc.modal.lier');
    await expect(modalLinkButton).toBeVisible();
    await expect(modalLinkButton).toHaveAttribute('href', OIDC_LINK_HREF);
  });
});

test.describe('Écran de connexion', () => {
  test('le fournisseur d’identité est mis en avant avec le badge « Recommandé »', async ({
    page,
  }) => {
    await enableOidcFront(page);

    await page.goto('/login', { waitUntil: 'domcontentloaded' });

    // Le badge accompagne le bouton mis en avant : c'est le parcours conseillé,
    // et désormais le seul chemin de création de compte.
    await expect(page.getByTestId('oidc.recommande')).toBeVisible();

    // Les onglets email + mot de passe restent accessibles aux comptes existants.
    await expect(
      page.getByRole('tab', { name: 'Connexion avec mot de passe' })
    ).toBeVisible();
  });
});
