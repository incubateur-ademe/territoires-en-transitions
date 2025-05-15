import { UserDetails } from '@/api/users/user-details.fetch.server';
import { signOutUser } from '@/api/utils/supabase/sign-out-user.server';
import { profilPath } from '@/app/app/paths';
import DropdownFloater from '@/app/ui/shared/floating-ui/DropdownFloater';
import { Button, Icon } from '@/ui';
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
  const { user, setModalOpened } = props;
  const pathname = usePathname();

  if (!user) {
    return null;
  }
  const isUserPath = pathname === profilPath;

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
            href={profilPath}
            className="fr-nav__link"
            data-test="user-profile"
            aria-current={isUserPath ? 'page' : undefined}
          >
            <span className="px-6">Profil</span>
          </Link>
          <Deconnexion />
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
      user: UserDetails;
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
      <Icon
        icon="arrow-down-s-line"
        size="sm"
        className={classNames('ml-2 transition-all', {
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
const Deconnexion = () => {
  return (
    <Link
      className="fr-nav__link"
      style={{ backgroundImage: 'none' }}
      data-test="user-logout"
      onClick={async () => await signOutUser()}
      href="/"
    >
      <span className="px-6">Déconnexion</span>
    </Link>
  );
};
