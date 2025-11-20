import { UserProviderStore } from '@tet/api/users/index.server';
import { RejoindreUneCollectivitePage } from './page.client';

/**
 * Affiche la page "rejoindre une collectivité"
 *
 * Après le rattachement à la collectivité (ou l'annulation), l'utilisateur est redirigé sur la page associée à l'url contenu dans le param. `redirect_to`
 */
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{
    redirect_to: string;
  }>;
}) {
  const { redirect_to = '/' } = await searchParams;

  return (
    <UserProviderStore>
      <RejoindreUneCollectivitePage redirectTo={redirect_to} />;
    </UserProviderStore>
  );
}
