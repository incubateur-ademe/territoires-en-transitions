import {signInPath, signUpPath} from 'app/paths';
import {useFonctionTracker} from 'core-logic/hooks/useFonctionTracker';
import MenuUtilisateur from './MenuUtilisateur';
import {HeaderPropsWithModalState} from './types';

/** liens en "accès rapide" */
export const AccesRapide = (props: HeaderPropsWithModalState) => {
  const {auth, setModalOpened} = props;
  const {isConnected, user} = auth;

  return (
    <ul className="fr-btns-group">
      <li onClick={() => setModalOpened(false)}>
        <Aide />
      </li>
      {isConnected && user ? (
        <li>
          <MenuUtilisateur {...props} />
        </li>
      ) : (
        <>
          <li>
            <a
              data-test="signup"
              href={signUpPath}
              className="fr-btn fr-icon-add-circle-line"
              onClick={() => setModalOpened(false)}
            >
              Créer un compte
            </a>
          </li>
          <li>
            <a
              data-test="signin"
              href={signInPath}
              className="fr-btn fr-icon-account-line"
              onClick={() => setModalOpened(false)}
            >
              Se connecter
            </a>
          </li>
        </>
      )}
    </ul>
  );
};

/**
 * Ouvre le lien vers le centre d'aide.
 */
const Aide = () => {
  const tracker = useFonctionTracker();

  const onClick = async () => {
    // on utilise un bouton avec ouverture explicite du lien pour ne pas
    // utiliser <a target="_blank"> qui empêche de mettre une icône...
    window.open('https://aide.territoiresentransitions.fr/fr/', '_blank');

    await tracker({fonction: 'aide', action: 'clic'});
  };

  return (
    <button
      data-test="help"
      className="fr-btn fr-fi-question-line"
      onClick={onClick}
    >
      Aide
    </button>
  );
};
