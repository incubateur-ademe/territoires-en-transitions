import { finaliserMonInscriptionUrl } from '@/app/app/paths';
import { AppLayout } from '@/app/ui/layout/app-layout';
import { isAllowedWithoutCollectivite } from '@/app/users/data/is-allowed-without-collectivite';
import { requireOnboardedUser } from '@/app/users/data/require-onboarded-user.server';
import { SidePanelProvider } from '@/app/ui/layout/side-panel/side-panel.context';
import { ToggleSuperAdminModeCheckbox } from '@/app/users/authorizations/super-admin-mode/toggle-super-admin-mode.checkbox';
import { hasPermission } from '@tet/domain/users';
import { PageHeaderStickyHeightProvider } from '@tet/ui';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { ReactNode } from 'react';
import { AuthedProviders } from './authed-providers';

export default async function Layout({ children }: { children: ReactNode }) {
  // Garde d'onboarding (auth + DCP). Redirige vers /login ou /signup?view=etape3
  // si nécessaire ; sinon renvoie l'utilisateur complet (avec collectivités).
  const user = await requireOnboardedUser();

  // Tunnel d'onboarding (UX, pas un contrôle d'accès aux données) : sans aucune
  // collectivité, seules les pages autorisées sont servies ; toute autre route
  // renvoie vers « finaliser mon inscription ». L'accès effectif aux données
  // d'une collectivité reste protégé en aval (layout [collectiviteId],
  // groupe (acces-restreint), hasCollectivitePermission).
  //
  // `x-current-path` est réécrit par le proxy à partir de l'URL réelle
  // (request.nextUrl.pathname) et n'est donc pas falsifiable côté client ; en
  // l'absence de valeur on échoue en sécurité (chaîne vide → non autorisé).
  if (user.collectivites.length === 0) {
    const currentPath = (await headers()).get('x-current-path') ?? '';
    if (!isAllowedWithoutCollectivite(currentPath)) {
      redirect(finaliserMonInscriptionUrl);
    }
  }

  const canToggleSuperAdmin = hasPermission(
    user,
    'users.authorizations.mutate_super_admin_role'
  );

  return (
    <AuthedProviders user={user}>
      <PageHeaderStickyHeightProvider>
        <SidePanelProvider>
          <AppLayout
            belowFooterSlot={
              canToggleSuperAdmin ? <ToggleSuperAdminModeCheckbox /> : undefined
            }
          >
            {children}
          </AppLayout>
        </SidePanelProvider>
      </PageHeaderStickyHeightProvider>
    </AuthedProviders>
  );
}
