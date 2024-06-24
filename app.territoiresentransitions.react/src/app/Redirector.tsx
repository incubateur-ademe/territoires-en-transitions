import {getAuthPaths} from '@tet/api';
import {homePath, makeCollectiviteAccueilUrl} from 'app/paths';
import {useAuth} from 'core-logic/api/auth/AuthProvider';
import {
  acceptAgentInvitation,
  useInvitationState,
} from 'core-logic/hooks/useInvitationState';
import {useOwnedCollectivites} from 'core-logic/hooks/useOwnedCollectivites';
import {useEffect} from 'react';
import {useHistory, useLocation} from 'react-router-dom';

export const Redirector = () => {
  const history = useHistory();
  const {pathname} = useLocation();
  const {isConnected} = useAuth();
  const {invitationId, invitationEmail, consume} = useInvitationState();
  const userCollectivites = useOwnedCollectivites();
  const isLandingConnected = isConnected && pathname === '/'; // L'utilisateur est connecté et arrive sur '/'.

  // Quand l'utilisateur connecté
  // - est associé à aucune collectivité :
  //    on redirige vers la page "Collectivités"
  // - est associé à une ou plus collectivité(s) :
  //    on redirige vers le tableau de bord de la première collectivité
  useEffect(() => {
    if (userCollectivites && isLandingConnected) {
      if (
        userCollectivites &&
        userCollectivites.length >= 1 &&
        userCollectivites[0].collectivite_id
      ) {
        history.push(
          makeCollectiviteAccueilUrl({
            collectiviteId: userCollectivites[0].collectivite_id,
          })
        );
      } else {
        history.push(homePath);
      }
    }
  }, [isLandingConnected, userCollectivites]);

  // réagit aux changements de l'état "invitation"
  useEffect(() => {
    // si déconnecté on redirige sur la page d'accueil (ou la page "créer un
    // compte" dans le cas d'une invitation en attente)
    if (invitationId) {
      if (isConnected && consume) {
        // si connecté on consomme l'invitation
        acceptAgentInvitation(invitationId).then(() => {
          history.replace('/');
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
  }, [isConnected, invitationId]);

  return null;
};
