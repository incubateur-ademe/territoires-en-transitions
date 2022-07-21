import {useEffect} from 'react';
import {useHistory, useLocation} from 'react-router-dom';
import {
  allCollectivitesPath,
  homePath,
  makeCollectiviteTableauBordUrl,
  myCollectivitesPath,
  resetPwdPath,
  resetPwdToken,
  signInPath,
} from 'app/paths';
import {useAuth} from 'core-logic/api/auth/AuthProvider';
import {useInvitationState} from 'core-logic/hooks/useInvitationState';
import {useRecoveryToken} from 'core-logic/hooks/useRecoveryToken';
import {useAccessToken} from 'core-logic/hooks/useVerifyRecoveryToken';
import {useOwnedCollectivites} from 'core-logic/hooks/useOwnedCollectivites';
import {useCurrentCollectivite} from 'core-logic/hooks/useCurrentCollectivite';

export const Redirector = () => {
  const history = useHistory();
  const {pathname} = useLocation();
  const {isConnected} = useAuth();
  const {invitationState} = useInvitationState();
  const recoveryToken = useRecoveryToken();
  const accessToken = useAccessToken();
  const ownedCollectivites = useOwnedCollectivites();
  const currentCollectivite = useCurrentCollectivite();

  useEffect(() => {
    if (currentCollectivite !== null || !isConnected) return;

    // Quand l'utilisateur est associé à au moins une collectivite
    if (ownedCollectivites?.length) {
      history.push(
        makeCollectiviteTableauBordUrl({
          collectiviteId: ownedCollectivites[0].collectivite_id,
        })
      );
    }

    // Quand l'utilisateur n'est associé à aucune collectivite
    else {
      history.push(allCollectivitesPath);
    }
  }, [ownedCollectivites, currentCollectivite, isConnected]);

  // réagit aux changements de l'état "invitation"
  useEffect(() => {
    // quand l'invitation est acceptée on redirige vers "mes collectivités"
    if (invitationState === 'accepted') history.push(myCollectivitesPath);
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
      // si connecté et qu'on navigue sur la home on redirige vers "mes collectivités"
      history.push(homePath);
    }
  }, [isConnected, invitationState, recoveryToken]);

  return null;
};
