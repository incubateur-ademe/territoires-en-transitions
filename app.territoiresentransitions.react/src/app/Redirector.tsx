import {
  myCollectivitesPath,
  signInPath,
  resetPwdPath,
  resetPwdToken,
} from 'app/paths';
import {authBloc} from 'core-logic/observables/authBloc';
import {reaction} from 'mobx';
import {useHistory, useLocation} from 'react-router-dom';
import {currentCollectiviteBloc} from 'core-logic/observables';
import {useCollectiviteId} from 'core-logic/hooks/params';

export const CollectiviteRedirector = () => {
  const collectiviteId = useCollectiviteId();
  console.log(collectiviteId);
  currentCollectiviteBloc.update({collectiviteId});

  return null;
};

export const ConnectedRedirector = () => {
  const history = useHistory();
  const {hash} = useLocation();

  const {type: _type, access_token} = parseHash(hash);
  if (access_token && _type === 'recovery') {
    // on est en mode récupération de mdp
    history.push(resetPwdPath.replace(`:${resetPwdToken}`, access_token));
    return null;
  }

  reaction(
    () => authBloc.connected,
    connected => {
      console.log('authBloc connected changed', connected);

      if (
        connected &&
        authBloc.invitationState !== 'waitingForLogin' &&
        authBloc.invitationState !== 'waitingForAcceptation'
      ) {
        history.push(myCollectivitesPath);
      } else {
        history.push(signInPath);
      }
    }
  );

  reaction(
    () => authBloc.invitationState,
    state => {
      console.log('authBloc invitation state changed', state);
      if (state === 'accepted') history.push(myCollectivitesPath);
      if (state === 'waitingForLogin') history.push(signInPath);
    }
  );

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
