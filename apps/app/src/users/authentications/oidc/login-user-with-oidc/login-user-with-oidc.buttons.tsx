'use client';

import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { ProConnectButton } from '@tet/ui';
import { buildLoginWithOidcUrl } from './login-user-with-oidc.urls';

type OidcProviderButtonsProps = {
  /**
   * Préfixe des `id` des boutons, pour éviter des `id` dupliqués dans le DOM.
   */
  idPrefix: string;
  /**
   * Provider à ne PAS afficher (déjà mis en avant par le bloc recommandé) :
   * on affiche alors les providers restants.
   */
  exclude?: string;
  /** Destination d'après authentification (`redirect_to` de la page). */
  next?: string;
};

/**
 * Boutons de connexion via les providers OIDC (ProConnect, MonCompteAdeme).
 * N'affiche que les providers réellement activés côté backend (flags
 * *_ENABLED, via `listActiveProviders`) : désactiver un provider retire
 * automatiquement son bouton. Chaque provider est indépendant.
 */
export const LoginUserWithOidcButtons = ({
  idPrefix,
  exclude,
  next,
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

  const loginUrl = (provider: string) =>
    buildLoginWithOidcUrl({ backendUrl, provider, next });

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
