import {useEffect} from 'react';
import {useHistory, useLocation} from 'react-router-dom';
import {
  homePath,
  invitationPath,
  makeCollectiviteTableauBordUrl,
  resetPwdPath,
  resetPwdToken,
  signInPath,
} from 'app/paths';
import {useAuth} from 'core-logic/api/auth/AuthProvider';
import {useInvitationState} from 'core-logic/hooks/useInvitationState';
import {useAccessToken} from 'core-logic/hooks/useVerifyRecoveryToken';
import {useOwnedCollectivites} from 'core-logic/hooks/useOwnedCollectivites';

export const Redirector = () => {
  const history = useHistory();
  const {pathname} = useLocation();
  const {isConnected} = useAuth();
  const {invitationState} = useInvitationState();
  const accessToken = useAccessToken();
  const userCollectivites = useOwnedCollectivites();
  const isSigninPath = pathname === signInPath;
  const isJustSignedIn = // L'utilisateur vient de se connecter.
    isConnected && isSigninPath && userCollectivites !== null;
  const isLandingConnected = // L'utilisateur est connecté et arrive sur '/'.
    isConnected && pathname === '/' && userCollectivites !== null;
  const isInvitationJustAccepted =
    isConnected &&
    invitationState === 'accepted' &&
    pathname.startsWith(invitationPath) &&
    userCollectivites &&
    userCollectivites.length >= 1;

  // Quand l'utilisateur connecté
  // - est associé à aucune collectivité :
  //    on redirige vers la page "Collectivités engagées"
  // - est associé à une ou plus collectivité(s) :
  //    on redirige vers le tableau de bord de la première collectivité
  useEffect(() => {
    if (isJustSignedIn || isLandingConnected || isInvitationJustAccepted) {
      if (userCollectivites && userCollectivites.length >= 1) {
        history.push(
          makeCollectiviteTableauBordUrl({
            collectiviteId: userCollectivites[0].collectivite_id,
          })
        );
      } else {
        history.push(homePath);
      }
    }
  }, [isJustSignedIn, isLandingConnected, isInvitationJustAccepted]);

  // réagit aux changements de l'état "invitation"
  useEffect(() => {
    // si l'invitation requiert la connexion on redirigue sur "se connecter"
    if (invitationState === 'waitingForLogin') history.push(signInPath);
  }, [invitationState]);

  useEffect(() => {
    // redirige vers le formulaire de réinit. de mdp si un jeton d'accès a été créé
    if (accessToken) {
      history.push(resetPwdPath.replace(`:${resetPwdToken}`, accessToken));
      return;
    }
  }, [accessToken]);

  // réagit aux changements de l'état utilisateur connecté/déconnecté
  useEffect(() => {
    // si déconnecté on redirige sur la page d'accueil (ou la page "se
    // connecter" dans le cas d'une invitation en attente de connexion)
    if (!isConnected && invitationState === 'waitingForLogin') {
      history.push(signInPath);
    }
  }, [isConnected, invitationState]);

  return null;
};
