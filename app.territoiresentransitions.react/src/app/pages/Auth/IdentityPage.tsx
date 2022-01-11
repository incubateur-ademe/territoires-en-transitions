/**
 * Allows to check current user identity. Not used for now.
 */
import {authBloc} from 'core-logic/observables';

export const IdentityPage = () => {
  if (authBloc.connected) {
    return (
      <div>
        <span>Vous êtes connecté </span>
        {authBloc.userId !== null && (
          <span>en tant que {authBloc.userId})</span>
        )}
        <span>.</span>
      </div>
    );
  } else {
    return (
      <div>
        <p>Vous n'êtes pas connecté</p>
      </div>
    );
  }
};
