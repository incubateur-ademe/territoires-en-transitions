import {useState} from 'react';
import {useVerifyRecoveryToken} from 'core-logic/hooks/useVerifyRecoveryToken';

/**
 * Consomme le recovery token pour obtenir un auth token.
 * Affiche le statut de la vérification du token.
 */
const Recovery = () => {
  const {isError, isLoading} = useVerifyRecoveryToken();

  if (isError) {
    return <span>Une erreur est survenue</span>;
  }

  if (isLoading) {
    return <span>Vérification en cours</span>;
  }

  return null;
};

/**
 * Oblige l'utilisateur à cliquer sur un bouton
 * pour que le renouvellement du mot de passe puisse avoir lieu.
 *
 * Empêche les robots qui visitent le lien du mail de consommer le
 * recovery token.
 *
 * @param token: recovery token provenant du mail.
 */
const RecoverLanding = () => {
  const [recovering, setRecovering] = useState<boolean>(false);

  if (recovering) return <Recovery />;
  return (
    <section className="max-w-2xl mx-auto p-5">
      <h2 className="fr-h2 flex justify-center">Changer de mot de passe</h2>
      <p>Vous avez demandé le renouvellement de votre mot de passe.</p>
      <button
        className="fr-btn"
        data-test="Recovering"
        onClick={() => setRecovering(true)}
      >
        Changer de mot de passe
      </button>
    </section>
  );
};

export default RecoverLanding;
