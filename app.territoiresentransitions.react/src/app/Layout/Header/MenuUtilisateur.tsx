import { monComptePath } from '@/app/app/paths';
import { TAuthContext, UserData } from '@/app/core-logic/api/auth/AuthProvider';
import DropdownFloater from '@/app/ui/shared/floating-ui/DropdownFloater';
import { Button } from '@/ui';
import classNames from 'classnames';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { forwardRef, Ref } from 'react';
import './MenuUtilisateur.css';
import { HeaderPropsWithModalState } from './types';

/**
 * Affiche le menu associé à l'utilisateur courant
 */
const MenuUtilisateur = (props: HeaderPropsWithModalState) => {
  const { auth, setModalOpened } = props;
  const { user } = auth;
  const pathname = usePathname();

  if (!user) {
    return null;
  }
  const isUserPath = pathname === monComptePath;

  return (
    <DropdownFloater
      placement="bottom"
      offsetValue={0}
      zIndex={2000}
      render={({ close }) => (
        <div
          className="m-0 p-0 user-menu"
          onClick={() => {
            close();
            setModalOpened(false);
          }}
        >
          <Link
            href={monComptePath}
            className="fr-nav__link"
            data-test="user-profile"
            aria-current={isUserPath ? 'page' : undefined}
          >
            <span className="px-6">Profil</span>
          </Link>
          <Deconnexion auth={auth} />
        </div>
      )}
    >
      <MenuUtilisateurBtn user={user} isUserPath={isUserPath} />
    </DropdownFloater>
  );
};

export default MenuUtilisateur;

/** Bouton permettant d'ouvrir le menu */
const MenuUtilisateurBtn = forwardRef(
  (
    {
      user,
      isUserPath,
      isOpen,
      ...props
    }: {
      isOpen?: boolean;
      isUserPath: boolean;
      user: UserData;
    },
    ref?: Ref<HTMLButtonElement>
  ) => (
    <Button
      ref={ref}
      {...props}
      data-test="nav-user"
      variant="white"
      size="sm"
      className={classNames('user-menu text-primary-9 pr-2', {
        'rounded-b-none': isOpen,
      })}
      icon={`${user.isSupport ? 'customer-service' : 'account-circle'}-${
        isUserPath ? 'fill' : 'line'
      }`}
      style={{ maxWidth: '15rem' }}
      aria-expanded={isOpen}
    >
      <span className="line-clamp-1">{user.prenom}</span>
      <i
        className={classNames('fr-fi-arrow-down-s-line ml-2 transition-all', {
          'rotate-180': isOpen,
        })}
      />
    </Button>
  )
);

MenuUtilisateurBtn.displayName = 'MenuUtilisateurBtn';

/**
 * Bouton "Déconnexion"
 */
const Deconnexion = ({ auth }: { auth: TAuthContext }) => {
  return (
    <Link
      className="fr-nav__link"
      style={{ backgroundImage: 'none' }}
      data-test="user-logout"
      href="/sign-out"
    >
      <span className="px-6">Déconnexion</span>
    </Link>
  );
};
