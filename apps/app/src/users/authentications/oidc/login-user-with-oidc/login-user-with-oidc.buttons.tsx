'use client';

import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { ProConnectButton } from '@tet/ui';

type OidcProviderButtonsProps = {
  /**
   * Préfixe des `id` des boutons, pour distinguer les usages (connexion vs
   * inscription) et éviter des `id` dupliqués dans le DOM.
   */
  idPrefix: string;
  /**
   * Contexte de création de compte : ajoute `intent=creation` à l'URL de login
   * pour que le backend crée directement le compte au retour (cas 3) au lieu de
   * demander « avez-vous déjà un compte ? ».
   */
  creation?: boolean;
  /**
   * Provider à ne PAS afficher (déjà mis en avant ailleurs, ex. MonCompteAdeme
   * rendu par le bloc recommandé) : on affiche alors les providers restants.
   */
  exclude?: string;
};

/**
 * Boutons de connexion/inscription via les providers OIDC (ProConnect,
 * MonCompteAdeme), partagés entre les modals de connexion et de création de
 * compte. N'affiche que les providers réellement activés côté backend
 * (flags *_ENABLED, via `listActiveProviders`) : désactiver un provider
 * retire automatiquement son bouton. Chaque provider est indépendant.
 *
 * TODO : provisoire (dev/préprod) en attendant l'intégration DSFR complète
 * et le retrait du parcours classique, post-refactor auth→app.
 */
export const LoginUserWithOidcButtons = ({
  idPrefix,
  creation,
  exclude,
}: OidcProviderButtonsProps) => {
  const trpc = useTRPC();
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

  const { data: providersActifs } = useQuery(
    trpc.users.authentications.oidc.listActiveProviders.queryOptions()
  );

  const providers = (providersActifs ?? []).filter((p) => p !== exclude);
  if (!backendUrl || providers.length === 0) {
    return null;
  }

  const suffixe = creation ? '?intent=creation' : '';
  const loginUrl = (provider: string) =>
    `${backendUrl}/api/v1/${provider}/login${suffixe}`;

  return (
    <div className="flex flex-col items-center gap-3 mt-4 mb-4">
      {providers.map((provider) => (
        <ProConnectButton
          key={provider}
          id={`${idPrefix}-${provider}`}
          url={loginUrl(provider)}
          dataTest={`${idPrefix}.oidc.${provider}-button`}
        />
      ))}
    </div>
  );
};
