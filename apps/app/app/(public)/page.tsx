import { finaliserMonInscriptionUrl, tdbPathShortcut } from '@/app/app/paths';
import { requireOnboardedUser } from '@/app/users/data/require-onboarded-user.server';
import { getAuthUser } from '@tet/api/utils/supabase/auth-user.server';
import { redirect } from 'next/navigation';
import { HomePage } from './home.page';

export default async function Page() {
  const authUser = await getAuthUser();

  // Visiteur non authentifié → page d'accueil publique.
  if (!authUser) {
    return <HomePage />;
  }

  // Authentifié : requireOnboardedUser gère la complétion du profil (→ /signup)
  // puis on route vers le tableau de bord ou le tunnel « finaliser inscription ».
  const user = await requireOnboardedUser();
  redirect(
    user.collectivites.length > 0
      ? tdbPathShortcut
      : finaliserMonInscriptionUrl
  );
}
