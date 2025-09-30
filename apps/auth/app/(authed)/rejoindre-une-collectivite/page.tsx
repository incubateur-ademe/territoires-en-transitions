import { getUser } from '@/api/users/user-details.fetch.server';
import { UserProvider } from '@/api/users/user-provider';
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
  const user = await getUser();

  return (
    <UserProvider user={user}>
      <RejoindreUneCollectivitePage redirectTo={redirect_to} />;
    </UserProvider>
  );
}
