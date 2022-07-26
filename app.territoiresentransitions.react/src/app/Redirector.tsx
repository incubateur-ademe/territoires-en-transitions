import {useEffect, useState} from 'react';
import {useHistory, useLocation} from 'react-router-dom';
import {
  homePath,
  makeCollectiviteTableauBordUrl,
  resetPwdPath,
  resetPwdToken,
  signInPath,
} from 'app/paths';
import {useAuth} from 'core-logic/api/auth/AuthProvider';
import {useInvitationState} from 'core-logic/hooks/useInvitationState';
import {useRecoveryToken} from 'core-logic/hooks/useRecoveryToken';
import {useAccessToken} from 'core-logic/hooks/useVerifyRecoveryToken';
import {useOwnedCollectivites} from 'core-logic/hooks/useOwnedCollectivites';

export const Redirector = () => {
  const history = useHistory();
  const {pathname} = useLocation();
  const {isConnected} = useAuth();
  const {invitationState} = useInvitationState();
  const recoveryToken = useRecoveryToken();
  const accessToken = useAccessToken();
  const userCollectivites = useOwnedCollectivites();
  const isSigninPath = pathname === signInPath;
  const justSignedIn =
    isConnected && isSigninPath && userCollectivites !== null;

  // Quand l'utilisateur connecté
  // - est associé à aucune collectivité :
  //    on redirige vers la page "Collectivités engagées"
  // - est associé à une ou plus collectivité(s) :
  //    on redirige vers le tableau de bord de la première collectivité
  useEffect(() => {
    if (!justSignedIn) return;

    if (userCollectivites && userCollectivites.length >= 1) {
      history.push(
        makeCollectiviteTableauBordUrl({
          collectiviteId: userCollectivites[0].collectivite_id,
        })
      );
    } else {
      history.push(homePath);
    }
  }, [justSignedIn]);

  // réagit aux changements de l'état "invitation"
  useEffect(() => {
    // quand l'invitation est acceptée on redirige vers "toutes les collectivités"
    if (invitationState === 'accepted') history.push(homePath);
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
    // n'applique pas les règles suivantes si un jeton de réinit. du mdp est trouvé
    if (recoveryToken) return;
    // si déconnecté on redirige sur la page d'accueil (ou la page "se
    // connecter" dans le cas d'une invitation en attente de connexion)
    if (!isConnected) {
      history.push(invitationState === 'waitingForLogin' ? signInPath : '/');
    } else if (pathname === '/') {
      // si connecté et qu'on navigue sur la home on redirige vers "toutes les collectivités"
      history.push(homePath);
    }
  }, [isConnected, invitationState, recoveryToken]);

  return null;
};
