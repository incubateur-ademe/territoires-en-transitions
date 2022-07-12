import {useEffect} from 'react';
import {useHistory, useLocation} from 'react-router-dom';
import {myCollectivitesPath, signInPath} from 'app/paths';
import {useAuth} from 'core-logic/api/auth/AuthProvider';
import {useInvitationState} from 'core-logic/hooks/useInvitationState';
import {useRecoveryToken} from 'core-logic/hooks/useRecoveryToken';

export const Redirector = () => {
  const history = useHistory();
  const {pathname} = useLocation();
  const {isConnected} = useAuth();
  const {invitationState} = useInvitationState();
  const recoveryToken = useRecoveryToken();

  // réagit aux changements de l'état "invitation"
  useEffect(() => {
    // quand l'invitation est acceptée on redirige vers "mes collectivités"
    if (invitationState === 'accepted') history.push(myCollectivitesPath);
    // si l'invitation requiert la connexion on redirigue sur "se connecter"
    if (invitationState === 'waitingForLogin') history.push(signInPath);
  }, [invitationState]);

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
      history.push(myCollectivitesPath);
    }
  }, [isConnected, invitationState, recoveryToken]);

  return null;
};
