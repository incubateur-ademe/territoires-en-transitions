import {forwardRef, Ref} from 'react';
import {Link, useHistory} from 'react-router-dom';
import classNames from 'classnames';
import {monComptePath, signUpPath} from 'app/paths';
import {TAuthContext, UserData} from 'core-logic/api/auth/AuthProvider';
import DropdownFloater from 'ui/shared/floating-ui/DropdownFloater';
import {HeaderPropsWithModalState} from './types';

/**
 * Affiche le menu associé à l'utilisateur courant
 */
const MenuUtilisateur = (props: HeaderPropsWithModalState) => {
  const {auth, setModalOpened} = props;
  const {user} = auth;
  if (!user) {
    return null;
  }
  return (
    <DropdownFloater
      placement="bottom"
      offsetValue={-12}
      zIndex={2000}
      render={({close}) => (
        <nav>
          <ul
            className="m-0 p-0"
            onClick={() => {
              close();
              setModalOpened(false);
            }}
          >
            <li className="fr-nav__item">
              <Link
                to={monComptePath}
                className="fr-nav__link before:!hidden !shadow-none"
              >
                <span className="px-3">Profil</span>
              </Link>
            </li>
            <li className="fr-nav__item pb-0">
              <Deconnexion auth={auth} />
            </li>
          </ul>
        </nav>
      )}
    >
      <MenuUtilisateurBtn user={user} />
    </DropdownFloater>
  );
};

export default MenuUtilisateur;

/** Bouton permettant d'ouvrir le menu */
const MenuUtilisateurBtn = forwardRef(
  (
    {
      user,
      isOpen,
      ...props
    }: {
      isOpen?: boolean;
      user: UserData;
    },
    ref?: Ref<HTMLDivElement>
  ) => (
    <div ref={ref} {...props}>
      <button
        data-test="connectedMenu"
        className="fr-btn fr-fi-account-line"
        style={{maxWidth: '15rem'}}
      >
        <span className="line-clamp-1">{user.prenom}</span>
        <div
          className={classNames('fr-fi-arrow-down-s-line ml-2 scale-90', {
            'rotate-180': isOpen,
          })}
        />
      </button>
    </div>
  )
);

/**
 * Bouton "Déconnexion"
 */
const Deconnexion = ({auth}: {auth: TAuthContext}) => {
  const history = useHistory();
  return (
    <Link
      className="fr-nav__link !shadow-none"
      data-test="logoutBtn"
      to={signUpPath}
      onClick={() => {
        auth.disconnect().then(() => history.push('/'));
      }}
    >
      <span className="px-3">Déconnexion</span>
    </Link>
  );
};
