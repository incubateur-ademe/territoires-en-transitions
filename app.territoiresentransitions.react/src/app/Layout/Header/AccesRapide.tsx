import { signInPath, signUpPath } from '@/app/app/paths';
import { Button } from '@/ui';
import MenuUtilisateur from './MenuUtilisateur';
import { HeaderPropsWithModalState } from './types';

/** liens en "accès rapide" */
export const AccesRapide = (props: HeaderPropsWithModalState) => {
  const { user, setModalOpened } = props;

  return (
    <ul className="flex max-lg:flex-col mb-0">
      <li onClick={() => setModalOpened(false)}>
        <Aide />
      </li>
      {user ? (
        <li>
          <MenuUtilisateur {...props} />
        </li>
      ) : (
        <>
          <li>
            <Button
              data-test="signup"
              className="text-primary-9"
              variant="white"
              size="sm"
              icon="add-circle-line"
              href={signUpPath}
              onClick={() => setModalOpened(false)}
            >
              Créer un compte
            </Button>
          </li>
          <li>
            <Button
              data-test="signin"
              className="text-primary-9"
              variant="white"
              size="sm"
              icon="user-line"
              href={signInPath}
              onClick={() => setModalOpened(false)}
            >
              Se connecter
            </Button>
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
  const onClick = async () => {
    // on utilise un bouton avec ouverture explicite du lien pour ne pas
    // utiliser <a target="_blank"> qui empêche de mettre une icône...
    window.open('https://aide.territoiresentransitions.fr/fr/', '_blank');
  };

  return (
    <Button
      data-test="nav-help"
      className="text-primary-9"
      variant="white"
      size="sm"
      icon="question-line"
      onClick={onClick}
    >
      Aide
    </Button>
  );
};
