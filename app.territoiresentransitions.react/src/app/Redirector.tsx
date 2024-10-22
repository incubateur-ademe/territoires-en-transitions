import { getAuthPaths } from '@tet/api';
import {
  finaliserMonInscriptionUrl,
  makeCollectiviteAccueilUrl,
  makeTableauBordUrl,
  signUpPath,
} from 'app/paths';
import { useAuth } from 'core-logic/api/auth/AuthProvider';
import {
  acceptAgentInvitation,
  useInvitationState,
} from 'core-logic/hooks/useInvitationState';
import { usePlanActionsPilotableFetch } from 'core-logic/hooks/useOwnedCollectivites';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export const Redirector = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { isConnected, user } = useAuth();
  const { invitationId, invitationEmail, consume } = useInvitationState();

  const collectiviteId = user?.collectivites?.[0]?.collectivite_id;
  const { data: plansData } = usePlanActionsPilotableFetch(collectiviteId);

  const isLandingConnected = user && pathname === '/'; // L'utilisateur est connecté et arrive sur '/'.

  // Quand l'utilisateur connecté
  // - est associé à aucune collectivité :
  //    on redirige vers la page "Collectivités"
  // - est associé à une ou plus collectivité(s) :
  //      on redirige vers la 1ère collectivité sur la page :
  //      - tableau de bord des plans d'action si il y a au moins un plan d'actions pilotables
  //      - et sinon vers la synthèse de l'état des lieux
  useEffect(() => {
    if (user && !user.dcp) {
      // Redirige l'utilisateur vers la page de saisie des DCP si nécessaire
      document.location.replace(`${signUpPath}&view=etape3`);
    }

    if (!isLandingConnected) {
      return;
    }

    if (!collectiviteId) {
      router.push(finaliserMonInscriptionUrl);
      return;
    }

    const auMoinsUnPlanActionsPilotable = !!plansData?.plans?.length;

    if (plansData?.plans && !auMoinsUnPlanActionsPilotable) {
      router.push(makeCollectiviteAccueilUrl({ collectiviteId }));
      return;
    }

    router.push(
      makeTableauBordUrl({
        collectiviteId,
        view:
          user.collectivites?.find((c) => c.collectivite_id)?.membre
            ?.fonction === 'politique'
            ? 'collectivite'
            : 'personnel',
      })
    );
  }, [isLandingConnected, collectiviteId, user, plansData, router]);

  // réagit aux changements de l'état "invitation"
  useEffect(() => {
    // si déconnecté on redirige sur la page d'accueil (ou la page "créer un
    // compte" dans le cas d'une invitation en attente)
    if (invitationId) {
      if (isConnected && consume) {
        // si connecté on consomme l'invitation
        acceptAgentInvitation(invitationId).then(() => {
          router.replace('/');
        });
      } else if (!isConnected && !consume) {
        // si déconnecté on redirige sur la page "créer un compte"
        const signUpPathFromInvitation = new URL(
          getAuthPaths(
            document.location.hostname,
            `${document.location.href}?consume=1`
          ).signUp
        );
        // ajoute l'email associé à l'invitation afin que le formulaire soit pré-rempli
        if (invitationEmail) {
          signUpPathFromInvitation.searchParams.append(
            'email',
            invitationEmail
          );
        }

        document.location.replace(signUpPathFromInvitation);
      }
    }
  }, [isConnected, invitationId, router, invitationEmail, consume]);

  return null;
};
