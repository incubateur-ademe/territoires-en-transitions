import {Link, useLocation} from 'react-router-dom';
import {useFonctionTracker} from 'core-logic/hooks/useFonctionTracker';
import {HeaderPropsWithModalState} from './types';
import {allCollectivitesPath, signInPath, signUpPath} from 'app/paths';
import MenuUtilisateur from './MenuUtilisateur';

/** liens en "accès rapide" */
export const AccesRapide = (props: HeaderPropsWithModalState) => {
  const {auth, setModalOpened} = props;
  const {isConnected, user} = auth;
  const {pathname} = useLocation();
  const isAllCollectivitesPath = pathname === allCollectivitesPath;

  return (
    <ul className="fr-btns-group">
      {isConnected && (
        <li>
          <Link
            to={allCollectivitesPath}
            className={`fr-btn fr-icon-seedling-${
              isAllCollectivitesPath ? 'fill' : 'line'
            }`}
            onClick={() => setModalOpened(false)}
          >
            Collectivités
          </Link>
        </li>
      )}
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
            <Link
              data-test="signup"
              to={signUpPath}
              className="fr-btn fr-icon-add-circle-line"
              onClick={() => setModalOpened(false)}
            >
              Créer un compte
            </Link>
          </li>
          <li>
            <Link
              data-test="signin"
              to={signInPath}
              className="fr-btn fr-icon-account-line"
              onClick={() => setModalOpened(false)}
            >
              Se connecter
            </Link>
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
