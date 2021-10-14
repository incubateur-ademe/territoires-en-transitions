import {connected} from 'core-logic/api/authentication';

/**
 * Allows to check current user identity. Not used for now.
 */
export const IdentityPage = () => {
  const isConnected = connected();
  if (isConnected) {
    return (
      <div>
        <span>Vous êtes connecté !</span>
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
