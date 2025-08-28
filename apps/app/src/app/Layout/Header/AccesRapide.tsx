import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

import { signOutUser } from '@/api/utils/supabase/sign-out-user.server';
import { profilPath, signInPath, signUpPath } from '@/app/app/paths';
import { useDemoMode } from '@/app/users/demo-mode-support-provider';
import { Button, ButtonMenu, Checkbox } from '@/ui';
import { HeaderPropsWithModalState } from './types';

/** liens en "accès rapide" */
export const AccesRapide = (props: HeaderPropsWithModalState) => {
  const { user, setModalOpened } = props;
  const { isDemoMode, toggleDemoMode } = useDemoMode();

  const pathname = usePathname();

  const isUserPath = pathname === profilPath;

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

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
        <Button
          data-test="nav-help"
          variant="white"
          size="sm"
          icon="question-line"
          iconPosition="left"
          href="https://aide.territoiresentransitions.fr/fr/"
          external
        >
          Aide
        </Button>
      </li>
      {user ? (
        <li>
          <ButtonMenu
            data-test="nav-user"
            variant="white"
            size="sm"
            icon={`${user.isSupport ? 'customer-service' : 'account-circle'}-${
              isUserPath ? 'fill' : 'line'
            }`}
            className="max-w-80"
            menuContainerClassName="z-[2000]"
            text={user.prenom}
            withArrow
            openState={{
              isOpen: isUserMenuOpen,
              setIsOpen: setIsUserMenuOpen,
            }}
          >
            <div
              className="flex flex-col text-center"
              onClick={() => {
                setModalOpened(false);
                setIsUserMenuOpen(false);
              }}
            >
              <Link
                href={profilPath}
                data-test="user-profile"
                className="p-3 text-sm hover:!bg-primary-1"
                style={{ backgroundImage: 'none' }}
              >
                Profil
              </Link>
              <div className="h-[1px] bg-grey-4" />
              {/** Bouton déconnexion */}
              <Link
                className="p-3 text-sm hover:!bg-primary-1"
                style={{ backgroundImage: 'none' }}
                data-test="user-logout"
                onClick={async () => await signOutUser()}
                href="/"
              >
                <span className="px-6">Déconnexion</span>
              </Link>
            </div>
          </ButtonMenu>
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
              href={signInPath}
              prefetch={false}
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
