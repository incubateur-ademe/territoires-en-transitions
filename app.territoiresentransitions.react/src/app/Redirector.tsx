import {useEffect} from 'react';
import {useHistory, useLocation} from 'react-router-dom';
import {
  homePath,
  invitationPath,
  makeCollectiviteAccueilUrl,
  signInPath,
  signUpPath,
} from 'app/paths';
import {useAuth, useDCP} from 'core-logic/api/auth/AuthProvider';
import {useInvitationState} from 'core-logic/hooks/useInvitationState';
import {useOwnedCollectivites} from 'core-logic/hooks/useOwnedCollectivites';

export const Redirector = () => {
  const history = useHistory();
  const {pathname} = useLocation();
  const {isConnected} = useAuth();
  const {data: DCP} = useDCP();
  const {invitationState} = useInvitationState();
  const userCollectivites = useOwnedCollectivites();
  const isLandingConnected = isConnected && pathname === '/'; // L'utilisateur est connecté et arrive sur '/'.
  const isInvitationJustAccepted =
    isConnected &&
    invitationState === 'accepted' &&
    pathname.startsWith(invitationPath) &&
    userCollectivites &&
    userCollectivites.length >= 1;

  // Quand l'utilisateur connecté
  // - est associé à aucune collectivité :
  //    on redirige vers la page "Collectivités"
  // - est associé à une ou plus collectivité(s) :
  //    on redirige vers le tableau de bord de la première collectivité
  useEffect(() => {
    if (userCollectivites && (isLandingConnected || isInvitationJustAccepted)) {
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
  }, [isLandingConnected, isInvitationJustAccepted, userCollectivites]);

  // réagit aux changements de l'état "invitation"
  useEffect(() => {
    // si l'invitation requiert la connexion, on redirige sur "se connecter"
    if (invitationState === 'waitingForLogin') {
      document.location.replace(signInPath);
    }
  }, [invitationState]);

  // réagit aux changements de l'état utilisateur connecté/déconnecté
  useEffect(() => {
    // si déconnecté on redirige sur la page d'accueil (ou la page "se
    // connecter" dans le cas d'une invitation en attente de connexion)
    if (!isConnected && invitationState === 'waitingForLogin') {
      document.location.replace(signInPath);
    }
  }, [isConnected, invitationState]);

  // redirige vers l'étape 3 de la création de compte si il manque des infos aux DCP
  const userInfoRequired =
    isConnected &&
    DCP &&
    (!DCP?.cgu_acceptees_le || !DCP?.nom || !DCP?.prenom || !DCP?.telephone);
  useEffect(() => {
    if (userInfoRequired) {
      document.location.replace(`${signUpPath}?view=etape3`);
    }
  }, [userInfoRequired]);

  return null;
};
