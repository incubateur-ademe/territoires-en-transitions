import {useEffect} from 'react';
import {useHistory, useLocation} from 'react-router-dom';
import {
  myCollectivitesPath,
  signInPath,
  resetPwdPath,
  resetPwdToken,
} from 'app/paths';
import {useAuth} from 'core-logic/api/auth/AuthProvider';
import {useInvitationState} from 'core-logic/hooks/useInvitationState';

export const Redirector = () => {
  const history = useHistory();
  const {pathname, hash} = useLocation();
  const {isConnected} = useAuth();
  const {invitationState} = useInvitationState();

  // réagit aux changements de l'état "invitation"
  useEffect(() => {
    // quand l'invitation est acceptée on redirige vers "mes collectivités"
    if (invitationState === 'accepted') history.push(myCollectivitesPath);
    // si l'invitation requiert la connexion on redirigue sur "se connecter"
    if (invitationState === 'waitingForLogin') history.push(signInPath);
  }, [invitationState]);

  // réagit aux changements de l'état utilisateur connecté/déconnecté
  useEffect(() => {
    // si déconnecté on redirige sur la page d'accueil (ou la page "se
    // connecter" dans le cas d'une invitation en attente de connexion)
    if (!isConnected) {
      history.push(invitationState === 'waitingForLogin' ? signInPath : '/');
    } else if (pathname === '/') {
      // si connecté et qu'on navigue sur la home on redirige vers "mes collectivités"
      history.push(myCollectivitesPath);
    }
  }, [isConnected, invitationState]);

  const {type: _type, access_token} = parseHash(hash);
  if (access_token && _type === 'recovery') {
    // on est en mode récupération de mdp
    history.push(resetPwdPath.replace(`:${resetPwdToken}`, access_token));
    return null;
  }

  return null;
};

// génère un dictionnaire de clé/valeur à partir d'une chaîne de la forme
// #cle=valeur&cle2=val2
type TKeyValues = {[k: string]: string};
const parseHash = (hash: string): TKeyValues =>
  hash
    .substring(1) // saute le # en début de chaîne
    .split('&') // sépare les groupes de clé/valeur
    .reduce((dict, kv) => {
      // ajoute la clé/valeur au dictionnaire
      const [k, v] = kv.split('=');
      return {
        ...dict,
        [k]: v,
      };
    }, {});
