import { getAuthPaths } from '@/api';
import { ENV } from '@/api/environmentVariables';
import { HeaderPropsWithModalState } from '@/app/app/Layout/Header/types';
// import { signInPath, signUpPath } from '@/app/app/paths';
import { useDemoMode } from '@/app/users/demo-mode-support-provider';
import { Button, Checkbox } from '@/ui';

const authPaths = getAuthPaths(ENV.app_url!);

/** liens en "accès rapide" */
// TODO : Modifier le type pour HeaderPropsWithModalState
export const AccesRapide = (props: HeaderPropsWithModalState) => {
  const { user, setModalOpened } = props;
  const { isDemoMode, toggleDemoMode } = useDemoMode();

  return (
    <ul className="flex max-lg:flex-col mb-0">
      {user?.isSupport && (
        <li>
          <Checkbox
            variant="switch"
            label="Mode démo"
            containerClassname="px-6 py-2.5"
            labelClassname="text-primary-9 hover:text-primary-8 text-sm font-bold"
            checked={isDemoMode}
            onChange={toggleDemoMode}
          />
        </li>
      )}
      <li onClick={() => setModalOpened(false)}>
        <Aide />
      </li>
      <li>
        <Button
          data-test="signup"
          className="text-primary-9"
          variant="white"
          size="sm"
          icon="add-circle-line"
          href={authPaths?.signUp}
          prefetch={false}
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
          href={authPaths?.login}
          prefetch={false}
          onClick={() => setModalOpened(false)}
        >
          Se connecter
        </Button>
      </li>
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
