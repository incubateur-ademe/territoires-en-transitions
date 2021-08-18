import {connected, currentUser} from 'core-logic/api/authentication';

/**
 * Allows to check current user identity. Not used for now.
 */
export const IdentityPage = () => {
  const isConnected = connected();
  const user = currentUser();

  if (isConnected) {
    return (
      <div>
        <span>Vous êtes connecté </span>
        {user !== null && (
          <span>
            en tant que {user.prenom} {user.nom} ({user.email})
          </span>
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
