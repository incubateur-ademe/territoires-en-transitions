import {useEffect} from 'react';
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
import {useCollectiviteId} from 'core-logic/hooks/params';

export const Redirector = () => {
  const history = useHistory();
  const {pathname} = useLocation();
  const {isConnected} = useAuth();
  const {invitationState} = useInvitationState();
  const recoveryToken = useRecoveryToken();
  const accessToken = useAccessToken();
  const ownedCollectivites = useOwnedCollectivites();
  const isHomePath = pathname === homePath;
  const isCollectivitePath = useCollectiviteId() !== null;

  // Quand l'utilisateur est connecté, mais n'est associé à aucune collectivité
  // cas: après s'être retiré de la seule collectivité dont l'utilisateur était associé
  // cas: n'a jamais été associé
  useEffect(() => {
    if (!isConnected || isCollectivitePath || isHomePath) return;

    // Quand l'utilisateur est associé à au moins une collectivite
    if (ownedCollectivites && ownedCollectivites.length >= 1) {
      history.push(
        makeCollectiviteTableauBordUrl({
          collectiviteId: ownedCollectivites[0].collectivite_id,
        })
      );
    } else {
      history.push(homePath);
    }
  }, [ownedCollectivites, isCollectivitePath, isConnected, isHomePath]);

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
