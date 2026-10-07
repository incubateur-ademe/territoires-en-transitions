import { finaliserMonInscriptionUrl, tdbPathShortcut } from '@/app/app/paths';
import { requireOnboardedUser } from '@/app/users/data/require-onboarded-user.server';
import { getAuthUser } from '@tet/api/utils/supabase/auth-user.server';
import { redirect } from 'next/navigation';
import { HomePage } from './home.page';

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Page({ searchParams }: PageProps) {
  const authUser = await getAuthUser();

  // Visiteur non authentifié → page d'accueil publique.
  if (!authUser) {
    return <HomePage />;
  }

  // Authentifié : requireOnboardedUser gère la complétion du profil (→ /signup)
  // puis on route vers le tableau de bord ou le tunnel « finaliser inscription ».
  const user = await requireOnboardedUser();
  const destination =
    user.collectivites.length > 0
      ? tdbPathShortcut
      : finaliserMonInscriptionUrl;

  redirect(withSearchParams(destination, await searchParams));
}

/**
 * `redirect()` n'emporte pas la query string. Sans ce report, un signal
 * one-shot déposé sur `/` — `comptes-associes=1`, lu par `ToastLiaisonComptes`
 * — serait perdu avant d'atteindre la page qui doit l'afficher.
 */
function withSearchParams(
  path: string,
  searchParams: Record<string, string | string[] | undefined>
): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    for (const item of Array.isArray(value) ? value : [value]) {
      if (item !== undefined) {
        query.append(key, item);
      }
    }
  }
  const search = query.toString();
  return search ? `${path}?${search}` : path;
}
